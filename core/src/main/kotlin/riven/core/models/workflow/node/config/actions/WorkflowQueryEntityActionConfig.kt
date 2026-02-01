package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
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
    val config: Map<String, Any?>
        get() = mapOf(
            "entityTypeId" to query.entityTypeId.toString(),
            "filter" to query.filter,
            "pagination" to pagination,
            "projection" to projection,
            "timeoutSeconds" to timeoutSeconds
        )

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

// =============================================================================
// Query Definition Models
// =============================================================================

/**
 * Core query definition targeting an entity type with optional filters.
 *
 * @property entityTypeId UUID of the entity type/collection to query
 * @property filter Optional filter criteria for narrowing results
 */
@Schema(description = "Core query definition with entity type and optional filter criteria.")
data class EntityQuery(
    @Schema(description = "UUID of the entity type to query.")
    val entityTypeId: UUID,

    @Schema(description = "Optional filter criteria.", nullable = true)
    val filter: QueryFilter? = null
)

// =============================================================================
// Filter Models
// =============================================================================

/**
 * Sealed hierarchy for filter expressions supporting:
 * - Attribute comparisons (Status == "Active", ARR > 100000)
 * - Relationship traversals (has Client, has Client where Client.tier == "Premium")
 * - Logical combinations (AND/OR grouping)
 */
@Schema(
    description = "Filter expression for querying entities.",
    oneOf = [
        QueryFilter.Attribute::class,
        QueryFilter.Relationship::class,
        QueryFilter.And::class,
        QueryFilter.Or::class
    ]
)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    JsonSubTypes.Type(QueryFilter.Attribute::class, name = "ATTRIBUTE"),
    JsonSubTypes.Type(QueryFilter.Relationship::class, name = "RELATIONSHIP"),
    JsonSubTypes.Type(QueryFilter.And::class, name = "AND"),
    JsonSubTypes.Type(QueryFilter.Or::class, name = "OR")
)
sealed interface QueryFilter {

    /**
     * Filter by attribute value comparison.
     *
     * Examples:
     * - Status == "Active"
     * - ARR > 100000
     * - Name CONTAINS "Corp"
     *
     * @property attributeId UUID key of the attribute in the entity schema
     * @property operator Comparison operator to apply
     * @property value Value to compare against (literal or template)
     */
    @Schema(description = "Filter by attribute value comparison.")
    @JsonTypeName("ATTRIBUTE")
    data class Attribute(
        @Schema(description = "UUID key of the attribute in the entity schema.")
        val attributeId: UUID,

        @Schema(description = "Comparison operator to apply.")
        val operator: FilterOperator,

        @Schema(description = "Value to compare against (literal or template expression).")
        val value: FilterValue
    ) : QueryFilter

    /**
     * Filter by relationship existence or with nested conditions on related entities.
     *
     * Examples:
     * - Has any Client relationship
     * - Has Client where Client.tier == "Premium"
     * - Related to specific entity ID
     *
     * @property relationshipId UUID of the relationship definition
     * @property condition How to evaluate the relationship
     */
    @Schema(description = "Filter by relationship to other entities.")
    @JsonTypeName("RELATIONSHIP")
    data class Relationship(
        @Schema(description = "UUID of the relationship definition.")
        val relationshipId: UUID,

        @Schema(description = "Condition to apply on the relationship.")
        val condition: RelationshipCondition
    ) : QueryFilter

    /**
     * Logical AND - all conditions must match.
     *
     * @property conditions List of filters that must all evaluate to true
     */
    @Schema(description = "Logical AND: all conditions must match.")
    @JsonTypeName("AND")
    data class And(
        @Schema(description = "List of conditions that must all match.")
        val conditions: List<QueryFilter>
    ) : QueryFilter

    /**
     * Logical OR - at least one condition must match.
     *
     * @property conditions List of filters where at least one must evaluate to true
     */
    @Schema(description = "Logical OR: at least one condition must match.")
    @JsonTypeName("OR")
    data class Or(
        @Schema(description = "List of conditions where at least one must match.")
        val conditions: List<QueryFilter>
    ) : QueryFilter
}

