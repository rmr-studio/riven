package riven.core.controller.workflow

import io.github.oshai.kotlinlogging.KotlinLogging
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import riven.core.models.request.workflow.CreateWorkflowEdgeRequest
import riven.core.models.request.workflow.CreateWorkflowNodeRequest
import riven.core.models.request.workflow.UpdateWorkflowNodeRequest
import riven.core.models.workflow.WorkflowEdge
import riven.core.models.workflow.WorkflowGraph
import riven.core.models.workflow.node.WorkflowNode
import riven.core.service.workflow.WorkflowGraphService
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * REST controller for workflow graph structure management.
 *
 * Provides CRUD endpoints for workflow nodes and edges:
 * - Create, update, delete workflow nodes
 * - Create, delete workflow edges
 * - Retrieve complete workflow graphs
 *
 * Note: Node deletion cascades to delete all connected edges,
 * maintaining graph consistency.
 *
 * Security: All endpoints require authentication and workspace access validation.
 */
@RestController
@RequestMapping("/api/v1/workflow/graph")
@Tag(
    name = "Workflow Graph Management",
    description = "Endpoints for managing workflow graph structure (nodes and edges)"
)
@PreAuthorize("isAuthenticated()")
class WorkflowGraphController(
    private val workflowGraphService: WorkflowGraphService
) {

    // ------------------------------------------------------------------
    // Node Endpoints
    // ------------------------------------------------------------------

    /**
     * Create a new workflow node.
     *
     * @param workspaceId The workspace to create the node in
     * @param request The creation request containing key, name, description, and config
     * @return The created workflow node with HTTP 201 Created
     */
    @PostMapping("/nodes/workspace/{workspaceId}")
    @Operation(
        summary = "Create a new workflow node",
        description = "Creates a new workflow node with the specified configuration in the workspace."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Workflow node created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    )
    fun createNode(
        @PathVariable workspaceId: UUID,
        @RequestBody request: CreateWorkflowNodeRequest
    ): ResponseEntity<WorkflowNode> {
        log.info { "POST /api/v1/workflow/graph/nodes/workspace/$workspaceId - name: ${request.name}" }

        val node = workflowGraphService.createNode(workspaceId, request)

        return ResponseEntity.status(HttpStatus.CREATED).body(node)
    }

    /**
     * Update a workflow node.
     *
     * Metadata updates (name, description) are applied in place.
     * Config updates trigger creation of a new version (immutable pattern).
     *
     * @param id The node ID to update
     * @param workspaceId The workspace ID for access verification
     * @param request The update request with optional fields
     * @return The updated workflow node
     */
    @PutMapping("/nodes/{id}")
    @Operation(
        summary = "Update workflow node",
        description = "Updates workflow node metadata or configuration. Config changes create a new version."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Workflow node updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        ApiResponse(responseCode = "404", description = "Workflow node not found")
    )
    fun updateNode(
        @PathVariable id: UUID,
        @RequestParam workspaceId: UUID,
        @RequestBody request: UpdateWorkflowNodeRequest
    ): ResponseEntity<WorkflowNode> {
        log.info { "PUT /api/v1/workflow/graph/nodes/$id?workspaceId=$workspaceId" }

        val node = workflowGraphService.updateNode(id, workspaceId, request)

        return ResponseEntity.ok(node)
    }

    /**
     * Delete a workflow node.
     *
     * WARNING: This operation cascades to delete all connected edges,
     * ensuring no orphaned edges remain in the graph.
     *
     * @param id The node ID to delete
     * @param workspaceId The workspace ID for access verification
     * @return HTTP 204 No Content on success
     */
    @DeleteMapping("/nodes/{id}")
    @Operation(
        summary = "Delete workflow node (cascades to connected edges)",
        description = "Soft-deletes a workflow node and all edges connected to it. This maintains graph consistency."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Workflow node and connected edges deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        ApiResponse(responseCode = "404", description = "Workflow node not found")
    )
    fun deleteNode(
        @PathVariable id: UUID,
        @RequestParam workspaceId: UUID
    ): ResponseEntity<Void> {
        log.info { "DELETE /api/v1/workflow/graph/nodes/$id?workspaceId=$workspaceId" }

        workflowGraphService.deleteNode(id, workspaceId)

        return ResponseEntity.noContent().build()
    }

    // ------------------------------------------------------------------
    // Edge Endpoints
    // ------------------------------------------------------------------

    /**
     * Create a new workflow edge.
     *
     * @param workspaceId The workspace to create the edge in
     * @param request The creation request containing source/target node IDs and optional label
     * @return The created workflow edge with HTTP 201 Created
     */
    @PostMapping("/edges/workspace/{workspaceId}")
    @Operation(
        summary = "Create a new workflow edge",
        description = "Creates a new edge connecting two workflow nodes in the workspace."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Workflow edge created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data or nodes not found"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    )
    fun createEdge(
        @PathVariable workspaceId: UUID,
        @RequestBody request: CreateWorkflowEdgeRequest
    ): ResponseEntity<WorkflowEdge> {
        log.info { "POST /api/v1/workflow/graph/edges/workspace/$workspaceId - source: ${request.sourceNodeId}, target: ${request.targetNodeId}" }

        val edge = workflowGraphService.createEdge(workspaceId, request)

        return ResponseEntity.status(HttpStatus.CREATED).body(edge)
    }

    /**
     * Delete a workflow edge.
     *
     * @param id The edge ID to delete
     * @param workspaceId The workspace ID for access verification
     * @return HTTP 204 No Content on success
     */
    @DeleteMapping("/edges/{id}")
    @Operation(
        summary = "Delete workflow edge",
        description = "Soft-deletes a workflow edge. Does not affect connected nodes."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Workflow edge deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        ApiResponse(responseCode = "404", description = "Workflow edge not found")
    )
    fun deleteEdge(
        @PathVariable id: UUID,
        @RequestParam workspaceId: UUID
    ): ResponseEntity<Void> {
        log.info { "DELETE /api/v1/workflow/graph/edges/$id?workspaceId=$workspaceId" }

        workflowGraphService.deleteEdge(id, workspaceId)

        return ResponseEntity.noContent().build()
    }

    // ------------------------------------------------------------------
    // Graph Query Endpoints
    // ------------------------------------------------------------------

    /**
     * Get the complete workflow graph.
     *
     * Returns all nodes and edges for a workflow definition,
     * providing the full DAG structure for visualization or processing.
     *
     * @param workflowDefinitionId The workflow definition ID
     * @param workspaceId The workspace ID for access verification
     * @return The complete workflow graph with nodes and edges
     */
    @GetMapping("/workflow/{workflowDefinitionId}")
    @Operation(
        summary = "Get complete workflow graph (nodes and edges)",
        description = "Returns the complete DAG structure with all nodes and edges for the workflow definition."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Workflow graph retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        ApiResponse(responseCode = "404", description = "Workflow definition not found")
    )
    fun getWorkflowGraph(
        @PathVariable workflowDefinitionId: UUID,
        @RequestParam workspaceId: UUID
    ): ResponseEntity<WorkflowGraph> {
        log.info { "GET /api/v1/workflow/graph/workflow/$workflowDefinitionId?workspaceId=$workspaceId" }

        val graph = workflowGraphService.getWorkflowGraph(workflowDefinitionId, workspaceId)

        return ResponseEntity.ok(graph)
    }
}
