package riven.core.service.workflow.temporal.activities

import io.github.oshai.kotlinlogging.KotlinLogging
import io.temporal.activity.Activity
import org.springframework.stereotype.Component
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.enums.workflow.WorkflowStatus
import riven.core.entity.workflow.execution.WorkflowExecutionNodeEntity
import riven.core.models.workflow.WorkflowActionNode
import riven.core.models.workflow.temporal.NodeExecutionResult
import riven.core.repository.workflow.WorkflowExecutionNodeRepository
import riven.core.repository.workflow.WorkflowNodeRepository
import riven.core.service.entity.EntityService
import riven.core.service.workflow.EntityContextService
import riven.core.service.workflow.ExpressionEvaluatorService
import java.time.ZonedDateTime
import java.util.UUID

private val log = KotlinLogging.logger {}

/**
 * Implementation of WorkflowNodeActivities as a Spring bean.
 *
 * This activity implementation:
 * - Uses constructor injection for all dependencies (Spring beans)
 * - Is stateless (singleton instance handles concurrent executions)
 * - Routes node execution based on type (ACTION, CONTROL, TRIGGER)
 * - Persists execution state to PostgreSQL
 * - Handles errors and retries automatically (via Temporal RetryOptions)
 *
 * Node type handling (v1 - focus on ACTION):
 * - ACTION: Creates/updates entities via EntityService
 * - CONTROL: Evaluates expressions via ExpressionEvaluatorService (stubbed for v1)
 * - TRIGGER: Stub (not implemented in v1)
 *
 * @property workflowNodeRepository Fetches node configuration from database
 * @property workflowExecutionNodeRepository Persists node execution state
 * @property entityService Handles entity CRUD operations for ACTION nodes
 * @property expressionEvaluatorService Evaluates expressions for CONTROL nodes
 * @property entityContextService Resolves entity context for expression evaluation
 */
