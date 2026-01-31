package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.models.entity.payload.EntityAttributeRequest
import riven.core.models.request.entity.SaveEntityRequest
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.config.WorkflowActionConfig
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import riven.core.models.workflow.node.service
import riven.core.service.entity.EntityService
import riven.core.service.workflow.state.WorkflowNodeConfigValidationService
import java.util.*

/**
 * Configuration for UPDATE_ENTITY action nodes.
 *
 * ## Configuration Properties
 *
 * @property entityId UUID of the entity to update (template-enabled)
 * @property payload Map of attribute values to update (template-enabled values)
 * @property timeoutSeconds Optional timeout override in seconds
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "version": 1,
 *   "type": "ACTION",
 *   "subType": "UPDATE_ENTITY",
 *   "entityId": "{{ steps.find_client.output.entityId }}",
 *   "payload": {
 *     "status": "active",
 *     "lastContacted": "{{ steps.get_timestamp.output.now }}"
 *   }
 * }
 * ```
 *
 * ## Output
 *
 * Returns map with:
 * - `entityId`: UUID of updated entity
 * - `updated`: Boolean true
 * - `payload`: Map of entity data after update
 */
@Schema(
    name = "WorkflowUpdateEntityActionConfig",
    description = "Configuration for UPDATE_ENTITY action nodes."
)
@JsonTypeName("workflow_update_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowUpdateEntityActionConfig(
    override val version: Int = 1,

    @Schema(
        description = "UUID of the entity to update. Can be a static UUID or template like {{ steps.x.output.entityId }}",
        example = "550e8400-e29b-41d4-a716-446655440000"
    )
    val entityId: String,

    @Schema(
        description = "Map of attribute key to value to update. Values can be templates.",
        example = """{"status": "active", "name": "{{ steps.fetch.output.name }}"}"""
    )
    val payload: Map<String, String> = emptyMap(),

    @Schema(
        description = "Optional timeout override in seconds",
        nullable = true
    )
    val timeoutSeconds: Long? = null

) : WorkflowActionConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.UPDATE_ENTITY

    /**
     * Returns typed fields as a map for template resolution.
     * Used by WorkflowCoordinationService to resolve templates before execution.
     */
    val config: Map<String, Any?>
        get() = mapOf(
            "entityId" to entityId,
            "payload" to payload,
            "timeoutSeconds" to timeoutSeconds
        )

    /**
     * Validates this configuration.
     *
     * Checks:
     * - entityId is valid UUID or template
     * - payload values have valid template syntax
     * - timeout is non-negative if provided
     */
    fun validate(validationService: WorkflowNodeConfigValidationService): ConfigValidationResult {
        return validationService.combine(
            validationService.validateTemplateOrUuid(entityId, "entityId"),
            validationService.validateTemplateMap(payload, "payload"),
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
        val resolvedPayload = inputs["payload"] as? Map<*, *> ?: emptyMap<String, Any?>()

        // Get EntityService on-demand
        val entityService = services.service<EntityService>()

        // Get existing entity to determine type
        val existingEntity = entityService.getEntity(resolvedEntityId)

        // Map resolved payload to proper format
        // Keys are UUID strings representing attribute IDs, values are the resolved data
        // Wrap each value in EntityAttributeRequest with TEXT schema type
        // TODO: Infer schema type from entity type schema for proper typing
        @Suppress("UNCHECKED_CAST")
        val entityPayload = resolvedPayload.mapKeys { (key, _) ->
            UUID.fromString(key as String)
        }.mapValues { (_, value) ->
            EntityAttributeRequest(
                EntityAttributePrimitivePayload(
                    value = value,
                    schemaType = SchemaType.TEXT  // Default to TEXT, infer from schema later
                )
            )
        }

        // Update entity via EntityService
        val saveRequest = SaveEntityRequest(
            id = resolvedEntityId,
            payload = entityPayload,
            icon = null
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
