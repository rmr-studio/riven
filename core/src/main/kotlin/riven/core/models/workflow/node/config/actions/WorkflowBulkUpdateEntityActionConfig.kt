package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.common.icon.IconType
import riven.core.enums.workflow.BulkUpdateErrorHandling
import riven.core.enums.workflow.OutputFieldType
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeConfigFieldType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.entity.query.EntityQuery
import riven.core.models.entity.query.filter.FilterValue
import riven.core.models.entity.query.filter.QueryFilter
import riven.core.models.entity.query.filter.RelationshipFilter
import riven.core.models.entity.query.pagination.QueryPagination
import riven.core.models.workflow.engine.state.NodeOutput
import riven.core.models.workflow.engine.state.WorkflowDataStore
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.config.WorkflowActionConfig
import riven.core.models.workflow.node.config.WorkflowNodeConfigField
import riven.core.models.workflow.node.config.WorkflowNodeOutputField
import riven.core.models.workflow.node.config.WorkflowNodeOutputMetadata
import riven.core.models.workflow.node.config.WorkflowNodeTypeMetadata
import riven.core.models.workflow.node.config.validation.ConfigValidationError
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import riven.core.models.workflow.node.service
import riven.core.service.workflow.state.WorkflowNodeConfigValidationService

/**
 * Configuration for BULK_UPDATE_ENTITY action nodes.
 *
 * Applies identical field updates to all entities matching a query.
 *
 * ## Configuration Properties
 *
 * @property query Embedded query definition to find entities for bulk update
 * @property payload Map of attribute updates to apply to each matching entity (template-enabled values)
 * @property errorHandling Error handling mode (FAIL_FAST or BEST_EFFORT)
 * @property pagination Optional pagination for the embedded query
 * @property timeoutSeconds Optional timeout override in seconds
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "version": 1,
 *   "type": "ACTION",
 *   "subType": "BULK_UPDATE_ENTITY",
 *   "query": {
 *     "entityTypeId": "client-type-uuid",
 *     "filter": {
 *       "type": "ATTRIBUTE",
 *       "attributeId": "status-uuid",
 *       "operator": "EQUALS",
 *       "value": { "kind": "LITERAL", "value": "Pending" }
 *     }
 *   },
 *   "payload": {
 *     "status-uuid": "Active",
 *     "updated-by-uuid": "{{ trigger.userId }}"
 *   },
 *   "errorHandling": "BEST_EFFORT"
 * }
 * ```
 *
 * ## Output
 *
 * Returns map with:
 * - `entitiesUpdated`: Count of entities successfully updated
 * - `entitiesFailed`: Count of entities that failed to update
 * - `failedEntityDetails`: List of failed entity IDs with error messages
 * - `totalProcessed`: Total entities attempted
 */
