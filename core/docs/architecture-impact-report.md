---
tags:
  - architecture/change-report
Created: 2026-02-13
Branch: workflows
Base: main
---

# Architecture Impact Report: workflows

## Combined Summary

This branch introduces three related capabilities to the workflow node system across two phases: (1) **output metadata infrastructure** — a new type system (`OutputFieldType`, `WorkflowNodeOutputField`, `WorkflowNodeOutputMetadata`) that allows each node to declaratively describe the shape of its execution output, surfaced through the node schema API for frontend consumption; (2) **QueryEntity execution** — the previously validation-only `WorkflowQueryEntityActionConfig` now has a full `execute()` implementation that resolves template values in filter trees and queries entities via `EntityQueryService`; and (3) **BulkUpdateEntity** — an entirely new action node type that applies identical field updates to all entities matching a query, with configurable error handling modes (FAIL_FAST/BEST_EFFORT).

These changes extend the Workflows domain's Node Execution subdomain with new execution capabilities and introduce a new cross-cutting concern (output metadata) that modifies the registry, API response DTOs, and the companion object contract for node config classes. The Entities domain dependency is deepened — both new execution implementations consume `EntityQueryService` and `EntityService` at runtime, whereas previously only model-level imports existed for QueryEntity.

---

# Phase 1: Foundation Infrastructure (Output Metadata)

## Summary

This phase introduces **output metadata infrastructure** for the workflow node system. Each workflow node type can now optionally declare the shape of its execution output (`outputMetadata`) as structured field definitions alongside its existing `configSchema`. The metadata flows through the registry, internal data classes, and API response DTOs to the frontend, enabling downstream nodes and the UI to understand what data a node produces before execution.

The scope is foundation-level: new data model classes (`WorkflowNodeOutputField`, `WorkflowNodeOutputMetadata`, `OutputFieldType`), modifications to the registry discovery pipeline (`WorkflowNodeConfigRegistry`, `NodeSchemaEntry`, `WorkflowNodeMetadata`), a first adopter (`WorkflowCreateEntityActionConfig`), and parameterized validation tests ensuring metadata declarations stay in sync with actual `NodeOutput.toMap()` behavior. This is Phase 1 of a multi-phase rollout; most node types do not yet declare output metadata.

## Affected Domains

| Domain | Impact | Description |
|--------|--------|-------------|
| Workflows / Node Execution | Extended | New output metadata model classes, enum, and registry wiring. First node config (CREATE_ENTITY) declares output metadata. |

## New Components

| Component | Domain | Type | Purpose |
|-----------|--------|------|---------|
| `OutputFieldType` | Workflows / Node Execution | Enum | Defines the set of typed output field kinds (UUID, STRING, BOOLEAN, NUMBER, MAP, LIST, OBJECT, ENTITY, ENTITY_LIST) |
| `WorkflowNodeOutputField` | Workflows / Node Execution | Data Class / Model | Describes a single output field with key, label, type, nullability, description, example value, and optional entity type reference |
| `WorkflowNodeOutputMetadata` | Workflows / Node Execution | Data Class / Model | Container wrapping a list of `WorkflowNodeOutputField` entries representing the full output shape of a node |
| `OutputMetadataValidationTest` | Workflows / Node Execution | Test | Parameterized test suite validating that declared output metadata keys and types match actual `NodeOutput.toMap()` runtime behavior |

## Modified Components

| Component | Domain | What Changed |
|-----------|--------|--------------|
| `WorkflowNodeConfigRegistry` | Workflows / Node Execution | `NodeSchemaEntry` and `WorkflowNodeMetadata` data classes gain optional `outputMetadata: WorkflowNodeOutputMetadata?` field. `registerNode<T>()` now reflectively extracts `outputMetadata` from companion objects (optional, null-safe). `getAllNodes()` propagates `outputMetadata` into `WorkflowNodeMetadata` responses. |
| `NodeTypeSchemaResponse` | Workflows / Node Execution | API response DTO gains optional `outputMetadata: WorkflowNodeOutputMetadata?` field with OpenAPI schema annotation. |
| `WorkflowCreateEntityActionConfig` | Workflows / Node Execution | Companion object gains `outputMetadata` declaring three output fields: `entityId` (UUID), `entityTypeId` (UUID), `payload` (MAP). First node to adopt the new pattern. |

## Flow Changes

| Flow | Change Type | Description |
|------|-------------|-------------|
| Node Schema Discovery | Extended | Registry now extracts and caches `outputMetadata` alongside `configSchema` and `metadata` during startup discovery. The data flows through `NodeSchemaEntry` → `WorkflowNodeMetadata` → `NodeTypeSchemaResponse` to the API consumer. |