// =============================================================================
// Relationship Condition Models
// =============================================================================

/**
 * Conditions for relationship filtering.
 *
 * Determines how to evaluate a relationship when filtering entities.
 */
@Schema(
    description = "Condition for evaluating relationships in filters.",
    oneOf = [
        RelationshipCondition.Exists::class,
        RelationshipCondition.NotExists::class,
        RelationshipCondition.TargetEquals::class,
        RelationshipCondition.TargetMatches::class,
        RelationshipCondition.CountMatches::class
    ]
)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    JsonSubTypes.Type(RelationshipCondition.Exists::class, name = "EXISTS"),
    JsonSubTypes.Type(RelationshipCondition.NotExists::class, name = "NOT_EXISTS"),
    JsonSubTypes.Type(RelationshipCondition.TargetEquals::class, name = "TARGET_EQUALS"),
    JsonSubTypes.Type(RelationshipCondition.TargetMatches::class, name = "TARGET_MATCHES"),
    JsonSubTypes.Type(RelationshipCondition.CountMatches::class, name = "COUNT_MATCHES")
)
sealed interface RelationshipCondition {

    /**
     * Entity has at least one related entity via this relationship.
     */
    @Schema(description = "Entity has at least one related entity.")
    @JsonTypeName("EXISTS")
    data object Exists : RelationshipCondition

    /**
     * Entity has no related entities via this relationship.
     */
    @Schema(description = "Entity has no related entities.")
    @JsonTypeName("NOT_EXISTS")
    data object NotExists : RelationshipCondition

    /**
     * Entity is related to one of the specified entity IDs.
     *
     * Supports template expressions for dynamic entity ID resolution.
     *
     * @property entityIds List of entity IDs (UUIDs or template expressions)
     */
    @Schema(description = "Entity is related to one of the specified entities.")
    @JsonTypeName("TARGET_EQUALS")
    data class TargetEquals(
        @Schema(
            description = "List of entity IDs to match. Supports template expressions.",
            example = "[\"550e8400-e29b-41d4-a716-446655440000\", \"{{ steps.lookup.output.entityId }}\"]"
        )
        val entityIds: List<String>
    ) : RelationshipCondition

    /**
     * Related entity satisfies the nested filter criteria.
     *
     * Enables "related to X that has Y" queries by recursively applying
     * filters to the related entities.
     *
     * @property filter Nested filter to apply on related entities
     */
    @Schema(description = "Related entity satisfies nested filter criteria.")
    @JsonTypeName("TARGET_MATCHES")
    data class TargetMatches(
        @Schema(description = "Filter to apply on related entities.")
        val filter: QueryFilter
    ) : RelationshipCondition

    /**
     * Relationship count satisfies the specified condition.
     *
     * Examples:
     * - Has more than 5 related entities
     * - Has exactly 1 related entity
     *
     * @property operator Comparison operator for count
     * @property count Count value to compare against
     */
    @Schema(description = "Relationship count satisfies condition.")
    @JsonTypeName("COUNT_MATCHES")
    data class CountMatches(
        @Schema(description = "Comparison operator for count.")
        val operator: FilterOperator,

        @Schema(description = "Count value to compare against.")
        val count: Int
    ) : RelationshipCondition
}

// =============================================================================
// Filter Value Models
// =============================================================================

/**
 * Filter value supporting both literal values and template expressions.
 *
 * Templates enable dynamic value resolution from workflow context.
 */
@Schema(
    description = "Value for filter comparison - literal or template expression.",
    oneOf = [FilterValue.Literal::class, FilterValue.Template::class]
)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "kind")
@JsonSubTypes(
    JsonSubTypes.Type(FilterValue.Literal::class, name = "LITERAL"),
    JsonSubTypes.Type(FilterValue.Template::class, name = "TEMPLATE")
)
sealed interface FilterValue {

