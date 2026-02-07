# Phase 5: Query Execution Service - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

EntityQueryService as the single entry point that takes an EntityQuery + workspace context, validates filter references against real schema, executes assembled SQL against PostgreSQL, and returns EntityQueryResult with typed Entity domain models and pagination metadata. Template resolution is the caller's responsibility. Workflow integration is Phase 6.

</domain>

<decisions>
## Implementation Decisions

### ID validation approach
- Validate all attributeId and relationshipId references up-front before any SQL generation
- Service loads the EntityType from the repository using entityTypeId (caller does not pass it)
- Recursive validation: walk the entire filter tree, validating each level's attribute/relationship IDs against the correct entity type schema (requires loading multiple entity types for nested relationship filters)
- Error messages include valid options: "attributeId abc123 not found on entity type X. Valid attributes: [id1, id2, id3]"
- Collect all validation errors in a single pass (consistent with existing error-collection-over-fail-fast pattern)
- Use existing QueryFilterException sealed hierarchy for invalid ID reference errors (same as structural validation errors)

### Result mapping
- Two-step approach: native query returns IDs only, then load full Entity objects via repository
- Change data query from `SELECT e.*` to `SELECT e.id` for leaner first query
- After loading via repository, re-sort entities to match the original ID order from the native query (preserves ORDER BY created_at DESC pagination ordering)

### SQL execution method
- Claude's Discretion: choice between NamedParameterJdbcTemplate and EntityManager native query (pick what pairs best with SqlFragment's named parameter map)
- Data query and count query executed in parallel using Kotlin coroutines (kotlinx-coroutines)
- Configurable query timeout (e.g., 10s default) via statement timeout — configurable through application.yml

### Error handling
- Entity type not found: throw NotFoundException (consistent with existing service patterns)
- Invalid filter references: throw QueryFilterException (same sealed hierarchy as structural errors)
- SQL execution failure: wrap DataAccessException in a domain-specific QueryExecutionException with context (query details, timeout info)
- Zero results: normal outcome — return EntityQueryResult(entities=[], totalCount=0, hasNextPage=false)

### Claude's Discretion
- Specific JDBC execution mechanism (NamedParameterJdbcTemplate vs EntityManager)
- Coroutine dispatcher choice for parallel query execution
- Statement timeout implementation approach (SET statement_timeout vs JDBC property)
- Whether to add kotlinx-coroutines as new dependency or if it already exists

</decisions>

<specifics>
## Specific Ideas

- Two-step ID-then-load pattern keeps native SQL isolated from Hibernate mapping
- Parallel execution of data + count queries via coroutines for better latency
- Recursive filter tree validation requires building a map of entity type schemas as relationship traversals are encountered

</specifics>

<deferred>
## Deferred Ideas

- Unit and integration testing for existing Phases 1-4 functionality — Phase 6.1 (End-to-End Testing)

</deferred>

---

*Phase: 05-query-execution-service*
*Context gathered: 2026-02-07*
