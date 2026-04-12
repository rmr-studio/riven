---
phase: 01-adapter-foundation
plan: 01
subsystem: ingestion
tags: [kotlin, adapter, jpa, enum, domain-models, testcontainers]

requires: []
provides:
  - RecordBatch data class (records, nextCursor, hasMore)
  - SourceRecord neutral DTO (externalId, payload, sourceMetadata)
  - SyncMode enum (POLL, CDC, PUSH, ONE_SHOT)
  - SchemaIntrospectionResult + TableSchema + ColumnSchema data classes
  - SourceType.CUSTOM_SOURCE enum value (JPA-round-trip verified)
affects: [01-02-interface, 01-03-nango-adapter, 03-postgres-adapter, 04-orchestrator]

tech-stack:
  added: []
  patterns:
    - Neutral adapter contract in models/ingestion/adapter/ (pure Kotlin, no JPA)
    - Testcontainers Postgres for entity round-trip tests (H2 cannot emulate
      pgvector/jsonb/reserved-word columns used by EntityTypeEntity)

key-files:
  created:
    - core/src/main/kotlin/riven/core/models/ingestion/adapter/RecordBatch.kt
    - core/src/main/kotlin/riven/core/models/ingestion/adapter/SourceRecord.kt
    - core/src/main/kotlin/riven/core/models/ingestion/adapter/SyncMode.kt
    - core/src/main/kotlin/riven/core/models/ingestion/adapter/SchemaIntrospectionResult.kt
    - core/src/test/kotlin/riven/core/models/ingestion/adapter/RecordBatchTest.kt
    - core/src/test/kotlin/riven/core/models/ingestion/adapter/SyncModeTest.kt
    - core/src/test/kotlin/riven/core/entity/entity/SourceTypeJpaRoundTripTest.kt
  modified:
    - core/src/main/kotlin/riven/core/enums/integration/SourceType.kt

key-decisions:
  - "Place SyncMode under models/ingestion/adapter/ (not enums/integration/) — describes adapter capability, not a persisted property"
  - "Use Testcontainers Postgres for the round-trip test — H2 fails on jsonb, pgvector, and reserved column names (value, key) used by EntityTypeEntity"
  - "SchemaIntrospectionResult kept deliberately minimal; Phase 3 extends with PK/FK metadata (PG-07)"

patterns-established:
  - "Adapter contract package: riven.core.models.ingestion.adapter — pure domain models, no JPA annotations"
  - "Entity round-trip tests use @SpringBootTest + @ActiveProfiles(integration) + Testcontainers, mirroring EntityQueryIntegrationTestBase"

requirements-completed: [ADPT-02, ADPT-03, ADPT-04]

duration: ~15min
completed: 2026-04-12
---

# Phase 01 Plan 01: Adapter Foundation Data Types Summary

**Neutral adapter contract types (RecordBatch, SourceRecord, SyncMode, SchemaIntrospectionResult) plus SourceType.CUSTOM_SOURCE enum with verified Postgres round-trip — the foundation every adapter in Phase 1-4 imports.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-12T17:33:00Z (approx)
- **Completed:** 2026-04-12T17:39:00Z (approx)
- **Tasks:** 3/3
- **Files modified:** 8 (4 main sources, 3 tests, 1 enum)

## Accomplishments

- Five new Kotlin data classes established as the neutral adapter contract (`RecordBatch`, `SourceRecord`, `SyncMode`, `SchemaIntrospectionResult`, and the nested `TableSchema`/`ColumnSchema`).
- `SourceType.CUSTOM_SOURCE` added and verified to round-trip through JPA on `EntityTypeEntity.sourceType` against real PostgreSQL via Testcontainers.
- Wave-0 TDD executed cleanly: RED commit proved tests exercise real behaviour, GREEN commits turned them all green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 failing tests (RED)** — `4a1cb6e8` (test)
2. **Task 2: Adapter data types (GREEN)** — `78751b98` (feat)
3. **Task 3: CUSTOM_SOURCE + JPA round-trip (GREEN)** — `135b6bc6` (feat)

