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

---
---

# Architecture Impact Report: entity-semantics

---
tags:
  - architecture/change-report
Created: 2026-02-19
Branch: entity-semantics
Base: main
---

## Summary

This branch introduces the **Semantic Metadata Foundation** — Phase 1 of the Knowledge Layer ingestion pipeline. It adds the infrastructure for attaching semantic meaning (natural language definitions, attribute classifications, and free-form tags) to entity types, their attributes, and their relationship definitions. Semantic metadata is stored in a new `entity_type_semantic_metadata` table using a single-table discriminator pattern (ADR-002, ADR-003), completely separate from the existing `entity_types` table to protect the entity CRUD hot path.

The implementation spans three layers: (1) a **data layer** with a new PostgreSQL table, pgvector extension registration, JPA entity, domain model, repository with custom JPQL for hard-delete/soft-delete, two enums, and a Testcontainers image switch; (2) a **service layer** with `EntityTypeSemanticMetadataService` providing CRUD operations and lifecycle hooks wired into `EntityTypeService`, `EntityTypeAttributeService`, and `EntityTypeRelationshipService` to auto-create and auto-delete metadata records when entity schema components change; and (3) an **API layer** with a new `KnowledgeController` exposing 8 endpoints at `/api/v1/knowledge/` and an opt-in `?include=semantics` query parameter on existing `EntityTypeController` GET endpoints. This is a purely additive change — no existing API contracts, response shapes, or database tables are modified.

## Affected Domains

| Domain | Impact | Description |
|--------|--------|-------------|
| Entities / Type Definitions | Extended | `EntityTypeService`, `EntityTypeAttributeService`, `EntityTypeRelationshipService` gain lifecycle hooks that delegate to `EntityTypeSemanticMetadataService` for metadata auto-creation and deletion. `EntityTypeController` gains `?include=semantics` query parameter support and a new constructor dependency. |
| Entities / Entity Semantics | New | New subdomain materialized with `EntityTypeSemanticMetadataService`, `EntityTypeSemanticMetadataRepository`, `EntityTypeSemanticMetadataEntity`, and associated enums/models. Previously a stub in the vault with no implementation. |
| Entities / Relationships | Extended | `EntityTypeRelationshipService` gains lifecycle hooks for relationship metadata creation (on add) and hard-deletion (on remove, including inverse REFERENCE relationships). |
| Knowledge | Extended | First concrete implementation within the Knowledge domain: `KnowledgeController` with 8 REST endpoints for semantic metadata CRUD. Previously the domain existed only as a conceptual document. |

## New Components

| Component | Domain | Type | Purpose |
|-----------|--------|------|---------|
| `EntityTypeSemanticMetadataService` | Entities / Entity Semantics | Service | CRUD operations for semantic metadata, lifecycle hooks for auto-create/delete, workspace verification. Sole writer to the `entity_type_semantic_metadata` table. |
| `KnowledgeController` | Knowledge | Controller | 8 REST endpoints at `/api/v1/knowledge/` for semantic metadata CRUD — entity type metadata GET/PUT, attribute metadata GET/PUT/bulk-PUT, relationship metadata GET/PUT, full bundle GET. |
| `EntityTypeSemanticMetadataEntity` | Entities / Entity Semantics | JPA Entity | Database mapping for `entity_type_semantic_metadata` table. Extends `AuditableSoftDeletableEntity`, includes `toModel()`. Uses `@Type(JsonBinaryType::class)` for JSONB `tags` column. |
| `EntityTypeSemanticMetadata` | Entities / Entity Semantics | Domain Model | Immutable data class representing semantic metadata in the service/API layer. |
| `EntityTypeSemanticMetadataRepository` | Entities / Entity Semantics | Repository | JPA repository with derived queries plus custom JPQL `hardDeleteByTarget` and `softDeleteByEntityTypeId` operations. |
| `SemanticMetadataTargetType` | Entities / Entity Semantics | Enum | Discriminator: `ENTITY_TYPE`, `ATTRIBUTE`, `RELATIONSHIP` — identifies which schema element a metadata record describes. |
| `SemanticAttributeClassification` | Entities / Entity Semantics | Enum | 6 lowercase classification values (`identifier`, `categorical`, `quantitative`, `temporal`, `freetext`, `relational_reference`) matching the wire format. |
| `SaveSemanticMetadataRequest` | Entities / Entity Semantics | DTO | Request body for single-target metadata PUT with `definition`, `classification`, `tags`. |
| `BulkSaveSemanticMetadataRequest` | Entities / Entity Semantics | DTO | Request body for bulk attribute metadata PUT — includes `targetId` plus metadata fields. |
| `SemanticMetadataBundle` | Entities / Entity Semantics | Response Model | Bundles entity type metadata + attribute metadata map + relationship metadata map for the `?include=semantics` feature and full-bundle endpoint. |
| `EntityTypeWithSemanticsResponse` | Entities / Entity Semantics | Response Model | Wraps `EntityType` with optional `SemanticMetadataBundle` for `?include=semantics` on entity type endpoints. |
| `EntityTypeSemanticMetadataServiceTest` | Entities / Entity Semantics | Test | 12 unit test cases covering reads, mutations, lifecycle hooks, and workspace verification. |

