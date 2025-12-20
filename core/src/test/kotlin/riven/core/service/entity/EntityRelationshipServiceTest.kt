package riven.core.service.entity

import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.OrganisationSecurity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.common.SchemaType
import riven.core.enums.core.DataType
import riven.core.enums.entity.EntityCategory
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.enums.organisation.OrganisationRoles
import riven.core.models.common.validation.Schema
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.type.EntityRelationshipService
import riven.core.service.entity.type.EntityTypeRelationshipDiffService
import riven.core.service.util.OrganisationRole
import riven.core.service.util.WithUserPersona
import java.time.ZonedDateTime
import java.util.*

@SpringBootTest(
    classes = [
        AuthTokenService::class,
        OrganisationSecurity::class,
        EntityRelationshipServiceTest.TestConfig::class,
        EntityRelationshipService::class
    ]
)
@WithUserPersona(
    userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
    email = "test@test.com",
    displayName = "Test User",
    roles = [
        OrganisationRole(
            organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
            role = OrganisationRoles.OWNER
        )
    ]
)
class EntityRelationshipServiceTest {

    @Configuration
    class TestConfig

    private val userId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")
    private val organisationId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

    @MockitoBean
    private lateinit var entityRelationshipRepository: EntityRelationshipRepository

    @MockitoBean
    private lateinit var entityRepository: EntityRepository

    @MockitoBean
    private lateinit var entityTypeRelationshipDiff: EntityTypeRelationshipDiffService

    @MockitoBean
    private lateinit var entityTypeRepository: EntityTypeRepository

    @MockitoBean
    private lateinit var authTokenService: AuthTokenService

    @MockitoBean
    private lateinit var activityService: ActivityService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    private lateinit var entityRelationshipService: EntityRelationshipService

    private lateinit var companyEntityType: EntityTypeEntity
    private lateinit var candidateEntityType: EntityTypeEntity
    private lateinit var jobEntityType: EntityTypeEntity

    @BeforeEach
    fun setup() {
        // Reset all mocks
        reset(entityTypeRepository, entityRepository, entityRelationshipRepository, authTokenService, activityService)

        // Create test entity types
        companyEntityType = createEntityType("company", "Company", "Companies")
        candidateEntityType = createEntityType("candidate", "Candidate", "Candidates")
        jobEntityType = createEntityType("job", "Job", "Jobs")
    }

    // ========== TEST CASE 1: Unidirectional Relationships ==========

    @Test
    fun `createRelationships - creates unidirectional ORIGIN relationship without affecting target entity types`() {
        // Given: Company entity type wants a unidirectional relationship to Job
        val companyId = UUID.randomUUID()
        val relationshipId = UUID.randomUUID()

        companyEntityType.copy(
            id = companyId,
            relationships = emptyList()
        )

        val jobOpeningsRelationship = EntityRelationshipDefinition(
            id = relationshipId,
            name = "Job Openings",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("job"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = false, // Unidirectional
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByOrganisationIdAndKeyIn(eq(organisationId), any()))
            .thenReturn(listOf(jobEntityType))

        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                invocation.getArgument(0) as List<EntityTypeEntity>
            }

        // When: Creating the unidirectional relationship
        val result = entityRelationshipService.createRelationships(
            id = jobEntityType.id!!,
            definitions = listOf(jobOpeningsRelationship),
            organisationId = organisationId
        )

        // Then: Only the source entity type is returned
        assertEquals(1, result.size, "Job entity type should be updated")

        // Verify that we only looked up the referenced entity types for validation
        verify(entityTypeRepository, times(1)).findByOrganisationIdAndKeyIn(
            eq(organisationId),
            argThat { arg -> arg.contains("job") }
        )
    }

    // ========== TEST CASE 2: Bidirectional ORIGIN Relationships ==========

