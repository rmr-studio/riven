package riven.core.models.block.layout

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonInclude
import riven.core.enums.block.layout.RenderType
import riven.core.enums.block.node.NodeType

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
data class RenderContent(
    var id: String,
    val key: String,
    val renderType: RenderType,
    val blockType: NodeType
)