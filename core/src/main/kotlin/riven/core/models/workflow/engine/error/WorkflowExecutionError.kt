package riven.core.models.workflow.engine.error

import riven.core.enums.workflow.WorkflowErrorType
import java.time.ZonedDateTime
import java.util.*

data class WorkflowExecutionError(
    val failedNodeId: UUID,
    val failedNodeName: String,
    val failedNodeType: String,
    val errorType: WorkflowErrorType,
    val message: String,
    val totalRetryCount: Int,
    val timestamp: ZonedDateTime
)
