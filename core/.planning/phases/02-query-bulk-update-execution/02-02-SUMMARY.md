---
phase: 02-query-bulk-update-execution
plan: 02
subsystem: workflows
tags: [kotlin, workflow-engine, bulk-update, entity-query, error-handling]

# Dependency graph
requires:
  - phase: 01-foundation-infrastructure
    provides: OutputFieldType enum and WorkflowNodeOutputMetadata infrastructure
provides:
  - BulkUpdateErrorHandling enum with FAIL_FAST and BEST_EFFORT modes
  - BulkUpdateEntityOutput NodeOutput with update metrics
  - BULK_UPDATE_ENTITY WorkflowActionType enum value
  - WorkflowBulkUpdateEntityActionConfig with embedded query, validation, and metadata
affects: [03-execution-implementation, registry-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Embedded query pattern for bulk operations (self-contained config)"
    - "Error handling mode enum for user-configurable failure behavior"

key-files:
  created:
    - src/main/kotlin/riven/core/enums/workflow/BulkUpdateErrorHandling.kt
    - src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowBulkUpdateEntityActionConfig.kt
  modified:
    - src/main/kotlin/riven/core/enums/workflow/WorkflowActionType.kt
    - src/main/kotlin/riven/core/models/workflow/engine/state/NodeOutput.kt

key-decisions:
  - "Embedded query config in BulkUpdateEntityActionConfig instead of separate QueryEntity dependency"
  - "FAIL_FAST as default error handling mode for safety (explicit opt-in to BEST_EFFORT)"
  - "failedEntityDetails as List<Map<String, Any?>> for flexible error reporting structure"

patterns-established:
  - "Bulk operation configs embed query configuration rather than depending on upstream nodes"
  - "Error handling modes exposed as user-configurable enum field in config schema"

# Metrics
duration: 5min
completed: 2026-02-13
---

# Phase 2 Plan 2: BulkUpdateEntity Model Layer Summary

**Complete BulkUpdateEntity type system with error handling enum, typed output with failure metrics, and config class with embedded query validation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-13T04:54:57Z
- **Completed:** 2026-02-13T05:00:20Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created BulkUpdateErrorHandling enum defining FAIL_FAST and BEST_EFFORT failure modes
- Added BulkUpdateEntityOutput NodeOutput with entitiesUpdated, entitiesFailed, failedEntityDetails, and totalProcessed fields
- Extended WorkflowActionType enum with BULK_UPDATE_ENTITY value
- Built complete WorkflowBulkUpdateEntityActionConfig with embedded query, payload map, error handling mode, companion metadata/configSchema/outputMetadata, recursive filter validation, and placeholder execute()

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BulkUpdateErrorHandling enum and BulkUpdateEntityOutput NodeOutput** - `be24142` (feat)
   - Created BulkUpdateErrorHandling.kt with FAIL_FAST and BEST_EFFORT enum values and comprehensive documentation
   - Added BulkUpdateEntityOutput data class to NodeOutput.kt with 4 fields and toMap() implementation
   - Added BULK_UPDATE_ENTITY to WorkflowActionType enum

2. **Task 2: Create WorkflowBulkUpdateEntityActionConfig** - _Pre-existing in commit 9304d378_
   - Config class already existed from previous session (02-01 summary commit)
   - Verified all components present: metadata, configSchema, outputMetadata, validate(), placeholder execute()
   - No new commit required - work already complete

## Files Created/Modified

Created:
- `src/main/kotlin/riven/core/enums/workflow/BulkUpdateErrorHandling.kt` - Error handling mode enum with FAIL_FAST (stop on first failure) and BEST_EFFORT (process all regardless of failures)
- `src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowBulkUpdateEntityActionConfig.kt` - Full config class with embedded query, payload, errorHandling, pagination, timeout, validation, and metadata

Modified:
- `src/main/kotlin/riven/core/enums/workflow/WorkflowActionType.kt` - Added BULK_UPDATE_ENTITY enum value
- `src/main/kotlin/riven/core/models/workflow/engine/state/NodeOutput.kt` - Added BulkUpdateEntityOutput data class with update metrics

## Decisions Made

**Embedded query configuration pattern:**
Decision to embed EntityQuery directly in BulkUpdateEntityActionConfig rather than requiring a separate upstream QueryEntity node. Rationale: Self-contained bulk updates are simpler to configure and execute - user defines query and updates in one node rather than wiring two nodes together. This matches the pattern where bulk operations are atomic units.

**FAIL_FAST as default error handling:**
Decision to default errorHandling to FAIL_FAST rather than BEST_EFFORT. Rationale: Safer default behavior - stops immediately on error rather than potentially propagating bad updates across many entities. Users must explicitly opt into BEST_EFFORT when they understand the implications.

**Flexible failedEntityDetails structure:**
Decision to use List<Map<String, Any?>> for failedEntityDetails rather than a typed data class. Rationale: Allows flexible error reporting with entityId and error message, plus potential future fields without schema changes. Maps to JSON naturally for API responses.

## Deviations from Plan

None - plan executed exactly as written.

Note: Task 2 (WorkflowBulkUpdateEntityActionConfig) was completed in a previous session and included in commit 9304d378 (02-01 summary). This session verified all components exist and created Task 1 commit only.

## Issues Encountered

None - all planned components compiled and passed tests on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Complete BulkUpdateEntity model layer ready for execution implementation (Plan 03):
- Type system foundation in place (enum, output, config)
- Validation logic covers filter tree, payload templates, pagination
- Companion metadata declares configSchema and outputMetadata for frontend
- Placeholder execute() method ready to be replaced with actual bulk update logic

All must-haves verified:
- ✅ BulkUpdateErrorHandling enum with FAIL_FAST and BEST_EFFORT
- ✅ BULK_UPDATE_ENTITY in WorkflowActionType
- ✅ BulkUpdateEntityOutput with entitiesUpdated, entitiesFailed, failedEntityDetails, totalProcessed
- ✅ WorkflowBulkUpdateEntityActionConfig implements WorkflowActionConfig
- ✅ Config has embedded query, payload, errorHandling, pagination, timeout
- ✅ Companion declares metadata, configSchema, outputMetadata
- ✅ outputMetadata keys match BulkUpdateEntityOutput.toMap() keys exactly
- ✅ validate() covers filter tree, payload templates, pagination, timeout
- ✅ execute() placeholder throws NotImplementedError with descriptive message

---
*Phase: 02-query-bulk-update-execution*
*Completed: 2026-02-13*

## Self-Check: PASSED

All claimed files and commits verified:
- ✓ BulkUpdateErrorHandling.kt exists
- ✓ WorkflowBulkUpdateEntityActionConfig.kt exists
- ✓ Commit be24142 exists (Task 1)
- ✓ Commit 9304d378 exists (contains Task 2 work from previous session)
