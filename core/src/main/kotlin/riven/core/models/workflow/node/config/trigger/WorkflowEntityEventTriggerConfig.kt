package riven.core.models.workflow.node.config.trigger

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.util.OperationType
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.config.WorkflowTriggerConfig

/**
 * Configuration for ENTITY_EVENT trigger nodes.
 *
 * Triggers workflow execution when entity operations occur
 * (CREATE, UPDATE, DELETE) on specified entity types.
 */
@Schema(
    name = "WorkflowEntityEventTriggerConfig",
    description = "Configuration for ENTITY_EVENT trigger nodes. Triggers workflow execution when entity operations occur."
)
@JsonTypeName("workflow_entity_event_trigger")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowEntityEventTriggerConfig(
    override val version: Int = 1,
    val key: String,
    val operation: OperationType,
    val field: List<String> = emptyList(),
    val expressions: Any
) : WorkflowTriggerConfig {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.ENTITY_EVENT

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): Map<String, Any?> {
        // Triggers are entry points, not executed during workflow
        throw UnsupportedOperationException("TRIGGER nodes don't execute during workflow")
    }
}