_Task 1 is a test-only RED commit; Tasks 2+3 implement the production code that turns those tests green, so the classic TDD RED → GREEN cadence is preserved across the three atomic commits._

## Files Created/Modified

- `core/src/main/kotlin/riven/core/models/ingestion/adapter/RecordBatch.kt` — neutral fetchRecords result; nextCursor is opaque to the orchestrator.
- `core/src/main/kotlin/riven/core/models/ingestion/adapter/SourceRecord.kt` — source-agnostic record DTO (externalId + payload + optional sourceMetadata).
- `core/src/main/kotlin/riven/core/models/ingestion/adapter/SyncMode.kt` — four-value adapter capability enum (POLL, CDC, PUSH, ONE_SHOT).
- `core/src/main/kotlin/riven/core/models/ingestion/adapter/SchemaIntrospectionResult.kt` — introspection result plus `TableSchema` and `ColumnSchema`; Phase 3 will extend with PK/FK metadata.
- `core/src/main/kotlin/riven/core/enums/integration/SourceType.kt` — appended `CUSTOM_SOURCE` as the final value (preserves declaration order).
- `core/src/test/kotlin/riven/core/models/ingestion/adapter/RecordBatchTest.kt` — construction, destructuring, nullability tests.
- `core/src/test/kotlin/riven/core/models/ingestion/adapter/SyncModeTest.kt` — exactly-four-values and declaration-order assertions.
- `core/src/test/kotlin/riven/core/entity/entity/SourceTypeJpaRoundTripTest.kt` — Testcontainers-backed Postgres round-trip for CUSTOM_SOURCE.

## Decisions Made

- **SyncMode lives under `models/ingestion/adapter/`, not `enums/integration/`.** The enum describes adapter capability (how it emits records) rather than a persisted property, so it belongs with the neutral contract types.
- **Testcontainers Postgres for the round-trip test.** H2 could not materialise `EntityTypeEntity` because the schema uses `jsonb`, pgvector (`VECTOR` type from the embedding table sharing the entity scan), and the reserved-word column names `key` and `value`. Using the project's existing `integration` profile mirrors the `EntityQueryIntegrationTestBase` convention in core/CLAUDE.md.
- **`SchemaIntrospectionResult` kept minimal.** Only name / columns / typeLiteral / nullable for now. Phase 3 (PG-07) is the right time to extend with PK/FK metadata; front-loading it here would pollute the neutral contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched round-trip test from `@DataJpaTest` + H2 to `@SpringBootTest` + Testcontainers Postgres**
- **Found during:** Task 3 (JPA round-trip verification)
- **Issue:** The plan suggested H2 via the existing `test` profile. H2 failed three ways: (a) could not map pgvector's `VECTOR` type on `entity_embeddings`; (b) rejected the generated `enum(...)` column syntax Hibernate emits for large enums; (c) rejected reserved-word columns `key` and `value` in `entity_types` / `entity_attributes`.
- **Fix:** Re-authored the round-trip test using `@SpringBootTest(classes = SourceTypeJpaRoundTripTestConfig::class)` + `@ActiveProfiles("integration")` + Testcontainers Postgres, mirroring the established `EntityQueryIntegrationTestBase` pattern. Used `@EntityScan("riven.core.entity.entity")` to narrow entity discovery.
- **Files modified:** `core/src/test/kotlin/riven/core/entity/entity/SourceTypeJpaRoundTripTest.kt`
- **Verification:** `./gradlew test --tests "riven.core.entity.entity.SourceTypeJpaRoundTripTest"` passes (real Postgres 16).
- **Committed in:** `135b6bc6` (Task 3 commit).

