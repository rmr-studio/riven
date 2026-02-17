# Project Research Summary

**Project:** Riven Knowledge Layer — Entity Semantic Enrichment + Vector Embeddings
**Domain:** Semantic enrichment pipeline with pgvector storage on an existing Spring Boot/Kotlin/Temporal backend
**Researched:** 2026-02-17
**Confidence:** HIGH (stack and architecture based on direct codebase analysis; pitfalls and features based on internal consistency reasoning)

## Executive Summary

This project adds a semantic enrichment and vector embedding layer to an existing, well-structured entity data platform. The approach is greenfield within an established codebase: a new `knowledge` domain is grafted onto the existing `entity`, `workflow`, and `workspace` domains using patterns already proven in production. The core pipeline is: entity mutations enqueue enrichment requests via a PostgreSQL queue table, a ShedLock-guarded scheduler dispatches them to Temporal workflows, which call the OpenAI `text-embedding-3-small` API and store the resulting 1536-dimensional vectors in a pgvector-backed `entity_embeddings` table. The entire pattern mirrors the existing `workflow_execution_queue` + `WorkflowExecutionDispatcherService` infrastructure already in production.

The recommended approach is to build in four phases with hard dependency ordering: (1) semantic metadata model on entity types and attributes as the foundational input, (2) template system to provide semantically-enriched starting schemas, (3) the enrichment pipeline itself (queue, Temporal workflow, OpenAI client, pgvector storage), and (4) schema change detection and batch re-embedding. No phase delivers user-visible value in isolation — a "half pipeline" (metadata without embeddings, or embeddings without triggers) provides nothing. The template system is an exception: it can ship before the enrichment pipeline as an entity-type scaffolding tool, but the semantic definitions it configures become valuable only when Phase 3 runs against the resulting entities.

The primary risks are correctness risks, not infrastructure risks. The enrichment quality depends entirely on how the semantic metadata is authored and how the enriched text is constructed — raw field-value serialization produces low-quality embeddings that undermine the entire knowledge layer. The second major risk is multi-tenancy correctness: vector similarity queries must always pre-filter by `workspace_id` before the approximate nearest-neighbor search, or the system leaks cross-workspace data. Both risks are addressed by patterns already specified in the research — they require discipline in implementation, not new technology.

---

## Key Findings

### Recommended Stack

The stack requires exactly one new Maven dependency (`com.pgvector:pgvector:0.1.6`) on top of the existing Spring Boot 3.5.3 / Kotlin 2.1.21 / Temporal / PostgreSQL stack. All other capabilities — HTTP calls to OpenAI (WebClient), JSONB metadata storage (Hypersistence), queue scheduling (ShedLock + `@Scheduled`), and workflow orchestration (Temporal SDK 1.24.1) — are already present and should be reused with no modification.

**Core technologies:**
- `com.pgvector:pgvector:0.1.6` — Hibernate `UserType` for `vector(N)` columns — the only JVM library for pgvector, maintained by the pgvector team. Verify version at Maven Central before adding.
- `vector` PostgreSQL extension — pre-installed on Supabase. Requires only `CREATE EXTENSION IF NOT EXISTS vector;` in `db/schema/00_extensions/extensions.sql`.
- Spring WebClient (existing) — thin wrapper for OpenAI Embeddings API. Do NOT add `openai-java` SDK; it duplicates WebClient and pulls unnecessary dependencies.
- Temporal SDK 1.24.1 (existing) — `EnrichmentWorkflow` registered on existing `WORKFLOWS_DEFAULT_QUEUE`. No new workers or queues for V1.
- ShedLock 7.5.0 (existing) — `EnrichmentDispatcherService` uses the same `JdbcTemplateLockProvider` bean already configured in `ShedLockConfiguration`.
- `ankane/pgvector:pg16` Docker image — required for Testcontainers integration tests. The default `postgres:16` image does NOT include the pgvector extension.

One new environment variable is required: `OPENAI_API_KEY`. It must never appear in Temporal activity inputs, domain models, or HTTP client debug logs. Inject it from a `@ConfigurationProperties` class exclusively within the service layer.

### Expected Features

The feature set is fully specified by `PROJECT.md`. Research validates internal consistency and identifies the dependency chain. There is no ambiguity about what must be built — the question is ordering and scope discipline.

