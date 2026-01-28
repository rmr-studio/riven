package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.request.entity.SaveEntityRequest
import riven.core.service.entity.EntityService
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.service
import riven.core.models.workflow.node.config.WorkflowActionConfig
import java.util.*

/**
 * Configuration for UPDATE_ENTITY action nodes.
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
@Schema(
    name = "WorkflowUpdateEntityActionConfig",
    description = "Configuration for UPDATE_ENTITY action nodes."
)
@JsonTypeName("workflow_update_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowUpdateEntityActionConfig(
    override val version: Int,
    val name: String,
    val config: Map<String, Any?>
) : WorkflowActionConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.UPDATE_ENTITY

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): Map<String, Any?> {
        // Extract inputs (already resolved)
        val entityId = UUID.fromString(inputs["entityId"] as String)
        inputs["payload"] as? Map<*, *> ?: emptyMap<Any, Any>()

        // Get EntityService on-demand
        val entityService = services.service<EntityService>()

        // Get existing entity to determine type
        val existingEntity = entityService.getEntity(entityId)

        // Update entity via EntityService
        val saveRequest = SaveEntityRequest(
            id = entityId,
            payload = emptyMap(), // TODO: Map payload properly in Phase 4.2
            icon = null // TODO: Handle Icon type in Phase 4.2
        )

        val result = entityService.saveEntity(
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
