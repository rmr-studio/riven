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
# EntityService

Part of [[Entity Management]]

## Purpose

CRUD service for entity instances with validation, relationship hydration, and unique constraint enforcement.

---

## Responsibilities

- Create and update entity instances with payload validation
- Retrieve entities by ID, type, or workspace
- Delete entities with relationship cascade handling
- Enforce unique attribute constraints via normalized table
- Hydrate entity relationships for API responses
- Track impacted entities when relationships change
- Log activity for audit trail

---

## Dependencies

- `EntityRepository` — Entity instance persistence
- [[EntityTypeService]] — Type schema retrieval
- [[EntityRelationshipService]] — Instance relationship management
- [[EntityValidationService]] — Schema validation
- [[EntityTypeAttributeService]] — Unique constraint handling
- `AuthTokenService` — JWT user extraction
- `ActivityService` — Audit logging

## Used By

- Entity API controllers — REST endpoints for entity CRUD

---

## Key Logic

**Save entity (create or update):**

1. Determine if create (no ID) or update (ID provided)
2. Split payload into attributes vs. relationships
3. Validate attribute payload against type schema via [[EntityValidationService]]
4. Save entity to database
5. Check and save unique constraints via [[EntityTypeAttributeService]]
6. Save relationships via [[EntityRelationshipService]] (returns impacted entities)
7. Log activity with CREATE or UPDATE operation
8. Return saved entity + impacted entities (for bidirectional relationship updates)

**Unique constraint enforcement:**

- Extracts unique attributes from payload
- Checks uniqueness (excluding current entity for updates)
- Saves to normalized `entity_unique_values` table
- Throws `UniqueConstraintViolationException` on conflict

**Delete entities:**

1. Find all entities that link TO the deleted entities (impacted sources)
2. Delete entity rows, unique values, and relationships
3. Log activity for each deleted entity
4. Return impacted entities with updated relationship data

**Relationship hydration:**

- All retrieval methods call `entityRelationshipService.findRelatedEntities()`
- Returns `Map<UUID, List<EntityLink>>` keyed by relationship field ID
- Entity model includes `relationships` property for API responses

---

## Public Methods

### `getEntity(id): Entity`

Retrieves single entity with relationships hydrated. Enforces workspace access via `@PostAuthorize`.

### `getEntitiesByTypeId(workspaceId, typeId): List<Entity>`

Retrieves all instances of a specific entity type with relationships.

### `getEntitiesByTypeIds(workspaceId, typeIds): Map<UUID, List<Entity>>`

Batch retrieval for multiple entity types. Returns map keyed by type ID.

### `saveEntity(workspaceId, entityTypeId, request): SaveEntityResponse`

Creates or updates entity. Returns saved entity plus impacted entities (from bidirectional relationship changes).

Validation errors returned in response (not thrown) for better UX.

### `deleteEntities(workspaceId, ids): DeleteEntityResponse`

Soft-deletes entities and cascades to relationships. Returns count of deleted entities plus updated entities that were linking to them.

### `getWorkspaceEntities(workspaceId): List<Entity>`

Retrieves all entities in workspace (across all types). Relationships NOT hydrated for performance.

---

## Gotchas

- **Workspace security:** All methods use `@PreAuthorize` or `@PostAuthorize` for access control
- **Transactional boundaries:** `saveEntity()` and `deleteEntities()` are `@Transactional` — relationship operations participate in same transaction
- **Impacted entities:** Relationship changes can affect other entities (bidirectional links, cascade deletes). SaveEntityResponse and DeleteEntityResponse include these for client cache updates.
- **Validation vs. exceptions:** Schema validation errors returned in SaveEntityResponse.errors (not thrown), but unique constraint violations throw exceptions
- **Entity type immutability:** Cannot change entity's type after creation (validated in saveEntity)

---

## Related

- [[EntityRelationshipService]] — Manages instance relationships
- [[EntityValidationService]] — Schema validation
- [[EntityTypeAttributeService]] — Unique constraint operations
- [[Entity Management]] — Parent subdomain
