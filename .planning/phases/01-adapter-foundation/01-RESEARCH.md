# Phase 1: Adapter Foundation - Research

**Researched:** 2026-04-12
**Domain:** Kotlin/Spring Boot ingestion contract layer (JPA + Temporal-adjacent)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Package placement**
- Interface + types under `riven/core/service/ingestion/adapter/` (new sub-package).
- Data classes (`RecordBatch`, `SyncMode`) under `riven/core/models/ingestion/adapter/` matching existing models/* layout.
- `service/ingestion/` stays focused on `EntityProjectionService` + `IdentityResolutionService` — unchanged.
- `NangoAdapter` goes in `service/ingestion/adapter/nango/` OR flat in `service/ingestion/adapter/` — planner's call.
- `NangoClientWrapper` stays put under `service/integration/`.

**Adapter lifecycle + registry**
- Adapters are stateless Spring beans, one per source type.
- Registry mechanism: Spring bean qualifier + `Map<SourceType, IngestionAdapter>` injection. `IngestionOrchestrator` (Phase 4) resolves adapter via map lookup by `SourceType`.
- Connection + credentials passed per call (not constructor-injected into adapter). Enables multi-tenant reuse of a single adapter bean.

**RecordBatch cursor encoding**
- `nextCursor: String?` is opaque and adapter-owned. Each adapter chooses its internal representation.
- Orchestrator treats cursor as a round-trip string — never parses, never interprets.
- `null` cursor on input = "start from the beginning."
- `null` cursor on output combined with `hasMore=false` = terminal state.

**Error signaling**
- Failures raised as typed exceptions (no Result<T> wrapper).
- Sealed exception hierarchy (names indicative):
  - `AdapterException` (abstract base)
  - `TransientAdapterException` → retryable
  - `FatalAdapterException` (base for non-retryable)
    - `AdapterAuthException`
    - `AdapterConnectionRefusedException`
    - `AdapterSchemaDriftException`
    - `AdapterUnavailableException` (persistent)
- Temporal RetryPolicy uses `FatalAdapterException` subtypes as non-retryable list. (Configured in Phase 4, not Phase 1.)

**NangoAdapter scope (Phase 1 stub)**
- `fetchRecords(cursor, limit)`: implemented, delegates to `NangoClientWrapper.fetchRecords`. Translates Nango errors to adapter exception hierarchy.
- `introspectSchema()`: throws `NotImplementedError` or typed `AdapterCapabilityNotSupportedException` — planner decides.
- `syncMode()`: returns `SyncMode.PUSH`.
- `@Component` with qualifier tied to `SourceType.INTEGRATION`. Registered in adapter bean map but NOT wired into live sync — `IntegrationSyncWorkflowImpl` continues to call `NangoClientWrapper` directly. Dead at runtime until a future unification phase pulls the trigger.

**SourceType enum change**
- Add `CUSTOM_SOURCE` to `riven/core/enums/integration/SourceType.kt`.
- JPA enum persistence already configured via `@Enumerated(STRING)`. No DB migration needed (column is `VARCHAR(50)`; declarative schema).

**Testing scope for Phase 1**
- Unit tests: contract tests on interface (via fake adapter), `NangoAdapter.fetchRecords` delegation test with mocked `NangoClientWrapper`, adapter registry wiring test (`Map<SourceType, IngestionAdapter>` contains INTEGRATION).
- JPA test: `EntityTypeEntity` round-trips `SourceType.CUSTOM_SOURCE`.
- No integration tests in this phase.

### Claude's Discretion

- Exact sealed-exception class names and the package they live in (`adapter/exception/` vs flat).
- Whether `NangoAdapter` sub-package exists or class sits flat in `service/ingestion/adapter/`.
- Naming of the `@Qualifier` values (e.g. `SourceTypeAdapter("INTEGRATION")` vs Spring's `@Qualifier("integration")`).
- KLogger usage in `NangoAdapter`.
- Whether `AdapterCapabilityNotSupportedException` is a distinct type or just a message on `FatalAdapterException`.

### Deferred Ideas (OUT OF SCOPE)

- Wiring `NangoAdapter` into live integration sync — Phase 4+ / dedicated unification phase.
- `introspectSchema()` implementation for Nango — later phase.
- CDC / CSV / webhook adapter implementations — v2.
- `IngestionOrchestrator` and `Map<SourceType, IngestionAdapter>` consumption — Phase 4.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADPT-01 | `IngestionAdapter` interface defines `introspectSchema()`, `fetchRecords(cursor, limit)`, `syncMode()` | Kotlin `interface` in `service/ingestion/adapter/`; uses existing Spring `@Component` + constructor-injection pattern (core/CLAUDE.md). |
| ADPT-02 | `RecordBatch` data class with `records`, `nextCursor`, `hasMore` | `data class` in `models/ingestion/adapter/`; mirrors `ProjectionResult.kt` / `ResolutionResult.kt` layout. Cursor is `String?` per locked decision. |
| ADPT-03 | `SyncMode` enum: POLL, CDC, PUSH, ONE_SHOT | `enum class` in `enums/integration/` or `models/ingestion/adapter/` — see Discretion below. Matches existing enum convention (`SourceType.kt`). |
| ADPT-04 | `SourceType` enum extended with `CUSTOM_SOURCE` | Single-line add to `SourceType.kt`. Column is `VARCHAR(50) DEFAULT 'USER_CREATED'` with `@Enumerated(STRING)` → no DB schema change required; declarative schema (no migrations). |
| ADPT-05 | `NangoAdapter` thin wrapper delegates to Nango fetch path (not wired into live sync) | Implemented with `NangoClientWrapper.fetchRecords(...)` delegation; `NangoRecordsPage` → `RecordBatch` translation. Registered as `@Component` in `Map<SourceType, IngestionAdapter>`. Live `IntegrationSyncWorkflowImpl` untouched. |
</phase_requirements>

## Summary

Phase 1 is a pure foundation phase: introduce contract types that enable future polyglot ingestion without changing any runtime behavior. All work is Kotlin + Spring Boot 3.5 + JPA inside the existing monorepo. There are **no new dependencies**, **no DB migrations**, and **no runtime wiring changes**. Every required pattern already exists in the codebase — this phase is primarily about disciplined scaffolding in the correct packages.

The highest-risk area is the `NangoAdapter` delegation surface, because `NangoClientWrapper.fetchRecords(...)` has a **richer signature** than the `IngestionAdapter.fetchRecords(cursor, limit)` contract — it requires `providerConfigKey`, `connectionId`, `model`, and `modifiedAfter`. Phase 1 solves this by passing adapter call-context (connection + credentials + model) per-invocation, as explicitly locked in CONTEXT.md. The planner must decide how this context is shaped (typed wrapper vs. method overload vs. per-adapter context object); see Open Questions.

**Primary recommendation:** Scaffold the interface, data classes, enum values, sealed exception tree, and `NangoAdapter` delegate in the exact packages named in CONTEXT.md. Add a JPA round-trip test for `SourceType.CUSTOM_SOURCE` against H2 (`application-test.yml`, `ddl-auto: create-drop`). Use `@Qualifier` and Spring's native `Map<SourceType, IngestionAdapter>` bean-collection injection — supported natively by Spring and documented at `core/CLAUDE.md:155`.

## Standard Stack

### Core (all already present in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kotlin | 2.1.21 | Language | Established — `data class`, sealed hierarchy, enum |
| Spring Boot | 3.5.3 | DI / beans | Established — `@Component`, `@Qualifier`, constructor injection |
| Spring Data JPA + Hibernate | 6.x | Enum persistence | `@Enumerated(EnumType.STRING)` already used on `EntityTypeEntity.sourceType` |
| Hypersistence JSONB | existing | Not used in Phase 1 | N/A — no new entities |
| KotlinLogging (oshai) | existing | Logging | Inject `KLogger` via constructor per `core/CLAUDE.md:31` |
| JUnit 5 + mockito-kotlin | existing | Testing | Project standard; `whenever`/`verify` preferred over `Mockito.when` |
| H2 (PostgreSQL mode) | existing | Unit test DB | `application-test.yml`, `ddl-auto: create-drop` — fine for JPA round-trip of the new enum value |

**No new dependencies.** Per `core/CLAUDE.md` Always-Perform list: "Discuss any new dependency before adding it."

### Supporting

Nothing new. All behaviors leverage existing infra:

- `NangoClientWrapper.fetchRecords(...)` → existing sync entry point for Nango
- `NangoRecordsPage` + `NangoRecord` → source DTOs for delegation mapping
- `NangoApiException`, `TransientNangoException`, `RateLimitException` → existing Nango exceptions we translate into the new adapter hierarchy
- `ServiceUtil.findOrThrow { ... }` → not needed in Phase 1 (no repository lookups)

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sealed exception class tree | `Result<T>` wrapper | Rejected in CONTEXT.md — Kotlin `Result` doesn't compose with Temporal's retry semantics (Temporal inspects thrown exception types); service layer already throws domain exceptions. |
| `Map<SourceType, IngestionAdapter>` via Spring | Manual `AdapterRegistry` class with `@PostConstruct` population | Rejected — Spring natively injects `Map<QualifierValue, Bean>` when given bean name = qualifier string. Lower ceremony. |
| Adapter constructor-injects credentials | Per-call context object | Rejected in CONTEXT.md — stateless beans reusable across workspaces/tenants. |
| Single `AdapterException` with `.fatal` boolean | Sealed class hierarchy | Sealed hierarchy gives Temporal's `RetryOptions.setDoNotRetry(...)` a first-class type list. Kotlin `when` exhaustiveness benefit. |

**Installation:** none.

## Architecture Patterns

### Recommended Project Structure

```
core/src/main/kotlin/riven/core/
├── service/ingestion/
│   ├── EntityProjectionService.kt          # existing, unchanged
│   ├── IdentityResolutionService.kt        # existing, unchanged
│   └── adapter/
│       ├── IngestionAdapter.kt             # NEW — interface (ADPT-01)
│       ├── exception/
│       │   ├── AdapterException.kt         # NEW — sealed base
│       │   ├── TransientAdapterException.kt
│       │   └── FatalAdapterException.kt    # + subclasses
│       └── nango/
│           └── NangoAdapter.kt             # NEW — @Component, delegates (ADPT-05)
├── models/ingestion/
│   ├── ProjectionResult.kt                 # existing
│   ├── ResolutionResult.kt                 # existing
│   └── adapter/
│       ├── RecordBatch.kt                  # NEW — data class (ADPT-02)
│       └── SyncMode.kt                     # NEW — enum (ADPT-03)
└── enums/integration/
    └── SourceType.kt                       # MODIFIED — add CUSTOM_SOURCE (ADPT-04)
```

Notes:
- `exception/` sub-package is Claude's discretion per CONTEXT.md — recommended over flat to prevent clutter in `adapter/`.
- `nango/` sub-package is Claude's discretion — recommended so future `postgres/`, `csv/`, `cdc/` adapters each get their own package without needing a later move.
- `SyncMode` placement: the enum describes adapter capability, not persistence. CONTEXT.md says models/ingestion/adapter/. Recommended — keep with RecordBatch.

### Pattern 1: Kotlin interface with constructor-injected Spring @Component implementations

**What:** Plain Kotlin `interface` with methods; each source type provides a `@Component` class implementing it. Spring wires them as a `Map<SourceType, IngestionAdapter>` where keys come from a qualifier matching `SourceType.name`.

**When to use:** Always, for any polyglot dispatch in this codebase — it's the documented convention.

**Example:**
```kotlin
// service/ingestion/adapter/IngestionAdapter.kt
interface IngestionAdapter {
    fun syncMode(): SyncMode
    fun introspectSchema(context: AdapterCallContext): SchemaIntrospectionResult
    fun fetchRecords(context: AdapterCallContext, cursor: String?, limit: Int): RecordBatch
}

// service/ingestion/adapter/nango/NangoAdapter.kt
@Component
@SourceTypeAdapter(SourceType.INTEGRATION)   // or @Qualifier("INTEGRATION")
class NangoAdapter(
    private val nangoClientWrapper: NangoClientWrapper,
    private val logger: KLogger,
) : IngestionAdapter { /* ... */ }
```

**How Spring builds the registry** — in Phase 4's `IngestionOrchestrator`:
```kotlin
@Service
class IngestionOrchestrator(
    private val adapters: Map<SourceType, IngestionAdapter>,  // Spring auto-populates
) { /* ... */ }
```
This requires each `@Component` to be registered with a bean name equal to the enum value, OR use a custom meta-annotation + `BeanFactoryPostProcessor`, OR use a `@Configuration` `@Bean` method that assembles the map explicitly. See Open Question #1.

### Pattern 2: Data class domain models paired with JPA enum persistence

**What:** `RecordBatch` and `SyncMode` are pure domain types — no JPA, no `toModel()`. They sit alongside `ProjectionResult` / `ResolutionResult`.

**When to use:** For any ingestion-pipeline value carried between services. The `toModel()` pattern only applies to JPA entities.

**Example:**
```kotlin
// models/ingestion/adapter/RecordBatch.kt
data class RecordBatch(
    val records: List<SourceRecord>,   // shape TBD — see Open Q #2
    val nextCursor: String?,
    val hasMore: Boolean,
)