## Cross-Domain Dependencies

| Source | Target | Mechanism | New? |
|--------|--------|-----------|------|
| None | — | — | — |

No new cross-domain dependencies. All changes are contained within the Workflows / Node Execution subdomain. The `OutputFieldType.ENTITY` and `ENTITY_LIST` values reference entity concepts but do not create a runtime dependency on the Entities domain — they are descriptive type labels only.

## API Changes

| Endpoint | Method | Change | Breaking? |
|----------|--------|--------|-----------|
| Node type schema endpoint (returns `NodeTypeSchemaResponse`) | GET | Response now includes optional `outputMetadata` field. When absent, field is `null`. | No — additive, nullable field with default `null`. Existing consumers unaffected. |

## Data Model Changes

| Entity/Table | Change | Migration? |
|-------------|--------|------------|
| None | No persistence changes | No |

Output metadata is static configuration declared in companion objects, not persisted data. No database schema changes or migrations required.

## Documentation Impact

### New Documentation Needed

- [ ] **Output Metadata** — New vault document under `domains/Workflows/Node Execution/` describing the output metadata system: `WorkflowNodeOutputMetadata`, `WorkflowNodeOutputField`, `OutputFieldType` enum, the companion object declaration pattern, and how metadata flows through the registry to the API. This is a new architectural concept not covered by existing documentation.

### Existing Docs Requiring Updates

| Document | Section | Required Update |
|----------|---------|-----------------|
| [[WorkflowNodeConfigRegistry]] | Schema entry structure | `NodeSchemaEntry` now includes optional `outputMetadata: WorkflowNodeOutputMetadata?`. The code block showing the data class and the "Registration pattern" section should reflect this new field. |
| [[WorkflowNodeConfigRegistry]] | Responsibilities | Add: "Extract optional `outputMetadata` from companion objects" |
| [[WorkflowNodeConfigRegistry]] | Gotchas | Update companion object requirement: `outputMetadata` is optional (unlike `configSchema` and `metadata` which are required). Nodes without it are silently skipped. |
| [[WorkflowNodeConfig]] | Key Logic → Sealed interface hierarchy | The companion object contract now optionally includes `outputMetadata` alongside `configSchema` and `metadata`. |
| [[WorkflowNodeConfig]] | Responsibilities | Add: "Optionally declare output field shape via `outputMetadata: WorkflowNodeOutputMetadata` for frontend preview and downstream reference" |
| [[Node Execution]] | Overview | Mention output metadata as part of the node execution system — nodes can declare output shape for frontend consumption. |

## Suggested Changelog Entry

```markdown
## 2026-02-13 — Add output metadata infrastructure for workflow nodes

**Domains affected:** Workflows / Node Execution
**What changed:**
- Introduced `OutputFieldType` enum defining typed output field kinds (UUID, STRING, BOOLEAN, NUMBER, MAP, LIST, OBJECT, ENTITY, ENTITY_LIST)
- Added `WorkflowNodeOutputField` and `WorkflowNodeOutputMetadata` data classes to describe node output shapes
- Extended `NodeSchemaEntry`, `WorkflowNodeMetadata`, and `NodeTypeSchemaResponse` with optional `outputMetadata` field
- Modified `WorkflowNodeConfigRegistry.registerNode<T>()` to reflectively extract `outputMetadata` from companion objects during startup discovery
- `WorkflowCreateEntityActionConfig` is the first node to declare `outputMetadata` (entityId, entityTypeId, payload)
- Added parameterized `OutputMetadataValidationTest` ensuring declared metadata stays in sync with actual `NodeOutput.toMap()` behavior

**New cross-domain dependencies:** No
**New components introduced:**
- `OutputFieldType` — Enum of output field type descriptors
- `WorkflowNodeOutputField` — Data class describing a single output field (key, label, type, nullability, description, example value, entity type reference)
- `WorkflowNodeOutputMetadata` — Container for a node's output field declarations
- `OutputMetadataValidationTest` — Parameterized test validating metadata-to-runtime consistency across all node types
```

---

# Phase 2: Query & Bulk Update Execution

## Summary

This phase implements execution logic for two action node types — `WorkflowQueryEntityActionConfig` (previously validation-only with `execute()` throwing `NotImplementedError`) and the entirely new `WorkflowBulkUpdateEntityActionConfig`. Both nodes introduce runtime dependencies on the Entities domain's `EntityQueryService` and `EntityService`, deepening the cross-domain coupling from model-only imports to active service consumption. Output metadata declarations are added to both nodes (and retroactively to `WorkflowCreateEntityActionConfig` in Phase 1).

