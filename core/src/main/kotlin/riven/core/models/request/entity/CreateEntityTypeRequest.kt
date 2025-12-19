package riven.core.models.request.entity

import riven.core.enums.entity.EntityCategory
import riven.core.models.common.display.DisplayName
import riven.core.models.entity.EntityTypeSchema
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.configuration.EntityTypeOrderingKey
import java.util.*

data class CreateEntityTypeRequest(
    val name: DisplayName,
    val key: String,
    val organisationId: UUID,
    val identifier: String,
    val description: String?,
    val type: EntityCategory,
    val schema: EntityTypeSchema,
    val relationships: List<EntityRelationshipDefinition>? = null,
    val order: List<EntityTypeOrderingKey>? = null
)