**Must have (table stakes):**
- Semantic type classification on attributes (six types: `identifier`, `categorical`, `quantitative`, `temporal`, `freetext`, `relational_reference`) — the pipeline cannot construct meaningful enriched text without this.
- Semantic definition on entity types and natural language descriptions on attributes — business meaning cannot be encoded in embeddings without explicit human-authored context.
- Semantic context labels on relationship definitions — relationship embeddings carry business meaning only with semantic labels, not raw FK references.
- Enriched text construction from entity data using semantic metadata — the quality of this step directly determines all downstream embedding quality.
- OpenAI `text-embedding-3-small` embedding generation (1536 dimensions, cosine similarity).
- pgvector storage in `entity_embeddings` table with HNSW index, one row per entity, workspace-scoped.
- Enrichment triggered on entity create/update and relationship change (both source and target entities re-embed on relationship change).
- Queue deduplication: skip or overwrite existing PENDING row for the same `entity_id` on enqueue.
- Schema change detection: when entity type schema changes, enqueue re-embedding for all entities of that type only (not all workspace entities).
- `schema_migration_jobs` table for re-embedding progress tracking.
- Activity logging for all enrichment mutations (follows existing `ActivityService` pattern).
- Workspace-scoped security on all new endpoints (`@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")`).

**Should have (differentiators):**
- Template system with three pre-configured domain models (SaaS Startup, DTC E-commerce, Service Business), each with full entity types, attributes, relationships, semantic metadata, and 3-5 analytical brief examples.
- Re-embedding progress visibility endpoint (expose `schema_migration_jobs` record via read API).
- Priority-based re-embedding ordering (entities updated in last 7 days get HIGH priority; others NORMAL).
- Batched child Temporal workflows for schema re-embedding (~100 entities per batch for controlled parallelism and resilience).
- Extensible semantic type classifications (stored as strings, not DB enums).

**Defer (v2+):**
- Natural language query interface — embeddings must accumulate and be validated before building retrieval.
- Proactive insights / analytical brief execution — requires query engine and LLM chain calling; neither exists.
- Synchronous / real-time embedding — adds 200-2000ms to every entity write; fundamentally incompatible with responsiveness requirements.
- Workspace-level API key management — secrets management surface not justified at initial scale.
- Custom embedding model support — multiplies testing surface, risks dimension mismatch.
- Vector similarity search endpoint — build after embedding quality is validated.
- Automatic semantic type inference — false positives outweigh automation benefit; templates handle the common case.

### Architecture Approach

The knowledge layer is an additive domain that does not modify core entity data paths. The entity domain gains three outbound calls to knowledge services (`EnrichmentQueueService.enqueue()` from `EntityService` and `EntityRelationshipService`, `SchemaMigrationJobService.createJob()` from `EntityTypeService`), but internal entity logic is unchanged. The knowledge domain depends on entity for data but is decoupled from entity's write path by the queue. This is the same architectural pattern as the `workflow` domain's relationship to activity logging.

**Major components (new — `knowledge` domain):**
1. `EntitySemanticMetadataService` / `EntityTypeSemanticMetadataEntity` — CRUD for semantic context on entity types, attributes, and relationships. Separate table from `entity_types` to avoid polluting the hot entity type schema.
2. `EntityTypeTemplateService` — installs pre-configured schema + semantic metadata in a single transaction. Three domain templates.
3. `EnrichmentQueueService` + `EnrichmentDispatcherService` + `EnrichmentQueueProcessorService` — mirrors `WorkflowExecutionQueueService` / `WorkflowExecutionDispatcherService` / `WorkflowExecutionQueueProcessorService` exactly.
4. `SemanticTextBuilderService` — pure transformation service (no I/O). Builds structured enriched text from entity data + semantic metadata. This is the highest correctness risk in the pipeline.
5. `EmbeddingClientService` — thin WebClient wrapper for OpenAI Embeddings API.
6. `EntityEmbeddingService` — upserts into `entity_embeddings` (pgvector). One row per entity, `ON CONFLICT (entity_id) DO UPDATE`.
7. `EnrichmentCoordinationActivity` / `EnrichmentWorkflowImpl` — Temporal activity + workflow. Single activity per entity covers all four pipeline steps (load, build text, embed, upsert).
8. `SchemaMigrationJobService` + `ReBatchingWorkflowImpl` — schema change detection, job tracking, and batched child workflow fan-out.
9. `KnowledgeController` — REST endpoints for semantic metadata CRUD, template installation, manual re-embed triggers, migration job status.

**Database additions:**
- `entity_type_semantic_metadata` — separate table (FK to `entity_types`), JSONB columns for attribute and relationship semantics. `UNIQUE (entity_type_id)` enforces one-to-one.
- `entity_embeddings` — `vector(1536)` column with HNSW index (`vector_cosine_ops`, `m=16`, `ef_construction=64`). `UNIQUE (entity_id)`.
- `entity_enrichment_queue` — mirrors `workflow_execution_queue` schema exactly.
- `schema_migration_jobs` — tracks re-embedding job status, counts, and associated entity type.

