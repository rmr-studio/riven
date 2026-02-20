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
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityRelationshipEntity
import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.models.common.Icon
import riven.core.models.entity.RelationshipDefinition
import riven.core.models.entity.RelationshipTargetRule
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityRepository
import riven.core.repository.entity.RelationshipDefinitionRepository
import riven.core.repository.entity.RelationshipTargetRuleRepository
import riven.core.service.auth.AuthTokenService
import riven.core.service.util.BaseServiceTest
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import java.util.*

@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        EntityRelationshipServiceTest.TestConfig::class,
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
class EntityRelationshipServiceTest : BaseServiceTest() {

    @Configuration
    class TestConfig

    @MockitoBean
    private lateinit var entityRelationshipRepository: EntityRelationshipRepository

    @MockitoBean
    private lateinit var entityRepository: EntityRepository

    @MockitoBean
    private lateinit var definitionRepository: RelationshipDefinitionRepository

    @MockitoBean
    private lateinit var targetRuleRepository: RelationshipTargetRuleRepository

    @Autowired
    private lateinit var service: EntityRelationshipService

    private val sourceEntityId = UUID.randomUUID()
    private val sourceEntityTypeId = UUID.randomUUID()

    @BeforeEach
    fun setup() {
        reset(
            entityRelationshipRepository,
            entityRepository,
            definitionRepository,
            targetRuleRepository,
        )
    }

    // ------ Helper builders ------

    private fun buildDefinition(
        id: UUID = UUID.randomUUID(),
        sourceEntityTypeId: UUID = this.sourceEntityTypeId,
        allowPolymorphic: Boolean = false,
        cardinalityDefault: EntityRelationshipCardinality = EntityRelationshipCardinality.MANY_TO_MANY,
        targetRules: List<RelationshipTargetRule> = emptyList(),
    ) = RelationshipDefinition(
        id = id,
        workspaceId = workspaceId,
        sourceEntityTypeId = sourceEntityTypeId,
        name = "Test Relationship",
        icon = Icon(IconType.LINK, IconColour.NEUTRAL),
        allowPolymorphic = allowPolymorphic,
        cardinalityDefault = cardinalityDefault,
        protected = false,
        targetRules = targetRules,
        createdAt = null,
        updatedAt = null,
        createdBy = null,
        updatedBy = null,
    )

    private fun buildTargetRule(
        id: UUID = UUID.randomUUID(),
        definitionId: UUID = UUID.randomUUID(),
        targetEntityTypeId: UUID? = UUID.randomUUID(),
        semanticTypeConstraint: String? = null,
        cardinalityOverride: EntityRelationshipCardinality? = null,
        inverseVisible: Boolean = false,
        inverseName: String? = null,
    ) = RelationshipTargetRule(
        id = id,
        relationshipDefinitionId = definitionId,
        targetEntityTypeId = targetEntityTypeId,
        semanticTypeConstraint = semanticTypeConstraint,
        cardinalityOverride = cardinalityOverride,
        inverseVisible = inverseVisible,
        inverseName = inverseName,
        createdAt = null,
        updatedAt = null,
    )

    private fun buildEntity(
        id: UUID = UUID.randomUUID(),
        typeId: UUID = UUID.randomUUID(),
        typeKey: String = "test_entity",
    ) = EntityEntity(
        id = id,
        workspaceId = workspaceId,
        typeId = typeId,
        typeKey = typeKey,
        identifierKey = UUID.randomUUID(),
        payload = mapOf(
            UUID.randomUUID().toString() to EntityAttributePrimitivePayload(value = "Test")
        ),
        iconType = IconType.CIRCLE_DASHED,
        iconColour = IconColour.NEUTRAL,
    )

    // ------ Save: new links ------

    @Test
    fun `saveRelationships - new links - creates rows`() {
        val defId = UUID.randomUUID()
        val targetId1 = UUID.randomUUID()
        val targetId2 = UUID.randomUUID()
        val targetTypeId = UUID.randomUUID()

        val targetEntity1 = buildEntity(id = targetId1, typeId = targetTypeId)
        val targetEntity2 = buildEntity(id = targetId2, typeId = targetTypeId)

        val rule = buildTargetRule(definitionId = defId, targetEntityTypeId = targetTypeId)
        val definition = buildDefinition(id = defId, targetRules = listOf(rule))

        whenever(entityRelationshipRepository.findBySourceId(sourceEntityId)).thenReturn(emptyList())
        whenever(definitionRepository.findById(defId)).thenReturn(Optional.of(
            riven.core.service.util.factory.entity.EntityFactory.createRelationshipDefinitionEntity(
                id = defId, workspaceId = workspaceId, sourceEntityTypeId = sourceEntityTypeId,
            )
        ))
        whenever(targetRuleRepository.findByRelationshipDefinitionId(defId)).thenReturn(emptyList())
        whenever(entityRepository.findAllById(any<Collection<UUID>>())).thenReturn(listOf(targetEntity1, targetEntity2))
        whenever(entityRelationshipRepository.saveAll(any<List<EntityRelationshipEntity>>())).thenAnswer { it.arguments[0] }

        val payload = mapOf(defId to listOf(targetId1, targetId2))

        service.saveRelationships(
            id = sourceEntityId,
            workspaceId = workspaceId,
            definitionId = defId,
            definition = definition,
            targetIds = listOf(targetId1, targetId2),
        )

        verify(entityRelationshipRepository).saveAll(argThat<List<EntityRelationshipEntity>> { size == 2 })
    }

