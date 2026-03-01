package riven.core.service.entity

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.entity.entity.RelationshipDefinitionEntity
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.entity.SystemRelationshipType
import riven.core.enums.integration.SourceType
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.exceptions.ConflictException
import riven.core.exceptions.NotFoundException
import riven.core.models.request.entity.CreateConnectionRequest
import riven.core.models.request.entity.UpdateConnectionRequest
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.RelationshipDefinitionRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.type.EntityTypeRelationshipService
import riven.core.service.util.BaseServiceTest
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import riven.core.service.util.factory.entity.EntityFactory
import java.util.*

@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        EntityRelationshipServiceConnectionTest.TestConfig::class,
        EntityRelationshipService::class,
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
class EntityRelationshipServiceConnectionTest : BaseServiceTest() {

    @Configuration
    class TestConfig

    @MockitoBean
    private lateinit var entityRelationshipRepository: EntityRelationshipRepository

    @MockitoBean
    private lateinit var entityRepository: EntityRepository

    @MockitoBean
    private lateinit var definitionRepository: RelationshipDefinitionRepository

    @MockitoBean
    private lateinit var entityTypeRelationshipService: EntityTypeRelationshipService

    @MockitoBean
    private lateinit var activityService: ActivityService

    @Autowired
    private lateinit var service: EntityRelationshipService

    private val sourceEntityId = UUID.randomUUID()
    private val targetEntityId = UUID.randomUUID()
    private val sourceEntityTypeId = UUID.randomUUID()
    private val fallbackDefId = UUID.randomUUID()

    private fun buildFallbackDefinitionEntity(): RelationshipDefinitionEntity {
        return EntityFactory.createRelationshipDefinitionEntity(
            id = fallbackDefId,
            workspaceId = workspaceId,
            sourceEntityTypeId = sourceEntityTypeId,
            name = "Connected Entities",
            cardinalityDefault = EntityRelationshipCardinality.MANY_TO_MANY,
            allowPolymorphic = true,
            protected = true,
        ).copy(systemType = SystemRelationshipType.CONNECTED_ENTITIES)
    }

    private fun buildNonFallbackDefinitionEntity(): RelationshipDefinitionEntity {
        return EntityFactory.createRelationshipDefinitionEntity(
            id = UUID.randomUUID(),
            workspaceId = workspaceId,
            sourceEntityTypeId = sourceEntityTypeId,
            name = "Regular Relationship",
        )
    }

    @BeforeEach
    fun setup() {
        reset(
            entityRelationshipRepository,
            entityRepository,
            definitionRepository,
            entityTypeRelationshipService,
            activityService,
        )
    }

    // ------ createConnection ------

    @Test
    fun `createConnection - happy path - creates connection with semantic context and link source`() {
        val sourceEntity = EntityFactory.createEntityEntity(
            id = sourceEntityId,
            workspaceId = workspaceId,
            typeId = sourceEntityTypeId,
        )
        val targetEntity = EntityFactory.createEntityEntity(
            id = targetEntityId,
            workspaceId = workspaceId,
        )
        val fallbackDef = buildFallbackDefinitionEntity()
        val request = CreateConnectionRequest(
            targetEntityId = targetEntityId,
            semanticContext = "works with",
            linkSource = SourceType.USER_CREATED,
        )

        whenever(entityRepository.findById(sourceEntityId)).thenReturn(Optional.of(sourceEntity))
        whenever(entityRepository.findById(targetEntityId)).thenReturn(Optional.of(targetEntity))
        whenever(entityTypeRelationshipService.getOrCreateFallbackDefinition(workspaceId, sourceEntityTypeId))
            .thenReturn(fallbackDef)
        whenever(entityRelationshipRepository.findBySourceIdAndTargetIdAndDefinitionId(sourceEntityId, targetEntityId, fallbackDefId))
            .thenReturn(emptyList())
        whenever(entityRelationshipRepository.save(any<EntityRelationshipEntity>())).thenAnswer { invocation ->
            val entity = invocation.arguments[0] as EntityRelationshipEntity
            if (entity.id == null) entity.copy(id = UUID.randomUUID()) else entity
        }

        val result = service.createConnection(workspaceId, sourceEntityId, request)

        assertNotNull(result.id)
        assertEquals(sourceEntityId, result.sourceEntityId)
        assertEquals(targetEntityId, result.targetEntityId)
        assertEquals("works with", result.semanticContext)
        assertEquals(SourceType.USER_CREATED, result.linkSource)

        verify(entityRelationshipRepository).save(argThat<EntityRelationshipEntity> {
            this.sourceId == sourceEntityId &&
                this.targetId == targetEntityId &&
                this.definitionId == fallbackDefId &&
                this.semanticContext == "works with" &&
                this.linkSource == SourceType.USER_CREATED
        })
    }

