# Architecture Patterns: Semantic Enrichment and Knowledge Layer

**Domain:** Semantic enrichment pipeline with vector embeddings on an existing Spring Boot/Kotlin/Temporal backend
**Researched:** 2026-02-17
**Confidence:** HIGH — based on direct codebase analysis of established patterns

---

## Recommended Architecture

The knowledge layer is a new `knowledge` domain that sits alongside the existing `entity`, `workflow`, `block`, `workspace`, and `user` domains. It consumes events from the entity domain and produces enriched embeddings stored in pgvector. It does not replace or alter the core entity data path — it runs asynchronously behind it.

```
[Entity Mutation (create/update/delete/relationship change)]
           │
           ▼
[EntityService / EntityRelationshipService]
    │  (after successful save, before return)
    │
    ▼
[EnrichmentQueueService.enqueue()]
    (writes PENDING row to entity_enrichment_queue)
           │
           ▼ (scheduled, ShedLock, FOR UPDATE SKIP LOCKED)
[EnrichmentDispatcherService]
    │  claims batch → dispatches each item
    ▼
[Temporal: EnrichmentWorkflow (per-entity)]
    └─ Activity: EnrichmentCoordinationActivity
           ├─ 1. Load entity + entity type (with semantic metadata)
           ├─ 2. Build enriched text (SemanticTextBuilderService)
           ├─ 3. Call OpenAI embeddings API (EmbeddingClientService)
           └─ 4. Upsert into entity_embeddings (pgvector)

[Schema Change Path]
[EntityTypeService.saveEntityTypeDefinition()]
    │ (on schema change detected)
    ▼
[SchemaMigrationJobService]
    └─ Creates SchemaMigrationJob → spawns ReBatchingWorkflow
         └─ Enqueues affected entities into entity_enrichment_queue
              with priority=BATCH
         └─ Entities are dispatched via the same round-robin dispatcher
              (NORMAL priority items dispatch first within each workspace)
```

---

## Component Boundaries

### knowledge domain — new components

