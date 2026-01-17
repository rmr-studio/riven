package riven.core.service.workflow.coordinator

import org.springframework.stereotype.Service
import riven.core.models.workflow.WorkflowEdge
import riven.core.models.workflow.WorkflowNode
import riven.core.models.workflow.engine.coordinator.AllNodesCompleted
import riven.core.models.workflow.engine.coordinator.NodeCompleted
import riven.core.models.workflow.engine.coordinator.NodesReady
import riven.core.models.workflow.engine.coordinator.StateTransition
import riven.core.models.workflow.engine.coordinator.WorkflowExecutionPhase
import riven.core.models.workflow.engine.coordinator.WorkflowFailed
import riven.core.models.workflow.engine.coordinator.WorkflowState
import java.util.*

/**
 * DAG execution coordinator that orchestrates complete workflow execution.
 *
 * This service is the "brain" that connects all DAG execution components:
 * - DagValidator: Validates graph structure (cycles, connectivity)
 * - TopologicalSorter: Determines dependency order
 * - ActiveNodeQueue: Schedules ready nodes for parallel execution
 * - WorkflowState + StateTransition: Tracks orchestration progress
 *
 * ## Algorithm Overview (Kahn's + Active Queue + State Machine)
 *
 * The coordinator implements a modified Kahn's algorithm enhanced with active node queue
 * for parallel scheduling and state machine tracking:
 *
 * 1. **Validate DAG:** Ensure no cycles, all nodes reachable, edges consistent
 * 2. **Initialize state:** Create WorkflowState with INITIALIZING phase
 * 3. **Initialize queue:** Build in-degree map and enqueue ready nodes (in-degree = 0)
 * 4. **Execution loop:** While queue has more work:
 *    a. Get batch of ready nodes from queue
 *    b. Transition state: NodesReady event
 *    c. Execute ready nodes in parallel (via caller's nodeExecutor)
 *    d. Wait for all to complete
 *    e. For each completed node:
 *       - Transition state: NodeCompleted event with output
 *       - Mark node completed in queue (triggers successor in-degree decrement)
 *       - Update data registry with output
 * 5. **Complete:** Transition state to COMPLETED
 *
 * ## Usage with Temporal Async/Promise
 *
 * The coordinator delegates actual node execution to the caller via a nodeExecutor lambda.
 * This keeps the coordinator deterministic and enables Temporal parallel execution:
 *
 * ```kotlin
 * // In Temporal workflow (via activity):
 * val nodeExecutor: (List<WorkflowNode>) -> List<Pair<UUID, Any?>> = { readyNodes ->
 *     // Execute all ready nodes in parallel
 *     val promises = readyNodes.map { node ->
 *         Async.function { activities.executeNode(node.id, context) }
 *     }
 *
 *     // Wait for all (deterministic)
 *     Promise.allOf(promises).get()
 *
 *     // Collect results: nodeId -> output
 *     readyNodes.zip(promises.map { it.get() }).map { (node, result) ->
 *         node.id to result.output
 *     }
 * }
 *
 * // Execute workflow via coordinator
 * val finalState = coordinator.executeWorkflow(nodes, edges, nodeExecutor)
 * ```
 *
 * ## Thread Safety
 *
 * **This service is ONLY safe for use within Temporal's single-threaded workflow context.**
 * Do NOT use in multi-threaded environments. The ActiveNodeQueue maintains mutable state
 * optimized for single-threaded deterministic execution.
 *
 * ## Error Handling
 *
 * The coordinator throws exceptions for:
 * - **WorkflowValidationException**: Invalid DAG structure (cycles, disconnected components)
 * - **IllegalStateException**: Incomplete execution (nodes remain with positive in-degree)
 * - **Node execution errors**: Propagated from nodeExecutor lambda
 *
 * In Phase 5 (v1), any node failure aborts the workflow. Phase 7 will add:
 * - Retry policies
 * - Error recovery workflows
 * - Partial completion handling
 *
 * ## Conditional Branching (v1 - Simple)
 *
 * Current implementation executes all outgoing edges from every node. Conditional nodes
 * return edge selection in their output, but v1 doesn't use that for branching yet.
 * Full conditional branching is Phase 7 work.
 *
 * @property dagValidator Validates DAG structure before execution
 * @property topologicalSorter Verifies execution order (used for pre-validation)
 * @property activeNodeQueue Manages parallel node scheduling with in-degree tracking
 */
