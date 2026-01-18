package riven.core.models.workflow.node.config

import riven.core.enums.workflow.WorkflowHumanInteractionType
import riven.core.enums.workflow.WorkflowNodeType

/**
 * Configuration interface for HUMAN_INTERACTION category nodes.
 *
 * Human interaction nodes pause workflow execution to await
 * human input, approval, or review before continuing.
 *
 * @property subType The specific interaction type (APPROVAL, FORM, REVIEW, etc.)
 */
interface WorkflowHumanInteractionConfig : WorkflowNodeConfig {
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.HUMAN_INTERACTION
    val subType: WorkflowHumanInteractionType
}