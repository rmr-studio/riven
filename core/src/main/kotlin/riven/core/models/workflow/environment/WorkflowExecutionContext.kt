package riven.core.models.workflow.environment

import java.util.*

/**
 * Stores serialized execution context snapshots.
 *
 * 1. Supports debugging and replay visualization
 * 2. Allows inspection without Temporal tooling
 * 3. Enables “resume from here” UX
 *
 * Data Stored
 *  - Current node
 *  - Accumulated outputs
 *  - Entity references
 *  - Loop indices
 */
data class WorkflowExecutionContext(
    val id: UUID,
)