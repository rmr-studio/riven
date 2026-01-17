package riven.core.models.workflow.actions

import io.github.oshai.kotlinlogging.KotlinLogging
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.workflow.NodeExecutionServices
import riven.core.models.workflow.WorkflowActionNode
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * Action node for deleting entities.
 *
 * ## Configuration
 *
 * Required inputs:
 * - `entityId`: String UUID of the entity to delete
 *
 * ## Output
 *
 * Returns map with:
 * - `entityId`: UUID of deleted entity
 * - `deleted`: Boolean true
 * - `impactedEntities`: Int count of entities affected by cascade
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "entityId": "{{ steps.find_expired_record.output.entityId }}"
 * }
 * ```
 *
 * ## Error Handling
 *
 * Throws IllegalStateException if deletion fails.
 */
data class DeleteEntityActionNode(
    override val id: UUID,
    override val version: Int,
    val name: String,
    val config: Map<String, Any?>
) : WorkflowActionNode {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.DELETE_ENTITY

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeExecutionServices
    ): Map<String, Any?> {
        // Extract inputs (already resolved)
        val entityId = UUID.fromString(inputs["entityId"] as String)

        log.info { "Deleting entity: $entityId in workspace: ${context.workspaceId}" }

        // Execute deletion via EntityService
        val result = services.entityService.deleteEntities(
            context.workspaceId,
            listOf(entityId)
        )

        // Check for errors
        if (result.error != null) {
            throw IllegalStateException("Failed to delete entity: ${result.error}")
        }

        // Return output
        return mapOf(
            "entityId" to entityId,
            "deleted" to true,
            "impactedEntities" to (result.updatedEntities?.size ?: 0)
        )
    }
}
