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
import riven.core.configuration.auth.OrganisationSecurity
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.common.IconColour
import riven.core.enums.common.IconType
import riven.core.enums.common.SchemaType
import riven.core.enums.core.DataType
import riven.core.enums.entity.EntityCategory
import riven.core.enums.entity.EntityPropertyType
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.entity.EntityTypeRelationshipType
import riven.core.enums.organisation.OrganisationRoles
import riven.core.models.common.validation.Schema
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.models.entity.configuration.EntityTypeAttributeColumn
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.type.EntityTypeService
import riven.core.service.util.OrganisationRole
import riven.core.service.util.WithUserPersona
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
    }

    // ========== TEST CASE 1: New Entity with No Relationships ==========

    @Nested
    inner class NewEntityWithNoRelationships {

        @Test
        fun `saveRelationships - new entity with empty payload returns empty map`() {
            // Given: A new entity with no relationships in payload
            val entity = createEntity(
                typeId = companyEntityType.id!!,
                payload = emptyMap()
            )

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = null,
                curr = entity
            )

            // Then: Returns empty map, no repository interactions
            assertTrue(result.isEmpty(), "Result should be empty for entity with no relationships")
            verify(entityRelationshipRepository, never()).saveAll<EntityRelationshipEntity>(any())
            verify(entityRelationshipRepository, never()).deleteAllBySourceIdAndFieldId(any(), any())
        }

        @Test
        fun `saveRelationships - new entity with only attribute payload returns empty map`() {
            // Given: A new entity with only primitive attributes (no relationships)
            val attributeId = UUID.randomUUID()
            val entity = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    attributeId.toString() to mapOf(
                        "type" to "ATTRIBUTE",
                        "value" to "Test Company",
                        "schemaType" to "TEXT"
                    )
                )
            )

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = null,
                curr = entity
            )

            // Then: Returns empty map
            assertTrue(result.isEmpty(), "Result should be empty for entity with only attributes")
            verify(entityRelationshipRepository, never()).saveAll<EntityRelationshipEntity>(any())
        }
    }

    // ========== TEST CASE 2: Creating New Relationships ==========

    @Nested
    inner class CreatingNewRelationships {

        @Test
        fun `saveRelationships - creates single relationship to one target entity`() {
            // Given: A new entity with one relationship to one target
            val contactId = UUID.randomUUID()
            val contact = createEntity(
                id = contactId,
                typeId = contactEntityType.id!!,
                payload = emptyMap()
            )

            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    )
                )
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
                type = companyEntityType,
                prev = null,
                curr = company
            )

            // Then: Creates relationship and returns EntityLink
            assertFalse(result.isEmpty(), "Result should contain the relationship")
            assertTrue(result.containsKey(companyContactsRelId), "Result should have the field ID as key")
            assertEquals(1, result[companyContactsRelId]?.size, "Should have one EntityLink")
            assertEquals(
                contactId,
                result[companyContactsRelId]?.first()?.id,
                "EntityLink should reference the contact"
            )

            // Verify repository interactions
            verify(entityRelationshipRepository).saveAll<EntityRelationshipEntity>(argThat { entities ->
                entities.any { it.sourceId == company.id && it.targetId == contactId && it.fieldId == companyContactsRelId }
            })
        }

        @Test
        fun `saveRelationships - creates multiple relationships to multiple targets`() {
            // Given: A company with relationships to multiple contacts
            val contact1Id = UUID.randomUUID()
            val contact2Id = UUID.randomUUID()
            val contact3Id = UUID.randomUUID()

            val contacts = listOf(
                createEntity(id = contact1Id, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = contact2Id, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = contact3Id, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contact1Id.toString(), contact2Id.toString(), contact3Id.toString())
                    )
                )
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
                type = companyEntityType,
                prev = null,
                curr = company
            )

            // Then: Creates all relationships
            assertEquals(3, result[companyContactsRelId]?.size, "Should have three EntityLinks")

            verify(entityRelationshipRepository).saveAll<EntityRelationshipEntity>(argThat { entities: Collection<EntityRelationshipEntity> ->
                entities.size == 3 &&
                        entities.all { it.sourceId == company.id && it.fieldId == companyContactsRelId }
            })
        }

        @Test
        fun `saveRelationships - creates relationships for multiple relationship fields`() {
            // Given: A company with both contacts AND projects
            val contactId = UUID.randomUUID()
            val projectId = UUID.randomUUID()

            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())
            val project = createEntity(id = projectId, typeId = projectEntityType.id!!, payload = emptyMap())

            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    ),
                    companyProjectsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(projectId.toString())
                    )
                )
            )

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact, project))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType, projectEntityType))
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation -> invocation.getArgument(0) as Collection<EntityRelationshipEntity> }

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = null,
                curr = company
            )

            // Then: Both relationship fields have EntityLinks
            assertTrue(result.containsKey(companyContactsRelId), "Result should have contacts field")
            assertTrue(result.containsKey(companyProjectsRelId), "Result should have projects field")
            assertEquals(1, result[companyContactsRelId]?.size)
            assertEquals(1, result[companyProjectsRelId]?.size)
        }
    }

    // ========== TEST CASE 3: Bidirectional Relationships ==========

    @Nested
    inner class BidirectionalRelationships {

        @Test
        fun `saveRelationships - creates inverse relationship on target entity for bidirectional ORIGIN`() {
            // Given: A company (ORIGIN side) adding a contact relationship
            val contactId = UUID.randomUUID()
            val contact = createEntity(
                id = contactId,
                typeId = contactEntityType.id!!,
                payload = emptyMap()
            )

            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    )
                )
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
            entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = null,
                curr = company
            )

            // Then: Two relationships created - source and inverse
            assertEquals(2, savedRelationships.size, "Should create both source and inverse relationships")

            // Verify source relationship: company -> contact
            val sourceRel = savedRelationships.find {
                it.sourceId == company.id && it.targetId == contactId
            }
            assertNotNull(sourceRel, "Source relationship should exist")
            assertEquals(companyContactsRelId, sourceRel!!.fieldId, "Source field ID should match")

            // Verify inverse relationship: contact -> company
            val inverseRel = savedRelationships.find {
                it.sourceId == contactId && it.targetId == company.id
            }
            assertNotNull(inverseRel, "Inverse relationship should exist")
            assertEquals(
                contactCompanyRelId,
                inverseRel!!.fieldId,
                "Inverse field ID should match REFERENCE definition"
            )
        }

        @Test
        fun `saveRelationships - creates inverse relationships for multiple targets of same type`() {
            // Given: A company with multiple contacts (all bidirectional)
            val contact1Id = UUID.randomUUID()
            val contact2Id = UUID.randomUUID()

            val contacts = listOf(
                createEntity(id = contact1Id, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = contact2Id, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contact1Id.toString(), contact2Id.toString())
                    )
                )
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
                type = companyEntityType,
                prev = null,
                curr = company
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

            val contactId = UUID.randomUUID()
            val projectId = UUID.randomUUID()

            val contact = createEntity(id = contactId, typeId = contactWithRef.id!!, payload = emptyMap())
            val project = createEntity(id = projectId, typeId = projectWithRef.id!!, payload = emptyMap())

            val task = createEntity(
                typeId = polymorphicType.id!!,
                payload = mapOf(
                    polymorphicRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString(), projectId.toString())
                    )
                )
            )

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
                type = polymorphicType,
                prev = null,
                curr = task
            )

            // Then: 4 relationships (2 source + 2 inverse to different entity types)
            assertEquals(4, savedRelationships.size, "Should create source and inverse for both target types")

            // Verify inverse to contact
            val contactInverse = savedRelationships.find {
                it.sourceId == contactId && it.targetId == task.id
            }
            assertNotNull(contactInverse, "Contact should have inverse relationship to task")
            assertEquals(contactRefId, contactInverse!!.fieldId)

            // Verify inverse to project
            val projectInverse = savedRelationships.find {
                it.sourceId == projectId && it.targetId == task.id
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
            val existingContactId = UUID.randomUUID()
            val newContactId = UUID.randomUUID()

            val prevCompany = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(existingContactId.toString())
                    )
                )
            )

            val currCompany = createEntity(
                id = prevCompany.id!!,
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(existingContactId.toString(), newContactId.toString())
                    )
                )
            )

            val contacts = listOf(
                createEntity(id = existingContactId, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = newContactId, typeId = contactEntityType.id!!, payload = emptyMap())
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
                type = companyEntityType,
                prev = prevCompany,
                curr = currCompany
            )

            // Then: Only new contact relationship is created (not existing)
            val sourceRels = savedRelationships.filter { it.sourceId == currCompany.id }
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
            val contactId = UUID.randomUUID()
            val projectId = UUID.randomUUID()

            val prevCompany = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    )
                )
            )

            val currCompany = createEntity(
                id = prevCompany.id!!,
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    ),
                    companyProjectsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(projectId.toString())
                    )
                )
            )

            val entities = listOf(
                createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = projectId, typeId = projectEntityType.id!!, payload = emptyMap())
            )

            // Mock repository calls
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

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = prevCompany,
                curr = currCompany
            )

            // Then: Only project relationships created (contacts unchanged)
            val projectRels = savedRelationships.filter { it.fieldId == companyProjectsRelId }
            assertTrue(projectRels.isNotEmpty(), "Should create project relationships")

            // Result should include both relationship fields
            assertTrue(result.containsKey(companyContactsRelId), "Result should have contacts")
            assertTrue(result.containsKey(companyProjectsRelId), "Result should have projects")
        }
    }

    // ========== TEST CASE 5: Updating Relationships (Removing Targets) ==========

    @Nested
    inner class UpdatingRelationshipsRemovingTargets {

        @Test
        fun `saveRelationships - removes target from existing relationship`() {
            // Given: A company with two contacts, removing one
            val contact1Id = UUID.randomUUID()
            val contact2Id = UUID.randomUUID()

            val prevCompany = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contact1Id.toString(), contact2Id.toString())
                    )
                )
            )

            val currCompany = createEntity(
                id = prevCompany.id!!,
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contact1Id.toString()) // contact2 removed
                    )
                )
            )

            val contacts = listOf(
                createEntity(id = contact1Id, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = contact2Id, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(contacts)
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = prevCompany,
                curr = currCompany
            )

            // Then: Relationship to contact2 is deleted
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(currCompany.id!!),
                eq(companyContactsRelId),
                eq(setOf(contact2Id))
            )

            // Verify no new relationships created (contact1 already existed)
            verify(entityRelationshipRepository, never()).saveAll<EntityRelationshipEntity>(any())
        }

        @Test
        fun `saveRelationships - removes bidirectional inverse when target removed`() {
            // Given: A company removing a contact (bidirectional relationship)
            val contactId = UUID.randomUUID()

            val prevCompany = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    )
                )
            )

            val currCompany = createEntity(
                id = prevCompany.id!!,
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to emptyList<String>() // All contacts removed
                    )
                )
            )

            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = prevCompany,
                curr = currCompany
            )

            // Then: Both source and inverse relationships are deleted
            // Source: company -> contact
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(currCompany.id!!),
                eq(companyContactsRelId),
                eq(setOf(contactId))
            )

            // Inverse: contact -> company (the REFERENCE side)
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(contactId),
                eq(contactCompanyRelId),
                eq(setOf(currCompany.id!!))
            )
        }

        @Test
        fun `saveRelationships - removes entire relationship field when field removed from payload`() {
            // Given: A company with contacts, removing the entire contacts field
            val contact1Id = UUID.randomUUID()
            val contact2Id = UUID.randomUUID()

            val prevCompany = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contact1Id.toString(), contact2Id.toString())
                    )
                )
            )

            val currCompany = createEntity(
                id = prevCompany.id!!,
                typeId = companyEntityType.id!!,
                payload = emptyMap() // Contacts field completely removed
            )

            val contacts = listOf(
                createEntity(id = contact1Id, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = contact2Id, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            // Mock - need to return contacts for the previous state
            whenever(entityRepository.findAllById(any()))
                .thenReturn(contacts)
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = prevCompany,
                curr = currCompany
            )

            // Then: All relationships for that field are deleted
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldId(
                eq(currCompany.id!!),
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
            val oldContactId = UUID.randomUUID()
            val newContactId = UUID.randomUUID()

            val prevCompany = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(oldContactId.toString())
                    )
                )
            )

            val currCompany = createEntity(
                id = prevCompany.id!!,
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(newContactId.toString()) // Replaced old with new
                    )
                )
            )

            val contacts = listOf(
                createEntity(id = oldContactId, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = newContactId, typeId = contactEntityType.id!!, payload = emptyMap())
            )

            // Mock repository calls
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

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = prevCompany,
                curr = currCompany
            )

            // Then: Old contact is removed, new contact is added
            // Verify deletion of old
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(currCompany.id!!),
                eq(companyContactsRelId),
                eq(setOf(oldContactId))
            )

            // Verify creation of new
            val sourceRels =
                savedRelationships.filter { it.sourceId == currCompany.id && it.fieldId == companyContactsRelId }
            assertEquals(1, sourceRels.size, "Should create relationship to new contact")
            assertEquals(newContactId, sourceRels.first().targetId)
        }

        @Test
        fun `saveRelationships - handles add to one field while removing from another`() {
            // Given: A company adding a project while removing a contact
            val contactId = UUID.randomUUID()
            val projectId = UUID.randomUUID()

            val prevCompany = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    )
                )
            )

            val currCompany = createEntity(
                id = prevCompany.id!!,
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    // Contacts removed entirely
                    companyProjectsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(projectId.toString())
                    )
                )
            )

            val entities = listOf(
                createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap()),
                createEntity(id = projectId, typeId = projectEntityType.id!!, payload = emptyMap())
            )

            // Mock repository calls
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

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = prevCompany,
                curr = currCompany
            )

            // Then: Contacts field deleted, projects field created
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldId(
                eq(currCompany.id!!),
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
            val validContactId = UUID.randomUUID()
            val invalidContactId = UUID.randomUUID()

            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(validContactId.toString(), invalidContactId.toString())
                    )
                )
            )

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

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = null,
                curr = company
            )

            // Then: Only valid contact relationship is created
            val sourceRels =
                savedRelationships.filter { it.sourceId == company.id && it.fieldId == companyContactsRelId }
            assertEquals(1, sourceRels.size, "Should only create relationship for valid entity")
            assertEquals(validContactId, sourceRels.first().targetId)

            // Result should only have the valid entity link
            assertEquals(1, result[companyContactsRelId]?.size, "Result should only have valid EntityLink")
        }

        @Test
        fun `saveRelationships - handles relationship field with unknown definition gracefully`() {
            // Given: An entity with a relationship field not in the type's definitions
            val unknownFieldId = UUID.randomUUID()
            val contactId = UUID.randomUUID()

            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    unknownFieldId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    )
                )
            )

            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())

            // Mock repository calls
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = null,
                curr = company
            )

            // Then: Unknown field is skipped, no relationships created
            verify(entityRelationshipRepository, never()).saveAll<EntityRelationshipEntity>(any())
            assertFalse(result.containsKey(unknownFieldId), "Unknown field should not be in result")
        }

        @Test
        fun `saveRelationships - handles malformed relationship payload gracefully`() {
            // Given: An entity with malformed relationship payload
            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to "not-a-list" // Invalid: should be a list
                    )
                )
            )

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = null,
                curr = company
            )

            // Then: Gracefully handles the malformed data
            assertTrue(
                result.isEmpty() || result[companyContactsRelId]?.isEmpty() == true,
                "Should handle malformed payload gracefully"
            )
        }

        @Test
        fun `saveRelationships - handles invalid UUID in relations list gracefully`() {
            // Given: An entity with invalid UUIDs in relations
            val validContactId = UUID.randomUUID()

            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(validContactId.toString(), "not-a-uuid", "also-invalid")
                    )
                )
            )

            val validContact = createEntity(id = validContactId, typeId = contactEntityType.id!!, payload = emptyMap())

            // Mock
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

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = null,
                curr = company
            )

            // Then: Only valid UUID is processed
            val sourceRels =
                savedRelationships.filter { it.sourceId == company.id && it.fieldId == companyContactsRelId }
            assertEquals(1, sourceRels.size, "Should only process valid UUID")
            assertEquals(validContactId, sourceRels.first().targetId)
        }

        @Test
        fun `saveRelationships - no changes when prev and curr have same relationships`() {
            // Given: Entity with no changes to relationships
            val contactId = UUID.randomUUID()

            val payload = mapOf(
                companyContactsRelId.toString() to mapOf(
                    "type" to "RELATIONSHIP",
                    "relations" to listOf(contactId.toString())
                )
            )

            val prevCompany = createEntity(
                typeId = companyEntityType.id!!,
                payload = payload
            )

            val currCompany = createEntity(
                id = prevCompany.id!!,
                typeId = companyEntityType.id!!,
                payload = payload // Same payload
            )

            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())

            // Mock
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = prevCompany,
                curr = currCompany
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

            val contactId = UUID.randomUUID()
            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())

            val document = createEntity(
                typeId = unidirectionalType.id!!,
                payload = mapOf(
                    uniRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    )
                )
            )

            // Mock
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
                type = unidirectionalType,
                prev = null,
                curr = document
            )

            // Then: Only source relationship created, no inverse
            assertEquals(1, savedRelationships.size, "Should only create source relationship")
            assertEquals(document.id, savedRelationships.first().sourceId)
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

            val contactId = UUID.randomUUID()
            val contact = createEntity(id = contactId, typeId = contactEntityType.id!!, payload = emptyMap())

            val prevDocument = createEntity(
                typeId = unidirectionalType.id!!,
                payload = mapOf(
                    uniRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    )
                )
            )

            val currDocument = createEntity(
                id = prevDocument.id!!,
                typeId = unidirectionalType.id!!,
                payload = mapOf(
                    uniRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to emptyList<String>() // Removed
                    )
                )
            )

            // Mock
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))

            // When: Saving relationships
            entityRelationshipService.saveRelationships(
                type = unidirectionalType,
                prev = prevDocument,
                curr = currDocument
            )

            // Then: Only source relationship deleted, no attempt to delete inverse
            verify(entityRelationshipRepository).deleteAllBySourceIdAndFieldIdAndTargetIdIn(
                eq(currDocument.id!!),
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
            val contactId = UUID.randomUUID()
            val nameFieldId = UUID.randomUUID()

            val contact = createEntity(
                id = contactId,
                typeId = contactEntityType.id!!,
                identifierKey = nameFieldId,
                iconType = IconType.USER,
                iconColour = IconColour.BLUE,
                payload = mapOf(
                    nameFieldId.toString() to mapOf(
                        "type" to "ATTRIBUTE",
                        "value" to "John Doe",
                        "schemaType" to "TEXT"
                    )
                )
            )

            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    )
                )
            )

            // Mock
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation -> invocation.getArgument(0) as Collection<EntityRelationshipEntity> }

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = null,
                curr = company
            )

            // Then: EntityLink has correct properties
            val entityLink = result[companyContactsRelId]?.first()
            assertNotNull(entityLink, "EntityLink should exist")
            assertEquals(contactId, entityLink!!.id)
            assertEquals(IconType.USER, entityLink.icon.icon)
            assertEquals(IconColour.BLUE, entityLink.icon.colour)
            assertEquals("John Doe", entityLink.label)
        }

        @Test
        fun `saveRelationships - uses entity ID as fallback label when identifier not found`() {
            // Given: An entity with no identifier value
            val contactId = UUID.randomUUID()
            val missingFieldId = UUID.randomUUID()

            val contact = createEntity(
                id = contactId,
                typeId = contactEntityType.id!!,
                identifierKey = missingFieldId, // Points to non-existent field
                payload = emptyMap()
            )

            val company = createEntity(
                typeId = companyEntityType.id!!,
                payload = mapOf(
                    companyContactsRelId.toString() to mapOf(
                        "type" to "RELATIONSHIP",
                        "relations" to listOf(contactId.toString())
                    )
                )
            )

            // Mock
            whenever(entityRepository.findAllById(any()))
                .thenReturn(listOf(contact))
            whenever(entityTypeService.getByIds(any()))
                .thenReturn(listOf(contactEntityType))
            whenever(entityRelationshipRepository.saveAll<EntityRelationshipEntity>(any()))
                .thenAnswer { invocation -> invocation.getArgument(0) as Collection<EntityRelationshipEntity> }

            // When: Saving relationships
            val result = entityRelationshipService.saveRelationships(
                type = companyEntityType,
                prev = null,
                curr = company
            )

            // Then: EntityLink uses ID as label
            val entityLink = result[companyContactsRelId]?.first()
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
            organisationId = organisationId,
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
        payload: Map<String, Any>
    ): EntityEntity {
        return EntityEntity(
            id = id,
            organisationId = organisationId,
            typeId = typeId,
            identifierKey = identifierKey,
            iconType = iconType,
            iconColour = iconColour,
            payload = payload
        )
    }
}
