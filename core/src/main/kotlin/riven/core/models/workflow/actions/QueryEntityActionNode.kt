package riven.core.models.workflow.actions

import io.github.oshai.kotlinlogging.KotlinLogging
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.workflow.NodeExecutionServices
import riven.core.models.workflow.WorkflowActionNode
import riven.core.models.workflow.environment.WorkflowExecutionContext
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * Action node for querying/fetching entities.
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
data class QueryEntityActionNode(
    override val id: UUID,
    override val version: Int,
    val name: String,
    val config: Map<String, Any?>
) : WorkflowActionNode {

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
