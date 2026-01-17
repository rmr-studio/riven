package riven.core.models.workflow.engine.execution

import riven.core.enums.workflow.WorkflowStatus
import riven.core.models.workflow.WorkflowNode
import java.time.Duration
import java.time.ZonedDateTime
import java.util.*

data class WorkflowExecutionNodeRecord(
    override val id: UUID,
    override val workspaceId: UUID,
    val executionId: UUID,
    val node: WorkflowNode,

    val sequenceIndex: Int,

    override val status: WorkflowStatus,
    override val startedAt: ZonedDateTime,
    override val completedAt: ZonedDateTime? = null,
    override val duration: Duration? = null,
    val attempt: Int,

    override val input: Any?,
    override val output: Any?,
    override val error: Any?

) : ExecutionRecord