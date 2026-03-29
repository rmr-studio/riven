package riven.core.service.entity.type

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.enums.integration.SourceType
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.repository.entity.EntityRelationshipRepository
import riven.core.repository.entity.EntityTypeRepository
import riven.core.repository.entity.RelationshipDefinitionRepository
import riven.core.repository.entity.RelationshipTargetRuleRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.entity.EntityTypeSemanticMetadataService
import riven.core.service.util.BaseServiceTest
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import riven.core.service.util.factory.entity.EntityFactory
import java.util.*

/**
 * Tests entity type visibility filtering in EntityTypeService.getWorkspaceEntityTypesWithIncludes.
 *
 * Specifically verifies that includeInternal=false filters out INTEGRATION-sourced entity types
 * (those with sourceIntegrationId set), while retaining user-created and TEMPLATE types.
 */
@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        EntityTypeVisibilityTest.TestConfig::class,
        EntityTypeService::class,
        EntityTypeProtectionGuard::class,
    ]
)
@WithUserPersona(
    userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
    email = "test@test.com",
    displayName = "Test User",
    roles = [
        WorkspaceRole(
            workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
            role = WorkspaceRoles.OWNER,
        )
    ]
)
class EntityTypeVisibilityTest : BaseServiceTest() {

    @Configuration
    class TestConfig

    @MockitoBean private lateinit var entityTypeRepository: EntityTypeRepository
    @MockitoBean private lateinit var entityTypeRelationshipService: EntityTypeRelationshipService
    @MockitoBean private lateinit var entityAttributeService: EntityTypeAttributeService
    @MockitoBean private lateinit var definitionRepository: RelationshipDefinitionRepository
    @MockitoBean private lateinit var entityRelationshipRepository: EntityRelationshipRepository
    @MockitoBean private lateinit var targetRuleRepository: RelationshipTargetRuleRepository
    @MockitoBean private lateinit var activityService: ActivityService
    @MockitoBean private lateinit var semanticMetadataService: EntityTypeSemanticMetadataService

    @Autowired
    private lateinit var service: EntityTypeService

    @BeforeEach
    fun setup() {
        reset(
            entityTypeRepository,
            entityTypeRelationshipService,
            semanticMetadataService,
        )
    }

    @Test
    fun `includeInternal=false - sourceIntegrationId != null excluded`() {
        val userCreatedType = EntityFactory.createEntityType(
            key = "customer",
            displayNameSingular = "Customer",
            displayNamePlural = "Customers",
            workspaceId = workspaceId,
            sourceType = SourceType.USER_CREATED,
            sourceIntegrationId = null,
        )

        val templateType = EntityFactory.createEntityType(
            key = "deal",
            displayNameSingular = "Deal",
            displayNamePlural = "Deals",
            workspaceId = workspaceId,
            sourceType = SourceType.TEMPLATE,
            sourceIntegrationId = null,
        )

        val integrationTypeId = UUID.randomUUID()
        val integrationSourceId = UUID.randomUUID()
        val integrationType = EntityFactory.createEntityType(
            id = integrationTypeId,
            key = "hubspot-contact",
            displayNameSingular = "HubSpot Contact",
            displayNamePlural = "HubSpot Contacts",
            workspaceId = workspaceId,
            sourceType = SourceType.INTEGRATION,
            sourceIntegrationId = integrationSourceId,
            readonly = true,
        )

        whenever(entityTypeRepository.findByworkspaceId(workspaceId))
            .thenReturn(listOf(userCreatedType, templateType, integrationType))

        // Return empty maps/lists for relationship and metadata enrichment
        whenever(entityTypeRelationshipService.getDefinitionsForEntityTypes(eq(workspaceId), any()))
            .thenReturn(emptyMap())
        whenever(semanticMetadataService.getMetadataForEntityTypes(any()))
            .thenReturn(emptyList())

        val result = service.getWorkspaceEntityTypesWithIncludes(workspaceId, includeInternal = false)

        assertEquals(2, result.size, "Should return only user-created and TEMPLATE types")
        val returnedKeys = result.map { it.key }.toSet()
        assertTrue(returnedKeys.contains("customer"), "User-created type should be included")
        assertTrue(returnedKeys.contains("deal"), "TEMPLATE type should be included")
        assertTrue(!returnedKeys.contains("hubspot-contact"), "INTEGRATION type should be excluded")
    }
}
