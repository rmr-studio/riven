package riven.core.service.workflow

import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Import
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.entity.workflow.WorkflowDefinitionEntity
import riven.core.entity.workflow.WorkflowDefinitionVersionEntity
import riven.core.enums.activity.Activity
import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.enums.util.OperationType
import riven.core.enums.workflow.WorkflowDefinitionStatus
import riven.core.exceptions.NotFoundException
import riven.core.models.request.workflow.CreateWorkflowDefinitionRequest
import riven.core.models.request.workflow.UpdateWorkflowDefinitionRequest
import riven.core.repository.workflow.WorkflowDefinitionRepository
import riven.core.repository.workflow.WorkflowDefinitionVersionRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import riven.core.service.util.factory.workflow.WorkflowFactory
import riven.core.enums.workspace.WorkspaceRoles
import java.util.*

@WithUserPersona(
    userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
    email = "test@example.com",
    displayName = "Test User",
    roles = [
        WorkspaceRole(
            workspaceId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
            role = WorkspaceRoles.ADMIN
        )
    ]
)
@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        WorkflowDefinitionServiceTest.TestConfig::class,
        WorkflowDefinitionService::class
    ]
)
class WorkflowDefinitionServiceTest {

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    @Import(WorkspaceSecurity::class)
    class TestConfig

    @MockitoBean
    private lateinit var workflowDefinitionRepository: WorkflowDefinitionRepository

    @MockitoBean
    private lateinit var workflowDefinitionVersionRepository: WorkflowDefinitionVersionRepository

    @MockitoBean
    private lateinit var activityService: ActivityService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    private lateinit var workflowDefinitionService: WorkflowDefinitionService

    private val workspaceId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
    private val userId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

    // ------------------------------------------------------------------
    // createWorkflow tests
    // ------------------------------------------------------------------

    @Test
    fun `createWorkflow_success_createsDefinitionAndVersion`() {
        // Arrange
        val definitionId = UUID.randomUUID()
        val versionId = UUID.randomUUID()

        val request = CreateWorkflowDefinitionRequest(
            name = "Test Workflow",
            description = "A test workflow",
            iconColour = IconColour.BLUE,
            iconType = IconType.WORKFLOW,
            tags = listOf("test", "automation")
        )

        val savedDefinition = WorkflowFactory.createDefinition(
            id = definitionId,
            workspaceId = workspaceId,
            name = request.name,
            description = request.description,
            versionNumber = 1,
            status = WorkflowDefinitionStatus.DRAFT,
            iconColour = request.iconColour,
            iconType = request.iconType,
            tags = request.tags
        )

        val savedVersion = WorkflowFactory.createVersion(
            id = versionId,
            workspaceId = workspaceId,
            workflowDefinitionId = definitionId,
            versionNumber = 1
        )

        whenever(workflowDefinitionRepository.save(any<WorkflowDefinitionEntity>())).thenReturn(savedDefinition)
        whenever(workflowDefinitionVersionRepository.save(any<WorkflowDefinitionVersionEntity>())).thenReturn(savedVersion)

        // Act
        val result = workflowDefinitionService.createWorkflow(workspaceId, request)

        // Assert
        assertEquals(definitionId, result.id)
        assertEquals(request.name, result.name)
        assertEquals(request.description, result.description)
        assertEquals(1, result.definition.version)
        assertEquals(WorkflowDefinitionStatus.DRAFT, result.status)

        // Verify repository calls
        verify(workflowDefinitionRepository, times(1)).save(any<WorkflowDefinitionEntity>())
        verify(workflowDefinitionVersionRepository, times(1)).save(any<WorkflowDefinitionVersionEntity>())

        // Verify activity logging
        verify(activityService).logActivity(
            activity = eq(Activity.WORKFLOW_DEFINITION),
            operation = eq(OperationType.CREATE),
            userId = any(),
            workspaceId = eq(workspaceId),
            entityType = any(),
            entityId = eq(definitionId),
            timestamp = any(),
            details = any()
        )
    }

    // ------------------------------------------------------------------
    // getWorkflowById tests
    // ------------------------------------------------------------------

