---
phase: 01-adapter-foundation
plan: 03
subsystem: ingestion
tags: [kotlin, adapter, nango, spring, component-scan, exception-translation]

requires:
  - IngestionAdapter interface (from 01-02)
  - NangoCallContext (from 01-02)
  - "@SourceTypeAdapter qualifier (from 01-02)"
  - AdapterException hierarchy (from 01-02)
  - RecordBatch / SourceRecord / SyncMode (from 01-01)
  - SourceType.INTEGRATION enum (pre-existing)
  - NangoClientWrapper + Nango exceptions (pre-existing)
provides:
  - "NangoAdapter @Component — first concrete IngestionAdapter impl"
  - "SourceTypeAdapterRegistry @Configuration — assembles Map<SourceType, IngestionAdapter>"
  - Nango → AdapterException translation rules (401/403 → Auth, 404 → ConnectionRefused, 5xx → Unavailable, RateLimit/Transient → Transient)
affects: [04-orchestrator, 06-health]

tech-stack:
  added: []
  patterns:
    - "Adapter annotation-driven registry: @SourceTypeAdapter + @Configuration map factory keyed by SourceType"
    - "Exception translation gate inside fetchRecords — wrapper exceptions never escape the adapter boundary"
    - "Parallel-but-dormant adapter: NangoAdapter exists and is wired into the registry, but IntegrationSyncWorkflowImpl remains byte-identical until Phase 4+"

key-files:
  created:
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/nango/NangoAdapter.kt
    - core/src/main/kotlin/riven/core/service/ingestion/adapter/SourceTypeAdapterRegistry.kt
    - core/src/test/kotlin/riven/core/service/ingestion/adapter/nango/NangoAdapterTest.kt
    - core/src/test/kotlin/riven/core/service/ingestion/adapter/AdapterRegistryWiringTest.kt
  modified:
    - core/src/test/kotlin/riven/core/service/ingestion/ProjectionPipelineIntegrationTestBase.kt

key-decisions:
  - "Use positional any()/anyOrNull() matchers in NangoAdapterTest — mockito-kotlin named-arg matchers interact poorly with NangoClientWrapper.fetchRecords default-value parameters"
  - "NangoCallContext.modifiedAfter (Instant?) is converted via toString() because NangoClientWrapper.fetchRecords accepts modifiedAfter: String? (Phase 4 can refine if needed)"
  - "Exclude NangoAdapter from ProjectionPipelineIntegrationTestConfig's @ComponentScan — the projection pipeline tests intentionally omit the Nango HTTP layer, so the adapter can't satisfy its NangoClientWrapper dependency there"

patterns-established:
  - "NangoRecord → SourceRecord mapping: externalId falls back to nangoMetadata.cursor when payload.id absent; sourceMetadata flattens NangoRecordMetadata fields"
  - "SourceTypeAdapterRegistry fail-fast: missing @SourceTypeAdapter annotation or duplicate SourceType registration throws at startup (error/require)"

requirements-completed: [ADPT-05]

duration: ~10min
completed: 2026-04-12
---

# Phase 01 Plan 03: NangoAdapter + Registry Summary

**First concrete IngestionAdapter (NangoAdapter) wraps the existing NangoClientWrapper behind the neutral adapter contract and registers itself as SourceType.INTEGRATION through a @Configuration-assembled Map<SourceType, IngestionAdapter> — Phase 1 capstone lands with the live Nango sync path completely untouched.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 3/3
- **Files created:** 4 (2 main sources, 2 tests)
- **Files modified:** 1 (test config exclude-filter)

## Accomplishments

- `NangoAdapter` delegates `fetchRecords` to `NangoClientWrapper.fetchRecords`, returns `SyncMode.PUSH`, and throws typed `AdapterCapabilityNotSupportedException` from `introspectSchema` (no `NotImplementedError`).
- Full Nango → adapter exception translation table wired and tested: `RateLimitException` + `TransientNangoException` → `TransientAdapterException`; `NangoApiException` 401/403 → `AdapterAuthException`, 404 → `AdapterConnectionRefusedException`, else → `AdapterUnavailableException`. Original cause preserved on every translation.
- `NangoRecord → SourceRecord` mapping handles both happy-path and metadata-only records (externalId falls back to `nangoMetadata.cursor` when `payload.id` is absent). `sourceMetadata` flattens Nango metadata for downstream lineage.
- `SourceTypeAdapterRegistry @Configuration` assembles `Map<SourceType, IngestionAdapter>` from annotated beans with fail-fast validation for missing/duplicate `@SourceTypeAdapter` qualifiers.
- Spring wiring verified: `AdapterRegistryWiringTest` boots a slice with `NangoAdapter` + `SourceTypeAdapterRegistry` and asserts the `Map<SourceType, IngestionAdapter>` bean contains exactly `{INTEGRATION → NangoAdapter}`.
- Live integration path untouched: zero `NangoAdapter` references in `service/integration/`; `IntegrationSyncWorkflowImpl` and `IntegrationSyncActivitiesImpl` byte-identical.

