# Roadmap: Workflow Node Enhancements

## Overview

This roadmap delivers output metadata infrastructure for workflow nodes, enabling the frontend to preview what data each node produces and how downstream nodes can reference it. We begin by establishing the data model and registry infrastructure, then implement query and bulk update execution capabilities, and finally add output metadata declarations to all existing node types.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation Infrastructure** - Data model and registry for output metadata
- [ ] **Phase 2: Query & Bulk Update Execution** - Enable entity querying and bulk updates in workflows
- [ ] **Phase 3: Output Metadata Coverage** - Add output schemas to all existing node types

## Phase Details

### Phase 1: Foundation Infrastructure
**Goal**: Output metadata infrastructure exists and is exposed via API
**Depends on**: Nothing (first phase)
**Requirements**: META-01, META-02, META-03, META-04, META-05, META-12
**Success Criteria** (what must be TRUE):
  1. WorkflowNodeOutputField data class exists with key, label, type, description, nullable, exampleValue
  2. OutputFieldType enum defines all supported field types (UUID, STRING, BOOLEAN, NUMBER, MAP, LIST, OBJECT)
  3. WorkflowNodeConfigRegistry extracts outputMetadata from companion objects via reflection
  4. Node-schemas API endpoint includes outputMetadata in response for nodes that declare it
  5. Unit tests validate that declared outputMetadata keys match NodeOutput.toMap() keys
**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Data model, registry extraction, and API wiring with CreateEntity proof-of-concept
- [ ] 01-02-PLAN.md — Parameterized validation tests for outputMetadata keys and types

### Phase 2: Query & Bulk Update Execution
**Goal**: Workflows can query entity subsets and apply bulk updates during execution
**Depends on**: Phase 1
**Requirements**: QERY-01, QERY-02, QERY-03, BULK-01, BULK-02, BULK-03, BULK-04, BULK-05, BULK-06, BULK-07
**Success Criteria** (what must be TRUE):
  1. QueryEntityNode execute() successfully fetches entities via EntityQueryService
  2. Template values in query filters are resolved before query execution
  3. QueryEntityNode returns QueryEntityOutput with entities list, totalCount, and hasMore
  4. New BulkUpdateEntityActionConfig exists as separate WorkflowActionConfig with ENTITY_QUERY field type
  5. BulkUpdateEntityNode applies identical field updates to all entities matching the query
  6. BulkUpdateEntityNode returns entitiesUpdated and entitiesFailed counts
  7. BulkUpdateEntityNode supports FAIL_FAST and BEST_EFFORT error handling modes
  8. BulkUpdateEntityActionConfig declares outputMetadata
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Output Metadata Coverage
**Goal**: All existing node types declare output schemas for frontend consumption
**Depends on**: Phase 2
**Requirements**: META-06, META-07, META-08, META-09, META-10, META-11
**Success Criteria** (what must be TRUE):
  1. CreateEntityActionConfig declares outputMetadata matching CreateEntityOutput
  2. UpdateEntityActionConfig declares outputMetadata matching UpdateEntityOutput
  3. DeleteEntityActionConfig declares outputMetadata matching DeleteEntityOutput
  4. QueryEntityActionConfig declares outputMetadata matching QueryEntityOutput
  5. HttpRequestActionConfig declares outputMetadata matching HttpResponseOutput
  6. ConditionControlConfig declares outputMetadata matching ConditionOutput
  7. All node type outputMetadata fields are verified against NodeOutput.toMap() keys in tests
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Infrastructure | 0/2 | Not started | - |
| 2. Query & Bulk Update Execution | 0/3 | Not started | - |
| 3. Output Metadata Coverage | 0/1 | Not started | - |