    @Test
    fun `getWorkflowById_success_returnsWorkflow`() {
        // Arrange
        val definitionId = UUID.randomUUID()
        val definition = WorkflowFactory.createDefinition(
            id = definitionId,
            workspaceId = workspaceId,
            name = "Test Workflow",
            versionNumber = 1
        )
        val version = WorkflowFactory.createVersion(
            workspaceId = workspaceId,
            workflowDefinitionId = definitionId,
            versionNumber = 1
        )

        whenever(workflowDefinitionRepository.findById(definitionId)).thenReturn(Optional.of(definition))
        whenever(workflowDefinitionVersionRepository.findByWorkflowDefinitionIdAndVersionNumber(definitionId, 1))
            .thenReturn(version)

        // Act
        val result = workflowDefinitionService.getWorkflowById(definitionId, workspaceId)

        // Assert
        assertEquals(definitionId, result.id)
        assertEquals("Test Workflow", result.name)
        assertEquals(workspaceId, result.workspaceId)
    }

    @Test
    fun `getWorkflowById_notFound_throwsNotFoundException`() {
        // Arrange
        val definitionId = UUID.randomUUID()
        whenever(workflowDefinitionRepository.findById(definitionId)).thenReturn(Optional.empty())

        // Act & Assert
        assertThrows<NotFoundException> {
            workflowDefinitionService.getWorkflowById(definitionId, workspaceId)
        }
    }

    @Test
    fun `getWorkflowById_wrongWorkspace_throwsAccessDeniedException`() {
        // Arrange
        val definitionId = UUID.randomUUID()
        val differentWorkspaceId = UUID.randomUUID()
        val definition = WorkflowFactory.createDefinition(
            id = definitionId,
            workspaceId = differentWorkspaceId,
            name = "Test Workflow"
        )

        whenever(workflowDefinitionRepository.findById(definitionId)).thenReturn(Optional.of(definition))

        // Act & Assert
        assertThrows<AccessDeniedException> {
            workflowDefinitionService.getWorkflowById(definitionId, workspaceId)
        }
    }

    // ------------------------------------------------------------------
    // listWorkflowsForWorkspace tests
    // ------------------------------------------------------------------

    @Test
    fun `listWorkflowsForWorkspace_success_returnsList`() {
        // Arrange
        val definitions = (1..3).map { i ->
            val defId = UUID.randomUUID()
            WorkflowFactory.createDefinition(
                id = defId,
                workspaceId = workspaceId,
                name = "Workflow $i",
                versionNumber = 1
            ) to WorkflowFactory.createVersion(
                workspaceId = workspaceId,
                workflowDefinitionId = defId,
                versionNumber = 1
            )
        }

        whenever(workflowDefinitionRepository.findByWorkspaceId(workspaceId))
            .thenReturn(definitions.map { it.first })

        definitions.forEach { (def, version) ->
            whenever(workflowDefinitionVersionRepository.findByWorkflowDefinitionIdAndVersionNumber(def.id!!, 1))
                .thenReturn(version)
        }

        // Act
        val result = workflowDefinitionService.listWorkflowsForWorkspace(workspaceId)

        // Assert
        assertEquals(3, result.size)
        assertTrue(result.all { it.workspaceId == workspaceId })
    }

    // ------------------------------------------------------------------
    // updateWorkflow tests
    // ------------------------------------------------------------------