**2. [Rule 1 - Bug] Strip factory-generated id before persist**
- **Found during:** Task 3
- **Issue:** `EntityFactory.createEntityType` defaults `id = UUID.randomUUID()`. Per core/CLAUDE.md, passing a pre-set id causes Spring Data's `save()` to call `merge()` instead of `persist()`, triggering `StaleObjectStateException`.
- **Fix:** Applied `.copy(id = null)` on the factory result in the round-trip test so JPA generates the id via `@GeneratedValue`.
- **Files modified:** `core/src/test/kotlin/riven/core/entity/entity/SourceTypeJpaRoundTripTest.kt`
- **Verification:** test passes; id is non-null after `saveAndFlush`.
- **Committed in:** `135b6bc6` (Task 3 commit, part of the test rewrite).

**3. [Rule 1 - Bug] Renamed one test to remove Windows-hostile character**
- **Found during:** Task 2 compile pass (Kotlin emitted a warning about `?` in a function name).
- **Issue:** Test name `` `nextCursor accepts String? nullable type` `` contained `?`, which can break filesystem paths on Windows and generated unfriendly class names.
- **Fix:** Renamed to `` `nextCursor accepts nullable String type` ``.
- **Files modified:** `core/src/test/kotlin/riven/core/models/ingestion/adapter/RecordBatchTest.kt`
- **Verification:** Kotlin warning gone; test still passes.
- **Committed in:** `135b6bc6` (Task 3 commit, bundled with other test-file changes).

---

**Total deviations:** 3 auto-fixed (2 Rule 1 — bugs/compat; 1 Rule 3 — blocking infra)
**Impact on plan:** All auto-fixes were necessary for the round-trip test to run at all or to match project conventions (factory-id rule, integration-profile testing). No scope creep — no production code outside the planned files changed.

## Issues Encountered

- Three H2-vs-Postgres compatibility failures cascaded (VECTOR → enum syntax → reserved words) while trying to use `@DataJpaTest`. Resolved by pivoting to Testcontainers per the established project convention.

## User Setup Required

None — no external service configuration required. (Docker must be running locally for Testcontainers, which is already required by other integration tests in the repo.)

## Next Phase Readiness

- Adapter contract types exist in `riven.core.models.ingestion.adapter` and compile.
- `SourceType.CUSTOM_SOURCE` persists correctly — Plan 03 (Nango adapter) and Phase 3 (Postgres adapter) can tag their `EntityType` rows without further schema work.
- Plan 01-02 (IngestionAdapter interface) can now import `RecordBatch`, `SourceRecord`, `SyncMode`, and `SchemaIntrospectionResult` unchanged.

## Self-Check: PASSED

Verified 2026-04-12:
- `core/src/main/kotlin/riven/core/models/ingestion/adapter/RecordBatch.kt` FOUND
- `core/src/main/kotlin/riven/core/models/ingestion/adapter/SourceRecord.kt` FOUND
- `core/src/main/kotlin/riven/core/models/ingestion/adapter/SyncMode.kt` FOUND
- `core/src/main/kotlin/riven/core/models/ingestion/adapter/SchemaIntrospectionResult.kt` FOUND
- `core/src/test/kotlin/riven/core/models/ingestion/adapter/RecordBatchTest.kt` FOUND
- `core/src/test/kotlin/riven/core/models/ingestion/adapter/SyncModeTest.kt` FOUND
- `core/src/test/kotlin/riven/core/entity/entity/SourceTypeJpaRoundTripTest.kt` FOUND
- `core/src/main/kotlin/riven/core/enums/integration/SourceType.kt` contains `CUSTOM_SOURCE` (grep confirmed)
- Commit `4a1cb6e8` FOUND (test commit)
- Commit `78751b98` FOUND (adapter types commit)
- Commit `135b6bc6` FOUND (CUSTOM_SOURCE + round-trip commit)
- `./gradlew test --tests "riven.core.models.ingestion.adapter.*" --tests "riven.core.entity.entity.SourceTypeJpaRoundTripTest"` → BUILD SUCCESSFUL
- `./gradlew compileKotlin compileTestKotlin` → BUILD SUCCESSFUL (no warnings)

---
*Phase: 01-adapter-foundation*
*Completed: 2026-04-12*
