package riven.core.models.workflow.actions

import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.request.entity.SaveEntityRequest
import riven.core.models.workflow.NodeExecutionServices
import riven.core.models.workflow.WorkflowActionNode
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import java.util.*

/**
 * Action node for creating entities.
 *
 * ## Configuration
 *
 * Required inputs:
 * - `entityTypeId`: String UUID of the entity type to create
 * - `payload`: Map<*, *> of entity attribute values
 *
 * Optional inputs:
 * - `icon`: String icon identifier
 *
 * ## Output
 *
 * Returns map with:
 * - `entityId`: UUID of created entity
 * - `entityTypeId`: UUID of entity type
 * - `payload`: Map of entity data
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "entityTypeId": "{{ steps.get_client_type.output.typeId }}",
 *   "payload": {
 *     "name": "{{ steps.fetch_data.output.clientName }}",
 *     "email": "client@example.com"
 *   }
 * }
 * ```
 *
 * Templates are resolved before execute() is called.
 */
data class CreateEntityActionNode(
    override val id: UUID,
    override val version: Int,
    val name: String,
    val config: Map<String, Any?>
) : WorkflowActionNode {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.CREATE_ENTITY

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeExecutionServices
    ): Map<String, Any?> {
        // Extract inputs (already resolved by InputResolverService)
        val entityTypeId = UUID.fromString(inputs["entityTypeId"] as String)
        val payload = inputs["payload"] as? Map<*, *> ?: emptyMap<Any, Any>()

        // Create entity via EntityService
        val saveRequest = SaveEntityRequest(
            id = null, // New entity
            payload = emptyMap(), // TODO: Map payload properly in Phase 4.2
            icon = null // TODO: Handle Icon type in Phase 4.2
        )

        val result = services.entityService.saveEntity(
            context.workspaceId,
            entityTypeId,
            saveRequest
        )

        // Return output
        return mapOf(
            "entityId" to result.entity?.id,
            "entityTypeId" to result.entity?.typeId,
            "payload" to result.entity?.payload
        )
    }
}