| Component | Package | Responsibility | Communicates With |
|-----------|---------|---------------|-------------------|
| `EntitySemanticMetadataService` | `service.knowledge` | CRUD for semantic metadata on entity types, attributes, relationships. No embedding logic. | `EntityTypeService` (read), `EntitySemanticMetadataRepository` |
| `EntityTypeTemplateService` | `service.knowledge` | Installs pre-configured entity type schemas + semantic metadata in one transaction. | `EntityTypeService`, `EntitySemanticMetadataService` |
| `EnrichmentQueueService` | `service.knowledge.queue` | Enqueues enrichment requests (PENDING rows). Status transitions (claim, dispatch, complete, fail). Mirrors `WorkflowExecutionQueueService` exactly. | `EnrichmentQueueRepository` |
| `EnrichmentDispatcherService` | `service.knowledge.queue` | `@Scheduled` + `@SchedulerLock` loop. Claims batches round-robin across workspaces (not FIFO). Enforces per-workspace concurrency cap (configurable, default 10). Within each workspace's share, dispatches `NORMAL` priority before `BATCH`. Uses `FOR UPDATE SKIP LOCKED`. Dispatches each item to Temporal. | `EnrichmentQueueService`, `WorkflowClient` |
| `EnrichmentQueueProcessorService` | `service.knowledge.queue` | `REQUIRES_NEW` transaction per item. Constructs `WorkflowClient` stub, starts `EnrichmentWorkflow`. Mirrors `WorkflowExecutionQueueProcessorService`. | `WorkflowClient`, `EnrichmentQueueService` |
| `SemanticTextBuilderService` | `service.knowledge.enrichment` | Constructs the enriched natural language text for an entity from: entity type semantic definition, attribute values with semantic labels, relationship context. Applies configurable token budget (~7,500 tokens) with priority truncation: entity type definition → identifier → high-signal attributes → relationships → remaining. Returns text + `truncated` flag. Pure transformation — no I/O. | `EntitySemanticMetadataService` |
| `EmbeddingClientService` | `service.knowledge.enrichment` | Calls OpenAI `text-embedding-3-small` API via Spring `WebClient`. Handles retries, rate limits. Returns `FloatArray` (1536 dimensions). | OpenAI REST API |
| `EntityEmbeddingService` | `service.knowledge.enrichment` | Upserts embedding + metadata into `entity_embeddings`. Handles conflict resolution (same entity, re-embed replaces). | `EntityEmbeddingRepository` |
| `EnrichmentCoordinationActivity` | `service.knowledge.enrichment` | Temporal `@ActivityInterface` implementation. Orchestrates steps 1–4 for one entity. Spring bean — has full dependency injection. | `SemanticTextBuilderService`, `EmbeddingClientService`, `EntityEmbeddingService` |
| `EnrichmentWorkflowImpl` | `service.knowledge.enrichment` | Temporal `@WorkflowInterface` implementation. NOT a Spring bean. Registered via `WorkerFactory`. Delegates to `EnrichmentCoordinationActivity`. | `EnrichmentCoordinationActivity` (via Temporal activity stub) |
| `SchemaMigrationJobService` | `service.knowledge.schema` | Creates and tracks `schema_migration_jobs` records. Progress tracking via queue completion callbacks instead of Temporal child workflow signals. | `SchemaMigrationJobRepository`, `WorkflowClient` |
| `ReBatchingWorkflowImpl` | `service.knowledge.schema` | Temporal workflow for schema change re-embedding. Enqueues affected entities into `entity_enrichment_queue` with `BATCH` priority instead of spawning child workflows directly. | `EnrichmentQueueService` (via Temporal activity) |
| `KnowledgeController` | `controller.knowledge` | REST endpoints for semantic metadata CRUD, template installation, manual re-embed triggers, migration job status. | `EntitySemanticMetadataService`, `EntityTypeTemplateService`, `SchemaMigrationJobService` |

### entity domain — modifications (not new components)

| Component | Change |
|-----------|--------|
| `EntityService` | After `save()` returns, call `enrichmentQueueService.enqueue(entityId, workspaceId, ENTITY_MUTATION)`. No change to core save logic. |
| `EntityRelationshipService` | After relationship save/delete, call `enrichmentQueueService.enqueue(sourceEntityId, ...)` and `enqueue(targetEntityId, ...)`. Both sides re-embed because relationship context changes. |
| `EntityTypeService` | After schema write, call `schemaMigrationJobService.createJob(entityTypeId, workspaceId)` if semantic metadata exists and schema changed. |
| `EntityTypeEntity` | No new columns. Semantic metadata lives in a separate `entity_type_semantic_metadata` table. FK to `entity_types.id`. |

---

## Data Flow: Entity Mutation to Stored Embedding

