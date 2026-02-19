package riven.core.service.entity.type

import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.core.DataType
import riven.core.enums.entity.EntityCategory
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.entity.EntityTypeRelationshipChangeType
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.models.common.validation.Schema
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipDeleteRequest
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipDiff
import riven.core.models.entity.relationship.analysis.EntityTypeRelationshipModification
import riven.core.models.request.entity.type.DeleteRelationshipDefinitionRequest
import riven.core.models.request.entity.type.SaveRelationshipDefinitionRequest
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.EntityTypeSemanticMetadataService
import riven.core.service.util.BaseServiceTest
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import java.time.ZonedDateTime
import java.util.*

@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        EntityTypeRelationshipServiceTest.TestConfig::class,
        EntityTypeRelationshipService::class
    ]
)
@WithUserPersona(
    userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
    email = "test@test.com",
    displayName = "Test User",
    roles = [
        WorkspaceRole(
            workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
            role = WorkspaceRoles.OWNER
        )
    ]
)
class EntityTypeRelationshipServiceTest : BaseServiceTest() {

    @Configuration
    class TestConfig

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
    private lateinit var semanticMetadataService: EntityTypeSemanticMetadataService

    @Autowired
    private lateinit var entityTypeRelationshipService: EntityTypeRelationshipService

    private lateinit var companyEntityType: EntityTypeEntity
    private lateinit var candidateEntityType: EntityTypeEntity
    private lateinit var jobEntityType: EntityTypeEntity

