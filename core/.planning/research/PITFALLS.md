# Domain Pitfalls

**Domain:** Semantic enrichment and vector embedding pipeline for business entity data
**Researched:** 2026-02-17
**Confidence note:** External research tools unavailable. All findings sourced from training data (knowledge cutoff January 2025). Confidence levels reflect source quality within that constraint. Verify pgvector index parameters and OpenAI rate limits against current docs before implementation.

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or block the 15-minute re-embedding SLA.

---

### Pitfall 1: pgvector HNSW Index Not Created Before Data Load

**What goes wrong:** Teams insert embeddings first, then create the HNSW index on the populated table. PostgreSQL must build the index over the existing data in a single expensive operation that blocks the table (or requires `CONCURRENTLY`). Worse, if the index is never created at all, every vector similarity query falls back to a full sequential scan — returning correct results but at O(n) cost. With 1,000 entities per workspace and dozens of workspaces this is initially invisible; at 50,000 entities it becomes a 30-second query.

**Why it happens:** The extension is new to the team. The table appears to work without the index. Load testing with small datasets doesn't expose the problem.

**Consequences:** Similarity queries work but are slow. The team discovers the problem in production under load. Adding the index retroactively on a live table with millions of rows requires a maintenance window.

**Prevention:**
- Create the HNSW index in the schema SQL file, before any data is inserted.
- Use `CREATE INDEX CONCURRENTLY` in migration scripts so existing data is indexed without locking.
- Index parameters to use: `m = 16`, `ef_construction = 64` (pgvector defaults; suitable for <1M vectors). For exact results on small datasets use IVFFlat with `lists = 100`.
- Add a startup check or integration test that asserts the index exists on the `entity_embeddings` table.

**Warning signs:** `EXPLAIN ANALYZE` on similarity queries shows `Seq Scan` instead of `Index Scan`. Query time scales linearly with row count rather than logarithmically.

**Phase:** Address in the schema phase before any embedding is stored. Do not defer.

**Confidence:** HIGH — pgvector index behavior is well-documented and consistent across versions.

---

### Pitfall 2: Missing `workspace_id` Filter on Vector Similarity Queries

**What goes wrong:** Vector similarity queries search across all embeddings in the table and filter by workspace after ranking. The query returns the top-K most similar vectors globally, then discards non-workspace results. If another workspace has high-volume, semantically similar data, its embeddings crowd out the target workspace's results entirely.

**Why it happens:** The naive `ORDER BY embedding <=> $1 LIMIT 10` query is the first thing that works. Adding `WHERE workspace_id = $2` feels like it will reduce recall. Developers don't test with multi-tenant data.

**Consequences:** Cross-tenant data contamination (security violation). Users in small workspaces get results dominated by large-workspace embeddings. The query is also inefficient: pgvector must rank all vectors before the workspace filter reduces the set.

**Prevention:**
- Always include `WHERE workspace_id = $workspaceId` BEFORE the ORDER BY clause. pgvector applies pre-filters before ranking when using IVFFlat; HNSW does not support pre-filtering natively — it post-filters.
- For HNSW, add `workspace_id` as a prefix filter: `WHERE workspace_id = $1 ORDER BY embedding <=> $2 LIMIT 10`. PostgreSQL will use a bitmap scan on workspace_id + HNSW, which is acceptable for the scale in scope.
- Write integration tests with two workspaces containing similar data. Assert workspace A queries never return workspace B embeddings.
- Apply the same `@PreAuthorize` and RLS policy pattern used elsewhere in Riven — add an RLS policy on `entity_embeddings` matching the existing workspace isolation pattern in `schema.sql`.

**Warning signs:** Query results contain entity UUIDs that do not belong to the requesting workspace. Missing RLS policy on the new table.

**Phase:** Schema and query layer phase. Must be validated with a multi-tenant integration test before any query API is exposed.

**Confidence:** HIGH — this is a fundamental multi-tenancy correctness requirement, not a tuning concern.

---

### Pitfall 3: Enriched Text Construction Encodes Schema Structure, Not Semantic Meaning

**What goes wrong:** The enriched text for an entity is built by serializing the raw attribute names and values: `"name: Acme Corp, arr: 450000, stage: Series A"`. This creates embeddings that cluster on field name patterns rather than business concept similarity. An entity with `arr: 450000` and a different entity with `monthly_revenue: 37500` will not be considered similar even though they represent the same business scale, because the text templates are structurally different.