```
Step 1: Entity mutation completes
  EntityService.updateEntity() saves the entity row
  → still in the same @Transactional method

Step 2: Enqueue enrichment (same transaction)
  enrichmentQueueService.enqueue(entityId, workspaceId, triggerType)
  → inserts row into entity_enrichment_queue (status=PENDING)
  → transaction commits — both entity row and queue row persisted atomically

Step 3: Scheduled dispatcher runs (every 5s, ShedLock)
  EnrichmentDispatcherService.processQueue()
  → Round-robin claim across workspaces:
    1. SELECT DISTINCT workspace_id FROM entity_enrichment_queue WHERE status = 'PENDING'
    2. For each workspace: check count of CLAIMED/IN_PROGRESS items (skip if at per-workspace concurrency cap, default 10)
    3. Claim batchSize/workspaceCount items per workspace, ordered by priority ASC (NORMAL before BATCH), then created_at ASC
    4. SELECT ... FOR UPDATE SKIP LOCKED → status=CLAIMED
  → for each item: EnrichmentQueueProcessorService.processItem() [REQUIRES_NEW]

Step 4: Temporal workflow started
  WorkflowClient.start(EnrichmentWorkflow, {entityId, workspaceId})
  → queue item status → DISPATCHED

Step 5: Temporal activity executes (EnrichmentCoordinationActivity)
  5a. Load entity from EntityRepository (by entityId)
  5b. Load EntityTypeEntity + semantic metadata (by entity.typeId)
  5c. SemanticTextBuilderService.buildText(entity, entityType, semanticMetadata)
      → builds sections in priority order (entity type def → identifier → high-signal attributes → relationships → remaining)
      → tracks token budget (~7,500), stops adding sections when budget exhausted
      → returns enriched text string + truncated flag
  5d. EmbeddingClientService.embed(enrichedText)
      → POST to OpenAI API → FloatArray[1536]
  5e. EntityEmbeddingService.upsert(entityId, workspaceId, embedding, metadata, truncated)
      → INSERT INTO entity_embeddings ... ON CONFLICT (entity_id) DO UPDATE (includes truncated flag)

Step 6: Queue item completed
  EnrichmentCoordinationActivity marks queue item COMPLETED on success
```

---

## Database Schema

### pgvector extension

Register in `db/schema/00_extensions/extensions.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### entity_type_semantic_metadata table

Separate table from `entity_types`. FK relationship. Avoids touching the existing entity type schema and maintains the "semantic metadata is optional" invariant cleanly.

```sql
CREATE TABLE IF NOT EXISTS public.entity_type_semantic_metadata (
    "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "entity_type_id"  UUID NOT NULL REFERENCES entity_types(id) ON DELETE CASCADE,
    "workspace_id"    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Semantic description of what this entity type represents
    "semantic_definition"  TEXT NOT NULL,

    -- Attribute-level semantic metadata stored as JSONB
    -- Array of: {attributeId, semanticType, description}
    "attribute_semantics"  JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Relationship-level semantic context stored as JSONB
    -- Array of: {relationshipFieldId, semanticContext}
    "relationship_semantics" JSONB NOT NULL DEFAULT '[]'::jsonb,

    "created_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by"      UUID REFERENCES users(id) ON DELETE SET NULL,
    "updated_by"      UUID REFERENCES users(id) ON DELETE SET NULL,

    UNIQUE (entity_type_id)
);
```

**Why separate table:** Semantic metadata is optional (entity types can exist without it). Embedding the fields into `entity_types` would add nullable columns to a central hot table and complicate the EntityTypeEntity data class. The FK `ON DELETE CASCADE` ensures automatic cleanup. The `UNIQUE (entity_type_id)` enforces one-to-one.

**Why JSONB for attribute/relationship semantics:** Attribute definitions are already stored as JSONB in `entity_types.schema`. Mirroring that pattern avoids a proliferating join table (one row per attribute semantic) and keeps reads simple — one join to get all semantic context for a type.

### entity_embeddings table (pgvector)

```sql
CREATE TABLE IF NOT EXISTS public.entity_embeddings (
    "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "entity_id"       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    "workspace_id"    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    "entity_type_id"  UUID NOT NULL REFERENCES entity_types(id) ON DELETE CASCADE,
    "entity_type_key" TEXT NOT NULL,

    -- The embedding vector (text-embedding-3-small = 1536 dimensions)
    "embedding"       vector(1536) NOT NULL,

    -- The enriched text that was embedded (for debugging and re-embed detection)
    "enriched_text"   TEXT NOT NULL,

    -- Metadata for filtering (avoids loading full entity for pre-filter)
    "semantic_categories" TEXT[] DEFAULT '{}',
    "related_entity_type_keys" TEXT[] DEFAULT '{}',

    "truncated"       BOOLEAN NOT NULL DEFAULT false,  -- true when enriched text was truncated due to token budget

    "embedded_at"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "embedding_model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "embedding_version" INTEGER NOT NULL DEFAULT 1,

    UNIQUE (entity_id)
);
```

**Why separate table (not a column on `entities`):** The `entities` table is the hot path for all entity CRUD. Adding a `vector(1536)` column to it makes every entity query load 6KB of embedding data. Separate table means the embedding is only fetched when needed for semantic queries. The `UNIQUE (entity_id)` makes upsert semantics clean — one embedding per entity, updated in-place on re-embed.

**Why not a dedicated vector database:** The project constraint is PostgreSQL-only. pgvector is sufficient for initial scale. The embedding table will have one row per entity; at 100K entities that is ~600MB of vector data, well within PostgreSQL range.

### pgvector index design

```sql
-- HNSW index for approximate nearest neighbor search
-- HNSW preferred over IVFFlat: no training step required, better recall,
-- works on any dataset size without specifying list count upfront.
CREATE INDEX IF NOT EXISTS idx_entity_embeddings_vector_hnsw
    ON public.entity_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Composite index for workspace-scoped queries (pre-filter before ANN)
