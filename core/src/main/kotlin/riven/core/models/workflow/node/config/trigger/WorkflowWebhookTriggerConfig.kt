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

/**
 * Configuration for WEBHOOK trigger nodes.
 *
 * Triggers workflow execution when an HTTP webhook is received
 * at the configured endpoint.
 */
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

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): Map<String, Any?> {
        // Triggers are entry points, not executed during workflow
        throw UnsupportedOperationException("TRIGGER nodes don't execute during workflow")
    }
}