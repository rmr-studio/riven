package riven.core.models.workflow.actions

import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.request.entity.SaveEntityRequest
import riven.core.models.workflow.NodeExecutionServices
import riven.core.models.workflow.WorkflowActionNode
import riven.core.models.workflow.environment.WorkflowExecutionContext
import java.util.*

/**
 * Action node for updating entities.
 *
 * ## Configuration
 *
 * Required inputs:
 * - `entityId`: String UUID of the entity to update
 * - `payload`: Map<*, *> of attribute values to update
 *
 * Optional inputs:
 * - `icon`: String icon identifier
 *
 * ## Output
 *
 * Returns map with:
 * - `entityId`: UUID of updated entity
 * - `updated`: Boolean true
 * - `payload`: Map of entity data after update
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "entityId": "{{ steps.find_client.output.entityId }}",
 *   "payload": {
 *     "status": "active",
 *     "lastContacted": "{{ steps.get_timestamp.output.now }}"
 *   }
 * }
 * ```
 */
data class UpdateEntityActionNode(
    override val id: UUID,
    override val version: Int,
    val name: String,
    val config: Map<String, Any?>
) : WorkflowActionNode {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.UPDATE_ENTITY

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeExecutionServices
    ): Map<String, Any?> {
        // Extract inputs (already resolved)
        val entityId = UUID.fromString(inputs["entityId"] as String)
        val payload = inputs["payload"] as? Map<*, *> ?: emptyMap<Any, Any>()

        // Get existing entity to determine type
        val existingEntity = services.entityService.getEntity(entityId)

        // Update entity via EntityService
        val saveRequest = SaveEntityRequest(
            id = entityId,
            payload = emptyMap(), // TODO: Map payload properly in Phase 4.2
            icon = null // TODO: Handle Icon type in Phase 4.2
        )

        val result = services.entityService.saveEntity(
            context.workspaceId,
            existingEntity.typeId,
            saveRequest
        )

        // Return output
        return mapOf(
            "entityId" to result.entity?.id,
            "updated" to true,
            "payload" to result.entity?.payload
        )
    }
}
