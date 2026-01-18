package riven.core.models.workflow.node.config

import riven.core.enums.workflow.WorkflowNodeType
import riven.core.enums.workflow.WorkflowUtilityActionType

/**
 * Configuration interface for UTILITY category nodes.
 *
 * Utility nodes perform helper operations like data transformation,
 * logging, notifications, etc.
 *
 * @property subType The specific utility type (TRANSFORM, LOG, NOTIFY, etc.)
 */
interface WorkflowUtilityConfig : WorkflowNodeConfig {
    override val type: WorkflowNodeType
        get() = WorkflowNodeType.UTILITY
    val subType: WorkflowUtilityActionType
}