package riven.core.service.entity

import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.OrganisationSecurity
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.organisation.OrganisationRoles
import riven.core.models.entity.configuration.EntityRelationshipDefinition
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.type.EntityRelationshipService
import riven.core.service.util.OrganisationRole
import riven.core.service.util.WithUserPersona
import riven.core.service.util.factory.entity.EntityFactory
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
    private lateinit var entityTypeRepository: EntityTypeRepository

    @MockitoBean
    private lateinit var authTokenService: AuthTokenService

    @MockitoBean
    private lateinit var activityService: ActivityService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    private lateinit var entityRelationshipService: EntityRelationshipService

    // ========== CREATION TESTS: Single Type Restriction ==========

    @Test
    fun `syncRelationships - create unidirectional single-type relationship`() {
        // Given: A Person entity type with a unidirectional relationship to Company
        val companyType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "company",
            displayNameSingular = "Company",
            organisationId = organisationId
        )

        val personType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Employer",
                    key = "employer",
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    entityTypeKeys = listOf("company"),
                    bidirectional = false,
                    sourceKey = "person"
                )
            )
        )

        // Mock: Company type exists
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "company"))
            .thenReturn(Optional.of(companyType))

        // When: Syncing relationships for Person type
        entityRelationshipService.syncRelationships(personType)

        // Then: No inverse relationship should be created on Company
        verify(entityTypeRepository, times(0)).save(eq(companyType))
    }

    @Test
    fun `syncRelationships - create bidirectional single-type relationship with explicit targets`() {
        // Given: A Person entity type with bidirectional relationship to another Person
        val personType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Friend",
                    key = "friends",
                    cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
                    entityTypeKeys = listOf("person"),
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = listOf("person"),
                    inverseName = "Friends with",
                    sourceKey = "person"
                )
            )
        )

        // Mock: Person type exists
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "person"))
            .thenReturn(Optional.of(personType))
        Mockito.`when`(entityTypeRepository.save(any<EntityTypeEntity>()))
            .thenAnswer { it.arguments[0] }

        // When: Syncing relationships for Person type
        entityRelationshipService.syncRelationships(personType)

        // Then: Inverse relationship should be added to Person type
        val captor = argumentCaptor<EntityTypeEntity>()
        verify(entityTypeRepository).save(captor.capture())

        val savedType = captor.firstValue
        assert(savedType.relationships?.any { it.key == "friends" } == true) {
            "Inverse relationship should be added"
        }
    }

    @Test
    fun `syncRelationships - create bidirectional relationship with default targets`() {
        // Given: Task with bidirectional relationship to Person and Team (null bidirectionalEntityTypeKeys)
        val personType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId
        )

        val teamType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "team",
            displayNameSingular = "Team",
            organisationId = organisationId
        )

        val taskType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "task",
            displayNameSingular = "Task",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Assignee",
                    key = "assignee",
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    entityTypeKeys = listOf("person", "team"),
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = null, // Default to all entityTypeKeys
                    inverseName = "Assigned Tasks",
                    sourceKey = "tasks"
                )
            )
        )

        // Mock: Both target types exist
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "person"))
            .thenReturn(Optional.of(personType))
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "team"))
            .thenReturn(Optional.of(teamType))
        Mockito.`when`(entityTypeRepository.save(any<EntityTypeEntity>()))
            .thenAnswer { it.arguments[0] }

        // When: Syncing relationships for Task type
        entityRelationshipService.syncRelationships(taskType)

        // Then: Inverse relationships should be added to both Person and Team
        verify(entityTypeRepository, times(2)).save(any<EntityTypeEntity>())
    }

    // ========== CREATION TESTS: Multi-Type Restriction ==========

    @Test
    fun `syncRelationships - create multi-type relationship`() {
        // Given: Task with relationship to Person OR Team
        val personType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId
        )

        val teamType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "team",
            displayNameSingular = "Team",
            organisationId = organisationId
        )

        val taskType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "task",
            displayNameSingular = "Task",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Owner",
                    key = "owner",
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    entityTypeKeys = listOf("person", "team"),
                    bidirectional = false,
                    sourceKey = "owner"
                )
            )
        )

        // Mock: Both types exist
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "person"))
            .thenReturn(Optional.of(personType))
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "team"))
            .thenReturn(Optional.of(teamType))

        // When: Syncing relationships for Task type
        entityRelationshipService.syncRelationships(taskType)

        // Then: No inverse relationships created (unidirectional)
        verify(entityTypeRepository, times(0)).save(any<EntityTypeEntity>())
    }

    @Test
    fun `syncRelationships - create bidirectional multi-type with selective targets`() {
        // Given: Task with bidirectional relationship to Person but not Team
        val personType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId
        )

        val teamType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "team",
            displayNameSingular = "Team",
            organisationId = organisationId
        )

        val taskType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "task",
            displayNameSingular = "Task",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Assignee",
                    key = "assignee",
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    entityTypeKeys = listOf("person", "team"),
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = listOf("person"), // Only Person gets inverse
                    inverseName = "Assigned Tasks",
                    sourceKey = "task"
                )
            )
        )

        // Mock: Both types exist
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "person"))
            .thenReturn(Optional.of(personType))
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "team"))
            .thenReturn(Optional.of(teamType))
        Mockito.`when`(entityTypeRepository.save(any<EntityTypeEntity>()))
            .thenAnswer { it.arguments[0] }

        // When: Syncing relationships for Task type
        entityRelationshipService.syncRelationships(taskType)

        // Then: Only Person should get the inverse relationship
        val captor = argumentCaptor<EntityTypeEntity>()
        verify(entityTypeRepository, times(1)).save(captor.capture())

        val savedType = captor.firstValue
        assert(savedType.key == "person") {
            "Only Person type should be updated"
        }
    }

    // ========== CREATION TESTS: Polymorphic Relationships ==========

    @Test
    fun `syncRelationships - create polymorphic relationship`() {
        // Given: Comment with polymorphic relationship to any entity
        val commentType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "comment",
            displayNameSingular = "Comment",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Target",
                    key = "target",
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    allowPolymorphic = true,
                    bidirectional = false,
                    sourceKey = "comment"
                )
            )
        )

        // When: Syncing relationships for Comment type
        entityRelationshipService.syncRelationships(commentType)

        // Then: No errors should occur (polymorphic relationships don't need validation)
        verify(entityTypeRepository, times(0)).save(any<EntityTypeEntity>())
    }

    @Test
    fun `syncRelationships - polymorphic relationship cannot be bidirectional`() {
        // Given: Entity with polymorphic bidirectional relationship (invalid)
        val commentType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "comment",
            displayNameSingular = "Comment",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Target",
                    key = "target",
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    allowPolymorphic = true,
                    bidirectional = true, // This should be skipped
                    sourceKey = "comment"
                )
            )
        )

        // When: Syncing relationships for Comment type
        entityRelationshipService.syncRelationships(commentType)

        // Then: No inverse relationships should be created (polymorphic + bidirectional is invalid)
        verify(entityTypeRepository, times(0)).save(any<EntityTypeEntity>())
    }

    // ========== CREATION TESTS: Different Cardinalities ==========

    @Test
    fun `syncRelationships - create ONE_TO_ONE relationship`() {
        // Given: Person with ONE_TO_ONE relationship to Profile
        val profileType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "profile",
            displayNameSingular = "Profile",
            organisationId = organisationId
        )

        val personType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Profile",
                    key = "profile",
                    cardinality = EntityRelationshipCardinality.ONE_TO_ONE,
                    entityTypeKeys = listOf("profile"),
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = listOf("profile"),
                    inverseName = "Person",
                    sourceKey = "person"
                )
            )
        )

        // Mock: Profile type exists
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "profile"))
            .thenReturn(Optional.of(profileType))
        Mockito.`when`(entityTypeRepository.save(any<EntityTypeEntity>()))
            .thenAnswer { it.arguments[0] }

        // When: Syncing relationships
        entityRelationshipService.syncRelationships(personType)

        // Then: Inverse ONE_TO_ONE relationship should be created on Profile
        val captor = argumentCaptor<EntityTypeEntity>()
        verify(entityTypeRepository).save(captor.capture())

        val savedType = captor.firstValue
        val inverseRel = savedType.relationships?.find { it.key == "profile" }
        assert(inverseRel?.cardinality == EntityRelationshipCardinality.ONE_TO_ONE) {
            "Inverse should maintain ONE_TO_ONE cardinality"
        }
    }

    @Test
    fun `syncRelationships - create ONE_TO_MANY relationship with inverted cardinality`() {
        // Given: Company with ONE_TO_MANY relationship to Person (employees)
        val personType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId
        )

        val companyType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "company",
            displayNameSingular = "Company",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Employees",
                    key = "employees",
                    cardinality = EntityRelationshipCardinality.ONE_TO_MANY,
                    entityTypeKeys = listOf("person"),
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = listOf("person"),
                    inverseName = "Employer",
                    sourceKey = "company"
                )
            )
        )

        // Mock: Person type exists
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "person"))
            .thenReturn(Optional.of(personType))
        Mockito.`when`(entityTypeRepository.save(any<EntityTypeEntity>()))
            .thenAnswer { it.arguments[0] }

        // When: Syncing relationships
        entityRelationshipService.syncRelationships(companyType)

        // Then: Inverse should be MANY_TO_ONE
        val captor = argumentCaptor<EntityTypeEntity>()
        verify(entityTypeRepository).save(captor.capture())

        val savedType = captor.firstValue
        val inverseRel = savedType.relationships?.find { it.key == "employees" }
        assert(inverseRel?.cardinality == EntityRelationshipCardinality.MANY_TO_ONE) {
            "ONE_TO_MANY should invert to MANY_TO_ONE"
        }
    }

    @Test
    fun `syncRelationships - create MANY_TO_MANY relationship`() {
        // Given: Student with MANY_TO_MANY relationship to Course
        val courseType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "course",
            displayNameSingular = "Course",
            organisationId = organisationId
        )

        val studentType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "student",
            displayNameSingular = "Student",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Enrolled Courses",
                    key = "courses",
                    cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
                    entityTypeKeys = listOf("course"),
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = listOf("course"),
                    inverseName = "Students",
                    sourceKey = "student"
                )
            )
        )

        // Mock: Course type exists
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "course"))
            .thenReturn(Optional.of(courseType))
        Mockito.`when`(entityTypeRepository.save(any<EntityTypeEntity>()))
            .thenAnswer { it.arguments[0] }

        // When: Syncing relationships
        entityRelationshipService.syncRelationships(studentType)

        // Then: Inverse should also be MANY_TO_MANY
        val captor = argumentCaptor<EntityTypeEntity>()
        verify(entityTypeRepository).save(captor.capture())

        val savedType = captor.firstValue
        val inverseRel = savedType.relationships?.find { it.key == "courses" }
        assert(inverseRel?.cardinality == EntityRelationshipCardinality.MANY_TO_MANY) {
            "MANY_TO_MANY should maintain cardinality"
        }
    }

    // ========== UPDATE TESTS: Removing Relationships ==========

    @Test
    fun `syncRelationships - remove relationship definition and cleanup instances`() {
        // Given: Person type originally had "employer" relationship, now removed
        val companyType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "company",
            displayNameSingular = "Company",
            organisationId = organisationId
        )

        val personTypeId = UUID.randomUUID()
        val personType = EntityFactory.createEntityType(
            id = personTypeId,
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId,
            relationships = listOf() // No relationships now
        )

        val previousRelationships = listOf(
            EntityFactory.createRelationshipDefinition(
                name = "Employer",
                key = "employer",
                cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                entityTypeKeys = listOf("company"),
                bidirectional = false,
                sourceKey = "company"
            )
        )

        // Mock: Entities and relationships exist
        val entity1 = EntityFactory.createEntity(
            id = UUID.randomUUID(),
            organisationId = organisationId,
            type = personType
        )
        val entity2 = EntityFactory.createEntity(
            id = UUID.randomUUID(),
            organisationId = organisationId,
            type = personType
        )

        val relationship1 = EntityFactory.createRelationshipEntity(
            sourceId = entity1.id!!,
            targetId = UUID.randomUUID(),
            key = "employer",
            organisationId = organisationId
        )

        Mockito.`when`(entityRepository.findByOrganisationIdAndTypeId(organisationId, personTypeId))
            .thenReturn(listOf(entity1, entity2))
        Mockito.`when`(entityRelationshipRepository.findAllBySourceIdAndKey(entity1.id!!, "employer"))
            .thenReturn(listOf(relationship1))
        Mockito.`when`(entityRelationshipRepository.findAllBySourceIdAndKey(entity2.id!!, "employer"))
            .thenReturn(listOf())

        // When: Syncing with removed relationship
        entityRelationshipService.syncRelationships(personType, previousRelationships)

        // Then: Relationship instances should be deleted
        verify(entityRelationshipRepository).deleteAll(listOf(relationship1))
    }

    @Test
    fun `syncRelationships - remove bidirectional relationship and cleanup both sides`() {
        // Given: Person type had bidirectional "friends" relationship, now removed
        val personTypeId = UUID.randomUUID()
        val personType = EntityFactory.createEntityType(
            id = personTypeId,
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId,
            relationships = listOf() // No relationships now
        )

        val previousRelationships = listOf(
            EntityFactory.createRelationshipDefinition(
                name = "Friend",
                key = "friends",
                cardinality = EntityRelationshipCardinality.MANY_TO_MANY,
                entityTypeKeys = listOf("person"),
                bidirectional = true,
                bidirectionalEntityTypeKeys = listOf("person"),
                sourceKey = "person"
            )
        )

        // Mock: Person type exists for cleanup
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "person"))
            .thenReturn(Optional.of(personType))
        Mockito.`when`(entityRepository.findByOrganisationIdAndTypeId(organisationId, personTypeId))
            .thenReturn(listOf())
        Mockito.`when`(entityTypeRepository.save(any<EntityTypeEntity>()))
            .thenAnswer { it.arguments[0] }

        // When: Syncing with removed relationship
        entityRelationshipService.syncRelationships(personType, previousRelationships)

        // Then: Inverse relationship should be removed from target type
        val captor = argumentCaptor<EntityTypeEntity>()
        verify(entityTypeRepository).save(captor.capture())

        val savedType = captor.firstValue
        assert(savedType.relationships?.none { it.key == "friends" } == true) {
            "Inverse relationship should be removed"
        }
    }

    // ========== UPDATE TESTS: Making Bidirectional Unidirectional ==========

    @Test
    fun `syncRelationships - change bidirectional to unidirectional and cleanup inverses`() {
        // Given: Person-Company relationship was bidirectional, now unidirectional
        val companyTypeId = UUID.randomUUID()
        val companyType = EntityFactory.createEntityType(
            id = companyTypeId,
            key = "company",
            displayNameSingular = "Company",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    key = "employees",
                    name = "Employees",
                    sourceKey = "company"
                )
            )
        )

        val personTypeId = UUID.randomUUID()
        val personType = EntityFactory.createEntityType(
            id = personTypeId,
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Employer",
                    key = "employer",
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    entityTypeKeys = listOf("company"),
                    bidirectional = false, // Changed from true to false
                    sourceKey = "person"
                )
            )
        )

        val previousRelationships = listOf(
            EntityFactory.createRelationshipDefinition(
                name = "Employer",
                key = "employer",
                cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                entityTypeKeys = listOf("company"),
                bidirectional = true,
                bidirectionalEntityTypeKeys = listOf("company"),
                inverseName = "Employees",
                sourceKey = "person"
            )
        )

        // Mock entities for cleanup
        val person1 = EntityFactory.createEntity(
            id = UUID.randomUUID(),
            organisationId = organisationId,
            type = personType
        )
        val company1 = EntityFactory.createEntity(
            id = UUID.randomUUID(),
            organisationId = organisationId,
            type = companyType
        )

        val forwardRel = EntityFactory.createRelationshipEntity(
            sourceId = person1.id!!,
            targetId = company1.id!!,
            key = "employer",
            organisationId = organisationId
        )
        val inverseRel = EntityFactory.createRelationshipEntity(
            sourceId = company1.id!!,
            targetId = person1.id!!,
            key = "employer",
            organisationId = organisationId
        )

        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "company"))
            .thenReturn(Optional.of(companyType))
        Mockito.`when`(entityRepository.findByOrganisationIdAndTypeId(organisationId, personTypeId))
            .thenReturn(listOf(person1))
        Mockito.`when`(entityRelationshipRepository.findAllBySourceIdAndKey(person1.id!!, "employer"))
            .thenReturn(listOf(forwardRel))
        Mockito.`when`(entityRepository.findById(company1.id!!))
            .thenReturn(Optional.of(company1))
        Mockito.`when`(
            entityRelationshipRepository.findBySourceIdAndTargetIdAndKey(
                company1.id!!,
                person1.id!!,
                "employer"
            )
        ).thenReturn(listOf(inverseRel))
        Mockito.`when`(entityTypeRepository.save(any<EntityTypeEntity>()))
            .thenAnswer { it.arguments[0] }

        // When: Syncing with changed bidirectionality
        entityRelationshipService.syncRelationships(personType, previousRelationships)

        // Then: Inverse relationship definition and instances should be removed
        verify(entityRelationshipRepository).deleteAll(listOf(inverseRel))
        val captor = argumentCaptor<EntityTypeEntity>()
        verify(entityTypeRepository).save(captor.capture())

        val savedType = captor.firstValue
        assert(savedType.relationships?.none { it.key == "employer" } == true) {
            "Inverse definition should be removed from Company type"
        }
    }

    // ========== UPDATE TESTS: Reducing Bidirectional Target Types ==========

    @Test
    fun `syncRelationships - reduce bidirectionalEntityTypeKeys and cleanup removed targets`() {
        // Given: Task-Assignee relationship was bidirectional for Person and Team, now only Person
        val personTypeId = UUID.randomUUID()
        val personType = EntityFactory.createEntityType(
            id = personTypeId,
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId
        )

        val teamTypeId = UUID.randomUUID()
        val teamType = EntityFactory.createEntityType(
            id = teamTypeId,
            key = "team",
            displayNameSingular = "Team",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    key = "assigned_tasks",
                    name = "Assigned Tasks",
                    sourceKey = "person"
                )
            )
        )

        val taskTypeId = UUID.randomUUID()
        val taskType = EntityFactory.createEntityType(
            id = taskTypeId,
            key = "task",
            displayNameSingular = "Task",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Assignee",
                    key = "assignee",
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    entityTypeKeys = listOf("person", "team"),
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = listOf("person"), // Removed "team"
                    inverseName = "Assigned Tasks",
                    sourceKey = "task"
                )
            )
        )

        val previousRelationships = listOf(
            EntityFactory.createRelationshipDefinition(
                name = "Assignee",
                key = "assignee",
                cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                entityTypeKeys = listOf("person", "team"),
                bidirectional = true,
                bidirectionalEntityTypeKeys = listOf("person", "team"), // Both were bidirectional
                inverseName = "Assigned Tasks",
                sourceKey = "assignee"
            )
        )

        // Mock entities and relationships
        val task1 = EntityFactory.createEntity(
            id = UUID.randomUUID(),
            organisationId = organisationId,
            type = taskType
        )
        val team1 = EntityFactory.createEntity(
            id = UUID.randomUUID(),
            organisationId = organisationId,
            type = teamType
        )

        val forwardRel = EntityFactory.createRelationshipEntity(
            sourceId = task1.id!!,
            targetId = team1.id!!,
            key = "assignee",
            organisationId = organisationId
        )
        val inverseRel = EntityFactory.createRelationshipEntity(
            sourceId = team1.id!!,
            targetId = task1.id!!,
            key = "assignee",
            organisationId = organisationId
        )

        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "person"))
            .thenReturn(Optional.of(personType))
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "team"))
            .thenReturn(Optional.of(teamType))
        Mockito.`when`(entityRepository.findByOrganisationIdAndTypeId(organisationId, taskTypeId))
            .thenReturn(listOf(task1))
        Mockito.`when`(entityRelationshipRepository.findAllBySourceIdAndKey(task1.id!!, "assignee"))
            .thenReturn(listOf(forwardRel))
        Mockito.`when`(entityRepository.findById(team1.id!!))
            .thenReturn(Optional.of(team1))
        Mockito.`when`(
            entityRelationshipRepository.findBySourceIdAndTargetIdAndKey(
                team1.id!!,
                task1.id!!,
                "assignee"
            )
        ).thenReturn(listOf(inverseRel))
        Mockito.`when`(entityTypeRepository.save(any<EntityTypeEntity>()))
            .thenAnswer { it.arguments[0] }

        // When: Syncing with reduced target types
        entityRelationshipService.syncRelationships(taskType, previousRelationships)

        // Then: Inverse should be removed from Team but Person should still have it
        verify(entityRelationshipRepository).deleteAll(listOf(inverseRel))
        val captor = argumentCaptor<EntityTypeEntity>()
        verify(entityTypeRepository, times(2)).save(captor.capture())

        // One save for Team (removing inverse), one for Person (keeping/updating inverse)
        assert(captor.allValues.any { it.key == "team" }) {
            "Team should have inverse removed"
        }
        assert(captor.allValues.any { it.key == "person" }) {
            "Person should keep inverse"
        }
    }

    // ========== UPDATE TESTS: Adding New Relationships ==========

    @Test
    fun `syncRelationships - add new relationship to existing entity type`() {
        // Given: Person type originally had no relationships, now adding "employer"
        val companyType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "company",
            displayNameSingular = "Company",
            organisationId = organisationId
        )

        val personType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Employer",
                    key = "employer",
                    cardinality = EntityRelationshipCardinality.MANY_TO_ONE,
                    entityTypeKeys = listOf("company"),
                    bidirectional = false,
                    sourceKey = "company"
                )
            )
        )

        val previousRelationships = listOf<EntityRelationshipDefinition>() // No previous relationships

        // Mock: Company type exists
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "company"))
            .thenReturn(Optional.of(companyType))

        // When: Syncing with new relationship
        entityRelationshipService.syncRelationships(personType, previousRelationships)

        // Then: No errors, relationship should be validated
        verify(entityTypeRepository, times(0)).save(any<EntityTypeEntity>())
    }

    // ========== VALIDATION TESTS ==========

    @Test
    fun `syncRelationships - fail when referencing non-existent entity type`() {
        // Given: Person type with relationship to non-existent "department" type
        val personType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Department",
                    key = "department",
                    entityTypeKeys = listOf("department"), // Does not exist
                    bidirectional = false,
                    sourceKey = "person"
                )
            )
        )

        // Mock: Department type does NOT exist
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "department"))
            .thenReturn(Optional.empty())

        // When/Then: Should throw validation error
        assertThrows<IllegalArgumentException> {
            entityRelationshipService.syncRelationships(personType)
        }.apply {
            assert(message?.contains("non-existent entity type 'department'") == true) {
                "Error message should mention non-existent type"
            }
        }
    }

    @Test
    fun `syncRelationships - polymorphic relationships skip validation`() {
        // Given: Comment with polymorphic relationship (no specific types)
        val commentType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "comment",
            displayNameSingular = "Comment",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Target",
                    key = "target",
                    allowPolymorphic = true,
                    bidirectional = false,
                    sourceKey = "comment"
                )
            )
        )

        // When: Syncing polymorphic relationship (no mocks needed)
        entityRelationshipService.syncRelationships(commentType)

        // Then: No validation errors (polymorphic relationships skip type checks)
        verify(entityTypeRepository, times(0)).findByOrganisationIdAndKey(any(), any())
    }

    @Test
    fun `syncRelationships - handle missing target type gracefully`() {
        // Given: Task with bidirectional relationship to Person (exists) and Team (does not exist)
        val personType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "person",
            displayNameSingular = "Person",
            organisationId = organisationId
        )

        val taskType = EntityFactory.createEntityType(
            id = UUID.randomUUID(),
            key = "task",
            displayNameSingular = "Task",
            organisationId = organisationId,
            relationships = listOf(
                EntityFactory.createRelationshipDefinition(
                    name = "Assignee",
                    key = "assignee",
                    entityTypeKeys = listOf("person", "team"),
                    bidirectional = true,
                    bidirectionalEntityTypeKeys = listOf("person", "team"),
                    sourceKey = "task"
                )
            )
        )

        // Mock: Person exists, Team does NOT
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "person"))
            .thenReturn(Optional.of(personType))
        Mockito.`when`(entityTypeRepository.findByOrganisationIdAndKey(organisationId, "team"))
            .thenReturn(Optional.empty()) // Team does not exist

        // When/Then: Should fail validation for "team" during initial validation
        assertThrows<IllegalArgumentException> {
            entityRelationshipService.syncRelationships(taskType)
        }
    }
}
