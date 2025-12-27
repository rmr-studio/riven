package riven.core.models.entity.relationship.analysis

import riven.core.models.request.entity.type.SaveRelationshipDefinitionRequest

data class EntityTypeRelationshipDiff(
    val added: List<SaveRelationshipDefinitionRequest>,
    val removed: List<EntityTypeRelationshipDeleteRequest>,
    val modified: List<EntityTypeRelationshipModification>,
)