### Critical Pitfalls

1. **HNSW index not created before data insertion** — Create the index in schema SQL, before any embedding is stored. Use `CREATE INDEX CONCURRENTLY` in production migrations. Add a startup or integration test asserting the index exists. Phase: schema setup.

2. **Missing `workspace_id` pre-filter on vector similarity queries** — HNSW does not support pre-filtering natively; use `WHERE workspace_id = $workspaceId` before `ORDER BY embedding <=>`. This is a multi-tenancy correctness violation, not a performance concern. Write multi-tenant integration tests. Phase: query layer.

3. **Enriched text encodes schema structure, not semantic meaning** — Raw field-name-value serialization (`"name: Acme Corp, arr: 450000"`) produces embeddings that cluster on field names, not business concepts. Use semantic type labels and human-authored descriptions. Make `SemanticTextBuilderService` independently unit-testable. This is the most important correctness investment in the pipeline. Phase: enrichment pipeline.

4. **Schema change re-embeds all workspace entities instead of affected type only** — Filter batch query by `entity_type_id`. Record the affected type in `schema_migration_jobs`. At workspace scale this determines whether re-embedding takes 2 minutes or 10+. Phase: schema change re-embedding.

5. **Temporal activity timeout misconfigured for OpenAI API calls** — Existing retry config was tuned for fast internal HTTP (2-3s). OpenAI embedding calls can take 10s+ under load, and HTTP 429 (rate limit) must be treated as retriable (not added to `doNotRetry`). Define separate `ActivityOptions` for embedding activities. Phase: Temporal workflow configuration.

6. **OpenAI API key exposed in logs, Temporal event history, or metadata** — Never pass `OPENAI_API_KEY` as a Temporal activity parameter. Inject from `@ConfigurationProperties` inside the activity. Set HTTP client log level to WARN in production. Phase: infrastructure/configuration.

---

## Implications for Roadmap

Based on combined research, the hard dependency chain dictates a four-phase structure with Phase 3 being the most complex:

### Phase 1: Semantic Metadata Foundation

**Rationale:** Every downstream component depends on semantic metadata existing. The enriched text builder, the template system, and the embedding pipeline all require entity types to have semantic definitions, attribute descriptions, and relationship context. This phase is also purely additive — no existing code changes, no external dependencies. It can be verified in isolation and shipped independently.

**Delivers:** `entity_type_semantic_metadata` table, `EntityTypeSemanticMetadataEntity`, `EntitySemanticMetadataService`, and `KnowledgeController` CRUD endpoints for semantic metadata. pgvector extension registration (`CREATE EXTENSION IF NOT EXISTS vector`).

**Addresses features:** Semantic type classification, entity type semantic definitions, attribute semantic descriptions, relationship semantic context, extensible semantic type strings, workspace-scoped security on new endpoints.

**Avoids:** Anti-Pattern 3 (inlining semantic metadata into `EntityTypeEntity`). The separate table approach keeps entity type CRUD clean and makes semantic metadata optional.

**Research flag:** Standard patterns. No phase-level research needed. Schema design is fully specified in ARCHITECTURE.md.

---

### Phase 2: Template System

**Rationale:** Templates depend on Phase 1 (semantic metadata CRUD) and produce the entities that Phase 3 will embed. Shipping templates before Phase 3 is a deliberate choice — it lets the template authoring work happen in parallel with the embedding pipeline construction, and it validates the semantic metadata model against realistic domain data before the pipeline depends on it. Templates also provide the fastest path to user value: a workspace can be set up with a complete, semantically-enriched schema in one action.

**Delivers:** Three domain template definitions (SaaS Startup, DTC E-commerce, Service Business), each with entity types, attributes, relationships, semantic metadata, and 3-5 analytical brief examples. `EntityTypeTemplateService` and template installation endpoint in `KnowledgeController`.

**Addresses features:** Template system with pre-configured domain models, analytical briefs, example queries usable with <50 records.

**Avoids:** Pitfall 14 (template installation does not trigger initial embedding) — document in the installation response that embeddings will begin processing within minutes of first entity creation, after Phase 3 is deployed.

**Research flag:** Moderate research needed during planning for template data authoring. The three domain models require decisions about which entity types, attributes, and relationships best demonstrate the semantic foundation. Technical implementation is straightforward; domain authoring is not.

---

### Phase 3: Enrichment Pipeline

