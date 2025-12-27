package riven.core.models.block.metadata

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.block.structure.BlockMetadataType
import riven.core.models.common.json.JsonObject

@JsonTypeName("content")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class BlockContentMetadata(
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    var data: JsonObject = emptyMap(),
    override val meta: BlockMeta = BlockMeta(),
    override val deletable: Boolean = true,
    override val readonly: Boolean = false,
    val listConfig: BlockListConfiguration? = null
) : Metadata {
    override val type: BlockMetadataType = BlockMetadataType.CONTENT
}

