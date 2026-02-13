# Workflow Node Enhancements

## What This Is

Enhancements to the workflow node system in a Kotlin/Spring Boot application that orchestrates entity-based workflows via Temporal. The work adds entity querying capabilities to workflow execution, introduces a bulk update node, and builds output metadata infrastructure so the frontend can preview what data each node produces and how downstream nodes can reference it.

## Core Value

Every workflow node must clearly declare its output shape so the frontend can show users what data becomes available and downstream nodes can safely reference execution results.

## Requirements

### Validated

- ✓ WorkflowNodeConfig sealed interface with execute/validate/config/configSchema — existing
- ✓ WorkflowActionConfig, WorkflowControlConfig, WorkflowTriggerConfig, WorkflowFunctionConfig, WorkflowUtilityConfig, WorkflowParseConfig sub-interfaces — existing
- ✓ WorkflowDataStore (environmental data registry) with thread-safe steps, variables, loops, trigger context — existing
- ✓ NodeOutput sealed interface with typed outputs (CreateEntityOutput, UpdateEntityOutput, QueryEntityOutput, etc.) — existing
- ✓ StepOutput wrapping NodeOutput with execution metadata — existing
- ✓ WorkflowNodeTypeMetadata providing label, description, icon, category for UI — existing
- ✓ WorkflowNodeConfigField schema system for dynamic UI generation — existing
- ✓ Template resolution system ({{ steps.nodeName.output.field }}) — existing
- ✓ UpdateEntityNode working for single entity by ID — existing
- ✓ QueryEntityNode config, validation, and schema defined (execution not implemented) — existing
- ✓ EntityQuery, EntityQueryService, EntityQueryAssembler infrastructure — existing

### Active

- [ ] QueryEntityNode executes via EntityQueryService to fetch entity subsets during workflow execution
- [ ] New BulkUpdateEntity node uses EntityQuery to find a subset of entities and applies identical field updates to all matches
- [ ] Every node declares output metadata describing the shape of its output (type + field names) and the registry keys it stores, so the frontend can preview what data becomes available after each node runs

### Out of Scope

- Per-entity update logic in bulk update — applies same update to all matched entities
- Frontend implementation — this is backend output metadata only, consumed by the existing schema endpoint
- New query filter types — uses existing EntityQuery/QueryFilter infrastructure
- Pagination UI for query results — deferred, uses existing QueryPagination

## Context

- Kotlin 2.1 / Spring Boot 3.5 / Temporal SDK 1.24
- Workflow nodes are a sealed interface hierarchy: WorkflowNodeConfig > WorkflowActionConfig > specific configs
- Each node has a companion object with `metadata: WorkflowNodeTypeMetadata` and `configSchema: List<WorkflowNodeConfigField>`
- Node schemas are exposed via `/api/v1/workflow/definitions/node-schemas` endpoint
- The QueryEntityNode (`WorkflowQueryEntityActionConfig`) has config, validation, and schema fully defined but `execute()` throws `NotImplementedError`
- The UpdateEntityNode (`WorkflowUpdateEntityActionConfig`) works for single entity updates via `EntityService.saveEntity()`
- `EntityQueryService` and `EntityQuery` data classes exist and are used in the entity query REST API
- `NodeOutput.toMap()` enables template resolution for downstream nodes, but there's no compile-time or schema-level declaration of what a node outputs

## Constraints

- **Tech stack**: Must use existing EntityQueryService/EntityQuery infrastructure for query execution
- **Architecture**: New BulkUpdateEntity node must be a separate WorkflowActionConfig implementation, not a mode of UpdateEntityNode
- **Compatibility**: Output metadata must be exposed through the existing node-schemas endpoint pattern
- **Thread safety**: All execution must work within WorkflowDataStore's concurrent model

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate BulkUpdateEntity node instead of modal UpdateEntity | Simpler — each node does one thing, one output type, one execution path | -- Pending |
| Output metadata on every node | Frontend needs to preview available data for downstream node wiring and display | -- Pending |

---
*Last updated: 2026-02-10 after initialization*