**Rationale:** This is the core infrastructure milestone. It produces the first embeddings and validates the full pipeline end-to-end. Everything in Phase 4 reuses `EnrichmentWorkflow` as a building block, so this phase must be complete before schema-change re-embedding can be built. The queue and dispatcher components mirror existing workflow infrastructure exactly, minimizing novel risk.

**Delivers:** `entity_enrichment_queue` table + queue management services, `SemanticTextBuilderService`, `EmbeddingClientService` (OpenAI WebClient wrapper), `entity_embeddings` table with HNSW index, `EntityEmbeddingService`, `EnrichmentCoordinationActivity`, `EnrichmentWorkflowImpl`, `EnrichmentDispatcherService`, and hooks from `EntityService` / `EntityRelationshipService` to enqueue on mutation.

**Addresses features:** Enrichment triggered on entity create/update and relationship change, queue deduplication, pgvector storage, embedding metadata, activity logging, end-to-end enrichment pipeline.

**Uses:** `com.pgvector:pgvector:0.1.6` (new dependency), Spring WebClient (existing), Temporal SDK (existing), ShedLock (existing).

**Implements architecture:** Queue trigger from service method (same transaction as entity save), dispatcher using existing ShedLock infrastructure, Temporal worker registration on existing queue, per-entity workflow with single coordination activity.

**Avoids:**
- Pitfall 1: HNSW index created in schema SQL before any embedding is stored.
- Pitfall 2: `workspace_id` pre-filter on all vector queries.
- Pitfall 3: `SemanticTextBuilderService` uses semantic labels and descriptions, not raw attribute keys.
- Pitfall 5: Separate `ActivityOptions` for embedding activities with 429-retriable retry config.
- Pitfall 6: API key injected from Spring context only, never as Temporal activity parameter.
- Anti-Pattern 1: OpenAI called asynchronously via queue, not synchronously in entity save path.
- Anti-Pattern 2: Embedding stored in separate `entity_embeddings` table, not as column on `entities`.

**Research flag:** Needs research during phase planning for two sub-areas: (a) Temporal activity options for embedding workloads — verify current SDK retry API against `io.temporal:temporal-sdk:1.24.1`; (b) confirm `ankane/pgvector:pg16` Testcontainers image name against Docker Hub. Core queue and dispatcher patterns are standard (established codebase pattern).

---

### Phase 4: Schema Change Re-embedding

**Rationale:** Without schema change detection, semantic metadata updates accumulate stale embeddings silently. This phase is required for the knowledge layer to remain accurate over time. It depends on Phase 3's `EnrichmentWorkflow` as the child workflow building block — it cannot be built before Phase 3 is complete.

**Delivers:** `schema_migration_jobs` table, `SchemaMigrationJobService`, `ReBatchingWorkflowImpl` (Temporal parent-child fan-out, ~100 entities per child batch), `MigrationProgressActivity`, schema change detection hook in `EntityTypeService`, and migration job status endpoint in `KnowledgeController`.

**Addresses features:** Schema change detection and re-embedding, re-embedding job tracking, re-embedding progress visibility endpoint, batched child Temporal workflows, re-embedding does not block entity operations.

**Avoids:**
- Pitfall 4: Re-embedding scoped to affected `entity_type_id` only, not all workspace entities.
- Pitfall 8: Deduplication check before launching new schema migration job for a type already in-progress.
- Pitfall 11: Workspace-fair queue ordering to prevent one large workspace from consuming the full rate limit budget.
- Anti-Pattern 5: Controlled batch fan-out via `ReBatchingWorkflow` rather than unbounded parallel workflow starts.

**Research flag:** Standard patterns for the Temporal child workflow fan-out. Verify `temporal-sdk:1.24.1` child workflow API before implementation. Deduplication logic for concurrent schema changes needs careful design during planning.

---

### Phase Ordering Rationale

- **Phase 1 before all others:** Every pipeline component requires semantic metadata to exist. The separate table design means zero changes to existing entities — safe to ship independently.
- **Phase 2 before Phase 3:** Template authoring validates the semantic metadata model against realistic domain data. Templates can ship and be used for entity type setup before the enrichment pipeline runs. This also provides a natural integration test: after Phase 3 deploys, template-created entity types should produce high-quality embeddings immediately.
- **Phase 3 before Phase 4:** `ReBatchingWorkflow` in Phase 4 uses `EnrichmentWorkflow` as a child workflow building block. Phase 4 cannot start until the per-entity enrichment unit is complete and validated.
- **End-to-end delivery only:** A partial pipeline (semantic metadata without embeddings, or queue without Temporal workflow) delivers no user-facing value. Each phase must be fully complete before the next begins.

