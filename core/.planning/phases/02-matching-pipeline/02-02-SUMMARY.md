---
phase: 02-matching-pipeline
plan: "02"
subsystem: identity
tags: [kotlin, service, pg_trgm, native-sql, scoring, unit-test]

# Dependency graph
requires:
  - phase: 02-matching-pipeline
    plan: "01"
    provides: MatchSignalType, CandidateMatch, MatchSignal, ScoredCandidate, IdentityFactory
provides:
  - IdentityMatchCandidateService with findCandidates (pg_trgm two-phase query) and getTriggerAttributes
  - IdentityMatchScoringService with scoreCandidates (weighted average + 0.5 threshold)
affects: [02-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native EntityManager query with setParameter for pg_trgm candidate blocking"
    - "Two-phase SQL: % operator (GIN index blocking) + similarity() score extraction"
    - "Merge-by-group with maxByOrNull for deduplication of (entityId, signalType) pairs"
    - "Pure computation service with no DB access — injectable from Temporal activity"
    - "Weighted average formula: Sum(sim*weight) / Sum(weight) — bounded 0-1.0"

key-files:
  created:
    - src/main/kotlin/riven/core/service/identity/IdentityMatchCandidateService.kt
    - src/main/kotlin/riven/core/service/identity/IdentityMatchScoringService.kt
    - src/test/kotlin/riven/core/service/identity/IdentityMatchCandidateServiceTest.kt
    - src/test/kotlin/riven/core/service/identity/IdentityMatchScoringServiceTest.kt
  modified: []

key-decisions:
  - "EntityManager used over JdbcTemplate — allows native query + setParameter without manual UUID-to-String conversion"
  - "parseUuid helper handles both UUID and String-form results from EntityManager native queries"
  - "Shared private queryTriggerIdentifierAttributes reduces duplication between findCandidates and getTriggerAttributes"
  - "MINIMUM_SCORE_THRESHOLD is a companion const at 0.5 — Plan 02-03 reads it for persistence decisions"

# Metrics
duration: 10min
completed: 2026-03-16
---

# Phase 2 Plan 02: Candidate Search and Weighted Scoring Services Summary

**IdentityMatchCandidateService (pg_trgm two-phase query + trigger attribute lookup) and IdentityMatchScoringService (weighted average scoring with 0.5 threshold) — two independently testable services forming the core matching algorithm**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-16T07:47:43Z
- **Completed:** 2026-03-16T07:57:47Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `IdentityMatchCandidateService` with native SQL two-phase pg_trgm query — uses `%` operator for GIN index blocking and `similarity()` for score extraction
- `findCandidates` queries trigger entity's IDENTIFIER-classified attributes then executes one candidate scan per attribute, merging results by (candidateEntityId, signalType) and keeping max similarity
- `getTriggerAttributes` returns `Map<MatchSignalType, String>` of normalized attribute values for the scoring service
- Shared `queryTriggerIdentifierAttributes` private method avoids duplicating the JOIN query
- Created `IdentityMatchScoringService` as a pure computation service (no DB access) with `scoreCandidates`
- Scoring implements the locked weighted average formula: `Sum(similarity*weight) / Sum(weight)` using `MatchSignalType.DEFAULT_WEIGHTS`
- Candidates below `MINIMUM_SCORE_THRESHOLD = 0.5` are filtered out; zero-similarity signals excluded from breakdown
- Best match per signal type (highest similarity) kept when multiple candidates match same entity+type
- Full unit test coverage: 10 tests for candidate service (empty results, merge/dedup, query params, normalize), 9 tests for scoring service (single signal, multi-signal formula, threshold boundary, signal breakdown)

## Task Commits

Each task was committed atomically:

1. **Task 1: IdentityMatchCandidateService with pg_trgm two-phase query** - `673a3cce1` (feat)
2. **Task 2: IdentityMatchScoringService with weighted scoring** - `30a882e93` (feat)

## Files Created/Modified

- `src/main/kotlin/riven/core/service/identity/IdentityMatchCandidateService.kt` — pg_trgm candidate blocking, trigger attribute lookup, dedup merge
- `src/main/kotlin/riven/core/service/identity/IdentityMatchScoringService.kt` — weighted average scoring, threshold filter, signal breakdown
- `src/test/kotlin/riven/core/service/identity/IdentityMatchCandidateServiceTest.kt` — unit tests for candidate service
- `src/test/kotlin/riven/core/service/identity/IdentityMatchScoringServiceTest.kt` — unit tests for scoring service

## Decisions Made

- `EntityManager` chosen over `JdbcTemplate` — avoids manual UUID string conversion since EntityManager handles UUID parameters directly; consistent with existing codebase patterns
- `parseUuid` helper handles both UUID and String-form results from native queries — JDBC drivers vary in how they return UUID columns
- Shared `queryTriggerIdentifierAttributes` eliminates duplication; both `findCandidates` and `getTriggerAttributes` need the same IDENTIFIER join
- `MINIMUM_SCORE_THRESHOLD` exposed as companion `const` so Plan 02-03 (`IdentityMatchSuggestionService`) can read it without magic numbers

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `IdentityMatchCandidateService.findCandidates` and `getTriggerAttributes` are the exact method signatures Plan 02-03 needs for the Temporal activities
- `IdentityMatchScoringService.scoreCandidates` is ready for the ScoreCandidates Temporal activity
- `MINIMUM_SCORE_THRESHOLD = 0.5` is accessible from `IdentityMatchScoringService.MINIMUM_SCORE_THRESHOLD`
- No blockers

## Self-Check: PASSED

All created files exist on disk. All task commits verified in git log.
