package riven.core.service.integration.sync

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import riven.core.configuration.workflow.TemporalWorkerConfiguration
import riven.core.configuration.workflow.WorkflowRetryConfigurationProperties

/**
 * Unit tests for [IntegrationSyncWorkflowImpl].
 *
 * Verifies the activity stub configuration (retry policy, timeouts) and infrastructure
 * constants that the sync webhook dispatch depends on.
 *
 * Note on Temporal execution tests: [TestWorkflowEnvironment] has known hanging issues
 * in this project when running alongside Spring Boot test infrastructure (documented in
 * WorkflowExecutionIntegrationTest). Activity orchestration sequencing is verified at the
 * integration test level in Plan 02 when the full activity implementations are available.
 */
class IntegrationSyncWorkflowImplTest {

    // ------ Queue and Retry Configuration Tests ------

    @Nested
    inner class QueueAndRetryConfigTests {

        /**
         * Contract test: NangoWebhookService dispatch and TemporalWorkerConfiguration
         * registration both reference this constant. If it changes, both must be updated.
         */
        @Test
        fun `INTEGRATION_SYNC_QUEUE constant equals integration dot sync`() {
            assertEquals("integration.sync", TemporalWorkerConfiguration.INTEGRATION_SYNC_QUEUE)
        }

        /**
         * Verifies the integration-sync retry config has correct production defaults.
         * The 30s initial interval and 3 attempts match the plan spec (SYNC-08).
         */
        @Test
        fun `retryProperties integrationSync defaults — 3 attempts 30s initial 2x backoff 120s max`() {
            val props = WorkflowRetryConfigurationProperties()

            assertEquals(3, props.integrationSync.maxAttempts)
            assertEquals(30L, props.integrationSync.initialIntervalSeconds)
            assertEquals(2.0, props.integrationSync.backoffCoefficient)
            assertEquals(120L, props.integrationSync.maxIntervalSeconds)
        }
    }

    // ------ Workflow Interface Contract Tests ------

    @Nested
    inner class WorkflowContractTests {

        /**
         * Verifies that IntegrationSyncWorkflowImpl can be instantiated with a RetryConfig.
         * This is the factory pattern used by TemporalWorkerConfiguration — if the constructor
         * signature changes, the worker registration in TemporalWorkerConfiguration must also change.
         */
        @Test
        fun `IntegrationSyncWorkflowImpl can be instantiated with RetryConfig`() {
            val retryConfig = WorkflowRetryConfigurationProperties().integrationSync
            // If this compiles and runs, the constructor contract is satisfied.
            // The worker factory pattern in TemporalWorkerConfiguration calls this exact lambda.
            IntegrationSyncWorkflowImpl(retryConfig)
        }
    }
}
