package riven.core.service.entity

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.entity.EntityTypeRelationshipChangeType
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.service.entity.type.EntityTypeRelationshipDiffService
import java.time.ZonedDateTime
import java.util.*

@SpringBootTest(
    classes = [
        EntityTypeRelationshipDiffServiceTest.TestConfig::class,
        EntityTypeRelationshipDiffService::class
    ]
)
class EntityTypeRelationshipDiffServiceTest {

    @Configuration
    class TestConfig

    @Autowired
    private lateinit var diffService: EntityTypeRelationshipDiffService

    private val userId: UUID = UUID.randomUUID()
    private val baseTime: ZonedDateTime = ZonedDateTime.now()

    // ========== TEST CASE 1: No Changes ==========

    @Test
    fun `calculate - returns empty diff when lists are identical`() {
        // Given: Identical relationship lists
        val relationshipId = UUID.randomUUID()
        val relationship = createRelationship(
            id = relationshipId,
            name = "Employees",
            sourceKey = "company",
            entityTypeKeys = listOf("candidate")
        )

        val previous = listOf(relationship)
        val updated = listOf(relationship)

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: No changes detected
        assertTrue(diff.added.isEmpty(), "No relationships should be added")
        assertTrue(diff.removed.isEmpty(), "No relationships should be removed")
        assertTrue(diff.modified.isEmpty(), "No relationships should be modified")
    }

    @Test
    fun `calculate - returns empty diff when both lists are empty`() {
        // Given: Empty lists
        val previous = emptyList<EntityRelationshipDefinition>()
        val updated = emptyList<EntityRelationshipDefinition>()

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: No changes detected
        assertTrue(diff.added.isEmpty())
        assertTrue(diff.removed.isEmpty())
        assertTrue(diff.modified.isEmpty())
    }

    // ========== TEST CASE 2: Additions ==========

    @Test
    fun `calculate - detects single added relationship`() {
        // Given: One relationship added
        val previous = emptyList<EntityRelationshipDefinition>()
        val newRelationship = createRelationship(
            id = UUID.randomUUID(),
            name = "New Relationship",
            sourceKey = "company"
        )
        val updated = listOf(newRelationship)

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: One addition detected
        assertEquals(1, diff.added.size)
        assertEquals(newRelationship.id, diff.added[0].id)
        assertTrue(diff.removed.isEmpty())
        assertTrue(diff.modified.isEmpty())
    }

    @Test
    fun `calculate - detects multiple added relationships`() {
        // Given: Multiple relationships added
        val previous = emptyList<EntityRelationshipDefinition>()
        val newRel1 = createRelationship(id = UUID.randomUUID(), name = "Relationship 1", sourceKey = "company")
        val newRel2 = createRelationship(id = UUID.randomUUID(), name = "Relationship 2", sourceKey = "candidate")
        val newRel3 = createRelationship(id = UUID.randomUUID(), name = "Relationship 3", sourceKey = "job")
        val updated = listOf(newRel1, newRel2, newRel3)

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Three additions detected
        assertEquals(3, diff.added.size)
        assertTrue(diff.added.any { it.id == newRel1.id })
        assertTrue(diff.added.any { it.id == newRel2.id })
        assertTrue(diff.added.any { it.id == newRel3.id })
        assertTrue(diff.removed.isEmpty())
        assertTrue(diff.modified.isEmpty())
    }

    // ========== TEST CASE 3: Removals ==========

    @Test
    fun `calculate - detects single removed relationship`() {
        // Given: One relationship removed
        val removedRelationship = createRelationship(
            id = UUID.randomUUID(),
            name = "Removed Relationship",
            sourceKey = "company"
        )
        val previous = listOf(removedRelationship)
        val updated = emptyList<EntityRelationshipDefinition>()

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: One removal detected
        assertEquals(1, diff.removed.size)
        assertEquals(removedRelationship.id, diff.removed[0].id)
        assertTrue(diff.added.isEmpty())
        assertTrue(diff.modified.isEmpty())
    }

    @Test
    fun `calculate - detects multiple removed relationships`() {
        // Given: Multiple relationships removed
        val removedRel1 = createRelationship(id = UUID.randomUUID(), name = "Relationship 1", sourceKey = "company")
        val removedRel2 = createRelationship(id = UUID.randomUUID(), name = "Relationship 2", sourceKey = "candidate")
        val previous = listOf(removedRel1, removedRel2)
        val updated = emptyList<EntityRelationshipDefinition>()

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Two removals detected
        assertEquals(2, diff.removed.size)
        assertTrue(diff.removed.any { it.id == removedRel1.id })
        assertTrue(diff.removed.any { it.id == removedRel2.id })
        assertTrue(diff.added.isEmpty())
        assertTrue(diff.modified.isEmpty())
    }

    // ========== TEST CASE 4: Modifications - Name Changes ==========

