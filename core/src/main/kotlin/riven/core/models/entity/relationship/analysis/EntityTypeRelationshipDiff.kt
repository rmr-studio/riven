package riven.core.models.entity.relationship.analysis

import riven.core.models.entity.configuration.EntityRelationshipDefinition

data class EntityTypeRelationshipDiff(
    val added: List<EntityRelationshipDefinition>,
    val removed: List<EntityTypeRelationshipDeleteRequest>,
    val modified: List<EntityTypeRelationshipModification>,
)