    @Test
    fun `updateWorkflow_success_updatesMetadata`() {
        // Arrange
        val definitionId = UUID.randomUUID()
        val definition = WorkflowFactory.createDefinition(
            id = definitionId,
            workspaceId = workspaceId,
            name = "Original Name",
            description = "Original Description",
            iconColour = IconColour.NEUTRAL,
            iconType = IconType.FILE,
            tags = listOf("original")
        )
        val version = WorkflowFactory.createVersion(
            workspaceId = workspaceId,
            workflowDefinitionId = definitionId,
            versionNumber = 1
        )

        val request = UpdateWorkflowDefinitionRequest(
            name = "Updated Name",
            description = "Updated Description",
            iconColour = IconColour.GREEN,
            iconType = IconType.WORKFLOW,
            tags = listOf("updated", "new")
        )

        whenever(workflowDefinitionRepository.findById(definitionId)).thenReturn(Optional.of(definition))
        whenever(workflowDefinitionRepository.save(any<WorkflowDefinitionEntity>())).thenAnswer { invocation ->
            invocation.arguments[0] as WorkflowDefinitionEntity
        }
        whenever(workflowDefinitionVersionRepository.findByWorkflowDefinitionIdAndVersionNumber(definitionId, 1))
            .thenReturn(version)

        // Act
        val result = workflowDefinitionService.updateWorkflow(definitionId, workspaceId, request)

        // Assert
        assertEquals("Updated Name", result.name)
        assertEquals("Updated Description", result.description)
        assertEquals(IconColour.GREEN, result.icon.colour)
        assertEquals(IconType.WORKFLOW, result.icon.type)
        assertEquals(listOf("updated", "new"), result.tags)

        // Verify repository save was called
        verify(workflowDefinitionRepository).save(any<WorkflowDefinitionEntity>())

        // Verify activity logging
        verify(activityService).logActivity(
            activity = eq(Activity.WORKFLOW_DEFINITION),
            operation = eq(OperationType.UPDATE),
            userId = any(),
            workspaceId = eq(workspaceId),
            entityType = any(),
            entityId = eq(definitionId),
            timestamp = any(),
            details = any()
        )
    }

    // ------------------------------------------------------------------
    // deleteWorkflow tests
    // ------------------------------------------------------------------

    @Test
    fun `deleteWorkflow_success_softDeletes`() {
        // Arrange
        val definitionId = UUID.randomUUID()
        val definition = WorkflowFactory.createDefinition(
            id = definitionId,
            workspaceId = workspaceId,
            name = "Workflow to Delete",
            deleted = false
        )

        whenever(workflowDefinitionRepository.findById(definitionId)).thenReturn(Optional.of(definition))
        whenever(workflowDefinitionRepository.save(any<WorkflowDefinitionEntity>())).thenAnswer { invocation ->
            invocation.arguments[0] as WorkflowDefinitionEntity
        }

        // Act
        workflowDefinitionService.deleteWorkflow(definitionId, workspaceId)

        // Assert - verify save was called with deleted=true
        val captor = argumentCaptor<WorkflowDefinitionEntity>()
        verify(workflowDefinitionRepository).save(captor.capture())
        assertTrue(captor.firstValue.deleted)
        assertNotNull(captor.firstValue.deletedAt)

        // Verify activity logging
        verify(activityService).logActivity(
            activity = eq(Activity.WORKFLOW_DEFINITION),
            operation = eq(OperationType.DELETE),
            userId = any(),
            workspaceId = eq(workspaceId),
            entityType = any(),
            entityId = eq(definitionId),
            timestamp = any(),
            details = any()
        )
    }

    @Test
    fun `deleteWorkflow_notFound_throwsNotFoundException`() {
        // Arrange
        val definitionId = UUID.randomUUID()
        whenever(workflowDefinitionRepository.findById(definitionId)).thenReturn(Optional.empty())

        // Act & Assert
        assertThrows<NotFoundException> {
            workflowDefinitionService.deleteWorkflow(definitionId, workspaceId)
        }
    }

    @Test
    fun `deleteWorkflow_alreadyDeleted_throwsNotFoundException`() {
        // Arrange
        val definitionId = UUID.randomUUID()
        val definition = WorkflowFactory.createDefinition(
            id = definitionId,
            workspaceId = workspaceId,
            name = "Already Deleted Workflow",
            deleted = true
        )

        whenever(workflowDefinitionRepository.findById(definitionId)).thenReturn(Optional.of(definition))

        // Act & Assert
        assertThrows<NotFoundException> {
            workflowDefinitionService.deleteWorkflow(definitionId, workspaceId)
        }

        // Verify save was NOT called
        verify(workflowDefinitionRepository, never()).save(any<WorkflowDefinitionEntity>())
    }
}