**Why it happens:** Field-name-value serialization is the obvious first implementation. It appears to produce reasonable results in isolation. The problem only surfaces when comparing across entity types with different attribute naming conventions.

**Consequences:** Cross-entity-type queries (the core value proposition) fail silently — results look plausible but don't surface semantically related entities. Embeddings must be regenerated from scratch when text construction logic improves, triggering a full re-embedding of all entities.

**Prevention:**
- Use semantic metadata to drive text construction, not raw attribute names. The enriched text template should be: `"[entity type description]. [attribute semantic label]: [value]. [relationship context]"`. Example: `"Customer relationship. Revenue (annual): $450,000. Stage: Series A. Industry: B2B SaaS. Related to 3 deals."`.
- Prioritize attributes marked with semantic types (`quantitative`, `categorical`, `temporal`) and include their natural language labels, not their attribute key names.
- For RELATIONSHIP semantic type attributes, include the related entity's type name and a brief description rather than the raw UUID.
- Build a `EnrichedTextBuilder` service that takes an entity, its type schema, semantic metadata, and related entities as inputs. Make the text construction logic testable in isolation — write unit tests asserting what text is produced for given inputs before building the full pipeline.
- Define the text format as a constant template. When the format changes, trigger a full re-embedding. Store the template version in the embedding metadata so staleness is detectable.

**Warning signs:** Similarity queries return entities that share field names but not business meaning. Entities of different types with equivalent business values don't cluster together.

**Phase:** Enrichment pipeline phase. The text construction logic is the most important correctness investment. Do not rush it.

**Confidence:** HIGH — this pattern is documented extensively in RAG and embedding pipeline literature.

---

### Pitfall 4: Schema Change Triggers Full Re-embedding of All Entities, Not Just Affected Ones

**What goes wrong:** When an entity type schema changes (attribute added, semantic description updated), the system re-embeds every entity in the workspace rather than only entities of the changed type. For a workspace with 5 entity types each with 200 entities, one schema change triggers 1,000 re-embeddings instead of 200. This burns OpenAI API quota, violates the 15-minute SLA for unrelated types, and causes stale results for entities that didn't need updating.

**Why it happens:** The simplest implementation is "schema changed → re-embed everything." Scoping by entity type requires the re-embedding job to receive the changed type ID and use it to filter.

**Consequences:** OpenAI API costs scale with workspace size rather than change scope. Re-embedding takes 5x longer than necessary. The 15-minute SLA breaks as workspace entity counts grow.

**Prevention:**
- The `schema_migration_jobs` table must record the specific entity type ID that triggered re-embedding.
- The Temporal child workflow batch query must filter: `SELECT id FROM entities WHERE entity_type_id = $affectedTypeId AND workspace_id = $workspaceId AND deleted = false`.
- When a relationship definition changes on Entity Type A, re-embed: (a) all entities of Type A (their relationship context changed), and (b) all entities of the related Type B that had Type A in their enriched text. Store which entity types are referenced in the embedding metadata to make this lookup efficient.
- For semantic metadata changes only (description text updated, no data change), re-embed only the directly affected type.
- Write a test that asserts the re-embedding job query returns exactly the expected entity IDs for a given type change.

**Warning signs:** Re-embedding job entity count equals total workspace entity count rather than affected type count. `schema_migration_jobs` has no `affected_entity_type_id` column.

**Phase:** Schema change detection and batch re-embedding phase.

**Confidence:** HIGH — logical consequence of the data model described in PROJECT.md.

---

### Pitfall 5: Temporal Workflow Activity Timeout Mismatch for OpenAI API Calls

**What goes wrong:** The embedding generation Temporal activity uses the project's default retry policy (3 attempts, 30s max interval). An OpenAI API call that takes 10 seconds plus network overhead plus retry backoff can exceed a poorly-configured `scheduleToCloseTimeout`. The workflow fails permanently on transient rate-limit errors rather than backing off and retrying. Alternatively, the timeout is set too long (30 minutes) and a genuinely hung activity holds a Temporal task slot indefinitely.

