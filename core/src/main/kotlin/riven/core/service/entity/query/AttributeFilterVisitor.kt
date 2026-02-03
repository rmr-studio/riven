package riven.core.service.entity.query

import riven.core.exceptions.query.FilterNestingDepthExceededException
import riven.core.models.entity.query.FilterValue
import riven.core.models.entity.query.QueryFilter

/**
 * Visitor that traverses [QueryFilter] trees and produces [SqlFragment] output.
 *
 * This visitor handles the conversion of filter expressions into executable SQL:
 * - AND/OR logical combinations with arbitrary nesting
 * - ATTRIBUTE filters delegated to [AttributeSqlGenerator]
 * - RELATIONSHIP filters (Phase 3 placeholder)
 *
 * ## Depth Limit Enforcement
 *
 * To prevent excessive SQL complexity and potential performance issues,
 * the visitor enforces a maximum nesting depth. Filters exceeding this depth
 * throw [FilterNestingDepthExceededException].
 *
 * ## Template Resolution
 *
 * Template expressions ([FilterValue.Template]) must be resolved by the caller
 * before invoking the visitor. Unresolved templates throw [IllegalStateException].
 * This separation of concerns keeps the query layer focused on SQL generation
 * while template resolution is handled by the workflow layer.
 *
 * ## Example Usage
 *
 * ```kotlin
 * val visitor = AttributeFilterVisitor(attributeSqlGenerator)
 * val paramGen = ParameterNameGenerator()
 *
 * val filter = QueryFilter.And(listOf(
 *     QueryFilter.Attribute(statusId, EQUALS, FilterValue.Literal("Active")),
 *     QueryFilter.Attribute(tierId, EQUALS, FilterValue.Literal("Premium"))
 * ))
 *
 * val fragment = visitor.visit(filter, paramGen)
 * // fragment.sql = "(e.payload @> :eq_0::jsonb) AND (e.payload @> :eq_1::jsonb)"
 * ```
 *
 * @property attributeSqlGenerator Generator for ATTRIBUTE filter SQL fragments
 * @property maxNestingDepth Maximum allowed nesting depth for AND/OR combinations
 */
class AttributeFilterVisitor(
    private val attributeSqlGenerator: AttributeSqlGenerator,
    private val maxNestingDepth: Int = DEFAULT_MAX_NESTING_DEPTH
) {

    /**
     * Visits a filter tree and produces a SQL fragment.
     *
     * Entry point for filter tree traversal. Creates internal depth tracking
     * and delegates to the recursive visitor implementation.
     *
     * @param filter Root filter expression to visit
     * @param paramGen Generator for unique parameter names (shared across the query)
     * @return SqlFragment with parameterized SQL and bound values
     * @throws FilterNestingDepthExceededException if nesting exceeds [maxNestingDepth]
     * @throws IllegalStateException if unresolved template expressions are encountered
     */
    fun visit(filter: QueryFilter, paramGen: ParameterNameGenerator): SqlFragment {
        return visitInternal(filter, depth = 0, paramGen)
    }

    /**
     * Internal recursive visitor with depth tracking.
     *
     * Dispatches to type-specific handlers based on the filter variant.
     * Depth is incremented when descending into AND/OR conditions.
     */
    private fun visitInternal(
        filter: QueryFilter,
        depth: Int,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        if (depth > maxNestingDepth) {
            throw FilterNestingDepthExceededException(depth, maxNestingDepth)
        }

        return when (filter) {
            is QueryFilter.Attribute -> visitAttribute(filter, paramGen)
            is QueryFilter.Relationship -> visitRelationship(filter, paramGen)
            is QueryFilter.And -> visitAnd(filter.conditions, depth, paramGen)
            is QueryFilter.Or -> visitOr(filter.conditions, depth, paramGen)
        }
    }

    /**
     * Visits an AND combination of filters.
     *
     * All conditions must match for the combined fragment to match.
     * Empty AND returns [SqlFragment.ALWAYS_TRUE] (vacuous truth).
     *
     * @param conditions List of filters to combine with AND logic
     * @param depth Current nesting depth
     * @param paramGen Parameter name generator
     * @return Combined SQL fragment with AND logic
     */
    private fun visitAnd(
        conditions: List<QueryFilter>,
        depth: Int,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        if (conditions.isEmpty()) {
            return SqlFragment.ALWAYS_TRUE
        }

        return conditions
            .map { visitInternal(it, depth + 1, paramGen) }
            .reduce { acc, fragment -> acc.and(fragment) }
    }

    /**
     * Visits an OR combination of filters.
     *
     * Any matching condition causes the combined fragment to match.
     * Empty OR returns [SqlFragment.ALWAYS_FALSE] (no match possible).
     *
     * @param conditions List of filters to combine with OR logic
     * @param depth Current nesting depth
     * @param paramGen Parameter name generator
     * @return Combined SQL fragment with OR logic
     */
    private fun visitOr(
        conditions: List<QueryFilter>,
        depth: Int,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        if (conditions.isEmpty()) {
            return SqlFragment.ALWAYS_FALSE
        }

        return conditions
            .map { visitInternal(it, depth + 1, paramGen) }
            .reduce { acc, fragment -> acc.or(fragment) }
    }

    /**
     * Visits an ATTRIBUTE filter.
     *
     * Extracts the literal value from [FilterValue] and delegates to
     * [AttributeSqlGenerator] for SQL generation.
     *
     * @param filter Attribute filter with attribute ID, operator, and value
     * @param paramGen Parameter name generator
     * @return SQL fragment for the attribute comparison
     * @throws IllegalStateException if value is an unresolved template
     */
    private fun visitAttribute(
        filter: QueryFilter.Attribute,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        val value = extractValue(filter.value)
        return attributeSqlGenerator.generate(
            attributeId = filter.attributeId,
            operator = filter.operator,
            value = value,
            paramGen = paramGen
        )
    }

    /**
     * Visits a RELATIONSHIP filter.
     *
     * Relationship filtering is implemented in Phase 3. For now, this throws
     * a clear error so Phase 2 testing can proceed with attribute filters.
     *
     * @param filter Relationship filter with relationship ID and condition
     * @param paramGen Parameter name generator (unused in placeholder)
     * @throws UnsupportedOperationException always (Phase 3 placeholder)
     */
    @Suppress("UNUSED_PARAMETER")
    private fun visitRelationship(
        filter: QueryFilter.Relationship,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        throw UnsupportedOperationException(
            "Relationship filters not yet implemented. " +
                "Relationship '${filter.relationshipId}' condition '${filter.condition::class.simpleName}' " +
                "will be supported in Phase 3."
        )
    }

    /**
     * Extracts the actual value from a [FilterValue].
     *
     * Literal values are returned directly. Template values throw an error
     * because templates must be resolved by the caller (workflow layer) before
     * reaching the query service.
     *
     * @param filterValue The filter value to extract
     * @return The extracted literal value (may be null)
     * @throws IllegalStateException if value is an unresolved template
     */
    private fun extractValue(filterValue: FilterValue): Any? {
        return when (filterValue) {
            is FilterValue.Literal -> filterValue.value
            is FilterValue.Template -> {
                throw IllegalStateException(
                    "Template expression '${filterValue.expression}' was not resolved before query execution. " +
                        "Resolve templates before calling the query service."
                )
            }
        }
    }

    companion object {
        /**
         * Default maximum nesting depth for AND/OR filter combinations.
         *
         * This limit prevents excessive SQL complexity from deeply nested filters.
         * Can be overridden via constructor parameter if needed.
         */
        const val DEFAULT_MAX_NESTING_DEPTH = 10
    }
}
