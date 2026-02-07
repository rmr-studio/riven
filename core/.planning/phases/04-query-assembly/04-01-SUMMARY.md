---
phase: 04-query-assembly
plan: 01
subsystem: api
tags: [sql, pagination, query-assembly, spring-service]

# Dependency graph
requires:
  - phase: 02-attribute-filter-implementation
    provides: SqlFragment, ParameterNameGenerator, AttributeSqlGenerator, AttributeFilterVisitor
  - phase: 03-relationship-filter-implementation
    provides: RelationshipSqlGenerator, QueryFilterValidator, visitor integration
provides:
  - EntityQueryAssembler @Service composing complete SELECT + COUNT queries
  - AssembledQuery data class holding paired data/count SqlFragments
  - EntityQueryResult response model with pagination metadata
affects: [05-query-execution]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Separate data + count query pattern over window functions"
    - "Single ParameterNameGenerator shared across assembler and visitor"
    - "Workspace isolation at root query level only"

key-files:
  created:
    - src/main/kotlin/riven/core/service/entity/query/EntityQueryAssembler.kt
    - src/main/kotlin/riven/core/service/entity/query/AssembledQuery.kt
    - src/main/kotlin/riven/core/models/entity/query/EntityQueryResult.kt
  modified: []

key-decisions:
  - "Separate COUNT query over window function -- simpler SQL, independent optimization, easier testing"
  - "Pagination validation in assembler as private method -- simple enough to not need own class"
  - "deleted=false as literal not parameter -- always false, benefits partial index matching"

patterns-established:
  - "Query assembly: base WHERE (workspace+type+deleted) composed with optional filter via SqlFragment.and()"
  - "Data query adds ORDER BY + LIMIT/OFFSET; count query reuses same WHERE without pagination"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 4 Plan 01: Query Assembly Summary

**EntityQueryAssembler @Service composing parameterized SELECT + COUNT queries with workspace isolation, pagination validation (limit 1-500), and shared ParameterNameGenerator**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T01:27:31Z
- **Completed:** 2026-02-07T01:29:07Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- EntityQueryAssembler produces paired data and count SQL queries from filter visitor output
- Pagination validation rejects invalid limit/offset with descriptive IllegalArgumentException messages
- Base WHERE clause enforces workspace isolation, entity type filtering, and soft-delete exclusion
- EntityQueryResult provides typed response container with entities, totalCount, hasNextPage, and projection passthrough

## Task Commits

Each task was committed atomically:

1. **Task 1: Create EntityQueryResult response model and AssembledQuery data class** - `c13a0b9` (feat)
2. **Task 2: Create EntityQueryAssembler with pagination validation and query composition** - `1fa3d31` (feat)

## Files Created/Modified
- `src/main/kotlin/riven/core/models/entity/query/EntityQueryResult.kt` - Response model with entities, totalCount, hasNextPage, projection
- `src/main/kotlin/riven/core/service/entity/query/AssembledQuery.kt` - Data class holding paired data + count SqlFragments
- `src/main/kotlin/riven/core/service/entity/query/EntityQueryAssembler.kt` - Spring @Service assembling complete queries from visitor output

## Decisions Made
- Separate COUNT query over window function -- simpler SQL, independent PostgreSQL optimization, easier testing
- Pagination validation as private method in assembler -- simple enough to not need its own class, ensures invalid inputs never reach SQL generation
- `deleted = false` as SQL literal (not parameter) -- always false, benefits partial index matching on conditional indexes

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- EntityQueryAssembler is ready for Phase 5 to inject and execute the assembled queries
- Phase 5 will create ParameterNameGenerator, call assemble(), execute both SqlFragments via NamedParameterJdbcTemplate, and map results into EntityQueryResult
- All pagination success criteria (PAGE-01 through PAGE-04) are satisfied

---
*Phase: 04-query-assembly*
*Completed: 2026-02-07*
