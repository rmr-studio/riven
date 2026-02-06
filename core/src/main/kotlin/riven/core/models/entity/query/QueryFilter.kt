package riven.core.models.entity.query

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import java.util.*

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