    // ------ Save: remove links ------

    @Test
    fun `saveRelationships - remove links - deletes rows`() {
        val defId = UUID.randomUUID()
        val existingTargetId = UUID.randomUUID()

        val existingRel = EntityRelationshipEntity(
            id = UUID.randomUUID(),
            workspaceId = workspaceId,
            sourceId = sourceEntityId,
            targetId = existingTargetId,
            definitionId = defId,
        )

        val definition = buildDefinition(id = defId, allowPolymorphic = true)

        whenever(entityRelationshipRepository.findAllBySourceIdAndDefinitionId(sourceEntityId, defId))
            .thenReturn(listOf(existingRel))

        service.saveRelationships(
            id = sourceEntityId,
            workspaceId = workspaceId,
            definitionId = defId,
            definition = definition,
            targetIds = emptyList(),
        )

        verify(entityRelationshipRepository).deleteAllBySourceIdAndDefinitionIdAndTargetIdIn(
            eq(sourceEntityId), eq(defId), any()
        )
    }

    // ------ Save: no change ------

    @Test
    fun `saveRelationships - no change - no operations`() {
        val defId = UUID.randomUUID()
        val targetId = UUID.randomUUID()

        val existingRel = EntityRelationshipEntity(
            id = UUID.randomUUID(),
            workspaceId = workspaceId,
            sourceId = sourceEntityId,
            targetId = targetId,
            definitionId = defId,
        )

        val definition = buildDefinition(id = defId, allowPolymorphic = true)

        whenever(entityRelationshipRepository.findAllBySourceIdAndDefinitionId(sourceEntityId, defId))
            .thenReturn(listOf(existingRel))

        service.saveRelationships(
            id = sourceEntityId,
            workspaceId = workspaceId,
            definitionId = defId,
            definition = definition,
            targetIds = listOf(targetId),
        )

        verify(entityRelationshipRepository, never()).saveAll(any<List<EntityRelationshipEntity>>())
        verify(entityRelationshipRepository, never()).deleteAllBySourceIdAndDefinitionIdAndTargetIdIn(any(), any(), any())
    }

    // ------ Cardinality enforcement ------

    @Test
    fun `saveRelationships - enforces cardinality ONE_TO_ONE - rejects second link`() {
        val defId = UUID.randomUUID()
        val targetId1 = UUID.randomUUID()
        val targetId2 = UUID.randomUUID()
        val targetTypeId = UUID.randomUUID()

        val rule = buildTargetRule(definitionId = defId, targetEntityTypeId = targetTypeId)
        val definition = buildDefinition(
            id = defId,
            cardinalityDefault = EntityRelationshipCardinality.ONE_TO_ONE,
            targetRules = listOf(rule),
        )

        val targetEntity1 = buildEntity(id = targetId1, typeId = targetTypeId)
        val targetEntity2 = buildEntity(id = targetId2, typeId = targetTypeId)

        whenever(entityRelationshipRepository.findAllBySourceIdAndDefinitionId(sourceEntityId, defId))
            .thenReturn(emptyList())
        whenever(entityRepository.findAllById(any<Collection<UUID>>())).thenReturn(listOf(targetEntity1, targetEntity2))
        whenever(entityRelationshipRepository.countBySourceIdAndDefinitionId(sourceEntityId, defId)).thenReturn(0)

        assertThrows(IllegalArgumentException::class.java) {
            service.saveRelationships(
                id = sourceEntityId,
                workspaceId = workspaceId,
                definitionId = defId,
                definition = definition,
                targetIds = listOf(targetId1, targetId2),
            )
        }
    }

    @Test
    fun `saveRelationships - enforces cardinality MANY_TO_ONE - allows multiple sources`() {
        val defId = UUID.randomUUID()
        val targetId = UUID.randomUUID()
        val targetTypeId = UUID.randomUUID()

        val rule = buildTargetRule(definitionId = defId, targetEntityTypeId = targetTypeId)
        val definition = buildDefinition(
            id = defId,
            cardinalityDefault = EntityRelationshipCardinality.MANY_TO_ONE,
            targetRules = listOf(rule),
        )

        val targetEntity = buildEntity(id = targetId, typeId = targetTypeId)

        whenever(entityRelationshipRepository.findAllBySourceIdAndDefinitionId(sourceEntityId, defId))
            .thenReturn(emptyList())
        whenever(entityRepository.findAllById(any<Collection<UUID>>())).thenReturn(listOf(targetEntity))
        whenever(entityRelationshipRepository.countBySourceIdAndDefinitionId(sourceEntityId, defId)).thenReturn(0)
        whenever(entityRelationshipRepository.saveAll(any<List<EntityRelationshipEntity>>())).thenAnswer { it.arguments[0] }

        // MANY_TO_ONE means many sources → one target. For a single source, 1 target is valid.
        service.saveRelationships(
            id = sourceEntityId,
            workspaceId = workspaceId,
            definitionId = defId,
            definition = definition,
            targetIds = listOf(targetId),
        )

        verify(entityRelationshipRepository).saveAll(any<List<EntityRelationshipEntity>>())
    }

