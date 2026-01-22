package riven.core.service.workflow

import io.github.oshai.kotlinlogging.KLogger
import io.temporal.client.WorkflowClient
import io.temporal.client.WorkflowOptions
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.configuration.workflow.TemporalWorkerConfiguration
import riven.core.entity.workflow.ExecutionQueueEntity
import riven.core.entity.workflow.execution.WorkflowExecutionEntity
import riven.core.enums.workflow.WorkflowStatus
import riven.core.enums.workflow.WorkflowTriggerType
import riven.core.enums.workspace.WorkspaceTier
import riven.core.models.workflow.engine.WorkflowExecutionInput
import riven.core.repository.workflow.ExecutionQueueRepository
import riven.core.repository.workflow.WorkflowDefinitionRepository
import riven.core.repository.workflow.WorkflowDefinitionVersionRepository
import riven.core.repository.workflow.WorkflowExecutionRepository
import riven.core.repository.workspace.WorkspaceRepository
import riven.core.service.workflow.engine.WorkflowOrchestration
import java.time.ZonedDateTime
import java.util.UUID

/**
 * Service that processes the execution queue and dispatches to Temporal.
 *
 * Runs on a schedule with distributed locking (ShedLock) to ensure
 * only one instance processes the queue at a time across deployments.
 *
 * Flow:
 * 1. Claim pending items via SKIP LOCKED
 * 2. For each item, check workspace tier capacity
 * 3. If capacity available, dispatch to Temporal and mark DISPATCHED
 * 4. If at capacity, leave in queue (will retry next poll)
 * 5. On error, mark FAILED or release for retry
 */
