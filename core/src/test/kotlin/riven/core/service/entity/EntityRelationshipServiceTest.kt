package riven.core.service.entity

import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.core.DataType
import riven.core.enums.entity.EntityCategory
import riven.core.enums.entity.EntityPropertyType
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.models.common.validation.Schema
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.configuration.EntityTypeAttributeColumn
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.type.EntityTypeService
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import java.time.ZonedDateTime
import java.util.*

/**
 * Unit tests for EntityRelationshipService.
 *
 * Tests the management of entity instance relationships including:
 * - Creating new relationships
 * - Creating bidirectional relationships with inverse mirroring
 * - Removing relationships
 * - Updating relationships (adding/removing targets)
 * - Edge cases and validation
 */
@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        EntityRelationshipServiceTest.TestConfig::class,
        EntityRelationshipService::class
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
class EntityRelationshipServiceTest {

    @Configuration
    class TestConfig

    private val userId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")
    private val workspaceId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")

    @MockitoBean
    private lateinit var entityRelationshipRepository: EntityRelationshipRepository

    @MockitoBean
    private lateinit var entityRepository: EntityRepository

    @MockitoBean
    private lateinit var entityTypeService: EntityTypeService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    private lateinit var entityRelationshipService: EntityRelationshipService

    // Test entity types
    private lateinit var companyEntityType: EntityTypeEntity
    private lateinit var contactEntityType: EntityTypeEntity
    private lateinit var projectEntityType: EntityTypeEntity

    // Relationship definition IDs
    private lateinit var companyContactsRelId: UUID
    private lateinit var contactCompanyRelId: UUID
    private lateinit var companyProjectsRelId: UUID
    private lateinit var projectCompanyRelId: UUID

    @BeforeEach
    fun setup() {
        reset(entityRelationshipRepository, entityRepository, entityTypeService)

        // Initialize relationship IDs
        companyContactsRelId = UUID.randomUUID()
        contactCompanyRelId = UUID.randomUUID()
        companyProjectsRelId = UUID.randomUUID()
        projectCompanyRelId = UUID.randomUUID()

        // Create test entity types with relationships
        companyEntityType = createEntityType(
            key = "company",
            singularName = "Company",
            pluralName = "Companies",
            relationships = listOf(
                createRelationshipDefinition(
                    id = companyContactsRelId,
                    name = "Contacts",
                    sourceKey = "company",
                    type = EntityTypeRelationshipType.ORIGIN,
                    cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
                    entityTypeKeys = listOf("contact"),
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = listOf("contact"),
                    inverseName = "Company"
                ),
                createRelationshipDefinition(
                    id = companyProjectsRelId,
                    name = "Projects",
                    sourceKey = "company",
                    type = EntityTypeRelationshipType.ORIGIN,
                    cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
                    entityTypeKeys = listOf("project"),
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = listOf("project"),
                    inverseName = "Company"
                )
            )
        )

        contactEntityType = createEntityType(
            key = "contact",
            singularName = "Contact",
            pluralName = "Contacts",
            relationships = listOf(
                createRelationshipDefinition(
                    id = contactCompanyRelId,
                    name = "Company",
                    sourceKey = "contact",
                    type = EntityTypeRelationshipType.REFERENCE,
                    originRelationshipId = companyContactsRelId,
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    entityTypeKeys = listOf("company"),
                    bidirectional = false
                )
            )
        )

        projectEntityType = createEntityType(
            key = "project",
            singularName = "Project",
            pluralName = "Projects",
            relationships = listOf(
                createRelationshipDefinition(
                    id = projectCompanyRelId,
                    name = "Company",
                    sourceKey = "project",
                    type = EntityTypeRelationshipType.REFERENCE,
                    originRelationshipId = companyProjectsRelId,
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    entityTypeKeys = listOf("company"),
                    bidirectional = false
                )
            )
        )

        // Default: no existing relationships
        whenever(entityRelationshipRepository.findBySourceId(any()))
            .thenReturn(emptyList())
    }

    // ========== TEST CASE 1: New Entity with No Relationships ==========

