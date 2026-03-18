---
phase: 04-confirmation-and-clusters
plan: 02
subsystem: identity
tags: [spring-service, identity, cluster, tdd, confirmation, notification]

# Dependency graph
requires:
  - phase: 04-confirmation-and-clusters
    plan: 01
    provides: IdentityClusterMemberRepository with findByEntityId, findByClusterId, deleteByClusterId
  - phase: 02-matching-pipeline
    provides: MatchSuggestionRepository and MatchSuggestionEntity with rejection logic
  - phase: notification
    provides: NotificationService.createInternalNotification

provides:
  - IdentityConfirmationService.confirmSuggestion — CONNECTED_ENTITIES relationship + 5-case cluster management + notification
  - IdentityConfirmationService.rejectSuggestion — PENDING -> REJECTED state transition with signal snapshot

affects:
  - 04-03 and later (any plan doing cluster reads or suggestion state reads can rely on CONFIRMED/REJECTED states)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "5-case cluster resolution: create / expand-source / expand-target / merge / same-cluster-noop"
    - "Cluster merge: hard-delete dissolving members, re-insert with preserved join metadata, soft-delete dissolving cluster"
    - "Tie-breaking in merge favors source entity's cluster (canonical ordering consistent)"
    - "Notification broadcast with userId=null targets all workspace members"
    - "Integration test rejects via raw SQL when service requires JWT context"

key-files:
  created:
    - src/main/kotlin/riven/core/service/identity/IdentityConfirmationService.kt
    - src/test/kotlin/riven/core/service/identity/IdentityConfirmationServiceTest.kt
  modified:
    - src/main/kotlin/riven/core/service/identity/IdentityMatchSuggestionService.kt
    - src/test/kotlin/riven/core/service/identity/IdentityMatchSuggestionServiceTest.kt
    - src/test/kotlin/riven/core/service/identity/IdentityMatchPipelineIntegrationTest.kt

key-decisions:
  - "rejectSuggestion removed from IdentityMatchSuggestionService — IdentityConfirmationService is the single state machine owner for both confirm and reject transitions"
  - "Cluster merge tie-breaking favors source entity's cluster — source is already in canonical (lower) position, consistent with DB ordering constraint"
  - "Integration test rejects via raw SQL instead of service — IdentityConfirmationService requires JWT context (@PreAuthorize) which is not available in the minimal integration test config"
  - "resolveCluster Case 5 (same cluster) loads the cluster via findOrThrow to return a valid IdentityClusterEntity for activity logging"

patterns-established:
  - "5-case cluster resolution pattern for identity match confirmation"
  - "Broadcast notification (userId=null) for workspace-wide events"

requirements-completed: [CONF-01, CONF-02, CONF-03, CONF-04, CONF-05]

# Metrics
duration: 8min
completed: 2026-03-18
---

# Phase 04 Plan 02: IdentityConfirmationService Summary

**IdentityConfirmationService with confirm/reject flows, 5-case cluster resolution, relationship creation, activity logging, and REVIEW_REQUEST notification publishing**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-18T05:26:08Z
- **Completed:** 2026-03-18T05:34:08Z
- **Tasks:** 1 (TDD: RED + GREEN commits)
- **Files modified:** 5

## Accomplishments

- Created `IdentityConfirmationService` as the single owner of the confirm/reject state machine
- `confirmSuggestion` implements: status guard → CONNECTED_ENTITIES relationship → 5-case cluster resolution → CONFIRMED state → activity logging → REVIEW_REQUEST notification broadcast
- `rejectSuggestion` implements: status guard → rejectionSignals snapshot → REJECTED state + soft-delete → activity logging
- 5-case cluster resolution correctly handles: (1) both unclustered → new cluster, (2) source only clustered → add target to source, (3) target only clustered → add source to target, (4) both in different clusters → merge smaller into larger, (5) both in same cluster → no-op
- Cluster merge hard-deletes dissolving members, re-inserts with original `joinedAt`/`joinedBy`, updates surviving memberCount, and soft-deletes the dissolving cluster. On tie, source entity's cluster survives.
- Removed `rejectSuggestion`, `validateRejectable`, `applyRejection`, and `logRejectionActivity` from `IdentityMatchSuggestionService` — rejection logic now fully owned by `IdentityConfirmationService`
- Updated `IdentityMatchSuggestionServiceTest` to remove the 4 `rejectSuggestion` tests (now covered by `IdentityConfirmationServiceTest`)
- Updated `IdentityMatchPipelineIntegrationTest` to reject via raw SQL (avoids JWT context requirement)
- Full test suite passes

## Task Commits

1. **RED: Failing tests for IdentityConfirmationService** — `5c7383191`
2. **GREEN: IdentityConfirmationService implementation + cleanup** — `0173bbc28`

## Files Created/Modified

- `src/main/kotlin/riven/core/service/identity/IdentityConfirmationService.kt` — created (confirm/reject with 5-case cluster management, 270 lines)
- `src/test/kotlin/riven/core/service/identity/IdentityConfirmationServiceTest.kt` — created (unit tests for CONF-01 through CONF-05, 790 lines)
- `src/main/kotlin/riven/core/service/identity/IdentityMatchSuggestionService.kt` — removed rejectSuggestion and related private methods
- `src/test/kotlin/riven/core/service/identity/IdentityMatchSuggestionServiceTest.kt` — removed 4 rejectSuggestion tests + unused imports
- `src/test/kotlin/riven/core/service/identity/IdentityMatchPipelineIntegrationTest.kt` — updated rejection step to use raw SQL

## Decisions Made

- `rejectSuggestion` moved entirely to `IdentityConfirmationService` — this is the correct home since both confirm and reject are human-driven state transitions requiring JWT context
- Cluster merge tie-breaking favors source entity's cluster — aligns with canonical UUID ordering where source < target
- Integration test rejects via raw SQL — `IdentityConfirmationService` requires `@PreAuthorize` (JWT) which the minimal integration test config does not provide; raw SQL avoids wiring the full security context for what is a pipeline unit concern
- Case 5 (same-cluster no-op) still loads the cluster via `findOrThrow` to provide a valid `IdentityClusterEntity` to `logConfirmationActivity` and `publishConfirmationNotification`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Integration test used deleted `rejectSuggestion` method**
- **Found during:** Task 1 (GREEN phase, compileTestKotlin)
- **Issue:** `IdentityMatchPipelineIntegrationTest` called `suggestionService.rejectSuggestion(...)` which was removed from `IdentityMatchSuggestionService`
- **Fix:** Replaced service call with equivalent raw SQL update via `jdbcTemplate` — this is appropriate because the integration test uses a minimal config without Spring Security, so `IdentityConfirmationService`'s `@PreAuthorize` cannot be satisfied
- **Files modified:** `IdentityMatchPipelineIntegrationTest.kt`
- **Commit:** `0173bbc28`

## Self-Check: PASSED

- `src/main/kotlin/riven/core/service/identity/IdentityConfirmationService.kt` — exists
- `src/test/kotlin/riven/core/service/identity/IdentityConfirmationServiceTest.kt` — exists
- Commit `5c7383191` exists (RED)
- Commit `0173bbc28` exists (GREEN + cleanup)
- All identity tests pass: `./gradlew test --tests "riven.core.service.identity.*"` — BUILD SUCCESSFUL
- Full suite passes: `./gradlew test` — BUILD SUCCESSFUL
