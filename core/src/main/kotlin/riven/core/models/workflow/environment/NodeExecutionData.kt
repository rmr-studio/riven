package riven.core.models.workflow.environment

import java.time.Instant
import java.util.UUID

/**
 * Immutable record of a node's execution output.
 *
 * Stored in the data registry to enable node-to-node data flow.
 * Each node's output is captured after execution and made available
 * to downstream nodes via template references like {{ steps.nodeName.output }}.
 *
 * Design Principles:
 * - Immutable: Once stored, never modified (execution is atomic)
 * - Self-contained: Includes all metadata needed for debugging/replay
 * - Status-aware: Captures success, failure, and skipped states
 *
 * @property nodeId Unique identifier of the executed node
 * @property nodeName Human-readable name used for template references (e.g., "fetch_leads")
 * @property status Execution status: COMPLETED, FAILED, SKIPPED
 * @property output Action/control flow outputs (null if failed/skipped)
 * @property error Error message if execution failed (null otherwise)
 * @property executedAt Timestamp when execution completed
 */
data class NodeExecutionData(
    val nodeId: UUID,
    val nodeName: String,
    val status: String,
    val output: Map<String, Any?>?,
    val error: String?,
    val executedAt: Instant
)
