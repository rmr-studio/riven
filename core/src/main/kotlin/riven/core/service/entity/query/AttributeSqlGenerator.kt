package riven.core.service.entity.query

import com.fasterxml.jackson.databind.ObjectMapper
import riven.core.models.entity.query.FilterOperator
import java.util.*

/**
 * Generates parameterized SQL fragments for filtering entities by JSONB attribute values.
 *
 * This generator converts [FilterOperator] conditions into PostgreSQL SQL with appropriate
 * JSONB operators, optimized for GIN index usage where possible.
 *
 * ## GIN Index Optimization
 *
 * The EQUALS operator uses the `@>` containment operator, which leverages GIN indexes
 * with `jsonb_path_ops`. This allows PostgreSQL to use index scans for exact value matches:
 * ```sql
 * e.payload @> '{"uuid-key": {"value": "some-value"}}'::jsonb
 * ```
 *
 * ## Key Existence Checks
 *
 * Operators like NOT_EQUALS and NOT_IN require checking that the attribute key exists
 * before comparing values. Without this check, entities missing the attribute would
 * incorrectly match (since NULL != value evaluates to NULL, which is falsy but
 * conceptually different from "attribute exists and differs").
 *
 * ## Type Coercion
 *
 * Numeric comparisons use regex-guarded casts to prevent PostgreSQL cast errors on
 * non-numeric values. Non-numeric values silently fail to match rather than throwing errors.
 *
 * @property objectMapper Jackson ObjectMapper for JSON serialization in containment queries
 */
