---
phase: 03-relationship-filter-implementation
plan: 02
subsystem: query
tags: [sql-generation, exists-subquery, relationship-filter, jsonb, postgresql]

# Dependency graph
requires:
  - phase: 02-attribute-filter-implementation
    provides: SqlFragment, ParameterNameGenerator, AttributeSqlGenerator, AttributeFilterVisitor
provides:
  - RelationshipSqlGenerator with EXISTS/NOT EXISTS subquery generation for all RelationshipCondition variants
  - Parameterized entityAlias in AttributeSqlGenerator for nested relationship filter support
affects: [03-03 visitor integration, 04-query-assembly]

# Tech tracking
tech-stack:
  added: []
  patterns: [EXISTS subquery with correlated alias, nestedFilterVisitor callback for recursive SQL generation, parameterized entity alias for nested scoping]

key-files:
  created:
    - src/main/kotlin/riven/core/service/entity/query/RelationshipSqlGenerator.kt
  modified:
    - src/main/kotlin/riven/core/service/entity/query/AttributeSqlGenerator.kt

key-decisions:
  - "nestedFilterVisitor callback lambda avoids circular dependency between generator and visitor"
  - "Unique aliases via ParameterNameGenerator counter (r_{n}, t_{n}) prevent SQL ambiguity at any nesting depth"

patterns-established:
  - "EXISTS subquery pattern: correlated subquery on entity_relationships with optional JOIN to entities for target filtering"
  - "Callback-based nested filter processing: generator accepts lambda for recursive SQL generation without circular deps"
  - "Parameterized entity alias: all SQL generators accept entityAlias parameter for nested scope support"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 3 Plan 02: Relationship SQL Generator Summary

**EXISTS/NOT EXISTS subquery generator for all RelationshipCondition variants with callback-based nested filter support and parameterized entity aliases**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-06T20:05:19Z
- **Completed:** 2026-02-06T20:07:30Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments
- Added backward-compatible `entityAlias` parameter to AttributeSqlGenerator enabling nested relationship filter SQL to reference target entity tables instead of hardcoded root entity
- Created RelationshipSqlGenerator with exhaustive dispatch for all 5 in-scope RelationshipCondition variants (Exists, NotExists, TargetEquals, TargetMatches, TargetTypeMatches)
- TargetMatches and TargetTypeMatches use callback lambda pattern to process nested filters without circular dependencies

## Task Commits

Each task was committed atomically:

1. **Task 1: Add entityAlias parameter to AttributeSqlGenerator** - `69ae3b2` (feat)
2. **Task 2: Create RelationshipSqlGenerator for all RelationshipCondition variants** - `3105114` (feat)

## Files Created/Modified
- `src/main/kotlin/riven/core/service/entity/query/AttributeSqlGenerator.kt` - Added entityAlias: String = "e" parameter to generate() and all private methods; replaced all hardcoded "e.payload" with "${entityAlias}.payload"
- `src/main/kotlin/riven/core/service/entity/query/RelationshipSqlGenerator.kt` - New class generating parameterized EXISTS/NOT EXISTS subqueries for relationship filtering with unique aliases and nested filter callback support

## Decisions Made
- Used callback lambda (`nestedFilterVisitor`) pattern instead of direct visitor reference to avoid circular dependencies between RelationshipSqlGenerator and the future QueryFilterVisitor
- CountMatches throws UnsupportedOperationException with reference to v2 requirements REL-09, keeping it out of scope for this phase
- Each subquery generates separate aliases for relationship table (`r_{n}`) and target entity table (`t_{n}`) from the shared ParameterNameGenerator counter

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness
- RelationshipSqlGenerator ready for integration into the visitor pattern (Plan 03)
- AttributeSqlGenerator entityAlias parameter enables the visitor to pass target aliases for nested relationship filters
- All SQL generation produces unique parameterized aliases safe for arbitrary nesting depth

---
*Phase: 03-relationship-filter-implementation*
*Completed: 2026-02-07*
