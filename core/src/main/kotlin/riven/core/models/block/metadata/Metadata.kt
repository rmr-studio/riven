package riven.core.models.block.metadata

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.deserializer.MetadataDeserializer
import riven.core.enums.block.structure.BlockMetadataType

@JsonDeserialize(using = MetadataDeserializer::class)
@Schema(hidden = true)
sealed interface Metadata {
    val type: BlockMetadataType
    val meta: BlockMeta
    val deletable: Boolean
}