class AttributeSqlGenerator(
    private val objectMapper: ObjectMapper
) {

    /**
     * Generates a SQL fragment for filtering by an attribute value.
     *
     * @param attributeId UUID key of the attribute in the entity's JSONB payload
     * @param operator Comparison operator to apply
     * @param value Value to compare against (may be null for IS_NULL/IS_NOT_NULL)
     * @param paramGen Generator for unique parameter names
     * @return SqlFragment with parameterized SQL and bound values
     */
    fun generate(
        attributeId: UUID,
        operator: FilterOperator,
        value: Any?,
        paramGen: ParameterNameGenerator
    ): SqlFragment = when (operator) {
        FilterOperator.EQUALS -> generateEquals(attributeId, value, paramGen)
        FilterOperator.NOT_EQUALS -> generateNotEquals(attributeId, value, paramGen)
        FilterOperator.GREATER_THAN -> generateNumericComparison(attributeId, ">", value, paramGen)
        FilterOperator.GREATER_THAN_OR_EQUALS -> generateNumericComparison(attributeId, ">=", value, paramGen)
        FilterOperator.LESS_THAN -> generateNumericComparison(attributeId, "<", value, paramGen)
        FilterOperator.LESS_THAN_OR_EQUALS -> generateNumericComparison(attributeId, "<=", value, paramGen)
        FilterOperator.IN -> generateIn(attributeId, value, paramGen)
        FilterOperator.NOT_IN -> generateNotIn(attributeId, value, paramGen)
        FilterOperator.CONTAINS -> generateContains(attributeId, value, paramGen)
        FilterOperator.NOT_CONTAINS -> generateNotContains(attributeId, value, paramGen)
        FilterOperator.IS_NULL -> generateIsNull(attributeId, paramGen)
        FilterOperator.IS_NOT_NULL -> generateIsNotNull(attributeId, paramGen)
        FilterOperator.STARTS_WITH -> generateStartsWith(attributeId, value, paramGen)
        FilterOperator.ENDS_WITH -> generateEndsWith(attributeId, value, paramGen)
    }

    /**
     * Generates GIN-optimized equality check using JSONB containment operator.
     *
     * Uses `@>` containment which can leverage GIN indexes with `jsonb_path_ops`.
     * If value is null, delegates to IS_NULL semantics.
     */
    private fun generateEquals(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        if (value == null) {
            return generateIsNull(attributeId, paramGen)
        }

        val paramName = paramGen.next("eq")
        val jsonObject = mapOf(attributeId.toString() to mapOf("value" to value))
        val jsonValue = objectMapper.writeValueAsString(jsonObject)

        return SqlFragment(
            sql = "e.payload @> :$paramName::jsonb",
            parameters = mapOf(paramName to jsonValue)
        )
    }

    /**
     * Generates inequality check with key existence verification.
     *
     * Must check key exists first, otherwise entities missing the attribute
     * would incorrectly match (NULL != 'value' is NULL/unknown, not true).
     */
    private fun generateNotEquals(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        if (value == null) {
            return generateIsNotNull(attributeId, paramGen)
        }

        val keyParam = paramGen.next("neq_key")
        val valParam = paramGen.next("neq_val")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(e.payload ? :$keyParam AND (e.payload->:$keyParam->>'value') != :$valParam)",
            parameters = mapOf(
                keyParam to attrKey,
                valParam to value.toString()
            )
        )
    }

    /**
     * Generates numeric comparison with regex-guarded cast.
     *
     * Uses a CASE expression to check if the value matches numeric format before
     * casting. Non-numeric values silently fail to match rather than throwing errors.
     */
    private fun generateNumericComparison(
        attributeId: UUID,
        sqlOperator: String,
        value: Any?,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        val keyParam = paramGen.next("num_key")
        val valParam = paramGen.next("num_val")
        val attrKey = attributeId.toString()

        // Convert value to numeric, defaulting to 0 if null (though null comparisons are unusual)
        val numericValue = when (value) {
            is Number -> value
            is String -> value.toBigDecimalOrNull() ?: 0
            null -> 0
            else -> value.toString().toBigDecimalOrNull() ?: 0
        }

        return SqlFragment(
            sql = """CASE
    WHEN (e.payload->:$keyParam->>'value') ~ '^-?[0-9]+(\.[0-9]+)?$'
    THEN (e.payload->:$keyParam->>'value')::numeric $sqlOperator :$valParam
    ELSE false
END""",
            parameters = mapOf(
                keyParam to attrKey,
                valParam to numericValue
            )
        )
    }

    /**
     * Generates case-insensitive substring containment check.
     */
    private fun generateContains(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        val keyParam = paramGen.next("contains_key")
        val valParam = paramGen.next("contains_val")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(e.payload->:$keyParam->>'value') ILIKE :$valParam",
            parameters = mapOf(
                keyParam to attrKey,
                valParam to "%${value?.toString() ?: ""}%"
            )
        )
    }

    /**
     * Generates case-insensitive substring non-containment check.
     */
    private fun generateNotContains(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        val keyParam = paramGen.next("ncontains_key")
        val valParam = paramGen.next("ncontains_val")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "NOT ((e.payload->:$keyParam->>'value') ILIKE :$valParam)",
            parameters = mapOf(
                keyParam to attrKey,
                valParam to "%${value?.toString() ?: ""}%"
            )
        )
    }

    /**
     * Generates case-insensitive prefix match.
     */
    private fun generateStartsWith(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        val keyParam = paramGen.next("starts_key")
        val valParam = paramGen.next("starts_val")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(e.payload->:$keyParam->>'value') ILIKE :$valParam",
            parameters = mapOf(
                keyParam to attrKey,
                valParam to "${value?.toString() ?: ""}%"
            )
        )
    }

    /**
     * Generates case-insensitive suffix match.
     */
    private fun generateEndsWith(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        val keyParam = paramGen.next("ends_key")
        val valParam = paramGen.next("ends_val")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(e.payload->:$keyParam->>'value') ILIKE :$valParam",
            parameters = mapOf(
                keyParam to attrKey,
                valParam to "%${value?.toString() ?: ""}"
            )
        )
    }

    /**
     * Generates IN list membership check.
     *
     * Returns ALWAYS_FALSE for empty lists (IN with empty set never matches).
     */
    private fun generateIn(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        val values = extractListValues(value)

        if (values.isEmpty()) {
            return SqlFragment.ALWAYS_FALSE
        }

        val keyParam = paramGen.next("in_key")
        val valsParam = paramGen.next("in_vals")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(e.payload->:$keyParam->>'value') IN (:$valsParam)",
            parameters = mapOf(
                keyParam to attrKey,
                valsParam to values.map { it?.toString() ?: "" }
            )
        )
    }

    /**
     * Generates NOT IN list membership check with key existence verification.
     *
     * Returns ALWAYS_TRUE for empty lists (NOT IN empty set always matches).
     * Must check key exists, otherwise missing attributes would incorrectly match.
     */
    private fun generateNotIn(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        val values = extractListValues(value)

        if (values.isEmpty()) {
            return SqlFragment.ALWAYS_TRUE
        }

        val keyParam = paramGen.next("nin_key")
        val valsParam = paramGen.next("nin_vals")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(e.payload ? :$keyParam AND (e.payload->:$keyParam->>'value') NOT IN (:$valsParam))",
            parameters = mapOf(
                keyParam to attrKey,
                valsParam to values.map { it?.toString() ?: "" }
            )
        )
    }

    /**
     * Generates null check for attribute value.
     *
     * Matches both missing attribute keys AND explicit JSON null values.
     * PostgreSQL's `->>` operator returns SQL NULL for both cases.
     */
    private fun generateIsNull(
        attributeId: UUID,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        val keyParam = paramGen.next("isnull_key")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(e.payload->:$keyParam->>'value') IS NULL",
            parameters = mapOf(keyParam to attrKey)
        )
    }

    /**
     * Generates not-null check for attribute value.
     *
     * Matches entities that have the attribute with a non-null value.
     */
    private fun generateIsNotNull(
        attributeId: UUID,
        paramGen: ParameterNameGenerator
    ): SqlFragment {
        val keyParam = paramGen.next("notnull_key")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(e.payload->:$keyParam->>'value') IS NOT NULL",
            parameters = mapOf(keyParam to attrKey)
        )
    }

    /**
     * Extracts list values from the value parameter.
     *
     * Handles both List<Any?> and single values (wrapped as single-element list).
     */
    private fun extractListValues(value: Any?): List<Any?> = when (value) {
        is List<*> -> value
        null -> emptyList()
        else -> listOf(value)
    }
}
