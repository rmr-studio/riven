---
tags:
  - layer/service
  - component/active
  - architecture/component
Created: 2026-02-08
Updated: 2026-02-08
Domains:
  - "[[Workflows]]"
---# WorkflowDefinitionService

Part of [[Definition Management]]

## Purpose

CRUD service for workflow definitions with workspace scoping, managing definition metadata and initial version creation.

---

## Responsibilities

- Create workflow definitions with empty initial version
- Retrieve workflow definitions by ID or list by workspace
- Update workflow metadata (name, description, icon, tags)
- Soft-delete workflow definitions
- Enforce workspace access control via `@PreAuthorize`
- Log activity for audit trail

---

## Dependencies

- `WorkflowDefinitionRepository` — Definition persistence
- `WorkflowDefinitionVersionRepository` — Version persistence
- [[WorkflowGraphService]] — Graph structure management (separate concern)
- `ActivityService` — Audit logging
- `AuthTokenService` — JWT user extraction

## Used By

- Workflow API controllers — REST endpoints for definition CRUD

---

## Key Logic

**Create workflow:**

1. Create `WorkflowDefinitionEntity` with status=DRAFT, versionNumber=1
2. Create `WorkflowDefinitionVersionEntity` with empty workflow (no nodes/edges) and empty canvas
3. Log activity with CREATE operation

**Metadata vs. structure separation:**

- **This service:** Manages metadata only (name, description, icon, tags, status)
- **[[WorkflowGraphService]]:** Manages structure (nodes, edges, canvas)

**Soft deletion:**

Sets `deleted=true` and `deletedAt=now`. Deleted workflows excluded from queries.

---

## Public Methods

### `createWorkflow(workspaceId, request): WorkflowDefinition`

Creates new workflow with initial empty version. Returns workflow definition model.

### `saveWorkflow(workspaceId, request): SaveWorkflowDefinitionResponse`

Unified save method. If `request.id` is null, creates new workflow. Otherwise, updates existing workflow metadata.

### `getWorkflowById(id, workspaceId): WorkflowDefinition`

Retrieves workflow definition with current version. Throws `NotFoundException` if not found or soft-deleted. Throws `AccessDeniedException` if workspace mismatch.

### `listWorkflowsForWorkspace(workspaceId): List<WorkflowDefinition>`

Returns all non-deleted workflow definitions for workspace.

### `updateWorkflow(id, workspaceId, request): WorkflowDefinition`

Updates workflow metadata only. Only updates provided fields (non-null values in request). Does NOT update workflow/canvas structure.

### `deleteWorkflow(id, workspaceId)`

Soft-deletes workflow definition. Sets deleted flag and timestamp.

---

## Gotchas

- **Initial version always empty:** Created workflows have `workflow.nodeIds = []` and `workflow.edgeIds = []`. Use [[WorkflowGraphService]] to add nodes/edges.
- **Workspace security:** All methods use `@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")` for declarative access control.
- **Partial updates:** `updateWorkflow()` only applies non-null fields from request. Frontend can send partial updates.

---

## Related

- [[WorkflowGraphService]] — Manages workflow structure
- [[WorkflowExecutionService]] — Starts executions
- [[Definition Management]] — Parent subdomain
