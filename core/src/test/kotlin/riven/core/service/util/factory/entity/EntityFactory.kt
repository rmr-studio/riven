package riven.core.service.util.factory.entity

import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.common.SchemaType
import riven.core.enums.core.DataType
import riven.core.enums.entity.EntityCategory
import riven.core.enums.entity.EntityPropertyType
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.models.common.validation.Schema
import riven.core.models.entity.EntityTypeSchema
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.configuration.EntityTypeAttributeColumn
import java.time.ZonedDateTime
import java.util.*

object EntityFactory {

    /**
     * Creates an EntityTypeEntity with the given parameters and reasonable defaults.
     *
     * @param id The entity type UUID. Defaults to a newly generated UUID.
     * @param key The unique key for the entity type. Defaults to "test_entity".
     * @param displayNameSingular Display name in singular form. Defaults to "Test Entity".
     * @param displayNamePlural Display name in plural form. Defaults to "Test Entities".
     * @param workspaceId The workspace UUID. Defaults to a newly generated UUID.
     * @param type The entity category. Defaults to STANDARD.
     * @param schema The schema definition. Defaults to a simple schema with a name field.
     * @param relationships The list of relationship definitions. Defaults to null.
     * @param order The column ordering. Defaults to ordering of schema properties.
     * @return An EntityTypeEntity configured with the provided parameters.
     */
    fun createEntityType(
        id: UUID = UUID.randomUUID(),
        key: String = "test_entity",
        displayNameSingular: String = "Test Entity",
        displayNamePlural: String = "Test Entities",
        workspaceId: UUID = UUID.randomUUID(),
        type: EntityCategory = EntityCategory.STANDARD,
        schema: EntityTypeSchema = createSimpleSchema(),
        relationships: List<EntityRelationshipDefinition>? = null,
        order: List<EntityTypeAttributeColumn>? = null,
        version: Int = 1,
        protected: Boolean = false,
        identifierKey: UUID = schema.properties?.keys?.first() ?: UUID.randomUUID()
    ): EntityTypeEntity {
        val defaultOrder = order ?: listOf(
            *(schema.properties?.keys ?: listOf()).map { key ->
                EntityTypeAttributeColumn(key, EntityPropertyType.ATTRIBUTE)
            }.toTypedArray(),
            *(relationships ?: listOf()).map {
                EntityTypeAttributeColumn(it.id, EntityPropertyType.RELATIONSHIP)
            }.toTypedArray()
        )

        return EntityTypeEntity(
            id = id,
            key = key,
            displayNameSingular = displayNameSingular,
            displayNamePlural = displayNamePlural,
            workspaceId = workspaceId,
            type = type,
            schema = schema,
            relationships = relationships,
            columns = defaultOrder,
            version = version,
            protected = protected,
            identifierKey = identifierKey
        )
    }

    /**
     * Creates a simple schema with a name field for testing.
     */
    fun createSimpleSchema(properties: Map<UUID, Schema<UUID>>? = null): EntityTypeSchema {
        return Schema(
            key = SchemaType.OBJECT,
            type = DataType.OBJECT,
            properties = properties ?: mapOf(
                UUID.randomUUID() to Schema(
                    key = SchemaType.TEXT,
                    type = DataType.STRING,
                    required = true
                )
            )
        )
    }

    /**
     * Creates an EntityRelationshipDefinition with the given parameters.
     *
     * @param name Human-readable label for the relationship.
     * @param key Unique key identifier for the relationship.
     * @param required Whether this relationship is required.
     * @param cardinality The cardinality of the relationship.
     * @param entityTypeKeys List of allowed entity type keys.
     * @param allowPolymorphic Whether this relationship can link to any entity type.
     * @param bidirectional Whether the relationship is bidirectional.
     * @param bidirectionalEntityTypeKeys For polymorphic/multi-entity relationships, filter which entity types have a bidirectional relationship.
     * @param inverseName For bidirectional relationships, the name of the inverse relationship.
     * @return An EntityRelationshipDefinition configured with the provided parameters.
     */
    fun createRelationshipDefinition(
        id: UUID = UUID.randomUUID(),
        name: String = "Related Entity",
        sourceKey: String,
        type: EntityTypeRelationshipType = EntityTypeRelationshipType.ORIGIN,
        required: Boolean = false,
        cardinality: EntityRelationshipCardinality = EntityRelationshipCardinality.MANY_TO_ONE,
        entityTypeKeys: List<String>? = null,
        allowPolymorphic: Boolean = false,
        bidirectional: Boolean = false,
        bidirectionalEntityTypeKeys: List<String>? = null,
        inverseName: String? = null
    ): EntityRelationshipDefinition {
        return EntityRelationshipDefinition(
            id = id,
            name = name,
            required = required,
            cardinality = cardinality,
            entityTypeKeys = entityTypeKeys,
            allowPolymorphic = allowPolymorphic,
            bidirectional = bidirectional,
            bidirectionalEntityTypeKeys = bidirectionalEntityTypeKeys,
            inverseName = inverseName,
            sourceEntityTypeKey = sourceKey,
            relationshipType = type,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = null,
            updatedBy = null
        )
    }

    /**
     * Creates an EntityRelationshipEntity (relationship instance) with the given parameters.
     *
     * @param id The relationship UUID. Defaults to a newly generated UUID.
     * @param workspaceId The workspace UUID. Defaults to a newly generated UUID.
     * @param sourceId The source entity UUID. Defaults to a newly generated UUID.
     * @param targetId The target entity UUID. Defaults to a newly generated UUID.
     * @return An EntityRelationshipEntity configured with the provided parameters.
     */
    fun createRelationshipEntity(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID = UUID.randomUUID(),
        sourceId: UUID = UUID.randomUUID(),
        sourceTypeId: UUID = UUID.randomUUID(),
        targetTypeId: UUID = UUID.randomUUID(),
        targetId: UUID = UUID.randomUUID(),
        fieldId: UUID = UUID.randomUUID()
    ): EntityRelationshipEntity {
        return EntityRelationshipEntity(
            id = id,
            workspaceId = workspaceId,
            sourceId = sourceId,
            targetId = targetId,
            fieldId = fieldId,
            sourceTypeId = sourceTypeId,
            targetTypeId = targetTypeId
        )
    }


}
