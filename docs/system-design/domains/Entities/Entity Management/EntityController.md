---
tags:
  - component/active
  - layer/controller
  - architecture/component
Created: 2026-02-09
Updated: 2026-03-01
Domains:
  - "[[Entities]]"
---
# EntityController

Part of [[Entity Management]]

## Purpose

REST controller for entity instance operations and entity connections. Delegates all business logic to [[EntityService]] and [[EntityRelationshipService]].

---

## Responsibilities

- Expose entity CRUD endpoints under `/api/v1/entity/`
- Expose connection CRUD endpoints for fallback entity linking
- Delegate to services and return `ResponseEntity`
- No business logic — thin controller layer

---

## Dependencies

- [[EntityService]] — Entity instance CRUD operations
- [[EntityRelationshipService]] — Connection CRUD operations

## Used By

- REST API clients — Frontend and external integrations

---

## Endpoints

### Entity Operations

| Method | Path | Purpose | Delegates To |
|--------|------|---------|-------------|
| GET | `/workspace/{workspaceId}` | List entities by type IDs (query param `ids`) | `EntityService.getEntitiesByTypeIds` |
| GET | `/workspace/{workspaceId}/type/{id}` | List entities by single type ID | `EntityService.getEntitiesByTypeId` |
| POST | `/workspace/{workspaceId}/type/{entityTypeId}` | Save entity (create or update) | `EntityService.saveEntity` |
| DELETE | `/workspace/{workspaceId}` | Delete entities (list of IDs in body) | `EntityService.deleteEntities` |

### Connection Operations

| Method | Path | Purpose | Delegates To |
|--------|------|---------|-------------|
| POST | `/workspace/{workspaceId}/entities/{entityId}/connections` | Create connection | `EntityRelationshipService.createConnection` |
| GET | `/workspace/{workspaceId}/entities/{entityId}/connections` | List connections for entity | `EntityRelationshipService.getConnections` |
| PUT | `/workspace/{workspaceId}/connections/{connectionId}` | Update connection | `EntityRelationshipService.updateConnection` |
| DELETE | `/workspace/{workspaceId}/connections/{connectionId}` | Delete connection | `EntityRelationshipService.deleteConnection` |

---

## Gotchas

> [!warning] Connection routes use different path patterns
> Entity-scoped connection operations (create, list) use `/entities/{entityId}/connections`. Connection-level operations (update, delete) use `/connections/{connectionId}` directly under workspace.

> [!warning] Delete entity handles errors inline
> `deleteEntity` checks `response.error` and returns status codes manually (404 or 409) instead of using the exception hierarchy. This is a known inconsistency — should throw domain exceptions and let `@ControllerAdvice` handle it. See Known Inconsistencies in CLAUDE.md.

> [!warning] Save endpoint is create-or-update
> The POST `/workspace/{workspaceId}/type/{entityTypeId}` endpoint handles both creation and updates via `SaveEntityRequest`. It does not follow the typical POST-for-create / PUT-for-update REST convention.

---

## Related

- [[EntityService]] — Entity instance operations
- [[EntityRelationshipService]] — Connection operations
- [[Entity Management]] — Parent subdomain

---

## Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-09 | Stub created | Phase 5 cross-domain integration |
| 2026-03-01 | Full documentation with entity and connection endpoints | Entity Connections |
