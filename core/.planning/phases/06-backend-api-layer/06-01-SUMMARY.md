---
phase: 06-backend-api-layer
plan: 01
subsystem: workflow-api
tags: [rest-api, workflow, crud, spring-boot, kotlin]

dependency-graph:
  requires:
    - Existing workflow entity infrastructure (WorkflowDefinitionEntity, WorkflowDefinitionVersionEntity)
    - Repository layer (WorkflowDefinitionRepository, WorkflowDefinitionVersionRepository)
  provides:
    - REST API for workflow definition CRUD operations
    - WorkflowDefinitionService business logic layer
    - Request models for workflow creation and update
  affects:
    - 06-02 (workflow graph endpoints will extend this foundation)
    - 06-03 (workflow canvas endpoints will extend this foundation)

tech-stack:
  added: []
  patterns:
    - Constructor injection for Spring services
    - @PreAuthorize for workspace access control
    - Soft-delete pattern for workflow definitions
    - Activity logging for audit trail

key-files:
  created:
    - src/main/kotlin/riven/core/service/workflow/WorkflowDefinitionService.kt
    - src/main/kotlin/riven/core/controller/workflow/WorkflowDefinitionController.kt
    - src/main/kotlin/riven/core/models/request/workflow/CreateWorkflowDefinitionRequest.kt
    - src/main/kotlin/riven/core/models/request/workflow/UpdateWorkflowDefinitionRequest.kt
    - src/test/kotlin/riven/core/service/workflow/WorkflowDefinitionServiceTest.kt
    - src/test/kotlin/riven/core/service/util/factory/workflow/WorkflowFactory.kt
  modified:
    - src/main/kotlin/riven/core/enums/core/ApplicationEntityType.kt (added WORKFLOW_DEFINITION)
    - src/main/kotlin/riven/core/enums/activity/Activity.kt (added WORKFLOW_DEFINITION)

decisions:
  - decision: "Use soft-delete pattern for workflow definitions"
    rationale: "Allows recovery of accidentally deleted workflows, consistent with existing entity patterns"
    affects: ["deleteWorkflow implementation", "list/get queries filter deleted"]

metrics:
  duration: "5m 19s"
  completed: "2026-01-20"
---

# Phase 6 Plan 1: Workflow Definition REST API Summary

REST API implementation for workflow definition lifecycle management with service layer, controller, and unit tests.

## What Was Built

### WorkflowDefinitionService (303 lines)
Business logic layer providing:
- `createWorkflow()` - Creates workflow definition with initial empty version (v1)
- `getWorkflowById()` - Retrieves definition with workspace access verification
- `listWorkflowsForWorkspace()` - Lists all non-deleted definitions for workspace
- `updateWorkflow()` - Updates metadata (name, description, icon, tags)
- `deleteWorkflow()` - Soft-deletes definition (sets deleted=true, deletedAt=now)

Key patterns followed:
- Constructor injection (no @Autowired)
- @Transactional for create/update/delete operations
- @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)") for access control
- Activity logging for all write operations
- NotFoundException for missing resources
- AccessDeniedException for workspace mismatch

### WorkflowDefinitionController (184 lines)
REST endpoints:
- `POST /api/v1/workflow/definitions/workspace/{workspaceId}` - Create (201 Created)
- `GET /api/v1/workflow/definitions/{id}?workspaceId={}` - Get by ID (200 OK)
- `GET /api/v1/workflow/definitions/workspace/{workspaceId}` - List (200 OK)
- `PUT /api/v1/workflow/definitions/{id}?workspaceId={}` - Update (200 OK)
- `DELETE /api/v1/workflow/definitions/{id}?workspaceId={}` - Delete (204 No Content)

OpenAPI documentation with @Tag and @Operation annotations.

### Request Models
- `CreateWorkflowDefinitionRequest` - name, description, iconColour, iconType, tags
- `UpdateWorkflowDefinitionRequest` - all fields optional for partial updates

### Enum Extensions
- Added `WORKFLOW_DEFINITION` to `ApplicationEntityType` for activity logging
- Added `WORKFLOW_DEFINITION` to `Activity` enum for audit trail

### Unit Tests (9 test cases)
1. createWorkflow_success_createsDefinitionAndVersion
2. getWorkflowById_success_returnsWorkflow
3. getWorkflowById_notFound_throwsNotFoundException
4. getWorkflowById_wrongWorkspace_throwsAccessDeniedException
5. listWorkflowsForWorkspace_success_returnsList
6. updateWorkflow_success_updatesMetadata
7. deleteWorkflow_success_softDeletes
8. deleteWorkflow_notFound_throwsNotFoundException
9. deleteWorkflow_alreadyDeleted_throwsNotFoundException

## Decisions Made

1. **Soft-delete pattern**: Workflows are soft-deleted (deleted=true, deletedAt=timestamp) rather than hard-deleted. This allows recovery and maintains referential integrity with executions.

2. **Version creation on workflow create**: Initial version (v1) created with empty workflow/canvas objects. Graph structure updates will be handled by separate endpoints.

3. **Workspace access via query param**: For single-resource endpoints (GET, PUT, DELETE by ID), workspaceId is passed as query parameter for flexibility with cross-workspace operations.

4. **Metadata-only updates**: updateWorkflow() only updates metadata fields (name, description, icon, tags). Workflow graph and canvas structure updates are separate concerns.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] WorkflowDefinitionService implements 5 CRUD methods
- [x] Service has 303 lines (requirement: min 150)
- [x] Request models created with proper defaults
- [x] WorkflowDefinitionController exposes 5 REST endpoints
- [x] All endpoints follow established patterns
- [x] Unit tests: 9 test cases, all passing
- [x] ./gradlew build -x test succeeds

## Next Phase Readiness

Ready for Plan 02 (Workflow Graph Endpoints):
- Service infrastructure in place
- Controller patterns established
- Test patterns documented
- Activity logging configured

No blockers identified.
