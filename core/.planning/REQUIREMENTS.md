# Requirements: Entity Query System

**Defined:** 2025-02-01
**Core Value:** Execute complex entity queries with attribute filters, relationship traversals, and polymorphic type handling while maintaining workspace isolation and optimal database performance.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Query Model Extraction

- [x] **MODEL-01**: Extract `EntityQuery`, `QueryFilter`, `RelationshipCondition`, `FilterValue`, `FilterOperator` from workflow config into `models/entity/query/`
- [x] **MODEL-02**: Extract `QueryPagination`, `QueryProjection`, `OrderByClause`, `SortDirection` into `models/entity/query/`
- [x] **MODEL-03**: Add `TargetTypeMatches` relationship condition with `branches: List<TypeBranch>` where each branch has `entityTypeId` and optional `filter`
- [x] **MODEL-04**: Add `maxDepth` configuration for nested relationship traversal (default: 3)
- [x] **MODEL-05**: Update `WorkflowQueryEntityActionConfig` to import from new location

### Attribute Filtering

- [x] **ATTR-01**: Support EQUALS operator for exact value matching on JSONB attributes
- [x] **ATTR-02**: Support NOT_EQUALS operator for inequality matching
- [x] **ATTR-03**: Support GREATER_THAN, GREATER_THAN_OR_EQUALS operators for numeric/date comparison
- [x] **ATTR-04**: Support LESS_THAN, LESS_THAN_OR_EQUALS operators for numeric/date comparison
- [x] **ATTR-05**: Support IN operator for value-in-list matching
- [x] **ATTR-06**: Support NOT_IN operator for value-not-in-list matching
- [x] **ATTR-07**: Support CONTAINS operator for substring/array element matching
- [x] **ATTR-08**: Support NOT_CONTAINS operator for absence matching
- [x] **ATTR-09**: Support STARTS_WITH operator for string prefix matching
- [x] **ATTR-10**: Support ENDS_WITH operator for string suffix matching
- [x] **ATTR-11**: Support IS_NULL operator for null value detection
- [x] **ATTR-12**: Support IS_NOT_NULL operator for non-null value detection

### Logical Grouping

- [x] **LOGIC-01**: Support AND filter combining multiple conditions (all must match)
- [x] **LOGIC-02**: Support OR filter combining multiple conditions (any must match)
- [x] **LOGIC-03**: Support arbitrary nesting of AND/OR filters

### Relationship Filtering

- [ ] **REL-01**: Support EXISTS condition (entity has at least one related entity)
- [ ] **REL-02**: Support NOT_EXISTS condition (entity has no related entities)
- [ ] **REL-03**: Support TargetEquals condition (related to specific entity IDs)
- [ ] **REL-04**: Support TargetMatches condition (related entity satisfies nested filter)
- [ ] **REL-05**: Support multi-level TargetMatches traversal up to configurable maxDepth
- [ ] **REL-06**: Support TargetTypeMatches condition with type-aware branching
- [ ] **REL-07**: TargetTypeMatches uses OR semantics (match if any branch matches)
- [ ] **REL-08**: TargetTypeMatches branches have optional filter (type-only matching allowed)

### Query Execution

- [ ] **EXEC-01**: Create `EntityQueryService` in `service/entity/` as single entry point
- [ ] **EXEC-02**: Generate native PostgreSQL SQL with JSONB operators
- [ ] **EXEC-03**: Use parameterized queries for all user-provided values (SQL injection prevention)
- [ ] **EXEC-04**: Enforce workspace_id filtering on all queries
- [ ] **EXEC-05**: Enforce workspace_id filtering on relationship JOIN subqueries
- [ ] **EXEC-06**: Return `List<Entity>` domain models from query execution
- [ ] **EXEC-07**: Return `totalCount` with every query result
- [ ] **EXEC-08**: Fail fast with exception on invalid attributeId reference
- [ ] **EXEC-09**: Fail fast with exception on invalid relationshipId reference

### Pagination and Projection