    /**
     * Literal value for direct comparison.
     *
     * @property value The literal value (string, number, boolean, null, or list)
     */
    @Schema(description = "Literal value for comparison.")
    @JsonTypeName("LITERAL")
    data class Literal(
        @Schema(description = "The literal value.", example = "\"Active\"")
        val value: Any?
    ) : FilterValue

    /**
     * Template expression resolved at execution time.
     *
     * @property expression Template string using workflow context syntax
     */
    @Schema(description = "Template expression resolved at execution time.")
    @JsonTypeName("TEMPLATE")
    data class Template(
        @Schema(
            description = "Template expression using workflow context.",
            example = "{{ steps.lookup.output.status }}"
        )
        val expression: String
    ) : FilterValue
}

// =============================================================================
// Filter Operator
// =============================================================================

/**
 * Comparison operators for attribute and count filtering.
 */
@Schema(description = "Comparison operators for filtering.")
enum class FilterOperator {
    /** Exact equality comparison */
    EQUALS,

    /** Inequality comparison */
    NOT_EQUALS,

    /** Greater than (numeric/date) */
    GREATER_THAN,

    /** Greater than or equal (numeric/date) */
    GREATER_THAN_OR_EQUALS,

    /** Less than (numeric/date) */
    LESS_THAN,

    /** Less than or equal (numeric/date) */
    LESS_THAN_OR_EQUALS,

    /** Value is in list */
    IN,

    /** Value is not in list */
    NOT_IN,

    /** String/array contains value */
    CONTAINS,

    /** String/array does not contain value */
    NOT_CONTAINS,

    /** Value is null */
    IS_NULL,

    /** Value is not null */
    IS_NOT_NULL,

    /** String starts with value */
    STARTS_WITH,

    /** String ends with value */
    ENDS_WITH
}

// =============================================================================
// Pagination Models
// =============================================================================

/**
 * Pagination and ordering configuration for query results.
 *
 * @property limit Maximum number of entities to return (default 100)
 * @property offset Number of entities to skip (default 0)
 * @property orderBy Optional list of ordering clauses
 */
@Schema(description = "Pagination and ordering configuration.")
data class QueryPagination(
    @Schema(description = "Maximum number of entities to return.", defaultValue = "100")
    val limit: Int = 100,

    @Schema(description = "Number of entities to skip.", defaultValue = "0")
    val offset: Int = 0,

    @Schema(description = "Optional ordering clauses.", nullable = true)
    val orderBy: List<OrderByClause>? = null
)

/**
 * Single ordering clause for query results.
 *
 * @property attributeId UUID key of the attribute to order by
 * @property direction Sort direction (ASC or DESC)
 */
@Schema(description = "Single ordering clause.")
data class OrderByClause(
    @Schema(description = "UUID key of the attribute to order by.")
    val attributeId: UUID,

    @Schema(description = "Sort direction.", defaultValue = "ASC")
    val direction: SortDirection = SortDirection.ASC
)

/**
 * Sort direction for ordering.
 */
@Schema(description = "Sort direction.")
enum class SortDirection {
    /** Ascending order (A-Z, 0-9, oldest first) */
    ASC,

    /** Descending order (Z-A, 9-0, newest first) */
    DESC
}

// =============================================================================
// Projection Models
// =============================================================================

/**
 * Field selection for query results.
 *
 * Controls which attributes and relationships are included in returned entities.
 *
 * @property includeAttributes Specific attribute UUIDs to include (null = all)
 * @property includeRelationships Specific relationship UUIDs to include (null = all)
 * @property expandRelationships Whether to hydrate related entities
 */
@Schema(description = "Field selection for query results.")
data class QueryProjection(
    @Schema(
        description = "Specific attribute UUIDs to include. Null includes all.",
        nullable = true
    )
    val includeAttributes: List<UUID>? = null,

    @Schema(
        description = "Specific relationship UUIDs to include. Null includes all.",
        nullable = true
    )
    val includeRelationships: List<UUID>? = null,

    @Schema(
        description = "Whether to hydrate related entities.",
        defaultValue = "false"
    )
    val expandRelationships: Boolean = false
)
