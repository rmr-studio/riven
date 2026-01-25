---
phase: 06-backend-api-layer
plan: 02
subsystem: workflow-graph-api
tags: [rest-api, workflow, graph, nodes, edges, cascade-deletion, spring-boot, kotlin]

dependency-graph:
  requires:
    - Existing workflow node/edge entity infrastructure (WorkflowNodeEntity, WorkflowEdgeEntity)
    - Repository layer (WorkflowNodeRepository, WorkflowEdgeRepository)
    - WorkflowDefinitionService from Plan 01
  provides:
    - REST API for workflow graph structure management (nodes and edges)
    - WorkflowGraphService business logic with cascade deletion
    - Request models for node/edge creation and update
    - WorkflowGraph model for complete DAG representation
  affects:
    - 06-03 (workflow canvas endpoints will use graph structure)
    - Future workflow execution (uses graph topology for DAG execution)

tech-stack:
  added: []
  patterns:
    - Cascade deletion for graph consistency
    - Immutable versioning for node config changes (copy-on-write)
    - Soft-delete pattern for nodes and edges
    - Activity logging for audit trail

key-files:
  created:
    - src/main/kotlin/riven/core/service/workflow/WorkflowGraphService.kt
    - src/main/kotlin/riven/core/controller/workflow/WorkflowGraphController.kt
    - src/main/kotlin/riven/core/models/request/workflow/CreateWorkflowNodeRequest.kt
    - src/main/kotlin/riven/core/models/request/workflow/UpdateWorkflowNodeRequest.kt
    - src/main/kotlin/riven/core/models/request/workflow/CreateWorkflowEdgeRequest.kt
    - src/main/kotlin/riven/core/models/workflow/WorkflowGraph.kt
    - src/test/kotlin/riven/core/service/workflow/WorkflowGraphServiceTest.kt
  modified:
    - src/main/kotlin/riven/core/enums/core/ApplicationEntityType.kt (added WORKFLOW_NODE, WORKFLOW_EDGE)
    - src/main/kotlin/riven/core/enums/activity/Activity.kt (added WORKFLOW_NODE, WORKFLOW_EDGE)
    - src/main/kotlin/riven/core/repository/workflow/WorkflowNodeRepository.kt (added findByWorkspaceIdAndId)
    - src/main/kotlin/riven/core/repository/workflow/WorkflowEdgeRepository.kt (added findByWorkspaceIdAndNodeId)

decisions:
  - decision: "Cascade deletion on node delete"
    rationale: "Deleting a node must delete all connected edges to maintain graph consistency and prevent orphaned edges"
    affects: ["deleteNode implementation", "activity logging for cascaded edges"]
  - decision: "Immutable versioning for config changes"
    rationale: "Config changes create new entity version (copy-on-write), metadata changes update in place"
    affects: ["updateNode implementation", "sourceId tracking for version history"]
  - decision: "Entity version vs config version"
    rationale: "Entity version tracks node revisions (incremented on config change), config version is schema version (from config object)"
    affects: ["WorkflowNode.version property delegates to config.version"]

metrics:
  duration: "8m 11s"
  completed: "2026-01-20"
---

# Phase 6 Plan 2: Workflow Graph Endpoints Summary

REST API implementation for workflow graph structure management with nodes, edges, cascade deletion, and complete graph retrieval.

## What Was Built

### WorkflowGraphService (396 lines)
Business logic layer providing 6 methods:

**Node Operations:**
- `createNode()` - Creates workflow node with version=1, system=false
- `updateNode()` - Updates metadata in place OR creates new version for config changes
- `deleteNode()` - Soft-deletes node with CASCADE deletion of all connected edges

**Edge Operations:**
- `createEdge()` - Creates edge with validation that source/target nodes exist
- `deleteEdge()` - Soft-deletes edge

**Graph Query:**
- `getWorkflowGraph()` - Returns complete graph (nodes + edges) for workflow definition

Key patterns followed:
- Constructor injection (no @Autowired)
- @Transactional for write operations
- @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)") for access control
- Activity logging for all operations (including cascaded edge deletions)
- Soft-delete pattern (deleted=true, deletedAt=timestamp)

### WorkflowGraphController (238 lines)
REST endpoints:

