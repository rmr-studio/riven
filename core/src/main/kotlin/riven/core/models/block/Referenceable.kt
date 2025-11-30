package riven.core.models.block

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.deserializer.ReferenceableDeserializer
import riven.core.enums.core.EntityType


@Schema(hidden = true)
@JsonDeserialize(using = ReferenceableDeserializer::class)
interface Referenceable {
    val type: EntityType
}