    @Test
    fun `createConnection - duplicate source and target - throws ConflictException`() {
        val sourceEntity = EntityFactory.createEntityEntity(
            id = sourceEntityId,
            workspaceId = workspaceId,
            typeId = sourceEntityTypeId,
        )
        val targetEntity = EntityFactory.createEntityEntity(
            id = targetEntityId,
            workspaceId = workspaceId,
        )
        val fallbackDef = buildFallbackDefinitionEntity()
        val existingRel = EntityRelationshipEntity(
            id = UUID.randomUUID(),
            workspaceId = workspaceId,
            sourceId = sourceEntityId,
            targetId = targetEntityId,
            definitionId = fallbackDefId,
        )
        val request = CreateConnectionRequest(
            targetEntityId = targetEntityId,
            semanticContext = "duplicate",
        )

        whenever(entityRepository.findById(sourceEntityId)).thenReturn(Optional.of(sourceEntity))
        whenever(entityRepository.findById(targetEntityId)).thenReturn(Optional.of(targetEntity))
        whenever(entityTypeRelationshipService.getOrCreateFallbackDefinition(workspaceId, sourceEntityTypeId))
            .thenReturn(fallbackDef)
        whenever(entityRelationshipRepository.findBySourceIdAndTargetIdAndDefinitionId(sourceEntityId, targetEntityId, fallbackDefId))
            .thenReturn(listOf(existingRel))

        assertThrows(ConflictException::class.java) {
            service.createConnection(workspaceId, sourceEntityId, request)
        }

        verify(entityRelationshipRepository, never()).save(any())
    }

    @Test
    fun `createConnection - missing source entity - throws NotFoundException`() {
        val request = CreateConnectionRequest(
            targetEntityId = targetEntityId,
            semanticContext = "test",
        )

        whenever(entityRepository.findById(sourceEntityId)).thenReturn(Optional.empty())

        assertThrows(NotFoundException::class.java) {
            service.createConnection(workspaceId, sourceEntityId, request)
        }
    }

    // ------ getConnections ------

    @Test
    fun `getConnections - returns forward and inverse connections`() {
        val entity = EntityFactory.createEntityEntity(
            id = sourceEntityId,
            workspaceId = workspaceId,
            typeId = sourceEntityTypeId,
        )
        val forwardRel = EntityRelationshipEntity(
            id = UUID.randomUUID(),
            workspaceId = workspaceId,
            sourceId = sourceEntityId,
            targetId = targetEntityId,
            definitionId = fallbackDefId,
            semanticContext = "forward context",
        )
        val inverseTargetId = UUID.randomUUID()
        val inverseRel = EntityRelationshipEntity(
            id = UUID.randomUUID(),
            workspaceId = workspaceId,
            sourceId = inverseTargetId,
            targetId = sourceEntityId,
            definitionId = fallbackDefId,
            semanticContext = "inverse context",
        )

        whenever(entityRepository.findById(sourceEntityId)).thenReturn(Optional.of(entity))
        whenever(entityTypeRelationshipService.getFallbackDefinitionId(sourceEntityTypeId))
            .thenReturn(fallbackDefId)
        whenever(entityRelationshipRepository.findByEntityIdAndDefinitionId(sourceEntityId, fallbackDefId))
            .thenReturn(listOf(forwardRel, inverseRel))

        val result = service.getConnections(workspaceId, sourceEntityId)

        assertEquals(2, result.size)
        assertTrue(result.any { it.semanticContext == "forward context" })
        assertTrue(result.any { it.semanticContext == "inverse context" })
    }

