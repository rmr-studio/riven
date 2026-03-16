---
phase: 02-matching-pipeline
plan: "01"
subsystem: identity
tags: [kotlin, jpa, postgres, jsonb, enums, repository]

# Dependency graph
requires:
  - phase: 01-infrastructure
    provides: MatchSuggestionEntity, MatchSuggestionRepository, JPA entity scaffolding
provides:
  - MatchSignalType enum with DEFAULT_WEIGHTS for EMAIL(0.9), PHONE(0.85), NAME(0.5), COMPANY(0.3), CUSTOM_IDENTIFIER(0.7)
  - CandidateMatch domain model: raw pg_trgm query output
  - MatchSignal domain model: per-signal JSONB breakdown with toMap() serializer
  - ScoredCandidate domain model: scored entity pair ready for persistence
  - MatchSuggestionEntity.signals corrected to List<Map<String, Any?>>
  - MatchSuggestionRepository.findActiveSuggestion and findRejectedSuggestion native queries
  - Activity.MATCH_SUGGESTION and ApplicationEntityType.MATCH_SUGGESTION enum values
  - IdentityFactory test object with 4 factory methods
affects: [02-02, 02-03, 02-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Signal type enum with companion DEFAULT_WEIGHTS map — scoring service reads this without hardcoding weights"
    - "toMap() method on domain model for JSONB serialization (MatchSignal)"
    - "Canonical UUID ordering in test factory (source < target) matching DB CHECK constraint"

key-files:
  created:
    - src/main/kotlin/riven/core/enums/identity/MatchSignalType.kt
    - src/main/kotlin/riven/core/models/identity/CandidateMatch.kt
    - src/main/kotlin/riven/core/models/identity/MatchSignal.kt
    - src/main/kotlin/riven/core/models/identity/ScoredCandidate.kt
    - src/test/kotlin/riven/core/service/util/factory/identity/IdentityFactory.kt
  modified:
    - src/main/kotlin/riven/core/entity/identity/MatchSuggestionEntity.kt
    - src/main/kotlin/riven/core/models/identity/MatchSuggestion.kt
    - src/main/kotlin/riven/core/repository/identity/MatchSuggestionRepository.kt
    - src/main/kotlin/riven/core/enums/activity/Activity.kt
    - src/main/kotlin/riven/core/enums/core/ApplicationEntityType.kt

key-decisions:
  - "signals field is List<Map<String, Any?>> not Map — each element is one MatchSignal.toMap() entry; JSONB array allows multi-signal breakdown per suggestion"
  - "rejectionSignals remains JsonObject (flat Map) — it's a snapshot at rejection time, not an array"
  - "MatchSignal.toMap() uses type.name (String) for JSON serialization, not the enum itself — avoids deserialization coupling in JSONB reads"
  - "fromSchemaType() maps EMAIL/PHONE directly; all others fall to CUSTOM_IDENTIFIER — NAME/COMPANY are contextual and derived by scoring service heuristics"
  - "findRejectedSuggestion uses deleted = true AND status = 'REJECTED' — rejected suggestions are soft-deleted after resolution"

patterns-established:
  - "Domain model toMap() for JSONB column serialization"
  - "Test factory applies canonical UUID ordering to match DB CHECK constraints"

requirements-completed: [MATCH-04, MATCH-06, SUGG-01, SUGG-02, SUGG-03, SUGG-04]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 2 Plan 01: Domain Models and Match Signal Contracts Summary

**MatchSignalType enum with DEFAULT_WEIGHTS, 3 domain models (CandidateMatch/MatchSignal/ScoredCandidate), signals JSONB field corrected to List type, two custom repository queries, enum extensions, and IdentityFactory test object**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T07:41:40Z
- **Completed:** 2026-03-16T07:44:22Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Created MatchSignalType enum with DEFAULT_WEIGHTS companion map — provides ready-to-use weights for Plan 02 scoring service
- Created three domain model data classes (CandidateMatch, MatchSignal with toMap(), ScoredCandidate) — complete type contracts for the matching pipeline
- Fixed the signals JSONB field from Map to List on both MatchSuggestionEntity and MatchSuggestion domain model
- Added findActiveSuggestion and findRejectedSuggestion native queries to MatchSuggestionRepository
- Extended Activity and ApplicationEntityType enums with MATCH_SUGGESTION values
- Created IdentityFactory test object with 4 factory methods that honour canonical UUID ordering

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MatchSignalType enum and domain model data classes** - `a52c95447` (feat)
2. **Task 2: Fix signals type, add enum values, custom repo queries, and test factory** - `bfae69815` (feat)

## Files Created/Modified
- `src/main/kotlin/riven/core/enums/identity/MatchSignalType.kt` - Signal type enum with DEFAULT_WEIGHTS and fromSchemaType()
- `src/main/kotlin/riven/core/models/identity/CandidateMatch.kt` - Raw pg_trgm query output per attribute row
- `src/main/kotlin/riven/core/models/identity/MatchSignal.kt` - Per-signal JSONB breakdown with toMap() serializer
- `src/main/kotlin/riven/core/models/identity/ScoredCandidate.kt` - Scored entity pair ready for suggestion persistence
- `src/main/kotlin/riven/core/entity/identity/MatchSuggestionEntity.kt` - signals changed to List<Map<String, Any?>>
- `src/main/kotlin/riven/core/models/identity/MatchSuggestion.kt` - signals changed to List<Map<String, Any?>>
- `src/main/kotlin/riven/core/repository/identity/MatchSuggestionRepository.kt` - Added two native query methods
- `src/main/kotlin/riven/core/enums/activity/Activity.kt` - Added MATCH_SUGGESTION value
- `src/main/kotlin/riven/core/enums/core/ApplicationEntityType.kt` - Added MATCH_SUGGESTION value
- `src/test/kotlin/riven/core/service/util/factory/identity/IdentityFactory.kt` - Test factory with 4 methods

## Decisions Made
- signals field uses List not Map — each list element is a serialised MatchSignal, JSONB array structure matches the multi-signal breakdown needed by Plan 03 suggestion service
- rejectionSignals remains a flat JsonObject (Map) — it is a snapshot of the prior signals, not a new breakdown
- MatchSignal.toMap() uses type.name (String) to avoid enum deserialization coupling when reading JSONB back from DB
- findRejectedSuggestion filters deleted = true AND status = 'REJECTED' because rejected suggestions are soft-deleted post-resolution

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All type contracts are established; Plan 02 (IdentityMatchScoringService) and Plan 03 (IdentityMatchSuggestionService) can import all types directly
- IdentityFactory is available for unit and integration tests in Plans 02-04
- No blockers

## Self-Check: PASSED

All created files exist on disk. All task commits verified in git log.

---
*Phase: 02-matching-pipeline*
*Completed: 2026-03-16*
