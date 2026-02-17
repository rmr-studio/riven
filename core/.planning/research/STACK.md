# Technology Stack: Semantic Enrichment Pipeline

**Project:** Riven Knowledge Layer — Entity Semantic Enrichment + Vector Embeddings
**Researched:** 2026-02-17
**Researcher note:** External web tools (WebFetch, WebSearch) were unavailable during this session. All library version recommendations are based on: (a) what is already in build.gradle.kts, (b) Maven Central release patterns known as of training cutoff (January 2025), and (c) official pgvector and OpenAI documentation knowledge. Confidence levels reflect this constraint honestly. **Verify all library versions against Maven Central before adding to build.gradle.kts.**

---

## Recommended Stack

### Core Framework (Already Present — No Changes)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Spring Boot | 3.5.3 | Application framework | Already in use. Consistent with existing codebase. |
| Kotlin | 2.1.21 | Language | Already in use. |
| Java | 21 | JVM | Already in use. |
| Spring Data JPA + Hibernate | Managed by Boot 3.5.3 | ORM | Already in use. Required for pgvector entity mapping. |
| Spring WebFlux / WebClient | Managed by Boot 3.5.3 | HTTP client | Already in use (Nango integration). Will reuse for OpenAI API calls. |
| Temporal | 1.24.1 (SDK) / 1.31.0 (Spring Boot) | Workflow execution | Already in use. Central to the enrichment pipeline architecture. |
| Hypersistence Utils | 3.9.2 (hibernate-63) | JSONB column support | Already in use. Needed for embedding metadata stored as JSONB. |
| ShedLock | 7.5.0 | Distributed scheduler locking | Already in use. Needed for queue polling lock on enrichment dispatcher. |

### New Dependencies

#### 1. pgvector-java — PostgreSQL Vector Column Support

| Technology | Recommended Version | Purpose | Why |
|------------|---------------------|---------|-----|
| pgvector-java | **0.1.6** | Hibernate/JPA type support for `vector` column | The only official JVM client for pgvector. Provides `PGvector` class, `VectorType` Hibernate type, and Spring Data JPA integration via `@Type`. |

**Confidence: MEDIUM** — Version 0.1.6 was the stable release as of early 2025. Verify at https://github.com/pgvector/pgvector-java/releases before pinning. The library is maintained by the pgvector team (Andrew Kane) and is the de facto standard — there is no competing JVM library.

**Maven coordinates:**
```kotlin
implementation("com.pgvector:pgvector:0.1.6")
```

**How it integrates with Hibernate/JPA:**

pgvector-java provides a Hibernate `UserType` (`VectorType`) that maps a Kotlin `FloatArray` (or `List<Float>`) to a PostgreSQL `vector(N)` column. The integration pattern is:

```kotlin
import com.pgvector.PGvector
import io.hypersistence.utils.hibernate.type.array.FloatArrayType
// OR use pgvector's own VectorType:
import com.pgvector.hibernate.VectorType

@Entity
@Table(name = "entity_embeddings")
data class EntityEmbeddingEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    // vector(1536) for text-embedding-3-small
    @Column(name = "embedding", columnDefinition = "vector(1536)")
    @org.hibernate.annotations.Type(VectorType::class)
    val embedding: FloatArray? = null,

    // ... other columns
) : AuditableEntity()
```

**Critical pgvector setup note:** The PostgreSQL extension must be enabled before any table using `vector` type is created:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
This goes in `db/schema/00_extensions/extensions.sql` alongside the existing `uuid-ossp` extension. **This must happen before any `vector(N)` column tables are created.** pgvector 0.7+ supports indexing on vector columns — the HNSW index is preferred over IVFFlat for most use cases (see Indexing section below).

#### 2. OpenAI Embedding API Client

**Recommendation: Spring WebClient (already present) with a hand-rolled thin wrapper. Do NOT add the openai-java SDK.**

**Rationale:**

The project already has `spring-boot-starter-webflux` (WebClient) in `build.gradle.kts`, used for the Nango integration. The OpenAI Embeddings API is a single HTTP endpoint:

```
POST https://api.openai.com/v1/embeddings
Authorization: Bearer {OPENAI_API_KEY}
Content-Type: application/json

{"model": "text-embedding-3-small", "input": "..."}
```

Adding the full `openai-java` SDK (com.openai:openai-java) for a single endpoint would:
1. Pull in substantial transitive dependencies not needed elsewhere
2. Introduce a new HTTP client (the SDK uses OkHttp) that duplicates WebClient
3. Conflict with the project's pattern of using WebClient for all external HTTP

The existing NangoClientWrapper pattern is exactly the right template: a thin `@Service` class wrapping a qualified `WebClient` bean. The same pattern applies here.

