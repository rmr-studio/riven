---
phase: 07-error-handling-retry-logic
plan: 01
subsystem: workflow
tags: [retry, error-handling, configuration-properties, spring-boot, jsonb]

# Dependency graph
requires:
  - phase: 06.1-execution-queue-management
    provides: Execution infrastructure for workflow dispatch
provides:
  - WorkflowErrorType enum with retryable classification
  - RetryAttempt model for tracking retry history
  - NodeExecutionError for per-node error details
  - WorkflowExecutionError for workflow-level error summary
  - WorkflowRetryConfigurationProperties for externalized retry config
affects:
  - 07-02 (RetryCalculationService will use WorkflowRetryConfigurationProperties)
  - 07-03 (Error classification will use WorkflowErrorType)
  - 07-04 (Circuit breaker will use error models)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ConfigurationProperties data class pattern for externalized config
    - Error type enum with retryable property for classification
    - Structured error models for JSONB storage

key-files:
  created:
    - src/main/kotlin/riven/core/enums/workflow/WorkflowErrorType.kt
    - src/main/kotlin/riven/core/models/workflow/engine/error/RetryAttempt.kt
    - src/main/kotlin/riven/core/models/workflow/engine/error/NodeExecutionError.kt
    - src/main/kotlin/riven/core/models/workflow/engine/error/WorkflowExecutionError.kt
    - src/main/kotlin/riven/core/configuration/workflow/WorkflowRetryConfigurationProperties.kt
  modified:
    - src/main/resources/application.yml

key-decisions:
  - "Enum property for retryable classification over isRetryable method"
  - "Separate models for node vs workflow errors for different storage locations"
  - "Non-retryable HTTP codes: 400, 401, 403, 404, 422 (client errors)"

patterns-established:
  - "Error classification: retryable property on enum"
  - "Retry config: RetryConfig data class with maxAttempts, intervals, backoffCoefficient"

# Metrics
duration: 2min
completed: 2026-01-22
---

# Phase 07 Plan 01: Retry Configuration and Error Models Summary

**Externalized retry configuration via Spring ConfigurationProperties and structured error models (WorkflowErrorType, RetryAttempt, NodeExecutionError, WorkflowExecutionError) for JSONB storage**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-22T09:54:46Z
- **Completed:** 2026-01-22T09:56:09Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- WorkflowErrorType enum with 9 error types classified as retryable or non-retryable
- Structured error models for per-node (NodeExecutionError) and workflow-level (WorkflowExecutionError) errors
- Externalized retry configuration with defaults for general, HTTP, and CRUD actions
- application.yml updated with full retry configuration section

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WorkflowErrorType enum and RetryAttempt model** - `366265e` (feat)
2. **Task 2: Create NodeExecutionError and WorkflowExecutionError models** - `1a3fb7b` (feat)
3. **Task 3: Create WorkflowRetryConfigurationProperties and update application.yml** - `fb4a734` (feat)

## Files Created/Modified
- `src/main/kotlin/riven/core/enums/workflow/WorkflowErrorType.kt` - Error type classification enum with retryable property
- `src/main/kotlin/riven/core/models/workflow/engine/error/RetryAttempt.kt` - Single retry attempt record
- `src/main/kotlin/riven/core/models/workflow/engine/error/NodeExecutionError.kt` - Per-node error with retry history
- `src/main/kotlin/riven/core/models/workflow/engine/error/WorkflowExecutionError.kt` - Workflow-level error summary
- `src/main/kotlin/riven/core/configuration/workflow/WorkflowRetryConfigurationProperties.kt` - Spring ConfigurationProperties for retry settings
- `src/main/resources/application.yml` - Added riven.workflow.retry configuration section

## Decisions Made
- Used enum property `retryable: Boolean` for error classification (simpler than method, evaluable at compile time)
- Non-retryable HTTP status codes: 400, 401, 403, 404, 422 (client errors that won't succeed on retry)
- Separate error models for node-level (stored in workflow_node_executions.error) vs workflow-level (stored in workflow_executions.error)
- CRUD action retry defaults to 2 attempts (fewer than HTTP actions at 3)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Error models ready for Plan 07-02 (RetryCalculationService)
- Configuration properties ready for injection into retry services
- No blockers for proceeding

---
*Phase: 07-error-handling-retry-logic*
*Completed: 2026-01-22*