**Node Endpoints:**
- `POST /api/v1/workflow/graph/nodes/workspace/{workspaceId}` - Create node (201 Created)
- `PUT /api/v1/workflow/graph/nodes/{id}?workspaceId={}` - Update node (200 OK)
- `DELETE /api/v1/workflow/graph/nodes/{id}?workspaceId={}` - Delete node with cascade (204 No Content)

**Edge Endpoints:**
- `POST /api/v1/workflow/graph/edges/workspace/{workspaceId}` - Create edge (201 Created)
- `DELETE /api/v1/workflow/graph/edges/{id}?workspaceId={}` - Delete edge (204 No Content)

**Graph Query:**
- `GET /api/v1/workflow/graph/workflow/{workflowDefinitionId}?workspaceId={}` - Get complete graph (200 OK)

OpenAPI documentation with @Tag("Workflow Graph Management") and @Operation annotations.

### Request Models
- `CreateWorkflowNodeRequest` - key, name, description, config (polymorphic)
- `UpdateWorkflowNodeRequest` - name?, description?, config? (all optional)
- `CreateWorkflowEdgeRequest` - sourceNodeId, targetNodeId, label?

### WorkflowGraph Model
```kotlin
data class WorkflowGraph(
    val workflowDefinitionId: UUID,
    val nodes: List<WorkflowNode>,
    val edges: List<WorkflowEdge>
)
```

### Repository Enhancements
- Added `findByWorkspaceIdAndId()` to WorkflowNodeRepository
- Added `findByWorkspaceIdAndNodeId()` to WorkflowEdgeRepository (for cascade deletion)

### Enum Extensions
- Added `WORKFLOW_NODE` and `WORKFLOW_EDGE` to ApplicationEntityType
- Added `WORKFLOW_NODE` and `WORKFLOW_EDGE` to Activity enum

### Unit Tests (15 test cases)
1. createNode_success_createsNodeWithVersion1
2. updateNode_metadataOnly_updatesInPlace
3. updateNode_configChange_createsNewVersion
4. updateNode_notFound_throwsNotFoundException
5. **deleteNode_withEdges_cascadesDelete** (CRITICAL - verifies cascade)
6. deleteNode_noEdges_deletesOnlyNode
7. createEdge_success_validatesNodesExist
8. createEdge_sourceNotFound_throwsNotFoundException
9. createEdge_targetNotFound_throwsNotFoundException
10. deleteEdge_success_softDeletes
11. deleteEdge_wrongWorkspace_throwsAccessDeniedException
12. getWorkflowGraph_success_returnsNodesAndEdges
13. getWorkflowGraph_emptyWorkflow_returnsEmptyGraph
14. getWorkflowGraph_notFound_throwsNotFoundException
15. getWorkflowGraph_wrongWorkspace_throwsAccessDeniedException

## Decisions Made

1. **Cascade deletion for graph consistency**: When a node is deleted, all connected edges (both incoming and outgoing) are automatically soft-deleted. This prevents orphaned edges and maintains DAG integrity.

2. **Immutable versioning for config changes**: Following the BlockType pattern, config changes create a new entity version (id=null, version++, sourceId=original.id). Metadata-only changes (name, description) update in place.

3. **Entity version vs config version distinction**: The `WorkflowNodeEntity.version` field tracks entity revisions (for copy-on-write). The `WorkflowNode.version` property (delegated from config) is the schema version.

4. **Soft-delete across all operations**: Both nodes and edges use soft-delete (deleted=true, deletedAt=timestamp) for recoverability.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] WorkflowGraphService implements 6 methods (createNode, updateNode, deleteNode, createEdge, deleteEdge, getWorkflowGraph)
- [x] Service has 396 lines (requirement: min 200)
- [x] Cascade deletion implemented and tested
- [x] Request models created (CreateWorkflowNodeRequest, UpdateWorkflowNodeRequest, CreateWorkflowEdgeRequest)
- [x] WorkflowGraph model created
- [x] WorkflowGraphController exposes 6 REST endpoints
- [x] Integration tests: 15 test cases, all passing
- [x] ./gradlew build -x test succeeds
- [x] OpenAPI documentation includes "Workflow Graph Management" tag

## Next Phase Readiness

Ready for Plan 03 (Workflow Canvas Endpoints):
- Graph structure APIs complete
- Service patterns established
- Repository methods for graph queries available
- Test patterns documented

No blockers identified.
