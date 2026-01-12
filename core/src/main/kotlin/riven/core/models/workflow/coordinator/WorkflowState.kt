package riven.core.models.workflow.coordinator

import java.util.*

/**
 * Workflow execution phase representing the current state in the orchestration lifecycle.
 *
 * ## State Machine Diagram
 *
 * ```
 *     INITIALIZING
 *          |
 *          v
 *   EXECUTING_NODES ←──┐
 *          |            |
 *          v            |
 *     (nodes ready)     |
 *          |            |
 *          v            |
 *     (execute nodes)   |
 *          |            |
 *          └────────────┘
 *          |
 *          v
 *     COMPLETED / FAILED
 * ```
 *
 * ## State Transitions
 *
 * - **INITIALIZING** → **EXECUTING_NODES**: First batch of nodes ready
 * - **EXECUTING_NODES** → **EXECUTING_NODES**: More nodes ready after completions
 * - **EXECUTING_NODES** → **COMPLETED**: All nodes completed successfully
 * - **Any** → **FAILED**: Node execution error (Phase 7 will enhance error handling)
 */
enum class WorkflowExecutionPhase {
    /**
     * Building dependency graph, validating DAG, initializing active node queue.
     */
    INITIALIZING,

    /**
     * Processing active nodes. The workflow cycles in this state as nodes complete
     * and new nodes become ready for execution.
     */
    EXECUTING_NODES,

    /**
     * All nodes finished successfully. Workflow execution complete.
     */
    COMPLETED,

    /**
     * Execution error occurred. In Phase 5 (v1), any node failure transitions to this state.
     * Phase 7 will add retry logic and error recovery.
     */
    FAILED
}

/**
 * Immutable workflow state tracking orchestration progress.
 *
 * This data class represents the complete state of a workflow execution at a point in time.
 * All state transitions produce a new WorkflowState instance (immutable pattern).
 *
 * ## Usage Pattern
 *
 * ```kotlin
 * // Initial state
 * var state = WorkflowState(
 *     phase = WorkflowExecutionPhase.INITIALIZING,
 *     activeNodes = emptySet(),
 *     completedNodes = emptySet(),
 *     failedNodes = emptySet(),
 *     dataRegistry = emptyMap()
 * )
 *
 * // Transition via events
 * state = StateTransition.apply(state, NodesReady(setOf(node1Id, node2Id)))
 * state = StateTransition.apply(state, NodeCompleted(node1Id, outputData))
 * ```
 *
 * ## Data Registry
 *
 * The dataRegistry stores node outputs by nodeId (UUID). In Phase 5 Plan 3, the coordinator
 * will map these to node names for template resolution (e.g., `{{ steps.nodeName.output }}`).
 *
 * ## Thread Safety
 *
 * While this data class is immutable, proper synchronization is required if shared across
 * threads. In Temporal workflows, state is single-threaded within the workflow context.
 *
 * @property phase Current execution phase
 * @property activeNodes Set of node IDs currently executing (in Temporal Async)
 * @property completedNodes Set of node IDs that finished execution
 * @property failedNodes Set of node IDs that failed execution (empty in v1, populated in Phase 7)
 * @property dataRegistry Map of node outputs: nodeId → output data (Any? to handle all types)
 */
data class WorkflowState(
    val phase: WorkflowExecutionPhase,
    val activeNodes: Set<UUID> = emptySet(),
    val completedNodes: Set<UUID> = emptySet(),
    val failedNodes: Set<UUID> = emptySet(),
    val dataRegistry: Map<UUID, Any?> = emptyMap()
) {
    /**
     * Checks if workflow execution is finished (completed or failed).
     */
    fun isTerminal(): Boolean = phase == WorkflowExecutionPhase.COMPLETED ||
            phase == WorkflowExecutionPhase.FAILED

    /**
     * Checks if workflow has active nodes currently executing.
     */
    fun hasActiveNodes(): Boolean = activeNodes.isNotEmpty()

    /**
     * Gets the output data for a specific node.
     *
     * @param nodeId ID of the node
     * @return Output data, or null if node hasn't completed or has no output
     */
    fun getNodeOutput(nodeId: UUID): Any? = dataRegistry[nodeId]
}

/**
 * Sealed interface representing state machine events that trigger transitions.
 *
 * Each event type corresponds to a specific workflow occurrence that requires
 * state updates. StateTransition.apply() handles event processing and produces
 * new WorkflowState instances.
 *
 * ## Event Types
 *
 * - **NodesReady**: Batch of nodes ready for execution (in-degree = 0)
 * - **NodeCompleted**: Node finished successfully with output
 * - **NodeFailed**: Node execution error (v1 basic handling, Phase 7 enhances)
 * - **AllNodesCompleted**: No more nodes to execute, all done
 * - **WorkflowFailed**: Unrecoverable workflow error
 */
sealed interface StateEvent

/**
 * Batch of nodes ready for parallel execution.
 *
 * Triggered when nodes' dependencies are satisfied (in-degree reaches 0).
 * These nodes should be executed concurrently via Temporal Async.function.
 *
 * @property nodeIds Set of ready node IDs
 */
data class NodesReady(val nodeIds: Set<UUID>) : StateEvent

/**
 * Node completed execution successfully.
 *
 * Triggered after a node's activity finishes. The output is stored in the
 * data registry for potential use by downstream nodes.
 *
 * @property nodeId ID of the completed node
 * @property output Node's output data (Any? to handle all types)
 */
data class NodeCompleted(val nodeId: UUID, val output: Any?) : StateEvent

/**
 * Node execution failed with error.
 *
 * In Phase 5 (v1), this transitions workflow to FAILED state immediately.
 * Phase 7 will add retry logic and error recovery strategies.
 *
 * @property nodeId ID of the failed node
 * @property error Error message describing the failure
 */
data class NodeFailed(val nodeId: UUID, val error: String) : StateEvent

/**
 * All nodes completed successfully.
 *
 * Triggered when the active node queue is empty and no more work remains.
 * Transitions workflow to COMPLETED state.
 */
data object AllNodesCompleted : StateEvent

/**
 * Unrecoverable workflow error.
 *
 * Triggered for errors outside node execution (e.g., DAG validation failure,
 * orchestration logic errors). Transitions workflow to FAILED state.
 */
data object WorkflowFailed : StateEvent
