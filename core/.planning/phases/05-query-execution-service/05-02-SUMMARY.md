---
phase: 05-query-execution-service
plan: 02
subsystem: entity-query-execution
tags: [service-layer, query-execution, validation, coroutines, jdbc]
requires: [05-01, 04-01, 03-03, 02-03, 01-02]
provides:
  - EntityQueryService as single entry point for entity query execution
  - Complete query validation pipeline (attribute + relationship references)
  - Parallel data + count query execution via coroutines
  - Two-step ID-then-load pattern with result ordering preservation
affects: [06-01]
tech-stack:
  added: []
  patterns:
    - Suspend functions with coroutineScope for parallel query execution
    - Dedicated JdbcTemplate with timeout configuration
    - Two-part filter validation (attribute walk + relationship validator)
    - ID-to-index map for preserving SQL ordering after batch load
key-files:
  created:
    - src/main/kotlin/riven/core/service/entity/query/EntityQueryService.kt
  modified: []
key-decisions:
  - decision: Two-part filter validation (attribute walk + relationship validator delegation)
    rationale: QueryFilterValidator already handles relationships; attribute validation is orthogonal
    alternatives: Could have extended QueryFilterValidator to handle attributes
    impact: Clear separation of concerns, each validator focused on single responsibility
  - decision: Parallel query execution via coroutines on Dispatchers.IO
    rationale: Data and count queries are independent, can execute simultaneously
    alternatives: Could run sequentially
    impact: Better latency for queries (especially high-count scenarios), simpler than reactive streams
  - decision: Re-sort entities after batch load using ID-to-index map
    rationale: EntityRepository.findByIdIn() does not guarantee order; SQL order must be preserved for pagination
    alternatives: Could load entities one-by-one in order (O(n) queries vs O(1))
    impact: Correct pagination behavior, single batch query, minimal memory overhead
duration: 2.5 min
completed: 2026-02-07
---

# Phase 05 Plan 02: EntityQueryService Execution Pipeline Summary

**One-liner:** Complete entity query execution service with validation, parallel SQL execution, and two-step ID-then-load pattern

## Performance

- **Duration:** 2 minutes 28 seconds (148 seconds)
- **Started:** 2026-02-07 03:31:03 UTC
- **Completed:** 2026-02-07 03:33:31 UTC
- **Tasks:** 1/1 completed
- **Files:** 1 created, 0 modified

## Accomplishments

Created the core deliverable of Phase 5: EntityQueryService as the single entry point that ties together all prior phases into an executable query pipeline.

**Key Features:**

1. **Comprehensive Validation** - Two-part filter validation checks both attribute IDs (against entity type schema) and relationship references (via QueryFilterValidator) before SQL generation
2. **Parallel Execution** - Data and count queries execute simultaneously via coroutines on Dispatchers.IO for optimal latency
3. **Security by Design** - All queries parameterized via NamedParameterJdbcTemplate, workspace isolation enforced, configurable timeout
4. **Two-Step Loading** - Native query returns IDs only, then EntityRepository batch-loads full entities for lean SQL execution
5. **Order Preservation** - Re-sorts entities by ID-to-index map to maintain SQL ordering (created_at DESC, id ASC) after batch load
6. **Descriptive Errors** - Invalid attribute references list all valid attributes, QueryExecutionException wraps DataAccessException with context

**Architecture Integration:**

- Consumes EntityQueryAssembler (Phase 4) for SQL generation
- Delegates to QueryFilterValidator (Phase 3) for relationship validation
- Uses SqlFragment composition pattern (Phases 2-3) for parameterized queries
- Returns EntityQueryResult with Entity domain models (Phase 1)

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create EntityQueryService with validation, execution, and result mapping | 9e80784 | EntityQueryService.kt |

## Files Created

**src/main/kotlin/riven/core/service/entity/query/EntityQueryService.kt** (339 lines)
- Spring `@Service` with constructor injection of repositories, assembler, validator, DataSource
- Dedicated NamedParameterJdbcTemplate initialized with configurable timeout
- Single `suspend fun execute()` method accepting EntityQuery + workspaceId + pagination + projection
- `validateFilterReferences()` - Two-part validation walking filter tree for attributes + delegating to QueryFilterValidator for relationships
- `walkFilterForAttributes()` - Recursive tree walker collecting invalid attribute references
- `walkConditionForAttributes()` - Walks relationship conditions for nested filters
- `executeDataQuery()` - Executes SELECT e.id query, wraps DataAccessException in QueryExecutionException
- `executeCountQuery()` - Executes SELECT COUNT(*) query, wraps DataAccessException in QueryExecutionException
- Parallel execution via `coroutineScope { async(Dispatchers.IO) { } }`
- Re-sort logic using `entityIds.withIndex().associate { it.value to it.index }` for order preservation
- KotlinLogging for debug and error logging

