package riven.core.service.workflow.engine.coordinator

import io.github.oshai.kotlinlogging.KLogger
import io.temporal.activity.Activity
import io.temporal.failure.ApplicationFailure
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClientResponseException
import riven.core.entity.workflow.WorkflowEdgeEntity
import riven.core.entity.workflow.execution.WorkflowExecutionNodeEntity
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.enums.workflow.WorkflowStatus
import riven.core.models.workflow.engine.NodeExecutionResult
import riven.core.models.workflow.engine.coordinator.WorkflowState
import riven.core.models.workflow.engine.datastore.NodeOutput
import riven.core.models.workflow.engine.environment.NodeExecutionData
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.engine.error.NodeExecutionError
import riven.core.models.workflow.engine.error.RetryAttempt
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.WorkflowNode
import riven.core.models.workflow.node.config.actions.*
import riven.core.models.workflow.node.config.controls.WorkflowConditionControlConfig
import riven.core.repository.workflow.WorkflowExecutionNodeRepository
import riven.core.service.workflow.state.WorkflowNodeInputResolverService
import riven.core.service.workflow.engine.error.WorkflowErrorClassifier
import java.time.Instant
import java.time.ZonedDateTime
import java.util.*

/**
 * Service responsible for coordinating the execution of individual workflow nodes.
 * Should initialise the graph execution context, resolve inputs, invoke node logic, and capture outputs for a provided
 * sub-set of nodes and edges.
 *
 * 1. Initialize WorkflowExecutionContext with data registry
 * 2. Resolve input templates against registry
 * 3. Provide NodeServiceProvider for on-demand service access
 * 4. Call node.execute(context, inputs, services) - polymorphic dispatch
 * 5. Capture output to data registry
 * 6. Persist execution state to database
 *
 * ## Error Handling
 *
 * - executeAction() wrapper provides standardized error handling
 * - Exceptions caught and converted to FAILED status
 * - Failed executions stored in data registry for debugging
 * - Temporal RetryOptions handle retries automatically
 *
 * @property workflowExecutionNodeRepository Persists node execution state
 * @property nodeServiceProvider Provider for on-demand Spring service access in nodes
 * @property inputResolverService Resolves template references
 */

/**
 * Spring-managed activity implementation for workflow coordination.
 *
 * This service is a Spring bean and can inject other Spring services.
 * Temporal's Spring Boot starter will automatically register this as an activity.
 *
 * NOTE: The @ActivityInterface annotation belongs on the interface, not the implementation.
 */