**OpenAI WebClient configuration:**
```kotlin
// In configuration/integration/OpenAiClientConfiguration.kt
@Bean
@Qualifier("openAiWebClient")
fun openAiWebClient(builder: WebClient.Builder): WebClient {
    return builder
        .baseUrl("https://api.openai.com/v1")
        .defaultHeader("Authorization", "Bearer ${System.getenv("OPENAI_API_KEY")}")
        .defaultHeader("Content-Type", "application/json")
        .codecs { it.defaultCodecs().maxInMemorySize(4 * 1024 * 1024) }
        .build()
}
```

**Request/Response model:**
```kotlin
// models/knowledge/OpenAiEmbeddingRequest.kt
data class OpenAiEmbeddingRequest(
    val model: String = "text-embedding-3-small",
    val input: String,  // or List<String> for batch
    val dimensions: Int? = null  // optional: truncate to fewer dims
)

// models/knowledge/OpenAiEmbeddingResponse.kt
data class OpenAiEmbeddingResponse(
    val data: List<EmbeddingObject>,
    val model: String,
    val usage: EmbeddingUsage
)
data class EmbeddingObject(val embedding: List<Float>, val index: Int)
data class EmbeddingUsage(val promptTokens: Int, val totalTokens: Int)
```

**Confidence for this pattern: HIGH** — Based on direct inspection of the codebase and the OpenAI Embeddings API spec, which has been stable since 2023.

#### 3. pgvector PostgreSQL Extension (Database-level)

| Component | Version | Notes |
|-----------|---------|-------|
| pgvector extension | 0.7.x or 0.8.x | Must be installed on the PostgreSQL server instance. Not a JVM dependency — must be present on the database server. For Supabase-hosted PostgreSQL, pgvector is pre-installed. |

**Confidence: HIGH** — Supabase has included pgvector as a pre-installed extension since 2023. Enabling it only requires `CREATE EXTENSION IF NOT EXISTS vector;`.

---

## No New Dependencies Required

The following capabilities are covered by existing stack:

| Need | Covered By | Notes |
|------|------------|-------|
| HTTP calls to OpenAI | `spring-boot-starter-webflux` (WebClient) | Already present. |
| Embedding metadata as JSONB | `hypersistence-utils-hibernate-63` | Already present. |
| Batch job scheduling / queue polling | ShedLock + `@Scheduled` | Already present. Same pattern as `WorkflowExecutionDispatcherService`. |
| Transaction management | Spring Data JPA | Already present. REQUIRES_NEW propagation for queue processing. |
| Distributed locking | ShedLock 7.5.0 | Already present. |
| Workflow orchestration | Temporal SDK 1.24.1 | Already present. |
| Configuration properties binding | `@ConfigurationProperties` | Already present. For `OPENAI_API_KEY` env var. |

---

## pgvector JPA Integration — Detailed Patterns

### Column Type Mapping

text-embedding-3-small produces 1536-dimensional vectors. Declare the column as `vector(1536)`:

```sql
-- In db/schema/01_tables/knowledge.sql
CREATE TABLE entity_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    entity_type_key TEXT NOT NULL,
    embedding vector(1536),
    semantic_text TEXT,         -- the enriched text that was embedded
    semantic_version INT NOT NULL DEFAULT 1,
    embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Index Selection

For semantic similarity search (cosine distance), use HNSW:

```sql
-- In db/schema/02_indexes/knowledge_indexes.sql
-- HNSW index for cosine similarity (recommended over IVFFlat)
CREATE INDEX idx_entity_embeddings_vector
    ON entity_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Supporting indexes for filtered search
CREATE INDEX idx_entity_embeddings_workspace ON entity_embeddings(workspace_id);
CREATE INDEX idx_entity_embeddings_entity_type ON entity_embeddings(workspace_id, entity_type_key);
```

**Why HNSW over IVFFlat:**
- HNSW does not require a training phase (`SELECT ivfflat_training(...)` before insert)
- HNSW supports incremental inserts without index degradation
- HNSW is better for datasets under ~1M vectors (this use case)
- IVFFlat only wins at very large scale with careful tuning

**Confidence: HIGH** — This matches pgvector documentation as of 0.6/0.7.

### Similarity Query Pattern

For workspace-scoped nearest-neighbor search (JPQL cannot express vector operators — use native SQL):

```kotlin
// In repository/knowledge/EntityEmbeddingRepository.kt
@Query(
    value = """
        SELECT e.* FROM entity_embeddings e
        WHERE e.workspace_id = :workspaceId
          AND e.entity_type_key = :entityTypeKey
        ORDER BY e.embedding <=> CAST(:queryVector AS vector)
        LIMIT :limit
    """,
    nativeQuery = true
)
fun findSimilar(
    workspaceId: UUID,
    entityTypeKey: String,
    queryVector: String,   // pass as pgvector string format: "[0.1, 0.2, ...]"
    limit: Int
): List<EntityEmbeddingEntity>
```

The `<=>` operator is cosine distance in pgvector. Use `<->` for L2, `<#>` for negative inner product.

