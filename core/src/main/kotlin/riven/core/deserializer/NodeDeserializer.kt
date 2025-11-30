package riven.core.deserializer

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import riven.core.enums.block.node.NodeType
import riven.core.models.block.tree.ContentNode
import riven.core.models.block.tree.Node
import riven.core.models.block.tree.ReferenceNode
import riven.core.util.getEnumFromField

class NodeDeserializer : JsonDeserializer<Node>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Node {
        val node = p.codec.readTree<JsonNode>(p)
        val nodeType = ctxt.getEnumFromField<NodeType>(
            node,
            "type",
            Node::class.java
        )

        return when (nodeType) {
            NodeType.CONTENT -> p.codec.treeToValue(node, ContentNode::class.java)
            NodeType.REFERENCE -> p.codec.treeToValue(node, ReferenceNode::class.java)
            else -> throw IllegalArgumentException("Unknown Node type: $nodeType")
        }
    }
}