    @BeforeEach
    fun setup() {
        // Reset all mocks
        reset(entityTypeRepository, entityRepository, entityRelationshipRepository, authTokenService, activityService, semanticMetadataService)

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
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyEntityType, jobEntityType))

        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                invocation.getArgument(0) as List<EntityTypeEntity>
            }

        // When: Creating the unidirectional relationship
        val result = entityTypeRelationshipService.createRelationships(
            definitions = listOf(
                SaveRelationshipDefinitionRequest(
                    id = jobOpeningsRelationship.id,
                    key = "company",
                    relationship = jobOpeningsRelationship
                )
            ),
            workspaceId = workspaceId
        )

        // Verify Relationship was not added to job entity type
        val updatedJobEntityType = result.find { it.key == "job" }
        Assertions.assertNotNull(updatedJobEntityType, "Job entity type should be present in the result")
        val hasReferenceRelationship = updatedJobEntityType!!.relationships?.any {
            it.originRelationshipId == relationshipId &&
                    it.relationshipType == EntityTypeRelationshipType.REFERENCE
        } ?: false
        Assertions.assertFalse(
            hasReferenceRelationship,
            "Job entity type should NOT have a REFERENCE relationship added"
        )

        // Then: Only the source entity type is returned

        // Verify that we only looked up the referenced entity types for validation
        verify(entityTypeRepository, times(1)).findByworkspaceIdAndKeyIn(
            eq(workspaceId),
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
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyEntityType, candidateEntityType, jobEntityType))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("candidate")))
            .thenReturn(Optional.of(candidateEntityType))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("job")))
            .thenReturn(Optional.of(jobEntityType))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        // When: Creating the bidirectional relationship
        entityTypeRelationshipService.createRelationships(
            definitions = listOf(
                SaveRelationshipDefinitionRequest(
                    id = employeesRelationship.id,
                    key = "company",
                    relationship = employeesRelationship
                )
            ),
            workspaceId = workspaceId
        )

        // Then: Both target entity types should have inverse REFERENCE relationships added
        Assertions.assertEquals(3, savedEntityTypes.size, "Company, Candidate and Job entity types should be updated")

        // Find the updated candidate and job entity types
        val updatedCandidate = savedEntityTypes.find { it.key == "candidate" }
        val updatedJob = savedEntityTypes.find { it.key == "job" }

        Assertions.assertNotNull(updatedCandidate, "Candidate entity type should be updated")
        Assertions.assertNotNull(updatedJob, "Job entity type should be updated")

        // Verify candidate has a REFERENCE relationship
        val candidateReferenceRel = updatedCandidate!!.relationships?.find {
            it.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                    it.originRelationshipId == relationshipId
        }
        Assertions.assertNotNull(candidateReferenceRel, "Candidate should have a REFERENCE relationship")
        Assertions.assertEquals("Employer", candidateReferenceRel!!.name)
        Assertions.assertEquals("company", candidateReferenceRel.sourceEntityTypeKey)
        Assertions.assertEquals(listOf("company"), candidateReferenceRel.entityTypeKeys)
        Assertions.assertEquals(EntityRelationshipCardinality.MANY_TO_ONE, candidateReferenceRel.cardinality)
        Assertions.assertFalse(
            candidateReferenceRel.bidirectional,
            "REFERENCE relationships should not be bidirectional"
        )

        // Verify job has a REFERENCE relationship
        val jobReferenceRel = updatedJob!!.relationships?.find {
            it.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                    it.originRelationshipId == relationshipId
        }
        Assertions.assertNotNull(jobReferenceRel, "Job should have a REFERENCE relationship")
        Assertions.assertEquals("Employer", jobReferenceRel!!.name)
        Assertions.assertEquals("company", jobReferenceRel.sourceEntityTypeKey)
        Assertions.assertEquals(listOf("company"), jobReferenceRel.entityTypeKeys)
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
            sourceEntityTypeKey = "company",
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
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithOrigin, jobEntity))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("company")))
            .thenReturn(Optional.of(companyWithOrigin))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("job")))
            .thenReturn(Optional.of(jobEntity))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        // When: Creating the REFERENCE relationship
        entityTypeRelationshipService.createRelationships(
            definitions = listOf(
                SaveRelationshipDefinitionRequest(
                    id = jobReferenceRelationship.id,
                    key = "job",
                    relationship = jobReferenceRelationship
                )
            ),
            workspaceId = workspaceId
        )

        // Then: The company's ORIGIN relationship should be updated to include job
        Assertions.assertEquals(2, savedEntityTypes.size, "Company and Job entity types should be updated")

        val updatedCompany = savedEntityTypes.find { it.key == "company" }
        Assertions.assertNotNull(updatedCompany, "Company entity type should be updated")

        // Find the updated ORIGIN relationship
        val updatedOriginRel = updatedCompany!!.relationships?.find {
            it.id == originRelationshipId &&
                    it.relationshipType == EntityTypeRelationshipType.ORIGIN
        }
        Assertions.assertNotNull(updatedOriginRel, "Company should still have the ORIGIN relationship")

        // Verify job was added to entityTypeKeys
        Assertions.assertTrue(
            updatedOriginRel!!.entityTypeKeys!!.contains("job"),
            "Job should be added to origin's entityTypeKeys"
        )
        Assertions.assertTrue(
            updatedOriginRel.entityTypeKeys!!.contains("candidate"),
            "Candidate should still be in origin's entityTypeKeys"
        )

        // Verify job was added to bidirectionalEntityTypeKeys
        Assertions.assertTrue(
            updatedOriginRel.bidirectionalEntityTypeKeys!!.contains("job"),
            "Job should be added to origin's bidirectionalEntityTypeKeys"
        )
        Assertions.assertTrue(
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
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyEntityType, candidateEntityType, jobEntityType))

        // When/Then: Should throw validation error
        val exception = Assertions.assertThrows(IllegalArgumentException::class.java) {
            entityTypeRelationshipService.createRelationships(
                definitions = listOf(
                    SaveRelationshipDefinitionRequest(
                        id = invalidRelationship.id,
                        key = "company",
                        relationship = invalidRelationship
                    )
                ),
                workspaceId = workspaceId
            )
        }

        Assertions.assertTrue(
            exception.message!!.contains("bidirectionalEntityTypeKeys that are not in entityTypeKeys"),
            "Error message should mention bidirectionalEntityTypeKeys validation"
        )
        Assertions.assertTrue(
            exception.message!!.contains("job"),
            "Error message should mention the invalid key"
        )
    }

    // ========== TEST CASE 5: updateRelationships - Adding Relationships ==========

    @Test
    fun `updateRelationships - adds new ORIGIN relationships`() {
        // Given: Company entity type with no relationships
        val companyWithId = companyEntityType.copy(
            id = UUID.randomUUID(),
            relationships = emptyList()
        )

        val newRelationshipId = UUID.randomUUID()
        val newRelationship = EntityRelationshipDefinition(
            id = newRelationshipId,
            name = "Job Openings",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("job"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("job"),
            inverseName = "Company",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        // Mock the diff service
        val diff = EntityTypeRelationshipDiff(
            added = listOf(
                SaveRelationshipDefinitionRequest(
                    id = newRelationship.id,
                    key = "company",
                    relationship = newRelationship
                )
            ),
            removed = emptyList(),
            modified = emptyList()
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithId, jobEntityType))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("job")))
            .thenReturn(Optional.of(jobEntityType))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        whenever(authTokenService.getUserId()).thenReturn(userId)

        // When: Updating relationships with additions
        entityTypeRelationshipService.updateRelationships(workspaceId, diff)

        // Then: Both entity types should be saved with relationships
        Assertions.assertTrue(savedEntityTypes.size >= 2, "At least Company and Job should be updated")

        val updatedJob = savedEntityTypes.find { it.key == "job" }
        Assertions.assertNotNull(updatedJob, "Job entity type should be updated")

        // Verify job has the inverse REFERENCE relationship
        val jobReference = updatedJob!!.relationships?.find {
            it.relationshipType == EntityTypeRelationshipType.REFERENCE &&
                    it.originRelationshipId == newRelationshipId
        }
        Assertions.assertNotNull(jobReference, "Job should have inverse REFERENCE relationship")
        Assertions.assertEquals("Company", jobReference!!.name)
    }

    // ========== TEST CASE 6: updateRelationships - Removing Relationships ==========

    @Test
    fun `updateRelationships - removes ORIGIN relationship and cascades to REFERENCE`() {
        // Given: Company has an ORIGIN relationship, Job has inverse REFERENCE
        val originRelationshipId = UUID.randomUUID()

        val companyOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Employees",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate"),
            inverseName = "Employer",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(companyOriginRelationship)
        )

        val candidateReferenceRelationship = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Employer",
            sourceEntityTypeKey = "candidate",
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val candidateWithRelationship = candidateEntityType.copy(
            relationships = listOf(candidateReferenceRelationship)
        )

        // Mock the diff service
        val diff = EntityTypeRelationshipDiff(
            added = emptyList(),
            removed = listOf(
                EntityTypeRelationshipDeleteRequest(
                    relationship = companyOriginRelationship,
                    type = companyEntityType,
                    action = DeleteRelationshipDefinitionRequest.DeleteAction.DELETE_RELATIONSHIP

                )
            ),
            modified = emptyList()
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, candidateWithRelationship))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("candidate")))
            .thenReturn(Optional.of(candidateWithRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        whenever(authTokenService.getUserId()).thenReturn(userId)

        // When: Removing the ORIGIN relationship
        entityTypeRelationshipService.updateRelationships(workspaceId, diff)

        // Then: Both relationships should be removed
        val updatedCompany = savedEntityTypes.find { it.key == "company" }
        val updatedCandidate = savedEntityTypes.find { it.key == "candidate" }

        Assertions.assertNotNull(updatedCompany, "Company should be updated")
        Assertions.assertNotNull(updatedCandidate, "Candidate should be updated")

        // Verify company's ORIGIN relationship is removed
        val companyHasOrigin = updatedCompany!!.relationships?.any {
            it.id == originRelationshipId
        } ?: false
        Assertions.assertFalse(companyHasOrigin, "Company's ORIGIN relationship should be removed")

        // Verify candidate's REFERENCE relationship is also removed (cascade)
        val candidateHasReference = updatedCandidate!!.relationships?.any {
            it.originRelationshipId == originRelationshipId
        } ?: false
        Assertions.assertFalse(
            candidateHasReference,
            "Candidate's REFERENCE relationship should be cascaded and removed"
        )
    }

    @Test
    fun `updateRelationships - prevents removal of protected relationships`() {
        // Given: A protected ORIGIN relationship
        val protectedRelationshipId = UUID.randomUUID()

        val protectedRelationship = EntityRelationshipDefinition(
            id = protectedRelationshipId,
            name = "System Relationship",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate"),
            allowPolymorphic = false,
            required = true,
            cardinality = EntityRelationshipCardinality.ONE_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = true, // Protected!
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithProtected = companyEntityType.copy(
            relationships = listOf(protectedRelationship)
        )

        // Mock the diff service
        val diff = EntityTypeRelationshipDiff(
            added = emptyList(),
            removed = listOf(
                EntityTypeRelationshipDeleteRequest(
                    relationship = protectedRelationship,
                    type = companyEntityType,
                    action = DeleteRelationshipDefinitionRequest.DeleteAction.DELETE_RELATIONSHIP

                )
            ),
            modified = emptyList()
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithProtected, candidateEntityType))

        whenever(authTokenService.getUserId()).thenReturn(userId)

        // When/Then: Should throw exception
        val exception = Assertions.assertThrows(IllegalStateException::class.java) {
            entityTypeRelationshipService.updateRelationships(workspaceId, diff)
        }

        Assertions.assertTrue(
            exception.message!!.contains("Cannot remove protected relationship"),
            "Error message should mention protected relationship"
        )
        Assertions.assertTrue(
            exception.message!!.contains("System Relationship"),
            "Error message should include relationship name"
        )
    }

    // ========== TEST CASE 7: updateRelationships - INVERSE_NAME_CHANGED ==========

    @Test
    fun `updateRelationships - INVERSE_NAME_CHANGED updates REFERENCE relationships using default name`() {
        // Given: Company has ORIGIN relationship with inverseName "Employer"
        val originRelationshipId = UUID.randomUUID()

        val previousOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Employees",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate"),
            inverseName = "Employer", // Old inverse name
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val updatedOriginRelationship = previousOriginRelationship.copy(
            inverseName = "Company" // New inverse name
        )

        val candidateReferenceRelationship = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Employer", // Still using the default inverse name
            sourceEntityTypeKey = "candidate",
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(previousOriginRelationship)
        )

        val candidateWithRelationship = candidateEntityType.copy(
            relationships = listOf(candidateReferenceRelationship)
        )

        // Mock the diff service
        val modification = EntityTypeRelationshipModification(
            previous = previousOriginRelationship,
            updated = updatedOriginRelationship,
            changes = setOf(EntityTypeRelationshipChangeType.INVERSE_NAME_CHANGED)
        )

        val diff = EntityTypeRelationshipDiff(
            added = emptyList(),
            removed = emptyList(),
            modified = listOf(modification)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, candidateWithRelationship))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("candidate")))
            .thenReturn(Optional.of(candidateWithRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        // When: Updating with INVERSE_NAME_CHANGED
        entityTypeRelationshipService.updateRelationships(workspaceId, diff)

        // Then: Candidate's REFERENCE relationship should be updated to "Company"
        val updatedCandidate = savedEntityTypes.find { it.key == "candidate" }
        Assertions.assertNotNull(updatedCandidate, "Candidate should be updated")

        val updatedReference = updatedCandidate!!.relationships?.find {
            it.originRelationshipId == originRelationshipId
        }
        Assertions.assertNotNull(updatedReference, "Reference relationship should exist")
        Assertions.assertEquals(
            "Company",
            updatedReference!!.name,
            "Reference name should be updated to new inverse name"
        )
    }

    @Test
    fun `updateRelationships - INVERSE_NAME_CHANGED skips manually renamed REFERENCE relationships`() {
        // Given: REFERENCE relationship with custom name (not using default inverse name)
        val originRelationshipId = UUID.randomUUID()

        val previousOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Employees",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate"),
            inverseName = "Employer",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val updatedOriginRelationship = previousOriginRelationship.copy(
            inverseName = "Company"
        )

        val candidateReferenceRelationship = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Current Employer", // Manually renamed - NOT using default "Employer"
            sourceEntityTypeKey = "candidate",
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(previousOriginRelationship)
        )

        val candidateWithRelationship = candidateEntityType.copy(
            relationships = listOf(candidateReferenceRelationship)
        )

        // Mock the diff service
        val modification = EntityTypeRelationshipModification(
            previous = previousOriginRelationship,
            updated = updatedOriginRelationship,
            changes = setOf(EntityTypeRelationshipChangeType.INVERSE_NAME_CHANGED)
        )

        val diff = EntityTypeRelationshipDiff(
            added = emptyList(),
            removed = emptyList(),
            modified = listOf(modification)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, candidateWithRelationship))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("candidate")))
            .thenReturn(Optional.of(candidateWithRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        // When: Updating with INVERSE_NAME_CHANGED
        entityTypeRelationshipService.updateRelationships(workspaceId, diff)

        // Then: Candidate's REFERENCE relationship should NOT be changed (it was manually renamed)
        val updatedCandidate = savedEntityTypes.find { it.key == "candidate" }
        Assertions.assertNotNull(updatedCandidate, "Candidate should be updated")

        val updatedReference = updatedCandidate!!.relationships?.find {
            it.originRelationshipId == originRelationshipId
        }
        Assertions.assertNotNull(updatedReference, "Reference relationship should exist")
        Assertions.assertEquals(
            "Current Employer",
            updatedReference!!.name,
            "Manually renamed reference should keep its custom name"
        )
    }

    // ========== TEST CASE 8: updateRelationships - CARDINALITY_CHANGED ==========

    @Test
    fun `updateRelationships - CARDINALITY_CHANGED updates inverse REFERENCE cardinality`() {
        // Given: ONE_TO_MANY relationship changing to ONE_TO_ONE
        val originRelationshipId = UUID.randomUUID()

        val previousOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Primary Contact",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY, // OLD
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate"),
            inverseName = "Companies",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val updatedOriginRelationship = previousOriginRelationship.copy(
            cardinality = EntityRelationshipCardinality.ONE_TO_ONE // NEW
        )

        val candidateReferenceRelationship = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Companies",
            sourceEntityTypeKey = "candidate",
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE, // Should become ONE_TO_ONE
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(previousOriginRelationship)
        )

        val candidateWithRelationship = candidateEntityType.copy(
            relationships = listOf(candidateReferenceRelationship)
        )

        // Mock the diff service
        val modification = EntityTypeRelationshipModification(
            previous = previousOriginRelationship,
            updated = updatedOriginRelationship,
            changes = setOf(EntityTypeRelationshipChangeType.CARDINALITY_CHANGED)
        )

        val diff = EntityTypeRelationshipDiff(
            added = emptyList(),
            removed = emptyList(),
            modified = listOf(modification)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, candidateWithRelationship))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("candidate")))
            .thenReturn(Optional.of(candidateWithRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        // When: Updating with CARDINALITY_CHANGED
        entityTypeRelationshipService.updateRelationships(workspaceId, diff)

        // Then: Candidate's REFERENCE relationship should have inverted cardinality
        val updatedCandidate = savedEntityTypes.find { it.key == "candidate" }
        Assertions.assertNotNull(updatedCandidate, "Candidate should be updated")

        val updatedReference = updatedCandidate!!.relationships?.find {
            it.originRelationshipId == originRelationshipId
        }
        Assertions.assertNotNull(updatedReference, "Reference relationship should exist")
        Assertions.assertEquals(
            EntityRelationshipCardinality.ONE_TO_ONE,
            updatedReference!!.cardinality,
            "Reference cardinality should be inverted to ONE_TO_ONE"
        )
    }

    // ========== TEST CASE 9: updateRelationships - BIDIRECTIONAL_ENABLED ==========

    @Test
    fun `updateRelationships - BIDIRECTIONAL_ENABLED creates inverse REFERENCE relationships`() {
        // Given: Unidirectional ORIGIN relationship becoming bidirectional
        val originRelationshipId = UUID.randomUUID()

        val previousOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Jobs",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("job"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = false, // OLD
            bidirectionalEntityTypeKeys = null, // OLD
            inverseName = null, // OLD
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val updatedOriginRelationship = previousOriginRelationship.copy(
            bidirectional = true, // NEW
            bidirectionalEntityTypeKeys = listOf("job"), // NEW
            inverseName = "Company" // NEW
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(previousOriginRelationship)
        )

        val jobWithNoRelationship = jobEntityType.copy(
            relationships = emptyList()
        )

        // Mock the diff service
        val modification = EntityTypeRelationshipModification(
            previous = previousOriginRelationship,
            updated = updatedOriginRelationship,
            changes = setOf(EntityTypeRelationshipChangeType.BIDIRECTIONAL_ENABLED)
        )

        val diff = EntityTypeRelationshipDiff(
            added = emptyList(),
            removed = emptyList(),
            modified = listOf(modification)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, jobWithNoRelationship))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("job")))
            .thenReturn(Optional.of(jobWithNoRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        // When: Enabling bidirectional
        entityTypeRelationshipService.updateRelationships(workspaceId, diff)

        // Then: Job should have a new REFERENCE relationship
        val updatedJob = savedEntityTypes.find { it.key == "job" }
        Assertions.assertNotNull(updatedJob, "Job should be updated")

        val newReference = updatedJob!!.relationships?.find {
            it.originRelationshipId == originRelationshipId &&
                    it.relationshipType == EntityTypeRelationshipType.REFERENCE
        }
        Assertions.assertNotNull(newReference, "Job should have new REFERENCE relationship")
        Assertions.assertEquals("Company", newReference!!.name)
        Assertions.assertEquals(EntityRelationshipCardinality.MANY_TO_ONE, newReference.cardinality)
    }

    @Test
    fun `updateRelationships - BIDIRECTIONAL_ENABLED validates bidirectionalEntityTypeKeys is not empty`() {
        // Given: Relationship with empty bidirectionalEntityTypeKeys
        val originRelationshipId = UUID.randomUUID()

        val previousOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Jobs",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("job"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val updatedOriginRelationship = previousOriginRelationship.copy(
            bidirectional = true,
            bidirectionalEntityTypeKeys = emptyList(), // EMPTY!
            inverseName = "Company"
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(previousOriginRelationship)
        )

        // Mock the diff service
        val modification = EntityTypeRelationshipModification(
            previous = previousOriginRelationship,
            updated = updatedOriginRelationship,
            changes = setOf(EntityTypeRelationshipChangeType.BIDIRECTIONAL_ENABLED)
        )

        val diff = EntityTypeRelationshipDiff(
            added = emptyList(),
            removed = emptyList(),
            modified = listOf(modification)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(jobEntityType, companyWithRelationship))

        // When/Then: Should throw validation error
        val exception = Assertions.assertThrows(IllegalArgumentException::class.java) {
            entityTypeRelationshipService.updateRelationships(workspaceId, diff)
        }

        Assertions.assertTrue(
            exception.message!!.contains("bidirectionalEntityTypeKeys must not be empty"),
            "Error message should mention empty bidirectionalEntityTypeKeys"
        )
    }

    // ========== TEST CASE 10: updateRelationships - BIDIRECTIONAL_DISABLED ==========`

    @Test
    fun `updateRelationships - BIDIRECTIONAL_DISABLED removes inverse REFERENCE relationships`() {
        // Given: Bidirectional relationship becoming unidirectional
        val originRelationshipId = UUID.randomUUID()

        val previousOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Jobs",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("job"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true, // OLD
            bidirectionalEntityTypeKeys = listOf("job"), // OLD
            inverseName = "Company", // OLD
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val updatedOriginRelationship = previousOriginRelationship.copy(
            bidirectional = false, // NEW
            bidirectionalEntityTypeKeys = null, // NEW
            inverseName = null // NEW
        )

        val jobReferenceRelationship = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Company",
            sourceEntityTypeKey = "job",
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(previousOriginRelationship)
        )

        val jobWithRelationship = jobEntityType.copy(
            relationships = listOf(jobReferenceRelationship)
        )

        // Mock the diff service
        val modification = EntityTypeRelationshipModification(
            previous = previousOriginRelationship,
            updated = updatedOriginRelationship,
            changes = setOf(EntityTypeRelationshipChangeType.BIDIRECTIONAL_DISABLED)
        )

        val diff = EntityTypeRelationshipDiff(
            added = emptyList(),
            removed = emptyList(),
            modified = listOf(modification)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, jobWithRelationship))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("job")))
            .thenReturn(Optional.of(jobWithRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        // When: Disabling bidirectional
        entityTypeRelationshipService.updateRelationships(workspaceId, diff)

        // Then: Job's REFERENCE relationship should be removed
        val updatedJob = savedEntityTypes.find { it.key == "job" }
        Assertions.assertNotNull(updatedJob, "Job should be updated")

        val hasReference = updatedJob!!.relationships?.any {
            it.originRelationshipId == originRelationshipId
        } ?: false
        Assertions.assertFalse(hasReference, "Job's REFERENCE relationship should be removed")
    }

    // ========== TEST CASE 11: updateRelationships - BIDIRECTIONAL_TARGETS_CHANGED ==========

    @Test
    fun `updateRelationships - BIDIRECTIONAL_TARGETS_CHANGED adds and removes inverse relationships`() {
        // Given: Relationship changing targets from [candidate] to [job, candidate]
        val originRelationshipId = UUID.randomUUID()

        val previousOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Employees",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate", "job"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate"), // OLD: only candidate
            inverseName = "Employer",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val updatedOriginRelationship = previousOriginRelationship.copy(
            bidirectionalEntityTypeKeys = listOf("job", "candidate")
        )

        val candidateReferenceRelationship = EntityRelationshipDefinition(
            id = UUID.randomUUID(),
            name = "Employer",
            sourceEntityTypeKey = "candidate",
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(previousOriginRelationship)
        )

        val candidateWithRelationship = candidateEntityType.copy(
            relationships = listOf(candidateReferenceRelationship)
        )

        val jobWithNoRelationship = jobEntityType.copy(
            relationships = emptyList()
        )

        // Mock the diff service
        val modification = EntityTypeRelationshipModification(
            previous = previousOriginRelationship,
            updated = updatedOriginRelationship,
            changes = setOf(EntityTypeRelationshipChangeType.BIDIRECTIONAL_TARGETS_CHANGED)
        )

        val diff = EntityTypeRelationshipDiff(
            added = emptyList(),
            removed = emptyList(),
            modified = listOf(modification)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, candidateWithRelationship, jobWithNoRelationship))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("job")))
            .thenReturn(Optional.of(jobWithNoRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        // When: Changing bidirectional targets
        entityTypeRelationshipService.updateRelationships(workspaceId, diff)

        // Then: Job should have a new REFERENCE relationship
        val updatedJob = savedEntityTypes.find { it.key == "job" }
        Assertions.assertNotNull(updatedJob, "Job should be updated")

        val newJobReference = updatedJob!!.relationships?.find {
            it.originRelationshipId == originRelationshipId
        }
        Assertions.assertNotNull(newJobReference, "Job should have new REFERENCE relationship")
        Assertions.assertEquals("Employer", newJobReference!!.name)

        // And: Candidate should still have its REFERENCE relationship
        val updatedCandidate = savedEntityTypes.find { it.key == "candidate" }
        Assertions.assertNotNull(updatedCandidate, "Candidate should be updated")

        val candidateStillHasReference = updatedCandidate!!.relationships?.any {
            it.originRelationshipId == originRelationshipId
        } ?: false
        Assertions.assertTrue(candidateStillHasReference, "Candidate should still have REFERENCE relationship")
    }

    // ========== TEST CASE 12: removeRelationships - REFERENCE with REMOVE_BIDIRECTIONAL ==========

    @Test
    fun `removeRelationships - REFERENCE with REMOVE_BIDIRECTIONAL removes bidirectional link only`() {
        // Given: Company has ORIGIN relationship to [candidate, job]
        //        Candidate has REFERENCE relationship back
        //        We want to remove Candidate's REFERENCE using REMOVE_BIDIRECTIONAL
        val originRelationshipId = UUID.randomUUID()
        val referenceRelationshipId = UUID.randomUUID()

        val companyOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Employees",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate", "job"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate", "job"),
            inverseName = "Employer",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(companyOriginRelationship)
        )

        val candidateReferenceRelationship = EntityRelationshipDefinition(
            id = referenceRelationshipId,
            name = "Employer",
            sourceEntityTypeKey = "company", // Points to where ORIGIN is defined
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val candidateWithRelationship = candidateEntityType.copy(
            relationships = listOf(candidateReferenceRelationship)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, candidateWithRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        whenever(authTokenService.getUserId()).thenReturn(userId)

        // When: Removing the REFERENCE relationship with REMOVE_BIDIRECTIONAL action
        entityTypeRelationshipService.removeRelationships(
            workspaceId = workspaceId,
            relationships = listOf(
                EntityTypeRelationshipDeleteRequest(
                    relationship = candidateReferenceRelationship,
                    type = candidateWithRelationship,
                    action = DeleteRelationshipDefinitionRequest.DeleteAction.REMOVE_BIDIRECTIONAL
                )
            )
        )

        // Then: Candidate's REFERENCE relationship should be removed
        val updatedCandidate = savedEntityTypes.find { it.key == "candidate" }
        Assertions.assertNotNull(updatedCandidate, "Candidate should be updated")

        val candidateHasReference = updatedCandidate!!.relationships?.any {
            it.id == referenceRelationshipId
        } ?: false
        Assertions.assertFalse(candidateHasReference, "Candidate's REFERENCE relationship should be removed")

        // And: Company's ORIGIN relationship should still exist
        val updatedCompany = savedEntityTypes.find { it.key == "company" }
        Assertions.assertNotNull(updatedCompany, "Company should be updated")

        val updatedOrigin = updatedCompany!!.relationships?.find {
            it.id == originRelationshipId
        }
        Assertions.assertNotNull(updatedOrigin, "Company's ORIGIN relationship should still exist")

        // And: Candidate should be removed from bidirectionalEntityTypeKeys but entityTypeKeys intact
        Assertions.assertFalse(
            updatedOrigin!!.bidirectionalEntityTypeKeys?.contains("candidate") ?: true,
            "Candidate should be removed from bidirectionalEntityTypeKeys"
        )
        Assertions.assertTrue(
            updatedOrigin.bidirectionalEntityTypeKeys?.contains("job") ?: false,
            "Job should still be in bidirectionalEntityTypeKeys"
        )
        Assertions.assertTrue(
            updatedOrigin.entityTypeKeys?.contains("candidate") ?: false,
            "Candidate should still be in entityTypeKeys (relationship data preserved)"
        )
        Assertions.assertTrue(
            updatedOrigin.entityTypeKeys?.contains("job") ?: false,
            "Job should still be in entityTypeKeys"
        )
    }

    // ========== TEST CASE 13: removeRelationships - REFERENCE with REMOVE_ENTITY_TYPE ==========

    @Test
    fun `removeRelationships - REFERENCE with REMOVE_ENTITY_TYPE removes entity type from relationship`() {
        // Given: Company has ORIGIN relationship to [candidate, job]
        //        Candidate has REFERENCE relationship back
        //        We want to remove Candidate's REFERENCE using REMOVE_ENTITY_TYPE
        val originRelationshipId = UUID.randomUUID()
        val referenceRelationshipId = UUID.randomUUID()

        val companyOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Employees",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate", "job"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate", "job"),
            inverseName = "Employer",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(companyOriginRelationship)
        )

        val candidateReferenceRelationship = EntityRelationshipDefinition(
            id = referenceRelationshipId,
            name = "Employer",
            sourceEntityTypeKey = "company", // Points to where ORIGIN is defined
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val candidateWithRelationship = candidateEntityType.copy(
            relationships = listOf(candidateReferenceRelationship)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, candidateWithRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        whenever(authTokenService.getUserId()).thenReturn(userId)

        // When: Removing the REFERENCE relationship with REMOVE_ENTITY_TYPE action
        entityTypeRelationshipService.removeRelationships(
            workspaceId = workspaceId,
            relationships = listOf(
                EntityTypeRelationshipDeleteRequest(
                    relationship = candidateReferenceRelationship,
                    type = candidateWithRelationship,
                    action = DeleteRelationshipDefinitionRequest.DeleteAction.REMOVE_ENTITY_TYPE
                )
            )
        )

        // Then: Candidate's REFERENCE relationship should be removed
        val updatedCandidate = savedEntityTypes.find { it.key == "candidate" }
        Assertions.assertNotNull(updatedCandidate, "Candidate should be updated")

        val candidateHasReference = updatedCandidate!!.relationships?.any {
            it.id == referenceRelationshipId
        } ?: false
        Assertions.assertFalse(candidateHasReference, "Candidate's REFERENCE relationship should be removed")

        // And: Company's ORIGIN relationship should still exist
        val updatedCompany = savedEntityTypes.find { it.key == "company" }
        Assertions.assertNotNull(updatedCompany, "Company should be updated")

        val updatedOrigin = updatedCompany!!.relationships?.find {
            it.id == originRelationshipId
        }
        Assertions.assertNotNull(updatedOrigin, "Company's ORIGIN relationship should still exist")

        // And: Candidate should be removed from BOTH bidirectionalEntityTypeKeys AND entityTypeKeys
        Assertions.assertFalse(
            updatedOrigin!!.bidirectionalEntityTypeKeys?.contains("candidate") ?: true,
            "Candidate should be removed from bidirectionalEntityTypeKeys"
        )
        Assertions.assertTrue(
            updatedOrigin.bidirectionalEntityTypeKeys?.contains("job") ?: false,
            "Job should still be in bidirectionalEntityTypeKeys"
        )
        Assertions.assertFalse(
            updatedOrigin.entityTypeKeys?.contains("candidate") ?: true,
            "Candidate should be removed from entityTypeKeys (relationship data removed)"
        )
        Assertions.assertTrue(
            updatedOrigin.entityTypeKeys?.contains("job") ?: false,
            "Job should still be in entityTypeKeys"
        )
    }

    // ========== TEST CASE 14: removeRelationships - REFERENCE with DELETE_RELATIONSHIP ==========

    @Test
    fun `removeRelationships - REFERENCE with DELETE_RELATIONSHIP cascades to delete ORIGIN`() {
        // Given: Company has ORIGIN relationship to [candidate, job]
        //        Candidate has REFERENCE relationship back
        //        Job has REFERENCE relationship back
        //        We want to remove Candidate's REFERENCE using DELETE_RELATIONSHIP
        //        This should cascade to delete the entire ORIGIN and all other REFERENCES
        val originRelationshipId = UUID.randomUUID()
        val candidateReferenceId = UUID.randomUUID()
        val jobReferenceId = UUID.randomUUID()

        val companyOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Employees",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate", "job"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate", "job"),
            inverseName = "Employer",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(companyOriginRelationship)
        )

        val candidateReferenceRelationship = EntityRelationshipDefinition(
            id = candidateReferenceId,
            name = "Employer",
            sourceEntityTypeKey = "company", // Points to where ORIGIN is defined
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val candidateWithRelationship = candidateEntityType.copy(
            relationships = listOf(candidateReferenceRelationship)
        )

        val jobReferenceRelationship = EntityRelationshipDefinition(
            id = jobReferenceId,
            name = "Employer",
            sourceEntityTypeKey = "company", // Points to where ORIGIN is defined
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val jobWithRelationship = jobEntityType.copy(
            relationships = listOf(jobReferenceRelationship)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, candidateWithRelationship, jobWithRelationship))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("candidate")))
            .thenReturn(Optional.of(candidateWithRelationship))

        whenever(entityTypeRepository.findByworkspaceIdAndKey(eq(workspaceId), eq("job")))
            .thenReturn(Optional.of(jobWithRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        whenever(authTokenService.getUserId()).thenReturn(userId)

        // When: Removing the REFERENCE relationship with DELETE_RELATIONSHIP action
        entityTypeRelationshipService.removeRelationships(
            workspaceId = workspaceId,
            relationships = listOf(
                EntityTypeRelationshipDeleteRequest(
                    relationship = candidateReferenceRelationship,
                    type = candidateWithRelationship,
                    action = DeleteRelationshipDefinitionRequest.DeleteAction.DELETE_RELATIONSHIP
                )
            )
        )

        // Then: Company's ORIGIN relationship should be completely removed
        val updatedCompany = savedEntityTypes.find { it.key == "company" }
        Assertions.assertNotNull(updatedCompany, "Company should be updated")

        val companyHasOrigin = updatedCompany!!.relationships?.any {
            it.id == originRelationshipId
        } ?: false
        Assertions.assertFalse(companyHasOrigin, "Company's ORIGIN relationship should be completely removed")

        // And: Candidate's REFERENCE relationship should be removed
        val updatedCandidate = savedEntityTypes.find { it.key == "candidate" }
        Assertions.assertNotNull(updatedCandidate, "Candidate should be updated")

        val candidateHasReference = updatedCandidate!!.relationships?.any {
            it.id == candidateReferenceId
        } ?: false
        Assertions.assertFalse(candidateHasReference, "Candidate's REFERENCE relationship should be removed")

        // And: Job's REFERENCE relationship should also be cascaded and removed
        val updatedJob = savedEntityTypes.find { it.key == "job" }
        Assertions.assertNotNull(updatedJob, "Job should be updated")

        val jobHasReference = updatedJob!!.relationships?.any {
            it.id == jobReferenceId
        } ?: false
        Assertions.assertFalse(jobHasReference, "Job's REFERENCE relationship should be cascaded and removed")
    }

    // ========== TEST CASE 15: removeRelationships - Protected REFERENCE relationship ==========

    @Test
    fun `removeRelationships - prevents removal of protected REFERENCE relationships`() {
        // Given: A protected REFERENCE relationship
        val originRelationshipId = UUID.randomUUID()
        val protectedReferenceId = UUID.randomUUID()

        val companyOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "System Employees",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate"),
            allowPolymorphic = false,
            required = true,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate"),
            inverseName = "System Employer",
            protected = true,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(companyOriginRelationship)
        )

        val candidateReferenceRelationship = EntityRelationshipDefinition(
            id = protectedReferenceId,
            name = "System Employer",
            sourceEntityTypeKey = "company", // Points to where ORIGIN is defined
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = true,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = true, // Protected!
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val candidateWithRelationship = candidateEntityType.copy(
            relationships = listOf(candidateReferenceRelationship)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, candidateWithRelationship))

        whenever(authTokenService.getUserId()).thenReturn(userId)

        // When/Then: Should throw exception for any action
        val exception = Assertions.assertThrows(IllegalStateException::class.java) {
            entityTypeRelationshipService.removeRelationships(
                workspaceId = workspaceId,
                relationships = listOf(
                    EntityTypeRelationshipDeleteRequest(
                        relationship = candidateReferenceRelationship,
                        type = candidateWithRelationship,
                        action = DeleteRelationshipDefinitionRequest.DeleteAction.REMOVE_BIDIRECTIONAL
                    )
                )
            )
        }

        Assertions.assertTrue(
            exception.message!!.contains("Cannot remove protected relationship"),
            "Error message should mention protected relationship"
        )
        Assertions.assertTrue(
            exception.message!!.contains("System Employer"),
            "Error message should include relationship name"
        )
    }

    // ========== TEST CASE 16: removeRelationships - REMOVE_BIDIRECTIONAL with single target ==========

    @Test
    fun `removeRelationships - REFERENCE with REMOVE_BIDIRECTIONAL when only one bidirectional target exists`() {
        // Given: Company has ORIGIN relationship to only [candidate]
        //        When we remove candidate's REFERENCE with REMOVE_BIDIRECTIONAL
        //        The ORIGIN's bidirectionalEntityTypeKeys becomes empty but relationship persists
        val originRelationshipId = UUID.randomUUID()
        val referenceRelationshipId = UUID.randomUUID()

        val companyOriginRelationship = EntityRelationshipDefinition(
            id = originRelationshipId,
            name = "Employees",
            sourceEntityTypeKey = "company",
            originRelationshipId = null,
            relationshipType = EntityTypeRelationshipType.ORIGIN,
            entityTypeKeys = listOf("candidate"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
            bidirectional = true,
            bidirectionalEntityTypeKeys = listOf("candidate"), // Only one target
            inverseName = "Employer",
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val companyWithRelationship = companyEntityType.copy(
            relationships = listOf(companyOriginRelationship)
        )

        val candidateReferenceRelationship = EntityRelationshipDefinition(
            id = referenceRelationshipId,
            name = "Employer",
            sourceEntityTypeKey = "company", // Points to where ORIGIN is defined
            originRelationshipId = originRelationshipId,
            relationshipType = EntityTypeRelationshipType.REFERENCE,
            entityTypeKeys = listOf("company"),
            allowPolymorphic = false,
            required = false,
            cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
            bidirectional = false,
            bidirectionalEntityTypeKeys = null,
            inverseName = null,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )

        val candidateWithRelationship = candidateEntityType.copy(
            relationships = listOf(candidateReferenceRelationship)
        )

        // Mock repository calls
        whenever(entityTypeRepository.findByworkspaceIdAndKeyIn(eq(workspaceId), any()))
            .thenReturn(listOf(companyWithRelationship, candidateWithRelationship))

        val savedEntityTypes = mutableListOf<EntityTypeEntity>()
        whenever(entityTypeRepository.saveAll<EntityTypeEntity>(any()))
            .thenAnswer { invocation ->
                val entities = invocation.getArgument(0) as Collection<EntityTypeEntity>
                savedEntityTypes.addAll(entities)
                entities
            }

        whenever(authTokenService.getUserId()).thenReturn(userId)

        // When: Removing the only REFERENCE relationship with REMOVE_BIDIRECTIONAL
        entityTypeRelationshipService.removeRelationships(
            workspaceId = workspaceId,
            relationships = listOf(
                EntityTypeRelationshipDeleteRequest(
                    relationship = candidateReferenceRelationship,
                    type = candidateWithRelationship,
                    action = DeleteRelationshipDefinitionRequest.DeleteAction.REMOVE_BIDIRECTIONAL
                )
            )
        )

        // Then: Company's ORIGIN relationship should still exist
        val updatedCompany = savedEntityTypes.find { it.key == "company" }
        Assertions.assertNotNull(updatedCompany, "Company should be updated")

        val updatedOrigin = updatedCompany!!.relationships?.find {
            it.id == originRelationshipId
        }
        Assertions.assertNotNull(updatedOrigin, "Company's ORIGIN relationship should still exist")

        // And: bidirectionalEntityTypeKeys should be empty
        Assertions.assertTrue(
            updatedOrigin!!.bidirectionalEntityTypeKeys?.isEmpty() ?: false,
            "bidirectionalEntityTypeKeys should be empty but relationship still exists"
        )

        // And: entityTypeKeys should still contain candidate (unidirectional now)
        Assertions.assertTrue(
            updatedOrigin.entityTypeKeys?.contains("candidate") ?: false,
            "entityTypeKeys should still contain candidate for unidirectional access"
        )
    }

    // ========== Helper Methods ==========

    private fun createEntityType(key: String, singularName: String, pluralName: String): EntityTypeEntity {
        val id: UUID = UUID.randomUUID()

        return EntityTypeEntity(
            id = UUID.randomUUID(),
            key = key,
            displayNameSingular = singularName,
            displayNamePlural = pluralName,
            workspaceId = workspaceId,
            type = EntityCategory.STANDARD,
            schema = Schema<UUID>(
                key = SchemaType.OBJECT,
                type = DataType.OBJECT,
                properties = mapOf(
                    id to Schema(
                        key = SchemaType.TEXT,
                        label = "Name",
                        type = DataType.STRING,
                        required = true
                    )
                )
            ),
            columns = emptyList(),
            relationships = emptyList(),
            identifierKey = id
        )
    }
}