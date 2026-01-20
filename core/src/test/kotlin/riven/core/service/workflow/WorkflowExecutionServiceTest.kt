package riven.core.service.workflow

import io.github.oshai.kotlinlogging.KLogger
import io.temporal.client.WorkflowClient
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Import
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.enums.workflow.WorkflowStatus
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.exceptions.NotFoundException
import riven.core.repository.workflow.WorkflowDefinitionRepository
import riven.core.repository.workflow.WorkflowDefinitionVersionRepository
import riven.core.repository.workflow.WorkflowExecutionNodeRepository
import riven.core.repository.workflow.WorkflowExecutionRepository
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import riven.core.service.util.factory.workflow.WorkflowFactory
import riven.core.enums.workspace.WorkspaceRoles
import java.time.ZonedDateTime
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
        WorkflowExecutionServiceTest.TestConfig::class,
        WorkflowExecutionService::class
    ]
)
class WorkflowExecutionServiceTest {

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    @Import(WorkspaceSecurity::class)
    class TestConfig

    @MockitoBean
    private lateinit var workflowClient: WorkflowClient

    @MockitoBean
    private lateinit var workflowDefinitionRepository: WorkflowDefinitionRepository

    @MockitoBean
    private lateinit var workflowDefinitionVersionRepository: WorkflowDefinitionVersionRepository

    @MockitoBean
    private lateinit var workflowExecutionRepository: WorkflowExecutionRepository

    @MockitoBean
    private lateinit var workflowExecutionNodeRepository: WorkflowExecutionNodeRepository

    @MockitoBean
    private lateinit var activityService: ActivityService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    private lateinit var workflowExecutionService: WorkflowExecutionService

    private val workspaceId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
    private val userId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

    // ------------------------------------------------------------------
    // getExecutionById tests
    // ------------------------------------------------------------------

    @Test
    fun `getExecutionById_success_returnsExecutionDetails`() {
        // Arrange
        val executionId = UUID.randomUUID()
        val workflowDefinitionId = UUID.randomUUID()
        val workflowVersionId = UUID.randomUUID()
        val startedAt = ZonedDateTime.now().minusMinutes(5)
        val completedAt = ZonedDateTime.now()

        val execution = WorkflowFactory.createExecution(
            id = executionId,
            workspaceId = workspaceId,
            workflowDefinitionId = workflowDefinitionId,
            workflowVersionId = workflowVersionId,
            status = WorkflowStatus.COMPLETED,
            triggerType = WorkflowTriggerType.FUNCTION,
            startedAt = startedAt,
            completedAt = completedAt,
            durationMs = 5000,
            input = mapOf("key" to "value"),
            output = mapOf("result" to "success"),
            error = null
        )

        whenever(workflowExecutionRepository.findById(executionId)).thenReturn(Optional.of(execution))

        // Act
        val result = workflowExecutionService.getExecutionById(executionId, workspaceId)

        // Assert
        assertEquals(executionId, result["executionId"])
        assertEquals(workflowDefinitionId, result["workflowDefinitionId"])
        assertEquals(workflowVersionId, result["workflowVersionId"])
        assertEquals(WorkflowStatus.COMPLETED, result["status"])
        assertEquals(startedAt, result["startedAt"])
        assertEquals(completedAt, result["completedAt"])
        assertEquals(5000L, result["durationMs"])
        assertEquals(WorkflowTriggerType.FUNCTION, result["triggerType"])
        assertNotNull(result["input"])
        assertNotNull(result["output"])
    }

    @Test
    fun `getExecutionById_notFound_throwsNotFoundException`() {
        // Arrange
        val executionId = UUID.randomUUID()
        whenever(workflowExecutionRepository.findById(executionId)).thenReturn(Optional.empty())

        // Act & Assert
        assertThrows<NotFoundException> {
            workflowExecutionService.getExecutionById(executionId, workspaceId)
        }
    }

    @Test
    fun `getExecutionById_wrongWorkspace_throwsSecurityException`() {
        // Arrange
        val executionId = UUID.randomUUID()
        val differentWorkspaceId = UUID.randomUUID()

        val execution = WorkflowFactory.createExecution(
            id = executionId,
            workspaceId = differentWorkspaceId,
            workflowDefinitionId = UUID.randomUUID()
        )

        whenever(workflowExecutionRepository.findById(executionId)).thenReturn(Optional.of(execution))

        // Act & Assert
        assertThrows<SecurityException> {
            workflowExecutionService.getExecutionById(executionId, workspaceId)
        }
    }

    // ------------------------------------------------------------------
    // listExecutionsForWorkflow tests
    // ------------------------------------------------------------------

    @Test
    fun `listExecutionsForWorkflow_success_returnsList`() {
        // Arrange
        val workflowDefinitionId = UUID.randomUUID()
        val now = ZonedDateTime.now()

        val executions = (1..3).map { i ->
            WorkflowFactory.createExecution(
                id = UUID.randomUUID(),
                workspaceId = workspaceId,
                workflowDefinitionId = workflowDefinitionId,
                status = if (i == 1) WorkflowStatus.RUNNING else WorkflowStatus.COMPLETED,
                startedAt = now.minusMinutes(i.toLong() * 10),
                completedAt = if (i == 1) null else now.minusMinutes(i.toLong() * 10 - 5),
                durationMs = if (i == 1) 0 else 5000
            )
        }

        whenever(workflowExecutionRepository.findByWorkflowDefinitionIdAndWorkspaceIdOrderByStartedAtDesc(
            workflowDefinitionId, workspaceId
        )).thenReturn(executions)

        // Act
        val result = workflowExecutionService.listExecutionsForWorkflow(workflowDefinitionId, workspaceId)

        // Assert
        assertEquals(3, result.size)
        result.forEach { execution ->
            assertNotNull(execution["executionId"])
            assertEquals(workflowDefinitionId, execution["workflowDefinitionId"])
            assertNotNull(execution["status"])
            assertNotNull(execution["startedAt"])
        }
    }