    @Test
    fun `createRelationships - creates bidirectional ORIGIN relationship with inverse REFERENCE on target types`() {
        // Given: Company entity type wants a bidirectional relationship to Candidate and Job
        val relationshipId = UUID.randomUUID()

        val employeesRelationship = EntityRelationshipDefinition(
            id = relationshipId,
            name = "Employees",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate", "job"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate", "job"), // Both should get inverse relationships
            inverseName = "Employer",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByOrganisationIdAndKeyIn(eq(organisationId), any()))
            .thenReturn(listOf(companyEntityType, candidateEntityType, jobEntityType))

        whenever(entityTypeRepository.findByOrganisationIdAndKey(eq(organisationId), eq("candidate")))
            .thenReturn(Optional.of(candidateEntityType))

        whenever(entityTypeRepository.findByOrganisationIdAndKey(eq(organisationId), eq("job")))
            .thenReturn(Optional.of(jobEntityType))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        // When: Creating the bidirectional relationship
        entityRelationshipService.createRelationships(
            id = companyEntityType.id!!,
            definitions = listOf(employeesRelationship),
            organisationId = organisationId
        )

        // Then: Both target entity types should have inverse REFERENCE relationships added
        assertEquals(3, savedEntityTypes.size, "Company, Candidate and Job entity types should be updated")

        // Find the updated candidate and job entity types
        val updatedCandidate = savedEntityTypes.find { it.key == "candidate" }
        val updatedJob = savedEntityTypes.find { it.key == "job" }

        assertNotNull(updatedCandidate, "Candidate entity type should be updated")
        assertNotNull(updatedJob, "Job entity type should be updated")

        // Verify candidate has a REFERENCE relationship
        val candidateReferenceRel = updatedCandidate!!.relationships?.find {
            it.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                    it.originRelationshipId == relationshipId
        }
        assertNotNull(candidateReferenceRel, "Candidate should have a REFERENCE relationship")
        assertEquals("Employer", candidateReferenceRel!!.name)
        assertEquals("candidate", candidateReferenceRel.sourceEntityTypeKey)
        assertEquals(listOf("company"), candidateReferenceRel.entityTypeKeys)
        assertEquals(EntityRelationshipCardinality.MANY_TO_ONE, candidateReferenceRel.cardinality)
        assertFalse(candidateReferenceRel.bidirectional, "REFERENCE relationships should not be bidirectional")

