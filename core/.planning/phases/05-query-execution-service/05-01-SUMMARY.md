---
phase: 05-query-execution-service
plan: 01
subsystem: entity-query-execution
tags: [exception-handling, query-assembly, configuration]
requires: [04-01]
provides:
  - QueryExecutionException for SQL error wrapping
  - ID-only data queries from EntityQueryAssembler
  - Configurable query timeout via application.yml
affects: [05-02]
tech-stack:
  added: []
  patterns:
    - Two-step ID-then-load query pattern
    - Per-query timeout control via SET statement_timeout
key-files:
  created:
    - src/main/kotlin/riven/core/exceptions/query/QueryExecutionException.kt
    - src/main/resources/application.yml
  modified:
    - src/main/kotlin/riven/core/service/entity/query/EntityQueryAssembler.kt
key-decisions:
  - decision: QueryExecutionException is NOT part of QueryFilterException sealed hierarchy
    rationale: Different error domain - SQL execution errors vs filter validation errors
    alternatives: Could have extended sealed hierarchy
    impact: Clearer separation between validation and execution error handling
  - decision: SELECT e.id instead of SELECT e.*
    rationale: Implements locked two-step ID-then-load pattern from Phase 5 context
    alternatives: Could select full rows and filter in-memory
    impact: Enables lean native query execution, IDs loaded via repository batch fetch
  - decision: Per-query timeout via application property
    rationale: Allows runtime configuration without requiring global JDBC timeout
    alternatives: Could use spring.jdbc.template.query-timeout
    impact: Service can use SET statement_timeout for per-query control
duration: 2 min
completed: 2026-02-07
---

# Phase 05 Plan 01: Query Execution Infrastructure Summary

**One-liner:** QueryExecutionException and assembler SELECT e.id change for two-step ID-then-load pattern

## Performance

- **Duration:** 2 minutes (110 seconds)
- **Started:** 2026-02-07 14:43:40 UTC
- **Completed:** 2026-02-07 14:45:30 UTC
- **Tasks:** 2/2 completed
- **Files:** 2 created, 1 modified

## Accomplishments

Created foundational infrastructure for EntityQueryService (Plan 02):

1. **QueryExecutionException** - Domain exception for wrapping DataAccessException with query context
2. **ID-only data queries** - Modified EntityQueryAssembler to SELECT e.id instead of e.*
3. **Query timeout configuration** - Added riven.query.timeout-seconds property (default 10s)

The assembler change implements the locked decision from Phase 5 context: "Two-step approach: native query returns IDs only, then batch-load full entities via repository."

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create QueryExecutionException and modify assembler data query | 834a6c2 | QueryExecutionException.kt, EntityQueryAssembler.kt |
| 2 | Add query timeout configuration to application.yml | ea7372f | application.yml |

## Files Created

**src/main/kotlin/riven/core/exceptions/query/QueryExecutionException.kt**
- Runtime exception for SQL execution failures
- Takes message and optional cause (Throwable)
- NOT part of QueryFilterException sealed hierarchy
- Context details included in message string by caller

**src/main/resources/application.yml**
- Created with query timeout configuration
- Added under riven.query namespace
- Default timeout: 10 seconds

## Files Modified

**src/main/kotlin/riven/core/service/entity/query/EntityQueryAssembler.kt**
- Changed `SELECT e.*` to `SELECT e.id` in buildDataQuery()
- Updated documentation to reflect ID-only data queries
- Implements two-step ID-then-load pattern
- No changes to method signature, parameters, or count query

## Decisions Made

### QueryExecutionException Scope
Kept QueryExecutionException separate from the QueryFilterException sealed hierarchy. These are different error domains:
- **QueryFilterException**: Filter validation errors (caught during assembly)
- **QueryExecutionException**: SQL execution errors (caught during native query execution)

This separation enables distinct error handling strategies in the service layer.

### Two-Step Query Pattern
Modified assembler to select only entity IDs, not full rows. This implements the locked decision from Phase 5 context and enables:
- Lean native SQL execution (minimal data transfer)
- Batch loading of full entities via EntityRepository
- Consistent entity hydration through JPA
- Better memory efficiency for large result sets

### Timeout Configuration Location
Placed query timeout under `riven.query` namespace (not Spring JDBC global config) to enable per-query control via `SET statement_timeout` in EntityQueryService.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated assembler documentation**
- **Found during:** Task 1
- **Issue:** Class-level documentation still referenced `SELECT e.*` after changing to `SELECT e.id`
- **Fix:** Updated query structure comment to reflect ID-only data queries
- **Files modified:** EntityQueryAssembler.kt (line 20)
- **Commit:** 834a6c2

## Issues Encountered

None. All tasks completed successfully on first attempt.

## Next Phase Readiness

**Ready for Plan 05-02 (EntityQueryService):**
- ✓ QueryExecutionException available for wrapping DataAccessException
- ✓ Assembler produces ID-only data queries
- ✓ Query timeout configurable via application.yml
- ✓ No blockers

**Dependencies for Plan 05-02:**
- EntityRepository for batch loading entities by IDs
- JdbcTemplate for native SQL execution
- @Value injection for timeout configuration

## Self-Check: PASSED

All files exist:
- QueryExecutionException.kt ✓
- application.yml ✓

All commits exist:
- 834a6c2 ✓
- ea7372f ✓