@Service
class WorkflowCoordinationService(
    private val workflowExecutionNodeRepository: WorkflowExecutionNodeRepository,
    private val workflowNodeRepository: riven.core.repository.workflow.WorkflowNodeRepository,
    private val workflowEdgeRepository: riven.core.repository.workflow.WorkflowEdgeRepository,
    private val nodeServiceProvider: NodeServiceProvider,
    private val workflowNodeInputResolverService: WorkflowNodeInputResolverService,
    private val workflowGraphCoordinationService: WorkflowGraphCoordinationService,
    private val logger: KLogger
) : WorkflowCoordination {

    override fun executeWorkflowWithCoordinator(
        workflowDefinitionId: UUID,
        nodeIds: List<UUID>,
        workspaceId: UUID
    ): WorkflowState {
        logger.info { "Executing workflow with coordinator: definition=$workflowDefinitionId, nodes=${nodeIds.size}" }

        // Fetch nodes and edges from database (this is an activity, so database access is allowed)
        val nodes: List<WorkflowNode> =
            workflowNodeRepository.findByWorkspaceIdAndIdIn(workspaceId, nodeIds).map { it.toModel() }
        val edges: List<WorkflowEdgeEntity> =
            workflowEdgeRepository.findByWorkspaceIdAndNodeIds(workspaceId, nodeIds.toTypedArray())

        logger.info { "Fetched ${nodes.size} nodes and ${edges.size} edges from database" }

        // Get execution context from Temporal
        val activityInfo = Activity.getExecutionContext().info
        val workflowExecutionId = UUID.fromString(
            activityInfo.workflowId.substringAfter("execution-")
        )

        // Initialize workflow execution context
        WorkflowExecutionContext(
            workflowExecutionId = workflowExecutionId,
            workspaceId = workspaceId,
            metadata = emptyMap(),
            dataRegistry = mutableMapOf()
        )


        // Callback to execute a batch of ready nodes during workflow orchestration
        // Returns list of (nodeId, output) pairs
        val nodeExecutor: (List<WorkflowNode>) -> List<Pair<UUID, Any?>> = { readyNodes ->
            // Todo: Parallel execution is just glorified sequential execution for now
            // Can use Temporal child workflows for true parallel execution (ie. Workflow spawns in x child workflows and merges)

            logger.info { "Executing batch of ${readyNodes.size} ready nodes" }

            readyNodes.map { node ->
                logger.info { "Executing node ${node.id} (${node.type})" }

                // Execute node using existing executeNode logic
                val result = executeNode(node, workspaceId)

                // Check if node failed
                if (result.status == WorkflowStatus.FAILED) {
                    throw RuntimeException("Node ${node.id} failed: ${result.error}")
                }

                // Return nodeId -> output mapping
                node.id to result.output
            }
        }

        // Delegate to coordinator for DAG orchestration
        return try {
            val finalState = workflowGraphCoordinationService.executeWorkflow(nodes, edges, nodeExecutor)
            logger.info { "Workflow execution completed: ${finalState.phase}, ${finalState.completedNodes.size} nodes completed" }
            finalState
        } catch (e: Exception) {
            logger.error(e) { "Workflow execution failed: ${e.message}" }
            throw e
        }
    }

    private fun executeNode(node: WorkflowNode, workspaceId: UUID): NodeExecutionResult {
        val startTime = ZonedDateTime.now()
        val nodeId = node.id

        logger.info { "Executing workflow node: $nodeId in workspace: $workspaceId" }

        // Verify workspace access (before creating execution record)
        if (node.workspaceId != workspaceId) {
            throw SecurityException("Node $nodeId does not belong to workspace $workspaceId")
        }

        // Get execution context from Temporal (needed for execution record)
        val activityInfo = Activity.getExecutionContext().info
        val workflowExecutionId = UUID.fromString(
            activityInfo.workflowId.substringAfter("execution-")
        )

        // Create execution record BEFORE try block to ensure single record
        // This record is reused in both success and error paths
        val executionNode = createExecutionNode(
            workflowExecutionId = workflowExecutionId,
            nodeId = nodeId,
            workspaceId = workspaceId,
            startTime = startTime
        )

        try {
            // Initialize workflow execution context
            // TODO: Phase 5 DAG coordinator will populate registry with prior node outputs
            // and pass context between nodes for sequential execution
            val context = WorkflowExecutionContext(
                workflowExecutionId = workflowExecutionId,
                workspaceId = workspaceId,
                metadata = emptyMap(),
                dataRegistry = mutableMapOf()
            )

            logger.debug { "Initialized execution context for node $nodeId (registry: ${context.dataRegistry.size} entries)" }

            // Resolve inputs (templates → values)
            // Convert WorkflowNodeConfig properties to Map for resolution
            val configMap = when (val config = node.config) {
                is WorkflowCreateEntityActionConfig -> config.config
                is WorkflowUpdateEntityActionConfig -> config.config
                is WorkflowDeleteEntityActionConfig -> config.config
                is WorkflowQueryEntityActionConfig -> config.config
                // HTTP_REQUEST uses typed fields instead of config map
                is WorkflowHttpRequestActionConfig -> mapOf(
                    "url" to config.url,
                    "method" to config.method,
                    "headers" to config.headers,
                    "body" to config.body
                )
                // CONDITION uses typed fields instead of config map
                is WorkflowConditionControlConfig -> mapOf(
                    "expression" to config.expression,
                    "contextEntityId" to config.contextEntityId
                )
                //TODO: Add other node config types here and streamline mapping process
                else -> emptyMap()
            }

            val resolvedInputs = workflowNodeInputResolverService.resolveAll(
                configMap,
                context
            )

            // Polymorphic execution - no type switching!
            // Nodes implement their own execute() method via config
            // This enables easy addition of new node types (LOOP, SWITCH, PARALLEL, etc.)
            logger.info { "Executing ${node.type} node via polymorphic dispatch: ${node.name}" }
            val executionStart = System.currentTimeMillis()

            val result = executeAction(nodeId, node.name, node.type.name, context) {
                node.execute(context, resolvedInputs, nodeServiceProvider)
            }

            val duration = System.currentTimeMillis() - executionStart
            logger.info { "Node ${node.name} completed via execute() in ${duration}ms" }

            // Update execution record (COMPLETED/FAILED status)
            updateExecutionNode(
                executionNode = executionNode,
                status = if (result.status == WorkflowStatus.COMPLETED) WorkflowStatus.COMPLETED else WorkflowStatus.FAILED,
                output = result.output,
                error = result.error,
                completedTime = ZonedDateTime.now(),
                startTime = startTime
            )

            logger.info { "Node $nodeId completed with status: ${result.status}" }
            return result

        } catch (e: Exception) {
            // Get current attempt from Temporal activity context
            val attempt = Activity.getExecutionContext().info.attempt

            logger.error(e) { "Error executing node $nodeId (attempt $attempt): ${e.message}" }

            // Try to persist error state (best effort)
            // Reuse executionNode created before the try block to avoid duplicates
            try {
                // Classify error using utility
                val errorType = WorkflowErrorClassifier.classifyError(e, node.type)

                // Build retry attempt record
                val retryAttempt = RetryAttempt(
                    attemptNumber = attempt,
                    timestamp = ZonedDateTime.now(),
                    errorType = errorType,
                    errorMessage = e.message ?: "Unknown error",
                    durationMs = java.time.Duration.between(startTime, ZonedDateTime.now()).toMillis()
                )

                // Build structured error
                val errorDetails = NodeExecutionError(
                    errorType = errorType,
                    message = e.message ?: "Unknown error",
                    httpStatusCode = (e as? WebClientResponseException)?.statusCode?.value(),
                    retryAttempts = listOf(retryAttempt),
                    isFinal = !errorType.retryable || attempt >= 3,
                    stackTrace = e.stackTraceToString().take(10240)  // Truncate to 10KB
                )

                // Update existing execution node (created before try block)
                updateExecutionNodeWithError(
                    executionNode = executionNode,
                    error = errorDetails,
                    completedTime = ZonedDateTime.now(),
                    startTime = startTime
                )
            } catch (persistError: Exception) {
                logger.error(persistError) { "Failed to persist error state for node $nodeId" }
            }

            // Classify and throw ApplicationFailure for Temporal retry handling
            classifyAndThrowError(e, nodeId, node.name, node.type, attempt)
        }
    }

    /**
     * Invokes a Nodes execution:
     *
     * The execution lambda should:
     * 1. Parse configuration inputs
     * 2. Execute the node's business logic via node.execute()
     * 3. Return a map of output data
     *
     * Example usage (called by executeNode):
     * ```kotlin
     * executeAction(nodeId, nodeName, "ACTION", context) {
     *     node.execute(context, resolvedInputs, services)
     * }
     *
     * Handles storing outputted data in registry, or handles exceptions and stores failure info.
     * ```
     *
     * @param nodeId Node identifier for tracking
     * @param nodeName Node name for data registry key (e.g., "fetch_leads")
     * @param nodeType Human-readable node type for logging
     * @param context Workflow execution context containing data registry
     * @param execution Lambda that performs the action and returns output data
     * @return NodeExecutionResult with COMPLETED or FAILED status
     */
    private fun executeAction(
        nodeId: UUID,
        nodeName: String,
        nodeType: String,
        context: WorkflowExecutionContext,
        execution: () -> NodeOutput
    ): NodeExecutionResult {
        return try {
            logger.info { "Executing $nodeType: $nodeName" }

            // Record duration of execution
            val startTime = System.currentTimeMillis()
            val nodeOutput = execution()
            val duration = System.currentTimeMillis() - startTime
            logger.info { "Node $nodeName completed successfully in ${duration}ms" }

            // Convert NodeOutput to map for data registry (backward compatible)
            val outputMap = nodeOutput.toMap()

            // Capture output to data registry
            val executionData = NodeExecutionData(
                nodeId = nodeId,
                nodeName = nodeName,
                status = WorkflowStatus.COMPLETED,
                output = outputMap,
                error = null,
                executedAt = Instant.now()
            )
            context.dataRegistry[nodeName] = executionData

            logger.debug { "Captured output for node $nodeName: ${outputMap.keys}" }
            logger.info { "Data registry now contains ${context.dataRegistry.size} node outputs" }

            NodeExecutionResult(
                nodeId = nodeId,
                status = WorkflowStatus.COMPLETED,
                output = outputMap
            )
        } catch (e: Exception) {
            logger.error(e) { "$nodeType $nodeName failed: ${e.message}" }

            // Capture failure to data registry (for debugging)
            val executionData = NodeExecutionData(
                nodeId = nodeId,
                nodeName = nodeName,
                status = WorkflowStatus.FAILED,
                output = null,
                error = e.message ?: "Unknown error in $nodeType",
                executedAt = Instant.now()
            )
            context.dataRegistry[nodeName] = executionData

            logger.debug { "Captured failure for node $nodeName: ${e.message}" }
            logger.info { "Data registry now contains ${context.dataRegistry.size} node outputs" }

            NodeExecutionResult(
                nodeId = nodeId,
                status = WorkflowStatus.FAILED,
                error = e.message ?: "Unknown error in $nodeType"
            )
        }
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

    /**
     * Update WorkflowExecutionNodeEntity with structured error details.
     *
     * This method stores the full NodeExecutionError structure in the error column,
     * enabling rich error information including retry history and stack traces.
     */
    private fun updateExecutionNodeWithError(
        executionNode: WorkflowExecutionNodeEntity,
        error: NodeExecutionError,
        completedTime: ZonedDateTime,
        startTime: ZonedDateTime
    ) {
        val durationMs = java.time.Duration.between(startTime, completedTime).toMillis()

        val updated = executionNode.copy(
            status = WorkflowStatus.FAILED,
            completedAt = completedTime,
            durationMs = durationMs,
            output = null,
            error = error  // Now stores structured NodeExecutionError
        )

        workflowExecutionNodeRepository.save(updated)
    }

    /**
     * Classifies an exception and throws appropriate ApplicationFailure.
     *
     * Uses WorkflowErrorClassifier for classification logic.
     * Temporal uses the ApplicationFailure "type" parameter to match against doNotRetry list.
     *
     * @param e The exception that occurred
     * @param nodeId UUID of the failing node
     * @param nodeName Human-readable node name
     * @param nodeType Type of node (affects classification for CONTROL_FLOW)
     * @param attempt Current retry attempt number
     * @throws ApplicationFailure always (return type is Nothing)
     */
    private fun classifyAndThrowError(
        e: Exception,
        nodeId: UUID,
        nodeName: String,
        nodeType: WorkflowNodeType,
        attempt: Int
    ): Nothing {
        val (errorType, message) = WorkflowErrorClassifier.classifyErrorWithMessage(e, nodeType)

        logger.error(e) { "Node $nodeName failed (attempt $attempt): $message [${errorType.name}]" }

        // Throw ApplicationFailure with error type as the "type" parameter
        // Temporal uses this to match against doNotRetry list in WorkflowOrchestrationService
        if (errorType.retryable) {
            throw ApplicationFailure.newFailureWithCause(
                message,
                errorType.name,  // Must match doNotRetry strings
                e
            )
        } else {
            throw ApplicationFailure.newNonRetryableFailure(
                message,
                errorType.name
            )
        }
    }
}
