package riven.core.service.entity.query

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Component
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
 * ## Entity Alias Parameterization
 *
 * The [entityAlias] parameter on [generate] controls which table alias is used in SQL
 * references (e.g., `e.payload` vs `t_0.payload`). This supports nested relationship
 * filters where the target entity uses a different alias than the root entity. The default
 * value `"e"` preserves backward compatibility with existing callers.
 *
 * @property objectMapper Jackson ObjectMapper for JSON serialization in containment queries
 */
@Component
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
     * @param entityAlias Table alias for the entity being filtered. Defaults to `"e"` (root entity).
     *   Pass a different alias (e.g., `"t_0"`) when generating SQL for nested relationship filters
     *   that reference a target entity rather than the root entity.
     * @return SqlFragment with parameterized SQL and bound values
     */
    fun generate(
        attributeId: UUID,
        operator: FilterOperator,
        value: Any?,
        paramGen: ParameterNameGenerator,
        entityAlias: String = "e"
    ): SqlFragment = when (operator) {
        FilterOperator.EQUALS -> generateEquals(attributeId, value, paramGen, entityAlias)
        FilterOperator.NOT_EQUALS -> generateNotEquals(attributeId, value, paramGen, entityAlias)
        FilterOperator.GREATER_THAN -> generateNumericComparison(attributeId, ">", value, paramGen, entityAlias)
        FilterOperator.GREATER_THAN_OR_EQUALS -> generateNumericComparison(
            attributeId,
            ">=",
            value,
            paramGen,
            entityAlias
        )

        FilterOperator.LESS_THAN -> generateNumericComparison(attributeId, "<", value, paramGen, entityAlias)
        FilterOperator.LESS_THAN_OR_EQUALS -> generateNumericComparison(attributeId, "<=", value, paramGen, entityAlias)
        FilterOperator.IN -> generateIn(attributeId, value, paramGen, entityAlias)
        FilterOperator.NOT_IN -> generateNotIn(attributeId, value, paramGen, entityAlias)
        FilterOperator.CONTAINS -> generateContains(attributeId, value, paramGen, entityAlias)
        FilterOperator.NOT_CONTAINS -> generateNotContains(attributeId, value, paramGen, entityAlias)
        FilterOperator.IS_NULL -> generateIsNull(attributeId, paramGen, entityAlias)
        FilterOperator.IS_NOT_NULL -> generateIsNotNull(attributeId, paramGen, entityAlias)
        FilterOperator.STARTS_WITH -> generateStartsWith(attributeId, value, paramGen, entityAlias)
        FilterOperator.ENDS_WITH -> generateEndsWith(attributeId, value, paramGen, entityAlias)
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
        paramGen: ParameterNameGenerator,
        entityAlias: String
    ): SqlFragment {
        if (value == null) {
            return generateIsNull(attributeId, paramGen, entityAlias)
        }

        val paramName = paramGen.next("eq")
        val jsonObject = mapOf(attributeId.toString() to mapOf("value" to value))
        val jsonValue = objectMapper.writeValueAsString(jsonObject)

        return SqlFragment(
            sql = "${entityAlias}.payload @> :$paramName::jsonb",
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
        paramGen: ParameterNameGenerator,
        entityAlias: String
    ): SqlFragment {
        if (value == null) {
            return generateIsNotNull(attributeId, paramGen, entityAlias)
        }

        val keyParam = paramGen.next("neq_key")
        val valParam = paramGen.next("neq_val")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(jsonb_exists(${entityAlias}.payload, :$keyParam) AND (${entityAlias}.payload->:$keyParam->>'value') != :$valParam)",
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
        paramGen: ParameterNameGenerator,
        entityAlias: String
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
    WHEN (${entityAlias}.payload->:$keyParam->>'value') ~ '^-?[0-9]+(\.[0-9]+)?$'
    THEN (${entityAlias}.payload->:$keyParam->>'value')::numeric $sqlOperator :$valParam
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
        paramGen: ParameterNameGenerator,
        entityAlias: String
    ): SqlFragment {
        val keyParam = paramGen.next("contains_key")
        val valParam = paramGen.next("contains_val")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(${entityAlias}.payload->:$keyParam->>'value') ILIKE :$valParam ESCAPE '\\'",
            parameters = mapOf(
                keyParam to attrKey,
                valParam to "%${escapeLikePattern(value?.toString() ?: "")}%"
            )
        )
    }

    /**
     * Generates case-insensitive substring non-containment check.
     */
    private fun generateNotContains(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator,
        entityAlias: String
    ): SqlFragment {
        val keyParam = paramGen.next("ncontains_key")
        val valParam = paramGen.next("ncontains_val")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "NOT ((${entityAlias}.payload->:$keyParam->>'value') ILIKE :$valParam ESCAPE '\\')",
            parameters = mapOf(
                keyParam to attrKey,
                valParam to "%${escapeLikePattern(value?.toString() ?: "")}%"
            )
        )
    }

    /**
     * Generates case-insensitive prefix match.
     */
    private fun generateStartsWith(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator,
        entityAlias: String
    ): SqlFragment {
        val keyParam = paramGen.next("starts_key")
        val valParam = paramGen.next("starts_val")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(${entityAlias}.payload->:$keyParam->>'value') ILIKE :$valParam ESCAPE '\\'",
            parameters = mapOf(
                keyParam to attrKey,
                valParam to "${escapeLikePattern(value?.toString() ?: "")}%"
            )
        )
    }

    /**
     * Generates case-insensitive suffix match.
     */
    private fun generateEndsWith(
        attributeId: UUID,
        value: Any?,
        paramGen: ParameterNameGenerator,
        entityAlias: String
    ): SqlFragment {
        val keyParam = paramGen.next("ends_key")
        val valParam = paramGen.next("ends_val")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(${entityAlias}.payload->:$keyParam->>'value') ILIKE :$valParam ESCAPE '\\'",
            parameters = mapOf(
                keyParam to attrKey,
                valParam to "%${escapeLikePattern(value?.toString() ?: "")}"
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
        paramGen: ParameterNameGenerator,
        entityAlias: String
    ): SqlFragment {
        val values = extractListValues(value)

        if (values.isEmpty()) {
            return SqlFragment.ALWAYS_FALSE
        }

        val keyParam = paramGen.next("in_key")
        val valsParam = paramGen.next("in_vals")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(${entityAlias}.payload->:$keyParam->>'value') IN (:$valsParam)",
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
        paramGen: ParameterNameGenerator,
        entityAlias: String
    ): SqlFragment {
        val values = extractListValues(value)

        if (values.isEmpty()) {
            return SqlFragment.ALWAYS_TRUE
        }

        val keyParam = paramGen.next("nin_key")
        val valsParam = paramGen.next("nin_vals")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(jsonb_exists(${entityAlias}.payload, :$keyParam) AND (${entityAlias}.payload->:$keyParam->>'value') NOT IN (:$valsParam))",
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
        paramGen: ParameterNameGenerator,
        entityAlias: String
    ): SqlFragment {
        val keyParam = paramGen.next("isnull_key")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(${entityAlias}.payload->:$keyParam->>'value') IS NULL",
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
        paramGen: ParameterNameGenerator,
        entityAlias: String
    ): SqlFragment {
        val keyParam = paramGen.next("notnull_key")
        val attrKey = attributeId.toString()

        return SqlFragment(
            sql = "(${entityAlias}.payload->:$keyParam->>'value') IS NOT NULL",
            parameters = mapOf(keyParam to attrKey)
        )
    }

    /**
     * Escapes SQL LIKE metacharacters so they are treated as literal characters.
     *
     * Backslash is escaped first to avoid double-escaping the escape characters
     * inserted for '%' and '_'.
     */
    private fun escapeLikePattern(value: String): String =
        value
            .replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_")

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
