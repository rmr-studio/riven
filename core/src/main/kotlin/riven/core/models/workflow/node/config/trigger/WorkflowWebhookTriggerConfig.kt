package riven.core.models.workflow.node.config.trigger

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.enums.common.http.AuthenticationType
import riven.core.enums.common.http.RequestMethodType
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.common.http.Signature
import riven.core.models.common.validation.Schema
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.config.WorkflowTriggerConfig
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import io.swagger.v3.oas.annotations.media.Schema as SwaggerSchema

/**
 * Configuration for WEBHOOK trigger nodes.
 *
 * Triggers workflow execution when an HTTP webhook is received
 * at the configured endpoint.
 */
@SwaggerSchema(
    name = "WorkflowWebhookTriggerConfig",
    description = "Configuration for WEBHOOK trigger nodes. Triggers workflow execution when an HTTP webhook is received."
)
@JsonTypeName("workflow_webhook_trigger")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowWebhookTriggerConfig(
    override val version: Int = 1,
    val method: RequestMethodType,
    val authentication: AuthenticationType,
    val signature: Signature,
    val payloadSchema: Schema<String>
) : WorkflowTriggerConfig {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.WEBHOOK

    /**
     * Validates this configuration.
     *
     * Checks:
     * - method is valid (already enforced by enum)
     * - authentication is valid (already enforced by enum)
     * - signature is provided
     * - payloadSchema is provided
     *
     * @param injector Spring managed provider to inject services into model
     * @return Validation result with any errors
     */
    @Suppress("UNUSED_PARAMETER")
    override fun validate(injector: NodeServiceProvider): ConfigValidationResult {
        // method and authentication are enums, always valid if deserialized
        // signature is non-null in constructor
        // payloadSchema is non-null in constructor
        // Could add deeper validation here if needed
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