@Service
class ExecutionDispatcherService(
    private val executionQueueRepository: ExecutionQueueRepository,
    private val executionQueueService: ExecutionQueueService,
    private val workflowExecutionRepository: WorkflowExecutionRepository,
    private val workflowDefinitionRepository: WorkflowDefinitionRepository,
    private val workflowDefinitionVersionRepository: WorkflowDefinitionVersionRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val workflowClient: WorkflowClient,
    private val logger: KLogger
) {

    companion object {
        /** Batch size for queue processing */
        const val BATCH_SIZE = 10

        /** Polling interval in milliseconds (5 seconds) */
        const val POLL_INTERVAL_MS = 5000L

        /** Maximum dispatch attempts before marking FAILED */
        const val MAX_ATTEMPTS = 3
    }

    /**
     * Process the execution queue.
     *
     * Called on fixed delay schedule with distributed lock.
     * Only one instance across the cluster processes at a time.
     */
    @Scheduled(fixedDelay = POLL_INTERVAL_MS)
    @SchedulerLock(
        name = "processExecutionQueue",
        lockAtMostFor = "4m",
        lockAtLeastFor = "10s"
    )
    @Transactional
    fun processQueue() {
        val pending = executionQueueRepository.claimPendingExecutions(BATCH_SIZE)

        if (pending.isEmpty()) {
            return
        }

        logger.debug { "Processing ${pending.size} queue items" }

        for (item in pending) {
            try {
                processQueueItem(item)
            } catch (e: Exception) {
                handleProcessingError(item, e)
            }
        }
    }

    /**
     * Process a single queue item.
     *
     * Checks workspace capacity and dispatches if available.
     */
    private fun processQueueItem(item: ExecutionQueueEntity) {
        // Mark as claimed
        executionQueueService.markClaimed(item)

        // Get workspace and check tier capacity
        val workspace = workspaceRepository.findById(item.workspaceId).orElse(null)
        if (workspace == null) {
            logger.warn { "Workspace ${item.workspaceId} not found, marking item ${item.id} as failed" }
            executionQueueService.markFailed(item, "Workspace not found")
            return
        }

        val tier = WorkspaceTier.fromPlan(workspace.plan)
        val activeCount = workflowExecutionRepository.countActiveByWorkspace(item.workspaceId)

        if (activeCount >= tier.maxConcurrentWorkflows) {
            // At capacity - release back to pending for later retry
            logger.info {
                "Workspace ${item.workspaceId} at capacity ($activeCount/${tier.maxConcurrentWorkflows}), " +
                        "releasing item ${item.id} back to queue"
            }
            executionQueueService.releaseToPending(item)
            return
        }

        // Capacity available - dispatch to Temporal
        dispatchToTemporal(item)
    }

    /**
     * Dispatch queue item to Temporal.
     */
    private fun dispatchToTemporal(item: ExecutionQueueEntity) {
        logger.info { "Dispatching queue item ${item.id} for workflow ${item.workflowDefinitionId}" }

        // Fetch workflow definition and version
        val workflowDefinition = workflowDefinitionRepository.findById(item.workflowDefinitionId).orElse(null)
        if (workflowDefinition == null) {
            executionQueueService.markFailed(item, "Workflow definition not found")
            return
        }

        val workflowVersion = workflowDefinitionVersionRepository
            .findByWorkflowDefinitionIdAndVersionNumber(
                item.workflowDefinitionId,
                workflowDefinition.versionNumber
            )
        if (workflowVersion == null) {
            executionQueueService.markFailed(item, "Workflow version not found")
            return
        }

        // Extract node IDs from workflow graph reference
        val nodeIds = workflowVersion.workflow.nodeIds.toList()

        val executionEntity = WorkflowExecutionEntity(
            workspaceId = item.workspaceId,
            workflowDefinitionId = item.workflowDefinitionId,
            workflowVersionId = workflowVersion.id!!,

            status = WorkflowStatus.RUNNING,
            triggerType = WorkflowTriggerType.FUNCTION,
            startedAt = ZonedDateTime.now(),
            completedAt = null,
            durationMs = 0,
            error = emptyMap<String, Any>(),
            input = item.input,
            output = null
        )

        val savedExecution = workflowExecutionRepository.save(executionEntity)
        val savedExecutionId = savedExecution.id!!

        // Start Temporal workflow
        try {
            val workflowStub = workflowClient.newWorkflowStub(
                WorkflowOrchestration::class.java,
                WorkflowOptions.newBuilder()
                    .setWorkflowId("execution-$savedExecutionId")
                    .setTaskQueue(TemporalWorkerConfiguration.WORKFLOWS_DEFAULT_QUEUE)
                    .build()
            )

            val workflowInput = WorkflowExecutionInput(
                workflowDefinitionId = item.workflowDefinitionId,
                nodeIds = nodeIds,
                workspaceId = item.workspaceId
            )

            WorkflowClient.start { workflowStub.execute(workflowInput) }

            // Mark queue item as dispatched
            executionQueueService.markDispatched(item)

            logger.info { "Dispatched execution $savedExecutionId for queue item ${item.id}" }

        } catch (e: Exception) {
            logger.error(e) { "Failed to start Temporal workflow for queue item ${item.id}" }

            // Update execution record to FAILED
            val failedExecution = savedExecution.copy(
                status = WorkflowStatus.FAILED,
                completedAt = ZonedDateTime.now(),
                error = mapOf("message" to (e.message ?: "Unknown error"))
            )
            workflowExecutionRepository.save(failedExecution)

            throw e // Re-throw to trigger error handling
        }
    }

    /**
     * Handle processing error for a queue item.
     */
    private fun handleProcessingError(item: ExecutionQueueEntity, error: Exception) {
        logger.error(error) { "Error processing queue item ${item.id}" }

        if (item.attemptCount >= MAX_ATTEMPTS) {
            // Max attempts reached - mark as failed
            executionQueueService.markFailed(item, error.message ?: "Unknown error")
        } else {
            // Release for retry
            executionQueueService.releaseToPending(item)
        }
    }

    /**
     * Recover stale claimed items.
     *
     * Runs less frequently than main queue processing.
     * Recovers items stuck in CLAIMED state after dispatcher crash.
     */
    @Scheduled(fixedDelay = 60000) // Every minute
    @SchedulerLock(
        name = "recoverStaleQueueItems",
        lockAtMostFor = "2m",
        lockAtLeastFor = "30s"
    )
    fun recoverStaleItems() {
        val recovered = executionQueueService.recoverStaleItems(5)
        if (recovered > 0) {
            logger.info { "Recovered $recovered stale queue items" }
        }
    }
}