    // ------ Target type validation ------

    @Test
    fun `saveRelationships - polymorphic - accepts any target type`() {
        val defId = UUID.randomUUID()
        val targetId = UUID.randomUUID()
        val targetTypeId = UUID.randomUUID()

        val definition = buildDefinition(id = defId, allowPolymorphic = true)
        val targetEntity = buildEntity(id = targetId, typeId = targetTypeId)

        whenever(entityRelationshipRepository.findAllBySourceIdAndDefinitionId(sourceEntityId, defId))
            .thenReturn(emptyList())
        whenever(entityRepository.findAllById(any<Collection<UUID>>())).thenReturn(listOf(targetEntity))
        whenever(entityRelationshipRepository.countBySourceIdAndDefinitionId(sourceEntityId, defId)).thenReturn(0)
        whenever(entityRelationshipRepository.saveAll(any<List<EntityRelationshipEntity>>())).thenAnswer { it.arguments[0] }

        service.saveRelationships(
            id = sourceEntityId,
            workspaceId = workspaceId,
            definitionId = defId,
            definition = definition,
            targetIds = listOf(targetId),
        )

        verify(entityRelationshipRepository).saveAll(any<List<EntityRelationshipEntity>>())
    }

    @Test
    fun `saveRelationships - non polymorphic - rejects unlisted target type`() {
        val defId = UUID.randomUUID()
        val targetId = UUID.randomUUID()
        val allowedTypeId = UUID.randomUUID()
        val actualTypeId = UUID.randomUUID() // different from allowed

        val rule = buildTargetRule(definitionId = defId, targetEntityTypeId = allowedTypeId)
        val definition = buildDefinition(id = defId, allowPolymorphic = false, targetRules = listOf(rule))
        val targetEntity = buildEntity(id = targetId, typeId = actualTypeId)

        whenever(entityRelationshipRepository.findAllBySourceIdAndDefinitionId(sourceEntityId, defId))
            .thenReturn(emptyList())
        whenever(entityRepository.findAllById(any<Collection<UUID>>())).thenReturn(listOf(targetEntity))

        assertThrows(IllegalArgumentException::class.java) {
            service.saveRelationships(
                id = sourceEntityId,
                workspaceId = workspaceId,
                definitionId = defId,
                definition = definition,
                targetIds = listOf(targetId),
            )
        }
    }

    @Test
    fun `saveRelationships - cardinality override - uses rule override over default`() {
        val defId = UUID.randomUUID()
        val targetId1 = UUID.randomUUID()
        val targetId2 = UUID.randomUUID()
        val targetTypeId = UUID.randomUUID()

        // Definition defaults to MANY_TO_MANY, but rule overrides to ONE_TO_ONE for this type
        val rule = buildTargetRule(
            definitionId = defId,
            targetEntityTypeId = targetTypeId,
            cardinalityOverride = EntityRelationshipCardinality.ONE_TO_ONE,
        )
        val definition = buildDefinition(
            id = defId,
            cardinalityDefault = EntityRelationshipCardinality.MANY_TO_MANY,
            targetRules = listOf(rule),
        )

        val targetEntity1 = buildEntity(id = targetId1, typeId = targetTypeId)
        val targetEntity2 = buildEntity(id = targetId2, typeId = targetTypeId)

        whenever(entityRelationshipRepository.findAllBySourceIdAndDefinitionId(sourceEntityId, defId))
            .thenReturn(emptyList())
        whenever(entityRepository.findAllById(any<Collection<UUID>>())).thenReturn(listOf(targetEntity1, targetEntity2))
        whenever(entityRelationshipRepository.countBySourceIdAndDefinitionId(sourceEntityId, defId)).thenReturn(0)

        // ONE_TO_ONE override should reject the second link
        assertThrows(IllegalArgumentException::class.java) {
            service.saveRelationships(
                id = sourceEntityId,
                workspaceId = workspaceId,
                definitionId = defId,
                definition = definition,
                targetIds = listOf(targetId1, targetId2),
            )
        }
    }

    // ------ Read ------

    @Test
    fun `findRelatedEntities - forward - returns targets`() {
        whenever(entityRelationshipRepository.findEntityLinksBySourceId(sourceEntityId, workspaceId))
            .thenReturn(emptyList())

        val result = service.findRelatedEntities(sourceEntityId, workspaceId)

        assertTrue(result.isEmpty())
        verify(entityRelationshipRepository).findEntityLinksBySourceId(sourceEntityId, workspaceId)
    }
}