- [ ] **PAGE-01**: Support limit parameter (default: 100)
- [ ] **PAGE-02**: Support offset parameter (default: 0)
- [ ] **PAGE-03**: Support projection with includeAttributes (null = all)
- [ ] **PAGE-04**: Support projection with includeRelationships (null = all)

### Integration

- [ ] **INT-01**: Update `WorkflowQueryEntityActionConfig.execute()` to use EntityQueryService
- [ ] **INT-02**: Resolve template expressions before calling EntityQueryService (caller responsibility)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Result Handling

- **PAGE-05**: Support orderBy with attribute and direction (ASC/DESC)
- **PAGE-06**: Support cursor-based pagination for large datasets
- **PAGE-07**: Support expandRelationships in projection (hydrate related entities)

### Advanced Filtering

- **REL-09**: Support CountMatches condition (relationship count comparison)
- **ATTR-13**: Support quantified filters for array attributes (SOME/EVERY/NONE)

### Performance

- **PERF-01**: Statement timeout configuration
- **PERF-02**: Query complexity budget (reject overly complex queries)
- **PERF-03**: Batch loading to prevent N+1 queries on relationship hydration
- **PERF-04**: Query result caching

### Testing

- **TEST-01**: Testcontainers integration for PostgreSQL-based tests (H2 doesn't support JSONB)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Template resolution in service | Callers resolve templates; keeps service focused on query execution |
| Cross-workspace queries | Security boundary - never allow cross-tenant data access |
| Arbitrary depth traversal | Unbounded recursion risk; use maxDepth limit instead |
| Custom query language parser | Use structured filter objects, not string parsing |
| GraphQL-style nested selection | Full Entity returned; projections are hints only |
| Real-time query subscriptions | High complexity, not needed for current use cases |
| Aggregations (COUNT, SUM, AVG) | Defer to reporting features; query service returns entities |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODEL-01 | Phase 1 | Complete |
| MODEL-02 | Phase 1 | Complete |
| MODEL-03 | Phase 1 | Complete |
| MODEL-04 | Phase 1 | Complete |
| MODEL-05 | Phase 1 | Complete |
| ATTR-01 | Phase 2 | Complete |
| ATTR-02 | Phase 2 | Complete |
| ATTR-03 | Phase 2 | Complete |
| ATTR-04 | Phase 2 | Complete |
| ATTR-05 | Phase 2 | Complete |
| ATTR-06 | Phase 2 | Complete |
| ATTR-07 | Phase 2 | Complete |
| ATTR-08 | Phase 2 | Complete |
| ATTR-09 | Phase 2 | Complete |
| ATTR-10 | Phase 2 | Complete |
| ATTR-11 | Phase 2 | Complete |
| ATTR-12 | Phase 2 | Complete |
| LOGIC-01 | Phase 2 | Complete |
| LOGIC-02 | Phase 2 | Complete |
| LOGIC-03 | Phase 2 | Complete |
| REL-01 | Phase 3 | Pending |
| REL-02 | Phase 3 | Pending |
| REL-03 | Phase 3 | Pending |
| REL-04 | Phase 3 | Pending |
| REL-05 | Phase 3 | Pending |
| REL-06 | Phase 3 | Pending |
| REL-07 | Phase 3 | Pending |
| REL-08 | Phase 3 | Pending |
| PAGE-01 | Phase 4 | Pending |
| PAGE-02 | Phase 4 | Pending |
| PAGE-03 | Phase 4 | Pending |
| PAGE-04 | Phase 4 | Pending |
| EXEC-01 | Phase 5 | Pending |
| EXEC-02 | Phase 5 | Pending |
| EXEC-03 | Phase 5 | Pending |
| EXEC-04 | Phase 5 | Pending |
| EXEC-05 | Phase 5 | Pending |
| EXEC-06 | Phase 5 | Pending |
| EXEC-07 | Phase 5 | Pending |
| EXEC-08 | Phase 5 | Pending |
| EXEC-09 | Phase 5 | Pending |
| INT-01 | Phase 6 | Pending |
| INT-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2025-02-01*
*Last updated: 2026-02-02 after Phase 2 completion*