## Modified Components

| Component | Domain | What Changed |
|-----------|--------|--------------|
| [[EntityTypeService]] | Entities / Type Definitions | New constructor dependency on `EntityTypeSemanticMetadataService`. Lifecycle hook in `publishEntityType` calls `initializeForEntityType` after saving the entity type. Lifecycle hook in `deleteEntityType` calls `softDeleteForEntityType` before soft-deleting the entity type. |
| [[EntityTypeAttributeService]] | Entities / Type Definitions | New constructor dependency on `EntityTypeSemanticMetadataService`. New-attribute detection (`isNewAttribute`) added before schema mutation. Lifecycle hook in `saveAttributeDefinition` calls `initializeForTarget` for genuinely new attributes. Lifecycle hook in `removeAttributeDefinition` calls `deleteForTarget` to hard-delete attribute metadata. |
| [[EntityTypeRelationshipService]] | Entities / Relationships | New constructor dependency on `EntityTypeSemanticMetadataService`. `addOrUpdateRelationship` calls `initializeForTarget` when a new relationship is added. `removeOriginRelationship` calls `deleteForTarget` for removed ORIGIN relationships. `removeInverseReferenceRelationship` finds the REFERENCE relationship before removal and calls `deleteForTarget` for its metadata. Cascade removal of REFERENCE relationships during entity type deletion also hard-deletes metadata. |
| [[EntityTypeController]] | Entities / Type Definitions | New constructor dependency on `EntityTypeSemanticMetadataService`. `getEntityTypesForWorkspace` and `getEntityTypeByKeyForWorkspace` gain `@RequestParam include: List<String>` parameter. Return type changed from `ResponseEntity<List<EntityType>>` / `ResponseEntity<EntityType>` to `ResponseEntity<List<EntityTypeWithSemanticsResponse>>` / `ResponseEntity<EntityTypeWithSemanticsResponse>`. Added private `buildBundle()` helper. Minor Swagger description fixes ("an workspace" → "a workspace"). |
| `EntityQueryIntegrationTestBase` | Entities / Querying | Testcontainers Docker image changed from `postgres:16-alpine` to `pgvector/pgvector:pg16` (with `asCompatibleSubstituteFor("postgres")`). |
| `EntityTypeRelationshipServiceTest` | Entities / Relationships | Added `@MockitoBean` for `EntityTypeSemanticMetadataService`. Added it to `reset()` call in `@BeforeEach`. |
| `db/schema/00_extensions/extensions.sql` | Infrastructure | Appended `CREATE EXTENSION IF NOT EXISTS "vector"` for pgvector — infrastructure prerequisite for Phase 3 Enrichment Pipeline. |

## Flow Changes