    @Test
    fun `calculate - detects name change`() {
        // Given: Relationship name changed
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(id = relationshipId, name = "Old Name", sourceKey = "company")
        )
        val updated = listOf(
            createRelationship(id = relationshipId, name = "New Name", sourceKey = "company")
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Name change detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.NAME_CHANGED))
        assertEquals("Old Name", modification.previous.name)
        assertEquals("New Name", modification.updated.name)
        assertTrue(diff.added.isEmpty())
        assertTrue(diff.removed.isEmpty())
    }

    // ========== TEST CASE 5: Modifications - Cardinality Changes ==========

    @Test
    fun `calculate - detects cardinality change`() {
        // Given: Relationship cardinality changed
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                cardinality = EntityRelationshipCardinality.ONE_TO_MANY
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                cardinality = EntityRelationshipCardinality.MANY_TO_MANY
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Cardinality change detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.CARDINALITY_CHANGED))
        assertEquals(EntityRelationshipCardinality.ONE_TO_MANY, modification.previous.cardinality)
        assertEquals(EntityRelationshipCardinality.MANY_TO_MANY, modification.updated.cardinality)
    }

    // ========== TEST CASE 7: Modifications - Inverse Name Changes ==========

    @Test
    fun `calculate - detects inverse name change`() {
        // Given: Relationship inverse name changed
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                inverseName = "Employer"
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                inverseName = "Company"
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Inverse name change detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.INVERSE_NAME_CHANGED))
        assertEquals("Employer", modification.previous.inverseName)
        assertEquals("Company", modification.updated.inverseName)
    }

    // ========== TEST CASE 8: Modifications - Target Types Added ==========

    @Test
    fun `calculate - detects target types added`() {
        // Given: Target entity types added
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                entityTypeKeys = listOf("candidate")
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                entityTypeKeys = listOf("candidate", "job", "contractor")
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Target types added detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.TARGET_TYPES_ADDED))
        assertEquals(1, modification.previous.entityTypeKeys?.size)
        assertEquals(3, modification.updated.entityTypeKeys?.size)
    }

    @Test
    fun `calculate - detects target types added from null to non-null`() {
        // Given: Target entity types added from null
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                entityTypeKeys = null
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                entityTypeKeys = listOf("candidate", "job")
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Target types added detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.TARGET_TYPES_ADDED))
    }

    // ========== TEST CASE 9: Modifications - Target Types Removed ==========

    @Test
    fun `calculate - detects target types removed`() {
        // Given: Target entity types removed
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                entityTypeKeys = listOf("candidate", "job", "contractor")
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                entityTypeKeys = listOf("candidate")
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Target types removed detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.TARGET_TYPES_REMOVED))
        assertEquals(3, modification.previous.entityTypeKeys?.size)
        assertEquals(1, modification.updated.entityTypeKeys?.size)
    }

    @Test
    fun `calculate - detects both target types added and removed`() {
        // Given: Some target entity types removed and others added
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                entityTypeKeys = listOf("candidate", "job")
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                entityTypeKeys = listOf("candidate", "contractor")
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Both target types added and removed detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.TARGET_TYPES_ADDED))
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.TARGET_TYPES_REMOVED))
    }

    // ========== TEST CASE 10: Modifications - Bidirectional Enabled ==========

    @Test
    fun `calculate - detects bidirectional enabled`() {
        // Given: Bidirectional flag changed from false to true
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                bidirectional = false
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                bidirectional = true,
                bidirectionalEntityTypeKeys = listOf("candidate")
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Bidirectional enabled detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.BIDIRECTIONAL_ENABLED))
        assertFalse(modification.previous.bidirectional)
        assertTrue(modification.updated.bidirectional)
    }

    // ========== TEST CASE 11: Modifications - Bidirectional Disabled ==========

    @Test
    fun `calculate - detects bidirectional disabled`() {
        // Given: Bidirectional flag changed from true to false
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                bidirectional = true,
                bidirectionalEntityTypeKeys = listOf("candidate")
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                bidirectional = false
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Bidirectional disabled detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.BIDIRECTIONAL_DISABLED))
        assertTrue(modification.previous.bidirectional)
        assertFalse(modification.updated.bidirectional)
    }

    // ========== TEST CASE 12: Modifications - Bidirectional Targets Changed ==========

    @Test
    fun `calculate - detects bidirectional targets changed`() {
        // Given: Bidirectional entity type keys changed
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                bidirectional = true,
                bidirectionalEntityTypeKeys = listOf("candidate")
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                bidirectional = true,
                bidirectionalEntityTypeKeys = listOf("candidate", "job")
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Bidirectional targets changed detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.BIDIRECTIONAL_TARGETS_CHANGED))
        assertEquals(1, modification.previous.bidirectionalEntityTypeKeys?.size)
        assertEquals(2, modification.updated.bidirectionalEntityTypeKeys?.size)
    }

    @Test
    fun `calculate - detects bidirectional targets changed from null to non-null`() {
        // Given: Bidirectional entity type keys changed from null
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                bidirectional = true,
                bidirectionalEntityTypeKeys = null
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                bidirectional = true,
                bidirectionalEntityTypeKeys = listOf("candidate")
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Bidirectional targets changed detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.BIDIRECTIONAL_TARGETS_CHANGED))
    }

    // ========== TEST CASE 13: Multiple Modifications ==========

    @Test
    fun `calculate - detects multiple changes in single relationship`() {
        // Given: Multiple properties changed in one relationship
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Old Name",
                sourceKey = "company",
                cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
                required = false,
                bidirectional = false,
                entityTypeKeys = listOf("candidate")
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "New Name",
                sourceKey = "company",
                cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
                required = false,
                bidirectional = true,
                bidirectionalEntityTypeKeys = listOf("candidate", "job"),
                entityTypeKeys = listOf("candidate", "job")
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Multiple changes detected
        assertEquals(1, diff.modified.size)
        val modification = diff.modified[0]
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.NAME_CHANGED))
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.CARDINALITY_CHANGED))
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.BIDIRECTIONAL_ENABLED))
        assertTrue(modification.changes.contains(EntityTypeRelationshipChangeType.TARGET_TYPES_ADDED))
        assertEquals(4, modification.changes.size)
    }

    // ========== TEST CASE 14: Complex Scenarios ==========

    @Test
    fun `calculate - handles complex scenario with additions, removals, and modifications`() {
        // Given: Complex scenario with multiple operations
        val unchangedId = UUID.randomUUID()
        val modifiedId = UUID.randomUUID()
        val removedId = UUID.randomUUID()
        val addedId = UUID.randomUUID()

        val previous = listOf(
            createRelationship(id = unchangedId, name = "Unchanged", sourceKey = "company"),
            createRelationship(id = modifiedId, name = "Old Name", sourceKey = "candidate"),
            createRelationship(id = removedId, name = "To Be Removed", sourceKey = "job")
        )

        val updated = listOf(
            createRelationship(id = unchangedId, name = "Unchanged", sourceKey = "company"),
            createRelationship(id = modifiedId, name = "New Name", sourceKey = "candidate"),
            createRelationship(id = addedId, name = "Newly Added", sourceKey = "contractor")
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: All operations detected correctly
        assertEquals(1, diff.added.size)
        assertEquals(addedId, diff.added[0].id)

        assertEquals(1, diff.removed.size)
        assertEquals(removedId, diff.removed[0].id)

        assertEquals(1, diff.modified.size)
        assertEquals(modifiedId, diff.modified[0].previous.id)
        assertTrue(diff.modified[0].changes.contains(EntityTypeRelationshipChangeType.NAME_CHANGED))
    }

    @Test
    fun `calculate - handles large number of relationships`() {
        // Given: Large number of relationships
        val previous = (1..50).map { i ->
            createRelationship(
                id = UUID.randomUUID(),
                name = "Relationship $i",
                sourceKey = "company"
            )
        }

        val updated = previous.take(30).map { rel ->
            rel.copy(name = "Modified ${rel.name}")
        } + (51..70).map { i ->
            createRelationship(
                id = UUID.randomUUID(),
                name = "Relationship $i",
                sourceKey = "company"
            )
        }

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: Correctly identifies all changes
        assertEquals(20, diff.added.size, "Should detect 20 new relationships (51-70)")
        assertEquals(20, diff.removed.size, "Should detect 20 removed relationships (31-50)")
        assertEquals(30, diff.modified.size, "Should detect 30 modified relationships (1-30)")
    }

    @Test
    fun `calculate - ignores modifications with no actual changes`() {
        // Given: Relationships with same ID but identical content
        val relationshipId = UUID.randomUUID()
        val previous = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                cardinality = EntityRelationshipCardinality.ONE_TO_MANY
            )
        )
        val updated = listOf(
            createRelationship(
                id = relationshipId,
                name = "Employees",
                sourceKey = "company",
                cardinality = EntityRelationshipCardinality.ONE_TO_MANY
            )
        )

        // When: Calculating diff
        val diff = diffService.calculate(previous, updated)

        // Then: No modifications reported
        assertTrue(diff.modified.isEmpty(), "Should not report modifications when content is identical")
        assertTrue(diff.added.isEmpty())
        assertTrue(diff.removed.isEmpty())
    }

    // ========== Helper Methods ==========

    private fun createRelationship(
        id: UUID,
        name: String,
        sourceKey: String,
        cardinality: EntityRelationshipCardinality = EntityRelationshipCardinality.ONE_TO_MANY,
        required: Boolean = false,
        bidirectional: Boolean = false,
        bidirectionalEntityTypeKeys: List<String>? = null,
        inverseName: String? = null,
        entityTypeKeys: List<String>? = listOf("candidate")
    ): EntityRelationshipDefinition {
        return EntityRelationshipDefinition(
            id = id,
            name = name,
            sourceEntityTypeKey = sourceKey,
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = entityTypeKeys,
            allowPolymorphic = false,
            required = required,
            cardinality = cardinality,
            bidirectional = bidirectional,
            bidirectionalEntityTypeKeys = bidirectionalEntityTypeKeys,
            inverseName = inverseName,
            protected = false,
            createdAt = baseTime,
            updatedAt = baseTime,
            createdBy = userId,
            updatedBy = userId
        )
    }
}