## Task Commits

1. **Task 1 — Wave 0 failing tests (RED):** `b8b208206` (test) — NangoAdapterTest + AdapterRegistryWiringTest compile-fail against missing classes.
2. **Task 2 — NangoAdapter + SourceTypeAdapterRegistry (GREEN):** `02f7bdd60` (feat) — 13 tests green.
3. **Task 3 — Projection-pipeline component-scan fix:** `c3042a45d` (fix) — 1,735 tests green, `./gradlew build` successful.

## Files Created/Modified

- `core/src/main/kotlin/riven/core/service/ingestion/adapter/nango/NangoAdapter.kt` — `@Component @SourceTypeAdapter(SourceType.INTEGRATION)` IngestionAdapter impl.
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/SourceTypeAdapterRegistry.kt` — `@Configuration` with `@Bean sourceTypeAdapterMap(List<IngestionAdapter>): Map<SourceType, IngestionAdapter>`.
- `core/src/test/kotlin/riven/core/service/ingestion/adapter/nango/NangoAdapterTest.kt` — 10 tests: syncMode, introspectSchema gate, delegation, record translation, 6-exception translation matrix.
- `core/src/test/kotlin/riven/core/service/ingestion/adapter/AdapterRegistryWiringTest.kt` — 3 tests: registry contains INTEGRATION, is NangoAdapter, size 1.
- `core/src/test/kotlin/riven/core/service/ingestion/ProjectionPipelineIntegrationTestBase.kt` — added `NangoAdapter::class` to `excludeFilters` so the projection tests that scan `riven.core.service.ingestion` skip the adapter (their config intentionally excludes the Nango HTTP layer, so `NangoClientWrapper` isn't available).

## Decisions Made

- **Positional matchers in NangoAdapterTest.** The initial test used named-arg `whenever(wrapper.fetchRecords(providerConfigKey = eq(...), …))` but Kotlin synthesises extra parameters for default values on `NangoClientWrapper.fetchRecords(..., cursor: String? = null, modifiedAfter: String? = null, limit: Int? = null)`, which desyncs Mockito's ordered matcher list and causes every stub to return null (NPE). Switching to positional `any<String>() / anyOrNull<String>() / anyOrNull<Int>()` stubs while keeping named-arg `eq()` in `verify(...)` resolved the issue. Documented for future adapter tests.
- **Stringifying `modifiedAfter` at the adapter boundary.** `NangoCallContext.modifiedAfter` is typed `Instant?` to keep the neutral contract clean, but `NangoClientWrapper.fetchRecords` already took `String?`. Using `.toString()` for the conversion matches Nango's ISO-8601 expectation without widening the Nango client signature; Phase 4 can refine if the orchestrator needs a specific format.
- **`externalId` fallback to `nangoMetadata.cursor`.** Not every Nango sync model surfaces an `id` field in the payload (some upstreams use alternative identifiers). Falling back to the Nango-managed cursor keeps identity stable until the orchestrator in Phase 4 introduces per-source identity mapping rules.
- **Adapter remains dormant in the live Nango path.** `IntegrationSyncWorkflowImpl` and `IntegrationSyncActivitiesImpl` were not edited — this is the explicit success criterion for Phase 1. `NangoAdapter` exists for the registry and for Phase 4+ consumption.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `NangoAdapter` to `ProjectionPipelineIntegrationTestConfig` exclude filters**
- **Found during:** Task 3 (full `./gradlew build` regression).
- **Issue:** `ProjectionPipelineIntegrationTestConfig` uses `@ComponentScan(basePackages = ["riven.core.service.ingestion", …])` but intentionally omits `riven.core.service.integration` (the Nango HTTP layer). With `NangoAdapter` landing in `riven.core.service.ingestion.adapter.nango`, the scan started picking it up and Spring failed to start both `CrossIntegrationProjectionTest` and `SingleIntegrationProjectionTest` with `No qualifying bean of type 'NangoClientWrapper'`.
- **Fix:** Appended `riven.core.service.ingestion.adapter.nango.NangoAdapter::class` to the existing `excludeFilters` list — the same pattern already used for `WorkflowExecutionQueueService`, `IdentityMatchQueueProcessorService`, and `IdentityMatchDispatcherService`.
- **Files modified:** `core/src/test/kotlin/riven/core/service/ingestion/ProjectionPipelineIntegrationTestBase.kt`.
- **Verification:** Both tests pass after fix; full build → `BUILD SUCCESSFUL` with 1,735 tests.
- **Committed in:** `c3042a45d` (Task 3 fix commit).

**2. [Rule 1 - Bug] Switched `NangoAdapterTest` stubs from named-arg to positional matchers**
- **Found during:** Task 2 (first green run attempt).
- **Issue:** Named-arg `whenever(nangoClientWrapper.fetchRecords(providerConfigKey = eq(...), cursor = eq("t-1"), modifiedAfter = any(), limit = eq(50)))` returned null from every stubbed call. Root cause: Kotlin compiles default-parameter calls with synthetic extra args, and Mockito's matcher queue doesn't align with the synthetic overload — so the stub never matched.
- **Fix:** Rewrote all `whenever(...)` stubs to use positional `any<String>() / anyOrNull<String>() / anyOrNull<Int>()`. Kept `eq(...)` matchers in `verify(...)` (named args here are fine because verification matches against the captured invocation, not a separate overload).
- **Files modified:** `core/src/test/kotlin/riven/core/service/ingestion/adapter/nango/NangoAdapterTest.kt`.
- **Verification:** 13/13 tests green; `verify(...)` still asserts the correct field values pass through.
- **Committed in:** `02f7bdd60` (Task 2 commit, bundled with the implementation).

---

**Total deviations:** 2 auto-fixed (1 Rule 3 — blocking infra, 1 Rule 1 — test wiring bug). No architectural changes, no scope creep. Both fixes are consistent with patterns already established in the codebase (`excludeFilters` list pattern; Mockito positional-vs-named ergonomics).

## Issues Encountered

- First green-run had 8/13 failures because of the Mockito named-arg + Kotlin-default-value interaction. Rapid diagnosis via stack trace (`java.lang.NullPointerException` at the first attempt to dereference the mock return) → switched matchers → all green on the next iteration.
- Full build surfaced 2 pre-existing tests that went red because the new `@Component` leaked into their component scan. Isolated fix (4 lines in an exclude filter) restored parity.

## User Setup Required

None. Pure Kotlin code plus test wiring. Docker required only for Testcontainers in the existing projection tests (same baseline as prior plans).

## Next Phase Readiness

- Phase 4 `IngestionOrchestrator` can constructor-inject `Map<SourceType, IngestionAdapter>` directly — the registry bean is live.
- Phase 3 `PostgresAdapter` will land alongside an expanded `AdapterCallContext.PostgresCallContext`; the registry will pick it up automatically from `@SourceTypeAdapter(SourceType.CUSTOM_SOURCE)` with no `SourceTypeAdapterRegistry` edit required (fail-fast duplicate-check already in place).
- Phase 6 health checks can depend on the same map to drive per-adapter introspection probes; `AdapterCapabilityNotSupportedException` is the contracted signal for "this adapter doesn't answer this probe".

## Verification

- `./gradlew build` → **BUILD SUCCESSFUL** (1,735 tests, all green).
- `grep -rn "NangoAdapter" core/src/main/kotlin/riven/core/service/integration/` → 0 matches.
- `grep -rn "NotImplementedError" core/src/main/kotlin/riven/core/service/ingestion/adapter/` → 0 matches.
- `git diff HEAD~3 HEAD -- core/src/main/kotlin/riven/core/service/integration/sync/IntegrationSyncWorkflowImpl.kt core/src/main/kotlin/riven/core/service/integration/sync/IntegrationSyncActivitiesImpl.kt` → empty diff (live Nango path byte-identical).
- Spring context: `AdapterRegistryWiringTest` asserts `Map<SourceType, IngestionAdapter>` bean has size 1, key `INTEGRATION`, value `NangoAdapter`.

## Self-Check: PASSED

Verified 2026-04-12:
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/nango/NangoAdapter.kt` FOUND
- `core/src/main/kotlin/riven/core/service/ingestion/adapter/SourceTypeAdapterRegistry.kt` FOUND
- `core/src/test/kotlin/riven/core/service/ingestion/adapter/nango/NangoAdapterTest.kt` FOUND
- `core/src/test/kotlin/riven/core/service/ingestion/adapter/AdapterRegistryWiringTest.kt` FOUND
- `core/src/test/kotlin/riven/core/service/ingestion/ProjectionPipelineIntegrationTestBase.kt` modified (NangoAdapter exclude filter)
- Commit `b8b208206` FOUND (RED)
- Commit `02f7bdd60` FOUND (GREEN)
- Commit `c3042a45d` FOUND (regression fix)
- `./gradlew build` → BUILD SUCCESSFUL
- `grep NangoAdapter core/src/main/kotlin/riven/core/service/integration/` → 0 hits

---
*Phase: 01-adapter-foundation*
*Completed: 2026-04-12*
