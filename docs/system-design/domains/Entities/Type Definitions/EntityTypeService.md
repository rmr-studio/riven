---
tags:
  - layer/service
  - component/active
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-08
Domains:
  - "[[Entities]]"
---
# EntityTypeService

Part of [[Type Definitions]]

## Purpose

Primary entry point for entity type lifecycle operations including creation, attribute/relationship management, definition publishing, and impact-aware deletion.

---

## Responsibilities

- Create and publish new entity types with initial schema
- Update entity type metadata (name, description, icon)
- Add/modify/remove attribute and relationship definitions
- Reorder entity type columns (attributes and relationships)
- Perform impact analysis before breaking changes
- Delete entity types with relationship cascade handling
- Retrieve entity types by ID, key, or workspace
- Log activity for audit trail

---

## Dependencies

- `EntityTypeRepository` — Type persistence
- [[EntityTypeRelationshipService]] — Relationship definition management
- [[EntityTypeAttributeService]] — Attribute schema operations
- [[EntityTypeRelationshipDiffService]] — Delta calculation for modifications
- `EntityTypeRelationshipImpactAnalysisService` — Breaking change impact analysis
- `AuthTokenService` — JWT user extraction
- `ActivityService` — Audit logging

## Used By

- Entity Type API controllers — REST endpoints for type management
- [[EntityService]] — Fetches type definitions for instance validation

---

## Key Logic

**Publish entity type:**

1. Create `EntityTypeEntity` with initial schema containing single identifier attribute
2. Identifier is UUID-based, required, unique, protected STRING field
3. Initialize empty relationships list and single-column ordering
4. Log CREATE activity

**Save definition (attribute or relationship):**

1. Parse request to determine attribute vs. relationship
2. For attributes: delegate to [[EntityTypeAttributeService]] (validates breaking changes)
3. For relationships: calculate diff and check impact via `EntityTypeRelationshipImpactAnalysisService`
4. If `impactConfirmed=false` and impacts exist: return impacts WITHOUT applying changes
5. If confirmed or no impacts: apply changes via [[EntityTypeRelationshipService]]
6. Update column ordering (insert at specified index)
7. Return `EntityTypeImpactResponse` with updated types

**Impact analysis flow:**

- User attempts change → service detects impacts → returns `EntityTypeImpactResponse.impact`
- Frontend shows confirmation dialog with impact details
- User confirms → frontend retries with `impactConfirmed=true`
- Service applies changes and returns `EntityTypeImpactResponse.updatedEntityTypes`

**Remove definition:**

- Similar impact flow for attribute and relationship removals
- Relationship removals specify `DeleteAction` (DELETE_RELATIONSHIP or REMOVE_ENTITY_TYPE)
- Attributes removed via [[EntityTypeAttributeService]], relationships via [[EntityTypeRelationshipService]]

**Column reordering:**

- Maintains ordered list of `EntityTypeAttributeColumn` (key + type)
- When adding: inserts at specified index (or end if null)
- When moving: removes from old position, inserts at new position
- Coerces indices to valid bounds

---

## Public Methods

### `publishEntityType(workspaceId, request): EntityType`

Creates new entity type with initial identifier attribute. Returns published type model.

### `updateEntityTypeConfiguration(workspaceId, type): EntityType`

Updates metadata only (name, description, icon, columns). Does NOT modify schema or relationships.

### `saveEntityTypeDefinition(workspaceId, request, impactConfirmed): EntityTypeImpactResponse`

Unified save for attributes and relationships. Performs impact analysis if not confirmed. Returns impacts OR updated types.

### `removeEntityTypeDefinition(workspaceId, request, impactConfirmed): EntityTypeImpactResponse`

Removes attribute or relationship definition with impact analysis flow.

### `reorderEntityTypeColumns(order, key, prev, new): List<EntityTypeAttributeColumn>`

Pure function for column reordering. Handles both insertions (prev=null) and moves.

### `deleteEntityType(workspaceId, key, impactConfirmed): EntityTypeImpactResponse`

Deletes entity type with cascade to all relationships. Impact analysis required if type has relationships.

### `getWorkspaceEntityTypes(workspaceId): List<EntityType>`

Retrieves all entity types for workspace.

### `getByKey(key, workspaceId): EntityTypeEntity`

Retrieves entity type by unique key within workspace.

### `getById(id): EntityTypeEntity`

Retrieves entity type by ID (no workspace scope — used for system operations).

### `getByIds(ids): List<EntityTypeEntity>`

Batch retrieval by IDs.

---

## Gotchas

- **Mutable types:** Unlike BlockTypeService (versioned), entity types update in place. Breaking changes validated against existing entities.
- **Impact confirmation required:** Breaking changes return impact analysis first. Client must retry with `impactConfirmed=true` after user confirmation.
- **Workspace security:** All public methods use `@PreAuthorize` for access control
- **Protected types:** `protected=false` on user-created types. System types (if any) cannot be modified/deleted.
- **Relationship impact vs. attribute impact:** Relationship changes can affect OTHER entity types (bidirectional definitions). Attribute changes only affect the same type's instances.
- **Cascade complexity:** Deleting entity type with relationships requires cascade handling via [[EntityTypeRelationshipService]]

---

## Related

- [[EntityTypeAttributeService]] — Attribute schema operations
- [[EntityTypeRelationshipService]] — Relationship definition management
- [[EntityTypeRelationshipDiffService]] — Modification delta calculation
- [[EntityService]] — Consumes type definitions for instance validation
- [[Type Definitions]] — Parent subdomain
