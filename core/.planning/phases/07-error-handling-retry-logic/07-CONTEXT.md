# Phase 7: Error Handling & Retry Logic - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement Temporal retry policies and error surfacing to execution records. Handles transient failures gracefully, provides clear error information for debugging, and defines failure behavior when retries exhaust. User-configurable retry settings and manual workflow resumption are deferred.

</domain>

<decisions>
## Implementation Decisions

### Retry Behavior
- Exponential backoff with jitter for transient errors
- Default 3 maximum retry attempts before giving up
- 4xx client errors (400, 401, 403, 404) fail immediately — no retries
- Only retry 5xx server errors and network failures
- Maximum backoff interval capped at 30 seconds

### Error Surfacing
- API responses include structured error details: node that failed, error type, message, retry count
- Execution records store full stack traces for debugging
- Each node has its own error field — can query exactly which nodes failed
- Full retry history logged: each attempt with timestamp and error message

### Failure Modes
- Workflow stops immediately when a node fails permanently (retries exhausted)
- No compensation/rollback in V1 — failed workflows stay failed
- No manual retry from failed node in V1 — create new execution to retry
- Single FAILED status — error details explain what went wrong

### Configuration Scope
- Workflow-level retry settings only — all nodes in workflow use same policy
- System defaults only — no user-configurable retry settings in V1
- Type-specific defaults: HTTP actions retry on 5xx/network; CONDITION never retries (deterministic)
- Retry configuration defined in application.yml for easy tuning without code changes

### Claude's Discretion
- Exact backoff intervals and jitter implementation
- Specific non-retryable error codes beyond 4xx
- Error message formatting and structure
- Temporal retry policy configuration details

</decisions>

<specifics>
## Specific Ideas

- CONDITION nodes should never retry — they're deterministic expression evaluation
- HTTP actions are the primary retry candidates — external APIs have transient failures
- CRUD operations (entity create/update/delete) may retry on database connection issues

</specifics>

<deferred>
## Deferred Ideas

- User-configurable retry settings per workflow — future enhancement
- Per-node retry configuration overrides — adds complexity
- Manual retry from failed node (resume execution) — requires state preservation
- Compensation/rollback actions on failure — saga pattern for later
- Reason codes on FAILED status (TIMEOUT, ERROR, CANCELLED) — keep simple for V1

</deferred>

---

*Phase: 07-error-handling-retry-logic*
*Context gathered: 2026-01-22*
