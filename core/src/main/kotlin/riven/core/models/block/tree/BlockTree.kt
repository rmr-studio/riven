package riven.core.models.block.tree

import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema


@JsonDeserialize(using = JsonDeserializer.None::class)
data class BlockTree(
    @field:Schema(
        oneOf = [ContentNode::class, ReferenceNode::class],
        discriminatorProperty = "type",
        discriminatorMapping = [
            DiscriminatorMapping(value = "CONTENT", schema = ContentNode::class),
            DiscriminatorMapping(value = "REFERENCE", schema = ReferenceNode::class),
        ]
    )
    val root: Node,
)



