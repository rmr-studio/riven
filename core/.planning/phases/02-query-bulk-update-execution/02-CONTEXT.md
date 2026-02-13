# Phase 2: Query & Bulk Update Execution - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable workflows to query entity subsets and apply bulk updates during execution. Two new node types: QueryEntityNode (find entities matching criteria) and BulkUpdateEntityNode (apply identical field updates to all matching entities). Both nodes declare outputMetadata. Query node is standalone for general use; bulk update node is self-contained with its own embedded query.

</domain>

<decisions>
## Implementation Decisions

### Query filter design
- Reuse the existing entity query system — same filter model the app uses for entity views/lists
- Template support in filter values — filters can reference upstream node outputs (e.g., `{{nodeId.fieldKey}}`)
- Template values resolved before query execution
- Condition logic matches whatever the existing query system supports (AND/OR groups, operators)
- No sorting support — order doesn't matter for workflow processing

### Bulk update field mapping
- Field values support both static values and template references to upstream node outputs
- Any field that can be updated via regular UpdateEntity can be bulk updated
- Multiple fields can be updated per node — one BulkUpdateEntity node can set status, assignee, priority all at once
- Bulk update node has its own embedded query config — self-contained, no dependency on a separate QueryEntity node

### Error handling semantics
- FAIL_FAST: When one entity fails to update, the node fails and the workflow stops. No rollback — entities updated before the failure stay updated. Output includes count of what succeeded before failure.
- BEST_EFFORT: Process all entities regardless of individual failures. Output includes entitiesUpdated count, entitiesFailed count, plus a list of failed entity IDs with error messages.
- Error handling mode is user-configurable — dropdown in the workflow editor node config (FAIL_FAST or BEST_EFFORT)

### Query result limits
- System-wide default limit on query results (prevents runaway queries) — user cannot override
- hasMore in QueryEntityOutput indicates when more results exist beyond the limit
- Bulk update processes ALL matching entities regardless of any query limit — no cap on what gets updated
- Query node output includes full entity objects (all field values), not just IDs
- Bulk update processes entities in configurable batches for efficiency

### Claude's Discretion
- Exact system-wide query result limit value
- Batch size for bulk update processing
- Template syntax specifics (aligning with existing template system)
- How full entity objects are represented in query output
- Internal batching/pagination strategy for bulk update's "process all" behavior

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-query-bulk-update-execution*
*Context gathered: 2026-02-13*