## Affected Domains

| Domain | Impact | Description |
|--------|--------|-------------|
| Workflows / Node Execution | Extended | QueryEntity execution implemented, new BulkUpdateEntity node type added |
| Workflows / Execution Engine | Modified | `WorkflowCoordinationService` updated to handle BulkUpdateEntity input resolution |
| Entities / Querying | Consumed (no changes) | `EntityQueryService.execute()` now consumed at runtime by QueryEntity and BulkUpdateEntity nodes |
| Entities / Entity Management | Consumed (no changes) | `EntityService.saveEntity()` and `EntityService.getEntity()` consumed by BulkUpdateEntity |

## New Components

| Component | Domain | Type | Purpose |
|-----------|--------|------|---------|
| `WorkflowBulkUpdateEntityActionConfig` | Workflows / Node Execution | Config (Action) | Action node that queries entities via embedded `EntityQuery` and applies batch updates with FAIL_FAST or BEST_EFFORT error handling |
| `BulkUpdateEntityOutput` | Workflows / Node Execution | Output (NodeOutput) | Typed output for bulk update results: entitiesUpdated, entitiesFailed, failedEntityDetails, totalProcessed |
| `BulkUpdateErrorHandling` | Workflows / Node Execution | Enum | Error handling modes for bulk update: FAIL_FAST (stop on first failure) or BEST_EFFORT (process all, collect errors) |

## Modified Components

| Component | Domain | What Changed |
|-----------|--------|--------------|
| `WorkflowActionType` | Workflows / Node Execution | Added `BULK_UPDATE_ENTITY` enum value |
| `NodeOutput` (sealed interface) | Workflows / Node Execution | Added `BulkUpdateEntityOutput` as new sealed subtype |
| `WorkflowQueryEntityActionConfig` | Workflows / Node Execution | `execute()` implemented (was `throw NotImplementedError`); template resolution for filter tree added via private `resolveFilterTemplates()` and `resolveRelationshipConditionTemplates()` methods; pagination with `DEFAULT_QUERY_LIMIT = 100`; `outputMetadata` declared on companion object |
| `WorkflowNodeConfigRegistry` | Workflows / Node Execution | `BULK_UPDATE_ENTITY` registered in `registerAllNodes()` |
| `WorkflowCoordinationService` | Workflows / Execution Engine | Added `WorkflowBulkUpdateEntityActionConfig` branch to input resolution `when`-expression |

## Flow Changes

| Flow | Change Type | Description |
|------|-------------|-------------|
| [[Workflow Execution]] | Extended | Node execution step (step 13) now supports QUERY_ENTITY execution (previously threw NotImplementedError) and new BULK_UPDATE_ENTITY action. BulkUpdateEntity introduces paginated query + batch update loop within a single node execution, which is a more complex execution pattern than existing single-operation nodes. |

## Cross-Domain Dependencies

| Source | Target | Mechanism | New? |
|--------|--------|-----------|------|
| Workflows (`WorkflowQueryEntityActionConfig`) | Entities (`EntityQueryService`) | `services.service<EntityQueryService>()` — runtime service injection for query execution | Yes (runtime; model dependency existed, execution dependency is new) |
| Workflows (`WorkflowBulkUpdateEntityActionConfig`) | Entities (`EntityQueryService`) | `services.service<EntityQueryService>()` — queries entities for bulk update target set | Yes |
| Workflows (`WorkflowBulkUpdateEntityActionConfig`) | Entities (`EntityService`) | `services.service<EntityService>()` — gets and updates individual entities in batch loop | Yes (same pattern as existing Create/Update/Delete nodes) |
| Workflows (`WorkflowBulkUpdateEntityActionConfig`) | Entities (query models) | Model imports: `EntityQuery`, `QueryFilter`, `RelationshipFilter`, `FilterValue`, `QueryPagination` | Yes (same models already used by QueryEntity) |

## API Changes

| Endpoint | Method | Change | Breaking? |
|----------|--------|--------|-----------|
| Node type schema endpoint | GET | New node type `ACTION.BULK_UPDATE_ENTITY` now appears in schema listing | No — additive |

## Data Model Changes

| Entity/Table | Change | Migration? |
|-------------|--------|------------|
| None | No database schema changes — all new types are runtime config/model classes stored in existing JSONB columns | No |

## Documentation Impact