@Component
class WorkflowNodeActivitiesImpl(
    private val workflowNodeRepository: WorkflowNodeRepository,
    private val workflowExecutionNodeRepository: WorkflowExecutionNodeRepository,
    private val entityService: EntityService,
    private val expressionEvaluatorService: ExpressionEvaluatorService,
    private val entityContextService: EntityContextService
) : WorkflowNodeActivities {

    override fun executeNode(nodeId: UUID, workspaceId: UUID): NodeExecutionResult {
        val startTime = ZonedDateTime.now()

        log.info { "Executing workflow node: $nodeId in workspace: $workspaceId" }

        try {
            // Fetch node configuration
            val node = workflowNodeRepository.findById(nodeId).orElseThrow {
                IllegalArgumentException("Workflow node not found: $nodeId")
            }

            // Verify workspace access
            if (node.workspaceId != workspaceId) {
                throw SecurityException("Node $nodeId does not belong to workspace $workspaceId")
            }

            // Get execution context from Temporal
            val activityInfo = Activity.getExecutionContext().info
            val workflowExecutionId = UUID.fromString(
                activityInfo.workflowId.substringAfter("execution-")
            )

            // Create execution record (RUNNING status)
            val executionNode = createExecutionNode(
                workflowExecutionId = workflowExecutionId,
                nodeId = nodeId,
                workspaceId = workspaceId,
                startTime = startTime
            )

            // Route based on node type
            val result = when (node.type) {
                WorkflowNodeType.ACTION -> {
                    log.info { "Executing ACTION node: ${node.name}" }
                    executeActionNode(node.config, workspaceId, nodeId)
                }
                WorkflowNodeType.CONTROL_FLOW -> {
                    log.info { "Executing CONTROL_FLOW node: ${node.name}" }
                    executeControlNode(node.config, workspaceId)
                }
                WorkflowNodeType.TRIGGER -> {
                    log.info { "Skipping TRIGGER node: ${node.name} (triggers don't execute during workflow)" }
                    NodeExecutionResult(
                        nodeId = nodeId,
                        status = "SKIPPED",
                        output = mapOf("reason" to "Triggers are entry points, not executed during workflow")
                    )
                }
                WorkflowNodeType.FUNCTION,
                WorkflowNodeType.HUMAN_INTERACTION,
                WorkflowNodeType.UTILITY -> {
                    log.info { "Skipping ${node.type} node: ${node.name} (not implemented in v1)" }
                    NodeExecutionResult(
                        nodeId = nodeId,
                        status = "SKIPPED",
                        output = mapOf("reason" to "${node.type} nodes not implemented in v1")
                    )
                }
            }

            // Update execution record (COMPLETED/FAILED status)
            updateExecutionNode(
                executionNode = executionNode,
                status = if (result.status == "COMPLETED") WorkflowStatus.COMPLETED else WorkflowStatus.FAILED,
                output = result.output,
                error = result.error,
                completedTime = ZonedDateTime.now(),
                startTime = startTime
            )

            log.info { "Node $nodeId completed with status: ${result.status}" }
            return result

        } catch (e: Exception) {
            log.error(e) { "Error executing node $nodeId: ${e.message}" }

            // Try to persist error state (best effort)
            try {
                val activityInfo = Activity.getExecutionContext().info
                val workflowExecutionId = UUID.fromString(
                    activityInfo.workflowId.substringAfter("execution-")
                )

                val executionNode = createExecutionNode(
                    workflowExecutionId = workflowExecutionId,
                    nodeId = nodeId,
                    workspaceId = workspaceId,
                    startTime = startTime
                )

                updateExecutionNode(
                    executionNode = executionNode,
                    status = WorkflowStatus.FAILED,
                    output = null,
                    error = e.message,
                    completedTime = ZonedDateTime.now(),
                    startTime = startTime
                )
            } catch (persistError: Exception) {
                log.error(persistError) { "Failed to persist error state for node $nodeId" }
            }

            return NodeExecutionResult(
                nodeId = nodeId,
                status = "FAILED",
                error = e.message ?: "Unknown error"
            )
        }
    }

    /**
     * Execute an ACTION node based on its subType.
     *
     * This method routes action execution to specific handlers based on WorkflowActionType.
     *
     * ## How to add a new action type:
     *
     * 1. Add your action type to WorkflowActionType enum (e.g., SEND_SLACK_MESSAGE)
     * 2. Add a case to the when statement below
     * 3. Call executeAction { ... } with your implementation logic
     * 4. Return a map with the action's output data
     *
     * Example for SEND_SLACK_MESSAGE:
     * ```kotlin
     * WorkflowActionType.SEND_SLACK_MESSAGE -> executeAction(nodeId, "SEND_SLACK_MESSAGE") {
     *     val channel = extractConfigField(config, "channel") as String
     *     val message = extractConfigField(config, "message") as String
     *     val messageId = slackClient.sendMessage(channel, message)
     *     mapOf("messageId" to messageId, "timestamp" to System.currentTimeMillis())
     * }
     * ```
     *
     * ## Input/Output Contract:
     * - Input: config contains action-specific parameters (parsed via extractConfigField)
     * - Output: Map<String, Any?> with action-specific results
     * - Errors: Automatically caught and converted to FAILED status by executeAction()
     *
     * @param config Action configuration (should contain WorkflowActionNode)
     * @param workspaceId Workspace context for security
     * @param nodeId Node identifier for result tracking
     * @return NodeExecutionResult with status, output, or error
     */
    private fun executeActionNode(config: Any, workspaceId: UUID, nodeId: UUID): NodeExecutionResult {
        // Cast config to WorkflowActionNode to access subType
        val actionNode = config as? WorkflowActionNode
            ?: return NodeExecutionResult(
                nodeId = nodeId,
                status = "FAILED",
                error = "Invalid action configuration: expected WorkflowActionNode"
            )

        log.info { "Executing ACTION node: ${actionNode.subType}" }

        // Route to specific action executor based on subType
        return when (actionNode.subType) {
            riven.core.enums.workflow.WorkflowActionType.CREATE_ENTITY -> executeAction(nodeId, "CREATE_ENTITY") {
                // Parse inputs from config
                val entityTypeId = extractConfigField(config, "entityTypeId") as String
                val payload = extractConfigField(config, "payload") as Map<*, *>

                // Execute business logic
                val entityTypeUuid = UUID.fromString(entityTypeId)

                // Convert payload to proper format for saveEntity
                // For now, we'll use a simplified approach - the full implementation
                // would properly map the workflow config to SaveEntityRequest
                val saveRequest = riven.core.models.request.entity.SaveEntityRequest(
                    id = null, // New entity
                    payload = emptyMap(), // TODO: Map payload properly in follow-up
                    icon = null
                )

                val result = entityService.saveEntity(workspaceId, entityTypeUuid, saveRequest)

                // Return output
                mapOf(
                    "entityId" to result.entity?.id,
                    "entityTypeId" to result.entity?.typeId,
                    "payload" to result.entity?.payload
                )
            }

            riven.core.enums.workflow.WorkflowActionType.UPDATE_ENTITY -> executeAction(nodeId, "UPDATE_ENTITY") {
                // Parse inputs
                val entityId = UUID.fromString(extractConfigField(config, "entityId") as String)
                val payload = extractConfigField(config, "payload") as Map<*, *>

                // Get existing entity to determine type
                val existingEntity = entityService.getEntity(entityId)

                // Convert payload to proper format
                val saveRequest = riven.core.models.request.entity.SaveEntityRequest(
                    id = entityId,
                    payload = emptyMap(), // TODO: Map payload properly in follow-up
                    icon = null
                )

                val result = entityService.saveEntity(workspaceId, existingEntity.typeId, saveRequest)

                // Return output
                mapOf(
                    "entityId" to result.entity?.id,
                    "updated" to true,
                    "payload" to result.entity?.payload
                )
            }

            else -> NodeExecutionResult(
                nodeId = nodeId,
                status = "FAILED",
                error = "Action type ${actionNode.subType} not yet implemented"
            )
        }
    }

    /**
     * Executes an action with standardized error handling and result building.
     *
     * This is the core pattern for all action executors. It provides:
     * - Consistent error handling across all action types
     * - Automatic conversion of exceptions to FAILED status
     * - Clear separation between business logic and error handling
     *
     * The execution lambda should:
     * 1. Parse configuration inputs
     * 2. Execute the action's business logic
     * 3. Return a map of output data
     *
     * Example usage:
     * ```kotlin
     * executeAction(nodeId, "SEND_EMAIL") {
     *     val to = extractConfigField(config, "to") as String
     *     val subject = extractConfigField(config, "subject") as String
     *     val messageId = emailService.send(to, subject)
     *     mapOf("messageId" to messageId, "sentAt" to Instant.now())
     * }
     * ```
     *
     * @param nodeId Node identifier for tracking
     * @param actionName Human-readable action name for logging
     * @param execution Lambda that performs the action and returns output data
     * @return NodeExecutionResult with COMPLETED or FAILED status
     */
    private fun executeAction(
        nodeId: UUID,
        actionName: String,
        execution: () -> Map<String, Any?>
    ): NodeExecutionResult {
        return try {
            log.info { "Executing action: $actionName" }
            val startTime = System.currentTimeMillis()

            val output = execution()

            val duration = System.currentTimeMillis() - startTime
            log.info { "Action $actionName completed successfully in ${duration}ms" }

            NodeExecutionResult(
                nodeId = nodeId,
                status = "COMPLETED",
                output = output
            )
        } catch (e: Exception) {
            log.error(e) { "Action $actionName failed: ${e.message}" }
            NodeExecutionResult(
                nodeId = nodeId,
                status = "FAILED",
                error = e.message ?: "Unknown error in $actionName"
            )
        }
    }

    /**
     * Safely extracts a field from action configuration.
     *
     * This helper method provides type-safe configuration parsing for action executors.
     * It handles common casting scenarios and provides clear error messages.
     *
     * @param config Action configuration object
     * @param fieldName Name of the field to extract
     * @return Field value (caller must cast to expected type)
     * @throws IllegalArgumentException if field is missing or invalid
     */
    private fun extractConfigField(config: Any, fieldName: String): Any {
        // TODO: Implement proper config parsing based on actual WorkflowActionNode structure
        // For now, this demonstrates the intended pattern
        // The actual implementation will depend on how WorkflowActionNode stores its config
        throw NotImplementedError("Config field extraction to be implemented based on WorkflowActionNode structure")
    }

    /**
     * Execute a CONTROL_FLOW node that evaluates conditional expressions.
     *
     * V1: Stub implementation - returns success without actual expression evaluation.
     * Future: Parse node config, evaluate expression, return boolean result
     */
    private fun executeControlNode(config: Any, workspaceId: UUID): NodeExecutionResult {
        log.info { "CONTROL node execution (v1 stub)" }

        // V1: Return stub success
        // Future implementation will:
        // 1. Parse config to extract expression
        // 2. Resolve entity context via entityContextService
        // 3. Call expressionEvaluatorService.evaluate(expression, context)
        // 4. Return boolean result as output

        return NodeExecutionResult(
            nodeId = UUID.randomUUID(), // Will be overridden
            status = "COMPLETED",
            output = mapOf(
                "message" to "CONTROL_FLOW node executed (v1 stub - expression evaluation not implemented)",
                "result" to true
            )
        )
    }

    /**
     * Create a WorkflowExecutionNodeEntity record with RUNNING status.
     */
    private fun createExecutionNode(
        workflowExecutionId: UUID,
        nodeId: UUID,
        workspaceId: UUID,
        startTime: ZonedDateTime
    ): WorkflowExecutionNodeEntity {
        val executionNode = WorkflowExecutionNodeEntity(
            workspaceId = workspaceId,
            workflowExecutionId = workflowExecutionId,
            nodeId = nodeId,
            sequenceIndex = 0, // TODO: Track actual sequence during workflow execution
            status = WorkflowStatus.RUNNING,
            startedAt = startTime,
            completedAt = null,
            durationMs = 0,
            attempt = 1, // Temporal handles retries, this is attempt within activity
            error = emptyMap<String, Any>(),
            input = null,
            output = null
        )

        return workflowExecutionNodeRepository.save(executionNode)
    }

    /**
     * Update WorkflowExecutionNodeEntity with completion status and results.
     */
    private fun updateExecutionNode(
        executionNode: WorkflowExecutionNodeEntity,
        status: WorkflowStatus,
        output: Any?,
        error: String?,
        completedTime: ZonedDateTime,
        startTime: ZonedDateTime
    ) {
        val durationMs = java.time.Duration.between(startTime, completedTime).toMillis()

        val updated = executionNode.copy(
            status = status,
            completedAt = completedTime,
            durationMs = durationMs,
            output = output,
            error = error?.let { mapOf("message" to it) } ?: emptyMap<String, Any>()
        )

        workflowExecutionNodeRepository.save(updated)
    }
}
