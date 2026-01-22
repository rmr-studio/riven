package riven.core.service.workflow

import io.github.oshai.kotlinlogging.KLogger
import io.temporal.client.WorkflowClient
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Import
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.enums.workflow.WorkflowStatus
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.enums.workspace.WorkspaceRoles
import riven.core.exceptions.NotFoundException
import riven.core.repository.workflow.WorkflowDefinitionRepository
import riven.core.repository.workflow.WorkflowExecutionNodeRepository
import riven.core.repository.workflow.WorkflowExecutionRepository
import riven.core.repository.workflow.projection.ExecutionSummaryProjection
import riven.core.service.activity.ActivityService
import riven.core.service.auth.AuthTokenService
import riven.core.service.util.WithUserPersona
import riven.core.service.util.WorkspaceRole
import riven.core.service.util.factory.workflow.WorkflowFactory
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
    private lateinit var workflowExecutionQueueService: ExecutionQueueService

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
        assertEquals(executionId, result.id)
        assertEquals(workflowDefinitionId, result.workflowDefinitionId)
        assertEquals(workflowVersionId, result.workflowVersionId)
        assertEquals(WorkflowStatus.COMPLETED, result.status)
        assertEquals(startedAt, result.startedAt)
        assertEquals(completedAt, result.completedAt)
        assertEquals(WorkflowTriggerType.FUNCTION, result.triggerType)
        assertNotNull(result.input)
        assertNotNull(result.output)
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

        whenever(
            workflowExecutionRepository.findByWorkflowDefinitionIdAndWorkspaceIdOrderByStartedAtDesc(
                workflowDefinitionId, workspaceId
            )
        ).thenReturn(executions)

        // Act
        val result = workflowExecutionService.listExecutionsForWorkflow(workflowDefinitionId, workspaceId)

        // Assert
        assertEquals(3, result.size)
        result.forEach { execution ->
            assertNotNull(execution.id)
            assertEquals(workflowDefinitionId, execution.workflowDefinitionId)
            assertNotNull(execution.status)
            assertNotNull(execution.startedAt)
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
        val result = workflowExecutionService.getWorkspaceExecutionRecords(workspaceId)

        // Assert
        assertEquals(3, result.size)

        // Verify different workflow definition IDs are included
        val definitionIds = result.map { it.workflowDefinitionId }.toSet()
        assertEquals(2, definitionIds.size)
        assertTrue(definitionIds.contains(workflowDef1))
        assertTrue(definitionIds.contains(workflowDef2))
    }

    // ------------------------------------------------------------------
    // getExecutionSummary tests
    // ------------------------------------------------------------------

    @Test
    fun `getExecutionSummary_success_returnsExecutionAndNodeList`() {
        // Arrange
        val executionId = UUID.randomUUID()
        val workflowDefinitionId = UUID.randomUUID()
        val workflowVersionId = UUID.randomUUID()
        val now = ZonedDateTime.now()

        val execution = WorkflowFactory.createExecution(
            id = executionId,
            workspaceId = workspaceId,
            workflowDefinitionId = workflowDefinitionId,
            workflowVersionId = workflowVersionId,
            status = WorkflowStatus.COMPLETED,
            startedAt = now.minusMinutes(10),
            completedAt = now
        )

        // Create nodes and node executions as projections
        val projections = (0 until 5).map { i ->
            val nodeId = UUID.randomUUID()
            val node = WorkflowFactory.createNode(
                id = nodeId,
                workspaceId = workspaceId,
                key = "node-$i",
                name = "Node $i"
            )
            val nodeExecution = WorkflowFactory.createNodeExecution(
                id = UUID.randomUUID(),
                workspaceId = workspaceId,
                workflowExecutionId = executionId,
                nodeId = nodeId,
                sequenceIndex = i,
                status = WorkflowStatus.COMPLETED,
                startedAt = now.minusMinutes(5L - i),
                completedAt = now.minusMinutes(4L - i),
                durationMs = 1000L * (i + 1),
                output = mapOf("node" to "output-$i")
            )
            ExecutionSummaryProjection(execution, nodeExecution, node)
        }

        whenever(workflowExecutionRepository.findExecutionWithNodesByExecutionId(workspaceId, executionId))
            .thenReturn(projections)

        // Act
        val (executionRecord, nodeRecords) = workflowExecutionService.getExecutionSummary(executionId, workspaceId)

        // Assert execution record
        assertEquals(executionId, executionRecord.id)
        assertEquals(workflowDefinitionId, executionRecord.workflowDefinitionId)
        assertEquals(workflowVersionId, executionRecord.workflowVersionId)
        assertEquals(WorkflowStatus.COMPLETED, executionRecord.status)

        // Assert node records
        assertEquals(5, nodeRecords.size)
        nodeRecords.forEachIndexed { index, nodeRecord ->
            assertEquals(index, nodeRecord.sequenceIndex)
            assertEquals(WorkflowStatus.COMPLETED, nodeRecord.status)
            assertEquals("Node $index", nodeRecord.node?.name)
            assertEquals("node-$index", nodeRecord.node?.key)
            assertNotNull(nodeRecord.startedAt)
            assertNotNull(nodeRecord.completedAt)
            assertNotNull(nodeRecord.output)
        }
    }

    @Test
    fun `getExecutionSummary_noNodeExecutions_throwsNotFoundException`() {
        // Arrange
        val executionId = UUID.randomUUID()

        // When there are no node executions, the JOIN query returns an empty list
        whenever(workflowExecutionRepository.findExecutionWithNodesByExecutionId(workspaceId, executionId))
            .thenReturn(emptyList())

        // Act & Assert
        assertThrows<NotFoundException> {
            workflowExecutionService.getExecutionSummary(executionId, workspaceId)
        }
    }

    @Test
    fun `getExecutionSummary_executionNotFound_throwsNotFoundException`() {
        // Arrange
        val executionId = UUID.randomUUID()
        whenever(workflowExecutionRepository.findExecutionWithNodesByExecutionId(workspaceId, executionId))
            .thenReturn(emptyList())

        // Act & Assert
        assertThrows<NotFoundException> {
            workflowExecutionService.getExecutionSummary(executionId, workspaceId)
        }
    }

    @Test
    fun `getExecutionSummary_wrongWorkspace_throwsSecurityException`() {
        // Arrange
        val executionId = UUID.randomUUID()
        val differentWorkspaceId = UUID.randomUUID()
        val nodeId = UUID.randomUUID()
        val now = ZonedDateTime.now()

        val execution = WorkflowFactory.createExecution(
            id = executionId,
            workspaceId = differentWorkspaceId,
            workflowDefinitionId = UUID.randomUUID()
        )

        val nodeExecution = WorkflowFactory.createNodeExecution(
            id = UUID.randomUUID(),
            workspaceId = differentWorkspaceId,
            workflowExecutionId = executionId,
            nodeId = nodeId,
            sequenceIndex = 0,
            status = WorkflowStatus.COMPLETED,
            startedAt = now.minusMinutes(5),
            completedAt = now
        )

        val node = WorkflowFactory.createNode(
            id = nodeId,
            workspaceId = differentWorkspaceId,
            key = "test-node",
            name = "Test Node"
        )

        val projections = listOf(ExecutionSummaryProjection(execution, nodeExecution, node))

        whenever(workflowExecutionRepository.findExecutionWithNodesByExecutionId(workspaceId, executionId))
            .thenReturn(projections)

        // Act & Assert
        assertThrows<SecurityException> {
            workflowExecutionService.getExecutionSummary(executionId, workspaceId)
        }
    }

    @Test
    fun `getExecutionSummary_nodeDeleted_returnsNullNodeInRecord`() {
        // Arrange
        val executionId = UUID.randomUUID()
        val nodeId = UUID.randomUUID()
        val now = ZonedDateTime.now()

        val execution = WorkflowFactory.createExecution(
            id = executionId,
            workspaceId = workspaceId,
            workflowDefinitionId = UUID.randomUUID()
        )

        val nodeExecution = WorkflowFactory.createNodeExecution(
            id = UUID.randomUUID(),
            workspaceId = workspaceId,
            workflowExecutionId = executionId,
            nodeId = nodeId,
            sequenceIndex = 0,
            status = WorkflowStatus.COMPLETED,
            startedAt = now.minusMinutes(5),
            completedAt = now
        )

        // Projection with node execution but node is null (deleted)
        val projections = listOf(ExecutionSummaryProjection(execution, nodeExecution, null))

        whenever(workflowExecutionRepository.findExecutionWithNodesByExecutionId(workspaceId, executionId))
            .thenReturn(projections)

        // Act - service logs warning but does not throw
        val (executionRecord, nodeRecords) = workflowExecutionService.getExecutionSummary(executionId, workspaceId)

        // Assert
        assertEquals(executionId, executionRecord.id)
        assertEquals(1, nodeRecords.size)
        assertNull(nodeRecords.first().node)
    }
}
