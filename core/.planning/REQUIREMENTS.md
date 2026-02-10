# Requirements: Workflow Node Enhancements

**Defined:** 2026-02-10
**Core Value:** Every workflow node must clearly declare its output shape so the frontend can show users what data becomes available and downstream nodes can safely reference execution results.

## v1 Requirements

### Output Metadata Infrastructure

- [ ] **META-01**: WorkflowNodeOutputField data class with key, label, type, description, nullable, exampleValue
- [ ] **META-02**: OutputFieldType enum (UUID, STRING, BOOLEAN, NUMBER, MAP, LIST, OBJECT)
- [ ] **META-03**: WorkflowNodeOutputMetadata data class with outputType, fields list, and registryKeys
- [ ] **META-04**: WorkflowNodeConfigRegistry extracts outputMetadata from companion objects via reflection
- [ ] **META-05**: Node-schemas API endpoint includes outputMetadata in response
- [ ] **META-06**: CreateEntityActionConfig declares outputMetadata matching CreateEntityOutput
- [ ] **META-07**: UpdateEntityActionConfig declares outputMetadata matching UpdateEntityOutput
- [ ] **META-08**: DeleteEntityActionConfig declares outputMetadata matching DeleteEntityOutput
- [ ] **META-09**: QueryEntityActionConfig declares outputMetadata matching QueryEntityOutput
- [ ] **META-10**: HttpRequestActionConfig declares outputMetadata matching HttpResponseOutput
- [ ] **META-11**: ConditionControlConfig declares outputMetadata matching ConditionOutput
- [ ] **META-12**: Unit tests validate outputMetadata field keys match NodeOutput.toMap() keys for every node

### Query Entity Execution

- [ ] **QERY-01**: QueryEntityNode execute() invokes EntityQueryService to fetch matching entities
- [ ] **QERY-02**: Template values in query filters are resolved before query execution
- [ ] **QERY-03**: QueryEntityNode returns QueryEntityOutput with entities, totalCount, hasMore

### Bulk Update Entity

- [ ] **BULK-01**: New WorkflowBulkUpdateEntityActionConfig as separate WorkflowActionConfig
- [ ] **BULK-02**: Query config field uses ENTITY_QUERY field type so frontend renders entity query builder component
- [ ] **BULK-03**: Applies identical field updates to all entities matching the query
- [ ] **BULK-04**: Returns BulkUpdateEntityOutput with entitiesUpdated count and entitiesFailed count
- [ ] **BULK-05**: New BulkUpdateEntityOutput NodeOutput with toMap() implementation
- [ ] **BULK-06**: Configurable error handling mode: FAIL_FAST (stop on first error) or BEST_EFFORT (continue, report failures)
- [ ] **BULK-07**: BulkUpdateEntityActionConfig declares outputMetadata

## v2 Requirements

### Query Enhancements

- **QERY-04**: Pagination and ordering configuration applied to query results
- **QERY-05**: Fetch all pages mode with automatic pagination and safety limits

### Bulk Update Enhancements

- **BULK-08**: Configurable batch size for chunked processing
- **BULK-09**: Batch-level activity logging instead of per-entity

### Output Metadata Enhancements

- **META-13**: Array element type declaration for list fields
- **META-14**: Nested object schema for complex output fields

## Out of Scope

| Feature | Reason |
|---------|--------|
| Frontend implementation | Backend output metadata only — consumed by existing API |
| New query filter types | Uses existing EntityQuery/QueryFilter infrastructure |
| Per-entity update logic in bulk | Same update applied to all; use ForEach + UpdateEntity for per-entity logic |
| Compile-time schema validation | Annotation processor deferred until 50+ nodes |
| Output schema versioning | Convention documentation sufficient for now |
| Pagination UI for query results | Uses existing QueryPagination, deferred to v2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| META-01 | - | Pending |
| META-02 | - | Pending |
| META-03 | - | Pending |
| META-04 | - | Pending |
| META-05 | - | Pending |
| META-06 | - | Pending |
| META-07 | - | Pending |
| META-08 | - | Pending |
| META-09 | - | Pending |
| META-10 | - | Pending |
| META-11 | - | Pending |
| META-12 | - | Pending |
| QERY-01 | - | Pending |
| QERY-02 | - | Pending |
| QERY-03 | - | Pending |
| BULK-01 | - | Pending |
| BULK-02 | - | Pending |
| BULK-03 | - | Pending |
| BULK-04 | - | Pending |
| BULK-05 | - | Pending |
| BULK-06 | - | Pending |
| BULK-07 | - | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 0
- Unmapped: 22 (pending roadmap)

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-10 after initial definition*
