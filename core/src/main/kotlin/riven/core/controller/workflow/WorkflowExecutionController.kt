package riven.core.controller.workflow

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import riven.core.models.request.workflow.StartWorkflowExecutionRequest
import riven.core.service.workflow.WorkflowExecutionService

private val log = KotlinLogging.logger {}

/**
 * REST controller for workflow execution operations.
 *
 * Provides endpoints for:
 * - Starting workflow executions
 * - Querying execution status (future)
 * - Listing executions (future)
 *
 * Security: All endpoints require authentication and workspace access validation.
 */
@RestController
@RequestMapping("/api/v1/workflow/executions")
class WorkflowExecutionController(
    private val workflowExecutionService: WorkflowExecutionService
) {

    /**
     * Start a workflow execution.
     *
     * Triggers a Temporal workflow execution for the specified workflow definition.
     * The workflow runs asynchronously - this endpoint returns immediately with
     * execution details.
     *
     * @param request Start execution request (workflowDefinitionId, workspaceId)
     * @return Execution response with executionId, workflowId, status
     */
    @PostMapping("/start")
    @PreAuthorize("isAuthenticated()")
    fun startExecution(
        @RequestBody request: StartWorkflowExecutionRequest
    ): ResponseEntity<Map<String, Any>> {
        log.info { "POST /api/v1/workflow/executions/start - workflowDefinitionId: ${request.workflowDefinitionId}, workspaceId: ${request.workspaceId}" }

        val response = workflowExecutionService.startExecution(request)

        return ResponseEntity.ok(response)
    }
}
