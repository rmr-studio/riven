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
import riven.core.models.request.workflow.CreateWorkflowDefinitionRequest
import riven.core.models.request.workflow.UpdateWorkflowDefinitionRequest
import riven.core.models.workflow.WorkflowDefinition
import riven.core.service.workflow.WorkflowDefinitionService
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * REST controller for workflow definition management.
 *
 * Provides CRUD endpoints for workflow definitions:
 * - Create new workflow definitions
 * - Retrieve workflow definitions by ID
 * - List workflow definitions for a workspace
 * - Update workflow definition metadata
 * - Delete (soft-delete) workflow definitions
 *
 * Security: All endpoints require authentication and workspace access validation.
 */
@RestController
@RequestMapping("/api/v1/workflow/definitions")
@Tag(name = "workflow", description = "Workflow Definition and Metadata Management Endpoints")
@PreAuthorize("isAuthenticated()")
class WorkflowDefinitionController(
    private val workflowDefinitionService: WorkflowDefinitionService
) {

    /**
     * Create a new workflow definition.
     *
     * @param workspaceId The workspace to create the workflow in
     * @param request The creation request containing name, description, icon, and tags
     * @return The created workflow definition with HTTP 201 Created
     */
    @PostMapping("/workspace/{workspaceId}")
    @Operation(
        summary = "Create a new workflow definition",
        description = "Creates a new workflow definition with an initial empty version in the specified workspace."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Workflow definition created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    )
    fun createWorkflow(
        @PathVariable workspaceId: UUID,
        @RequestBody request: CreateWorkflowDefinitionRequest
    ): ResponseEntity<WorkflowDefinition> {
        log.info { "POST /api/v1/workflow/definitions/workspace/$workspaceId - name: ${request.name}" }

        val workflow = workflowDefinitionService.createWorkflow(workspaceId, request)

        return ResponseEntity.status(HttpStatus.CREATED).body(workflow)
    }

    /**
     * Get a workflow definition by ID.
     *
     * @param id The workflow definition ID
     * @param workspaceId The workspace ID for access verification
     * @return The workflow definition
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get workflow definition by ID",
        description = "Retrieves a workflow definition by its ID. Requires workspace access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Workflow definition retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        ApiResponse(responseCode = "404", description = "Workflow definition not found")
    )
    fun getWorkflow(
        @PathVariable id: UUID,
        @RequestParam workspaceId: UUID
    ): ResponseEntity<WorkflowDefinition> {
        log.info { "GET /api/v1/workflow/definitions/$id?workspaceId=$workspaceId" }

        val workflow = workflowDefinitionService.getWorkflowById(id, workspaceId)

        return ResponseEntity.ok(workflow)
    }

    /**
     * List all workflow definitions for a workspace.
     *
     * @param workspaceId The workspace ID
     * @return List of workflow definitions in the workspace
     */
    @GetMapping("/workspace/{workspaceId}")
    @Operation(
        summary = "List all workflow definitions for workspace",
        description = "Retrieves all workflow definitions associated with the specified workspace."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Workflow definitions retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    )
    fun listWorkflows(
        @PathVariable workspaceId: UUID
    ): ResponseEntity<List<WorkflowDefinition>> {
        log.info { "GET /api/v1/workflow/definitions/workspace/$workspaceId" }

        val workflows = workflowDefinitionService.listWorkflowsForWorkspace(workspaceId)

        return ResponseEntity.ok(workflows)
    }

    /**
     * Update workflow definition metadata.
     *
     * Updates only the provided fields (name, description, icon, tags).
     * Does NOT update workflow/canvas structure.
     *
     * @param id The workflow definition ID
     * @param workspaceId The workspace ID for access verification
     * @param request The update request with optional fields
     * @return The updated workflow definition
     */
    @PutMapping("/{id}")
    @Operation(
        summary = "Update workflow definition metadata",
        description = "Updates workflow definition metadata (name, description, icon, tags). Does not modify workflow structure."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Workflow definition updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        ApiResponse(responseCode = "404", description = "Workflow definition not found")
    )
    fun updateWorkflow(
        @PathVariable id: UUID,
        @RequestParam workspaceId: UUID,
        @RequestBody request: UpdateWorkflowDefinitionRequest
    ): ResponseEntity<WorkflowDefinition> {
        log.info { "PUT /api/v1/workflow/definitions/$id?workspaceId=$workspaceId" }

        val workflow = workflowDefinitionService.updateWorkflow(id, workspaceId, request)

        return ResponseEntity.ok(workflow)
    }

    /**
     * Delete a workflow definition.
     *
     * Performs a soft delete - sets deleted=true and deletedAt=now.
     *
     * @param id The workflow definition ID
     * @param workspaceId The workspace ID for access verification
     * @return HTTP 204 No Content on success
     */
    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete workflow definition",
        description = "Soft-deletes a workflow definition. The definition can be restored if needed."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Workflow definition deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
        ApiResponse(responseCode = "404", description = "Workflow definition not found")
    )
    fun deleteWorkflow(
        @PathVariable id: UUID,
        @RequestParam workspaceId: UUID
    ): ResponseEntity<Void> {
        log.info { "DELETE /api/v1/workflow/definitions/$id?workspaceId=$workspaceId" }

        workflowDefinitionService.deleteWorkflow(id, workspaceId)

        return ResponseEntity.noContent().build()
    }
}
