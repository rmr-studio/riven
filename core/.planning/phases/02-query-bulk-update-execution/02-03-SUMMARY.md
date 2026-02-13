---
phase: 02-query-bulk-update-execution
plan: 03
subsystem: workflows
tags: [kotlin, workflow-engine, bulk-update, entity-query, batch-processing, error-handling]

# Dependency graph
requires:
  - phase: 02-query-bulk-update-execution
    plan: 02
    provides: BulkUpdateEntity model layer with types, config, validation, metadata
  - phase: 02-query-bulk-update-execution
    plan: 01
    provides: QueryEntity execution with filter template resolution pattern
provides:
  - BulkUpdateEntity execute() implementation with batch processing
  - Paginated entity retrieval (processes ALL matching entities)
  - FAIL_FAST and BEST_EFFORT error handling modes
  - BulkUpdateEntity registration in node registry and coordination service
affects: [workflow-execution, node-schemas-api, output-validation-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Paginated bulk retrieval (loop through ALL entities, not capped by query limit)"
    - "Batch processing pattern (50 entities per batch for memory efficiency)"
    - "Error handling mode dispatch (FAIL_FAST vs BEST_EFFORT with different failure semantics)"
    - "Filter template resolution reuse (copied from QueryEntityActionConfig)"

key-files:
  created: []
  modified:
    - src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowBulkUpdateEntityActionConfig.kt
    - src/main/kotlin/riven/core/service/workflow/WorkflowNodeConfigRegistry.kt
    - src/main/kotlin/riven/core/service/workflow/engine/coordinator/WorkflowCoordinationService.kt

key-decisions:
  - "Batch size of 50 entities chosen for memory efficiency during bulk updates"
  - "Query page size of 100 entities for efficient pagination during retrieval"
  - "Reuse filter template resolution logic from QueryEntityActionConfig (code duplication acceptable for model-layer self-containment)"

patterns-established:
  - "Bulk operation execute() methods paginate through ALL results ignoring query limits"
  - "Batch processing reduces memory pressure during large bulk operations"
  - "Error handling modes affect both control flow (FAIL_FAST early return) and output structure"

# Metrics
duration: 30min
completed: 2026-02-13
---

# Phase 2 Plan 3: BulkUpdateEntity Execution Implementation Summary

**Implement BulkUpdateEntity execute() with batch processing, error handling modes, and register node in system**

## Performance

- **Duration:** 30 min
- **Started:** 2026-02-13T05:05:37Z
- **Completed:** 2026-02-13T05:36:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Implemented BulkUpdateEntityActionConfig.execute() with full paginated query loop, batch processing, and error handling
- Query retrieves ALL matching entities across multiple pages (100 per page), not capped by query limit
- Entity updates applied in batches of 50 using EntityService.saveEntity()
- FAIL_FAST mode stops on first error and returns count of successes before failure
- BEST_EFFORT mode continues through all entities and collects failed entity IDs with error messages
- Reused filter template resolution logic from QueryEntityActionConfig
- Registered BULK_UPDATE_ENTITY in WorkflowNodeConfigRegistry (exposes metadata, configSchema, outputMetadata via API)
- Added config map case in WorkflowCoordinationService for template resolution before execution
- OutputMetadataValidationTest now validates BulkUpdateEntityActionConfig outputMetadata

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement BulkUpdateEntity execute() with batch processing and error handling** - `ca91850b` (feat)
   - Added imports for EntityQueryService, EntityService, WorkflowNodeInputResolverService, coroutines
   - Implemented execute() with paginated query loop (QUERY_PAGE_SIZE = 100)
   - Accumulates all entity IDs across pages (not capped by query limit)
   - Processes entities in batches (BULK_UPDATE_BATCH_SIZE = 50)
   - Maps resolved payload to EntityAttributeRequest with SchemaType.TEXT
   - FAIL_FAST error handling: catches exception, logs error, returns immediately with counts
   - BEST_EFFORT error handling: catches exception, logs warning, collects failed entity details, continues
   - Returns BulkUpdateEntityOutput with accurate entitiesUpdated, entitiesFailed, failedEntityDetails, totalProcessed
   - Added resolveFilterTemplates() and resolveRelationshipConditionTemplates() helper methods (copied from QueryEntityActionConfig)

2. **Task 2: Register BulkUpdateEntity in WorkflowNodeConfigRegistry and WorkflowCoordinationService** - `104fddb8` (feat)
   - Added registerNode<WorkflowBulkUpdateEntityActionConfig> to WorkflowNodeConfigRegistry.registerAllNodes()
   - Added config map case for WorkflowBulkUpdateEntityActionConfig in WorkflowCoordinationService
   - Registry now extracts metadata, configSchema, outputMetadata via reflection
   - Node appears in node-schemas API endpoint via getAllNodes()
   - OutputMetadataValidationTest validates outputMetadata keys match BulkUpdateEntityOutput.toMap() keys

## Files Created/Modified

Modified:
- `src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowBulkUpdateEntityActionConfig.kt` - Replaced NotImplementedError execute() placeholder with full implementation (264 lines added)
- `src/main/kotlin/riven/core/service/workflow/WorkflowNodeConfigRegistry.kt` - Added BULK_UPDATE_ENTITY registration
- `src/main/kotlin/riven/core/service/workflow/engine/coordinator/WorkflowCoordinationService.kt` - Added config map case for template resolution

## Decisions Made

**Batch size of 50 entities:**
Decision to process entities in batches of 50 during bulk update. Rationale: Balances memory efficiency (don't load all entities at once) with performance (reduce per-entity overhead). Smaller than query page size to allow for flexible batch-level error handling.

**Query page size of 100 entities:**
Decision to fetch entities in pages of 100 during initial retrieval. Rationale: Efficient pagination without overwhelming memory. Matches system-wide query limit used in QueryEntityActionConfig.

**Code duplication for filter template resolution:**
Decision to duplicate resolveFilterTemplates() logic from QueryEntityActionConfig rather than extracting to shared utility. Rationale: Keeps model layer self-contained and reduces coupling. Both execute() methods can evolve independently. Trade-off accepted: code duplication over abstraction complexity.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all planned components compiled and passed tests on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Complete BulkUpdateEntity workflow node ready for production use:
- Full execute() implementation with batch processing
- Paginated retrieval processes ALL matching entities (not capped by query limit)
- Error handling modes work correctly (FAIL_FAST early return, BEST_EFFORT full processing)
- Node registered in system (registry and coordination service)
- OutputMetadataValidationTest validates output structure
- All tests pass

All must-haves verified:
- ✅ BulkUpdateEntity execute() queries all matching entities via pagination loop
- ✅ Entity updates applied in batches of 50 using EntityService.saveEntity()
- ✅ FAIL_FAST mode stops on first error, returns count of successes before failure
- ✅ BEST_EFFORT mode continues through all entities, collects failed entity IDs with errors
- ✅ No rollback on failure (entities updated before failure remain updated)
- ✅ BulkUpdateEntity registered in WorkflowNodeConfigRegistry
- ✅ BulkUpdateEntity config map handled in WorkflowCoordinationService
- ✅ OutputMetadataValidationTest validates outputMetadata keys match toMap() keys
- ✅ All tests pass

---
*Phase: 02-query-bulk-update-execution*
*Completed: 2026-02-13*

## Self-Check: PASSED

All claimed files and commits verified:
- ✓ WorkflowBulkUpdateEntityActionConfig.kt modified (execute() implemented)
- ✓ WorkflowNodeConfigRegistry.kt modified (BULK_UPDATE_ENTITY registered)
- ✓ WorkflowCoordinationService.kt modified (config map case added)
- ✓ Commit ca91850b exists (Task 1)
- ✓ Commit 104fddb8 exists (Task 2)
