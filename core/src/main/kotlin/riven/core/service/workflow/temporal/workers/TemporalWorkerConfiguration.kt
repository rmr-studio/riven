package riven.core.service.workflow.temporal.workers

import io.github.oshai.kotlinlogging.KLogger
import io.github.oshai.kotlinlogging.KotlinLogging
import io.temporal.client.WorkflowClient
import io.temporal.serviceclient.WorkflowServiceStubs
import io.temporal.worker.WorkerFactory
import jakarta.annotation.PreDestroy
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import riven.core.service.workflow.temporal.activities.WorkflowNodeActivitiesImpl
import riven.core.service.workflow.temporal.workflows.WorkflowExecutionWorkflowImpl


/**
 * Spring configuration for Temporal workers.
 *
 * This configuration:
 * 1. Creates a WorkflowClient from existing WorkflowServiceStubs bean
 * 2. Creates a WorkerFactory
 * 3. Creates a Worker for task queue "workflow-execution-queue"
 * 4. Registers workflow implementations (WorkflowExecutionWorkflowImpl)
 * 5. Registers activity implementations (WorkflowNodeActivitiesImpl Spring bean)
 * 6. Starts the worker factory
 * 7. Provides graceful shutdown via @PreDestroy
 *
 * CRITICAL: Task queue name "workflow-execution-queue" MUST match the queue name
 * used when starting workflows in WorkflowExecutionService. Mismatch causes
 * "No worker found" errors.
 *
 * @property workflowServiceStubs Existing bean from TemporalEngineConfiguration
 * @property activities Autowired Spring bean with injected dependencies
 */
@Configuration
class TemporalWorkerConfiguration(
    private val workflowServiceStubs: WorkflowServiceStubs,
    private val activities: WorkflowNodeActivitiesImpl,
    private val logger: KLogger
) {

    companion object {
        /**
         * Task queue name for workflow execution.
         *
         * MUST match the queue name used in WorkflowOptions when starting workflows.
         */
        const val WORKFLOW_EXECUTION_TASK_QUEUE = "workflow-execution-queue"
    }

    private lateinit var workerFactoryInstance: WorkerFactory

    /**
     * Creates and starts the WorkerFactory with registered workflows and activities.
     *
     * This bean:
     * - Creates WorkflowClient from service stubs
     * - Creates WorkerFactory
     * - Registers WorkflowExecutionWorkflowImpl (no-arg constructor required by Temporal)
     * - Registers WorkflowNodeActivitiesImpl Spring bean (with dependencies)
     * - Starts worker factory (non-blocking - workers poll in background)
     *
     * @return Started WorkerFactory instance
     */
    @Bean
    fun workerFactory(): WorkerFactory {
        logger.info { "Initializing Temporal WorkerFactory" }

        // Create WorkflowClient from service stubs
        val client = WorkflowClient.newInstance(workflowServiceStubs)

        // Create WorkerFactory
        val factory = WorkerFactory.newInstance(client)

        // Create worker for specific task queue
        val worker = factory.newWorker(WORKFLOW_EXECUTION_TASK_QUEUE)

        // Register workflow implementations
        // Note: Workflow impl must have no-arg constructor (Temporal instantiates it)
        worker.registerWorkflowImplementationTypes(
            WorkflowExecutionWorkflowImpl::class.java
        )
        logger.info { "Registered workflow: WorkflowExecutionWorkflow" }

        // Register activity implementations
        // Note: Passing Spring bean instance enables dependency injection
        worker.registerActivitiesImplementations(activities)
        logger.info { "Registered activities: WorkflowNodeActivities" }

        // Start workers (non-blocking - workers poll Temporal Service in background)
        factory.start()
        logger.info { "Temporal WorkerFactory started, listening on task queue: $WORKFLOW_EXECUTION_TASK_QUEUE" }

        // Store instance for shutdown
        workerFactoryInstance = factory

        return factory
    }

    /**
     * Gracefully shutdown workers when application stops.
     *
     * This method is called by Spring during application shutdown.
     * It ensures:
     * - In-flight workflows/activities complete gracefully
     * - No new work is accepted
     * - Resources are released properly
     */
    @PreDestroy
    fun shutdown() {
        logger.info { "Shutting down Temporal WorkerFactory" }
        if (::workerFactoryInstance.isInitialized) {
            workerFactoryInstance.shutdown()
            logger.info { "Temporal WorkerFactory shutdown complete" }
        }
    }
}