// models/ingestion/adapter/SyncMode.kt
enum class SyncMode { POLL, CDC, PUSH, ONE_SHOT }
```

### Pattern 3: Sealed exception hierarchy for retry classification

**What:** Abstract `AdapterException : RuntimeException`, with `TransientAdapterException` and `FatalAdapterException` as sealed subtypes. Fatal has its own sealed sub-tree (`AdapterAuthException`, etc.). Temporal's `RetryOptions.Builder.setDoNotRetry(*fatalClassNames)` uses the leaf class names.

**When to use:** Any service boundary the orchestrator calls where transient vs fatal is meaningful. Here: every adapter call.

**Example:**
```kotlin
// service/ingestion/adapter/exception/AdapterException.kt
sealed class AdapterException(message: String, cause: Throwable? = null)
    : RuntimeException(message, cause)

class TransientAdapterException(message: String, cause: Throwable? = null)
    : AdapterException(message, cause)

sealed class FatalAdapterException(message: String, cause: Throwable? = null)
    : AdapterException(message, cause)

class AdapterAuthException(message: String, cause: Throwable? = null)
    : FatalAdapterException(message, cause)
// ...etc
```

### Anti-Patterns to Avoid

- **Embedding `connectionId`/credentials in adapter constructor** — breaks multi-tenancy reuse. Pass per-call (CONTEXT.md locked).
- **Parsing cursor values in the orchestrator** — opaque string round-trip only (CONTEXT.md locked).
- **`companion object { val logger = KotlinLogging.logger {} }`** — project standard is constructor-injected `KLogger` (`core/CLAUDE.md:31`). `NangoClientWrapper` currently uses `KotlinLogging.logger {}` — this is a known inconsistency (#6 in `core/CLAUDE.md`). Do NOT mirror that mistake in `NangoAdapter`; inject `KLogger`.
- **Wiring `NangoAdapter` into `IntegrationSyncWorkflowImpl`** — EXPLICITLY OUT OF SCOPE (CONTEXT.md + Phase success criterion #4).
- **Adding a Flyway/Liquibase migration for `CUSTOM_SOURCE`** — project has no migration tooling (`core/CLAUDE.md:105`). The column is `VARCHAR(50) DEFAULT 'USER_CREATED'` — no schema edit needed.
- **Using `!!` on the enum value** — `id!!` ban applies generally to nullable ID assertions; use `requireNotNull` elsewhere in the codebase. Not directly relevant here but good to keep top-of-mind for adapter code.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Registry of adapters keyed by enum | Custom `AdapterRegistry` class with manual `@PostConstruct` population | Spring's native `Map<K, Bean>` injection (keys = bean names / qualifier values) | Spring Boot natively supports this; documented, zero ceremony. |
| Retry classification flags | `class AdapterException(val fatal: Boolean)` | Sealed subtypes (`TransientAdapterException` / `FatalAdapterException`) | Temporal's `setDoNotRetry` takes class names; sealed types also give Kotlin `when`-exhaustiveness. |
| Cursor parsing/serializing | `object CursorCodec { fun encode(...) / decode(...) }` | Opaque `String?` — each adapter owns its internal format | CONTEXT.md locked decision. Future-proofs CDC (LSN), CSV (offset), webhook (seq). |
| Nango error → adapter error mapping | Reflection or dynamic dispatch | Explicit `try/catch` + `when` in `NangoAdapter.fetchRecords` | Five existing Nango exception types (`NangoApiException`, `TransientNangoException`, `RateLimitException`, etc.) — trivial explicit mapping; keeps the translation audit-able. |
| DB enum type for `SourceType` | `CREATE TYPE source_type AS ENUM (...)` | Keep `VARCHAR(50)` + `@Enumerated(STRING)` | Already the project's approach; declarative-schema workflow has no migration path for ALTER TYPE. |

**Key insight:** Every capability this phase needs is already in the Spring + Kotlin toolchain. The "work" is entirely package placement and type discipline.

## Common Pitfalls

### Pitfall 1: `@Enumerated(EnumType.STRING)` column length too small
**What goes wrong:** New enum value `CUSTOM_SOURCE` (13 chars) fits inside `VARCHAR(50)` easily. But future adapters adding longer names could hit the 50-char cap silently.
**Why it happens:** H2 in test (`ddl-auto: create-drop`) regenerates the column from `@Column` metadata; production uses the declarative SQL file. They can diverge.
**How to avoid:** Verify in the JPA round-trip test that reading back `SourceType.CUSTOM_SOURCE` returns `CUSTOM_SOURCE` literally. 13 chars — safe.
**Warning signs:** `DataIntegrityViolationException` on insert; truncated values on read.

### Pitfall 2: Spring's `Map<K, V>` bean injection uses bean names, not qualifier types, by default
**What goes wrong:** A naive `Map<SourceType, IngestionAdapter>` injection doesn't work because Spring populates the map with **bean-name-keyed** entries (`Map<String, IngestionAdapter>`). `SourceType` as key requires a mapping step.
**Why it happens:** Spring's `DefaultListableBeanFactory` constructs bean-name maps out of the box; an enum-keyed map needs explicit conversion.
**How to avoid:** Either
  (a) Define a `@Configuration @Bean` factory method: `fun sourceTypeAdapterMap(adapters: List<IngestionAdapter>): Map<SourceType, IngestionAdapter>` that assembles from a marker annotation (e.g. `@SourceTypeAdapter(SourceType.INTEGRATION)`), OR
  (b) Use `Map<String, IngestionAdapter>` keyed by `SourceType.name` — simpler, less type-safe.
**Warning signs:** `UnsatisfiedDependencyException` on startup; empty map; wrong adapter resolved.

**Recommendation:** Planner chooses (a) via custom annotation OR (b) via plain string keys — the former is more idiomatic; the latter is lower cost for Phase 1. Phase 4's `IngestionOrchestrator` is where the consumer lives, so Phase 1 can stop at simply ensuring the `@Component` is registered with a stable qualifier.

### Pitfall 3: `NangoAdapter` signature mismatch with `IngestionAdapter`
**What goes wrong:** `IngestionAdapter.fetchRecords(cursor, limit)` hides the fact that Nango needs `providerConfigKey`, `connectionId`, `model`, and optional `modifiedAfter`. If the interface doesn't surface a context parameter, `NangoAdapter` has nowhere to source those.
**Why it happens:** Classic OO trap — the "simplest" interface omits per-source context.
**How to avoid:** Decide on a neutral `AdapterCallContext` (or similar) passed to every method. For Nango it carries provider config + connection ID + model; for future Postgres it carries connection + table; for CSV it carries a file handle, etc. This was implied (not explicitly specified) in CONTEXT.md under "Connection + credentials passed per call."
**Warning signs:** Compile error when implementing `NangoAdapter`; temptation to inject `connectionId` into the constructor (explicitly forbidden).

### Pitfall 4: `introspectSchema()` returns an undefined type
**What goes wrong:** ADPT-01 requires the method to exist, but the shape of the returned schema is not specified. If returned type is wrong now, Phase 3 (`PostgresAdapter.introspectSchema()` via INFORMATION_SCHEMA) and Phase 7 (`/api/v1/custom-sources/connections/{id}/schema`) must either rework the contract or live with a bad shape.
**Why it happens:** Phase 1 has no consumer for `introspectSchema()`, so pressure to "just return something" is high.
**How to avoid:** Define a minimal but forward-compatible result type (tables + columns + types + nullable). Reference: PG-02 and MAP-01 are the future consumers. The planner should design the schema DTO in consultation with Phase 3 needs — even though no Phase 3 code exists yet.
**Warning signs:** Phase 3 has to break the contract; `PostgresAdapter` wraps its own shape; `NangoAdapter.introspectSchema()` throws but still needs a return type that matches.

### Pitfall 5: `NangoAdapter` accidentally imported/referenced by `IntegrationSyncActivitiesImpl`
**What goes wrong:** A lazy IDE import replaces a `NangoClientWrapper` call with `NangoAdapter`, silently wiring the stub into the live path. Success criterion #4 explicitly forbids this.
**Why it happens:** Both live under `service/` and both expose `fetchRecords`. Name overlap is high.
**How to avoid:** Verification step in Phase 1 completion: `grep -r "NangoAdapter" core/src/main` should show references only from (a) its own file and (b) any new `@Configuration` adapter-registry bean. Zero references from `IntegrationSyncActivitiesImpl` or `IntegrationSyncWorkflowImpl`.
**Warning signs:** Existing Nango integration tests start depending on `NangoAdapter` mocks.

### Pitfall 6: JPA test profile disagreement on H2 vs PostgreSQL
**What goes wrong:** Unit tests use H2 in PostgreSQL-compat mode with `ddl-auto: create-drop` — generated schema may not match `db/schema/01_tables/entities.sql` exactly. An enum value added to the Kotlin enum round-trips fine on H2, but a production-like test would require Testcontainers.
**Why it happens:** Project uses two test profiles: unit (H2, `create-drop`) and integration (`@ActiveProfiles("integration")`, Testcontainers Postgres, `ddl-auto: none` reading `db/schema/`).
**How to avoid:** For Phase 1, a unit-level JPA round-trip test using H2 is sufficient (the column is `VARCHAR(50)`, both profiles behave identically for a 13-char string). CONTEXT.md says "no integration tests — those start in Phase 2+" — honor that.
**Warning signs:** Round-trip test passes in unit but fails in integration.

## Code Examples

Patterns drawn from existing files in this codebase (HIGH confidence — all verified in-repo):

### Example 1: Enum with `@Enumerated(STRING)` persistence (existing pattern — add CUSTOM_SOURCE)
```kotlin
// enums/integration/SourceType.kt — AFTER change
enum class SourceType {
    USER_CREATED,
    INTEGRATION,
    IMPORT,
    API,
    WORKFLOW,
    IDENTITY_MATCH,
    TEMPLATE,
    PROJECTED,
    CUSTOM_SOURCE,   // NEW — Phase 1, ADPT-04
}
```
Mapped on `EntityTypeEntity.sourceType: SourceType` via `@Enumerated(EnumType.STRING)` (already present at lines 68-70 of `EntityTypeEntity.kt`). No DB schema change.

### Example 2: Data class in ingestion models package (mirrors `ProjectionResult`)
```kotlin
// models/ingestion/adapter/RecordBatch.kt
package riven.core.models.ingestion.adapter

