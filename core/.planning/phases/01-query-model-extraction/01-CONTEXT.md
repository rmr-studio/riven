# Phase 1: Query Model Extraction - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract query models (EntityQuery, QueryFilter, RelationshipCondition, FilterValue, FilterOperator, QueryPagination, QueryProjection, OrderByClause, SortDirection) from WorkflowQueryEntityActionConfig.kt into `models/entity/query/`. Enhance with TargetTypeMatches condition and maxDepth configuration. Update workflow imports to reference new location.

</domain>

<decisions>
## Implementation Decisions

### File organization
- Separate files by concern: EntityQuery.kt, QueryFilter.kt, RelationshipCondition.kt, QueryPagination.kt
- Sealed interface hierarchies stay together (QueryFilter + subtypes in one file, RelationshipCondition + subtypes in another)
- Enums live with related models (FilterOperator in QueryFilter.kt, SortDirection in QueryPagination.kt)
- FilterValue lives with QueryFilter (they're tightly coupled)

### TargetTypeMatches design
- TypeBranch uses `entityTypeId: UUID` (matches existing pattern)
- TypeBranch.filter is nullable (`filter: QueryFilter? = null`); null means match any entity of this type
- TargetTypeMatches requires at least one branch (validation rejects empty branches)
- OR semantics across branches (match if any branch matches)

### maxDepth behavior
- Lives on EntityQuery (top-level config, applies to entire query)
- Optional with default 3: `maxDepth: Int = 3`
- Minimum valid value: 1 (allows at least one relationship traversal)
- Maximum allowed value: 10 (hard cap to prevent runaway queries)
- Counted from query root (total depth across entire query tree)
- Each QueryFilter.Relationship increments depth by 1 (all relationship filters count, not just TargetMatches)
- Exceeded depth fails at validation time (reject before execution)

### Import migration
- Direct imports from `riven.core.models.entity.query.*` (clean break)
- Delete original models from WorkflowQueryEntityActionConfig.kt immediately (single source of truth)
- Keep existing @JsonTypeName values (backward compatible JSON deserialization)

### Claude's Discretion
- Exact file naming within the pattern (e.g., `QueryFilter.kt` vs `Filters.kt`)
- Internal helper types not part of public API
- Validation error message wording
- KDoc documentation depth

</decisions>

<specifics>
## Specific Ideas

No specific requirements — follow existing codebase patterns for model organization and documentation style.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-query-model-extraction*
*Context gathered: 2026-02-01*
