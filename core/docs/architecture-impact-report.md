---
tags:
  - architecture/change-report
Created: 2026-02-13
Branch: workflows
Base: main
---

# Architecture Impact Report: workflows

## Summary

This branch introduces **output metadata infrastructure** for the workflow node system. Each workflow node type can now optionally declare the shape of its execution output (`outputMetadata`) as structured field definitions alongside its existing `configSchema`. The metadata flows through the registry, internal data classes, and API response DTOs to the frontend, enabling downstream nodes and the UI to understand what data a node produces before execution.

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

## Suggested Changelog Entries

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
