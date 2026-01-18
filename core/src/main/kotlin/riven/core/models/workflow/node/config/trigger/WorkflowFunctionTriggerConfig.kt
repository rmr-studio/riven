package riven.core.models.workflow.node.config.trigger

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.common.validation.Schema
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeExecutionServices
import riven.core.models.workflow.node.config.WorkflowTriggerConfig

/**
 * Configuration for FUNCTION trigger nodes.
 *
 * Triggers workflow execution when called as a function
 * with the specified input schema.
 */
@JsonTypeName("workflow_function_trigger")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowFunctionTriggerConfig(
    override val version: Int = 1,
    val schema: Schema<String>
) : WorkflowTriggerConfig {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.FUNCTION

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeExecutionServices
    ): Map<String, Any?> {
        // Triggers are entry points, not executed during workflow
        throw UnsupportedOperationException("TRIGGER nodes don't execute during workflow")
    }
}