CREATE INDEX IF NOT EXISTS idx_entity_embeddings_workspace
    ON public.entity_embeddings (workspace_id, entity_type_id);
```

**HNSW over IVFFlat:** IVFFlat requires `VACUUM ANALYZE` and specifying `lists` count upfront (rule of thumb: `sqrt(rows)`). For a growing dataset this means periodic maintenance. HNSW builds incrementally and has better recall at standard ef_search values. Use `m=16, ef_construction=64` as conservative defaults — increase if recall needs improvement.

**Cosine similarity:** OpenAI `text-embedding-3-small` is trained for cosine similarity. Use `vector_cosine_ops`. Do not use L2 distance with these embeddings.

**Pre-filtering pattern:** Always filter by `workspace_id` before the ANN search. This is a hard requirement for multi-tenancy isolation. Query pattern:

```sql
SELECT entity_id, embedding <=> $query_vector AS distance
FROM entity_embeddings
WHERE workspace_id = $workspace_id
  AND entity_type_id = ANY($type_filter)
ORDER BY distance
LIMIT 20;
```

### entity_enrichment_queue table

Mirrors `workflow_execution_queue` exactly. PENDING → CLAIMED → DISPATCHED / FAILED.

```sql
CREATE TABLE IF NOT EXISTS public.entity_enrichment_queue (
    "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "workspace_id"    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    "entity_id"       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    "trigger_type"    TEXT NOT NULL,  -- ENTITY_CREATE, ENTITY_UPDATE, RELATIONSHIP_CHANGE, SCHEMA_CHANGE, MANUAL
    "priority"        TEXT NOT NULL DEFAULT 'NORMAL',  -- NORMAL (entity mutations), BATCH (schema re-embedding)
    "status"          TEXT NOT NULL DEFAULT 'PENDING',
    "created_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed_at"      TIMESTAMPTZ,
    "dispatched_at"   TIMESTAMPTZ,
    "completed_at"    TIMESTAMPTZ,
    "attempts"        INTEGER NOT NULL DEFAULT 0,
    "last_error"      TEXT,

    INDEX idx_enrichment_queue_workspace (workspace_id, status, priority)
);
```

**Deduplication:** An entity may be mutated multiple times before the queue processor runs. Use `INSERT ... ON CONFLICT (entity_id) WHERE status = 'PENDING' DO NOTHING` or check for existing PENDING row before inserting. The embedding is idempotent — re-embedding the same entity twice produces the same result, so duplicate processing is safe but wasteful.

### schema_migration_jobs table

```sql
CREATE TABLE IF NOT EXISTS public.schema_migration_jobs (
    "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "workspace_id"    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    "entity_type_id"  UUID NOT NULL REFERENCES entity_types(id) ON DELETE CASCADE,
    "status"          TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, RUNNING, COMPLETED, FAILED
    "total_entities"  INTEGER NOT NULL DEFAULT 0,
    "completed_entities" INTEGER NOT NULL DEFAULT 0,
    "failed_entities" INTEGER NOT NULL DEFAULT 0,
    "temporal_workflow_id" TEXT,
    "created_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at"      TIMESTAMPTZ,
    "completed_at"    TIMESTAMPTZ,
    "error"           TEXT
);
```

---

## Temporal Workflow Design

### Per-entity enrichment workflow (happy path)

```
EnrichmentWorkflow.embed(entityId, workspaceId)
  └─ Activity: EnrichmentCoordinationActivity.enrichEntity(entityId, workspaceId)
       ├─ timeout: 60s (OpenAI call can be slow)
       ├─ retries: 3, backoff 2x, max 30s
       ├─ do-not-retry: ENTITY_NOT_FOUND, SEMANTIC_METADATA_NOT_FOUND
       └─ returns: EmbeddingResult (entityId, dimensions, embeddedAt)
