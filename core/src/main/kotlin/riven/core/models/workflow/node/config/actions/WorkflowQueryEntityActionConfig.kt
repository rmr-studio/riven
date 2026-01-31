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
import riven.core.service.workflow.state.WorkflowNodeConfigValidationService
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * Configuration for QUERY_ENTITY action nodes.
 *
 * ## Configuration Properties
 *
 * @property entityId UUID of the entity to query (template-enabled)
 * @property timeoutSeconds Optional timeout override in seconds
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "version": 1,
 *   "type": "ACTION",
 *   "subType": "QUERY_ENTITY",
 *   "entityId": "{{ steps.previous_step.output.clientId }}"
 * }
 * ```
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
 */
@Schema(
    name = "WorkflowQueryEntityActionConfig",
    description = "Configuration for QUERY_ENTITY action nodes."
)
@JsonTypeName("workflow_query_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowQueryEntityActionConfig(
    override val version: Int = 1,

    @Schema(
        description = "UUID of the entity to query. Can be a static UUID or template.",
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
        get() = WorkflowActionType.QUERY_ENTITY

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
    fun validate(validationService: WorkflowNodeConfigValidationService): ConfigValidationResult {
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

        log.info { "Querying entity: $resolvedEntityId" }

        // Get EntityService on-demand
        val entityService: EntityService = services.service<EntityService>()

        // Fetch entity via EntityService
        val entity = entityService.getEntity(resolvedEntityId)

        // Verify workspace access
        if (entity.workspaceId != context.workspaceId) {
            throw SecurityException("Entity $resolvedEntityId does not belong to workspace ${context.workspaceId}")
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
