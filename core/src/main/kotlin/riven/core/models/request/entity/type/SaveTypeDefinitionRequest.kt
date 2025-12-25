package riven.core.models.request.entity.type

import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.entity.EntityTypeRequestDefinition
import riven.core.models.entity.EntityTypeSchema
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import java.util.*


@Schema(
    name = "SaveAttributeDefinitionRequest",
    description = "Request to save a schema attribute definition for an entity type"
)
@JsonDeserialize(using = JsonDeserializer.None::class)
data class SaveAttributeDefinitionRequest(
    override val type: EntityTypeRequestDefinition = EntityTypeRequestDefinition.SCHEMA,
    override val key: String,
    override val id: UUID,
    val schema: EntityTypeSchema
) : TypeDefinition


@Schema(
    name = "SaveRelationshipDefinitionRequest",
    description = "Request to save a relationship definition for an entity type"
)
@JsonDeserialize(using = JsonDeserializer.None::class)
data class SaveRelationshipDefinitionRequest(
    override val type: EntityTypeRequestDefinition = EntityTypeRequestDefinition.RELATIONSHIP,
    override val key: String,
    override val id: UUID,
    val relationship: EntityRelationshipDefinition
) : TypeDefinition


data class TypeDefinitionRequest(
    val index: Int?,
    @field:Schema(
        oneOf = [SaveAttributeDefinitionRequest::class, SaveRelationshipDefinitionRequest::class],
        discriminatorProperty = "type",
        discriminatorMapping = [
            DiscriminatorMapping(value = "RELATIONSHIP", schema = SaveRelationshipDefinitionRequest::class),
            DiscriminatorMapping(value = "SCHEMA", schema = SaveAttributeDefinitionRequest::class),
        ]
    )
    val definition: TypeDefinition
)

