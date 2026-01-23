package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.github.oshai.kotlinlogging.KotlinLogging
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.service
import riven.core.models.workflow.node.config.WorkflowActionConfig
import riven.core.service.entity.EntityService
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * Configuration for DELETE_ENTITY action nodes.
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
@JsonTypeName("workflow_delete_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowDeleteEntityActionConfig(
    override val version: Int,
    val name: String,
    val config: Map<String, Any?>
) : WorkflowActionConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.DELETE_ENTITY

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): Map<String, Any?> {
        // Extract inputs (already resolved)
        val entityId = UUID.fromString(inputs["entityId"] as String)

        log.info { "Deleting entity: $entityId in workspace: ${context.workspaceId}" }

        // Get EntityService on-demand
        val entityService = services.service<EntityService>()

        // Execute deletion via EntityService
        val result = entityService.deleteEntities(
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