@Schema(
    name = "WorkflowBulkUpdateEntityActionConfig",
    description = "Configuration for BULK_UPDATE_ENTITY action nodes that apply identical field updates to all entities matching a query."
)
@JsonTypeName("workflow_bulk_update_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowBulkUpdateEntityActionConfig(
    override val version: Int = 1,

    @param:Schema(
        description = "Query to find entities for bulk update. Self-contained query configuration."
    )
    val query: EntityQuery,

    @param:Schema(
        description = "Map of attribute updates to apply to each matching entity. Keys are attribute UUID strings, values support templates.",
        example = """{"attr-uuid": "New Value", "status-uuid": "{{ steps.x.output.status }}"}"""
    )
    val payload: Map<String, String> = emptyMap(),

    @param:Schema(
        description = "Error handling mode for individual entity update failures.",
        defaultValue = "FAIL_FAST"
    )
    val errorHandling: BulkUpdateErrorHandling = BulkUpdateErrorHandling.FAIL_FAST,

    @param:Schema(
        description = "Optional pagination for the embedded query to limit entities processed.",
        nullable = true
    )
    val pagination: QueryPagination? = null,

    @param:Schema(
        description = "Optional timeout override in seconds.",
        nullable = true
    )
    val timeoutSeconds: Long? = null

) : WorkflowActionConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.BULK_UPDATE_ENTITY

    /**
     * Returns typed fields as a map for template resolution.
     * Used by WorkflowCoordinationService to resolve templates before execution.
     */
    override val config: Map<String, Any?>
        get() = mapOf(
            "entityTypeId" to query.entityTypeId.toString(),
            "filter" to query.filter,
            "payload" to payload,
            "errorHandling" to errorHandling.name,
            "pagination" to pagination,
            "timeoutSeconds" to timeoutSeconds
        )

    override val configSchema: List<WorkflowNodeConfigField>
        get() = Companion.configSchema

    companion object {
        val metadata = WorkflowNodeTypeMetadata(
            label = "Bulk Update Entities",
            description = "Applies identical updates to all entities matching a query",
            icon = IconType.LAYERS,
            category = WorkflowNodeType.ACTION
        )

        val configSchema: List<WorkflowNodeConfigField> = listOf(
            WorkflowNodeConfigField(
                key = "query",
                label = "Entity Query",
                type = WorkflowNodeConfigFieldType.ENTITY_QUERY,
                required = true,
                description = "Query to find entities for bulk update"
            ),
            WorkflowNodeConfigField(
                key = "payload",
                label = "Payload",
                type = WorkflowNodeConfigFieldType.KEY_VALUE,
                required = true,
                description = "Map of attribute updates to apply to each entity"
            ),
            WorkflowNodeConfigField(
                key = "errorHandling",
                label = "Error Handling",
                type = WorkflowNodeConfigFieldType.ENUM,
                required = true,
                description = "How to handle individual entity update failures"
            ),
            WorkflowNodeConfigField(
                key = "pagination",
                label = "Pagination",
                type = WorkflowNodeConfigFieldType.JSON,
                required = false,
                description = "Optional pagination to limit entities processed"
            ),
            WorkflowNodeConfigField(
                key = "timeoutSeconds",
                label = "Timeout (seconds)",
                type = WorkflowNodeConfigFieldType.DURATION,
                required = false,
                description = "Optional timeout override in seconds"
            )
        )

        val outputMetadata = WorkflowNodeOutputMetadata(
            fields = listOf(
                WorkflowNodeOutputField(
                    key = "entitiesUpdated",
                    label = "Entities Updated",
                    type = OutputFieldType.NUMBER,
                    description = "Count of entities successfully updated",
                    exampleValue = 25
                ),
                WorkflowNodeOutputField(
                    key = "entitiesFailed",
                    label = "Entities Failed",
                    type = OutputFieldType.NUMBER,
                    description = "Count of entities that failed to update",
                    exampleValue = 0
                ),
                WorkflowNodeOutputField(
                    key = "failedEntityDetails",
                    label = "Failed Entity Details",
                    type = OutputFieldType.LIST,
                    description = "Details of failed entity updates with entityId and error",
                    exampleValue = emptyList<Map<String, Any?>>()
                ),
                WorkflowNodeOutputField(
                    key = "totalProcessed",
                    label = "Total Processed",
                    type = OutputFieldType.NUMBER,
                    description = "Total entities attempted",
                    exampleValue = 25
                )
            )
        )
    }

    /**
     * Validates this configuration.
     *
     * Checks:
     * - query.filter structure is valid (recursive validation)
     * - payload values have valid template syntax
     * - pagination values are non-negative if present
     * - timeout is non-negative if provided
     *
     * @param injector Spring managed provider to inject services into model
     * @return Validation result with any errors
     */
    override fun validate(injector: NodeServiceProvider): ConfigValidationResult {
        val validationService = injector.service<WorkflowNodeConfigValidationService>()
        val errors = mutableListOf<ConfigValidationError>()

        // Validate filter if present
        query.filter?.let { filter ->
            errors.addAll(validateFilter(filter, "query.filter", validationService))
        }

        // Validate payload templates
        errors.addAll(validationService.validateTemplateMap(payload, "payload"))

        // Validate pagination if present
        pagination?.let { paging ->
            if (paging.limit < 0) {
                errors.add(ConfigValidationError("pagination.limit", "Limit must be non-negative"))
            }
            if (paging.offset < 0) {
                errors.add(ConfigValidationError("pagination.offset", "Offset must be non-negative"))
            }
        }

        // Validate timeout
        errors.addAll(validationService.validateOptionalDuration(timeoutSeconds, "timeoutSeconds"))

        return ConfigValidationResult(errors)
    }

    /**
     * Recursively validates a QueryFilter structure.
     *
     * Walks the filter tree validating FilterValue.Template syntax and
     * RelationshipFilter conditions at each level.
     */
    private fun validateFilter(
        filter: QueryFilter,
        path: String,
        validationService: WorkflowNodeConfigValidationService
    ): List<ConfigValidationError> {
        return when (filter) {
            is QueryFilter.Attribute -> {
                validateFilterValue(filter.value, "$path.value", validationService)
            }

            is QueryFilter.Relationship -> {
                validateRelationshipCondition(filter.condition, "$path.condition", validationService)
            }

            is QueryFilter.And -> {
                if (filter.conditions.isEmpty()) {
                    listOf(ConfigValidationError(path, "AND filter must have at least one condition"))
                } else {
                    filter.conditions.flatMapIndexed { index, condition ->
                        validateFilter(condition, "$path.conditions[$index]", validationService)
                    }
                }
            }

            is QueryFilter.Or -> {
                if (filter.conditions.isEmpty()) {
                    listOf(ConfigValidationError(path, "OR filter must have at least one condition"))
                } else {
                    filter.conditions.flatMapIndexed { index, condition ->
                        validateFilter(condition, "$path.conditions[$index]", validationService)
                    }
                }
            }
        }
    }

    /**
     * Validates a FilterValue (literal or template).
     */
    private fun validateFilterValue(
        value: FilterValue,
        path: String,
        validationService: WorkflowNodeConfigValidationService
    ): List<ConfigValidationError> {
        return when (value) {
            is FilterValue.Literal -> emptyList()
            is FilterValue.Template -> validationService.validateTemplateSyntax(value.expression, path)
        }
    }

    /**
     * Validates a RelationshipFilter condition.
     */
    private fun validateRelationshipCondition(
        condition: RelationshipFilter,
        path: String,
        validationService: WorkflowNodeConfigValidationService
    ): List<ConfigValidationError> {
        return when (condition) {
            is RelationshipFilter.Exists -> emptyList()
            is RelationshipFilter.NotExists -> emptyList()

            is RelationshipFilter.TargetEquals -> {
                if (condition.entityIds.isEmpty()) {
                    listOf(ConfigValidationError(path, "TARGET_EQUALS must specify at least one entity ID"))
                } else {
                    condition.entityIds.flatMapIndexed { index, id ->
                        validationService.validateTemplateOrUuid(id, "$path.entityIds[$index]")
                    }
                }
            }

            is RelationshipFilter.TargetMatches -> {
                validateFilter(condition.filter, "$path.filter", validationService)
            }

            is RelationshipFilter.TargetTypeMatches -> {
                if (condition.branches.isEmpty()) {
                    listOf(ConfigValidationError(path, "TARGET_TYPE_MATCHES must specify at least one branch"))
                } else {
                    condition.branches.flatMapIndexed { index, branch ->
                        branch.filter?.let { validateFilter(it, "$path.branches[$index].filter", validationService) }
                            ?: emptyList()
                    }
                }
            }

            is RelationshipFilter.CountMatches -> {
                if (condition.count < 0) {
                    listOf(ConfigValidationError(path, "Count must be non-negative"))
                } else {
                    emptyList()
                }
            }
        }
    }

    override fun execute(
        dataStore: WorkflowDataStore,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): NodeOutput {
        throw NotImplementedError(
            "BULK_UPDATE_ENTITY execution is implemented in Plan 03. " +
            "Query: ${query.entityTypeId}, ErrorHandling: $errorHandling"
        )
    }
}
