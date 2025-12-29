package riven.core.models.entity.payload

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.deserializer.EntityAttributePayloadDeserializer
import riven.core.enums.common.SchemaType
import riven.core.enums.entity.EntityPropertyType
import riven.core.models.common.json.JsonValue
import riven.core.models.entity.EntityLink
import java.util.*


@Schema(hidden = true)
@JsonDeserialize(using = EntityAttributePayloadDeserializer::class)
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

data class EntityAttributeRequest(
    @field:Schema(
        oneOf = [EntityAttributePrimitivePayload::class, EntityAttributeRelationPayloadReference::class],
        discriminatorProperty = "type",
        discriminatorMapping = [
            DiscriminatorMapping(value = "ATTRIBUTE", schema = EntityAttributePrimitivePayload::class),
            DiscriminatorMapping(value = "RELATIONSHIP", schema = EntityAttributeRelationPayloadReference::class),
        ]
    )
    val payload: EntityAttributePayload
)