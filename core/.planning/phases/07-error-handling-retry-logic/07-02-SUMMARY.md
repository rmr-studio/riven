---
phase: 07-error-handling-retry-logic
plan: 02
subsystem: workflow
tags: [retry, error-classification, temporal, application-failure, exponential-backoff]

# Dependency graph
requires:
  - phase: 07-01
    provides: WorkflowErrorType enum, NodeExecutionError model, RetryAttempt model
provides:
  - WorkflowErrorClassifier utility for testable error classification
  - Temporal RetryOptions with doNotRetry for non-retryable error types
  - ApplicationFailure throwing in WorkflowCoordinationService
  - Structured NodeExecutionError persisted to workflow_node_executions
affects:
  - 07-03 (Will use error classification for error recovery strategies)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Kotlin object for stateless utility (no Spring injection needed)
    - ApplicationFailure for Temporal retry control
    - doNotRetry list for non-retryable error type exclusion

key-files:
  created:
    - src/main/kotlin/riven/core/service/workflow/engine/error/WorkflowErrorClassifier.kt
  modified:
    - src/main/kotlin/riven/core/service/workflow/engine/WorkflowOrchestrationService.kt
    - src/main/kotlin/riven/core/service/workflow/engine/coordinator/WorkflowCoordinationService.kt

key-decisions:
  - "Kotlin object for WorkflowErrorClassifier - allows direct calls without Spring injection"
  - "Error type strings match WorkflowErrorType enum names exactly for Temporal matching"
  - "Maximum retry interval reduced from 1min to 30s for faster retry cycles"
  - "Hardcoded retry values in workflow - not a Spring bean, cannot inject ConfigurationProperties"

patterns-established:
  - "Error classification: WorkflowErrorClassifier.classifyError(exception, nodeType)"
  - "Temporal retry control: ApplicationFailure.newNonRetryableFailure for non-retryable, newFailureWithCause for retryable"
  - "Structured errors: NodeExecutionError stored in workflow_node_executions.error column"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 07 Plan 02: Retry Calculation Service Summary

**Temporal retry policy integration with error classification - WorkflowErrorClassifier utility, doNotRetry configuration, and ApplicationFailure throwing for controlled retry behavior**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-22
- **Completed:** 2026-01-22
- **Tasks:** 3
- **Files created:** 1
- **Files modified:** 2

## Accomplishments
- WorkflowErrorClassifier utility object with classifyError() and classifyErrorWithMessage() functions
- Temporal RetryOptions updated with setDoNotRetry for 4 non-retryable error types
- WorkflowCoordinationService enhanced with error classification and ApplicationFailure throwing
- Structured NodeExecutionError persisted to database on failure

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WorkflowErrorClassifier utility class** - `a22d31b` (feat)
2. **Task 2: Update WorkflowOrchestrationServiceImpl with enhanced RetryOptions** - `27e1f11` (feat)
3. **Task 3: Add error classification and ApplicationFailure handling to WorkflowCoordinationService** - `ec4d505` (feat)

## Files Created/Modified

- `src/main/kotlin/riven/core/service/workflow/engine/error/WorkflowErrorClassifier.kt` - Utility object for error classification
- `src/main/kotlin/riven/core/service/workflow/engine/WorkflowOrchestrationService.kt` - Added doNotRetry list and reduced max interval
- `src/main/kotlin/riven/core/service/workflow/engine/coordinator/WorkflowCoordinationService.kt` - Error classification, ApplicationFailure throwing, structured error persistence

## Decisions Made

1. **Kotlin object for WorkflowErrorClassifier** - Allows direct function calls without Spring injection, making it testable and usable from non-Spring contexts
2. **Error type names as doNotRetry strings** - Using WorkflowErrorType enum names ensures consistency between classification and Temporal matching
3. **Maximum interval reduced to 30s** - Faster retry cycles for better user experience (was 1 minute)
4. **Hardcoded retry values** - WorkflowOrchestrationServiceImpl is not a Spring bean, so ConfigurationProperties cannot be injected; values match application.yml defaults

## Error Classification Rules

| Error Type | Condition | Retryable |
|------------|-----------|-----------|
| HTTP_CLIENT_ERROR | HTTP 4xx | No |
| HTTP_SERVER_ERROR | HTTP 5xx | Yes |
| VALIDATION_ERROR | IllegalArgumentException, SchemaValidationException | No |
| SECURITY_ERROR | SecurityException | No |
| CONTROL_FLOW_ERROR | Any error in CONTROL_FLOW node | No |
| EXECUTION_ERROR | All other exceptions | Yes |

## Key Integration Points

1. **WorkflowCoordinationService -> WorkflowErrorClassifier**
   - `WorkflowErrorClassifier.classifyError(e, node.type)` in catch block
   - `WorkflowErrorClassifier.classifyErrorWithMessage(e, nodeType)` in classifyAndThrowError

2. **WorkflowCoordinationService -> ApplicationFailure**
   - `ApplicationFailure.newNonRetryableFailure(message, errorType.name)` for non-retryable
   - `ApplicationFailure.newFailureWithCause(message, errorType.name, e)` for retryable

3. **WorkflowOrchestrationService -> RetryOptions.setDoNotRetry**
   - `"HTTP_CLIENT_ERROR", "VALIDATION_ERROR", "CONTROL_FLOW_ERROR", "SECURITY_ERROR"`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Error classification fully integrated with Temporal retry system
- Structured errors persisted for debugging and monitoring
- Ready for 07-03 (Error recovery and notification if planned)

---
*Phase: 07-error-handling-retry-logic*
*Completed: 2026-01-22*