```

**Single activity:** Unlike the workflow domain's `WorkflowCoordinationActivity` which is complex, the enrichment activity is a simple sequential pipeline. One activity is sufficient — no need for separate activities per step.

**Temporal workflow ID:** Use `enrichment-{entityId}` for deduplication. If the same entity is enqueued twice before the first workflow completes, Temporal rejects the second start with `WorkflowExecutionAlreadyStarted`. This is the correct behavior — the in-flight workflow will embed the latest state when it runs (it reads from DB at execution time, not from the queue payload).

### Batch re-embedding workflow (schema change path)

```
ReBatchingWorkflow.reembed(migrationJobId, entityTypeId, workspaceId)
  └─ Activity: EnqueueBatchActivity.enqueueAffectedEntities(entityTypeId, workspaceId)
       → queries affected entity IDs
       → enqueues each into entity_enrichment_queue with priority=BATCH
  └─ Activity: MigrationProgressActivity.trackCompletion(migrationJobId)
       → monitors queue completion callbacks for progress updates
```

**Queue-based fan-out over child workflows:** Instead of spawning Temporal child workflows per batch, `ReBatchingWorkflow` enqueues affected entities into the shared `entity_enrichment_queue` with `BATCH` priority. This creates a single dispatch path for all embedding work (mutations and re-embedding), and workspace-fair round-robin + per-workspace concurrency caps apply uniformly. `NORMAL` priority items (entity mutations) always dispatch before `BATCH` items within each workspace's share, ensuring real-time operations are never starved.

**Progress tracking:** `SchemaMigrationJobService` tracks progress via queue completion callbacks rather than Temporal child workflow signals. The `schema_migration_jobs` record is updated as queue items for the relevant entity type complete.

---

## Patterns to Follow

### Pattern 1: Queue Trigger from Service Method

The enrichment queue is populated from within the entity service methods — after the entity is saved but before returning to the controller. The enqueue call is in the same `@Transactional` scope as the save, ensuring atomicity: if the save fails, the queue entry is also rolled back.

```kotlin
@Transactional
fun updateEntity(workspaceId: UUID, entityId: UUID, request: UpdateEntityRequest): Entity {
    val entity = ServiceUtil.findOrThrow { entityRepository.findByIdAndWorkspaceId(entityId, workspaceId) }
    // ... apply updates, save ...
    val saved = entityRepository.save(updated)

    // Enqueue for enrichment — same transaction, atomically committed with entity row
    enrichmentQueueService.enqueue(saved.id!!, workspaceId, EnrichmentTriggerType.ENTITY_UPDATE)

    return saved.toModel()
}
```

**Why same transaction:** If the enqueue were in a separate transaction and the entity save succeeded but the enqueue failed (network blip, constraint violation), the entity would be updated but never re-embedded. Atomicity prevents this divergence.

### Pattern 2: Dispatcher Uses Existing ShedLock Infrastructure

The `EnrichmentDispatcherService` reuses the same `@EnableSchedulerLock` / `JdbcTemplateLockProvider` bean already configured in `ShedLockConfiguration`. No new infrastructure needed.

```kotlin
@Service
@ConditionalOnProperty(name = ["riven.knowledge.enrichment.enabled"], havingValue = "true", matchIfMissing = true)
class EnrichmentDispatcherService(...) {

