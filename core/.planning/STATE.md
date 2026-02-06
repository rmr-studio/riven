# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Execute complex entity queries with attribute filters, relationship traversals, and polymorphic type handling while maintaining workspace isolation and optimal database performance.
**Current focus:** Phase 4 - Query Assembly

## Current Position

Phase: 4 of 6 (Query Assembly)
Plan: 0 of ? in current phase
Status: Phase 3 complete, Phase 4 not started
Last activity: 2026-02-07 - Completed 03-03-PLAN.md

Progress: [██████░░░░] 67%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 2 min
- Total execution time: 14 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-query-model-extraction | 2 | 4 min | 2 min |
| 02-attribute-filter-implementation | 3 | 4 min | 1.3 min |
| 03-relationship-filter-implementation | 3 | 6 min | 2 min |

**Recent Trend:**
- Last 5 plans: 02-03 (1 min), 03-01 (2 min), 03-02 (2 min), 03-03 (2 min)
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

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 6.1 inserted after Phase 6: End-to-end testing (URGENT)

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-07
Stopped at: Completed 03-03-PLAN.md (Phase 3 complete)
Resume file: None
