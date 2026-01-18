package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.request.entity.SaveEntityRequest
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeExecutionServices
import riven.core.models.workflow.node.config.WorkflowActionConfig
import java.util.*

/**
 * Configuration for CREATE_ENTITY action nodes.
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
@JsonTypeName("workflow_create_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowCreateEntityActionConfig(
    override val version: Int,
    val name: String,
    val config: Map<String, Any?>
) : WorkflowActionConfig {

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
        inputs["payload"] as? Map<*, *> ?: emptyMap<Any, Any>()

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
