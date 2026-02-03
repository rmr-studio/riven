package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.github.oshai.kotlinlogging.KotlinLogging
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeConfigFieldType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.entity.query.EntityQuery
import riven.core.models.entity.query.FilterOperator
import riven.core.models.entity.query.FilterValue
import riven.core.models.entity.query.OrderByClause
import riven.core.models.entity.query.QueryFilter
import riven.core.models.entity.query.QueryPagination
import riven.core.models.entity.query.QueryProjection
import riven.core.models.entity.query.RelationshipCondition
import riven.core.models.entity.query.SortDirection
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.config.WorkflowActionConfig
import riven.core.models.workflow.node.config.WorkflowNodeConfigField
import riven.core.models.workflow.node.config.validation.ConfigValidationResult
import riven.core.models.workflow.node.service
import riven.core.models.workflow.node.config.validation.ConfigValidationError
import riven.core.service.workflow.state.WorkflowNodeConfigValidationService
import java.util.*

private val log = KotlinLogging.logger {}

/**
 * Configuration for QUERY_ENTITY action nodes.
 *
 * Queries entities of a specific type with optional filtering by attributes and relationships.
 *
 * ## Configuration Properties
 *
 * @property query Core query definition with entity type, workspace, and optional filters
 * @property pagination Optional pagination and ordering configuration
 * @property projection Optional field selection for results
 * @property timeoutSeconds Optional timeout override in seconds
 *
 * ## Example Configurations
 *
 * ### Simple attribute filter (Status == "Active"):
 * ```json
 * {
 *   "version": 1,
 *   "type": "ACTION",
 *   "subType": "QUERY_ENTITY",
 *   "query": {
 *     "entityTypeId": "client-type-uuid",
 *     "filter": {
 *       "type": "ATTRIBUTE",
 *       "attributeId": "status-uuid",
 *       "operator": "EQUALS",
 *       "value": { "kind": "LITERAL", "value": "Active" }
 *     }
 *   }
 * }
 * ```
 *
 * ### Compound filter (Status == "Active" AND ARR > 100000):
 * ```json
 * {
 *   "query": {
 *     "entityTypeId": "client-type-uuid",
 *     "filter": {
 *       "type": "AND",
 *       "conditions": [
 *         {
 *           "type": "ATTRIBUTE",
 *           "attributeId": "status-uuid",
 *           "operator": "EQUALS",
 *           "value": { "kind": "LITERAL", "value": "Active" }
 *         },
 *         {
 *           "type": "ATTRIBUTE",
 *           "attributeId": "arr-uuid",
 *           "operator": "GREATER_THAN",
 *           "value": { "kind": "LITERAL", "value": 100000 }
 *         }
 *       ]
 *     }
 *   }
 * }
 * ```
 *
 * ### Relationship filter (Projects related to a specific Client):
 * ```json
 * {
 *   "query": {
 *     "entityTypeId": "project-type-uuid",
 *     "filter": {
 *       "type": "RELATIONSHIP",
 *       "relationshipId": "client-relationship-uuid",
 *       "condition": {
 *         "type": "TARGET_EQUALS",
 *         "entityIds": ["{{ trigger.input.clientId }}"]
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * ### Nested relationship filter (Projects with Premium Clients):
 * ```json
 * {
 *   "query": {
 *     "entityTypeId": "project-type-uuid",
 *     "filter": {
 *       "type": "RELATIONSHIP",
 *       "relationshipId": "client-relationship-uuid",
 *       "condition": {
 *         "type": "TARGET_MATCHES",
 *         "filter": {
 *           "type": "ATTRIBUTE",
 *           "attributeId": "client-tier-uuid",
 *           "operator": "EQUALS",
 *           "value": { "kind": "LITERAL", "value": "Premium" }
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * ## Output
 *
 * Returns map with:
 * - `entities`: List of matching entities with payload, icon, identifier, timestamps
 * - `totalCount`: Total number of matching entities (before pagination)
 * - `hasMore`: Boolean indicating if more results exist beyond current page
 */
