---
phase: 02-connection-model-nango-client-and-auth-webhook
plan: 01
subsystem: api
tags: [kotlin, spring-boot, jpa, connection-status, state-machine, integration]

# Dependency graph
requires:
  - phase: 01-schema-and-persistence-foundation
    provides: IntegrationConnectionEntity, ConnectionStatus enum, IntegrationConnectionRepository
provides:
  - 8-state ConnectionStatus FSM (CONNECTED, SYNCING, HEALTHY, DEGRADED, STALE, DISCONNECTING, DISCONNECTED, FAILED)
  - IntegrationConnectionRepository.findByNangoConnectionId() for webhook handler lookup
  - IntegrationConnectionService.createOrReconnect() internal method for webhook handler
  - Removed enableIntegration() — disable-only IntegrationEnablementService
affects:
  - 02-03-auth-webhook-handler
  - Any code that calls enableIntegration() or enableConnection()

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Webhook-driven connection creation — connections are born CONNECTED, never in authorization-pending states
    - State machine via canTransitionTo() on enum — terminal states (DISCONNECTED, FAILED) can transition to CONNECTED for reconnect

key-files:
  created: []
  modified:
    - src/main/kotlin/riven/core/enums/integration/ConnectionStatus.kt
    - src/main/kotlin/riven/core/entity/integration/IntegrationConnectionEntity.kt
    - src/main/kotlin/riven/core/repository/integration/IntegrationConnectionRepository.kt
    - src/main/kotlin/riven/core/service/integration/IntegrationConnectionService.kt
    - src/main/kotlin/riven/core/service/integration/IntegrationEnablementService.kt
    - src/main/kotlin/riven/core/controller/integration/IntegrationController.kt
    - src/test/kotlin/riven/core/enums/integration/ConnectionStatusTest.kt
    - src/test/kotlin/riven/core/service/integration/IntegrationConnectionServiceTest.kt
    - src/test/kotlin/riven/core/service/integration/IntegrationEnablementServiceTest.kt

key-decisions:
  - "ConnectionStatus reduced from 10 to 8 states: PENDING_AUTHORIZATION and AUTHORIZING are dead states in webhook model"
  - "DISCONNECTED->CONNECTED and FAILED->CONNECTED transitions added — reconnect flows skip the old auth states"
  - "IntegrationConnectionEntity defaults to CONNECTED — connections only exist post-successful-OAuth"
  - "enableConnection() and createConnection() removed from IntegrationConnectionService — webhook handler will use createOrReconnect()"
  - "enableIntegration() removed from IntegrationEnablementService and controller — POST /{workspaceId}/enable endpoint deleted"

patterns-established:
  - "Webhook-driven FSM: state machine starts at CONNECTED not PENDING_AUTHORIZATION"

requirements-completed: [CONN-01, CONN-02, CONN-03, NANGO-03]

# Metrics
duration: 25min
completed: 2026-03-17
---

# Phase 02 Plan 01: Connection State Machine Cleanup Summary

**8-state ConnectionStatus FSM replacing 10-state, removed frontend-driven enable flow, repository query for webhook lookup added**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-17T09:00:00Z
- **Completed:** 2026-03-17T09:25:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Reduced ConnectionStatus from 10 to 8 states by removing PENDING_AUTHORIZATION and AUTHORIZING dead states
- DISCONNECTED and FAILED can now transition directly to CONNECTED (webhook reconnect path)
- Removed createConnection(), enableConnection(), enableIntegration() — frontend-driven enable flow eliminated
- Added findByNangoConnectionId() to repository for Phase 03 webhook handler
- Added internal createOrReconnect() to IntegrationConnectionService for webhook handler
- Removed POST /{workspaceId}/enable endpoint from IntegrationController

## Task Commits

Each task was committed atomically:

1. **Task 1: ConnectionStatus enum cleanup, entity default, repository query, and service refactoring** - `002e044aa` (refactor)
2. **Task 2: Update existing tests for ConnectionStatus and IntegrationConnectionService** - `a1bffaa1e` (test)

## Files Created/Modified
- `src/main/kotlin/riven/core/enums/integration/ConnectionStatus.kt` - 8-state enum with updated canTransitionTo()
- `src/main/kotlin/riven/core/entity/integration/IntegrationConnectionEntity.kt` - Default status changed to CONNECTED
- `src/main/kotlin/riven/core/repository/integration/IntegrationConnectionRepository.kt` - Added findByNangoConnectionId()
- `src/main/kotlin/riven/core/service/integration/IntegrationConnectionService.kt` - Removed createConnection/enableConnection, added createOrReconnect()
- `src/main/kotlin/riven/core/service/integration/IntegrationEnablementService.kt` - Removed enableIntegration() and helpers, removed materializationService dependency
- `src/main/kotlin/riven/core/controller/integration/IntegrationController.kt` - Removed POST /{workspaceId}/enable endpoint
- `src/test/kotlin/riven/core/enums/integration/ConnectionStatusTest.kt` - Updated for 8 states, new transition tests
- `src/test/kotlin/riven/core/service/integration/IntegrationConnectionServiceTest.kt` - Removed createConnection/enableConnection test sections
- `src/test/kotlin/riven/core/service/integration/IntegrationEnablementServiceTest.kt` - Removed Enable/Lifecycle classes, disable-only tests remain

## Decisions Made
- PENDING_AUTHORIZATION and AUTHORIZING were dead states — webhook-driven model means Nango fires a webhook after successful OAuth, at which point the connection is created directly as CONNECTED. No frontend-polling needed.
- DISCONNECTED->CONNECTED and FAILED->CONNECTED transitions are correct for reconnect — a previously disconnected/failed integration can be re-enabled via a new OAuth flow delivering a fresh Nango webhook.
- createOrReconnect() marked `internal` (not `public`) — it's called from the webhook handler in the same package, not via @PreAuthorize-enforced paths.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] IntegrationEnablementServiceTest referenced removed materializationService mock**
- **Found during:** Task 2 (test update)
- **Issue:** The old test file had `@MockitoBean materializationService` and `reset(..., materializationService, ...)` which would cause Spring context to fail loading since IntegrationEnablementService no longer has that constructor parameter
- **Fix:** Removed materializationService mock from the test class setup
- **Files modified:** IntegrationEnablementServiceTest.kt
- **Verification:** Test compiles and passes
- **Committed in:** a1bffaa1e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test)
**Impact on plan:** Fix was necessary for correct compilation. No scope creep.

## Issues Encountered
- NangoClientWrapperTest has pre-existing failures (introduced in commit b3d09708a — test(02-02)) that are unrelated to this plan. These failures existed before this plan's execution and are out of scope. Logged to deferred-items.

## Next Phase Readiness
- 8-state FSM in place, transitions correct
- findByNangoConnectionId() available for webhook handler lookup
- createOrReconnect() ready for webhook handler to call
- Phase 02-03 (auth webhook handler) can proceed

---
*Phase: 02-connection-model-nango-client-and-auth-webhook*
*Completed: 2026-03-17*