    @Scheduled(fixedDelay = 5000)
    @SchedulerLock(name = "processEnrichmentQueue", lockAtMostFor = "4m", lockAtLeastFor = "10s")
    fun processQueue() { ... }
}
```

Enable/disable via `riven.knowledge.enrichment.enabled` property — mirrors `riven.workflow.engine.enabled`.

### Pattern 3: Temporal Worker Registration for Enrichment

Register `EnrichmentWorkflowImpl` on the existing `WORKFLOWS_DEFAULT_QUEUE` worker in `TemporalWorkerConfiguration`. Do not create a new worker or new queue for V1.

```kotlin
// In TemporalWorkerConfiguration.workerFactory()
worker.registerWorkflowImplementationFactory(
    EnrichmentWorkflow::class.java
) {
    EnrichmentWorkflowImpl()  // no-arg, Temporal manages lifecycle
}
worker.registerActivitiesImplementations(
    coordinationActivity,
    completionActivity,
    enrichmentCoordinationActivity  // NEW: add to existing worker
)
```

**Same queue, separate workflow type:** Temporal distinguishes workflow types by interface name, not queue. Using the same queue avoids the overhead of a new worker thread pool for V1.

### Pattern 4: Semantic Metadata as Layered Enrichment on Existing Schema

Semantic metadata does NOT modify the `entity_types.schema` JSONB column. It lives in `entity_type_semantic_metadata` as a separate table. This means:

- Existing `EntityTypeEntity`, `EntityTypeService`, and all entity CRUD continue to work unchanged
- Semantic metadata can be added/removed without touching the entity type record
- The `EntitySemanticMetadataService` is the sole writer to `entity_type_semantic_metadata`

The `EntityTypeService.saveEntityTypeDefinition()` method triggers schema change detection by comparing the new schema against the old schema (existing logic) and, if semantic metadata exists and attributes changed, calling `schemaMigrationJobService.createJob(...)`.

### Pattern 5: Text Construction Strategy

The enriched text sent to OpenAI follows a structured template. The `SemanticTextBuilderService` produces:

```
Entity type: {semantic_definition}

Identifier: {identifier_attribute_value}

Attributes:
- {attribute_display_name} ({semantic_type}): {value}
- {attribute_display_name} ({semantic_type}): {value}
...

