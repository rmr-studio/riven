# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-09)

**Core value:** End-to-end workflow lifecycle: create graph -> save -> execute via Temporal -> see results
**Current focus:** Phase 7.2 - Workflow State Management (IN PROGRESS)

## Current Position

Phase: 7.2 of 8 (Workflow State Management)
Plan: 5 of 7 in current phase
Status: In progress
Last activity: 2026-02-01 - Completed 07.2-05-PLAN.md (Node Config Execute Returns)

Progress: ████████████████████████████░ 97% (29 of 30 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 29
- Average duration: ~17 minutes (0.29 hours)
- Total execution time: 8.12 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 - Expression System | 1 | 0.5h | 0.5h |
| 2 - Entity Context Integration | 1 | 3.67h | 3.67h |
| 3 - Temporal Workflow Engine | 1 | 0.28h | 0.28h |
| 4 - Action Executors | 2 | 0.88h | 0.44h |
| 4.1 - Action Execution | 3 | 0.72h | 0.24h |
| 5 - DAG Execution Coordinator | 3 | 0.37h | 0.12h |
| 6 - Backend API Layer | 3 | 0.17h | 0.06h |
| 6.1 - Execution Queue Management | 3 | 0.18h | 0.06h |
| 7 - Error Handling & Retry Logic | 3 | 0.13h | 0.04h |
| 7.1 - Node Configuration Development | 5 | 0.36h | 0.07h |
| 7.2 - Workflow State Management | 5 | 0.35h | 0.07h |

**Recent Trend:**
- Last 5 plans: 07.2-01 (0.04h), 07.2-02 (0.03h), 07.2-03 (0.04h), 07.2-04 (0.13h), 07.2-05 (0.22h)
- Trend: Excellent velocity maintained

## Accumulated Context

### Roadmap Evolution

- Phase 4.1 inserted after Phase 4: Action Execution (URGENT) - 2026-01-11
- Phase 6.1 inserted after Phase 6: Execution Queue Management (URGENT) - 2026-01-19
- Phase 7.1 inserted after Phase 7: Node Configuration Development (URGENT) - 2026-01-22
- Phase 7.2 inserted after Phase 7.1: Workflow State Management (URGENT) - 2026-02-01

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| Decision | Rationale | Plan |
|----------|-----------|------|
| Soft-delete for workflow definitions | Allows recovery, maintains referential integrity | 06-01 |
| Metadata-only updates via updateWorkflow | Graph structure updates handled separately | 06-01 |
| Cascade deletion on node delete | Deleting node must delete connected edges for graph consistency | 06-02 |
| Immutable versioning for config changes | Config changes create new entity version, metadata updates in place | 06-02 |
| Map return types for query responses | Flexibility for evolving response structure without DTOs | 06-03 |
| Workspace verification in service layer | Better error messages, supports cross-workspace scenarios | 06-03 |
| ShedLock for distributed scheduler locking | Ensures scheduled tasks only run on one instance | 06.1-01 |
| FIFO ordering via created_at ASC | Predictable queue behavior for workflow execution | 06.1-02 |
| SKIP LOCKED for concurrent claiming | Multiple dispatchers can claim items without blocking | 06.1-02 |
| Stale claim recovery with 5min default | Crash protection for stuck CLAIMED items | 06.1-02 |
| V1 uses default queue for all workspaces | Simplicity for initial release, per-workspace queues deferred | 06.1-03 |
| 202 Accepted for queue-based execution | Indicates asynchronous processing to client | 06.1-03 |
| Enum property for retryable classification | Simpler than method, evaluable at compile time | 07-01 |
| Non-retryable HTTP codes: 400, 401, 403, 404, 422 | Client errors won't succeed on retry | 07-01 |
| Kotlin object for WorkflowErrorClassifier | Direct calls without Spring injection, testable | 07-02 |
| Hardcoded retry values in workflow | Not a Spring bean, cannot inject ConfigurationProperties | 07-02 |
| Computed properties over methods for error helpers | Lightweight derived values, Kotlin-idiomatic | 07-03 |
| Direct object testing for stateless utilities | No Spring context or mocking needed for Kotlin objects | 07-03 |
| Detect malformed templates with {{ check | isTemplate() only matches valid templates, need explicit check for malformed | 07.1-01 |
| Config map getter pattern | Add computed `config` property returning typed fields as map for coordination service | 07.1-02 |
| Entity payload wrapping | Use EntityAttributeRequest with TEXT SchemaType default; infer later | 07.1-02 |
| HTTP method validated as enum set | GET, POST, PUT, DELETE, PATCH validated in validate() | 07.1-03 |
| Expression stored as string | Parsed on validation/execution per RESEARCH.md | 07.1-03 |
| Coordination service extracts typed fields | Required for InputResolverService compatibility | 07.1-03 |
| Validation runs before any database changes | Reject early, fail fast pattern | 07.1-04 |
| Triggers return valid() for now | Graceful fallback until trigger validation added | 07.1-04 |
| ENTITY_EVENT validates key and expressions | Non-empty validation for required fields | 07.1-05 |
| SCHEDULE validates cronExpression/interval | Mutual exclusivity already in init block | 07.1-05 |
| FUNCTION/WEBHOOK return valid() | Constructor enforces non-null | 07.1-05 |
| OperationType reuse for entity events | Reuse existing enum rather than creating EntityEventType | 07.2-03 |
| Entity data as Map for triggers | Avoid circular deps with Entity model, flexible payload structure | 07.2-03 |
| toMap() for template access | Enables {{ trigger.propertyName }} resolution | 07.2-03 |
| NullableValue wrapper for ConcurrentHashMap | ConcurrentHashMap doesn't support null values; inline value class has zero overhead | 07.2-01 |
| hasVariable() method for null distinction | Distinguish between "not set" and "explicitly set to null" | 07.2-01 |
| Write-once via putIfAbsent | Atomic operation prevents race conditions in concurrent writes to same key | 07.2-01 |
| Multi-prefix routing via root segment switch | Clean separation of prefix handling (steps/trigger/variables/loops) | 07.2-04 |
| Backward compat via optional .output segment | Check path[1] == "output" and skip if present | 07.2-04 |
| GenericMapOutput in production code | Allows test flexibility; sealed interface requires same package | 07.2-04 |
| NodeOutput as interface return type | Enables polymorphic dispatch while maintaining type safety | 07.2-05 |
| toMap() for data registry | Backward compatible: NodeOutput.toMap() used when storing in data registry | 07.2-05 |
| Typed outputs per action | Explicit contracts: each action returns specific fields, not generic map | 07.2-05 |

### Deferred Issues

None yet.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-01
Stopped at: Completed 07.2-05-PLAN.md (Node Config Execute Returns)
Resume file: N/A
Next action: Execute 07.2-06-PLAN.md (Coordination Service Integration)
