---
phase: 02-query-bulk-update-execution
plan: 01
subsystem: workflow-node-execution
tags: [query-entity, output-metadata, template-resolution]
dependency_graph:
  requires:
    - phase: 01
      plan: 01
      reason: "outputMetadata validation infrastructure"
    - phase: 01
      plan: 02
      reason: "toMap() superset rule validation"
  provides:
    - "QueryEntityNode execute() implementation"
    - "QueryEntityActionConfig.outputMetadata declaration"
    - "FilterValue.Template resolution in query filters"
  affects:
    - "Entity query execution in workflow context"
    - "Frontend node output preview for QueryEntity nodes"
tech_stack:
  added: []
  patterns:
    - "Recursive FilterValue.Template resolution"
    - "System-wide query limit enforcement (100)"
    - "EntityQueryService integration in workflow nodes"
key_files:
  created: []
  modified:
    - path: "src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowQueryEntityActionConfig.kt"
      purpose: "Implement QueryEntity execution and output metadata"
      lines_changed: 192
decisions:
  - "System query limit of 100: Prevents runaway queries while allowing meaningful result sets"
  - "Full entity objects in output: Each entity includes id, typeId, payload, icon, identifierKey, timestamps"
  - "Recursive template resolution: Walk filter tree to resolve FilterValue.Template before query execution"
metrics:
  duration_minutes: 2
  completed: "2026-02-13T04:57:05Z"
  tasks_completed: 1
  files_modified: 1
---

# Phase 02 Plan 01: Query Entity Execution Summary

**One-liner:** QueryEntityNode executes queries via EntityQueryService with template-resolved filters and declares ENTITY_LIST outputMetadata

## Overview

Implemented QueryEntityActionConfig.execute() to fetch entities via EntityQueryService with template resolution in filter values, and declared outputMetadata so the frontend knows what data this node produces.

## What Was Built

### Execute Implementation

**QueryEntityActionConfig.execute():**
- Obtains EntityQueryService and WorkflowNodeInputResolverService from services provider
- Recursively resolves FilterValue.Template instances in the query filter tree using WorkflowNodeInputResolverService
- Applies system-wide query limit of 100 (via DEFAULT_QUERY_LIMIT constant) to prevent runaway queries
- Executes query via EntityQueryService.execute() wrapped in runBlocking (service is suspend, execute is not)
- Transforms EntityQueryResult to QueryEntityOutput with full entity maps including id, typeId, payload, icon, identifierKey, timestamps
- Returns QueryEntityOutput with entities list, totalCount (as Int), and hasMore (Boolean)

**Helper methods:**
- `resolveFilterTemplates()`: Recursively walks QueryFilter tree, replacing FilterValue.Template with FilterValue.Literal containing resolved values
- `resolveRelationshipConditionTemplates()`: Handles template resolution for RelationshipFilter conditions (TargetEquals, TargetMatches, TargetTypeMatches)

### Output Metadata Declaration

**WorkflowQueryEntityActionConfig.companion.outputMetadata:**
- **entities** (ENTITY_LIST): List of matching entities with full structure, entityTypeId = null (dynamic resolution at runtime)
- **totalCount** (NUMBER): Total matching entities before pagination
- **hasMore** (BOOLEAN): Whether more results exist beyond system limit

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- All tests pass (./gradlew test)
- OutputMetadataValidationTest validates QueryEntityActionConfig.outputMetadata keys match QueryEntityOutput.toMap() keys
- File compiles with no errors
- No NotImplementedError remains in execute()

## Key Decisions

1. **System query limit of 100**: Applied via `minOf(pagination.limit, DEFAULT_QUERY_LIMIT)` to prevent runaway queries while still allowing meaningful result sets. This is a sensible default that can be tuned later if needed.

2. **Full entity objects in output**: Each entity map includes all fields (id, typeId, payload, icon, identifierKey, createdAt, updatedAt) per locked decision, giving downstream nodes complete entity context.

3. **Recursive template resolution**: Filter templates are resolved by walking the entire filter tree before query execution, handling nested filters in AND/OR/Relationship conditions. This ensures all FilterValue.Template instances are resolved to FilterValue.Literal before EntityQueryService receives the query.

## Technical Implementation Notes

- Used `runBlocking` to bridge suspend EntityQueryService.execute() with non-suspend WorkflowNodeConfig.execute()
- Template resolution uses existing WorkflowNodeInputResolverService for consistency with other node types
- Filter tree traversal preserves immutability via copy() methods on sealed QueryFilter types
- EntityQueryResult.totalCount (Long) converted to Int for QueryEntityOutput.totalCount to match frontend expectations

## Self-Check: PASSED

**Created files:** None (all modifications)

**Modified files:**
- ✓ src/main/kotlin/riven/core/models/workflow/node/config/actions/WorkflowQueryEntityActionConfig.kt exists

**Commits:**
- ✓ 17f18be5 exists in git log

All claims verified.
