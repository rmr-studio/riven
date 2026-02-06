package riven.core.models.entity.query

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import java.util.*

/**
 * Branch for type-aware filtering in polymorphic relationships.
 *
 * @property entityTypeId UUID of the entity type this branch matches
 * @property filter Optional filter to apply to entities of this type (null = match any)
 */
@Schema(description = "Type branch for polymorphic relationship filtering.")
data class TypeBranch(
    @Schema(description = "UUID of the entity type this branch matches.")
    val entityTypeId: UUID,

    @Schema(description = "Optional filter to apply to entities of this type.", nullable = true)
    val filter: QueryFilter? = null
)

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
        RelationshipCondition.TargetTypeMatches::class,
        RelationshipCondition.CountMatches::class
    ]
)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    JsonSubTypes.Type(RelationshipCondition.Exists::class, name = "EXISTS"),
    JsonSubTypes.Type(RelationshipCondition.NotExists::class, name = "NOT_EXISTS"),
    JsonSubTypes.Type(RelationshipCondition.TargetEquals::class, name = "TARGET_EQUALS"),
    JsonSubTypes.Type(RelationshipCondition.TargetMatches::class, name = "TARGET_MATCHES"),
    JsonSubTypes.Type(RelationshipCondition.TargetTypeMatches::class, name = "TARGET_TYPE_MATCHES"),
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
     * Type-aware filtering for polymorphic relationships.
     *
     * Matches if the related entity's type matches any branch AND
     * satisfies that branch's optional filter (OR semantics across branches).
     *
     * @property branches List of type-specific filter branches (at least one required)
     */
    @Schema(description = "Type-aware filtering for polymorphic relationships.")
    @JsonTypeName("TARGET_TYPE_MATCHES")
    data class TargetTypeMatches(
        @Schema(description = "Type-specific filter branches. At least one required.")
        val branches: List<TypeBranch>
    ) : RelationshipCondition {
        init {
            require(branches.isNotEmpty()) { "TargetTypeMatches requires at least one branch" }
        }
    }

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
