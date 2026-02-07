# Phase 4: Query Assembly - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Assemble complete SELECT queries from SqlFragment pieces (Phases 2-3) with pagination and projection support. Produces parameterized SQL ready for execution. Query execution, workspace security, and result mapping belong to Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Total count strategy
- Claude's discretion on implementation approach (separate COUNT query vs window function)
- totalCount always returned with every query response — no opt-out flag
- Response structure: always `List<Entity>` + `totalCount`, even when empty (empty list + totalCount: 0)
- Include `hasNextPage` boolean in response for caller convenience

### Default ordering
- Default order: `ORDER BY created_at DESC, id ASC` (newest first, tiebreak on id for deterministic pagination)
- ORDER BY only on main data query, not on COUNT query
- Ignore the `orderBy` model field for now — attribute-based sorting deferred to v2 (PAGE-05)

### Projection scope
- Always return full Entity — `includeAttributes` and `includeRelationships` are hints only, not SQL-level filtering
- Projection passed through in query result/response so callers get it back with the data
- Projection ID validation deferred to Phase 5 (assembler doesn't have entity type context)
- `expandRelationships=true` silently ignored (v2 feature, PAGE-07)

### Pagination limits
- Maximum limit cap: 500. Requests above 500 throw validation error (not silently clamped)
- Default limit: 100, default offset: 0
- Negative limit or offset throws validation error with descriptive message
- Offset beyond totalCount returns empty list + totalCount + hasNextPage: false

### Claude's Discretion
- Query assembler class design and API shape
- totalCount implementation approach (separate COUNT vs window function)
- SqlFragment composition strategy for final query assembly
- WHERE clause assembly from visitor output

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-query-assembly*
*Context gathered: 2026-02-07*