data class RecordBatch(
    val records: List<SourceRecord>,
    val nextCursor: String?,
    val hasMore: Boolean,
)
```
(Shape of `SourceRecord` is an Open Question — see #2.)

### Example 3: NangoAdapter delegation skeleton
```kotlin
// service/ingestion/adapter/nango/NangoAdapter.kt
package riven.core.service.ingestion.adapter.nango

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.stereotype.Component
import riven.core.enums.integration.SourceType
import riven.core.exceptions.NangoApiException
import riven.core.exceptions.RateLimitException
import riven.core.exceptions.TransientNangoException
import riven.core.models.ingestion.adapter.RecordBatch
import riven.core.models.ingestion.adapter.SyncMode
import riven.core.service.integration.NangoClientWrapper
import riven.core.service.ingestion.adapter.IngestionAdapter
import riven.core.service.ingestion.adapter.exception.*

@Component
@SourceTypeAdapter(SourceType.INTEGRATION)   // custom qualifier annotation — see Open Q #1
class NangoAdapter(
    private val nangoClientWrapper: NangoClientWrapper,
    private val logger: KLogger,
) : IngestionAdapter {

    override fun syncMode(): SyncMode = SyncMode.PUSH

    override fun introspectSchema(context: AdapterCallContext): SchemaIntrospectionResult {
        throw AdapterCapabilityNotSupportedException(
            "Nango schema is derived from integration manifests, not runtime introspection"
        )
    }

    override fun fetchRecords(context: AdapterCallContext, cursor: String?, limit: Int): RecordBatch {
        val nangoContext = context.asNangoContext()   // shape TBD — see Open Q #2
        return try {
            val page = nangoClientWrapper.fetchRecords(
                providerConfigKey = nangoContext.providerConfigKey,
                connectionId      = nangoContext.connectionId,
                model             = nangoContext.model,
                cursor            = cursor,
                modifiedAfter     = nangoContext.modifiedAfter,
                limit             = limit,
            )
            RecordBatch(
                records    = page.records.map { it.toSourceRecord() },
                nextCursor = page.nextCursor,
                hasMore    = page.nextCursor != null,
            )
        } catch (e: RateLimitException)      { throw TransientAdapterException(e.message ?: "rate limit", e) }
        catch (e: TransientNangoException)   { throw TransientAdapterException(e.message ?: "transient Nango", e) }
        catch (e: NangoApiException)         { throw mapNangoApiException(e) }
    }

    private fun mapNangoApiException(e: NangoApiException): FatalAdapterException = when (e.statusCode) {
        401, 403 -> AdapterAuthException(e.message ?: "Nango auth failed", e)
        404      -> AdapterConnectionRefusedException(e.message ?: "Nango resource not found", e)
        else     -> AdapterUnavailableException(e.message ?: "Nango API error", e)
    }
}
```

### Example 4: Constructor-injected KLogger (per project standard — NOT companion object)
```kotlin
// Per core/CLAUDE.md:31 — inject KLogger via constructor
@Component
class NangoAdapter(
    private val nangoClientWrapper: NangoClientWrapper,
    private val logger: KLogger,   // prototype-scoped bean from LoggerConfig
) : IngestionAdapter { /* ... */ }
```

### Example 5: Unit test using `@SpringBootTest(classes = [...])` with `@MockitoBean`
```kotlin
// Source: project convention per core/CLAUDE.md:94
@SpringBootTest(classes = [NangoAdapter::class])
class NangoAdapterTest {
    @MockitoBean lateinit var nangoClientWrapper: NangoClientWrapper
    @Autowired   lateinit var subject: NangoAdapter