@Schema(
    name = "WorkflowQueryEntityActionConfig",
    description = "Configuration for QUERY_ENTITY action nodes that query entities by type with filtering."
)
@JsonTypeName("workflow_query_entity_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowQueryEntityActionConfig(
    override val version: Int = 1,

    @param:Schema(
        description = "Core query definition with entity type, workspace scope, and optional filters."
    )
    val query: EntityQuery,

    @param:Schema(
        description = "Optional pagination and ordering configuration.",
        nullable = true
    )
    val pagination: QueryPagination? = null,

    @param:Schema(
        description = "Optional field selection for query results.",
        nullable = true
    )
    val projection: QueryProjection? = null,

    @param:Schema(
        description = "Optional timeout override in seconds.",
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
    override val config: Map<String, Any?>
        get() = mapOf(
            "entityTypeId" to query.entityTypeId.toString(),
            "filter" to query.filter,
            "pagination" to pagination,
            "projection" to projection,
            "timeoutSeconds" to timeoutSeconds
        )

    override val configSchema: List<WorkflowNodeConfigField>
        get() = Companion.configSchema

    companion object {
        val configSchema: List<WorkflowNodeConfigField> = listOf(
            WorkflowNodeConfigField(
                key = "query",
                label = "Entity Query",
                type = WorkflowNodeConfigFieldType.ENTITY_QUERY,
                required = true,
                description = "Query definition with entity type and optional filters"
            ),
            WorkflowNodeConfigField(
                key = "pagination",
                label = "Pagination",
                type = WorkflowNodeConfigFieldType.JSON,
                required = false,
                description = "Pagination and ordering configuration"
            ),
            WorkflowNodeConfigField(
                key = "projection",
                label = "Projection",
                type = WorkflowNodeConfigFieldType.JSON,
                required = false,
                description = "Field selection for query results"
            ),
            WorkflowNodeConfigField(
                key = "timeoutSeconds",
                label = "Timeout (seconds)",
                type = WorkflowNodeConfigFieldType.DURATION,
                required = false,
                description = "Optional timeout override in seconds"
            )
        )
    }

    /**
     * Validates this configuration.
     *
     * Checks:
     * - entityTypeId is valid UUID
     * - filter structure is valid (recursive validation)
     * - pagination values are non-negative
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

    private fun validateRelationshipCondition(
        condition: RelationshipCondition,
        path: String,
        validationService: WorkflowNodeConfigValidationService
    ): List<ConfigValidationError> {
        return when (condition) {
            is RelationshipCondition.Exists -> emptyList()
            is RelationshipCondition.NotExists -> emptyList()

            is RelationshipCondition.TargetEquals -> {
                if (condition.entityIds.isEmpty()) {
                    listOf(ConfigValidationError(path, "TARGET_EQUALS must specify at least one entity ID"))
                } else {
                    condition.entityIds.flatMapIndexed { index, id ->
                        validationService.validateTemplateOrUuid(id, "$path.entityIds[$index]")
                    }
                }
            }

            is RelationshipCondition.TargetMatches -> {
                validateFilter(condition.filter, "$path.filter", validationService)
            }

            is RelationshipCondition.TargetTypeMatches -> {
                if (condition.branches.isEmpty()) {
                    listOf(ConfigValidationError(path, "TARGET_TYPE_MATCHES must specify at least one branch"))
                } else {
                    condition.branches.flatMapIndexed { index, branch ->
                        branch.filter?.let { validateFilter(it, "$path.branches[$index].filter", validationService) }
                            ?: emptyList()
                    }
                }
            }

            is RelationshipCondition.CountMatches -> {
                if (condition.count < 0) {
                    listOf(ConfigValidationError(path, "Count must be non-negative"))
                } else {
                    emptyList()
                }
            }
        }
    }

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): Map<String, Any?> {
        log.info { "Executing QUERY_ENTITY for type: ${query.entityTypeId}" }

        // TODO: Implement query execution via EntityQueryService
        // This will need:
        // 1. Resolve any template values in filters
        // 2. Build query criteria from filter structure
        // 3. Execute query against entity repository
        // 4. Apply pagination and projection
        // 5. Return results

        throw NotImplementedError(
            "QUERY_ENTITY execution requires EntityQueryService implementation. " +
                "Filter: ${query.filter}, Pagination: $pagination"
        )
    }
}