**Note on native query:** JPQL cannot represent pgvector's `<=>` operator. Native SQL is required here. This aligns with the project rule: "Reserve native SQL for cases where JPQL is genuinely insufficient" — this is exactly that case.

### H2 Compatibility for Unit Tests

**Critical:** H2 does not support `vector(N)` column type. Unit tests (`@SpringBootTest` with H2) will fail if any entity with a `vector` column is included in the Spring context scan.

**Mitigation options:**

1. **Column definition workaround** — Use `columnDefinition = "vector(1536)"` in `@Column`, and in `application-test.yml` set `spring.jpa.properties.hibernate.dialect` to a custom dialect that maps `vector` to `text`. This is fragile.

2. **Recommended: Exclude from unit test context** — Keep `EntityEmbeddingEntity` and its repository out of unit test `classes = [...]` loading. Integration tests (Testcontainers PostgreSQL) will validate pgvector behavior. Unit tests for the enrichment services mock the embedding repository.

3. **Integration test coverage** — pgvector behavior (index creation, similarity search) must be validated via integration tests with `@ActiveProfiles("integration")` and the Testcontainers PostgreSQL container. The Testcontainers PostgreSQL image (`postgres:16`) does NOT include pgvector by default — use `ankane/pgvector` image instead:

```kotlin
// In integration test base class
companion object {
    @Container
    @JvmStatic
    val postgres = PostgreSQLContainer("ankane/pgvector:pg16")  // NOT postgres:16
        .withDatabaseName("riven_test")
}
```

**Confidence: HIGH for the H2 incompatibility. MEDIUM for the ankane/pgvector image name** — verify the exact image tag at Docker Hub before use.

---

## Temporal Workflow Patterns for Batch Embedding

The existing Temporal implementation (`WorkflowOrchestration` / `WorkflowOrchestrationService`) is a model for the enrichment pipeline. The enrichment pipeline follows the same patterns with adaptations for batch processing.

### Pattern: Parent-Child Workflow for Batch Re-embedding

For re-embedding after schema changes (batches of ~100 entities):

```
EnrichmentBatchWorkflow (parent)
  ├── EnrichmentBatchActivity (child, processes 100 entities)
  │     ├── BuildEnrichedTextActivity (per entity)
  │     ├── OpenAiEmbeddingActivity (per entity, or batched)
  │     └── PersistEmbeddingActivity (per entity)
  └── RecordMigrationProgressActivity
```

**Why parent-child:** Large re-embedding jobs (1000+ entities) should not run as a single activity with a 15-minute timeout. Child workflows provide independent retry, independent progress tracking, and avoid Temporal's workflow history size limits.

**Temporal constraints to respect (from existing code patterns):**
- Workflow implementations must be deterministic — no UUID.randomUUID(), no System.currentTimeMillis(), no DB calls, no HTTP calls in the workflow class itself
- All DB and HTTP operations (OpenAI calls) go through activities
- Each activity gets `StartToCloseTimeout` (e.g., 2 minutes per batch of 100)
- Use `Workflow.sideEffect()` for any configuration snapshot needed in the workflow (consistent with `WorkflowOrchestrationService` pattern)

**Activity registration:** Register enrichment activities on the existing `WORKFLOWS_DEFAULT_QUEUE` task queue, following the pattern in `TemporalWorkerConfiguration`. A separate queue (`activities.embeddings` or similar) could be used in future for rate-limit isolation, but V1 should use the existing queue to minimize new infrastructure.

### Pattern: Queue-Based Enrichment Trigger

The enrichment trigger follows the exact same pattern as `WorkflowExecutionDispatcherService`:

```
Entity mutation
  → Write enrichment_queue record (PENDING)
  → @Scheduled dispatcher polls (ShedLock)
  → Claim batch (FOR UPDATE SKIP LOCKED)
  → For each item: launch Temporal EnrichmentWorkflow
```

This is a well-proven pattern in this codebase. No new queueing infrastructure is needed.

### OpenAI Rate Limit Handling in Activities

The OpenAI Embeddings API has rate limits (tokens per minute, requests per minute). Handle this in the activity, not the workflow:

