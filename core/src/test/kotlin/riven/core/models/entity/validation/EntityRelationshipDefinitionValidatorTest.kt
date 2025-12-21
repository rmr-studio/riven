package riven.core.models.entity.validation

import jakarta.validation.Validation
import jakarta.validation.Validator
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import java.time.ZonedDateTime
import java.util.*

class EntityRelationshipDefinitionValidatorTest {

    private lateinit var validator: Validator

    @BeforeEach
    fun setup() {
        val factory = Validation.buildDefaultValidatorFactory()
        validator = factory.validator
    }

    @Test
    fun `should pass validation when bidirectional is true with valid bidirectionalEntityTypeKeys`() {
        val definition = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Test Relationship",
            sourceEntityTypeKey = "source",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("type1", "type2"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("type1"),
            inverseName = "Inverse",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = UUID.randomUUID(),
            updatedBy = UUID.randomUUID()
        )

        val violations = validator.validate(definition)
        assertTrue(violations.isEmpty(), "Should have no violations")
    }

    @Test
    fun `should fail validation when bidirectional is true and bidirectionalEntityTypeKeys is null`() {
        val definition = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Test Relationship",
            sourceEntityTypeKey = "source",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("type1", "type2"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = null,
            inverseName = "Inverse",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = UUID.randomUUID(),
            updatedBy = UUID.randomUUID()
        )

        val violations = validator.validate(definition)
        assertEquals(1, violations.size)
        val violation = violations.first()
        assertEquals("bidirectionalEntityTypeKeys", violation.propertyPath.toString())
        assertTrue(violation.message.contains("must not be null when bidirectional is true"))
    }

    @Test
    fun `should fail validation when bidirectional is true and bidirectionalEntityTypeKeys is empty`() {
        val definition = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Test Relationship",
            sourceEntityTypeKey = "source",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("type1", "type2"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = emptyList(),
            inverseName = "Inverse",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = UUID.randomUUID(),
            updatedBy = UUID.randomUUID()
        )

        val violations = validator.validate(definition)
        assertEquals(1, violations.size)
        val violation = violations.first()
        assertEquals("bidirectionalEntityTypeKeys", violation.propertyPath.toString())
        assertTrue(violation.message.contains("must have at least one key when bidirectional is true"))
    }

    @Test
    fun `should fail validation when bidirectionalEntityTypeKeys is not a subset of entityTypeKeys`() {
        val definition = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Test Relationship",
            sourceEntityTypeKey = "source",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("type1", "type2"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("type1", "type3"), // type3 is not in entityTypeKeys
            inverseName = "Inverse",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = UUID.randomUUID(),
            updatedBy = UUID.randomUUID()
        )

        val violations = validator.validate(definition)
        assertEquals(1, violations.size)
        val violation = violations.first()
        assertEquals("bidirectionalEntityTypeKeys", violation.propertyPath.toString())
        assertTrue(violation.message.contains("must be a subset of entityTypeKeys"))
        assertTrue(violation.message.contains("type3"))
    }

    @Test
    fun `should pass validation when allowPolymorphic is true even if bidirectionalEntityTypeKeys is not a subset`() {
        val definition = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Test Relationship",
            sourceEntityTypeKey = "source",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("type1", "type2"),
            allowPolymorphic = true,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("type3", "type4"), // Not a subset, but allowPolymorphic is true
            inverseName = "Inverse",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = UUID.randomUUID(),
            updatedBy = UUID.randomUUID()
        )

        val violations = validator.validate(definition)
        assertTrue(violations.isEmpty(), "Should have no violations when allowPolymorphic is true")
    }

    @Test
    fun `should fail validation when allowPolymorphic is false and entityTypeKeys is null`() {
        val definition = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Test Relationship",
            sourceEntityTypeKey = "source",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = null,
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = UUID.randomUUID(),
            updatedBy = UUID.randomUUID()
        )

        val violations = validator.validate(definition)
        assertEquals(1, violations.size)
        val violation = violations.first()
        assertEquals("entityTypeKeys", violation.propertyPath.toString())
        assertTrue(violation.message.contains("must not be null when allowPolymorphic is false"))
    }

    @Test
    fun `should pass validation when allowPolymorphic is true and entityTypeKeys is null`() {
        val definition = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Test Relationship",
            sourceEntityTypeKey = "source",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = null,
            allowPolymorphic = true,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = UUID.randomUUID(),
            updatedBy = UUID.randomUUID()
        )

        val violations = validator.validate(definition)
        assertTrue(violations.isEmpty(), "Should have no violations when allowPolymorphic is true")
    }
}
