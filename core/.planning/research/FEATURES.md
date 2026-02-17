# Feature Landscape: Entity Semantics / Knowledge Layer

**Domain:** Semantic enrichment and knowledge layer for a configurable entity data platform
**Researched:** 2026-02-17
**Confidence note:** WebSearch and Context7 were unavailable. Findings are based on: (1) thorough codebase analysis of the existing entity system, (2) the fully-specified project requirements in `.planning/PROJECT.md`, and (3) training data on vector embedding systems, knowledge graph platforms, and semantic metadata standards. Claims about competing systems are LOW confidence. Claims about what must exist for internal consistency are HIGH confidence.

---

## Table Stakes

Features that must exist for the system to be coherent. Missing any of these makes the system incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Semantic type classification on attributes | Without semantic types, the enrichment pipeline cannot generate meaningful text — it doesn't know whether a field is an identifier, a label, a quantity, or a date. Every downstream use of embeddings depends on this. | Medium | Six initial types: `identifier`, `categorical`, `quantitative`, `temporal`, `freetext`, `relational_reference`. Must be extensible — don't hard-code in schema. |
| Natural language description on entity types | The enrichment pipeline needs human-readable context for what an entity *means*. Without this, embeddings reflect data shape, not business meaning. | Low | Attaches to existing `description` field on `EntityTypeEntity` — the field exists but lacks structured semantic intent. Needs an explicit `semantic_definition` separate from user-facing description or a clear convention that `description` serves this purpose. |
| Natural language description on attributes | Attribute names are often short, abbreviated, or domain-specific (e.g. `arr_usd`, `ltv`, `churn_dt`). Without descriptions, the enriched text cannot explain what those values mean. | Low | Stored in the attribute schema. The current `Schema<UUID>` has a `label` field but no `description`. A `semanticDescription` field is needed. |
| Semantic context on relationship definitions | Relationships without semantic labels produce embeddings that say "entity A is linked to entity B." With a label like "Customer is invoiced via Invoice," the embedding carries business meaning. | Low | Attaches to `EntityRelationshipDefinition`. Requires a new optional `semanticContext` string field. |
| Enriched text construction from entity data | The pipeline must build a text string from: entity type semantic definition + each attribute value with its semantic label + relationship summaries. Without this step there is nothing to embed. | High | The text construction strategy directly determines embedding quality. Attribute values must be formatted according to their semantic type (e.g. dates formatted, enums named, references described by related entity's identifier). |
| OpenAI embedding generation (text-embedding-3-small) | Calling the embedding API and receiving a vector. Without this the knowledge layer stores nothing. | Low | Single platform-level `OPENAI_API_KEY`. Error handling for rate limits and API failures is required. |
| pgvector storage of embeddings | The vector must land somewhere retrievable. pgvector in PostgreSQL is the chosen store, keeping infrastructure simple. | Medium | Requires `CREATE EXTENSION vector`, a new `entity_embeddings` table with a `vector(1536)` column (1536 dimensions for text-embedding-3-small), and workspace/entity_type metadata columns for future filtering. |
| Embedding metadata columns | Without metadata, future retrieval cannot filter by workspace, entity type, or semantic category. The embeddings are useless in isolation. | Low | Minimum: `workspace_id`, `entity_id`, `entity_type_id`, `embedded_at`, `embedding_model`, `schema_version`. Optional: `semantic_category`, `related_entity_types[]`. |
| Enrichment triggered on entity create/update | If embeddings are not kept current with entity data, the knowledge layer immediately drifts from reality. | Medium | Uses the queue-based pattern already established by the workflow domain (`execution_queue` table + Temporal dispatcher). A new `enrichment_queue` table follows the same pattern. |
| Enrichment triggered on relationship change | When a relationship is created or deleted, the related entities' enriched text changes. Both the source and target entities must be re-embedded. | Medium | The relationship change event must enqueue both the entity that owns the relationship and the related entity. |
| Queue deduplication | Without deduplication, rapid entity updates would enqueue the same entity dozens of times. The embedding cost per-entity is small but the cumulative cost matters at scale. | Low | Simple: on enqueue, check for an existing `PENDING` record for the same `entity_id`; skip or update timestamp if found. |
| Schema change detection | When an attribute is added, removed, or renamed, the enriched text format changes. All entities of that type need re-embedding. Without detection, stale embeddings accumulate silently. | High | Must compare the entity type's `version` counter at time of embedding against current version. Change detection fires on `EntityTypeService.saveEntityTypeDefinition` when semantic-relevant fields change. |
| Re-embedding job tracking | Without tracking, the user has no visibility into whether re-embedding is in progress, complete, or failed. Particularly important for large workspaces. | Medium | A `schema_migration_jobs` table with status (`PENDING`, `IN_PROGRESS`, `COMPLETE`, `FAILED`), total/completed entity counts, started_at/completed_at timestamps. |
| Re-embedding does not block entity operations | If entity CRUD must wait for re-embedding to complete, the system is unusable during schema changes. | Low | Queue-based approach inherently decouples this. Stale embeddings during re-embedding are acceptable. |
| Activity logging for enrichment operations | The existing audit trail pattern (`ActivityService`) must extend to enrichment events (embed created, re-embed triggered, schema migration job started/completed). | Low | Follows established patterns exactly. |
| Workspace-scoped security on all new endpoints | All new API endpoints follow `@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")`. Without this, the multi-tenant isolation guarantee breaks. | Low | Architecture constraint, not optional. |

---

## Differentiators

Features that go beyond minimum coherence and provide competitive or strategic value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Template system (SaaS Startup, DTC E-commerce, Service Business) | A new user lands on an empty workspace and has to design an entity schema from scratch. This is the highest-friction moment in any configurable data platform. Templates collapse setup from days to minutes — the user gets a complete, semantically-enriched, relationship-connected data model in one action. | High | Templates must bundle: entity type definitions, attribute schemas, relationship definitions, semantic metadata on all of the above, and pre-populated analytical brief descriptions. Three templates means three domain models must be authored and maintained. |
| Pre-configured analytical briefs within templates | Analytical briefs are example questions that work with the template's entity model. They demonstrate value before the user enters any data, building confidence that the system is worth using. | Medium | Briefs are stored as structured text (question + expected entity types + expected attributes). They are not executed at template install time — they are surface-level examples. The milestone goal is 3–5 per template. |
| Example queries that work with <50 records | Forces template design discipline. Templates must include entity types that are queryable with minimal data, not just realistic at scale. This validates that the semantic foundation actually enables retrieval, not just theoretically. | Medium | Requires choosing entity types where relationships are meaningful even with small populations (e.g. a SaaS template where 5 customers and 3 products demonstrate cross-domain querying). |
| Priority-based re-embedding ordering | When a schema change affects 10,000 entities, recently-active entities should be re-embedded first — they are more likely to be queried. Low-priority entities (stale, deleted-then-recovered) can wait. | Medium | Priority field on the enrichment queue. Scoring can be simple: entities updated in the last 7 days get `HIGH`, others get `NORMAL`. |
| Re-embedding progress visibility | The user can see that a schema change is being processed and how many entities remain. This builds trust that the system is working and prevents support requests. | Low | Expose the `schema_migration_jobs` record via a read API endpoint. No WebSocket required — polling is acceptable. |
| Extensible semantic type classifications | The six initial semantic types cover common attribute semantics, but every domain has unusual types (e.g. `geospatial`, `composite_key`, `probabilistic_score`). An extensible enum lets the platform grow without code changes. | Low | Store semantic type as a string with a predefined set of known values, not a database enum. Validation accepts the six standard values plus any non-empty string. |
| Batched re-embedding via child Temporal workflows | Re-embedding 10,000 entities as a single Temporal workflow is fragile — a single failure invalidates everything. Child workflows processing ~100 entities per batch give better resilience: individual batch failures can be retried without restarting the whole job. | High | Requires parent workflow that fans out child workflows, tracks completion counts, and aggregates failure reports. This mirrors patterns used in large-scale Temporal deployments. |

---

## Anti-Features

Things to deliberately NOT build in this milestone. Explicitly documenting these prevents scope creep.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Natural language query interface | Retrieval and reasoning require the embeddings to already exist and be validated. Building query before the knowledge layer is proven inverts the dependency and produces a system with nothing to retrieve. This is explicitly out of scope per PROJECT.md. | Build the embedding foundation first. Retrieval is the next project. |
| Proactive insights / analytical brief execution | Executing analytical briefs (actually running the cross-domain query and surfacing results) requires the query engine and likely LLM chain calling. Neither exists yet. | Store briefs as structured text in templates. Execution is future work. |
| Real-time embedding updates (synchronous) | Synchronous embedding would make every entity save wait on an OpenAI API call (~200–500ms). This would be a 5–10x latency regression on every entity write. | Queue-based near-real-time embedding. Stale embeddings during the write gap are acceptable. |
| Workspace-level API key management | Allowing workspaces to configure their own OpenAI keys adds a secrets management surface, UI complexity, and per-workspace billing complexity. This is not justified at initial scale. | Single platform-level `OPENAI_API_KEY` environment variable. Revisit when workspace-level quotas become a requirement. |
| Custom embedding model support | Supporting multiple embedding providers (Cohere, Anthropic, local models) multiplies testing surface and introduces dimension-mismatch risks (different models produce different vector dimensions, breaking similarity queries across models). | OpenAI text-embedding-3-small only. The model is configurable as a constant in code, making future migration possible without an API surface. |
| Semantic search / vector similarity query endpoint | Vector similarity search requires careful index strategy (HNSW vs IVFFlat in pgvector), recall/precision tuning, and result ranking logic. Building this before the embedding quality is validated is premature. | Let embeddings accumulate. Validate quality manually or via spot-checks. Build search in the retrieval project. |
| Embedding model versioning / migration tooling | If the embedding model changes, all vectors must be recomputed. This is a real operational concern but belongs to a future infrastructure milestone. For now, record `embedding_model` in metadata and treat model change as a manual migration event. | Record model name in `entity_embeddings`. No automated migration tooling in this phase. |
| Automatic semantic type inference | Inferring semantic types from attribute names or values (e.g. "this attribute is named `email` so it must be `identifier`") introduces false positives. Semantic types should be explicitly set by the user, with defaults suggested only by templates. | Templates pre-configure semantic types. Users set them manually on custom attributes. |
| Cross-workspace semantic similarity | Comparing embeddings across workspace boundaries breaks multi-tenant isolation. Even if technically interesting, this is architecturally and legally risky. | Embeddings are workspace-scoped. All queries filter by `workspace_id`. |

---

## Feature Dependencies

```
# Prerequisite chains — each item requires the one above it

Semantic type enum (extensible string) on Schema<UUID>
  → Attribute semantic descriptions (new field in Schema<UUID>)
    → Entity type semantic definitions (description field repurposed or new field)
      → Relationship semantic context (new field on EntityRelationshipDefinition)
        → Enriched text construction (all four inputs needed to build text)
          → OpenAI embedding generation (text is the input)
            → pgvector storage (vector is the output)
              → Embedding metadata storage (enrichment quality depends on metadata)

# Trigger chain

Entity CRUD (existing) → Enrichment queue enqueue → Temporal dispatcher picks up
  → Enriched text construction → Embedding generation → pgvector write → activity log

Schema change detection
  → schema_migration_jobs record created
    → Priority-based queue population (all affected entities)
      → Batched child Temporal workflows (~100 entities each)
        → Per-batch embedding + pgvector write
          → schema_migration_jobs progress update
            → schema_migration_jobs COMPLETE status

# Template dependency chain

Template definition (authored data — entity types + attributes + relationships + semantic metadata)
  → Template install endpoint (workspace-scoped, idempotent)
    → Entity type creation (delegates to EntityTypeService.publishEntityType)
      → Relationship wiring (delegates to EntityTypeRelationshipService)
        → Analytical brief storage (new briefs table or JSONB on workspace/template record)
```

---

## MVP Recommendation

Given that this is a greenfield semantic foundation (not an incremental feature), the MVP must establish the full pipeline end-to-end with a minimal but complete path. A "half pipeline" (metadata without embeddings, or embeddings without triggers) delivers no value.

**Prioritize in this order:**

1. **Semantic metadata model** — Semantic type classification + descriptions on attributes, entity types, relationships. This is the input to everything. Start here because it is pure data model work with no external dependencies.

2. **pgvector extension + entity_embeddings table** — Set up the output store. Infrastructure work with no application dependencies. Can run in parallel with #1.

3. **Enrichment queue and Temporal worker** — Establishes the pipeline plumbing. Wire entity create/update events to the queue. Build the Temporal worker that pulls from queue, constructs enriched text, calls OpenAI, writes to pgvector. This is the core of the milestone.

4. **Schema change detection and re-embedding jobs** — Handles the mutable schema reality of the entity system. Without this, semantic metadata changes accumulate stale embeddings silently.

5. **Template system** — Highest user-facing value. Depends on #1 (semantic metadata model) being stable enough to author against. Three templates, each with full entity types, attributes, relationships, semantic metadata, and 3–5 analytical briefs.

**Defer:**
- Priority-based queue ordering: Deliver NORMAL priority for all initially. Add priority scoring in a follow-up once the queue pattern is proven.
- Batched child Temporal workflows: Start with single Temporal workflow over all affected entities. Move to child workflows once the re-embedding job pattern is validated and the 15-minute SLA is measured against real data.
- Re-embedding progress visibility endpoint: Implement the `schema_migration_jobs` table from the start (it is needed for correctness) but defer the read API endpoint until the UI team requests it.

---

## Sources

- `.planning/PROJECT.md` — Authoritative requirements and constraints (HIGH confidence)
- `.planning/codebase/ARCHITECTURE.md` — Existing system patterns (HIGH confidence)
- `.planning/codebase/STACK.md` — Technology decisions including Temporal and pgvector (HIGH confidence)
- `db/schema/01_tables/entities.sql` — Existing entity/entity_type schema (HIGH confidence)
- `src/main/kotlin/riven/core/models/common/validation/Schema.kt` — Current attribute schema model (HIGH confidence)
- `src/main/kotlin/riven/core/models/entity/configuration/EntityRelationshipDefinition.kt` — Relationship model (HIGH confidence)
- `src/main/kotlin/riven/core/service/workflow/queue/WorkflowExecutionQueueService.kt` — Queue pattern reference (HIGH confidence)
- Training data on vector embedding systems, knowledge graphs, and semantic metadata platforms — complexity and anti-feature rationale (LOW confidence; used only for pattern recognition, not capability claims)
