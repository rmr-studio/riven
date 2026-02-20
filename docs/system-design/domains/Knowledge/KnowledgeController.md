---
tags:
  - layer/controller
  - component/active
  - architecture/component
Created: 2026-02-19
Updated: 2026-02-19
Domains:
  - "[[Knowledge]]"
---
# KnowledgeController

Part of [[Knowledge]]

## Purpose

REST controller exposing 8 endpoints for semantic metadata CRUD at `/api/v1/knowledge/`, organized by metadata scope: entity types, attributes, and relationships.

---

## Responsibilities

- Expose semantic metadata CRUD endpoints grouped by scope (entity type, attribute, relationship)
- Provide bulk attribute metadata upsert for efficient multi-attribute updates
- Expose full metadata bundle endpoint combining all scopes in one response
- Delegate all business logic to [[EntityTypeSemanticMetadataService]]
- OpenAPI documentation via `@Operation` and `@ApiResponses`

---

## Dependencies

- [[EntityTypeSemanticMetadataService]] — all business logic for metadata CRUD
- [[EntityTypeService]] — bundle construction for full metadata retrieval

## Used By

- REST API consumers — semantic metadata management
- Frontend — entity type semantic annotation interface

---

## Key Logic

**Endpoint organization:**

Endpoints are grouped by metadata target scope:

| Scope | Endpoints | Purpose |
|-------|-----------|---------|
| Entity Type | GET + PUT | Read/write entity-type-level semantic definition |
| Attributes | GET all + PUT single + PUT bulk | Read/write attribute-level metadata with batch support |
| Relationships | GET all + PUT single | Read/write relationship-level metadata |
| Bundle | GET all | Full metadata bundle (entity type + attributes + relationships) |

**Thin controller pattern:**

All endpoints follow the same pattern:
1. Extract path variables (workspaceId, entityTypeId, optional targetId)
2. Delegate to `EntityTypeSemanticMetadataService` method
3. Return `ResponseEntity.ok()` with result

No business logic in the controller — all validation, authorization, and persistence handled by the service layer.

---

## Public Methods

### `getEntityTypeMetadata(workspaceId, entityTypeId): ResponseEntity<EntityTypeSemanticMetadata?>`

### `upsertEntityTypeMetadata(workspaceId, entityTypeId, request): ResponseEntity<EntityTypeSemanticMetadata>`

### `getAttributeMetadata(workspaceId, entityTypeId): ResponseEntity<Map<UUID, EntityTypeSemanticMetadata>>`

### `upsertAttributeMetadata(workspaceId, entityTypeId, attributeId, request): ResponseEntity<EntityTypeSemanticMetadata>`

### `bulkUpsertAttributeMetadata(workspaceId, entityTypeId, requests): ResponseEntity<List<EntityTypeSemanticMetadata>>`

### `getRelationshipMetadata(workspaceId, entityTypeId): ResponseEntity<Map<UUID, EntityTypeSemanticMetadata>>`

### `upsertRelationshipMetadata(workspaceId, entityTypeId, relationshipId, request): ResponseEntity<EntityTypeSemanticMetadata>`

### `getFullMetadataBundle(workspaceId, entityTypeId): ResponseEntity<SemanticMetadataBundle>`

---

## Gotchas

- **PUT semantics on all writes:** Upsert endpoints replace all fields. Omitting `definition` in the request body clears it.
- **No PATCH support:** There is no partial update endpoint. Clients must send complete metadata on every PUT.
- **Authorization via service layer:** `@PreAuthorize` annotations are on the service methods, not the controller endpoints. Controller relies on service-layer authorization.

---

## Related

- [[EntityTypeSemanticMetadataService]] — business logic
- [[Knowledge]] — parent domain
- [[Entity Semantics]] — owns the underlying data model
