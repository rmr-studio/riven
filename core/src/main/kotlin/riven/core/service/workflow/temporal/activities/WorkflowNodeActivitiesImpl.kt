package riven.core.service.workflow.temporal.activities

import io.github.oshai.kotlinlogging.KLogger
import io.github.oshai.kotlinlogging.KotlinLogging
import io.temporal.activity.Activity
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import riven.core.enums.workflow.WorkflowStatus
import riven.core.entity.workflow.execution.WorkflowExecutionNodeEntity
import riven.core.models.workflow.NodeExecutionServices
import riven.core.models.workflow.environment.NodeExecutionData
import riven.core.models.workflow.environment.WorkflowExecutionContext
import riven.core.models.workflow.temporal.NodeExecutionResult
import riven.core.repository.workflow.WorkflowExecutionNodeRepository
import riven.core.repository.workflow.WorkflowNodeRepository
import riven.core.service.entity.EntityService
import riven.core.service.workflow.EntityContextService
import riven.core.service.workflow.ExpressionEvaluatorService
import riven.core.service.workflow.ExpressionParserService
import riven.core.service.workflow.InputResolverService
import java.time.Instant
import java.time.ZonedDateTime
import java.util.UUID

/**
 * Implementation of WorkflowNodeActivities as a Spring bean.
 *
 * ## Polymorphic Execution Architecture
 *
 * This activity implementation uses polymorphic dispatch to execute nodes:
 * - Nodes implement their own execute() method (strategy pattern)
 * - No type switching - polymorphism handles routing
 * - This enables easy addition of new node types (LOOP, SWITCH, PARALLEL, etc.)
 *
 * ## Execution Flow
 *
 * 1. Fetch node configuration from database
 * 2. Initialize WorkflowExecutionContext with data registry
 * 3. Resolve input templates against registry
 * 4. Prepare NodeExecutionServices (dependency injection for nodes)
 * 5. Call node.execute(context, inputs, services) - polymorphic dispatch
 * 6. Capture output to data registry
 * 7. Persist execution state to database
 *
 * ## Error Handling
 *
 * - executeAction() wrapper provides standardized error handling
 * - Exceptions caught and converted to FAILED status
 * - Failed executions stored in data registry for debugging
 * - Temporal RetryOptions handle retries automatically
 *
 * @property workflowNodeRepository Fetches node configuration from database
 * @property workflowExecutionNodeRepository Persists node execution state
 * @property entityService Handles entity CRUD operations (injected into nodes)
 * @property expressionEvaluatorService Evaluates expressions (injected into nodes)
 * @property entityContextService Resolves entity context (injected into nodes)
 * @property webClientBuilder HTTP client builder (injected into nodes)
 * @property inputResolverService Resolves template references
 */