    @Test
    fun `fetchRecords delegates to NangoClientWrapper`() {
        whenever(nangoClientWrapper.fetchRecords(any(), any(), any(), any(), any(), any()))
            .thenReturn(NangoRecordsPage(records = emptyList(), nextCursor = null))
        val batch = subject.fetchRecords(ctx(), cursor = null, limit = 100)
        assertThat(batch.records).isEmpty()
        assertThat(batch.hasMore).isFalse()
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nango-direct orchestration in `IntegrationSyncActivitiesImpl` | Polyglot adapter contract (`IngestionAdapter`) | This phase | `NangoAdapter` is a thin wrapper parallel to the live path. No current code changes. |
| SourceType enum hardcoded to known SaaS pattern | `CUSTOM_SOURCE` value for any self-serve source | This phase | EntityTypeEntity accepts the new value immediately; no migration. |
| N/A | Sealed exception hierarchy mapped to Temporal retry classes | This phase | Phase 4 orchestrator gets first-class retry classification without string matching. |

**Deprecated/outdated:** None. Codebase currently supports Nango only; this phase is purely additive.

## Open Questions

1. **How is `Map<SourceType, IngestionAdapter>` populated?**
   - What we know: Spring can inject `Map<String, Bean>` by bean name. CONTEXT.md accepts a custom qualifier annotation (`@SourceTypeAdapter("INTEGRATION")`) or Spring's `@Qualifier("integration")`.
   - What's unclear: Does Phase 1 ship the annotation + `@Configuration` factory for the `Map<SourceType, _>`, or does it defer that to Phase 4?
   - Recommendation: Ship the `@SourceTypeAdapter(SourceType)` annotation + a `@Configuration` bean method `sourceTypeAdapterMap(beans: List<IngestionAdapter>)` that assembles from the annotation. That way, by end of Phase 1 the registry is live (with one INTEGRATION entry) and Phase 4 has nothing to invent. **Registry wiring test** (`Map<SourceType, IngestionAdapter>` contains INTEGRATION) is already required in CONTEXT.md testing scope — this implies the map must exist in Phase 1.

2. **What is the shape of `SourceRecord` inside `RecordBatch`?**
   - What we know: Nango returns `NangoRecord(_nango_metadata, payload: Map<String, Any?>)`. Postgres (Phase 3) will return typed column values. CSV (v2) returns strings.
   - What's unclear: Do we create a neutral `SourceRecord(externalId: String, fields: Map<String, Any?>, metadata: Map<String, Any?>?)` now, or defer until Phase 3?
   - Recommendation: Create a minimal neutral `SourceRecord` now. Phase 1's `NangoAdapter.fetchRecords` has to return `RecordBatch<SomeType>` — it can't return raw `NangoRecord` without coupling the contract to Nango. Minimal shape: `externalId: String`, `payload: Map<String, Any?>`, optional `sourceMetadata: Map<String, Any?>?`. Phase 3 extends — not breaks — this shape.

3. **What does `AdapterCallContext` look like?**
   - What we know: Must carry per-call context (connectionId + credentials + source-specific extras). Must support Nango (providerConfigKey + connectionId + model + modifiedAfter) and future Postgres (JDBC URL + credentials + table + updated_at cursor column).
   - What's unclear: Single data class with nullable fields vs sealed hierarchy (`NangoCallContext`, `PostgresCallContext`).
   - Recommendation: Sealed hierarchy. Interface method signatures take `AdapterCallContext` (sealed base); each adapter casts to its variant (or helper method like `context.asNangoContext()`). This avoids a Frankenstein DTO with half-present fields. Phase 1 ships the base + the Nango variant only.

4. **Does `introspectSchema()` throw `NotImplementedError` or a typed exception?**
   - What we know: CONTEXT.md offers both; planner decides.
   - Recommendation: Typed `AdapterCapabilityNotSupportedException : FatalAdapterException`. Using `NotImplementedError` (a JVM `Error`, not `Exception`) bypasses Temporal's retry classification entirely and will surface as a worker crash. Typed exception keeps the contract disciplined.

5. **Where does `SchemaIntrospectionResult` live?**
   - What we know: Required as return type of `introspectSchema()`. Phase 3 consumes it. Phase 1 needs to define the type.
   - Recommendation: `models/ingestion/adapter/SchemaIntrospectionResult.kt` with minimal shape (`tables: List<TableSchema>`, each with `columns: List<ColumnSchema>` carrying name + type-literal + nullable). Leave room for Phase 3 to extend (primary key info, FK info for PG-07). Explicitly flag in KDoc that the shape will grow.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 + mockito-kotlin (existing in project) |
| Config file | `application-test.yml` (H2 PostgreSQL-compat, `ddl-auto: create-drop`) |
| Quick run command | `./gradlew test --tests "riven.core.service.ingestion.adapter.*"` |
| Full suite command | `./gradlew test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ADPT-01 | `IngestionAdapter` interface contract callable from fake impl | unit | `./gradlew test --tests "IngestionAdapterContractTest"` | ❌ Wave 0 |
| ADPT-02 | `RecordBatch(records, nextCursor, hasMore)` constructs and is readable from services | unit | `./gradlew test --tests "RecordBatchTest"` | ❌ Wave 0 |
| ADPT-03 | `SyncMode` enum has exactly POLL, CDC, PUSH, ONE_SHOT | unit | `./gradlew test --tests "SyncModeTest"` | ❌ Wave 0 |
| ADPT-04 | `EntityTypeEntity` round-trips `SourceType.CUSTOM_SOURCE` through JPA | unit (JPA slice / `@SpringBootTest` H2) | `./gradlew test --tests "SourceTypeJpaRoundTripTest"` (or equivalent inside existing `EntityTypeRepositoryTest` if present) | ❌ Wave 0 |
| ADPT-05 | `NangoAdapter.fetchRecords` delegates to `NangoClientWrapper.fetchRecords`; error translation; `syncMode() == PUSH`; `introspectSchema()` throws typed exception | unit | `./gradlew test --tests "NangoAdapterTest"` | ❌ Wave 0 |
| Registry | `Map<SourceType, IngestionAdapter>` contains INTEGRATION → NangoAdapter | Spring context wiring test | `./gradlew test --tests "AdapterRegistryWiringTest"` | ❌ Wave 0 |
| Don't-regress | `IntegrationSyncWorkflowImpl` and `IntegrationSyncActivitiesImpl` unchanged at behavior level; existing Nango tests still green | unit (existing) | `./gradlew test --tests "riven.core.service.integration.*"` | ✅ existing |

**Manual-only verifications:**
- `grep -r "NangoAdapter" core/src/main/kotlin/riven/core/service/integration/` returns zero matches (enforces success criterion #4 — NangoAdapter not wired into live path). This is a one-line shell check; planner may wrap it in a test if desired but not required.

### Sampling Rate
- **Per task commit:** `./gradlew test --tests "riven.core.service.ingestion.adapter.*" --tests "riven.core.enums.integration.SourceTypeJpaRoundTripTest"` (fast, ~30s)
- **Per wave merge:** `./gradlew test` (full suite; ensures no Nango regression)
- **Phase gate:** `./gradlew build` + full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `core/src/test/kotlin/riven/core/service/ingestion/adapter/IngestionAdapterContractTest.kt` — covers ADPT-01 via fake adapter implementation
- [ ] `core/src/test/kotlin/riven/core/models/ingestion/adapter/RecordBatchTest.kt` — covers ADPT-02
- [ ] `core/src/test/kotlin/riven/core/models/ingestion/adapter/SyncModeTest.kt` — covers ADPT-03
- [ ] `core/src/test/kotlin/riven/core/entity/entity/SourceTypeJpaRoundTripTest.kt` (or extend existing `EntityTypeRepositoryTest`) — covers ADPT-04 via H2 save-and-read
- [ ] `core/src/test/kotlin/riven/core/service/ingestion/adapter/nango/NangoAdapterTest.kt` — covers ADPT-05 (happy path + each error translation branch)
- [ ] `core/src/test/kotlin/riven/core/service/ingestion/adapter/AdapterRegistryWiringTest.kt` — covers Spring-level registry composition
- [ ] No new factory files required — `RecordBatch` / `SyncMode` are plain data; `NangoAdapter` test constructs `NangoRecordsPage` directly (existing class). If `SourceRecord` is introduced, add `IngestionTestFactory.kt` under `service/util/factory/` per project rule (`core/CLAUDE.md:96`).
- [ ] No framework install — JUnit 5 + mockito-kotlin already in build.

## Sources

### Primary (HIGH confidence — all in-repo verification)
- `core/CLAUDE.md` — Architecture, coding standards, testing rules, enum persistence conventions
- `core/src/main/kotlin/riven/core/enums/integration/SourceType.kt` — existing enum, single-file modification target
- `core/src/main/kotlin/riven/core/entity/entity/EntityTypeEntity.kt` — existing `@Enumerated(EnumType.STRING)` on `sourceType` at lines 68-70
- `core/db/schema/01_tables/entities.sql` — `source_type VARCHAR(50) DEFAULT 'USER_CREATED'` at lines 24-25 and 66 (entity_types + entities tables)
- `core/src/main/kotlin/riven/core/service/integration/NangoClientWrapper.kt` — `fetchRecords(providerConfigKey, connectionId, model, cursor, modifiedAfter, limit): NangoRecordsPage`
- `core/src/main/kotlin/riven/core/models/integration/NangoRecordModels.kt` — `NangoRecordsPage`, `NangoRecord`, `NangoRecordMetadata`, `NangoRecordAction`
- `core/src/main/kotlin/riven/core/exceptions/IntegrationExceptions.kt` — `NangoApiException`, `TransientNangoException`, `RateLimitException`
- `core/src/main/kotlin/riven/core/service/integration/sync/IntegrationSyncWorkflowImpl.kt` — live sync path (must remain unchanged; verified imports)
- `core/src/main/kotlin/riven/core/service/ingestion/EntityProjectionService.kt` — existing ingestion-layer service style
- `core/src/main/kotlin/riven/core/models/ingestion/ProjectionResult.kt` — template for new `RecordBatch` / `SyncMode` data-class style
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` — upstream requirements + decisions
- `.planning/phases/01-adapter-foundation/01-CONTEXT.md` — locked phase decisions

### Secondary
- None needed — all authoritative information is in-repo or in upstream planning artifacts.

### Tertiary
- None needed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all already present, no new deps
- Architecture patterns: HIGH — every pattern verified in existing codebase files
- Pitfalls: HIGH — derived from in-repo conventions (`core/CLAUDE.md` + existing adapters/services) and explicit CONTEXT.md constraints
- Open Questions: documented where Phase 1 genuinely has scope latitude not locked by CONTEXT.md

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable domain; refresh only if core dependencies change)
