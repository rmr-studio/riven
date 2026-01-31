package riven.core.models.workflow.node.config.trigger

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.common.validation.Schema
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.config.WorkflowTriggerConfig
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import riven.core.service.workflow.state.WorkflowNodeConfigValidationService
import io.swagger.v3.oas.annotations.media.Schema as SwaggerSchema

/**
 * Configuration for FUNCTION trigger nodes.
 *
 * Triggers workflow execution when called as a function
 * with the specified input schema.
 */
@SwaggerSchema(
    name = "WorkflowFunctionTriggerConfig",
    description = "Configuration for FUNCTION trigger nodes. Triggers workflow execution when called as a function."
)
@JsonTypeName("workflow_function_trigger")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowFunctionTriggerConfig(
    override val version: Int = 1,
    val schema: Schema<String>
) : WorkflowTriggerConfig {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.FUNCTION

    /**
     * Validates this configuration.
     *
     * Checks:
     * - schema is provided (already non-null in constructor)
     * - schema has valid structure
     */
    @Suppress("UNUSED_PARAMETER")
    fun validate(validationService: WorkflowNodeConfigValidationService): ConfigValidationResult {
        // schema is non-null in constructor, so it's always present
        // Could add deeper schema validation here if needed
        return ConfigValidationResult.valid()
    }

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): Map<String, Any?> {
        // Triggers are entry points, not executed during workflow
        throw UnsupportedOperationException("TRIGGER nodes don't execute during workflow")
    }
}