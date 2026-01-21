package riven.core.models.response.workflow.execution

import riven.core.models.workflow.engine.execution.WorkflowExecutionNodeRecord
import riven.core.models.workflow.engine.execution.WorkflowExecutionRecord

data class WorkflowExecutionSummaryResponse(
    val execution: WorkflowExecutionRecord,
    val nodes: List<WorkflowExecutionNodeRecord>
)