| Flow | Change Type | Description |
|------|-------------|-------------|
| [[Flow - Semantic Metadata Lifecycle Sync]] | New | Documents the full lifecycle of semantic metadata records: auto-creation during entity type publish and attribute/relationship addition; hard-deletion on attribute/relationship removal; cascade soft-deletion on entity type soft-delete. All operations execute within the same `@Transactional` boundary as the triggering mutation. |
| [[Entity Type Definition]] | Extended | Entity type publish now includes metadata initialization as an additional step within the same transaction. Entity type deletion now includes metadata cascade soft-delete. |
| [[Entity CRUD]] | Not directly affected | Entity instance CRUD is unmodified — semantic metadata is on a separate table with no impact on the entity read/write hot path. |

## Cross-Domain Dependencies

| Source | Target | Mechanism | New? |
|--------|--------|-----------|------|
| Knowledge (`KnowledgeController`) | Entities (`EntityTypeSemanticMetadataService`) | Direct service injection — controller delegates all business logic to the service | Yes |
| Entities / Type Definitions (`EntityTypeService`) | Entities / Entity Semantics (`EntityTypeSemanticMetadataService`) | Constructor injection — lifecycle hooks for metadata init and soft-delete | Yes |
| Entities / Type Definitions (`EntityTypeAttributeService`) | Entities / Entity Semantics (`EntityTypeSemanticMetadataService`) | Constructor injection — lifecycle hooks for attribute metadata init and hard-delete | Yes |
| Entities / Relationships (`EntityTypeRelationshipService`) | Entities / Entity Semantics (`EntityTypeSemanticMetadataService`) | Constructor injection — lifecycle hooks for relationship metadata init and hard-delete | Yes |
| Entities / Entity Semantics (`EntityTypeSemanticMetadataService`) | Entities / Type Definitions (`EntityTypeRepository`) | Constructor injection — workspace ownership verification for public-facing methods | Yes |
| Entities / Type Definitions (`EntityTypeController`) | Entities / Entity Semantics (`EntityTypeSemanticMetadataService`) | Constructor injection — `?include=semantics` feature fetches metadata in batch | Yes |

## API Changes

| Endpoint | Method | Change | Breaking? |
|----------|--------|--------|-----------|
| `GET /api/v1/entity/schema/workspace/{workspaceId}` | GET | Return type changed from `List<EntityType>` to `List<EntityTypeWithSemanticsResponse>`. New optional `?include=semantics` param. Without the param, `semantics` is `null` and `entityType` contains the same data as before. | **Potentially** — response is now wrapped in `EntityTypeWithSemanticsResponse` with `entityType` and `semantics` fields. Clients accessing top-level entity type properties directly will break. |
| `GET /api/v1/entity/schema/workspace/{workspaceId}/key/{key}` | GET | Same wrapping as above — return type changed to `EntityTypeWithSemanticsResponse`. | **Potentially** — same wrapping concern. |
| `GET /api/v1/knowledge/workspace/{wId}/entity-type/{etId}` | GET | New endpoint — returns entity type semantic metadata | No — additive |
| `PUT /api/v1/knowledge/workspace/{wId}/entity-type/{etId}` | PUT | New endpoint — upserts entity type semantic metadata (full replacement) | No — additive |
| `GET /api/v1/knowledge/workspace/{wId}/entity-type/{etId}/attributes` | GET | New endpoint — returns all attribute metadata for entity type | No — additive |
| `PUT /api/v1/knowledge/workspace/{wId}/entity-type/{etId}/attribute/{aId}` | PUT | New endpoint — upserts single attribute metadata | No — additive |
| `PUT /api/v1/knowledge/workspace/{wId}/entity-type/{etId}/attributes/bulk` | PUT | New endpoint — bulk upserts attribute metadata | No — additive |
| `GET /api/v1/knowledge/workspace/{wId}/entity-type/{etId}/relationships` | GET | New endpoint — returns all relationship metadata for entity type | No — additive |
| `PUT /api/v1/knowledge/workspace/{wId}/entity-type/{etId}/relationship/{rId}` | PUT | New endpoint — upserts single relationship metadata | No — additive |
| `GET /api/v1/knowledge/workspace/{wId}/entity-type/{etId}/all` | GET | New endpoint — returns full metadata bundle (entity type + attributes + relationships) | No — additive |

