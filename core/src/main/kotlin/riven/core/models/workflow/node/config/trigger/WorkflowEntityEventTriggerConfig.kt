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
import riven.core.models.workflow.node.config.validation.ConfigValidationError
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import riven.core.models.workflow.node.service
import riven.core.service.workflow.state.WorkflowNodeConfigValidationService

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

    /**
     * Validates this configuration.
     *
     * Checks:
     * - key is not blank (entity type key)
     * - operation is valid (already enforced by enum)
     * - expressions is provided (not null)
     *
     * @param injector Spring managed provider to inject services into model
     * @return Validation result with any errors
     */
    override fun validate(injector: NodeServiceProvider): ConfigValidationResult {
        val validationService = injector.service<WorkflowNodeConfigValidationService>()
        val errors = mutableListOf<ConfigValidationError>()

        // Validate key (entity type key)
        errors.addAll(validationService.validateRequiredString(key, "key"))

        // operation is an enum, so it's always valid if deserialized

        // expressions should not be null (it's typed as Any which is non-null in Kotlin)
        // but validate it has content if it's a string or collection
        when (expressions) {
            is String -> {
                if ((expressions as String).isBlank()) {
                    errors.add(ConfigValidationError("expressions", "Expressions cannot be blank"))
                }
            }

            is Collection<*> -> {
                if ((expressions as Collection<*>).isEmpty()) {
                    errors.add(ConfigValidationError("expressions", "Expressions list cannot be empty"))
                }
            }
        }

        return ConfigValidationResult(errors)
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