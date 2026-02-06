# Phase 2: Attribute Filter Implementation - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate parameterized SQL for filtering entities by their JSONB attribute values using all 12 FilterOperator variants. This includes the SqlFragment foundation, GIN-index-aware SQL generation, and correct handling of AND/OR logical combinations at arbitrary depth. Relationship filtering is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Operator SQL Mapping
- Text operators (CONTAINS, STARTS_WITH, ENDS_WITH) use case-insensitive matching (ILIKE)
- Numeric comparisons (GREATER_THAN, LESS_THAN, etc.) cast JSONB values to ::numeric
- IN operator uses FilterValue's values list (not comma-separated string parsing)
- Optimize for GIN index usage — use @> containment operator for EQUALS on indexed paths where possible

### Type Coercion
- Attempt coercion when types don't align — '42' treated as 42 for numeric comparisons
- Accept string booleans — 'true', 'false', 'TRUE', 'FALSE' treated as booleans
- Coercion failures result in silent non-match (row doesn't match filter, no error thrown)
- Parse ISO date strings for date comparison operators (GREATER_THAN, LESS_THAN on dates)

### NULL Handling
- IS_NULL matches both missing attribute keys AND explicit JSON null values
- Missing attributes on other operators (EQUALS, CONTAINS, etc.) result in no match (silent, not error)
- EQUALS with null FilterValue internally redirects to IS_NULL logic
- NOT_EQUALS excludes entities with missing attributes — only matches entities that HAVE the attribute and it's different

### Error Responses
- Validate attribute references at build time (when constructing SqlFragment) — fail fast with descriptive error
- Unsupported operator/type combinations throw descriptive errors: "GREATER_THAN not supported for boolean attributes"
- Error messages include attribute name/ID for debugging: "Attribute [name] (id: uuid) does not support operator CONTAINS"
- Enforce reasonable nesting depth limit for AND/OR filters (e.g., max 10 levels) to prevent stack overflow / query complexity

### Claude's Discretion
- Exact nesting depth limit value (10 suggested but Claude can adjust)
- Specific PostgreSQL syntax choices for edge cases
- Exception class naming and hierarchy
- Internal helper method organization

</decisions>

<specifics>
## Specific Ideas

- GIN index optimization is important for query performance at scale
- Error messages should be developer-friendly for debugging workflow configurations
- Silent non-match for coercion failures keeps queries robust against messy data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-attribute-filter-implementation*
*Context gathered: 2026-02-01*
