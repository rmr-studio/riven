---
phase: 01-foundation-infrastructure
plan: 01
subsystem: workflow-metadata
tags: [kotlin, reflection, data-model, api]

# Dependency graph
requires:
  - phase: none
    provides: baseline codebase structure
provides:
  - Output metadata data model (OutputFieldType enum, WorkflowNodeOutputField, WorkflowNodeOutputMetadata)
  - Registry reflection infrastructure for extracting outputMetadata from companion objects
  - API exposure via node-schemas endpoint
  - Proof-of-concept outputMetadata on CreateEntityActionConfig
affects: [02-query-bulk-update, 03-output-metadata-coverage]

# Tech tracking
tech-stack:
  added: []
  patterns: [reflection-based-metadata-extraction, companion-object-registry-pattern]

key-files:
  created:
    - src/main/kotlin/riven/core/enums/workflow/OutputFieldType.kt
    - src/main/kotlin/riven/core/models/workflow/node/config/WorkflowNodeOutputField.kt
    - src/main/kotlin/riven/core/models/workflow/node/config/WorkflowNodeOutputMetadata.kt
  modified:
    - src/main/kotlin/riven/core/service/workflow/WorkflowNodeConfigRegistry.kt
    - src/main/kotlin/riven/core/models/response/workflow/NodeTypeSchemaResponse.kt
    - src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowCreateEntityActionConfig.kt

key-decisions:
  - "Nullable outputMetadata property during rollout - nodes without it return null (Phase 3 fills in missing)"
  - "exampleValue uses native Kotlin types (mapOf, UUID string) for ergonomic companion object declarations"
  - "Entity type references use entityTypeId: UUID? = null with null meaning dynamic/runtime resolution"

patterns-established:
  - "Reflection-based companion object property extraction: find member by name, safe cast result, continue on null"
  - "Ordered List for UI display order: outputMetadata.fields declaration order = frontend display order"

# Metrics
duration: 3 min
completed: 2026-02-13
---

# Phase 1 Plan 1: Foundation Infrastructure Summary

**Output metadata infrastructure established with enum, data classes, registry extraction, API exposure, and CreateEntity proof-of-concept**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T22:38:31Z
- **Completed:** 2026-02-12T22:41:45Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments

- Created OutputFieldType enum with 9 values (UUID, STRING, BOOLEAN, NUMBER, MAP, LIST, OBJECT, ENTITY, ENTITY_LIST) following existing WorkflowNodeConfigFieldType pattern
- Created WorkflowNodeOutputField data class with 7 properties (key, label, type, description, nullable, exampleValue, entityTypeId) matching WorkflowNodeConfigField pattern
- Created WorkflowNodeOutputMetadata wrapper data class for ordered field lists
- Extended WorkflowNodeConfigRegistry to extract outputMetadata from companion objects via Kotlin reflection
- Wired outputMetadata through getAllNodes() to WorkflowNodeMetadata API response model
- Added outputMetadata field to NodeTypeSchemaResponse for Swagger documentation
- Declared outputMetadata in CreateEntityActionConfig companion with 3 fields matching CreateEntityOutput.toMap() keys

## Task Commits

Each task was committed atomically:

1. **Task 1: Create OutputFieldType enum and output metadata data classes** - `305c8bf` (feat)
2. **Task 2: Extend registry extraction and API response, add CreateEntity outputMetadata** - `299114e` (feat)

## Files Created/Modified

- `src/main/kotlin/riven/core/enums/workflow/OutputFieldType.kt` - Enum defining all supported output field types (UUID through ENTITY_LIST)
- `src/main/kotlin/riven/core/models/workflow/node/config/WorkflowNodeOutputField.kt` - Data class for individual output field definition with type, label, example, etc.
- `src/main/kotlin/riven/core/models/workflow/node/config/WorkflowNodeOutputMetadata.kt` - Wrapper data class for output metadata field list
- `src/main/kotlin/riven/core/service/workflow/WorkflowNodeConfigRegistry.kt` - Extended registerNode() to extract outputMetadata via reflection, added property to NodeSchemaEntry and WorkflowNodeMetadata
- `src/main/kotlin/riven/core/models/response/workflow/NodeTypeSchemaResponse.kt` - Added outputMetadata field for API response
- `src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowCreateEntityActionConfig.kt` - Added outputMetadata companion property with 3 fields

## Decisions Made

**Nullable outputMetadata during rollout:** Registry returns null for nodes without outputMetadata instead of failing. Phase 3 will fill in missing nodes. This enables gradual adoption without breaking existing functionality.

**Native Kotlin types for exampleValue:** Use mapOf(), listOf(), UUID strings instead of JSON strings. Jackson serializes them correctly and it's more ergonomic in companion object declarations.

**Dynamic entity type resolution:** entityTypeId: UUID? = null with null meaning "resolve from node config at runtime". QueryEntity can query any entity type - outputMetadata declares ENTITY_LIST shape but actual type comes from config.entityTypeId field.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Output metadata infrastructure complete and validated
- CreateEntityActionConfig proves the full pipeline works (companion -> registry -> API)
- Ready for Phase 1 Plan 2: Parameterized validation tests for outputMetadata keys and types
- Zero test regressions - all existing tests pass

## Self-Check: PASSED

All created files exist on disk and both commits are present in git history.

---
*Phase: 01-foundation-infrastructure*
*Completed: 2026-02-13*