Relationships:
- {relationship_semantic_context}: {related_entity_identifier}
...
```

**Rationale:** Structured text with semantic labels performs better with embedding models than raw data. The semantic type labels (`categorical`, `quantitative`, `temporal`, etc.) provide context that raw values lack. The semantic definition grounds the entire embedding in business meaning.

**Null handling:** Attributes with null values are omitted from the text. Relationships with no related entities produce no relationship section. The enriched text always includes at minimum the identifier value and semantic definition.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Synchronous Embedding in the Entity Save Path

**What goes wrong:** Calling OpenAI synchronously inside `EntityService.save()` adds 200–2000ms latency to every entity mutation.
**Why bad:** Entity saves become dependent on OpenAI availability. A rate limit or API outage blocks all entity writes.
**Instead:** Always enqueue and process asynchronously. The queue decouples entity writes from embedding generation.

### Anti-Pattern 2: Embedding Column on the entities Table

**What goes wrong:** `ALTER TABLE entities ADD COLUMN embedding vector(1536)` puts 6KB of float data on the hot entity row.
**Why bad:** Every entity query (pagination, attribute filtering, listing) loads 6KB of embedding data per row, even when embeddings are not needed. Table bloat dramatically slows sequential scans and page loads.
**Instead:** Separate `entity_embeddings` table with FK to `entities`. Zero impact on entity read performance.

### Anti-Pattern 3: Inlining Semantic Metadata Fields into EntityTypeEntity

**What goes wrong:** Adding `semanticDefinition: String?`, `attributeSemantics: List<...>?` to `EntityTypeEntity` or its `schema` JSONB.
**Why bad:** The entity type schema is already complex. Adding optional semantic fields to the JPA entity muddies the boundary between schema definition and semantic enrichment. Every test for `EntityTypeService` must handle the new fields.
**Instead:** Separate JPA entity `EntityTypeSemanticMetadataEntity` in `entity.knowledge`, separate repository, separate service.

### Anti-Pattern 4: Using Temporal Signals or Timers for Queue Triggering

**What goes wrong:** Attempting to use Temporal's timer/signal mechanism to trigger enrichment from entity mutations.
**Why bad:** This requires entity services to have a Temporal client dependency, and couples enrichment lifecycle to Temporal's workflow engine visibility. The existing queue-based pattern (DB table + scheduled poller) is already proven in this codebase for exactly this purpose.
**Instead:** Follow the `entity_enrichment_queue` + `EnrichmentDispatcherService` pattern exactly as the workflow queue does.

### Anti-Pattern 5: One Temporal Workflow per Schema Migration (unbounded fan-out)

**What goes wrong:** Creating one `EnrichmentWorkflow` per entity directly from `EntityTypeService` when schema changes, without batching.
**Why bad:** 10,000 entity types triggers 10,000 Temporal workflow starts simultaneously. Temporal's scheduler can handle this, but the OpenAI rate limiter cannot. Uncontrolled parallelism causes cascade failures.
**Instead:** `ReBatchingWorkflow` fans out in controlled batches of 100, with the parent workflow tracking progress and respecting OpenAI rate limits.

---

## Scalability Considerations

| Concern | At 1K entities | At 100K entities | At 1M entities |
|---------|---------------|-----------------|----------------|
| Embedding storage | ~6MB (manageable) | ~600MB (fine in PG) | ~6GB (consider partitioning) |
| HNSW index build time | Seconds | Minutes | Hours — partition by workspace |
| Queue throughput | 5s poll, 10 items/batch | Same — add more workers | Increase batch size, add workers |
| OpenAI rate limits | text-embedding-3-small: 1M tokens/min | ~500 entities/min sustained | Need token bucket / backpressure |
| Schema migration (1K entities) | ~60s (well within 15min SLA) | N/A (per-type) | N/A (per-type) |
| Workspace isolation | All in one table, workspace_id filter | Same — HNSW pre-filter by workspace | Partition by workspace or workspace_id range |

**Critical for V1:** The HNSW index should be created CONCURRENTLY in production to avoid locking:
```sql
CREATE INDEX CONCURRENTLY idx_entity_embeddings_vector_hnsw ...
```

---

## Build Order (Phase Dependencies)

The components have hard dependencies that dictate build order:

```
Phase 1: Foundation
  ├─ pgvector extension registration
  ├─ entity_type_semantic_metadata table
  ├─ EntityTypeSemanticMetadataEntity + EntitySemanticMetadataService
  └─ KnowledgeController (semantic metadata CRUD endpoints)
  [Nothing downstream depends on this existing — safe to ship alone]

Phase 2: Template System
  ├─ Template definitions (data classes, JSONB schemas)
  ├─ EntityTypeTemplateService (creates entity types + semantic metadata)
  └─ Template install endpoint in KnowledgeController
  [Depends on Phase 1: needs EntitySemanticMetadataService]