    @Test
    fun `getConnections - returns empty when no fallback definition exists`() {
        val entity = EntityFactory.createEntityEntity(
            id = sourceEntityId,
            workspaceId = workspaceId,
            typeId = sourceEntityTypeId,
        )

        whenever(entityRepository.findById(sourceEntityId)).thenReturn(Optional.of(entity))
        whenever(entityTypeRelationshipService.getFallbackDefinitionId(sourceEntityTypeId))
            .thenReturn(null)

        val result = service.getConnections(workspaceId, sourceEntityId)

        assertTrue(result.isEmpty())
        verify(entityRelationshipRepository, never()).findByEntityIdAndDefinitionId(any(), any())
    }

    // ------ updateConnection ------

    @Test
    fun `updateConnection - updates semantic context`() {
        val connectionId = UUID.randomUUID()
        val connection = EntityRelationshipEntity(
            id = connectionId,
            workspaceId = workspaceId,
            sourceId = sourceEntityId,
            targetId = targetEntityId,
            definitionId = fallbackDefId,
            semanticContext = "old context",
        )
        val fallbackDef = buildFallbackDefinitionEntity()
        val request = UpdateConnectionRequest(semanticContext = "new context")

        whenever(entityRelationshipRepository.findByIdAndWorkspaceId(connectionId, workspaceId))
            .thenReturn(Optional.of(connection))
        whenever(definitionRepository.findById(fallbackDefId))
            .thenReturn(Optional.of(fallbackDef))
        whenever(entityRelationshipRepository.save(any<EntityRelationshipEntity>())).thenAnswer { invocation ->
            invocation.arguments[0] as EntityRelationshipEntity
        }

        val result = service.updateConnection(workspaceId, connectionId, request)

        assertEquals("new context", result.semanticContext)
        verify(entityRelationshipRepository).save(argThat<EntityRelationshipEntity> {
            this.semanticContext == "new context"
        })
    }

    @Test
    fun `updateConnection - rejects non-fallback connections`() {
        val connectionId = UUID.randomUUID()
        val nonFallbackDefId = UUID.randomUUID()
        val connection = EntityRelationshipEntity(
            id = connectionId,
            workspaceId = workspaceId,
            sourceId = sourceEntityId,
            targetId = targetEntityId,
            definitionId = nonFallbackDefId,
        )
        val nonFallbackDef = buildNonFallbackDefinitionEntity().copy(id = nonFallbackDefId)

        whenever(entityRelationshipRepository.findByIdAndWorkspaceId(connectionId, workspaceId))
            .thenReturn(Optional.of(connection))
        whenever(definitionRepository.findById(nonFallbackDefId))
            .thenReturn(Optional.of(nonFallbackDef))

        val request = UpdateConnectionRequest(semanticContext = "test")

        assertThrows(IllegalArgumentException::class.java) {
            service.updateConnection(workspaceId, connectionId, request)
        }
    }

    // ------ deleteConnection ------

    @Test
    fun `deleteConnection - soft-deletes the connection`() {
        val connectionId = UUID.randomUUID()
        val connection = EntityRelationshipEntity(
            id = connectionId,
            workspaceId = workspaceId,
            sourceId = sourceEntityId,
            targetId = targetEntityId,
            definitionId = fallbackDefId,
            semanticContext = "to be deleted",
        )
        val fallbackDef = buildFallbackDefinitionEntity()

        whenever(entityRelationshipRepository.findByIdAndWorkspaceId(connectionId, workspaceId))
            .thenReturn(Optional.of(connection))
        whenever(definitionRepository.findById(fallbackDefId))
            .thenReturn(Optional.of(fallbackDef))
        whenever(entityRelationshipRepository.save(any<EntityRelationshipEntity>())).thenAnswer { invocation ->
            invocation.arguments[0] as EntityRelationshipEntity
        }

        service.deleteConnection(workspaceId, connectionId)

        verify(entityRelationshipRepository).save(argThat<EntityRelationshipEntity> {
            this.deleted && this.deletedAt != null
        })
    }
}
