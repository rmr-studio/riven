package riven.core.models.request.entity.type

import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import riven.core.enums.entity.EntityTypeRequestDefinition
import java.util.*


@Schema(
    name = "DeleteAttributeDefinitionRequest",
    description = "Request to remove a schema attribute definition for an entity type"
)
@JsonDeserialize(using = JsonDeserializer.None::class)
data class DeleteAttributeDefinitionRequest(
    override val key: String,
    override val id: UUID,
) : TypeDefinition {
    override val type: EntityTypeRequestDefinition = EntityTypeRequestDefinition.DELETE_SCHEMA
}


@Schema(
    name = "DeleteRelationshipDefinitionRequest",
    description = "Request to remove a relationship definition for an entity type"
)
@JsonDeserialize(using = JsonDeserializer.None::class)
data class DeleteRelationshipDefinitionRequest(

    override val key: String,
    override val id: UUID,
    val deleteAction: DeleteAction
) : TypeDefinition {
    override val type: EntityTypeRequestDefinition = EntityTypeRequestDefinition.DELETE_RELATIONSHIP

    enum class DeleteAction {
        // Removes only the bi-directional reference back to the origin definition
        REMOVE_BIDIRECTIONAL,

        // Also Removes the relationship reference from the entity type, and all relationship data of that specific entity type. But keeps the relationship definition intact
        REMOVE_ENTITY_TYPE,

        // Deletes the entire relationship definition and removes the reference for every other entity type referencing the relationship
        DELETE_RELATIONSHIP
    }
}

data class DeleteTypeDefinitionRequest(
    @field:Schema(
        oneOf = [DeleteRelationshipDefinitionRequest::class, DeleteAttributeDefinitionRequest::class],
        discriminatorProperty = "type",
        discriminatorMapping = [
            DiscriminatorMapping(value = "DELETE_RELATIONSHIP", schema = DeleteRelationshipDefinitionRequest::class),
            DiscriminatorMapping(value = "DELETE_SCHEMA", schema = DeleteAttributeDefinitionRequest::class),
        ]
    )
    val definition: TypeDefinition
)
