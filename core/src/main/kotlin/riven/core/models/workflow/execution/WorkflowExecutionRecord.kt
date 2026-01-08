package riven.core.models.workflow.execution

import riven.core.enums.workflow.WorkflowStatus
import java.time.Duration
import java.time.ZonedDateTime
import java.util.*

data class WorkflowExecutionRecord(
    val id: UUID,
    val workspaceId: UUID,
    val workflowDefinitionId: UUID,
    val workflowVersionId: UUID,
    val status: WorkflowStatus,
    val startedAt: ZonedDateTime,
    val completedAt: ZonedDateTime? = null,
    val duration: Duration
)