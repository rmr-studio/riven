package riven.core.service.workflow.engine.coordinator

import io.github.oshai.kotlinlogging.KLogger
import io.temporal.activity.Activity
import io.temporal.activity.ActivityInterface
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import riven.core.entity.workflow.WorkflowEdgeEntity
import riven.core.entity.workflow.execution.WorkflowExecutionNodeEntity
import riven.core.enums.workflow.WorkflowStatus
import riven.core.models.workflow.engine.NodeExecutionResult
import riven.core.models.workflow.engine.coordinator.WorkflowState
import riven.core.models.workflow.engine.environment.NodeExecutionData
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeExecutionServices
import riven.core.models.workflow.node.WorkflowNode
import riven.core.models.workflow.node.config.actions.*
import riven.core.models.workflow.node.config.controls.WorkflowConditionControlConfig
import riven.core.repository.workflow.WorkflowExecutionNodeRepository
import riven.core.service.entity.EntityService
import riven.core.service.workflow.EntityContextService
import riven.core.service.workflow.ExpressionEvaluatorService
import riven.core.service.workflow.ExpressionParserService
import riven.core.service.workflow.InputResolverService
import java.time.Instant
import java.time.ZonedDateTime
import java.util.*

/**
 * Service responsible for coordinating the execution of individual workflow nodes.
 * Should initialise the graph execution context, resolve inputs, invoke node logic, and capture outputs for a provided
 * sub-set of nodes and edges.
 *
 * 1. Initialize WorkflowExecutionContext with data registry
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
 * @property workflowExecutionNodeRepository Persists node execution state
 * @property entityService Handles entity CRUD operations (injected into nodes)
 * @property expressionEvaluatorService Evaluates expressions (injected into nodes)
 * @property entityContextService Resolves entity context (injected into nodes)
 * @property webClientBuilder HTTP client builder (injected into nodes)
 * @property inputResolverService Resolves template references
 */

@ActivityInterface
@Service
class WorkflowCoordinationService(
    private val workflowExecutionNodeRepository: WorkflowExecutionNodeRepository,
    private val entityService: EntityService,
    private val expressionEvaluatorService: ExpressionEvaluatorService,
    private val expressionParserService: ExpressionParserService,
    private val entityContextService: EntityContextService,
    private val webClientBuilder: WebClient.Builder,
    private val inputResolverService: InputResolverService,
    private val workflowGraphCoordinationService: WorkflowGraphCoordinationService,
    private val logger: KLogger
) : WorkflowCoordination {

    private val webClient: WebClient = webClientBuilder.build()

    override fun executeWorkflowWithCoordinator(
        nodes: List<WorkflowNode>,
        edges: List<WorkflowEdgeEntity>,
        workspaceId: UUID
    ): WorkflowState {
        logger.info { "Executing workflow with coordinator: ${nodes.size} nodes, ${edges.size} edges" }

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

        try {

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

            // Resolve inputs (templates → values)
            // Convert WorkflowNodeConfig properties to Map for resolution
            val configMap = when (val config = node.config) {
                is WorkflowCreateEntityActionConfig -> config.config
                is WorkflowUpdateEntityActionConfig -> config.config
                is WorkflowDeleteEntityActionConfig -> config.config
                is WorkflowQueryEntityActionConfig -> config.config
                is WorkflowHttpRequestActionConfig -> config.config
                is WorkflowConditionControlConfig -> config.config
                //TODO: Add other node config types here and streamline mapping process
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
            // Nodes implement their own execute() method via config
            // This enables easy addition of new node types (LOOP, SWITCH, PARALLEL, etc.)
            logger.info { "Executing ${node.type} node via polymorphic dispatch: ${node.name}" }
            val executionStart = System.currentTimeMillis()

            val result = executeAction(nodeId, node.name, node.type.name, context) {
                node.execute(context, resolvedInputs, services)
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
            logger.error(e) { "Error executing node $nodeId: ${e.message}" }

            // Try to persist error state (best effort)
            try {
                val activityInfo = Activity.getExecutionContext().info
                val workflowExecutionId = UUID.fromString(
                    activityInfo.workflowId.substringAfter("execution-")
                )

                val executionNodeRecord = createExecutionNode(
                    workflowExecutionId = workflowExecutionId,
                    nodeId = nodeId,
                    workspaceId = workspaceId,
                    startTime = startTime
                )

                updateExecutionNode(
                    executionNode = executionNodeRecord,
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
                status = WorkflowStatus.FAILED,
                error = e.message ?: "Unknown error"
            )
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
        execution: () -> Map<String, Any?>
    ): NodeExecutionResult {
        return try {
            logger.info { "Executing $nodeType: $nodeName" }

            // Record duration of execution
            val startTime = System.currentTimeMillis()
            val output = execution()
            val duration = System.currentTimeMillis() - startTime
            logger.info { "Node $nodeName completed successfully in ${duration}ms" }

            // Capture output to data registry
            val executionData = NodeExecutionData(
                nodeId = nodeId,
                nodeName = nodeName,
                status = WorkflowStatus.COMPLETED,
                output = output,
                error = null,
                executedAt = Instant.now()
            )
            context.dataRegistry[nodeName] = executionData

            logger.debug { "Captured output for node $nodeName: ${output.keys}" }
            logger.info { "Data registry now contains ${context.dataRegistry.size} node outputs" }

            NodeExecutionResult(
                nodeId = nodeId,
                status = WorkflowStatus.COMPLETED,
                output = output
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


}