    // ------------------------------------------------------------------
    // listExecutionsForWorkspace tests
    // ------------------------------------------------------------------

    @Test
    fun `listExecutionsForWorkspace_success_returnsList`() {
        // Arrange
        val now = ZonedDateTime.now()
        val workflowDef1 = UUID.randomUUID()
        val workflowDef2 = UUID.randomUUID()

        val executions = listOf(
            WorkflowFactory.createExecution(
                id = UUID.randomUUID(),
                workspaceId = workspaceId,
                workflowDefinitionId = workflowDef1,
                status = WorkflowStatus.COMPLETED,
                startedAt = now.minusMinutes(10)
            ),
            WorkflowFactory.createExecution(
                id = UUID.randomUUID(),
                workspaceId = workspaceId,
                workflowDefinitionId = workflowDef2,
                status = WorkflowStatus.RUNNING,
                startedAt = now.minusMinutes(5)
            ),
            WorkflowFactory.createExecution(
                id = UUID.randomUUID(),
                workspaceId = workspaceId,
                workflowDefinitionId = workflowDef1,
                status = WorkflowStatus.FAILED,
                startedAt = now.minusMinutes(15)
            )
        )

        whenever(workflowExecutionRepository.findByWorkspaceIdOrderByStartedAtDesc(workspaceId))
            .thenReturn(executions)

        // Act
        val result = workflowExecutionService.listExecutionsForWorkspace(workspaceId)

        // Assert
        assertEquals(3, result.size)

        // Verify different workflow definition IDs are included
        val definitionIds = result.map { it["workflowDefinitionId"] }.toSet()
        assertEquals(2, definitionIds.size)
        assertTrue(definitionIds.contains(workflowDef1))
        assertTrue(definitionIds.contains(workflowDef2))
    }

    // ------------------------------------------------------------------
    // getExecutionNodeDetails tests
    // ------------------------------------------------------------------

    @Test
    fun `getExecutionNodeDetails_success_returnsNodeList`() {
        // Arrange
        val executionId = UUID.randomUUID()
        val now = ZonedDateTime.now()

        val execution = WorkflowFactory.createExecution(
            id = executionId,
            workspaceId = workspaceId,
            workflowDefinitionId = UUID.randomUUID()
        )

        val nodeExecutions = (0 until 5).map { i ->
            WorkflowFactory.createNodeExecution(
                id = UUID.randomUUID(),
                workspaceId = workspaceId,
                workflowExecutionId = executionId,
                nodeId = UUID.randomUUID(),
                sequenceIndex = i,
                status = WorkflowStatus.COMPLETED,
                startedAt = now.minusMinutes(5L - i),
                completedAt = now.minusMinutes(4L - i),
                durationMs = 1000L * (i + 1),
                output = mapOf("node" to "output-$i")
            )
        }

        whenever(workflowExecutionRepository.findById(executionId)).thenReturn(Optional.of(execution))
        whenever(workflowExecutionNodeRepository.findByWorkflowExecutionIdOrderBySequenceIndexAsc(executionId))
            .thenReturn(nodeExecutions)

        // Act
        val result = workflowExecutionService.getExecutionNodeDetails(executionId, workspaceId)

        // Assert
        assertEquals(5, result.size)
        result.forEachIndexed { index, node ->
            assertNotNull(node["nodeId"])
            assertEquals(index, node["sequenceIndex"])
            assertEquals(WorkflowStatus.COMPLETED, node["status"])
            assertNotNull(node["startedAt"])
            assertNotNull(node["completedAt"])
            assertNotNull(node["output"])
        }
    }

    @Test
    fun `getExecutionNodeDetails_executionNotFound_throwsNotFoundException`() {
        // Arrange
        val executionId = UUID.randomUUID()
        whenever(workflowExecutionRepository.findById(executionId)).thenReturn(Optional.empty())

        // Act & Assert
        assertThrows<NotFoundException> {
            workflowExecutionService.getExecutionNodeDetails(executionId, workspaceId)
        }
    }

    @Test
    fun `getExecutionNodeDetails_wrongWorkspace_throwsSecurityException`() {
        // Arrange
        val executionId = UUID.randomUUID()
        val differentWorkspaceId = UUID.randomUUID()

        val execution = WorkflowFactory.createExecution(
            id = executionId,
            workspaceId = differentWorkspaceId,
            workflowDefinitionId = UUID.randomUUID()
        )

        whenever(workflowExecutionRepository.findById(executionId)).thenReturn(Optional.of(execution))

        // Act & Assert
        assertThrows<SecurityException> {
            workflowExecutionService.getExecutionNodeDetails(executionId, workspaceId)
        }

        // Verify node repository was NOT called
        verify(workflowExecutionNodeRepository, never()).findByWorkflowExecutionIdOrderBySequenceIndexAsc(any())
    }
}
