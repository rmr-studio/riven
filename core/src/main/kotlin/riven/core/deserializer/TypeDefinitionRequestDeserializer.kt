package riven.core.deserializer

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import riven.core.enums.entity.EntityTypeRequestDefinition
import riven.core.models.request.entity.type.*
import riven.core.util.getEnumFromField


class TypeDefinitionRequestDeserializer : JsonDeserializer<TypeDefinition>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): TypeDefinition {
        val node = p.codec.readTree<JsonNode>(p)
        val definitionType = ctxt.getEnumFromField<EntityTypeRequestDefinition>(
            node,
            "type",
            TypeDefinition::class.java
        )

        return when (definitionType) {
            EntityTypeRequestDefinition.SAVE_RELATIONSHIP -> p.codec.treeToValue(
                node,
                SaveRelationshipDefinitionRequest::class.java
            )

            EntityTypeRequestDefinition.SAVE_SCHEMA -> p.codec.treeToValue(
                node,
                SaveAttributeDefinitionRequest::class.java
            )

            EntityTypeRequestDefinition.DELETE_RELATIONSHIP -> p.codec.treeToValue(
                node,
                DeleteRelationshipDefinitionRequest::class.java
            )

            EntityTypeRequestDefinition.DELETE_SCHEMA -> p.codec.treeToValue(
                node,
                DeleteAttributeDefinitionRequest::class.java
            )
        }
    }
}