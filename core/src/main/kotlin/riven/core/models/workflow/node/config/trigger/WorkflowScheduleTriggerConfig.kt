package riven.core.models.workflow.node.config.trigger

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.config.WorkflowTriggerConfig
import riven.core.models.workflow.node.config.validation.ConfigValidationError
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import riven.core.service.workflow.state.WorkflowNodeConfigValidationService
import java.time.Duration
import java.util.*

/**
 * Configuration for SCHEDULE trigger nodes.
 *
 * Triggers workflow execution on a schedule defined by either
 * a cron expression or a fixed interval.
 */
@Schema(
    name = "WorkflowScheduleTriggerConfig",
    description = "Configuration for SCHEDULE trigger nodes. Triggers workflow execution on a schedule."
)
@JsonTypeName("workflow_schedule_trigger")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowScheduleTriggerConfig(
    override val version: Int = 1,
    // Either a cron expression or an interval must be provided.
    val cronExpression: String? = null,
    val interval: Duration? = null,
    val timeZone: TimeZone
) : WorkflowTriggerConfig {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.SCHEDULE

    init {
        require(cronExpression != null || interval != null) {
            "Either cronExpression or interval must be provided for schedule trigger"
        }
    }

    /**
     * Validates this configuration.
     *
     * Checks:
     * - Either cronExpression or interval is provided (already in init block)
     * - cronExpression has valid format if provided
     * - interval is positive if provided
     * - timeZone is valid
     */
    fun validate(validationService: WorkflowNodeConfigValidationService): ConfigValidationResult {
        val errors = mutableListOf<ConfigValidationError>()

        // Check at least one scheduling option
        if (cronExpression == null && interval == null) {
            errors.add(ConfigValidationError("cronExpression", "Either cronExpression or interval must be provided"))
        }

        // Validate cron expression format if provided
        if (cronExpression != null && cronExpression.isBlank()) {
            errors.add(ConfigValidationError("cronExpression", "Cron expression cannot be blank"))
        }

        // Validate interval is positive if provided
        if (interval != null && interval.isNegative) {
            errors.add(ConfigValidationError("interval", "Interval must be positive"))
        }

        // timeZone is required (non-null in constructor), so it's always present

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