```kotlin
@ActivityImpl
class EmbeddingGenerationActivityImpl(...) : EmbeddingGenerationActivity {
    override fun generateEmbedding(entityId: UUID, enrichedText: String): FloatArray {
        // Activity retries handle transient failures including 429
        // Activity options in the workflow should set retry with doNotRetry on 4xx (except 429)
        return openAiClient.createEmbedding(enrichedText)
    }
}
```

Configure activity options in the workflow:
```kotlin
RetryOptions.newBuilder()
    .setMaximumAttempts(5)
    .setInitialInterval(Duration.ofSeconds(1))
    .setBackoffCoefficient(2.0)
    .setMaximumInterval(Duration.ofSeconds(60))  // cap at 1 minute for 429 backoff
    .setDoNotRetry(
        "HTTP_CLIENT_ERROR",   // 4xx excluding 429 (client errors won't self-heal)
        "VALIDATION_ERROR"
        // Note: 429 is NOT in doNotRetry — Temporal will retry it with backoff
    )
    .build()
```

**Confidence: HIGH** — This matches the existing `WorkflowOrchestrationService` retry pattern exactly.

---

## Alternatives Considered and Rejected

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Vector store | pgvector (existing PostgreSQL) | Pinecone, Weaviate, Qdrant | Dedicated vector DBs add infrastructure complexity. pgvector on Supabase PostgreSQL is sufficient for this scale. Project constraints explicitly require pgvector. |
| OpenAI client | WebClient (thin wrapper) | `openai-java` SDK (com.openai:openai-java) | SDK uses OkHttp, duplicates WebClient. Overkill for a single endpoint. Project prefers minimal, intentional dependencies. |
| OpenAI client | WebClient (thin wrapper) | Spring AI (`spring-ai-openai`) | Spring AI is opinionated about the full AI stack and 1.0 was released Q1 2025 — API stability is uncertain. The project does not need the full Spring AI abstraction layer (prompt templates, chat memory, RAG pipelines). A thin HTTP wrapper is sufficient and predictable. |
| Embedding model | text-embedding-3-small | text-embedding-3-large, Ada-002 | Project constraints specify text-embedding-3-small. Small produces 1536-dim vectors. Large produces 3072-dim vectors (double storage cost, marginal quality improvement at this use case scale). Ada-002 is deprecated. |
| Batch job executor | Temporal (existing) | Spring Batch | Spring Batch is a new dependency with its own schema requirements and operational overhead. Temporal is already present and well-understood in this codebase. |
| Queue implementation | PostgreSQL + `@Scheduled` (existing pattern) | RabbitMQ, Kafka, Redis Streams | The existing `workflow_execution_queue` pattern with ShedLock works correctly and has no new infrastructure dependencies. Adding a message broker for this use case would be disproportionate. |

---

## Environment Variables Required

| Variable | Purpose | Notes |
|----------|---------|-------|
| `OPENAI_API_KEY` | OpenAI API authentication | New. Platform-level key. Never workspace-scoped per project constraints. |

All other required variables are already present in the existing application bootstrap.

---

## Installation (Additions to build.gradle.kts)

```kotlin
// Vector type support for pgvector columns (Hibernate/JPA mapping)
implementation("com.pgvector:pgvector:0.1.6")  // VERIFY version at Maven Central before use
```

That is the only new Maven dependency. Everything else reuses existing stack.

**Confidence note on version:** 0.1.6 was the stable release as of early 2025. The library follows semantic versioning. If a newer patch version exists, prefer it. The API is stable across 0.1.x.

---

## Sources

- Codebase direct inspection: `/home/jared/dev/worktrees/entity-semantics/core/build.gradle.kts`
- Codebase direct inspection: Existing Temporal patterns in `WorkflowOrchestrationService`, `WorkflowExecutionDispatcherService`, `TemporalWorkerConfiguration`
- Codebase direct inspection: Existing WebClient patterns in `NangoClientWrapper`, `NangoClientConfiguration`
- Codebase direct inspection: Existing JSONB patterns with `hypersistence-utils` in `EntityTypeEntity`, `ExecutionQueueEntity`
- Project constraints: `.planning/PROJECT.md` (explicit pgvector + text-embedding-3-small constraints)
- pgvector GitHub: https://github.com/pgvector/pgvector — HNSW index docs, operator docs
- pgvector-java GitHub: https://github.com/pgvector/pgvector-java — JPA integration patterns
- OpenAI Embeddings API: https://platform.openai.com/docs/api-reference/embeddings — stable since 2023
- Supabase pgvector docs: https://supabase.com/docs/guides/database/extensions/pgvector — pre-installed on Supabase
- Temporal docs: https://docs.temporal.io/develop/java — determinism rules, child workflows
- Docker Hub: https://hub.docker.com/r/ankane/pgvector — Testcontainers image for integration tests
