# Roadmap: Entity Query System

## Overview

This roadmap delivers a reusable Entity Query Service that translates structured filter trees into parameterized PostgreSQL JSONB queries. The journey progresses from extracting query models into a shared location, through implementing attribute and relationship filtering with a Visitor-based SQL generation approach, to assembling complete queries with pagination, and finally integrating with the existing workflow system. Each phase builds on the previous, with security (SQL injection prevention, workspace isolation) baked into the foundational components.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Query Model Extraction** - Extract and enhance query models from workflow config into shared location
- [x] **Phase 2: Attribute Filter Implementation** - SqlFragment foundation and attribute filtering with all operators
- [x] **Phase 3: Relationship Filter Implementation** - EXISTS subqueries and relationship condition handling
- [x] **Phase 4: Query Assembly** - Complete SELECT query building with pagination and projection
- [x] **Phase 5: Query Execution Service** - EntityQueryService orchestration with security and result mapping
- [ ] **Phase 6: Workflow Integration** - Update WorkflowQueryEntityActionConfig to use new service
- [ ] **Phase 6.1: End-to-End Testing** (INSERTED) - Validate complete entity query pipeline with integration tests

## Phase Details

### Phase 1: Query Model Extraction
**Goal**: Query models exist in a shared location, enabling any feature to build entity queries
**Depends on**: Nothing (first phase)
**Requirements**: MODEL-01, MODEL-02, MODEL-03, MODEL-04, MODEL-05
**Success Criteria** (what must be TRUE):
  1. EntityQuery, QueryFilter, RelationshipCondition, FilterValue, FilterOperator models exist in models/entity/query/
  2. QueryPagination, QueryProjection, OrderByClause, SortDirection models exist in models/entity/query/
  3. TargetTypeMatches condition supports type-aware branching with branches list
  4. maxDepth configuration exists on EntityQuery with default value of 3
  5. WorkflowQueryEntityActionConfig imports from new location without breaking existing code
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Create query models in models/entity/query/
- [x] 01-02-PLAN.md — Update WorkflowQueryEntityActionConfig imports

### Phase 2: Attribute Filter Implementation
**Goal**: Filter entities by attribute values using all supported operators with GIN-index-aware SQL generation
**Depends on**: Phase 1
**Requirements**: ATTR-01, ATTR-02, ATTR-03, ATTR-04, ATTR-05, ATTR-06, ATTR-07, ATTR-08, ATTR-09, ATTR-10, ATTR-11, ATTR-12, LOGIC-01, LOGIC-02, LOGIC-03
**Success Criteria** (what must be TRUE):
  1. SqlFragment data class encapsulates parameterized SQL text with bound parameters
  2. All 12 FilterOperator variants generate correct JSONB SQL (EQUALS through IS_NOT_NULL)
  3. AND filter combines multiple conditions with all required to match
  4. OR filter combines multiple conditions with any required to match
  5. Nested AND/OR filters at arbitrary depth generate correctly parenthesized SQL
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — SqlFragment foundation, ParameterNameGenerator, query exceptions
- [x] 02-02-PLAN.md — AttributeSqlGenerator for all 12 FilterOperator variants
- [x] 02-03-PLAN.md — AttributeFilterVisitor with AND/OR logical composition

### Phase 3: Relationship Filter Implementation
**Goal**: Filter entities by their relationships using EXISTS subqueries with workspace isolation
**Depends on**: Phase 2
**Requirements**: REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, REL-07, REL-08
**Success Criteria** (what must be TRUE):
  1. EXISTS condition generates SQL that matches entities with at least one related entity
  2. NOT_EXISTS condition generates SQL that matches entities with no related entities
  3. TargetEquals condition matches entities related to specific entity IDs
  4. TargetMatches condition matches entities whose related entities satisfy a nested filter
  5. TargetTypeMatches condition matches entities using OR semantics across type branches with optional filters
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — QueryFilterValidator and relationship exception extensions
- [x] 03-02-PLAN.md — RelationshipSqlGenerator and entityAlias refactor
- [x] 03-03-PLAN.md — Visitor integration with relationship dispatch and depth tracking

### Phase 4: Query Assembly
**Goal**: Assemble complete SELECT queries with pagination and projection support
**Depends on**: Phase 3
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):
  1. Limit parameter caps result count with default of 100
  2. Offset parameter skips results with default of 0
  3. Projection includeAttributes hints are available to callers (even if full Entity returned)
  4. Projection includeRelationships hints are available to callers
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md — EntityQueryAssembler with pagination validation, query composition, and EntityQueryResult response model

### Phase 5: Query Execution Service
**Goal**: EntityQueryService executes queries securely and returns typed results
**Depends on**: Phase 4
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, EXEC-06, EXEC-07, EXEC-08, EXEC-09
**Success Criteria** (what must be TRUE):
  1. EntityQueryService exists as single entry point in service/entity/
  2. Generated SQL uses native PostgreSQL JSONB operators (not JPA Criteria)
  3. All queries use parameterized values with no string concatenation of user input
  4. All queries include workspace_id filtering on main query and relationship subqueries
  5. Query execution returns List of Entity domain models with totalCount for pagination
  6. Invalid attributeId reference throws descriptive exception immediately
  7. Invalid relationshipId reference throws descriptive exception immediately
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — QueryExecutionException, assembler SELECT e.id change, query timeout config
- [x] 05-02-PLAN.md — EntityQueryService with validation, parallel execution, and result mapping

### Phase 6: Workflow Integration
**Goal**: WorkflowQueryEntityActionConfig delegates to EntityQueryService
**Depends on**: Phase 5
**Requirements**: INT-01, INT-02
**Success Criteria** (what must be TRUE):
  1. WorkflowQueryEntityActionConfig.execute() calls EntityQueryService instead of throwing NotImplementedError
  2. Template expressions are resolved by caller before EntityQueryService invocation
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 6.1: End-to-End Testing (INSERTED)
**Goal**: Validate the complete entity query pipeline works end-to-end with integration tests
**Depends on**: Phase 6
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. TBD - to be defined during planning
**Plans**: TBD

Plans:
- [ ] 06.1-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 6.1

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Query Model Extraction | 2/2 | Complete | 2026-02-01 |
| 2. Attribute Filter Implementation | 3/3 | Complete | 2026-02-02 |
| 3. Relationship Filter Implementation | 3/3 | Complete ✓ | 2026-02-07 |
| 4. Query Assembly | 1/1 | Complete ✓ | 2026-02-07 |
| 5. Query Execution Service | 2/2 | Complete ✓ | 2026-02-07 |
| 6. Workflow Integration | 0/? | Not started | - |
| 6.1. End-to-End Testing (INSERTED) | 0/? | Not started | - |

---
*Roadmap created: 2026-02-01*
*Last updated: 2026-02-07 after Phase 5 execution*
