# Phase 3: Relationship Filter Implementation - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate SQL fragments for relationship-based entity filtering using EXISTS subqueries. Supports EXISTS/NOT_EXISTS conditions, target matching by ID (TargetEquals), nested filters on related entities (TargetMatches), and polymorphic type branching (TargetTypeMatches) with workspace isolation. This is internal query infrastructure consumed by Phase 4 (Query Assembly).

</domain>

<decisions>
## Implementation Decisions

### Depth control
- Global depth counter: single counter incremented at each relationship traversal across the entire query tree
- Depth starts at 0 (root entity level). maxDepth=3 allows 3 levels of relationship nesting
- When maxDepth is exceeded: throw exception immediately with descriptive error. Do not silently drop conditions
- Eager validation: walk the entire filter tree upfront before generating any SQL. Fail fast with complete error context

### Workspace isolation
- Workspace_id filtering on the root query only — relationship subqueries do not independently filter by workspace_id
- Explicit SQL conditions only — do not rely on RLS for query correctness, treat RLS as a safety net
- Root query filters workspace_id on both the `entities` table and `entity_types` table (via join)

### Missing relationship handling
- Invalid relationshipId: throw immediately with descriptive exception before generating any SQL
- Invalid entityTypeKey in TargetTypeMatches branches: validate that each branch's entityTypeKey is a valid target for the referenced relationship. Throw if not
- Validation happens in the same upfront pass as depth validation — single tree walk collects all errors
- Error collection: accumulate all validation failures across the tree, throw one exception with the full list (not fail-fast)

### TargetTypeMatches semantics
- Branch without filter: means "any related entity of this type satisfies the condition" (equivalent to EXISTS with type check only)
- Unspecified types are excluded: if relationship targets [client, partner, vendor] but query only specifies branches for [client, partner], entities related to vendors do NOT satisfy the condition. You must opt types in
- Empty branches list: validation error, caught during eager validation. This is a malformed query
- Type matching uses entity_types.id (UUID), not entity_types.key. Key-to-ID resolution happens during validation

### Claude's Discretion
- SQL generation structure for EXISTS subqueries (table aliases, join patterns)
- How the Visitor pattern extends to handle relationship conditions alongside attribute conditions
- Parameter naming strategy for relationship subquery parameters
- How key-to-ID resolution is implemented (lookup service, passed-in map, etc.)

</decisions>

<specifics>
## Specific Ideas

- Validation should mirror Phase 2's QueryFilterException sealed hierarchy pattern — extend it for relationship-specific errors
- The eager validation pass is a natural fit for a dedicated validator class that walks the filter tree before the SQL-generating Visitor runs
- Collect-all-errors approach means the exception should carry a list of validation failures, not just a single message

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-relationship-filter-implementation*
*Context gathered: 2026-02-06*
