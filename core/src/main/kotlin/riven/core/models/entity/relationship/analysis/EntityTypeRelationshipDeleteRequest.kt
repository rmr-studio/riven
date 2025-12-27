package riven.core.models.entity.relationship.analysis

import riven.core.entity.entity.EntityTypeEntity
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.request.entity.type.DeleteRelationshipDefinitionRequest

data class EntityTypeRelationshipDeleteRequest(
    val relationship: EntityRelationshipDefinition,
    val type: EntityTypeEntity,
    val action: DeleteRelationshipDefinitionRequest.DeleteAction
)
