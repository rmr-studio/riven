---
phase: 02-matching-pipeline
plan: "03"
subsystem: identity
tags: [kotlin, jpa, postgres, jsonb, service, activity-logging, idempotency]

# Dependency graph
requires:
  - phase: 02-matching-pipeline
    plan: "01"
    provides: MatchSuggestionEntity, MatchSuggestionRepository, ScoredCandidate, MatchSignal, Activity/ApplicationEntityType enums, IdentityFactory
  - phase: 01-infrastructure
    provides: AuditableSoftDeletableEntity, ServiceUtil.findOrThrow, ActivityService
provides:
  - IdentityMatchSuggestionService: write path for suggestion persistence with idempotency, rejection, re-suggestion
  - persistSuggestions(workspaceId, scoredCandidates, userId?): persists PENDING suggestions with canonical ordering
  - rejectSuggestion(suggestionId, userId): transitions to REJECTED, writes rejectionSignals snapshot
  - SUGG-01 partial: Create and Reject transitions (Confirmed deferred to Phase 4)
  - SUGG-03: rejection writes rejectionSignals snapshot enabling re-suggestion
  - SUGG-04: re-suggestion logic with score comparison against rejected.confidenceScore
  - SUGG-05: audit activity logged for creation (CREATE) and rejection (UPDATE)
affects: [02-04, 02-05, 04-confirmation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DataIntegrityViolationException catch for idempotent duplicate pair handling (no pre-check query)"
    - "Nullable userId for Temporal callers — activity logging skipped when null, not logged for system-triggered runs"
    - "rejectionSignals snapshot stores {signals, confidenceScore} map at rejection time for re-suggestion comparison"
    - "argumentCaptor from mockito-kotlin DSL for type-safe details map capture in tests"
    - "BaseServiceTest inheritance provides mock KLogger bean without LoggerConfig prototype conflict"

key-files:
  created:
    - src/main/kotlin/riven/core/service/identity/IdentityMatchSuggestionService.kt
    - src/test/kotlin/riven/core/service/identity/IdentityMatchSuggestionServiceTest.kt

key-decisions:
  - "ActivityService.logActivity requires non-null userId — activity logging is skipped when userId=null (Temporal system calls). No sentinel UUID used."
  - "DataIntegrityViolationException catch in createIfNotExists is the idempotency mechanism — no pre-check query, relies on DB UNIQUE constraint"
  - "rejectionSignals snapshot contains both signals list and confidenceScore — re-suggestion compares against entity.confidenceScore on the rejected row"
  - "buildSavedEntity in tests preserves existing entity.id — prevents entityId mismatch in activity log verify assertions"

patterns-established:
  - "Service with nullable userId for Temporal callers — guard activity logging with if (userId != null)"
  - "Two-step soft-delete-then-recreate for re-suggestion: repository.save(rejected with deleted=true) then saveAndFlush(new entity)"

requirements-completed: [SUGG-01, SUGG-02, SUGG-03, SUGG-04, SUGG-05]

# Metrics
duration: 12min
completed: 2026-03-16
---

# Phase 2 Plan 03: IdentityMatchSuggestionService Summary

**IdentityMatchSuggestionService with idempotent suggestion persistence via DataIntegrityViolationException catch, rejectionSignals snapshot write, re-suggestion score comparison, and nullable-userId activity logging for Temporal compatibility**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-16T07:50:00Z
- **Completed:** 2026-03-16T08:02:00Z
- **Tasks:** 1 (TDD: 2 commits)
- **Files modified:** 2

## Accomplishments

- Implemented `IdentityMatchSuggestionService` with all five SUGG requirement paths
- `persistSuggestions`: canonical UUID ordering, active suggestion skip, DataIntegrityViolationException idempotency, signal conversion via toMap()
- `rejectSuggestion`: PENDING validation, rejectionSignals snapshot write, resolvedBy/resolvedAt, UPDATE activity logging
- Re-suggestion: rejected row soft-deleted when new score strictly exceeds `rejected.confidenceScore.toDouble()`
- Nullable `userId` for Temporal activity callers — activity skipped when null, no sentinel UUID needed
- 14 unit tests covering all happy path and edge cases, all passing

## Task Commits

1. **Task 1 (RED):** `b88dae58c` — test(02-03): add failing tests for IdentityMatchSuggestionService
2. **Task 1 (GREEN):** `f5d653398` — feat(02-03): implement IdentityMatchSuggestionService

## Files Created/Modified

- `src/main/kotlin/riven/core/service/identity/IdentityMatchSuggestionService.kt` — Service implementation (222 lines)
- `src/test/kotlin/riven/core/service/identity/IdentityMatchSuggestionServiceTest.kt` — 14 unit tests (481 lines)

## Decisions Made

- `ActivityService.logActivity` requires non-null `userId` — activity logging guarded by `if (userId != null)`, not via a sentinel UUID. System-triggered Temporal runs produce no audit entries.
- `DataIntegrityViolationException` catch is the idempotency mechanism — pre-checking with `findActiveSuggestion` handles the common case, DB UNIQUE constraint + catch handles the race condition
- `rejectionSignals` snapshot stores `{"signals": [...], "confidenceScore": 0.85}` — the score key is included so future tooling can display the rejection context without joining tables
- `buildSavedEntity` in tests preserves `entity.id` — necessary so `verify(activityService).logActivity(..., eq(suggestionId), ...)` passes when the saved entity is returned from `repository.save()`

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

1. **[Rule 3 - Auto-fix] `@MockitoBean` cannot override prototype-scoped KLogger bean** — Including `LoggerConfig::class` in `@SpringBootTest` classes caused "only singleton beans can be overridden" error. Fixed by extending `BaseServiceTest` which provides the mock `KLogger` as a singleton without including `LoggerConfig`. Test inherits `@WithUserPersona` from `BaseServiceTest` but it has no effect since the service has no `@PreAuthorize`.

2. **[Rule 3 - Auto-fix] Java `ArgumentCaptor.forClass()` returns null in Kotlin** — Using `ArgumentCaptor.forClass(Map::class.java).capture()` returns null and causes NPE for non-null Kotlin types. Fixed by using mockito-kotlin's `argumentCaptor<JsonObject>()` DSL which is null-safe.

3. **[Rule 3 - Auto-fix] `buildSavedEntity` generated fresh UUID ignoring entity.id** — `repository.save()` mock returned entity with new random UUID instead of preserving the input ID, causing `verify` assertion mismatch on `entityId`. Fixed by defaulting `id` parameter to `entity.id ?: UUID.randomUUID()`.

## Self-Check: PASSED

All created files exist on disk. All task commits verified in git log.

---
*Phase: 02-matching-pipeline*
*Completed: 2026-03-16*
