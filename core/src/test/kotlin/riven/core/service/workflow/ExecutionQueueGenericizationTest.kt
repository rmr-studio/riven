package riven.core.service.workflow

import org.junit.jupiter.api.Disabled
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.enums.workflow.ExecutionJobType
import riven.core.enums.workflow.ExecutionQueueStatus
import riven.core.repository.workflow.ExecutionQueueRepository
import riven.core.repository.workflow.WorkflowDefinitionRepository
import riven.core.service.auth.AuthTokenService
import riven.core.service.util.BaseServiceTest
import riven.core.service.util.SecurityTestConfig
import riven.core.service.util.factory.workflow.WorkflowFactory
import riven.core.service.workflow.queue.WorkflowExecutionQueueService
import java.util.*

/**
 * Wave 0 regression scaffold for execution queue genericization (INFRA-01).
 *
 * These tests verify that:
 * 1. Existing workflow enqueue path sets job_type = WORKFLOW_EXECUTION
 * 2. The dispatcher query filters by job_type so IDENTITY_MATCH jobs are never claimed by the workflow dispatcher
 * 3. IDENTITY_MATCH jobs can be constructed with a null workflowDefinitionId (entityId is the discriminating field)
 *
 * All tests are disabled until plan 01-01 (queue genericization) is implemented.
 * Enable by removing @Disabled annotations after ExecutionQueueEntity gains a jobType field.
 */
@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        SecurityTestConfig::class,
        WorkflowExecutionQueueService::class
    ]
)
class ExecutionQueueGenericizationTest : BaseServiceTest() {

    @MockitoBean
    private lateinit var executionQueueRepository: ExecutionQueueRepository

    @MockitoBean
    private lateinit var workflowDefinitionRepository: WorkflowDefinitionRepository

    @Autowired
    private lateinit var workflowExecutionQueueService: WorkflowExecutionQueueService

    /**
     * Verifies that enqueueing a workflow execution produces a queue entry with
     * jobType = WORKFLOW_EXECUTION and a non-null workflowDefinitionId.
     *
     * After INFRA-01: assert savedEntity.jobType == ExecutionJobType.WORKFLOW_EXECUTION
     * and savedEntity.workflowDefinitionId != null.
     */
    @Test
    @Disabled("Wave 0 scaffold — enable after 01-01 implementation")
    fun `existing workflow queue service creates queue entry with WORKFLOW_EXECUTION job type`() {
        val definitionId = UUID.randomUUID()
        val definition = WorkflowFactory.createDefinition(
            id = definitionId,
            workspaceId = workspaceId
        )
        whenever(workflowDefinitionRepository.findById(definitionId)).thenReturn(Optional.of(definition))

        // After INFRA-01: ExecutionQueueEntity will have a jobType field.
        // The enqueue method should set jobType = WORKFLOW_EXECUTION on the saved entity.
        // Verify via argumentCaptor that the saved entity has the correct job type.
        TODO("Enable after 01-01: assert saved entity jobType == ExecutionJobType.WORKFLOW_EXECUTION")
    }

    /**
     * Verifies that claimPendingExecutions filters by WORKFLOW_EXECUTION job type
     * so the workflow dispatcher never picks up IDENTITY_MATCH jobs.
     *
     * After INFRA-01: the native query should include WHERE job_type = 'WORKFLOW_EXECUTION'.
     * Mock the repository to return an empty list and verify the query is called with
     * the correct job type filter.
     */
    @Test
    @Disabled("Wave 0 scaffold — enable after 01-01 implementation")
    fun `claim pending executions only returns WORKFLOW_EXECUTION jobs`() {
        whenever(executionQueueRepository.claimPendingExecutions(any())).thenReturn(emptyList())

        // After INFRA-01: the repository query will accept a jobType parameter.
        // Verify the dispatcher calls claimPendingExecutions with WORKFLOW_EXECUTION only.
        TODO("Enable after 01-01: verify claimPendingExecutions called with jobType = WORKFLOW_EXECUTION")
    }

    /**
     * Verifies that an ExecutionQueueEntity with jobType = IDENTITY_MATCH,
     * a non-null entityId, and a null workflowDefinitionId is valid and toModel() succeeds.
     *
     * After INFRA-01: ExecutionQueueEntity will have optional workflowDefinitionId
     * and a jobType discriminator. Identity match jobs have no workflow definition.
     */
    @Test
    @Disabled("Wave 0 scaffold — enable after 01-01 implementation")
    fun `queue entry with null workflowDefinitionId is valid for IDENTITY_MATCH jobs`() {
        val entityId = UUID.randomUUID()

        // After INFRA-01: construct ExecutionQueueEntity with:
        //   jobType = ExecutionJobType.IDENTITY_MATCH
        //   entityId = entityId
        //   workflowDefinitionId = null
        // Call toModel() and assert it succeeds without throwing.
        TODO("Enable after 01-01: construct IDENTITY_MATCH entity with null workflowDefinitionId and verify toModel() succeeds")
    }
}
