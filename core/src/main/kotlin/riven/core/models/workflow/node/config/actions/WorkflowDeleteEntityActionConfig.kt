package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.github.oshai.kotlinlogging.KotlinLogging
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.config.WorkflowActionConfig
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import riven.core.models.workflow.node.service
import riven.core.service.entity.EntityService
import riven.core.service.workflow.ConfigValidationService
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * Configuration for DELETE_ENTITY action nodes.
 *
 * ## Configuration Properties
 *
 * @property entityId UUID of the entity to delete (template-enabled)
 * @property timeoutSeconds Optional timeout override in seconds
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "version": 1,
 *   "type": "ACTION",
 *   "subType": "DELETE_ENTITY",
 *   "entityId": "{{ steps.find_expired_record.output.entityId }}"
 * }
 * ```
 *
 * ## Output
 *
 * Returns map with:
 * - `entityId`: UUID of deleted entity
 * - `deleted`: Boolean true
 * - `impactedEntities`: Int count of entities affected by cascade
 */
@Schema(
    name = "WorkflowDeleteEntityActionConfig",
    description = "Configuration for DELETE_ENTITY action nodes."
)
@JsonTypeName("workflow_delete_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowDeleteEntityActionConfig(
    override val version: Int = 1,

    @Schema(
        description = "UUID of the entity to delete. Can be a static UUID or template.",
        example = "550e8400-e29b-41d4-a716-446655440000"
    )
    val entityId: String,

    @Schema(
        description = "Optional timeout override in seconds",
        nullable = true
    )
    val timeoutSeconds: Long? = null

) : WorkflowActionConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.DELETE_ENTITY

    /**
     * Returns typed fields as a map for template resolution.
     * Used by WorkflowCoordinationService to resolve templates before execution.
     */
    val config: Map<String, Any?>
        get() = mapOf(
            "entityId" to entityId,
            "timeoutSeconds" to timeoutSeconds
        )

    /**
     * Validates this configuration.
     *
     * Checks:
     * - entityId is valid UUID or template
     * - timeout is non-negative if provided
     */
    fun validate(validationService: ConfigValidationService): ConfigValidationResult {
        return validationService.combine(
            validationService.validateTemplateOrUuid(entityId, "entityId"),
            validationService.validateOptionalDuration(timeoutSeconds, "timeoutSeconds")
        )
    }

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): Map<String, Any?> {
        // Extract resolved inputs
        val resolvedEntityId = UUID.fromString(inputs["entityId"] as String)

        log.info { "Deleting entity: $resolvedEntityId in workspace: ${context.workspaceId}" }

        // Get EntityService on-demand
        val entityService = services.service<EntityService>()

        // Execute deletion via EntityService
        val result = entityService.deleteEntities(
            context.workspaceId,
            listOf(resolvedEntityId)
        )

        // Check for errors
        if (result.error != null) {
            throw IllegalStateException("Failed to delete entity: ${result.error}")
        }

        // Return output
        return mapOf(
            "entityId" to resolvedEntityId,
            "deleted" to true,
            "impactedEntities" to (result.updatedEntities?.size ?: 0)
        )
    }
}
