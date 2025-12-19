package riven.core.models.entity.relationship

import riven.core.enums.entity.EntityTypeRelationshipChangeType
import riven.core.models.entity.configuration.EntityRelationshipDefinition

data class EntityTypeRelationshipModification(
    val previous: EntityRelationshipDefinition,
    val updated: EntityRelationshipDefinition,
    val changes: Set<EntityTypeRelationshipChangeType>
)
