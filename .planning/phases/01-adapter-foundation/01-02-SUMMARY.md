---
phase: 01-adapter-foundation
plan: 02
subsystem: ingestion
tags: [kotlin, adapter, interface, sealed-hierarchy, spring-qualifier, exceptions]

requires:
  - RecordBatch / SourceRecord / SyncMode / SchemaIntrospectionResult (from 01-01)
  - SourceType enum (from 01-01)
provides:
  - IngestionAdapter interface (syncMode, introspectSchema, fetchRecords)
  - AdapterCallContext sealed base + NangoCallContext subtype
  - "@SourceTypeAdapter Spring qualifier annotation"
  - AdapterException sealed hierarchy (Transient + Fatal with 5 fatal leaves)
affects: [01-03-nango-adapter, 03-postgres-adapter, 04-orchestrator, 06-health]

tech-stack:
  added: []
  patterns:
    - Interface-first contract in service/ingestion/adapter/ (pure Kotlin, no Spring wiring)
    - Sealed AdapterCallContext hierarchy extended per integration (Nango now, Postgres in Phase 3)
    - Sealed FatalAdapterException tree consumed by Phase 4 Temporal do-not-retry set via sealedSubclasses reflection

key-files:
  created:
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/IngestionAdapter.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/AdapterCallContext.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/SourceTypeAdapter.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterException.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/TransientAdapterException.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/FatalAdapterException.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterAuthException.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterConnectionRefusedException.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterSchemaDriftException.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterUnavailableException.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterCapabilityNotSupportedException.kt
    - core/src/test/kotlin/riven/core/service/ingestion/adapter/IngestionAdapterContractTest.kt
  modified: []

key-decisions:
  - "NangoCallContext.workspaceId defaults to empty string in Phase 1 — NangoAdapter is registered but not runtime-wired; Phase 4 orchestrator will supply the real value. TODO comment on the field."
  - "@SourceTypeAdapter ships annotation-only in Plan 02; the @Configuration factory that assembles Map<SourceType, IngestionAdapter> lands in Plan 03 alongside NangoAdapter so the wiring has something to exercise."
  - "Sealed exception hierarchy distinguishes transient vs fatal via class types (no boolean flags) — Phase 4 Temporal wiring iterates FatalAdapterException::class.sealedSubclasses for setDoNotRetry."

patterns-established:
  - "Adapter interface package: riven.core.service.ingestion.adapter — contract + sealed context + qualifier live alongside each other; exception tree is a sub-package."
  - "Contract-level tests use inline private FakeAdapter impls — no Spring context, pure interface exercise, fast feedback."

requirements-completed: [ADPT-01]

duration: ~5min
completed: 2026-04-12
---

# Phase 01 Plan 02: IngestionAdapter Interface Summary

**Interface-first contract layer for polyglot ingestion: IngestionAdapter + sealed AdapterCallContext + @SourceTypeAdapter qualifier + sealed AdapterException hierarchy — ~11 new Kotlin files, zero runtime behaviour, every downstream adapter (Nango, Postgres) and the Phase 4 Temporal orchestrator compiles against these types.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-12T07:41:44Z
- **Completed:** 2026-04-12T07:43:39Z
- **Tasks:** 3/3
- **Files created:** 12 (11 main sources, 1 test)

## Accomplishments

- `IngestionAdapter` interface surfaces three methods (`syncMode`, `introspectSchema`, `fetchRecords`) using the neutral types from Plan 01-01.
- `AdapterCallContext` sealed base + `NangoCallContext` subtype define the per-call connection payload; designed to extend with `PostgresCallContext` in Phase 3 without source changes here.
- `@SourceTypeAdapter` Spring `@Qualifier` annotation is ready for Plan 03 to mark NangoAdapter as the `SourceType.INTEGRATION` binding.
- Full sealed `AdapterException` hierarchy: `AdapterException` (base) → `TransientAdapterException` + `FatalAdapterException` (sealed) → 5 concrete fatal leaves (Auth, ConnectionRefused, SchemaDrift, Unavailable, CapabilityNotSupported).
- Clean TDD cadence: RED (Task 1) proved the contract test fails against missing types; GREEN (Task 2) turned it green; Task 3 added the exception tree without disturbing the contract test.

## Task Commits

1. **Task 1 — Wave 0 failing contract test (RED):** `fd0b4d302` (test)
2. **Task 2 — IngestionAdapter + AdapterCallContext + @SourceTypeAdapter (GREEN):** `81f550c7b` (feat)
3. **Task 3 — Sealed AdapterException hierarchy:** `85fdd9eb4` (feat)

## Files Created/Modified

