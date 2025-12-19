package riven.core.models.entity.relationship

import riven.core.models.entity.configuration.EntityRelationshipDefinition

data class EntityTypeRelationshipDiff(
    val added: List<EntityRelationshipDefinition>,
    val removed: List<EntityRelationshipDefinition>,
    val modified: List<EntityTypeRelationshipModification>,
)