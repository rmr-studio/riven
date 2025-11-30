package okuri.core.models.block.tree

import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.deserializer.ReferencePayloadDeserializer
import okuri.core.enums.block.node.ReferenceType
import okuri.core.models.block.Reference


@Schema(hidden = true)
@JsonDeserialize(using = ReferencePayloadDeserializer::class)
sealed interface ReferencePayload {
    val type: ReferenceType
}

@Schema(
    name = "EntityReference",
    description = "Reference to one or more of an organisation's entities (e.g. teams, projects, clients)"
)
@JsonDeserialize(using = JsonDeserializer.None::class)
data class EntityReference(
    override val type: ReferenceType = ReferenceType.ENTITY,
    val reference: List<Reference>? = null
) : ReferencePayload

@Schema(
    name = "BlockTreeReference",
    description = "Reference to another block tree"
)
@JsonDeserialize(using = JsonDeserializer.None::class)
data class BlockTreeReference(
    override val type: ReferenceType = ReferenceType.BLOCK,
    val reference: Reference? = null
) : ReferencePayload