Phase 3: Enrichment Pipeline
  ├─ entity_enrichment_queue table
  ├─ EnrichmentQueueService (queue management)
  ├─ EmbeddingClientService (OpenAI HTTP client)
  ├─ SemanticTextBuilderService (text construction)
  ├─ entity_embeddings table + HNSW index
  ├─ EntityEmbeddingService (pgvector upsert)
  ├─ EnrichmentCoordinationActivity (Temporal activity)
  ├─ EnrichmentWorkflowImpl (Temporal workflow)
  ├─ EnrichmentQueueProcessorService + EnrichmentDispatcherService
  └─ Hook entity mutations to enqueue (EntityService, EntityRelationshipService)
  [Depends on Phase 1: needs semantic metadata for text construction]
  [Depends on Phase 2: templates produce entities to embed]

Phase 4: Schema Change Re-embedding
  ├─ schema_migration_jobs table
  ├─ SchemaMigrationJobService (with queue completion callback progress tracking)
  ├─ ReBatchingWorkflowImpl (enqueues to entity_enrichment_queue with BATCH priority)
  ├─ EnqueueBatchActivity + MigrationProgressActivity
  └─ Schema change detection hook in EntityTypeService
  └─ Migration job status endpoint in KnowledgeController
  [Depends on Phase 3: re-embedding uses entity_enrichment_queue + EnrichmentDispatcherService]
```

**Why this order:** Phase 1 is entirely additive — no existing code changes. Phase 2 (templates) can be shipped before the pipeline exists; templates create entity types and semantic metadata, and the enrichment queue picks them up when Phase 3 is deployed. Phase 3 is the core infrastructure. Phase 4 requires Phase 3's `EnrichmentWorkflow` as a child workflow target.

---

## How knowledge Domain Fits Alongside Existing Domains

```
Existing domains (unchanged internal logic):
├─ block/       — content system, no interaction with knowledge
├─ workflow/    — DAG automation, no interaction with knowledge
├─ workspace/   — multi-tenancy, knowledge reads workspace for scoping
├─ user/        — auth, knowledge reads userId from auth token
└─ entity/      — ← PRIMARY INTERACTION
    EntityService           → enrichmentQueueService.enqueue() [NEW call, same tx]
    EntityRelationshipService → enrichmentQueueService.enqueue() [NEW call, same tx]
    EntityTypeService        → schemaMigrationJobService.createJob() [NEW call, conditional]

New domain:
└─ knowledge/   — new package hierarchy
    controller.knowledge/
    service.knowledge/
    service.knowledge.queue/
    service.knowledge.enrichment/
    service.knowledge.schema/
    repository.knowledge/
    entity.knowledge/
    models.knowledge/
    enums.knowledge/
```

The knowledge domain has a **one-way dependency** on the entity domain: knowledge reads entity data, but entity services have a compile-time dependency on `EnrichmentQueueService`. This is the same cross-domain service injection pattern used elsewhere (e.g., `WorkflowDefinitionService` injecting `ActivityService`).

The entity domain does NOT depend on the knowledge domain's embedding or Temporal workflow implementation — only on `EnrichmentQueueService`, which is a simple DB-write service. This keeps the coupling minimal and testable: `EntityService` tests mock `EnrichmentQueueService` the same way they mock any other dependency.

---

## Sources

- Direct codebase analysis: `WorkflowExecutionDispatcherService`, `WorkflowExecutionQueueService`, `WorkflowExecutionQueueProcessorService`, `TemporalWorkerConfiguration`, `WorkflowOrchestrationService`, `WorkflowCoordinationService`, `ShedLockConfiguration` — confidence HIGH
- `EntityTypeEntity`, `entities.sql`, `ExecutionQueueEntity` — codebase analysis — confidence HIGH
- pgvector HNSW vs IVFFlat tradeoffs — knowledge cutoff January 2025 — confidence MEDIUM (verify current pgvector version on target PostgreSQL)
- OpenAI `text-embedding-3-small` dimension count (1536) and cosine similarity recommendation — knowledge cutoff January 2025 — confidence MEDIUM (verify API docs before implementation)
- Temporal child workflow fan-out pattern for batch processing — knowledge cutoff January 2025 — confidence MEDIUM (verify against Temporal SDK version in use: `io.temporal:temporal-sdk:1.24.1`)