**Why it happens:** The existing workflow retry config in `application.yml` was tuned for internal HTTP actions (2-3 second expected response). The OpenAI embedding API has different latency characteristics, especially under rate limits (HTTP 429 with `Retry-After` headers).

**Consequences:** Batch re-embedding jobs fail partway through on rate limit spikes. Temporal shows workflows in TIMED_OUT state with no clear cause. Re-embedding SLA is violated.

**Prevention:**
- Define a separate Temporal activity options configuration for embedding activities: `startToCloseTimeout = 30s` per single batch call, `scheduleToCloseTimeout = 5min` for the full batch activity, `retryOptions.maximumAttempts = 5`, `retryOptions.initialInterval = 2s`, `retryOptions.backoffCoefficient = 2.0`, `retryOptions.maximumInterval = 60s`.
- Treat HTTP 429 from OpenAI as retriable. Do NOT add 429 to the non-retryable status codes list (it's currently listed for workflow HTTP actions — do not copy that pattern for embedding activities).
- Parse the `Retry-After` header from OpenAI 429 responses and sleep for that duration before retrying, rather than using exponential backoff blindly.
- The child workflow that processes a batch of ~100 entities should emit a heartbeat (`Activity.getExecutionContext().heartbeat(progress)`) so Temporal knows the activity is alive during the batch.

**Warning signs:** Temporal Web UI shows embedding activities in TIMED_OUT state. OpenAI API calls succeed in isolation but fail in batch runs. Batch progress stops at a consistent count (e.g., always at entity #60 of 100).

**Phase:** Temporal batch workflow phase. Review during activity configuration, not after first integration failure.

**Confidence:** MEDIUM — Temporal activity timeout behavior is well-documented; OpenAI rate limit behavior is based on training data that may not reflect current limits.

---

### Pitfall 6: OpenAI API Key Exposed in Embedding Metadata or Logs

**What goes wrong:** The `OPENAI_API_KEY` environment variable is referenced in error messages, logged in debug output, or inadvertently included in embedding metadata stored to the database. Once in logs or database, rotation is insufficient — the key is already exposed.

**Why it happens:** Spring Boot auto-configures detailed error responses. Ktor client (used by Supabase SDK, potentially reused for OpenAI calls) logs request headers in DEBUG mode. Jackson serialization of a configuration properties object includes the key.

**Consequences:** API key exposure leads to unauthorized usage charges. If the same key is shared across services, the blast radius extends.

**Prevention:**
- Never include the API key in any domain model, DTO, response, or activity parameter. Pass it only within the service layer from a `@ConfigurationProperties` class.
- Ensure the OpenAI configuration properties class uses `@JsonIgnore` (or is not serialized at all) on the key field.
- Set log level for HTTP client libraries to WARN or above in production. Audit `application.yml` log configuration for any DEBUG-level HTTP client logging.
- In the Temporal activity, do not include the API key in the activity input/output serialized to Temporal's event history. Inject it from Spring context inside the activity implementation.

**Warning signs:** Activity parameters visible in Temporal Web UI contain an `apiKey` field. HTTP client logs in DEBUG mode show Authorization headers.

**Phase:** Infrastructure/configuration phase. Address at the point of adding `OPENAI_API_KEY` to application config.

**Confidence:** HIGH — this is a standard secrets hygiene concern with clear prevention steps.

---

## Moderate Pitfalls

---

### Pitfall 7: pgvector Index Built with Wrong Dimension Causes Silent Truncation

**What goes wrong:** The HNSW or IVFFlat index is created with dimension `1536` (OpenAI ada-002 output size) instead of `1536` for text-embedding-3-small... but text-embedding-3-small also returns 1536 dimensions by default. The risk is using the `dimensions` parameter in the OpenAI API call to request a reduced dimension (e.g., 512 for storage savings) without matching the index and column definition.

**Why it happens:** text-embedding-3-small supports Matryoshka Representation Learning — you can request smaller dimension outputs. If someone adds a `dimensions: 512` parameter to the API call without updating the database column and index, pgvector silently stores truncated vectors or throws a dimension mismatch error at insert time (not query time).

**Consequences:** All new embeddings fail to insert. Existing embeddings are different dimensions from new ones. Re-embedding required to standardize.

**Prevention:**
- Fix the dimension in the SQL schema as a constant: `VECTOR(1536)` for text-embedding-3-small default output. Document this in a code comment referencing the model.
- Do not use the `dimensions` parameter in the OpenAI call unless you also update the schema. Treat dimension as a schema migration, not an API parameter.
- Add an integration test that inserts a real embedding and asserts its dimension matches the column definition.

**Warning signs:** OpenAI API call uses a `dimensions` parameter. The vector column definition differs from the API response vector length.

**Phase:** Schema phase. Define and lock dimension before writing any embedding code.

**Confidence:** HIGH — pgvector is strict about dimension consistency.

---

### Pitfall 8: Re-embedding Queue Storms When Multiple Schema Changes Fire Simultaneously

**What goes wrong:** A user updates semantic metadata on 3 entity types in quick succession. Each change enqueues a separate `SchemaReembeddingJob`. The queue processor picks up all three jobs and launches three parallel Temporal child workflows. Each child workflow fires parallel batches of ~100 entities. The result is 3 × (total_entities / 100) concurrent OpenAI API calls, which immediately saturates the rate limit.

**Why it happens:** The queue-based trigger pattern works well for single-entity mutations. Schema changes are rarer and higher-fan-out. The existing queue consumer doesn't deduplicate or throttle by entity type.

**Consequences:** OpenAI rate limit errors cascade. Multiple re-embedding runs for the same entity type produce conflicting embeddings in the database. The 15-minute SLA is violated due to retry backoff.

**Prevention:**
- Implement a deduplication check in the schema migration job scheduler: before launching a Temporal workflow for entity type X, check if a `schema_migration_jobs` record for type X is already IN_PROGRESS. If so, mark the new request as QUEUED and let the in-progress job complete.
- Configure the Temporal child workflow for embedding batches to use a fixed concurrency limit: process batches sequentially or at low parallelism (2-3 concurrent activities) rather than all at once.
- Add a global OpenAI rate limit semaphore at the service level: a `RateLimiter` (e.g., Guava or custom) that limits embedding API calls to N per minute across all concurrent workflows.

**Warning signs:** Multiple `schema_migration_jobs` rows with the same `entity_type_id` in IN_PROGRESS state simultaneously. OpenAI 429 errors spiking after schema update bursts.

**Phase:** Batch re-embedding workflow phase.

**Confidence:** MEDIUM — queue storm behavior is logical from the design; specific Temporal concurrency patterns are based on training data.

---

### Pitfall 9: H2 Test Database Cannot Test pgvector Queries

**What goes wrong:** The project uses H2 in-memory database for unit tests (`application-test.yml`). H2 does not support the pgvector extension. Any test that exercises repository methods involving vector columns, similarity queries, or embedding metadata will fail at startup with an unknown type error, or require mocking so aggressively that the test provides no coverage.

**Why it happens:** The existing test infrastructure pattern uses H2 for speed and isolation. The team naturally tries to apply the same pattern to embedding repositories.

**Consequences:** Vector query logic has no test coverage until it runs in integration tests against a real PostgreSQL + pgvector instance. Bugs in the similarity query SQL go undetected until late in the development cycle.

**Prevention:**
- Do not add vector column definitions to any entity that the H2 unit test profile attempts to create (`ddl-auto: create-drop`). Keep the `EmbeddingEntity` and related repositories in their own package and explicitly exclude them from H2-based `@SpringBootTest` test configurations.
- Use Testcontainers (already in the project) with the `pgvector/pgvector:pg16` Docker image for all tests that touch embedding persistence. Write integration tests under `application-integration.yml` profile.
- Unit-test the `EnrichedTextBuilder` service (text construction logic) with H2/pure Kotlin — it has no database dependency. Unit-test the Temporal activity logic with mocked OpenAI client. Reserve Testcontainers for SQL-level vector operations.

**Warning signs:** Unit tests fail with `Unknown data type: vector`. H2 schema creation errors in test logs.

**Phase:** Any phase introducing embedding repositories. Set up the Testcontainers pgvector profile before writing the first repository test.

**Confidence:** HIGH — H2's lack of extension support is a known, documented limitation.

---

### Pitfall 10: Stale Embedding Staleness Indicator Not Propagated to Callers

**What goes wrong:** The system stores embeddings with timestamps and updates them asynchronously. During re-embedding, some entities have fresh embeddings and some have stale ones. The query layer returns mixed results without indicating which results are based on current vs. stale embeddings. Users see results change between queries without understanding why.

**Why it happens:** The "users can continue working during re-embedding" requirement is understood as "don't block writes." The subtlety — that query results mix fresh and stale embeddings — is overlooked.

**Consequences:** Users lose trust in similarity results. A user queries for "customers similar to Acme" and gets different results ten minutes later when re-embedding completes, with no explanation.

**Prevention:**
- Store `embedded_at` timestamp and `schema_version` (or `template_version`) on each embedding row.
- When returning similarity results, include a `staleness` indicator in the response: `{ entityId, score, embeddingAge: "fresh" | "stale" }`.
- The `schema_migration_jobs` table tracks re-embedding progress per entity type — use this to determine which entity types are currently being re-embedded and flag their results accordingly.
- Document this behavior explicitly in the API response schema so the future query interface layer knows to surface it to users.

**Warning signs:** Similarity query results change between identical queries during re-embedding. No `embedded_at` column on the embedding table. API response contains no staleness signal.

**Phase:** Embedding metadata and query response phase.

**Confidence:** MEDIUM — based on domain reasoning from the PROJECT.md requirements; specific staleness indicator approach is a design recommendation.

---

### Pitfall 11: Single Platform OpenAI API Key Creates Shared Rate Limit Contention

**What goes wrong:** A single `OPENAI_API_KEY` is used for all workspaces. OpenAI rate limits are per API key. If workspace A triggers a large re-embedding job (e.g., 1,000 entities after a major schema change), it consumes the entire rate limit budget. All other workspaces' enrichment triggers queue up behind it and are delayed.

**Why it happens:** The platform-level API key is explicitly in scope per the project constraints. This is the correct architectural decision for now. The risk is not in the decision — it's in failing to implement fairness controls.

**Consequences:** One workspace's activity degrades embedding freshness for all workspaces. The 15-minute SLA becomes workspace-size-dependent rather than absolute.

**Prevention:**
- Implement a workspace-fair queue ordering strategy: the batch scheduler should interleave batches from different workspaces rather than processing one workspace's full queue before starting another's.
- Set a maximum concurrent embedding batch count per workspace (e.g., 2 concurrent child workflows per workspace). Other workspaces' jobs proceed while the large workspace is limited.
- Track API usage metrics per workspace (count of embedding calls per workspace per day) for future billing or fairness auditing.

**Warning signs:** A single workspace's job consistently completes in 15 minutes while others are delayed 30-60 minutes. Rate limit errors correlate with large-workspace schema changes.

**Phase:** Batch re-embedding scheduler phase.

**Confidence:** MEDIUM — logical from the single-key constraint; specific concurrency limits require load testing to tune.

---

## Minor Pitfalls

---

### Pitfall 12: Temporal Child Workflow Activity Heartbeat Timeout on Long Batches

**What goes wrong:** A child workflow processing 100 entities makes sequential OpenAI API calls. If each call takes 1-2 seconds, the full batch takes 100-200 seconds. If the activity `heartbeatTimeout` is set lower than the batch duration, Temporal considers the activity dead and retries it, causing double-embedding of entities already processed.

**Prevention:** Set `heartbeatTimeout` to at least 3× the expected maximum batch duration. Call `Activity.getExecutionContext().heartbeat(processedCount)` after each entity is embedded so Temporal receives liveness signals throughout the batch, not just at completion.

**Phase:** Temporal activity configuration phase.

**Confidence:** HIGH — documented Temporal behavior.

---

### Pitfall 13: Enriched Text Token Length Exceeds OpenAI Embedding Input Limit

**What goes wrong:** Entities with many attributes and rich relationship context produce enriched text strings exceeding 8,192 tokens (the text-embedding-3-small input limit). The OpenAI API returns a 400 error. The embedding pipeline fails for those specific entities silently if errors aren't surfaced per-entity.

**Prevention:** Add a pre-call token count check using a tokenizer (tiktoken equivalent in Kotlin/JVM) or a conservative character count heuristic (8,192 tokens ≈ 32,768 characters for typical business text). Truncate or summarize the enriched text if it exceeds the limit. Log which entities triggered truncation for auditing.

**Phase:** Enriched text construction phase.

**Confidence:** MEDIUM — token limit is documented; JVM tokenizer library availability requires verification.

---

### Pitfall 14: Template Installation Does Not Trigger Initial Embedding

**What goes wrong:** A user installs a template, which creates entity types, attributes, relationships, and semantic metadata. No entities exist yet, so no embedding trigger fires. The user creates their first 10 entities, each triggering an individual enrichment job. These 10 individual jobs take longer and create more API overhead than a single batch would. More critically, if the queue processor is not running, those 10 items sit in the queue unprocessed and the user's "10-minute first query" experience fails.

**Prevention:** The template installation service should enqueue an "initial enrichment warmup" job that processes any subsequently created entities in batch rather than individually. Document in the template completion response that embeddings will be available within 2-3 minutes after first entity creation. The first-use experience must include a readiness check.

**Phase:** Template installation phase.

**Confidence:** MEDIUM — logical from the PROJECT.md "10 minutes to first meaningful query" requirement.

---

### Pitfall 15: JPA Entity Mapping Conflict Between `entities` Table and New `entity_embeddings` Table

**What goes wrong:** The existing `EntityEntity` maps to the `entities` table. If the embedding system adds a `@OneToOne` or `@OneToMany` relationship from `EntityEntity` to a new `EmbeddingEntity`, Hibernate attempts to load the embedding on every entity fetch. This causes N+1 queries on all existing entity reads — including all controller endpoints that predate the knowledge layer.

**Prevention:** Do not add JPA relationships from `EntityEntity` to `EmbeddingEntity`. Keep the embedding table fully decoupled from the existing entity JPA layer. Query embeddings only from `EmbeddingRepository` directly, never via JPA join. Use the entity's UUID as the join key in a plain repository query, not as a JPA association.

**Phase:** Schema and JPA entity design phase. Decide before writing any `@Entity` for the embedding table.

**Confidence:** HIGH — direct consequence of Hibernate's default fetch behavior and the existing N+1 concern already documented in CONCERNS.md.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| pgvector schema setup | HNSW index missing or wrong dimension | Create index in schema SQL before any data insertion; fix dimension to 1536 |
| RLS policy on embeddings table | Missing workspace isolation | Copy existing RLS policy pattern from `schema.sql`; write multi-tenant integration test |
| Enriched text construction | Encoding schema structure not semantics | Use semantic type labels not attribute keys; make text builder independently unit-testable |
| Embedding batch Temporal activity | Wrong timeout / non-retriable 429 | Separate activity config from existing workflow config; treat 429 as retriable |
| OpenAI API integration | Secrets in logs or metadata | Never pass API key to Temporal activity input; audit HTTP client debug logging |
| Schema change re-embedding | Full workspace re-embed instead of type-scoped | Filter batch query by `entity_type_id`; record affected type in `schema_migration_jobs` |
| Concurrent schema changes | Queue storms saturating rate limit | Deduplicate in-progress jobs per type; enforce per-workspace concurrency limit |
| H2 unit tests | pgvector extension unavailable | Exclude embedding repositories from H2 profile; use Testcontainers pgvector for all vector tests |
| Template installation | No initial embedding trigger | Document embedding latency; test first-query experience end-to-end |
| JPA entity associations | N+1 on all entity reads | Never add JPA relationship from EntityEntity to EmbeddingEntity; use plain repository queries |

---

## Sources

**Confidence note:** External research tools (WebSearch, WebFetch, Context7) were unavailable during this research session. All findings are based on:

- Training data knowledge of pgvector, OpenAI embedding API, Temporal SDK (through January 2025) — rated HIGH or MEDIUM as noted per pitfall
- Direct codebase analysis of Riven's existing patterns, architecture, and documented concerns in `.planning/codebase/`
- Logical derivation from PROJECT.md requirements and constraints

**Verification recommended before implementation:**
- pgvector HNSW index parameters (`m`, `ef_construction`, `ef_search`) — verify against current pgvector README
- OpenAI text-embedding-3-small dimension (1536) and token limit (8,192) — verify against current OpenAI docs
- Temporal activity timeout behavior and heartbeat API — verify against current Temporal SDK docs
- OpenAI rate limits (RPM/TPM for text-embedding-3-small) — verify against current platform dashboard
