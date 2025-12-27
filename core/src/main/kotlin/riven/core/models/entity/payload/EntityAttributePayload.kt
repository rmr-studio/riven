package riven.core.models.entity.payload

import riven.core.enums.common.SchemaType
import riven.core.enums.entity.EntityPropertyType
import riven.core.models.common.json.JsonValue
import riven.core.models.entity.EntityLink
import java.util.*

sealed interface EntityAttributePayload {
    val type: EntityPropertyType
}

data class EntityAttributePrimitivePayload(
    val value: JsonValue,
    val schemaType: SchemaType
) : EntityAttributePayload {
    override val type: EntityPropertyType = EntityPropertyType.ATTRIBUTE
}

data class EntityAttributeRelationPayloadReference(
    val relations: List<UUID>
) : EntityAttributePayload {
    override val type: EntityPropertyType = EntityPropertyType.RELATIONSHIP
}

data class EntityAttributeRelationPayload(
    val relations: List<EntityLink>
) : EntityAttributePayload {
    override val type: EntityPropertyType = EntityPropertyType.RELATIONSHIP
}