## Files Modified

None.

## Decisions Made

### Two-Part Filter Validation

Separated attribute validation from relationship validation rather than extending QueryFilterValidator:
- **Attribute validation**: Walks filter tree checking attributeId in schema.properties.keys
- **Relationship validation**: Delegates to existing QueryFilterValidator

**Rationale**: QueryFilterValidator already handles relationships comprehensively (depth, references, type branches). Attribute validation is orthogonal and simpler (just UUID existence check).

**Impact**: Each validator has single responsibility, easier to test and maintain.

### Parallel Query Execution with Coroutines

Used `coroutineScope` with `async(Dispatchers.IO)` for data and count queries rather than sequential execution or reactive streams:

```kotlin
val (entityIds, totalCount) = coroutineScope {
    val dataDeferred = async(Dispatchers.IO) { executeDataQuery(assembled.dataQuery) }
    val countDeferred = async(Dispatchers.IO) { executeCountQuery(assembled.countQuery) }
    Pair(dataDeferred.await(), countDeferred.await())
}
```

**Rationale**: Queries are independent and can execute simultaneously. Coroutines integrate cleanly with Spring without reactive dependencies.

**Impact**: Better latency for queries (especially when count query is slow), simpler than reactive streams, leverages IO dispatcher for blocking JDBC calls.

### Order Preservation via ID-to-Index Map

Re-sorts entities after batch load using index map rather than loading entities one-by-one:

```kotlin
val idToIndex = entityIds.withIndex().associate { it.value to it.index }
val sortedEntities = entities.sortedBy { idToIndex[it.id] ?: Int.MAX_VALUE }
```

**Rationale**: EntityRepository.findByIdIn() does not guarantee order, but SQL ORDER BY must be preserved for correct pagination.

**Alternatives**: Could load entities sequentially (O(n) queries) or use SQL IN clause with array order (database-specific).

**Impact**: Single batch query (O(1)), correct pagination behavior, minimal memory overhead (small map), database-agnostic.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All tasks completed successfully on first attempt.

## Next Phase Readiness

**Phase 5 Complete - Ready for Phase 6 (End-to-End Testing):**
- ✓ EntityQueryService fully implements Phase 5 success criteria
- ✓ All filter references validated before SQL generation
- ✓ Parallel query execution with configurable timeout
- ✓ Results properly typed with correct pagination metadata
- ✓ Workspace isolation enforced via parameterized queries
- ✓ No blockers

**What Phase 6 Can Test:**

1. **Simple Attribute Filters** - EQUALS, NOT_EQUALS, IN, NOT_IN, CONTAINS, STARTS_WITH, ENDS_WITH
2. **Numeric/Date Comparisons** - GREATER_THAN, LESS_THAN, BETWEEN
3. **Boolean Operations** - AND, OR with deep nesting
4. **Relationship Traversal** - Exists, NotExists, TargetEquals, TargetMatches up to maxDepth=3
5. **Polymorphic Relationships** - TargetTypeMatches with multiple entity type branches
6. **Pagination** - Limit, offset, ordering, hasNextPage calculation
7. **Error Cases** - Invalid attribute/relationship IDs, depth exceeded, entity type not found

**Known Limitations (Phase 5 simplifications):**

- Attribute validation within nested relationship filters validates against SAME entity type (not cross-type)
- Projection parameter accepted but not yet implemented (fields still loaded by EntityRepository)
- TargetTypeMatches branch entityTypeId cross-reference not yet validated (TODO in QueryFilterValidator)

## Self-Check: PASSED

All files exist:
- EntityQueryService.kt ✓

All commits exist:
- 9e80784 ✓

Compilation successful:
- `./gradlew compileKotlin` passes ✓

Key methods present:
- `suspend fun execute()` ✓
- `validateFilterReferences()` ✓
- `walkFilterForAttributes()` ✓
- `executeDataQuery()` ✓
- `executeCountQuery()` ✓
