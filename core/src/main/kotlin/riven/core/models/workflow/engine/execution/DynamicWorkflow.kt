package riven.core.models.workflow.engine.execution

import io.temporal.workflow.QueryMethod
import io.temporal.workflow.SignalMethod
import io.temporal.workflow.WorkflowInterface
import io.temporal.workflow.WorkflowMethod
import riven.core.enums.workflow.WorkflowStatus
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext

@WorkflowInterface
interface DynamicWorkflow {
    @WorkflowMethod
    fun execute(context: WorkflowExecutionContext): Any

//    @SignalMethod
//    fun humanTaskCompleted(taskId: String, response: HumanTaskResponse)

    @SignalMethod
    fun cancel(reason: String)

    @QueryMethod
    fun getStatus(): WorkflowStatus

//    @QueryMethod
//    fun getCurrentStep(): StepInfo?
}