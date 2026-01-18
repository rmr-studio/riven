package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.github.oshai.kotlinlogging.KotlinLogging
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeExecutionServices
import riven.core.models.workflow.node.config.WorkflowActionConfig
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * Configuration for QUERY_ENTITY action nodes.
 *
 * ## Configuration
 *
 * Required inputs:
 * - `entityId`: String UUID of the entity to query
 *
 * ## Output
 *
 * Returns map with complete entity data:
 * - `entityId`: UUID of entity
 * - `entityTypeId`: UUID of entity type
 * - `payload`: Map of entity attribute values
 * - `icon`: String icon identifier
 * - `identifier`: String unique identifier
 * - `createdAt`: Timestamp
 * - `updatedAt`: Timestamp
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "entityId": "{{ steps.previous_step.output.clientId }}"
 * }
 * ```
 *
 * This action is commonly used to fetch entity data for use in subsequent steps.
 */
@JsonTypeName("workflow_query_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowQueryEntityActionConfig(
    override val version: Int,
    val name: String,
    val config: Map<String, Any?>
) : WorkflowActionConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.QUERY_ENTITY

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeExecutionServices
    ): Map<String, Any?> {
        // Extract inputs (already resolved)
        val entityId = UUID.fromString(inputs["entityId"] as String)

        log.info { "Querying entity: $entityId" }

        // Fetch entity via EntityService
        val entity = services.entityService.getEntity(entityId)

        // Verify workspace access
        if (entity.workspaceId != context.workspaceId) {
            throw SecurityException("Entity $entityId does not belong to workspace ${context.workspaceId}")
        }

        // Return output with full entity data
        return mapOf(
            "entityId" to entity.id,
            "entityTypeId" to entity.typeId,
            "payload" to entity.payload,
            "icon" to entity.icon,
            "identifier" to entity.identifier,
            "createdAt" to entity.createdAt,
            "updatedAt" to entity.updatedAt
        )
    }
}
