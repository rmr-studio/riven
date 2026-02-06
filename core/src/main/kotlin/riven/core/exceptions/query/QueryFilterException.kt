package riven.core.exceptions.query

import riven.core.enums.core.DataType
import riven.core.models.entity.query.FilterOperator
import java.util.*

/**
 * Base exception for query filter errors.
 *
 * All query filter exceptions extend this sealed class, enabling
 * exhaustive when-expression handling in error processing code.
 */
sealed class QueryFilterException(message: String) : RuntimeException(message)

/**
 * Thrown when an attribute reference in a filter is invalid.
 *
 * This typically indicates the attribute UUID does not exist in the
 * entity type schema being queried.
 *
 * @property attributeId UUID of the referenced attribute
 * @property reason Description of why the reference is invalid
 */
class InvalidAttributeReferenceException(
    val attributeId: UUID,
    val reason: String
) : QueryFilterException("Attribute $attributeId: $reason")

/**
 * Thrown when a filter operator is not supported for an attribute type.
 *
 * For example, GREATER_THAN is not valid for boolean attributes,
 * or CONTAINS is not valid for numeric attributes.
 *
 * @property operator The filter operator that was attempted
 * @property attributeLabel Human-readable label of the attribute (may be null)
 * @property attributeId UUID of the attribute
 * @property attributeType The data type of the attribute
 */
class UnsupportedOperatorException(
    val operator: FilterOperator,
    val attributeLabel: String?,
    val attributeId: UUID,
    val attributeType: DataType
) : QueryFilterException(
    "Operator $operator not supported for $attributeType attribute '${attributeLabel ?: attributeId}' (id: $attributeId)"
)

/**
 * Thrown when filter AND/OR nesting depth exceeds the configured maximum.
 *
 * Deep nesting can cause performance issues and excessive SQL complexity.
 * This exception prevents runaway filter structures.
 *
 * @property depth The nesting depth that was attempted
 * @property maxDepth The configured maximum depth
 */
class FilterNestingDepthExceededException(
    val depth: Int,
    val maxDepth: Int
) : QueryFilterException("Filter nesting depth $depth exceeds maximum $maxDepth")