## Data Model Changes

| Entity/Table | Change | Migration? |
|-------------|--------|------------|
| `entity_type_semantic_metadata` | New table with 13 columns: `id` (UUID PK), `workspace_id` (FK), `entity_type_id` (FK), `target_type` (TEXT with CHECK), `target_id` (UUID), `definition` (TEXT), `classification` (TEXT with CHECK), `tags` (JSONB), `deleted`, `deleted_at`, `created_at`, `updated_at`, `created_by`, `updated_by`. UNIQUE on `(entity_type_id, target_type, target_id)`. 3 indexes including 2 partial indexes on `WHERE deleted = false`. | Yes — new SQL file `db/schema/01_tables/entity_semantic_metadata.sql` |
| pgvector extension | `CREATE EXTENSION IF NOT EXISTS "vector"` added to `db/schema/00_extensions/extensions.sql` | Yes — modified existing SQL file |
| Existing tables | No changes to any existing table | No |

## Documentation Impact

### New Documentation Needed

- [ ] [[EntityTypeSemanticMetadataService]] — Component doc under `domains/Entities/Entity Semantics/`: service responsibilities, public API methods, lifecycle hook methods, workspace verification pattern, no-activity-logging decision, transaction boundaries
- [ ] [[EntityTypeSemanticMetadataRepository]] — Component doc under `domains/Entities/Entity Semantics/`: derived queries, custom JPQL (hardDeleteByTarget, softDeleteByEntityTypeId), `@SQLRestriction` implications
- [ ] [[KnowledgeController]] — Component doc under `domains/Knowledge/`: 8 endpoints, request/response shapes, delegation pattern, `buildBundle` helper
- [ ] Update [[Entity Semantics]] component table — currently has empty `[[]]` placeholder; should list `EntityTypeSemanticMetadataService`, `EntityTypeSemanticMetadataRepository`, `EntityTypeSemanticMetadataEntity`, `KnowledgeController`

### Existing Docs Requiring Updates

| Document | Section | Required Update |
|----------|---------|-----------------|
| [[Entities]] | Sub-Domains table | Add `[[Entity Semantics]]` row: "Semantic metadata for entity types, attributes, and relationships" |
| [[Entities]] | Boundaries / "This Domain Does NOT Own" | Remove "Entity semantics and templates (future domains, not yet implemented)" — entity semantics is now implemented within the Entities domain |
| [[Entities]] | Data / Owned Entities | Add `EntityTypeSemanticMetadataEntity` row with key fields |
| [[Entities]] | Data / Database Tables | Add `entity_type_semantic_metadata` row |
| [[Entities]] | Domain Interactions / Consumed By | Add Knowledge domain row: `KnowledgeController` consumes `EntityTypeSemanticMetadataService` |
| [[Entities]] | Key Decisions | Add row: "Separate table for semantic metadata (ADR-002)" and "Single discriminator table (ADR-003)" |
| [[Entities]] | Recent Changes | Add entry for entity semantics implementation |
| [[Entity Semantics]] | Components table | Populate with `EntityTypeSemanticMetadataService`, `EntityTypeSemanticMetadataRepository`, `KnowledgeController` |
| [[Entity Semantics]] | Recent Changes | Add entry for Phase 1 implementation |
| [[Knowledge]] | Components table | Add `KnowledgeController` |
| [[Knowledge]] | Boundaries | Populate "This Domain Owns" and "This Domain Does NOT Own" sections — owns semantic metadata CRUD endpoints; does not own entity type definitions |
| [[Knowledge]] | Data / Owned Entities | Add `EntityTypeSemanticMetadataEntity` (shared ownership with Entity Semantics subdomain) |
| [[Knowledge]] | Domain Interactions / Depends On | Add: Entities domain — reads entity type data for workspace verification |
| [[Knowledge]] | Key Decisions | Add references to ADR-002 and ADR-003 |
| [[Knowledge]] | Recent Changes | Add entry for Phase 1 |
| [[Type Definitions]] | (if component details exist) | Note lifecycle hooks in `EntityTypeService`, `EntityTypeAttributeService` that delegate to `EntityTypeSemanticMetadataService` |
| [[EntityTypeController]] | Pending review note | Should be fleshed out with `?include=semantics` parameter documentation and `EntityTypeWithSemanticsResponse` wrapping |
| [[EntityTypeAttributeService]] | (if doc exists) | Document lifecycle hook: new-attribute detection and metadata initialization |
| [[EntityTypeRelationshipService]] | (if doc exists) | Document lifecycle hooks: metadata init on relationship add, hard-delete on relationship remove (including inverse REFERENCE cleanup) |
| [[Infrastructure / Tech Stack]] | (if populated) | Add pgvector as a registered PostgreSQL extension (prerequisite for Phase 3) |