### New Documentation Needed

- [ ] [[WorkflowBulkUpdateEntityActionConfig]] — New action node under `domains/Workflows/Node Execution/Actions/`: config fields, JSON examples, validation rules, execution flow (paginated query → batch update loop), error handling modes, cross-domain dependencies, output metadata

### Existing Docs Requiring Updates

| Document | Section | Required Update |
|----------|---------|-----------------|
| [[Action Nodes]] | Implemented Action Nodes table | Add BULK_UPDATE_ENTITY row (status: Implemented). Update QUERY_ENTITY status from "Partial (validation only, execute not implemented)" to "Implemented". |
| [[Node Execution]] | Node Categories table | Update Action Nodes count: 5 → 6 implemented. |
| [[WorkflowQueryEntityActionConfig]] | Responsibilities | Remove "NOT YET IMPLEMENTED" caveat. Add execution responsibilities: template resolution in filter trees, pagination, EntityQueryService delegation. |
| [[WorkflowQueryEntityActionConfig]] | Dependencies | Add runtime dependencies: `EntityQueryService`, `WorkflowNodeInputResolverService`. |
| [[WorkflowQueryEntityActionConfig]] | Consumed By | Update: `WorkflowNode` no longer "Throws NotImplementedError at runtime". |
| [[WorkflowQueryEntityActionConfig]] | Error Handling | Remove `NotImplementedError` row. Add execution error modes. |
| [[WorkflowQueryEntityActionConfig]] | Gotchas | Remove "Execute Not Implemented" warning. Add notes about `DEFAULT_QUERY_LIMIT` (100) system cap and `runBlocking` usage for suspend function bridging. |
| [[WorkflowNodeConfig]] | Key Logic | Add BULK_UPDATE_ENTITY to Actions list in sealed interface hierarchy. |
| [[WorkflowCoordinationService]] | Key Logic | Add BULK_UPDATE_ENTITY to the input resolution dispatch list. |
| [[WorkflowCreateEntityActionConfig]] | (new section) | Document `outputMetadata` companion property declaring output fields (entityId, entityTypeId, payload). |
| [[Workflows]] | Domain Interactions / Depends On | `EntityQueryService` should be listed alongside `EntityService` as consumed from the Entities domain. |
| [[Workflow Execution]] | Flow Steps / Step 13 | Note that QUERY_ENTITY and BULK_UPDATE_ENTITY are now executable. BulkUpdateEntity introduces internal pagination loop during single node execution. |

## Suggested Changelog Entry

```markdown
## 2026-02-13 — QueryEntity execution and BulkUpdateEntity node

**Domains affected:** Workflows (Node Execution, Execution Engine)
**What changed:**

- Implemented `WorkflowQueryEntityActionConfig.execute()` — was previously `throw NotImplementedError`; now resolves template values in filter trees, delegates to `EntityQueryService`, enforces `DEFAULT_QUERY_LIMIT = 100`
- Added `WorkflowBulkUpdateEntityActionConfig` — new action node type that queries entities via embedded `EntityQuery` and applies batch updates with FAIL_FAST or BEST_EFFORT error handling
- Added `BulkUpdateEntityOutput` as new `NodeOutput` sealed subtype with update/failure counts and failed entity details
- Added `BulkUpdateErrorHandling` enum (FAIL_FAST, BEST_EFFORT)
- Added `BULK_UPDATE_ENTITY` to `WorkflowActionType` enum
- Registered `BULK_UPDATE_ENTITY` in `WorkflowNodeConfigRegistry` and `WorkflowCoordinationService` input resolution
- Declared `outputMetadata` on `WorkflowQueryEntityActionConfig` and `WorkflowBulkUpdateEntityActionConfig` companion objects

**New cross-domain dependencies:** Yes — Workflows → Entities domain now has runtime execution dependencies (not just model imports):
- `WorkflowQueryEntityActionConfig` → `EntityQueryService.execute()` (was model-only dependency, now runtime)
- `WorkflowBulkUpdateEntityActionConfig` → `EntityQueryService.execute()` + `EntityService.getEntity()` + `EntityService.saveEntity()`

**New components introduced:**
- `WorkflowBulkUpdateEntityActionConfig` — Action node config for query-based batch entity updates with error handling modes
- `BulkUpdateEntityOutput` — NodeOutput sealed subtype for bulk update results (entitiesUpdated, entitiesFailed, failedEntityDetails, totalProcessed)
- `BulkUpdateErrorHandling` — Enum for error handling modes (FAIL_FAST, BEST_EFFORT)
```
