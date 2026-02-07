# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Execute complex entity queries with attribute filters, relationship traversals, and polymorphic type handling while maintaining workspace isolation and optimal database performance.
**Current focus:** Phase 6 - Workflow Integration

## Current Position

Phase: 6 of 7 (Workflow Integration)
Plan: 0 of ? in current phase
Status: Phase 5 complete, Phase 6 not started
Last activity: 2026-02-07 - Completed Phase 5

Progress: [█████████░] 85%

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: 2 min
- Total execution time: 20.5 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-query-model-extraction | 2 | 4 min | 2 min |
| 02-attribute-filter-implementation | 3 | 4 min | 1.3 min |
| 03-relationship-filter-implementation | 3 | 6 min | 2 min |
| 04-query-assembly | 1 | 2 min | 2 min |
| 05-query-execution-service | 2 | 4.5 min | 2.25 min |

**Recent Trend:**
- Last 5 plans: 03-03 (2 min), 04-01 (2 min), 05-01 (2 min), 05-02 (2.5 min)
- Trend: Consistent

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Native SQL over JPA Criteria - JSONB operators need direct SQL control
- Templates resolved by caller - EntityQueryService focused on execution only
- TargetTypeMatches with OR semantics - Polymorphic relationships need type-aware branching
- EntityQuery.maxDepth defaults to 3 with 1-10 validation range
- Query models use riven.core.models.entity.query package
- TargetTypeMatches validation added in WorkflowQueryEntityActionConfig
- SqlFragment immutable composition - Thread-safe, testable, prevents mutation bugs
- Parameter naming format {prefix}_{counter} - Simple, deterministic, unique within query tree
- QueryFilterException sealed hierarchy - Enables exhaustive when-expression handling
- EQUALS uses @> containment for GIN index optimization
- NOT_EQUALS/NOT_IN require key existence check (? operator)
- Numeric comparisons fail silently (return false) on non-numeric values
- AttributeFilterVisitor delegates ATTRIBUTE to AttributeSqlGenerator via composition
- Error collection over fail-fast - Validator accumulates all errors in single tree walk
- AND/OR does not increment relationship depth - Only Relationship nodes increment depth counter
- TargetTypeMatches key-to-ID cross-referencing deferred to Phase 5
- nestedFilterVisitor callback lambda avoids circular dependency between generator and visitor
- Unique aliases via ParameterNameGenerator counter (r_{n}, t_{n}) prevent SQL ambiguity at any depth
- AND/OR depth resets to 0 for nested relationship subqueries -- each subquery gets its own AND/OR depth budget
- Relationship depth enforced in visitor as safety net even though QueryFilterValidator catches it first
- Separate COUNT query over window function -- simpler SQL, independent optimization, easier testing
- Pagination validation in assembler as private method -- simple enough to not need own class
- deleted=false as literal not parameter -- always false, benefits partial index matching
- QueryExecutionException separate from QueryFilterException hierarchy - Different error domains (execution vs validation)
- SELECT e.id instead of e.* - Implements two-step ID-then-load pattern for lean native queries
- Query timeout under riven.query namespace - Enables per-query SET statement_timeout control
- Two-part filter validation - EntityQueryService walks for attributes, delegates to QueryFilterValidator for relationships
- Parallel query execution via coroutines - Data and count queries run simultaneously on Dispatchers.IO
- Order preservation via ID-to-index map - Re-sorts entities after batch load to maintain SQL ordering

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 6.1 inserted after Phase 6: End-to-end testing (URGENT)

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-07
Stopped at: Phase 5 complete, verified ✓
Resume file: None
