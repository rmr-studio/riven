package riven.core.models.workflow.trigger

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.enums.common.http.AuthenticationType
import riven.core.enums.common.http.RequestMethodType
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.common.http.Signature
import riven.core.models.common.validation.Schema
import riven.core.models.workflow.WorkflowTriggerNode
import java.util.*

@JsonTypeName("webhook_trigger")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowWebhookTriggerNode(
    override val id: UUID,
    override val version: Int = 1,
    val method: RequestMethodType,
    val authentication: AuthenticationType,
    val signature: Signature,
    val payloadSchema: Schema<String>
) : WorkflowTriggerNode {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.WEBHOOK
}