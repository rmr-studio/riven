package riven.core.models.entity.validation

import riven.core.enums.entity.validation.EntityTypeChangeType


/**
 * Represents a schema change between two versions.
 */
data class EntityTypeSchemaChange(
    val type: EntityTypeChangeType,
    val path: String,
    val description: String,
    val breaking: Boolean
)