## Suggested Changelog Entry

```markdown
## 2026-02-19 — Semantic Metadata Foundation (Knowledge Layer Phase 1)

**Domains affected:** Entities (Type Definitions, Entity Semantics, Relationships), Knowledge
**What changed:**
- Added `entity_type_semantic_metadata` table with single-table discriminator pattern for attaching semantic definitions, classifications, and tags to entity types, attributes, and relationship definitions
- Registered pgvector PostgreSQL extension as infrastructure prerequisite for Phase 3 Enrichment Pipeline
- Created `EntityTypeSemanticMetadataService` as sole writer for metadata CRUD and lifecycle hooks
- Created `KnowledgeController` with 8 REST endpoints at `/api/v1/knowledge/` for semantic metadata management
- Wired lifecycle hooks into `EntityTypeService` (metadata init on publish, soft-delete cascade on delete), `EntityTypeAttributeService` (metadata init on attribute add, hard-delete on attribute remove), and `EntityTypeRelationshipService` (metadata init on relationship add, hard-delete on relationship remove including inverse REFERENCE cleanup)
- Added `?include=semantics` opt-in query parameter to `EntityTypeController.getEntityTypesForWorkspace` and `getEntityTypeByKeyForWorkspace` — wraps response in `EntityTypeWithSemanticsResponse`
- Switched Testcontainers image from `postgres:16-alpine` to `pgvector/pgvector:pg16`
- Added `EntityTypeSemanticMetadataServiceTest` with 12 unit test cases

**New cross-domain dependencies:** Yes
- Knowledge (`KnowledgeController`) → Entities (`EntityTypeSemanticMetadataService`) via direct service injection
- Entities / Type Definitions → Entities / Entity Semantics via lifecycle hooks in `EntityTypeService`, `EntityTypeAttributeService`, `EntityTypeRelationshipService`
- Entities / Entity Semantics → Entities / Type Definitions via `EntityTypeRepository` for workspace ownership verification

**New components introduced:**
- `EntityTypeSemanticMetadataService` — CRUD operations and lifecycle hooks for semantic metadata
- `KnowledgeController` — 8 REST endpoints for semantic metadata management at `/api/v1/knowledge/`
- `EntityTypeSemanticMetadataEntity` — JPA entity for `entity_type_semantic_metadata` table
- `EntityTypeSemanticMetadata` — Domain model for semantic metadata
- `EntityTypeSemanticMetadataRepository` — JPA repository with custom JPQL for hard-delete and cascade soft-delete
- `SemanticMetadataTargetType` — Discriminator enum (ENTITY_TYPE, ATTRIBUTE, RELATIONSHIP)
- `SemanticAttributeClassification` — Classification enum (6 lowercase values)
- `SaveSemanticMetadataRequest` / `BulkSaveSemanticMetadataRequest` — Request DTOs
- `SemanticMetadataBundle` / `EntityTypeWithSemanticsResponse` — Response models for `?include=semantics` feature
```
