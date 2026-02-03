---
phase: 01-query-model-extraction
plan: 01
subsystem: api
tags: [kotlin, jackson, sealed-interface, query-models, polymorphic-json]

# Dependency graph
requires: []
provides:
  - EntityQuery model with maxDepth configuration
  - QueryFilter sealed interface with ATTRIBUTE, RELATIONSHIP, AND, OR subtypes
  - RelationshipCondition sealed interface with 6 subtypes including TargetTypeMatches
  - QueryPagination with OrderByClause and SortDirection
  - QueryProjection for field selection
  - TypeBranch for polymorphic relationship type-aware filtering
affects: [02-query-service-implementation, workflow-query-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sealed interface with Jackson @JsonSubTypes for polymorphic JSON
    - Data objects for stateless sealed members
    - Init block validation for domain constraints

key-files:
  created:
    - src/main/kotlin/riven/core/models/entity/query/EntityQuery.kt
    - src/main/kotlin/riven/core/models/entity/query/QueryFilter.kt
    - src/main/kotlin/riven/core/models/entity/query/RelationshipCondition.kt
    - src/main/kotlin/riven/core/models/entity/query/QueryPagination.kt
    - src/main/kotlin/riven/core/models/entity/query/QueryProjection.kt
  modified: []

key-decisions:
  - "EntityQuery.maxDepth defaults to 3 with 1-10 validation range"
  - "TypeBranch placed before RelationshipCondition for forward reference"
  - "TargetTypeMatches validates non-empty branches in init block"

patterns-established:
  - "Query models in riven.core.models.entity.query package"
  - "Sealed interfaces keep subtypes nested for cohesion"
  - "Supporting types (enums, small data classes) co-located in same file"

# Metrics
duration: 2min
completed: 2026-02-01
---

# Phase 1 Plan 1: Query Model Extraction Summary

**Query models extracted to models/entity/query/ with EntityQuery.maxDepth (1-10, default 3) and new TargetTypeMatches condition for polymorphic relationship filtering**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-01T08:43:03Z
- **Completed:** 2026-02-01T08:45:05Z
- **Tasks:** 3
- **Files created:** 5

## Accomplishments
- Extracted query models from WorkflowQueryEntityActionConfig.kt to dedicated query package
- Added EntityQuery.maxDepth with validation (1-10 range, default 3) for traversal depth limiting
- Created TargetTypeMatches with TypeBranch for polymorphic relationship type-aware filtering
- Preserved all Jackson @JsonTypeName annotations for backward-compatible JSON serialization

## Task Commits

Each task was committed atomically:

1. **Task 1: Create EntityQuery and QueryProjection** - `660819e` (feat)
2. **Task 2: Create QueryFilter and QueryPagination** - `fe730d0` (feat)
3. **Task 3: Create RelationshipCondition with TargetTypeMatches** - `a8bafe4` (feat)

## Files Created

- `src/main/kotlin/riven/core/models/entity/query/EntityQuery.kt` - Core query definition with entityTypeId, filter, maxDepth
- `src/main/kotlin/riven/core/models/entity/query/QueryFilter.kt` - Filter sealed interface with ATTRIBUTE/RELATIONSHIP/AND/OR + FilterOperator + FilterValue
- `src/main/kotlin/riven/core/models/entity/query/RelationshipCondition.kt` - Relationship condition sealed interface with 6 subtypes + TypeBranch
- `src/main/kotlin/riven/core/models/entity/query/QueryPagination.kt` - Pagination with limit/offset/orderBy + OrderByClause + SortDirection
- `src/main/kotlin/riven/core/models/entity/query/QueryProjection.kt` - Field selection with includeAttributes/includeRelationships/expandRelationships

## Decisions Made

- EntityQuery.maxDepth uses `require` in init block rather than annotation-based validation (immediate fail-fast)
- TypeBranch defined at file level before RelationshipCondition to enable forward reference from TargetTypeMatches
- All sealed interface subtypes kept nested within their parent interface for cohesion

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - compilation succeeded after all 5 files created.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All query models ready for EntityQueryService implementation
- WorkflowQueryEntityActionConfig still references original models (migration planned for later)
- TypeBranch and TargetTypeMatches ready for polymorphic query execution

---
*Phase: 01-query-model-extraction*
*Completed: 2026-02-01*