@Component
class WorkflowNodeActivitiesImpl(
    private val workflowNodeRepository: WorkflowNodeRepository,
    private val workflowExecutionNodeRepository: WorkflowExecutionNodeRepository,
    private val entityService: EntityService,
    private val expressionEvaluatorService: ExpressionEvaluatorService,
    private val expressionParserService: ExpressionParserService,
    private val entityContextService: EntityContextService,
    private val webClientBuilder: WebClient.Builder,
    private val inputResolverService: InputResolverService,
    private val dagExecutionCoordinator: riven.core.service.workflow.coordinator.DagExecutionCoordinator,
    private val logger: KLogger
) : WorkflowNodeActivities {

    private val webClient: WebClient = webClientBuilder.build()

    override fun executeNode(nodeId: UUID, workspaceId: UUID): NodeExecutionResult {
        val startTime = ZonedDateTime.now()

        logger.info { "Executing workflow node: $nodeId in workspace: $workspaceId" }

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

            // Create execution record (RUNNING status)
            val executionNode = createExecutionNode(
                workflowExecutionId = workflowExecutionId,
                nodeId = nodeId,
                workspaceId = workspaceId,
                startTime = startTime
            )

            // Get the WorkflowNode from config (deserialized polymorphic type)
            val workflowNode = node.config as? riven.core.models.workflow.WorkflowNode
                ?: throw IllegalStateException("Node config is not a WorkflowNode: ${node.config::class.simpleName}")

            // Resolve inputs (templates → values)
            // Convert WorkflowNode properties to Map for resolution
            // For now, we'll use an empty map since concrete node classes hold their own config
            // Phase 4.2 will properly map node config to input map
            val configMap = when (workflowNode) {
                is riven.core.models.workflow.actions.CreateEntityActionNode -> workflowNode.config
                is riven.core.models.workflow.actions.UpdateEntityActionNode -> workflowNode.config
                is riven.core.models.workflow.actions.DeleteEntityActionNode -> workflowNode.config
                is riven.core.models.workflow.actions.QueryEntityActionNode -> workflowNode.config
                is riven.core.models.workflow.actions.HttpRequestActionNode -> workflowNode.config
                is riven.core.models.workflow.controls.ConditionControlNode -> workflowNode.config
                else -> emptyMap()
            }

            val resolvedInputs = inputResolverService.resolveAll(
                configMap,
                context
            )

            // Prepare services for node execution
            val services = NodeExecutionServices(
                entityService = entityService,
                webClient = webClient,
                expressionEvaluatorService = expressionEvaluatorService,
                expressionParserService = expressionParserService,
                entityContextService = entityContextService
            )

            // Polymorphic execution - no type switching!
            // Nodes implement their own execute() method
            // This enables easy addition of new node types (LOOP, SWITCH, PARALLEL, etc.)
            logger.info { "Executing ${node.type} node via polymorphic dispatch: ${node.name}" }
            val executionStart = System.currentTimeMillis()

            val result = executeAction(nodeId, node.name, node.type.name, context) {
                workflowNode.execute(context, resolvedInputs, services)
            }

            val duration = System.currentTimeMillis() - executionStart
            logger.info { "Node ${node.name} completed via execute() in ${duration}ms" }

            // Update execution record (COMPLETED/FAILED status)
            updateExecutionNode(
                executionNode = executionNode,
                status = if (result.status == "COMPLETED") WorkflowStatus.COMPLETED else WorkflowStatus.FAILED,
                output = result.output,
                error = result.error,
                completedTime = ZonedDateTime.now(),
                startTime = startTime
            )

            logger.info { "Node $nodeId completed with status: ${result.status}" }
            return result

        } catch (e: Exception) {
            logger.error(e) { "Error executing node $nodeId: ${e.message}" }

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
                logger.error(persistError) { "Failed to persist error state for node $nodeId" }
            }

            return NodeExecutionResult(
                nodeId = nodeId,
                status = "FAILED",
                error = e.message ?: "Unknown error"
            )
        }
    }

    /**
     * Executes a node with standardized error handling and result building.
     *
     * This is the core pattern for all node executors. It provides:
     * - Consistent error handling across all node types
     * - Automatic conversion of exceptions to FAILED status
     * - Clear separation between business logic and error handling
     * - Output capture to data registry for node-to-node data flow
     *
     * The execution lambda should:
     * 1. Parse configuration inputs (already resolved by InputResolverService)
     * 2. Execute the node's business logic via node.execute()
     * 3. Return a map of output data
     *
     * Example usage (called by executeNode):
     * ```kotlin
     * executeAction(nodeId, nodeName, "ACTION", context) {
     *     node.execute(context, resolvedInputs, services)
     * }
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
        execution: () -> Map<String, Any?>
    ): NodeExecutionResult {
        return try {
            logger.info { "Executing $nodeType: $nodeName" }
            val startTime = System.currentTimeMillis()

            val output = execution()

            val duration = System.currentTimeMillis() - startTime
            logger.info { "Node $nodeName completed successfully in ${duration}ms" }

            // Capture output to data registry
            val executionData = NodeExecutionData(
                nodeId = nodeId,
                nodeName = nodeName,
                status = "COMPLETED",
                output = output,
                error = null,
                executedAt = Instant.now()
            )
            context.dataRegistry[nodeName] = executionData

            logger.debug { "Captured output for node $nodeName: ${output.keys}" }
            logger.info { "Data registry now contains ${context.dataRegistry.size} node outputs" }

            NodeExecutionResult(
                nodeId = nodeId,
                status = "COMPLETED",
                output = output
            )
        } catch (e: Exception) {
            logger.error(e) { "$nodeType $nodeName failed: ${e.message}" }

            // Capture failure to data registry (for debugging)
            val executionData = NodeExecutionData(
                nodeId = nodeId,
                nodeName = nodeName,
                status = "FAILED",
                output = null,
                error = e.message ?: "Unknown error in $nodeType",
                executedAt = Instant.now()
            )
            context.dataRegistry[nodeName] = executionData

            logger.debug { "Captured failure for node $nodeName: ${e.message}" }
            logger.info { "Data registry now contains ${context.dataRegistry.size} node outputs" }

            NodeExecutionResult(
                nodeId = nodeId,
                status = "FAILED",
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

    override fun executeWorkflowWithCoordinator(
        nodes: List<riven.core.models.workflow.WorkflowNode>,
        edges: List<riven.core.models.workflow.WorkflowEdge>,
        workspaceId: UUID
    ): riven.core.models.workflow.coordinator.WorkflowState {
        logger.info { "Executing workflow with coordinator: ${nodes.size} nodes, ${edges.size} edges" }

        // Get execution context from Temporal
        val activityInfo = Activity.getExecutionContext().info
        val workflowExecutionId = UUID.fromString(
            activityInfo.workflowId.substringAfter("execution-")
        )

        // Initialize workflow execution context
        val context = WorkflowExecutionContext(
            workflowExecutionId = workflowExecutionId,
            workspaceId = workspaceId,
            metadata = emptyMap(),
            dataRegistry = mutableMapOf()
        )

        // Create nodeExecutor that executes nodes synchronously
        // Note: In v1, parallel execution is simulated via sequential processing
        // Future enhancement: Use Temporal child workflows for true parallel execution
        val nodeExecutor: (List<riven.core.models.workflow.WorkflowNode>) -> List<Pair<UUID, Any?>> = { readyNodes ->
            logger.info { "Executing batch of ${readyNodes.size} ready nodes" }

            readyNodes.map { node ->
                logger.info { "Executing node ${node.id} (${node.type})" }

                // Execute node using existing executeNode logic
                val result = executeNode(node.id, workspaceId)

                // Check if node failed
                if (result.status == "FAILED") {
                    throw RuntimeException("Node ${node.id} failed: ${result.error}")
                }

                // Return nodeId -> output mapping
                node.id to result.output
            }
        }

        // Delegate to coordinator for DAG orchestration
        return try {
            val finalState = dagExecutionCoordinator.executeWorkflow(nodes, edges, nodeExecutor)
            logger.info { "Workflow execution completed: ${finalState.phase}, ${finalState.completedNodes.size} nodes completed" }
            finalState
        } catch (e: Exception) {
            logger.error(e) { "Workflow execution failed: ${e.message}" }
            throw e
        }
    }
}
