package riven.core.deserializer


import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import riven.core.enums.block.node.ReferenceType
import riven.core.models.block.tree.BlockTreeReference
import riven.core.models.block.tree.EntityReference
import riven.core.models.block.tree.ReferencePayload
import riven.core.util.getEnumFromField

/**
 * Jackson deserializer for [ReferencePayload].
 * Ensures all implementations of this sealed interface are properly deserialized.
 */
class ReferencePayloadDeserializer : JsonDeserializer<ReferencePayload>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): ReferencePayload {
        val payload = p.codec.readTree<JsonNode>(p)
        val referenceType = ctxt.getEnumFromField<ReferenceType>(
            payload,
            "type",
            ReferenceType::class.java
        )

        return when (referenceType) {
            ReferenceType.BLOCK -> p.codec.treeToValue(payload, BlockTreeReference::class.java)
            ReferenceType.ENTITY -> p.codec.treeToValue(payload, EntityReference::class.java)
        }
    }
}