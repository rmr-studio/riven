package riven.core.models.workflow.trigger

import riven.core.enums.common.http.AuthenticationType
import riven.core.enums.common.http.RequestMethodType
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.models.common.http.Signature
import riven.core.models.common.validation.Schema
import riven.core.models.workflow.WorkflowTriggerNode
import java.util.*

data class WorkflowWebhookTriggerNode(
    override val id: UUID,
    val method: RequestMethodType,
    val authentication: AuthenticationType,
    val signature: Signature,
    val payloadSchema: Schema<String>
) : WorkflowTriggerNode {
    override val subType: WorkflowTriggerType
        get() = WorkflowTriggerType.WEBHOOK

}