package riven.core.models.entity.relationship.analysis

import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipModification

data class EntityTypeRelationshipDiff(
    val added: List<EntityRelationshipDefinition>,
    val removed: List<EntityRelationshipDefinition>,
    val modified: List<EntityTypeRelationshipModification>,
)