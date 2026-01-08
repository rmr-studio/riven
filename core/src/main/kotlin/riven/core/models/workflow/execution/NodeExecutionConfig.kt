package riven.core.models.workflow.execution

import java.time.Duration
import java.util.*

data class NodeExecutionConfig(
    val timeout: Duration?,
    val retryCount: Int?,
    val continueOnFailure: Boolean?,
    val errorHandlerId: UUID,
)