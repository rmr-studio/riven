package riven.core.deserializer

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import riven.core.enums.entity.EntityPropertyType
import riven.core.models.entity.payload.EntityAttributePayload
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.models.entity.payload.EntityAttributeRelationPayloadReference
import riven.core.util.getEnumFromField

class EntityAttributePayloadDeserializer : JsonDeserializer<EntityAttributePayload>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): EntityAttributePayload {
        val node = p.codec.readTree<JsonNode>(p)
        val attributeType = ctxt.getEnumFromField<EntityPropertyType>(
            node,
            "type",
            EntityPropertyType::class.java
        )

        return when (attributeType) {
            EntityPropertyType.ATTRIBUTE -> p.codec.treeToValue(
                node,
                EntityAttributePrimitivePayload::class.java
            )

            EntityPropertyType.RELATIONSHIP -> p.codec.treeToValue(
                node,
                EntityAttributeRelationPayloadReference::class.java
            )
        }
    }
}