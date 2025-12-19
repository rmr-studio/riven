package riven.core.models.entity.relationship

import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.enums.entity.invert
import riven.core.models.entity.EntityType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import java.time.ZonedDateTime
import java.util.*


data class EntityTypeReferenceRelationshipBuilder(
    val origin: EntityRelationshipDefinition,
    val targetEntity: EntityType,
) {
    fun build(): EntityRelationshipDefinition {
        val resolvedName = resolveInverseName()

        return EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = resolvedName,
            // This should allow us to link back to the origin entity type
            sourceEntityTypeKey = origin.sourceEntityTypeKey,
            required = false,  // Inverse relationships typically not required
            cardinality = origin.cardinality.invert(),
            allowPolymorphic = false,
            entityTypeKeys = listOf(origin.sourceEntityTypeKey),
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            originRelationshipId = origin.id,
            bidirectional = false,  // References don't define their own bidirectionality
            inverseName = null,
            bidirectionalEntityTypeKeys = null,
            protected = origin.protected,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = origin.createdBy,
            updatedBy = origin.updatedBy
        )
    }

    private fun resolveInverseName(): String {
        val baseName = origin.inverseName
            ?: "${origin.sourceEntityTypeKey}s"  // Default pluralized

        val existingNames = targetEntity.relationships?.map { it.name }?.toSet() ?: emptySet()

        if (baseName !in existingNames) return baseName

        // Find next available suffix
        var counter = 2
        while ("$baseName $counter" in existingNames) {
            counter++
        }
        return "$baseName $counter"
    }
}