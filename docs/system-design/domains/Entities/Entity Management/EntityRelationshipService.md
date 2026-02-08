---
tags:
  - layer/service
  - component/active
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-08
---
# EntityRelationshipService

Part of [[Entity Management]]

## Purpose

Manages instance-level relationship data including linking/unlinking entities and automatic bidirectional synchronization.

---

## Responsibilities

- Save relationships between entity instances
- Compare desired vs. current state to calculate additions/removals
- Create inverse relationships for bidirectional definitions
- Remove inverse relationships when source relationships deleted
- Track impacted entities affected by relationship changes
- Hydrate relationship data for entity retrieval
- Archive relationships when entities deleted

---

## Dependencies

- `EntityRelationshipRepository` — Relationship persistence
- `EntityRepository` — Entity instance retrieval for batch operations
- [[EntityTypeService]] — Fetch entity types for bidirectional handling

## Used By

- [[EntityService]] — Calls during entity save/delete operations
- Entity API controllers — Relationship hydration for responses

---

## Key Logic

**Save relationships:**

1. Fetch previous relationships from database
2. Calculate delta: additions (curr - prev), removals (prev - curr)
3. Delete removed relationships
4. Create new relationship records
5. For bidirectional/REFERENCE relationships:
   - Find inverse relationship definition on target type
   - Create/delete inverse records on target entities
   - Track target entities as "impacted"
6. Return `SaveRelationshipsResult` with links + impacted entity IDs

**Bidirectional relationship handling:**

- **ORIGIN relationships:** When `bidirectional=true`, creates corresponding REFERENCE on target
- **REFERENCE relationships:** Always creates inverse ORIGIN (byproduct of bidirectional)
- Inverse definition lookup: Matches `originRelationshipId` field
- Batch operations: Groups targets by type for efficient inverse handling

**Impacted entity tracking:**

- Any entity that receives an inverse relationship create/delete is "impacted"
- Caller (EntityService) fetches these entities with updated relationships
- Used for client cache updates (real-time collaboration, optimistic UI)

**Identifier label extraction:**

- Uses entity's `identifierKey` to extract display label from payload
- Falls back to entity ID if identifier field missing or null

---

## Public Methods

### `saveRelationships(id, workspaceId, type, curr): SaveRelationshipsResult`

Main entry point for relationship save operations. Compares current payload against database state, creates/removes relationships, handles bidirectional sync.

Returns both the entity's relationship links and set of impacted entity IDs.

### `findRelatedEntities(entityId, workspaceId): Map<UUID, List<EntityLink>>`

Hydrates relationships for single entity. Returns map keyed by relationship field ID.

### `findRelatedEntities(entityIds, workspaceId): Map<UUID, Map<UUID, List<EntityLink>>>`

Batch hydration for multiple entities. Returns nested map: entityId -> fieldId -> links.

### `findByTargetIdIn(ids): Map<UUID, List<EntityRelationshipEntity>>`

Finds all relationships where given entities are targets. Used by delete operations to identify impacted sources.

### `archiveEntities(ids, workspaceId): List<EntityRelationshipEntity>`

Deletes all relationships for given entities (both as source and target). Called during entity deletion.

---

## Gotchas

- **Bidirectional sync complexity:** ORIGIN vs. REFERENCE relationship types have different inverse lookup logic. REFERENCE relationships point back to ORIGIN via `originRelationshipId`.
- **Batch fetching:** Fetches all target entities and types upfront to avoid N+1 queries during relationship processing
- **Removal handling:** When removing relationship fields entirely (field exists in prev but not curr), also removes inverse relationships
- **Transactional participation:** Not annotated `@Transactional` itself — participates in caller's transaction (EntityService)
- **Target validation:** Silently skips relationship creation if target entity doesn't exist (prevents foreign key violations)

---

## Related

- [[EntityService]] — Primary consumer for instance operations
- [[EntityTypeService]] — Provides type definitions for bidirectional logic
- [[Entity Management]] — Parent subdomain
- [[Relationships]] — Type-level relationship definitions
