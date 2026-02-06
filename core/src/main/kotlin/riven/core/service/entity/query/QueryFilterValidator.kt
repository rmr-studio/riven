package riven.core.service.entity.query

import riven.core.exceptions.query.InvalidRelationshipReferenceException
import riven.core.exceptions.query.InvalidTypeBranchException
import riven.core.exceptions.query.QueryFilterException
import riven.core.exceptions.query.RelationshipDepthExceededException
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.query.QueryFilter
import riven.core.models.entity.query.RelationshipCondition
import java.util.*

/**
 * Eager pre-validation pass over the [QueryFilter] tree before SQL generation.
 *
 * Walks the entire filter tree to collect ALL relationship validation errors
 * in a single pass rather than surfacing them one at a time during SQL generation.
 * This gives callers complete diagnostic context upfront.
 *
 * The validator does NOT generate SQL. It only checks structural correctness
 * of relationship references and depth constraints. Errors are collected into
 * a list and returned -- callers decide whether and how to throw.
 *
 * Validations performed:
 * - Relationship IDs exist in the provided definitions map
 * - Relationship traversal depth does not exceed `maxDepth`
 * - TargetTypeMatches branches are recursively validated
 *
 * Usage:
 * ```kotlin
 * val errors = QueryFilterValidator().validate(filter, relationshipDefs, maxDepth = 3)
 * if (errors.isNotEmpty()) {
 *     throw QueryValidationException(errors)
 * }
 * ```
 */
class QueryFilterValidator {

    /**
     * Validates the filter tree for relationship correctness.
     *
     * Walks the entire tree collecting all validation errors. Returns an empty
     * list if the filter is valid. Callers should wrap non-empty results in
     * [riven.core.exceptions.query.QueryValidationException] if they wish to throw.
     *
     * @param filter The root filter to validate
     * @param relationshipDefinitions Pre-loaded map of relationship ID to definition.
     *   Callers build this from `entityType.relationships?.associateBy { it.id }`.
     * @param maxDepth Maximum allowed relationship traversal depth
     * @return List of validation errors (empty if valid)
     */
    fun validate(
        filter: QueryFilter,
        relationshipDefinitions: Map<UUID, EntityRelationshipDefinition>,
        maxDepth: Int,
    ): List<QueryFilterException> {
        val context = ValidationContext(
            relationshipDefinitions = relationshipDefinitions,
            maxDepth = maxDepth,
            errors = mutableListOf(),
        )
        walkFilter(filter, context, relationshipDepth = 0)
        return context.errors
    }

    /**
     * Recursively walks the filter tree dispatching on filter type.
     *
     * @param filter Current filter node
     * @param context Validation context accumulating errors
     * @param relationshipDepth Current relationship traversal depth (increments only on Relationship nodes)
     */
    private fun walkFilter(filter: QueryFilter, context: ValidationContext, relationshipDepth: Int) {
        when (filter) {
            is QueryFilter.Attribute -> {
                // No relationship validation needed for attribute filters
            }

            is QueryFilter.And -> {
                // AND does not increment relationship depth
                for (condition in filter.conditions) {
                    walkFilter(condition, context, relationshipDepth)
                }
            }

            is QueryFilter.Or -> {
                // OR does not increment relationship depth
                for (condition in filter.conditions) {
                    walkFilter(condition, context, relationshipDepth)
                }
            }

            is QueryFilter.Relationship -> {
                // Check depth constraint
                if (relationshipDepth >= context.maxDepth) {
                    context.errors.add(
                        RelationshipDepthExceededException(
                            depth = relationshipDepth + 1,
                            maxDepth = context.maxDepth,
                        )
                    )
                }

                // Look up relationship definition
                val definition = context.relationshipDefinitions[filter.relationshipId]
                if (definition == null) {
                    context.errors.add(
                        InvalidRelationshipReferenceException(
                            relationshipId = filter.relationshipId,
                            reason = "not found in entity type relationship definitions",
                        )
                    )
                }

                // Validate the condition (continue even if definition is null to collect all errors)
                validateCondition(
                    condition = filter.condition,
                    definition = definition,
                    relationshipId = filter.relationshipId,
                    context = context,
                    relationshipDepth = relationshipDepth + 1,
                )
            }
        }
    }

    /**
     * Validates a relationship condition, recursing into nested filters.
     *
     * @param condition The relationship condition to validate
     * @param definition The relationship definition (may be null if lookup failed)
     * @param relationshipId The relationship ID for error context
     * @param context Validation context accumulating errors
     * @param relationshipDepth New relationship depth after entering this relationship
     */
    private fun validateCondition(
        condition: RelationshipCondition,
        definition: EntityRelationshipDefinition?,
        relationshipId: UUID,
        context: ValidationContext,
        relationshipDepth: Int,
    ) {
        when (condition) {
            is RelationshipCondition.Exists -> {
                // No additional validation
            }

            is RelationshipCondition.NotExists -> {
                // No additional validation
            }

            is RelationshipCondition.TargetEquals -> {
                // entityIds validated at model level
            }

            is RelationshipCondition.TargetMatches -> {
                walkFilter(condition.filter, context, relationshipDepth)
            }

            is RelationshipCondition.TargetTypeMatches -> {
                // TODO: Cross-reference branch entityTypeId (UUID) against definition.entityTypeKeys (String keys)
                //  once entity type key-to-ID mapping is available (Phase 5's EntityQueryService will provide this).
                //  For now, we only recurse into branch filters for depth/reference validation.
                for (branch in condition.branches) {
                    if (branch.filter != null) {
                        walkFilter(branch.filter, context, relationshipDepth)
                    }
                }
            }

            is RelationshipCondition.CountMatches -> {
                // Out of scope for Phase 3 -- handled as unsupported at generation time
            }
        }
    }

    /**
     * Internal context for accumulating validation state during tree walk.
     */
    private data class ValidationContext(
        val relationshipDefinitions: Map<UUID, EntityRelationshipDefinition>,
        val maxDepth: Int,
        val errors: MutableList<QueryFilterException>,
    )
}
