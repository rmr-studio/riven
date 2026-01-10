//package riven.core.service.workflow
//
//import io.temporal.client.WorkflowClient
//import io.temporal.client.WorkflowOptions
//import io.temporal.testing.TestWorkflowEnvironment
//import io.temporal.worker.Worker
//import org.junit.jupiter.api.AfterEach
//import org.junit.jupiter.api.Assertions.*
//import org.junit.jupiter.api.BeforeEach
//import org.junit.jupiter.api.Test
//import riven.core.models.workflow.temporal.NodeExecutionResult
//import riven.core.models.workflow.temporal.WorkflowExecutionInput
//import riven.core.service.workflow.temporal.activities.WorkflowNodeActivities
//import riven.core.service.workflow.temporal.workflows.WorkflowExecutionWorkflow
//import riven.core.service.workflow.temporal.workflows.WorkflowExecutionWorkflowImpl
//import java.util.*
//
///**
// * Integration test for Temporal workflow execution end-to-end.
// *
// * Uses Temporal's TestWorkflowEnvironment for isolated testing without external dependencies.
// * Tests the full workflow lifecycle:
// * - Workflow receives input
// * - Activities execute nodes (stubbed for testing)
// * - Results are collected and returned
// * - Workflow handles failures correctly
// *
// * This test validates:
// * 1. Workflow orchestration logic
// * 2. Activity invocation
// * 3. Deterministic workflow behavior
// * 4. Error handling and sequential execution
// */
//class WorkflowExecutionIntegrationTest {
//
//    private lateinit var testEnv: TestWorkflowEnvironment
//    private lateinit var worker: Worker
//    private lateinit var client: WorkflowClient
//
//    private val workspaceId = UUID.randomUUID()
//    private val workflowDefinitionId = UUID.randomUUID()
//
//    companion object {
//        private const val TASK_QUEUE = "workflow-execution-queue"
//    }
//
//    @BeforeEach
//    fun setup() {
//        // Create Temporal test environment (in-memory)
//        testEnv = TestWorkflowEnvironment.newInstance()
//
//        // Create activity stub implementation for testing
//        val activities = object : WorkflowNodeActivities {
//            override fun executeNode(nodeId: UUID, workspaceId: UUID): NodeExecutionResult {
//                // Stub implementation for testing - returns success for all nodes
//                return NodeExecutionResult(
//                    nodeId = nodeId,
//                    status = "COMPLETED",
//                    output = mapOf("result" to "stubbed-execution", "nodeId" to nodeId.toString())
//                )
//            }
//        }
//
//        // Create worker and register workflow and activities
//        worker = testEnv.newWorker(TASK_QUEUE)
//        worker.registerWorkflowImplementationTypes(WorkflowExecutionWorkflowImpl::class.java)
//        worker.registerActivitiesImplementations(activities)
//
//        // Start test environment
//        testEnv.start()
//
//        // Get workflow client
//        client = testEnv.workflowClient
//    }
//
//    @AfterEach
//    fun tearDown() {
//        // Shut down test environment
//        testEnv.close()
//    }
//
//    @Test
//    fun `testSimpleWorkflowExecution executes two nodes successfully`() {
//        // Given: Two node IDs to execute
//        val node1Id = UUID.randomUUID()
//        val node2Id = UUID.randomUUID()
//
//        // When: Start workflow
//        val input = WorkflowExecutionInput(
//            workflowDefinitionId = workflowDefinitionId,
//            nodeIds = listOf(node1Id, node2Id),
//            workspaceId = workspaceId
//        )
//
//        val workflowStub = client.newWorkflowStub(
//            WorkflowExecutionWorkflow::class.java,
//            WorkflowOptions.newBuilder()
//                .setTaskQueue(TASK_QUEUE)
//                .setWorkflowId("test-execution-${UUID.randomUUID()}")
//                .build()
//        )
//
//        // Execute workflow synchronously (blocking for test)
//        val result = workflowStub.execute(input)
//
//        // Then: Verify results
//        assertNotNull(result)
//        assertEquals("COMPLETED", result.status)
//        assertEquals(2, result.nodeResults.size)
//
//        // Verify node 1 result
//        assertEquals(node1Id, result.nodeResults[0].nodeId)
//        assertEquals("COMPLETED", result.nodeResults[0].status)
//        assertNotNull(result.nodeResults[0].output)
//
//        // Verify node 2 result
//        assertEquals(node2Id, result.nodeResults[1].nodeId)
//        assertEquals("COMPLETED", result.nodeResults[1].status)
//        assertNotNull(result.nodeResults[1].output)
//    }
//
//    @Test
//    fun `testWorkflowWithSingleNode executes successfully`() {
//        // Given: Single node ID
//        val nodeId = UUID.randomUUID()
//
//        // When: Execute workflow
//        val input = WorkflowExecutionInput(
//            workflowDefinitionId = workflowDefinitionId,
//            nodeIds = listOf(nodeId),
//            workspaceId = workspaceId
//        )
//
//        val workflowStub = client.newWorkflowStub(
//            WorkflowExecutionWorkflow::class.java,
//            WorkflowOptions.newBuilder()
//                .setTaskQueue(TASK_QUEUE)
//                .setWorkflowId("test-single-${UUID.randomUUID()}")
//                .build()
//        )
//
//        val result = workflowStub.execute(input)
//
//        // Then: Verify workflow completed successfully
//        assertEquals("COMPLETED", result.status)
//        assertEquals(1, result.nodeResults.size)
//        assertEquals("COMPLETED", result.nodeResults[0].status)
//        assertEquals(nodeId, result.nodeResults[0].nodeId)
//    }
//
//    @Test
//    fun `testWorkflowFailsWhenNodeFails aborts execution early`() {
//        // Given: Activity that fails on second node
//        val node1Id = UUID.randomUUID()
//        val node2Id = UUID.randomUUID()
//        val node3Id = UUID.randomUUID()
//
//        val activities = object : WorkflowNodeActivities {
//            override fun executeNode(nodeId: UUID, workspaceId: UUID): NodeExecutionResult {
//                return if (nodeId == node2Id) {
//                    // Second node fails
//                    NodeExecutionResult(
//                        nodeId = nodeId,
//                        status = "FAILED",
//                        error = "Node execution failed intentionally for test"
//                    )
//                } else {
//                    NodeExecutionResult(
//                        nodeId = nodeId,
//                        status = "COMPLETED",
//                        output = mapOf("result" to "success")
//                    )
//                }
//            }
//        }
//
//        // Re-register worker with failing activity
//        testEnv.shutdownNow()
//        testEnv = TestWorkflowEnvironment.newInstance()
//        worker = testEnv.newWorker(TASK_QUEUE)
//        worker.registerWorkflowImplementationTypes(WorkflowExecutionWorkflowImpl::class.java)
//        worker.registerActivitiesImplementations(activities)
//        testEnv.start()
//        client = testEnv.workflowClient
//
//        // When: Execute workflow with 3 nodes (second one fails)
//        val input = WorkflowExecutionInput(
//            workflowDefinitionId = workflowDefinitionId,
//            nodeIds = listOf(node1Id, node2Id, node3Id),
//            workspaceId = workspaceId
//        )
//
//        val workflowStub = client.newWorkflowStub(
//            WorkflowExecutionWorkflow::class.java,
//            WorkflowOptions.newBuilder()
//                .setTaskQueue(TASK_QUEUE)
//                .setWorkflowId("test-failure-${UUID.randomUUID()}")
//                .build()
//        )
//
//        val result = workflowStub.execute(input)
//
//        // Then: Workflow should fail and abort after second node
//        assertEquals("FAILED", result.status)
//        assertEquals(2, result.nodeResults.size) // Only first 2 nodes executed
//
//        // First node succeeded
//        assertEquals("COMPLETED", result.nodeResults[0].status)
//
//        // Second node failed
//        assertEquals("FAILED", result.nodeResults[1].status)
//        assertNotNull(result.nodeResults[1].error)
//        assertTrue(result.nodeResults[1].error!!.contains("failed intentionally"))
//    }
//
//    @Test
//    fun `testWorkflowExecutesNodesInSequentialOrder maintains order`() {
//        // Given: Multiple nodes with tracked execution order
//        val executionOrder = mutableListOf<UUID>()
//
//        val node1Id = UUID.randomUUID()
//        val node2Id = UUID.randomUUID()
//        val node3Id = UUID.randomUUID()
//
//        val activities = object : WorkflowNodeActivities {
//            override fun executeNode(nodeId: UUID, workspaceId: UUID): NodeExecutionResult {
//                executionOrder.add(nodeId)
//                return NodeExecutionResult(
//                    nodeId = nodeId,
//                    status = "COMPLETED",
//                    output = mapOf("order" to executionOrder.size)
//                )
//            }
//        }
//
//        // Re-register worker with order-tracking activity
//        testEnv.shutdownNow()
//        testEnv = TestWorkflowEnvironment.newInstance()
//        worker = testEnv.newWorker(TASK_QUEUE)
//        worker.registerWorkflowImplementationTypes(WorkflowExecutionWorkflowImpl::class.java)
//        worker.registerActivitiesImplementations(activities)
//        testEnv.start()
//        client = testEnv.workflowClient
//
//        // When: Execute workflow
//        val input = WorkflowExecutionInput(
//            workflowDefinitionId = workflowDefinitionId,
//            nodeIds = listOf(node1Id, node2Id, node3Id),
//            workspaceId = workspaceId
//        )
//
//        val workflowStub = client.newWorkflowStub(
//            WorkflowExecutionWorkflow::class.java,
//            WorkflowOptions.newBuilder()
//                .setTaskQueue(TASK_QUEUE)
//                .setWorkflowId("test-order-${UUID.randomUUID()}")
//                .build()
//        )
//
//        val result = workflowStub.execute(input)
//
//        // Then: Nodes executed in exact order specified
//        assertEquals("COMPLETED", result.status)
//        assertEquals(3, result.nodeResults.size)
//        assertEquals(listOf(node1Id, node2Id, node3Id), executionOrder)
//    }
//}
