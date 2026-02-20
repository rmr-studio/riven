---
tags:
  - layer/controller
  - component/active
  - architecture/component
Created: 2026-02-09
Updated: 2026-02-19
Domains:
  - "[[Entities]]"
---
# EntityTypeController

Part of [[Type Definitions]]

## Purpose

REST controller for entity type schema management — exposes endpoints for type CRUD, attribute/relationship definition management, and optional semantic metadata loading via `?include=semantics`.

---

## Responsibilities

- Expose entity type CRUD endpoints at `/api/v1/entity/schema/`
- Delegate all business logic to [[EntityTypeService]]
- Support opt-in semantic metadata loading via `?include=semantics` query parameter
- Return `EntityTypeWithSemanticsResponse` wrappers with optional `SemanticMetadataBundle`
- Swagger documentation via `@Operation` and `@ApiResponses` annotations

---

## Dependencies

- [[EntityTypeService]] — all entity type business logic
- [[EntityTypeSemanticMetadataService]] — semantic metadata bundle construction (accessed via EntityTypeService)

## Used By

- REST API consumers — entity type management
- Frontend — entity type schema editor with optional semantic metadata display

---

## Key Logic

**`?include=semantics` parameter:**

The `getEntityTypesForWorkspace` and `getEntityTypeByKeyForWorkspace` endpoints accept an optional `include: List<String>` query parameter. When `"semantics"` is included:

1. Delegates to `EntityTypeService.getWorkspaceEntityTypesWithIncludes()`
2. Service batch-fetches semantic metadata for all returned entity types
3. Groups metadata into `SemanticMetadataBundle` (entity type + attributes map + relationships map)
4. Wraps each entity type in `EntityTypeWithSemanticsResponse`

Without `?include=semantics`, the `semantics` field is `null` and the response contains only entity type data.

**Response wrapper:**

All GET endpoints return `EntityTypeWithSemanticsResponse`:
```kotlin
data class EntityTypeWithSemanticsResponse(
    val entityType: EntityType,
    val semantics: SemanticMetadataBundle? = null
)
```

---

## Public Methods

### `getEntityTypesForWorkspace(workspaceId, include): ResponseEntity<List<EntityTypeWithSemanticsResponse>>`

Lists all entity types for workspace. Pass `?include=semantics` to attach metadata bundles.

### `getEntityTypeByKeyForWorkspace(workspaceId, key, include): ResponseEntity<EntityTypeWithSemanticsResponse>`

Gets single entity type by key. Pass `?include=semantics` to attach metadata bundle.

### `publishEntityType(workspaceId, request): ResponseEntity<EntityType>`

Creates and publishes a new entity type with initial schema.

### `saveEntityTypeConfiguration(workspaceId, request): ResponseEntity<EntityType>`

Updates entity type metadata (name, description, icon).

### `saveEntityTypeDefinition(workspaceId, request, impactConfirmed): ResponseEntity<EntityTypeImpactResponse>`

Saves attribute or relationship definitions with impact analysis.

### `removeEntityTypeDefinition(workspaceId, request, impactConfirmed): ResponseEntity<EntityTypeImpactResponse>`

Removes definitions with impact analysis.

### `deleteEntityType(workspaceId, key, impactConfirmed): ResponseEntity<EntityTypeImpactResponse>`

Deletes entity type with cascade handling.

---

## Gotchas

> [!warning] Response Wrapper Breaking Change
> The GET endpoint return types changed from `List<EntityType>` / `EntityType` to `List<EntityTypeWithSemanticsResponse>` / `EntityTypeWithSemanticsResponse`. Clients accessing top-level entity type properties directly will need to access them via the `entityType` field instead.

---

## Related

- [[EntityTypeService]] — business logic
- [[EntityTypeSemanticMetadataService]] — semantic metadata operations
- [[Type Definitions]] — parent subdomain