- `core/src/main/kotlin/riven/core/service/ingestion/adapter/IngestionAdapter.kt` — the three-method adapter contract.
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/AdapterCallContext.kt` — sealed base + `NangoCallContext` (providerConfigKey, connectionId, model, modifiedAfter, workspaceId with Phase-4 TODO).
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/SourceTypeAdapter.kt` — `@Qualifier` annotation binding a bean to a `SourceType`.
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterException.kt` — sealed base extending `RuntimeException`.
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/TransientAdapterException.kt` — retryable failure leaf.
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/FatalAdapterException.kt` — sealed intermediate base for non-retryable failures.
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterAuthException.kt` — 401/403/revoked-connection leaf.
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterConnectionRefusedException.kt` — host unreachable / 404-equivalent leaf.
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterSchemaDriftException.kt` — remote-schema-changed leaf (Phase 6 HLTH-04 will consume).
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterUnavailableException.kt` — persistent 5xx / unknown fatal leaf.
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterCapabilityNotSupportedException.kt` — unsupported capability leaf.
- `core/src/test/kotlin/riven/core/service/ingestion/adapter/IngestionAdapterContractTest.kt` — four tests, inline FakeAdapter, no Spring context.

## Decisions Made

- **`NangoCallContext.workspaceId` defaults to `""`.** Phase 1 does not wire NangoAdapter at runtime, so a default avoids forcing every Plan 02 consumer (the contract test, future Phase-3 fakes) to synthesise a workspace id. Phase 4 orchestrator will supply the real value; a `TODO Phase 4` KDoc flags the stub.
- **Annotation-only in Plan 02.** Deliberately did NOT ship the `@Configuration` class that assembles `Map<SourceType, IngestionAdapter>`. That factory needs at least one concrete adapter (NangoAdapter, Plan 03) to validate against, and keeping it out preserves single responsibility for this plan.
- **Sealed hierarchy over boolean flags.** Distinguishing transient vs fatal via leaf type (not `isRetryable: Boolean`) lets Phase 4 Temporal wiring iterate `FatalAdapterException::class.sealedSubclasses` for `setDoNotRetry(...)` — compile-time exhaustive and reflection-friendly.

## Deviations from Plan

None — plan executed exactly as written.

All three tasks (RED contract test, interface/context/qualifier creation, sealed exception tree) landed in their planned files with the planned content. No auto-fixes, no blockers, no architectural deviations. The contract test compiled-and-failed at RED as expected, then went green the moment Task 2 types landed.

## Issues Encountered

None. Compilation and tests passed first run after each GREEN step.

## User Setup Required

None — pure Kotlin types and annotations, zero runtime behaviour, no external dependencies.

## Next Phase Readiness

- **Plan 01-03 (NangoAdapter) can now import:**
  - `IngestionAdapter` (to implement), `NangoCallContext` (as the call-context parameter type), `@SourceTypeAdapter(SourceType.INTEGRATION)` (to tag the component), and the relevant `AdapterException` leaves (for error mapping).
  - It will also introduce the `@Configuration`-assembled `Map<SourceType, IngestionAdapter>` registry and its first wiring test.
- **Phase 3 (PostgresAdapter)** can extend `AdapterCallContext` with `PostgresCallContext` without touching Plan 02 code — the sealed base supports the pattern.
- **Phase 4 (Temporal orchestrator)** has the exception taxonomy it needs; `setDoNotRetry(*FatalAdapterException::class.sealedSubclasses.mapNotNull { it.qualifiedName }.toTypedArray())` will drive retry classification.

## Self-Check: PASSED

Verified 2026-04-12:
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/IngestionAdapter.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/AdapterCallContext.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/SourceTypeAdapter.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterException.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/TransientAdapterException.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/FatalAdapterException.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterAuthException.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterConnectionRefusedException.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterSchemaDriftException.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterUnavailableException.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/exception/AdapterCapabilityNotSupportedException.kt` FOUND
- `core/src/test/kotlin/riven/core/service/ingestion/adapter/IngestionAdapterContractTest.kt` FOUND
- Commit `fd0b4d302` FOUND (RED contract test)
- Commit `81f550c7b` FOUND (interface + context + qualifier)
- Commit `85fdd9eb4` FOUND (exception hierarchy)
- `./gradlew test --tests "riven.core.service.ingestion.adapter.IngestionAdapterContractTest"` → BUILD SUCCESSFUL (4 tests)
- `./gradlew compileKotlin compileTestKotlin` → BUILD SUCCESSFUL
- `grep -rn "class.*FatalAdapterException\b" core/src/main/kotlin/` → 6 hits (1 base + 5 concrete leaves)
- `grep -rn "NotImplementedError" core/src/main/kotlin/riven/core/service/ingestion/adapter/` → 0 hits

---
*Phase: 01-adapter-foundation*
*Completed: 2026-04-12*
