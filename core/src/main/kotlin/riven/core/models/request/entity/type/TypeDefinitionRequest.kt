package riven.core.models.request.entity.type

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import riven.core.models.entity.EntityTypeSchema
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import java.util.*

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes(
    JsonSubTypes.Type(value = SaveRelationshipRequest::class, name = "relationship"),
    JsonSubTypes.Type(value = SaveAttributeSchemaRequest::class, name = "schema")
)
sealed interface TypeAttributeRequest {
    // Optional index to adjust the ordering of the entity type columns to accommodate new or updated attributes
    val index: Int?
    val key: String
    val id: UUID
}

data class SaveRelationshipRequest(
    override val index: Int? = null,
    override val key: String,
    override val id: UUID,
    val relationship: EntityRelationshipDefinition
) : TypeAttributeRequest

data class SaveAttributeSchemaRequest(
    override val index: Int? = null,
    override val key: String,
    override val id: UUID,
    val schema: EntityTypeSchema
) : TypeAttributeRequest