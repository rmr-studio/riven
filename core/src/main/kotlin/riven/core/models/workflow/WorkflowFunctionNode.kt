package riven.core.models.workflow

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.workflow.environment.WorkflowExecutionContext
import java.util.*

/**
 * A function itself defines a closed set of operations that can be executed.
 * A workflow is composed of multiple functions that are orchestrated together to achieve a specific goal.
 */
@JsonTypeName("function_node")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowFunctionNode(
    override val id: UUID,
    override val version: Int = 1
) : WorkflowNode {
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.FUNCTION

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeExecutionServices
    ): Map<String, Any?> {
        // TODO: Implement FUNCTION node execution in Phase 5+
        throw UnsupportedOperationException("FUNCTION nodes not implemented in Phase 4.1")
    }
}