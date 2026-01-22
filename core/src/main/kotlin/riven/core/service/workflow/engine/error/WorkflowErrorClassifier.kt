package riven.core.service.workflow.engine.error

import org.springframework.web.reactive.function.client.WebClientResponseException
import riven.core.enums.workflow.WorkflowErrorType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.exceptions.SchemaValidationException

/**
 * Utility object for classifying workflow execution errors.
 *
 * Error classification determines retry behavior:
 * - Non-retryable errors fail immediately (4xx, validation, security, control flow)
 * - Retryable errors trigger Temporal retry with exponential backoff (5xx, network, db)
 *
 * This is an object (singleton) to allow direct function calls without Spring injection,
 * making it easy to test and use from both Spring beans and non-Spring contexts.
 */
object WorkflowErrorClassifier {

    /**
     * Classifies an exception into a WorkflowErrorType.
     *
     * Classification rules:
     * - HTTP 4xx -> HTTP_CLIENT_ERROR (non-retryable: client error, data won't change)
     * - HTTP 5xx -> HTTP_SERVER_ERROR (retryable: server issue, transient)
     * - IllegalArgumentException, SchemaValidationException -> VALIDATION_ERROR (non-retryable)
     * - SecurityException -> SECURITY_ERROR (non-retryable)
     * - CONTROL_FLOW node + any error -> CONTROL_FLOW_ERROR (non-retryable: deterministic)
     * - All other exceptions -> EXECUTION_ERROR (retryable: assume transient)
     *
     * @param e The exception to classify
     * @param nodeType The type of node that threw the exception (affects classification for CONTROL_FLOW)
     * @return The classified error type
     */
    fun classifyError(e: Exception, nodeType: WorkflowNodeType): WorkflowErrorType {
        return when {
            // HTTP 4xx - client error, non-retryable
            e is WebClientResponseException && e.statusCode.is4xxClientError ->
                WorkflowErrorType.HTTP_CLIENT_ERROR

            // HTTP 5xx - server error, retryable
            e is WebClientResponseException && e.statusCode.is5xxServerError ->
                WorkflowErrorType.HTTP_SERVER_ERROR

            // Validation errors - non-retryable
            e is IllegalArgumentException || e is SchemaValidationException ->
                WorkflowErrorType.VALIDATION_ERROR

            // Security errors - non-retryable
            e is SecurityException ->
                WorkflowErrorType.SECURITY_ERROR

            // CONTROL_FLOW nodes - deterministic evaluation, non-retryable
            nodeType == WorkflowNodeType.CONTROL_FLOW ->
                WorkflowErrorType.CONTROL_FLOW_ERROR

            // Default - assume transient, retryable
            else ->
                WorkflowErrorType.EXECUTION_ERROR
        }
    }

    /**
     * Classifies an exception and returns both the error type and a formatted message.
     *
     * @param e The exception to classify
     * @param nodeType The type of node that threw the exception
     * @return Pair of (WorkflowErrorType, formatted message)
     */
    fun classifyErrorWithMessage(e: Exception, nodeType: WorkflowNodeType): Pair<WorkflowErrorType, String> {
        val errorType = classifyError(e, nodeType)
        val message = when (errorType) {
            WorkflowErrorType.HTTP_CLIENT_ERROR -> {
                val status = (e as WebClientResponseException).statusCode.value()
                "HTTP $status: ${e.message}"
            }
            WorkflowErrorType.HTTP_SERVER_ERROR -> {
                val status = (e as WebClientResponseException).statusCode.value()
                "HTTP $status: ${e.message}"
            }
            WorkflowErrorType.VALIDATION_ERROR -> "Validation failed: ${e.message}"
            WorkflowErrorType.SECURITY_ERROR -> "Security error: ${e.message}"
            WorkflowErrorType.CONTROL_FLOW_ERROR -> "Control flow failed: ${e.message}"
            else -> "Execution error: ${e.message}"
        }
        return errorType to message
    }
}