    @Nested
    inner class NewEntityWithNoRelationships {

        @Test
        fun `saveRelationships - new entity with empty relationships returns empty map`() {
            // Given: A new entity with no relationships
            val entityId = UUID.randomUUID()

            // When: Saving relationships with empty map
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = emptyMap()
            )

            // Then: Returns empty links, no repository interactions
            assertTrue(result.links.isEmpty(), "Result should be empty for entity with no relationships")
            assertTrue(result.impactedEntityIds.isEmpty(), "No entities should be impacted")
            verify(entityRelationshipRepository, never()).saveAll<EntityRelationshipEntity>(any())
            verify(entityRelationshipRepository, never()).deleteAllBySourceIdAndFieldId(any(), any())
        }
    }

    // ========== TEST CASE 2: Creating New Relationships ==========

    @Nested
    inner class CreatingNewRelationships {

        @Test
        fun `saveRelationships - creates single relationship to one target entity`() {
            // Given: A new entity with one relationship to one target
            val entityId = UUID.randomUUID()
            val contactId = UUID.randomUUID()
            val contact = createEntity(
                id = contactId,
                typeId = contactEntityType.id!!,
                payload = emptyMap()
            )

            // Mock repository calls
            whenever(entityRepository.findAllById(eq(setOf(contactId))))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation -> invocation.getArgument(0) as Collection<EntityRelationshipEntity> }

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(contactId))
            )

            // Then: Creates relationship and returns EntityLink
            assertFalse(result.links.isEmpty(), "Result should contain the relationship")
            assertTrue(result.links.containsKey(companyContactsRelId), "Result should have the field ID as key")
            assertEquals(1, result.links[companyContactsRelId]?.size, "Should have one EntityLink")
            assertEquals(
                contactId,
                result.links[companyContactsRelId]?.first()?.id,
                "EntityLink should reference the contact"
            )

            // Verify repository interactions
            verify(entityRelationshipRepository).saveAll<EntityRelationshipEntity>(argThat { entities ->
                entities.any { it.sourceId == entityId && it.targetId == contactId && it.fieldId == companyContactsRelId }
            })
        }

        @Test
        fun `saveRelationships - creates multiple relationships to multiple targets`() {
            // Given: A company with relationships to multiple contacts
            val entityId = UUID.randomUUID()
            val contact1Id = UUID.randomUUID()
            val contact2Id = UUID.randomUUID()
            val contact3Id = UUID.randomUUID()

            val contacts = listOf(
                createEntity(id = contact1Id, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = contact2Id, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = contact3Id, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(contacts)
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation -> invocation.getArgument(0) as Collection<EntityRelationshipEntity> }

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(contact1Id, contact2Id, contact3Id))
            )

            // Then: Creates all relationships
            assertEquals(3, result.links[companyContactsRelId]?.size, "Should have three EntityLinks")

            verify(entityRelationshipRepository).saveAll<EntityRelationshipEntity>(argThat { entities: Collection<EntityRelationshipEntity> ->
                entities.size == 3 &&
                        entities.all { it.sourceId == entityId && it.fieldId == companyContactsRelId }
            })
        }

        @Test
        fun `saveRelationships - creates relationships for multiple relationship fields`() {
            // Given: A company with both contacts AND projects
            val entityId = UUID.randomUUID()
            val contactId = UUID.randomUUID()
            val projectId = UUID.randomUUID()

            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())
            val project = createEntity(id = projectId, typeId = projectEntityType.id!!, payload = emptyMap())

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact, project))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType, projectEntityType))
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation -> invocation.getArgument(0) as Collection<EntityRelationshipEntity> }

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(
                    companyContactsRelId to listOf(contactId),
                    companyProjectsRelId to listOf(projectId)
                )
            )

            // Then: Both relationship fields have EntityLinks
            assertTrue(result.links.containsKey(companyContactsRelId), "Result should have contacts field")
            assertTrue(result.links.containsKey(companyProjectsRelId), "Result should have projects field")
            assertEquals(1, result.links[companyContactsRelId]?.size)
            assertEquals(1, result.links[companyProjectsRelId]?.size)
        }
    }

    // ========== TEST CASE 3: Bidirectional Relationships ==========

    @Nested
    inner class BidirectionalRelationships {

        @Test
        fun `saveRelationships - creates inverse relationship on target entity for bidirectional ORIGIN`() {
            // Given: A company (ORIGIN side) adding a contact relationship
            val entityId = UUID.randomUUID()
            val contactId = UUID.randomUUID()
            val contact = createEntity(
                id = contactId,
                typeId = contactEntityType.id!!,
                payload = emptyMap()
            )

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            val savedRelationships = mutableListOf<EntityRelationshipEntity>()
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val entities = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationships.addAll(entities)
                    entities
                }

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(contactId))
            )

            // Then: Two relationships created - source and inverse
            assertEquals(2, savedRelationships.size, "Should create both source and inverse relationships")

            // Verify source relationship: company -> contact
            val sourceRel = savedRelationships.find {
                it.sourceId == entityId && it.targetId == contactId
            }
            assertNotNull(sourceRel, "Source relationship should exist")
            assertEquals(companyContactsRelId, sourceRel!!.fieldId, "Source field ID should match")

            // Verify inverse relationship: contact -> company
            val inverseRel = savedRelationships.find {
                it.sourceId == contactId && it.targetId == entityId
            }
            assertNotNull(inverseRel, "Inverse relationship should exist")
            assertEquals(
                contactCompanyRelId,
                inverseRel!!.fieldId,
                "Inverse field ID should match REFERENCE definition"
            )

            // Verify impacted entities includes the contact (which had inverse relationship created)
            assertTrue(result.impactedEntityIds.contains(contactId), "Contact should be in impacted entities")
            assertEquals(1, result.impactedEntityIds.size, "Only one entity should be impacted")
        }

        @Test
        fun `saveRelationships - creates inverse relationships for multiple targets of same type`() {
            // Given: A company with multiple contacts (all bidirectional)
            val entityId = UUID.randomUUID()
            val contact1Id = UUID.randomUUID()
            val contact2Id = UUID.randomUUID()

            val contacts = listOf(
                createEntity(id = contact1Id, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = contact2Id, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(contacts)
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            val savedRelationships = mutableListOf<EntityRelationshipEntity>()
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val entities = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationships.addAll(entities)
                    entities
                }

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(contact1Id, contact2Id))
            )

            // Then: 4 relationships total (2 source + 2 inverse)
            assertEquals(4, savedRelationships.size, "Should create 2 source and 2 inverse relationships")

            // Verify inverse relationships exist for both contacts
            val inverseRels = savedRelationships.filter { it.fieldId == contactCompanyRelId }
            assertEquals(2, inverseRels.size, "Should have 2 inverse relationships")
            assertTrue(inverseRels.any { it.sourceId == contact1Id }, "Contact 1 should have inverse")
            assertTrue(inverseRels.any { it.sourceId == contact2Id }, "Contact 2 should have inverse")
        }

        @Test
        fun `saveRelationships - creates inverse relationship on origin entity when saving from REFERENCE side`() {
            // Given: A contact (REFERENCE side) adding a relationship to a company
            // This tests the REFERENCE -> ORIGIN mirroring path
            val contactId = UUID.randomUUID()
            val companyId = UUID.randomUUID()
            val company = createEntity(
                id = companyId,
                typeId = companyEntityType.id!!,
                payload = emptyMap()
            )

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(company))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(companyEntityType))

            val savedRelationships = mutableListOf<EntityRelationshipEntity>()
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val entities = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationships.addAll(entities)
                    entities
                }

            // When: Saving relationships from the REFERENCE side (contact -> company)
            val result = entityRelationshipService.saveRelationships(
                id = contactId,
                workspaceId = workspaceId,
                type = contactEntityType,
                curr = mapOf(contactCompanyRelId to listOf(companyId))
            )

            // Then: Two relationships created - source and inverse
            assertEquals(2, savedRelationships.size, "Should create both source and inverse relationships")

            // Verify source relationship: contact -> company (REFERENCE side)
            val sourceRel = savedRelationships.find {
                it.sourceId == contactId && it.targetId == companyId
            }
            assertNotNull(sourceRel, "Source relationship should exist")
            assertEquals(contactCompanyRelId, sourceRel!!.fieldId, "Source field ID should match REFERENCE definition")

            // Verify inverse relationship: company -> contact (back to ORIGIN side)
            val inverseRel = savedRelationships.find {
                it.sourceId == companyId && it.targetId == contactId
            }
            assertNotNull(inverseRel, "Inverse relationship should exist on ORIGIN side")
            assertEquals(
                companyContactsRelId,
                inverseRel!!.fieldId,
                "Inverse field ID should match ORIGIN definition"
            )

            // Verify impacted entities includes the company (which had inverse relationship created)
            assertTrue(result.impactedEntityIds.contains(companyId), "Company should be in impacted entities")
            assertEquals(1, result.impactedEntityIds.size, "Only one entity should be impacted")
        }

        @Test
        fun `saveRelationships - creates inverse relationships for multiple targets when saving from REFERENCE side`() {
            // Given: A contact that can belong to multiple companies (if cardinality allowed)
            // For this test, we'll create multiple contacts pointing to the same company
            val contact1Id = UUID.randomUUID()
            val contact2Id = UUID.randomUUID()
            val companyId = UUID.randomUUID()

            val company = createEntity(
                id = companyId,
                typeId = companyEntityType.id!!,
                payload = emptyMap()
            )

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(company))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(companyEntityType))

            val savedRelationshipsContact1 = mutableListOf<EntityRelationshipEntity>()
            val savedRelationshipsContact2 = mutableListOf<EntityRelationshipEntity>()

            // First call for contact1
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val entities = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationshipsContact1.addAll(entities)
                    entities
                }

            // When: Contact 1 saves relationship to company
            entityRelationshipService.saveRelationships(
                id = contact1Id,
                workspaceId = workspaceId,
                type = contactEntityType,
                curr = mapOf(contactCompanyRelId to listOf(companyId))
            )

            // Then: Both source and inverse created for contact1
            assertEquals(2, savedRelationshipsContact1.size, "Should create source and inverse for contact1")

            val contact1Inverse = savedRelationshipsContact1.find {
                it.sourceId == companyId && it.targetId == contact1Id
            }
            assertNotNull(contact1Inverse, "Company should have inverse to contact1")
            assertEquals(companyContactsRelId, contact1Inverse!!.fieldId)

            // Reset and test contact2
            reset(entityRelationshipRepository)
            whenever(entityRelationshipRepository.findBySourceId(any()))
                .thenReturn(emptyList())
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val entities = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationshipsContact2.addAll(entities)
                    entities
                }

            // When: Contact 2 saves relationship to same company
            entityRelationshipService.saveRelationships(
                id = contact2Id,
                workspaceId = workspaceId,
                type = contactEntityType,
                curr = mapOf(contactCompanyRelId to listOf(companyId))
            )

            // Then: Both source and inverse created for contact2
            assertEquals(2, savedRelationshipsContact2.size, "Should create source and inverse for contact2")

            val contact2Inverse = savedRelationshipsContact2.find {
                it.sourceId == companyId && it.targetId == contact2Id
            }
            assertNotNull(contact2Inverse, "Company should have inverse to contact2")
            assertEquals(companyContactsRelId, contact2Inverse!!.fieldId)
        }

        @Test
        fun `saveRelationships - creates inverse relationships across multiple entity types (polymorphic)`() {
            // Given: An entity type that can relate to multiple target types bidirectionally
            val polymorphicRelId = UUID.randomUUID()
            val contactRefId = UUID.randomUUID()
            val projectRefId = UUID.randomUUID()

            // Create a polymorphic entity type
            val polymorphicType = createEntityType(
                key = "task",
                singularName = "Task",
                pluralName = "Tasks",
                relationships = listOf(
                    createRelationshipDefinition(
                        id = polymorphicRelId,
                        name = "Assignees",
                        sourceKey = "task",
                        type = EntityTypeRelationshipType.ORIGIN,
                        cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
                        entityTypeKeys = listOf("contact", "project"),
                        bidirectional = true,
                        bidirectionalEntityTypeKeys = listOf("contact", "project"),
                        inverseName = "Assigned Tasks"
                    )
                )
            )

            // Update contact and project types with REFERENCE to the polymorphic relationship
            val contactWithRef = contactEntityType.copy(
                relationships = contactEntityType.relationships?.plus(
                    createRelationshipDefinition(
                        id = contactRefId,
                        name = "Assigned Tasks",
                        sourceKey = "contact",
                        type = EntityTypeRelationshipType.REFERENCE,
                        originRelationshipId = polymorphicRelId,
                        cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
                        entityTypeKeys = listOf("task"),
                        bidirectional = false
                    )
                )
            )

            val projectWithRef = projectEntityType.copy(
                relationships = projectEntityType.relationships?.plus(
                    createRelationshipDefinition(
                        id = projectRefId,
                        name = "Assigned Tasks",
                        sourceKey = "project",
                        type = EntityTypeRelationshipType.REFERENCE,
                        originRelationshipId = polymorphicRelId,
                        cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
                        entityTypeKeys = listOf("task"),
                        bidirectional = false
                    )
                )
            )

            val taskId = UUID.randomUUID()
            val contactId = UUID.randomUUID()
            val projectId = UUID.randomUUID()

            val contact = createEntity(id = contactId, typeId = contactWithRef.id!!, payload = emptyMap())
            val project = createEntity(id = projectId, typeId = projectWithRef.id!!, payload = emptyMap())

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact, project))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactWithRef, projectWithRef))

            val savedRelationships = mutableListOf<EntityRelationshipEntity>()
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val entities = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationships.addAll(entities)
                    entities
                }

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                id = taskId,
                workspaceId = workspaceId,
                type = polymorphicType,
                curr = mapOf(polymorphicRelId to listOf(contactId, projectId))
            )

            // Then: 4 relationships (2 source + 2 inverse to different entity types)
            assertEquals(4, savedRelationships.size, "Should create source and inverse for both target types")

            // Verify inverse to contact
            val contactInverse = savedRelationships.find {
                it.sourceId == contactId && it.targetId == taskId
            }
            assertNotNull(contactInverse, "Contact should have inverse relationship to task")
            assertEquals(contactRefId, contactInverse!!.fieldId)

            // Verify inverse to project
            val projectInverse = savedRelationships.find {
                it.sourceId == projectId && it.targetId == taskId
            }
            assertNotNull(projectInverse, "Project should have inverse relationship to task")
            assertEquals(projectRefId, projectInverse!!.fieldId)
        }
    }

    // ========== TEST CASE 4: Updating Relationships (Adding Targets) ==========

    @Nested
    inner class UpdatingRelationshipsAddingTargets {

        @Test
        fun `saveRelationships - adds new target to existing relationship`() {
            // Given: An existing company with one contact, adding a second contact
            val entityId = UUID.randomUUID()
            val existingContactId = UUID.randomUUID()
            val newContactId = UUID.randomUUID()

            // Mock: existing relationship in database
            whenever(entityRelationshipRepository.findBySourceId(entityId))
                .thenReturn(
                    listOf(
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = entityId,
                            targetId = existingContactId,
                            fieldId = companyContactsRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        )
                    )
                )

            val contacts = listOf(
                createEntity(id = existingContactId, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = newContactId, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            whenever(entityRepository.findAllById(any()))
                .thenReturn(contacts)
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            val savedRelationships = mutableListOf<EntityRelationshipEntity>()
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val entities = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationships.addAll(entities)
                    entities
                }

            // When: Saving relationships with both contacts
            entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(existingContactId, newContactId))
            )

            // Then: Only new contact relationship is created (not existing)
            val sourceRels = savedRelationships.filter { it.sourceId == entityId }
            assertEquals(1, sourceRels.size, "Should only create relationship for NEW contact")
            assertEquals(newContactId, sourceRels.first().targetId, "New relationship should target the new contact")

            // Verify no deletions occurred
            verify(entityRelationshipRepository, never()).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                any(), any(), any()
            )
        }

        @Test
        fun `saveRelationships - adds new relationship field to existing entity`() {
            // Given: A company with contacts, now adding projects
            val entityId = UUID.randomUUID()
            val contactId = UUID.randomUUID()
            val projectId = UUID.randomUUID()

            // Mock: existing contact relationship in database
            whenever(entityRelationshipRepository.findBySourceId(entityId))
                .thenReturn(
                    listOf(
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = entityId,
                            targetId = contactId,
                            fieldId = companyContactsRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        )
                    )
                )

            val entities = listOf(
                createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = projectId, typeId = projectEntityType.id!!, payload = emptyMap())
            )

            whenever(entityRepository.findAllById(any()))
                .thenReturn(entities)
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType, projectEntityType))

            val savedRelationships = mutableListOf<EntityRelationshipEntity>()
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val ents = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationships.addAll(ents)
                    ents
                }

            // When: Saving relationships with contacts and new projects
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(
                    companyContactsRelId to listOf(contactId),
                    companyProjectsRelId to listOf(projectId)
                )
            )

            // Then: Only project relationships created (contacts unchanged)
            val projectRels = savedRelationships.filter { it.fieldId == companyProjectsRelId }
            assertTrue(projectRels.isNotEmpty(), "Should create project relationships")

            // Result should include both relationship fields
            assertTrue(result.links.containsKey(companyContactsRelId), "Result should have contacts")
            assertTrue(result.links.containsKey(companyProjectsRelId), "Result should have projects")
        }
    }

    // ========== TEST CASE 5: Updating Relationships (Removing Targets) ==========

    @Nested
    inner class UpdatingRelationshipsRemovingTargets {

        @Test
        fun `saveRelationships - removes target from existing relationship`() {
            // Given: A company with two contacts, removing one
            val entityId = UUID.randomUUID()
            val contact1Id = UUID.randomUUID()
            val contact2Id = UUID.randomUUID()

            // Mock: existing relationships in database
            whenever(entityRelationshipRepository.findBySourceId(entityId))
                .thenReturn(
                    listOf(
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = entityId,
                            targetId = contact1Id,
                            fieldId = companyContactsRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        ),
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = entityId,
                            targetId = contact2Id,
                            fieldId = companyContactsRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        )
                    )
                )

            val contacts = listOf(
                createEntity(id = contact1Id, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = contact2Id, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            whenever(entityRepository.findAllById(any()))
                .thenReturn(contacts)
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships with only contact1 (contact2 removed)
            entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(contact1Id))
            )

            // Then: Relationship to contact2 is deleted
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(entityId),
                eq(companyContactsRelId),
                eq(setOf(contact2Id))
            )

            // Verify no new relationships created (contact1 already existed)
            verify(entityRelationshipRepository, never()).saveAll<EntityRelationshipEntity>(any())
        }

        @Test
        fun `saveRelationships - removes bidirectional inverse when target removed`() {
            // Given: A company removing a contact (bidirectional relationship)
            val entityId = UUID.randomUUID()
            val contactId = UUID.randomUUID()

            // Mock: existing relationship in database
            whenever(entityRelationshipRepository.findBySourceId(entityId))
                .thenReturn(
                    listOf(
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = entityId,
                            targetId = contactId,
                            fieldId = companyContactsRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        )
                    )
                )

            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())

            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships with empty list (all contacts removed)
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to emptyList())
            )

            // Then: Both source and inverse relationships are deleted
            // Source: company -> contact
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(entityId),
                eq(companyContactsRelId),
                eq(setOf(contactId))
            )

            // Inverse: contact -> company (the REFERENCE side)
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(contactId),
                eq(contactCompanyRelId),
                eq(setOf(entityId))
            )

            // Verify impacted entities includes the contact (which had inverse relationship removed)
            assertTrue(result.impactedEntityIds.contains(contactId), "Contact should be in impacted entities")
            assertEquals(1, result.impactedEntityIds.size, "Only one entity should be impacted")
        }

        @Test
        fun `saveRelationships - removes origin inverse when target removed from REFERENCE side`() {
            // Given: A contact (REFERENCE side) removing its relationship to a company
            // This tests the REFERENCE -> ORIGIN removal mirroring path
            val contactId = UUID.randomUUID()
            val companyId = UUID.randomUUID()

            // Mock: existing relationship in database
            whenever(entityRelationshipRepository.findBySourceId(contactId))
                .thenReturn(
                    listOf(
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = contactId,
                            targetId = companyId,
                            fieldId = contactCompanyRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        )
                    )
                )

            val company = createEntity(id = companyId, typeId = companyEntityType.id!!, payload = emptyMap())

            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(company))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(companyEntityType))

            // When: Saving relationships with empty list (all companies removed from contact)
            val result = entityRelationshipService.saveRelationships(
                id = contactId,
                workspaceId = workspaceId,
                type = contactEntityType,
                curr = mapOf(contactCompanyRelId to emptyList())
            )

            // Then: Both source and inverse relationships are deleted
            // Source: contact -> company (REFERENCE side)
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(contactId),
                eq(contactCompanyRelId),
                eq(setOf(companyId))
            )

            // Inverse: company -> contact (the ORIGIN side)
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(companyId),
                eq(companyContactsRelId),
                eq(setOf(contactId))
            )

            // Verify impacted entities includes the company (which had inverse relationship removed)
            assertTrue(result.impactedEntityIds.contains(companyId), "Company should be in impacted entities")
            assertEquals(1, result.impactedEntityIds.size, "Only one entity should be impacted")
        }

        @Test
        fun `saveRelationships - removes entire relationship field when field removed from payload`() {
            // Given: A company with contacts, removing the entire contacts field
            val entityId = UUID.randomUUID()
            val contact1Id = UUID.randomUUID()
            val contact2Id = UUID.randomUUID()

            // Mock: existing relationships in database
            whenever(entityRelationshipRepository.findBySourceId(entityId))
                .thenReturn(
                    listOf(
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = entityId,
                            targetId = contact1Id,
                            fieldId = companyContactsRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        ),
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = entityId,
                            targetId = contact2Id,
                            fieldId = companyContactsRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        )
                    )
                )

            val contacts = listOf(
                createEntity(id = contact1Id, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = contact2Id, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            whenever(entityRepository.findAllById(any()))
                .thenReturn(contacts)
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships with no contacts field at all
            entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = emptyMap()
            )

            // Then: All relationships for that field are deleted
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldId(
                eq(entityId),
                eq(companyContactsRelId)
            )
        }
    }

    // ========== TEST CASE 6: Mixed Add/Remove Operations ==========

    @Nested
    inner class MixedAddRemoveOperations {

        @Test
        fun `saveRelationships - handles simultaneous add and remove of targets`() {
            // Given: A company replacing contacts (remove old, add new)
            val entityId = UUID.randomUUID()
            val oldContactId = UUID.randomUUID()
            val newContactId = UUID.randomUUID()

            // Mock: existing relationship in database
            whenever(entityRelationshipRepository.findBySourceId(entityId))
                .thenReturn(
                    listOf(
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = entityId,
                            targetId = oldContactId,
                            fieldId = companyContactsRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        )
                    )
                )

            val contacts = listOf(
                createEntity(id = oldContactId, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = newContactId, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            whenever(entityRepository.findAllById(any()))
                .thenReturn(contacts)
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            val savedRelationships = mutableListOf<EntityRelationshipEntity>()
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val ents = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationships.addAll(ents)
                    ents
                }

            // When: Saving relationships with new contact only
            entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(newContactId))
            )

            // Then: Old contact is removed, new contact is added
            // Verify deletion of old
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(entityId),
                eq(companyContactsRelId),
                eq(setOf(oldContactId))
            )

            // Verify creation of new
            val sourceRels =
                savedRelationships.filter { it.sourceId == entityId && it.fieldId == companyContactsRelId }
            assertEquals(1, sourceRels.size, "Should create relationship to new contact")
            assertEquals(newContactId, sourceRels.first().targetId)
        }

        @Test
        fun `saveRelationships - handles add to one field while removing from another`() {
            // Given: A company adding a project while removing a contact
            val entityId = UUID.randomUUID()
            val contactId = UUID.randomUUID()
            val projectId = UUID.randomUUID()

            // Mock: existing contact relationship in database
            whenever(entityRelationshipRepository.findBySourceId(entityId))
                .thenReturn(
                    listOf(
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = entityId,
                            targetId = contactId,
                            fieldId = companyContactsRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        )
                    )
                )

            val entities = listOf(
                createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = projectId, typeId = projectEntityType.id!!, payload = emptyMap())
            )

            whenever(entityRepository.findAllById(any()))
                .thenReturn(entities)
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType, projectEntityType))

            val savedRelationships = mutableListOf<EntityRelationshipEntity>()
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val ents = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationships.addAll(ents)
                    ents
                }

            // When: Saving relationships with only projects (contacts removed)
            entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyProjectsRelId to listOf(projectId))
            )

            // Then: Contacts field deleted, projects field created
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldId(
                eq(entityId),
                eq(companyContactsRelId)
            )

            val projectRels = savedRelationships.filter { it.fieldId == companyProjectsRelId }
            assertTrue(projectRels.isNotEmpty(), "Should create project relationships")
        }
    }

    // ========== TEST CASE 7: Edge Cases ==========

    @Nested
    inner class EdgeCases {

        @Test
        fun `saveRelationships - ignores non-existent target entities`() {
            // Given: A company with a relationship to a non-existent entity
            val entityId = UUID.randomUUID()
            val validContactId = UUID.randomUUID()
            val invalidContactId = UUID.randomUUID()

            val validContact = createEntity(id = validContactId, typeId = contactEntityType.id!!, payload = emptyMap())

            // Mock: Only return the valid contact (invalid not found)
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(validContact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            val savedRelationships = mutableListOf<EntityRelationshipEntity>()
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val ents = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationships.addAll(ents)
                    ents
                }

            // When: Saving relationships with both valid and invalid IDs
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(validContactId, invalidContactId))
            )

            // Then: Only valid contact relationship is created
            val sourceRels =
                savedRelationships.filter { it.sourceId == entityId && it.fieldId == companyContactsRelId }
            assertEquals(1, sourceRels.size, "Should only create relationship for valid entity")
            assertEquals(validContactId, sourceRels.first().targetId)

            // Result should only have the valid entity link
            assertEquals(1, result.links[companyContactsRelId]?.size, "Result should only have valid EntityLink")
        }

        @Test
        fun `saveRelationships - handles relationship field with unknown definition gracefully`() {
            // Given: An entity with a relationship field not in the type's definitions
            val entityId = UUID.randomUUID()
            val unknownFieldId = UUID.randomUUID()
            val contactId = UUID.randomUUID()

            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())

            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships with unknown field ID
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(unknownFieldId to listOf(contactId))
            )

            // Then: Unknown field is skipped, no relationships created
            verify(entityRelationshipRepository, never()).saveAll<EntityRelationshipEntity>(any())
            assertFalse(result.links.containsKey(unknownFieldId), "Unknown field should not be in result")
        }

        @Test
        fun `saveRelationships - no changes when prev and curr have same relationships`() {
            // Given: Entity with no changes to relationships
            val entityId = UUID.randomUUID()
            val contactId = UUID.randomUUID()

            // Mock: existing relationship in database
            whenever(entityRelationshipRepository.findBySourceId(entityId))
                .thenReturn(
                    listOf(
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = entityId,
                            targetId = contactId,
                            fieldId = companyContactsRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        )
                    )
                )

            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())

            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships with same data
            entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(contactId))
            )

            // Then: No saves or deletes (no changes)
            verify(entityRelationshipRepository, never()).saveAll<EntityRelationshipEntity>(any())
            verify(entityRelationshipRepository, never()).deleteAllBySourceIdAndFieldId(any(), any())
            verify(entityRelationshipRepository, never()).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                any(),
                any(),
                any()
            )
        }
    }

    // ========== TEST CASE 8: Unidirectional Relationships ==========

    @Nested
    inner class UnidirectionalRelationships {

        @Test
        fun `saveRelationships - does not create inverse for unidirectional relationship`() {
            // Given: An entity type with unidirectional relationship
            val uniRelId = UUID.randomUUID()

            val unidirectionalType = createEntityType(
                key = "document",
                singularName = "Document",
                pluralName = "Documents",
                relationships = listOf(
                    createRelationshipDefinition(
                        id = uniRelId,
                        name = "Related Contacts",
                        sourceKey = "document",
                        type = EntityTypeRelationshipType.ORIGIN,
                        cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
                        entityTypeKeys = listOf("contact"),
                        bidirectional = false, // Unidirectional!
                        bidirectionalEntityTypeKeys = null,
                        inverseName = null
                    )
                )
            )

            val documentId = UUID.randomUUID()
            val contactId = UUID.randomUUID()
            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())

            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            val savedRelationships = mutableListOf<EntityRelationshipEntity>()
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation ->
                    val ents = invocation.getArgument(0) as Collection<EntityRelationshipEntity>
                    savedRelationships.addAll(ents)
                    ents
                }

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                id = documentId,
                workspaceId = workspaceId,
                type = unidirectionalType,
                curr = mapOf(uniRelId to listOf(contactId))
            )

            // Then: Only source relationship created, no inverse
            assertEquals(1, savedRelationships.size, "Should only create source relationship")
            assertEquals(documentId, savedRelationships.first().sourceId)
            assertEquals(contactId, savedRelationships.first().targetId)
            assertEquals(uniRelId, savedRelationships.first().fieldId)
        }

        @Test
        fun `saveRelationships - does not remove inverse for unidirectional relationship removal`() {
            // Given: A unidirectional relationship being removed
            val uniRelId = UUID.randomUUID()

            val unidirectionalType = createEntityType(
                key = "document",
                singularName = "Document",
                pluralName = "Documents",
                relationships = listOf(
                    createRelationshipDefinition(
                        id = uniRelId,
                        name = "Related Contacts",
                        sourceKey = "document",
                        type = EntityTypeRelationshipType.ORIGIN,
                        cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
                        entityTypeKeys = listOf("contact"),
                        bidirectional = false, // Unidirectional
                        bidirectionalEntityTypeKeys = null,
                        inverseName = null
                    )
                )
            )

            val documentId = UUID.randomUUID()
            val contactId = UUID.randomUUID()

            // Mock: existing relationship in database
            whenever(entityRelationshipRepository.findBySourceId(documentId))
                .thenReturn(
                    listOf(
                        EntityRelationshipEntity(
                            workspaceId = workspaceId,
                            sourceId = documentId,
                            targetId = contactId,
                            fieldId = uniRelId,
                            sourceTypeId = UUID.randomUUID(),
                            targetTypeId = UUID.randomUUID()
                        )
                    )
                )

            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())

            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships with empty list (removed)
            entityRelationshipService.saveRelationships(
                id = documentId,
                workspaceId = workspaceId,
                type = unidirectionalType,
                curr = mapOf(uniRelId to emptyList())
            )

            // Then: Only source relationship deleted, no attempt to delete inverse
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(documentId),
                eq(uniRelId),
                eq(setOf(contactId))
            )

            // Should NOT try to delete inverse on contact (since unidirectional)
            verify(entityRelationshipRepository, never()).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(contactId),
                any(),
                any()
            )
        }
    }

    // ========== TEST CASE 9: EntityLink Hydration ==========

    @Nested
    inner class EntityLinkHydration {

        @Test
        fun `saveRelationships - returns EntityLinks with correct icon and label`() {
            // Given: An entity with custom icon
            val entityId = UUID.randomUUID()
            val contactId = UUID.randomUUID()
            val nameFieldId = UUID.randomUUID()

            val contact = createEntity(
                id = contactId,
                typeId = contactEntityType.id!!,
                identifierKey = nameFieldId,
                iconType = IconType.USER,
                iconColour = IconColour.BLUE,
                payload = mapOf(
                    nameFieldId.toString() to EntityAttributePrimitivePayload(
                        value = "John Doe",
                        schemaType = SchemaType.TEXT
                    )
                )
            )

            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation -> invocation.getArgument(0) as Collection<EntityRelationshipEntity> }

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(contactId))
            )

            // Then: EntityLink has correct properties
            val entityLink = result.links[companyContactsRelId]?.first()
            assertNotNull(entityLink, "EntityLink should exist")
            assertEquals(contactId, entityLink!!.id)
            assertEquals(IconType.USER, entityLink.icon.type)
            assertEquals(IconColour.BLUE, entityLink.icon.colour)
            assertEquals("John Doe", entityLink.label)
        }

        @Test
        fun `saveRelationships - uses entity ID as fallback label when identifier not found`() {
            // Given: An entity with no identifier value
            val entityId = UUID.randomUUID()
            val contactId = UUID.randomUUID()
            val missingFieldId = UUID.randomUUID()

            val contact = createEntity(
                id = contactId,
                typeId = contactEntityType.id!!,
                identifierKey = missingFieldId, // Points to non-existent field
                payload = emptyMap()
            )

            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation -> invocation.getArgument(0) as Collection<EntityRelationshipEntity> }

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                id = entityId,
                workspaceId = workspaceId,
                type = companyEntityType,
                curr = mapOf(companyContactsRelId to listOf(contactId))
            )

            // Then: EntityLink uses ID as label
            val entityLink = result.links[companyContactsRelId]?.first()
            assertNotNull(entityLink)
            assertEquals(contactId.toString(), entityLink!!.label, "Should use entity ID as fallback label")
        }
    }

    // ========== Helper Methods ==========

    private fun createEntityType(
        id: UUID = UUID.randomUUID(),
        key: String,
        singularName: String,
        pluralName: String,
        relationships: List<EntityRelationshipDefinition>? = null
    ): EntityTypeEntity {
        val identifierKey = UUID.randomUUID()

        return EntityTypeEntity(
            id = id,
            key = key,
            displayNameSingular = singularName,
            displayNamePlural = pluralName,
            workspaceId = workspaceId,
            type = EntityCategory.STANDARD,
            schema = Schema(
                key = SchemaType.OBJECT,
                type = DataType.OBJECT,
                properties = mapOf(
                    identifierKey to Schema(
                        key = SchemaType.TEXT,
                        label = "Name",
                        type = DataType.STRING,
                        required = true
                    )
                )
            ),
            columns = relationships?.map {
                EntityTypeAttributeColumn(it.id, EntityPropertyType.RELATIONSHIP)
            } ?: emptyList(),
            relationships = relationships,
            identifierKey = identifierKey
        )
    }

    private fun createRelationshipDefinition(
        id: UUID = UUID.randomUUID(),
        name: String,
        sourceKey: String,
        type: EntityTypeRelationshipType,
        cardinality: EntityRelationshipCardinality,
        entityTypeKeys: List<String>?,
        bidirectional: Boolean,
        bidirectionalEntityTypeKeys: List<String>? = null,
        inverseName: String? = null,
        originRelationshipId: UUID? = null
    ): EntityRelationshipDefinition {
        return EntityRelationshipDefinition(
            id = id,
            name = name,
            sourceEntityTypeKey = sourceKey,
            relationshipType = type,
            originRelationshipId = originRelationshipId,
            cardinality = cardinality,
            entityTypeKeys = entityTypeKeys,
            allowPolymorphic = false,
            required = false,
            bidirectional = bidirectional,
            bidirectionalEntityTypeKeys = bidirectionalEntityTypeKeys,
            inverseName = inverseName,
            protected = false,
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
            createdBy = userId,
            updatedBy = userId
        )
    }

    private fun createEntity(
        id: UUID = UUID.randomUUID(),
        typeId: UUID,
        identifierKey: UUID = UUID.randomUUID(),
        iconType: IconType = IconType.FILE,
        iconColour: IconColour = IconColour.NEUTRAL,
        payload: Map<String, EntityAttributePrimitivePayload> = emptyMap()
    ): EntityEntity {
        return EntityEntity(
            id = id,
            workspaceId = workspaceId,
            typeId = typeId,
            typeKey = "test-entity-key",
            identifierKey = identifierKey,
            iconType = iconType,
            iconColour = iconColour,
            payload = payload
        )
    }
}