@Service
class DagExecutionCoordinator(
    private val dagValidator: DagValidator,
    private val topologicalSorter: TopologicalSorter,
    private val activeNodeQueue: ActiveNodeQueue
) {

    /**
     * Execute DAG workflow with parallel node scheduling.
     *
     * This method orchestrates the complete workflow execution:
     * 1. Validates DAG structure (throws if invalid)
     * 2. Initializes state machine and active node queue
     * 3. Executes nodes in topological order with maximum parallelism
     * 4. Tracks state transitions throughout execution
     * 5. Returns final state with all node outputs
     *
     * ## Execution Model
     *
     * The coordinator uses a pull-based scheduling model:
     * - Get batch of ready nodes (in-degree = 0)
     * - Execute batch in parallel via nodeExecutor
     * - Mark nodes completed, which may enqueue new ready nodes
     * - Repeat until all nodes completed
     *
     * This enables maximum parallelism while respecting dependencies.
     *
     * ## Node Executor Contract
     *
     * The nodeExecutor lambda must:
     * - Accept a list of WorkflowNode instances (ready for execution)
     * - Execute them in parallel (e.g., Temporal Async.function + Promise.allOf)
     * - Return List<Pair<UUID, Any?>> mapping nodeId to output
     * - Propagate exceptions for failed nodes
     *
     * ## State Machine
     *
     * State transitions during execution:
     * - INITIALIZING → EXECUTING_NODES (first batch ready)
     * - EXECUTING_NODES → EXECUTING_NODES (subsequent batches)
     * - EXECUTING_NODES → COMPLETED (all nodes done)
     * - Any → FAILED (on error)
     *
     * ## Return Value
     *
     * Returns the final WorkflowState containing:
     * - phase: COMPLETED or FAILED
     * - completedNodes: Set of all completed node IDs
     * - dataRegistry: Map of nodeId → output for all completed nodes
     *
     * @param nodes All workflow nodes in the DAG
     * @param edges All dependency edges (source → target)
     * @param nodeExecutor Lambda that executes a batch of nodes in parallel
     * @return Final WorkflowState with all outputs and completion status
     * @throws WorkflowValidationException if DAG structure is invalid
     * @throws IllegalStateException if execution completes with remaining nodes (deadlock)
     */
    fun executeWorkflow(
        nodes: List<WorkflowNode>,
        edges: List<WorkflowEdge>,
        nodeExecutor: (List<WorkflowNode>) -> List<Pair<UUID, Any?>>
    ): WorkflowState {
        // 1. Validate DAG structure
        val validationResult = dagValidator.validate(nodes, edges)
        if (!validationResult.valid) {
            throw WorkflowValidationException(
                "Invalid workflow DAG: ${validationResult.errors.joinToString("; ")}"
            )
        }

        // 2. Verify topological order exists (redundant with validator but provides extra safety)
        try {
            topologicalSorter.sort(nodes, edges)
        } catch (e: IllegalStateException) {
            throw WorkflowValidationException("Topological sort failed: ${e.message}", e)
        }

        // 3. Initialize state machine
        var state = WorkflowState(
            phase = WorkflowExecutionPhase.INITIALIZING,
            activeNodes = emptySet(),
            completedNodes = emptySet(),
            failedNodes = emptySet(),
            dataRegistry = emptyMap()
        )

        // 4. Initialize active node queue
        activeNodeQueue.initialize(nodes, edges)

        // 5. Handle empty workflow (no nodes)
        if (nodes.isEmpty()) {
            // Return COMPLETED state directly (no nodes to execute)
            return state.copy(phase = WorkflowExecutionPhase.COMPLETED)
        }

        // 6. Execution loop: process nodes in topological order with parallelism
        while (activeNodeQueue.hasMoreWork()) {
            // Get batch of ready nodes (all nodes with in-degree = 0)
            val readyNodes = activeNodeQueue.getReadyNodes()

            if (readyNodes.isEmpty()) {
                // No ready nodes but queue has more work = deadlock (shouldn't happen after validation)
                val remainingNodes = activeNodeQueue.getRemainingNodes()
                throw IllegalStateException(
                    "Deadlock detected: ${remainingNodes.size} nodes remaining with unsatisfied dependencies. " +
                        "Node IDs: ${remainingNodes.joinToString(", ") { it.id.toString() }}"
                )
            }

            // Transition state: nodes ready for execution
            state = StateTransition.apply(
                state,
                NodesReady(readyNodes.map { it.id }.toSet())
            )

            // Execute ready nodes in parallel (caller handles Temporal Async/Promise)
            val results: List<Pair<UUID, Any?>> = try {
                nodeExecutor(readyNodes)
            } catch (e: Exception) {
                // Node execution failed - transition to FAILED state
                state = StateTransition.apply(state, WorkflowFailed)
                throw WorkflowExecutionException("Node execution failed: ${e.message}", e)
            }

            // Mark each node as completed and update state
            for ((nodeId, output) in results) {
                // Transition state: node completed with output
                state = StateTransition.apply(
                    state,
                    NodeCompleted(nodeId, output)
                )

                // Mark node completed in queue (decrements successor in-degrees, enqueues new ready nodes)
                activeNodeQueue.markNodeCompleted(nodeId)
            }
        }

        // 6. Verify all nodes completed
        val completedCount = activeNodeQueue.getCompletedNodes().size
        if (completedCount != nodes.size) {
            throw IllegalStateException(
                "Incomplete execution: $completedCount of ${nodes.size} nodes completed. " +
                    "This indicates a bug in the coordinator or queue logic."
            )
        }

        // 7. Transition to COMPLETED state
        state = StateTransition.apply(state, AllNodesCompleted)

        return state
    }
}

/**
 * Exception thrown when workflow DAG validation fails.
 *
 * This indicates structural problems with the workflow graph:
 * - Cycles detected
 * - Disconnected components
 * - Invalid edge references
 * - Conditional nodes without proper branching
 *
 * @param message Validation error details
 * @param cause Optional underlying exception
 */
class WorkflowValidationException(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)

/**
 * Exception thrown when workflow execution fails.
 *
 * This wraps errors that occur during node execution, providing context
 * about which node failed and why.
 *
 * @param message Execution error details
 * @param cause Underlying exception from node execution
 */
class WorkflowExecutionException(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)