        // Verify job has a REFERENCE relationship
        val jobReferenceRel = updatedJob!!.relationships?.find {
            it.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                    it.originRelationshipId == relationshipId
        }
        assertNotNull(jobReferenceRel, "Job should have a REFERENCE relationship")
        assertEquals("Employer", jobReferenceRel!!.name)
        assertEquals("job", jobReferenceRel.sourceEntityTypeKey)
        assertEquals(listOf("company"), jobReferenceRel.entityTypeKeys)
    }

    // ========== TEST CASE 3: Bidirectional REFERENCE Relationships ==========

    @Test
    fun `createRelationships - creates bidirectional REFERENCE relationship and updates origin entity type`() {
        // Given: Company has an existing ORIGIN relationship
        val originRelationshipId = UUID.randomUUID()

        val companyWithOrigin = companyEntityType.copy(
            relationships = listOf(
                EntityRelationshipDefinition(
                    id = originRelationshipId,
                    name = "Partners",
                    sourceEntityTypeKey = "company",
                    originRelationshipId = null,
                    relationshipType = EntityTypeRelationshipType.ORIGIN,
                    entityTypeKeys = listOf("candidate"), // Only candidate initially
                    allowPolymorphic = false,
                    required = false,
                    cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = listOf("candidate"), // Only candidate initially
                    inverseName = "Partner Companies",
                    protected = false,
                    createdAt = ZonedDateTime.now(),
                    updatedAt = ZonedDateTime.now(),
                    createdBy = userId,
                    updatedBy = userId
                )
            )
        )

        // Job entity type wants to opt-in to this bidirectional relationship
        val jobReferenceRelationship = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Partner Companies",
            sourceEntityTypeKey = "job",
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"), // Points to company
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
            bidirectional = true, // Wants to participate in bidirectional relationship
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val jobEntity = jobEntityType.copy(
            relationships = listOf(jobReferenceRelationship)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByOrganisationIdAndKeyIn(eq(organisationId), any()))
            .thenReturn(listOf(companyWithOrigin, jobEntity))

        whenever(entityTypeRepository.findByOrganisationIdAndKey(eq(organisationId), eq("company")))
            .thenReturn(Optional.of(companyWithOrigin))

        whenever(entityTypeRepository.findByOrganisationIdAndKey(eq(organisationId), eq("job")))
            .thenReturn(Optional.of(jobEntity))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        // When: Creating the REFERENCE relationship
        entityRelationshipService.createRelationships(
            id = jobEntityType.id!!,
            definitions = listOf(jobReferenceRelationship),
            organisationId = organisationId
        )

        // Then: The company's ORIGIN relationship should be updated to include job
        assertEquals(2, savedEntityTypes.size, "Company and Job entity types should be updated")

        val updatedCompany = savedEntityTypes.find { it.key == "company" }
        assertNotNull(updatedCompany, "Company entity type should be updated")

        // Find the updated ORIGIN relationship
        val updatedOriginRel = updatedCompany!!.relationships?.find {
            it.id == originRelationshipId &&
                    it.relationshipType == EntityTypeRelationshipType.ORIGIN
        }
        assertNotNull(updatedOriginRel, "Company should still have the ORIGIN relationship")

        // Verify job was added to entityTypeKeys
        assertTrue(
            updatedOriginRel!!.entityTypeKeys!!.contains("job"),
            "Job should be added to origin's entityTypeKeys"
        )
        assertTrue(
            updatedOriginRel.entityTypeKeys!!.contains("candidate"),
            "Candidate should still be in origin's entityTypeKeys"
        )

        // Verify job was added to bidirectionalEntityTypeKeys
        assertTrue(
            updatedOriginRel.bidirectionalEntityTypeKeys!!.contains("job"),
            "Job should be added to origin's bidirectionalEntityTypeKeys"
        )
        assertTrue(
            updatedOriginRel.bidirectionalEntityTypeKeys!!.contains("candidate"),
            "Candidate should still be in origin's bidirectionalEntityTypeKeys"
        )
    }

    // ========== TEST CASE 4: Validation - Subset Check ==========

    @Test
    fun `createRelationships - validates bidirectionalEntityTypeKeys is subset of entityTypeKeys`() {
        // Given: A bidirectional ORIGIN relationship with invalid bidirectionalEntityTypeKeys
        val relationshipId = UUID.randomUUID()

        val invalidRelationship = EntityRelationshipDefinition(
            id = relationshipId,
            name = "Invalid Relationship",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate"), // Only candidate
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate", "job"), // Job not in entityTypeKeys!
            inverseName = "Companies",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByOrganisationIdAndKeyIn(eq(organisationId), any()))
            .thenReturn(listOf(candidateEntityType, jobEntityType))

        // When/Then: Should throw validation error
        val exception = assertThrows(IllegalArgumentException::class.java) {
            entityRelationshipService.createRelationships(
                id = companyEntityType.id!!,
                definitions = listOf(invalidRelationship),
                organisationId = organisationId
            )
        }

        assertTrue(
            exception.message!!.contains("bidirectionalEntityTypeKeys that are not in entityTypeKeys"),
            "Error message should mention bidirectionalEntityTypeKeys validation"
        )
        assertTrue(
            exception.message!!.contains("job"),
            "Error message should mention the invalid key"
        )
    }

    // ========== Helper Methods ==========

    private fun createEntityType(key: String, singularName: String, pluralName: String): EntityTypeEntity {
        return EntityTypeEntity(
            id = UUID.randomUUID(),
            key = key,
            displayNameSingular = singularName,
            displayNamePlural = pluralName,
            organisationId = organisationId,
            type = EntityCategory.STANDARD,
            schema = Schema<UUID>(
                key = SchemaType.OBJECT,
                type = DataType.OBJECT,
                properties = emptyMap()
            ),
            order = emptyList(),
            relationships = emptyList()
        )
    }
}