### Research Flags

Phases needing deeper research during planning:
- **Phase 2:** Template domain authoring — which entity types, attributes, and relationships best represent each of the three business domains. Technical implementation is trivial; the domain content decisions are not.
- **Phase 3:** Verify Temporal activity retry API and heartbeat configuration against `io.temporal:temporal-sdk:1.24.1` SDK docs before writing activity configuration code.
- **Phase 3:** Confirm `ankane/pgvector:pg16` Docker Hub image tag before updating Testcontainers base class.

Phases with standard patterns (research not required):
- **Phase 1:** Semantic metadata schema and CRUD is pure JPA/Spring work following established codebase patterns. No new technology.
- **Phase 4:** Re-embedding job tracking and Temporal fan-out follow well-established patterns. The child workflow API is the only novel element; it is well-documented.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on direct `build.gradle.kts` inspection plus codebase pattern analysis. One new dependency (pgvector-java 0.1.6) — verify version at Maven Central. OpenAI WebClient approach is certain. |
| Features | HIGH | Based on `PROJECT.md` authoritative requirements and internal consistency analysis of existing codebase. Feature scope is fully specified. Anti-features are explicitly documented by the project. |
| Architecture | HIGH | Based on direct codebase analysis of existing workflow queue, dispatcher, and Temporal patterns. Knowledge domain mirrors established patterns with high fidelity. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (HNSW index, workspace pre-filter, enriched text quality, API key hygiene) are HIGH confidence. Moderate pitfalls (queue storms, Temporal timeout tuning, staleness indicators) are MEDIUM — require validation against current OpenAI rate limits and Temporal SDK version. |

**Overall confidence:** HIGH

### Gaps to Address

- **pgvector HNSW parameter tuning:** `m=16, ef_construction=64` are conservative defaults. Validate against actual data volumes before declaring these final. `ef_search` at query time is not specified in research — determine before writing the similarity query.
- **OpenAI rate limits (current):** Research is based on training data through January 2025. Verify current `text-embedding-3-small` RPM and TPM limits against the OpenAI platform dashboard before designing the concurrency budget for Phase 3 and Phase 4.
- **Temporal `temporal-sdk:1.24.1` child workflow API:** Child workflow fan-out pattern is well-understood conceptually but the exact API signatures for `Workflow.newChildWorkflowStub()` should be verified against the SDK version in use.
- **`ankane/pgvector:pg16` image tag:** Verify at Docker Hub before updating Testcontainers configuration. The image name in research is based on training data.
- **Token limit handling for enriched text:** Research flags the 8,192-token limit for `text-embedding-3-small`. A JVM tokenizer library for pre-call token counting is not specified — this needs a decision during Phase 3 planning (use a character-count heuristic, or find a tiktoken-equivalent JVM library).

---

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — authoritative requirements, constraints, and explicit anti-features
- `.planning/codebase/ARCHITECTURE.md` — existing system patterns and domain boundaries
- `.planning/codebase/STACK.md` — technology decisions including Temporal and pgvector constraints
- `build.gradle.kts` (direct inspection) — exact library versions in use
- `db/schema/01_tables/entities.sql` — existing entity/entity_type schema
- `src/main/kotlin/riven/core/models/common/validation/Schema.kt` — current attribute schema model
- `src/main/kotlin/riven/core/models/entity/configuration/EntityRelationshipDefinition.kt` — relationship model
- `src/main/kotlin/riven/core/service/workflow/queue/WorkflowExecutionQueueService.kt` — queue pattern reference
- Existing Temporal patterns in `WorkflowOrchestrationService`, `WorkflowExecutionDispatcherService`, `TemporalWorkerConfiguration` (direct inspection)

### Secondary (MEDIUM confidence)
- pgvector GitHub (https://github.com/pgvector/pgvector) — HNSW index parameters, operator selection
- pgvector-java GitHub (https://github.com/pgvector/pgvector-java) — JPA `VectorType` integration
- OpenAI Embeddings API (https://platform.openai.com/docs/api-reference/embeddings) — model dimensions, token limits (verify current)
- Supabase pgvector docs (https://supabase.com/docs/guides/database/extensions/pgvector) — pre-installed extension status
- Temporal docs (https://docs.temporal.io/develop/java) — child workflow patterns, determinism rules

### Tertiary (LOW confidence)
- Training data on vector embedding systems, knowledge graph platforms, and semantic metadata standards — used only for pitfall pattern recognition and enriched text construction best practices

---

*Research completed: 2026-02-17*
*Ready for roadmap: yes*
