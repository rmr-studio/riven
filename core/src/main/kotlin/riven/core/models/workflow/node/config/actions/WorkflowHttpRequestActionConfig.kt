package riven.core.models.workflow.node.config.actions

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.github.oshai.kotlinlogging.KotlinLogging
import io.swagger.v3.oas.annotations.media.Schema
import org.springframework.http.HttpMethod
import riven.core.enums.workflow.WorkflowActionType
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.workflow.engine.environment.WorkflowExecutionContext
import riven.core.models.workflow.node.NodeServiceProvider
import riven.core.models.workflow.node.service
import org.springframework.web.reactive.function.client.WebClient
import riven.core.models.workflow.node.config.WorkflowActionConfig
import java.net.URI

private val logger = KotlinLogging.logger {}

/**
 * Configuration for HTTP_REQUEST action nodes.
 *
 * ## Configuration
 *
 * Required inputs:
 * - `url`: String URL to request
 * - `method`: String HTTP method (GET, POST, PUT, DELETE)
 *
 * Optional inputs:
 * - `headers`: Map<String, String> of HTTP headers
 * - `body`: Map<String, Any?> request body (for POST/PUT)
 *
 * ## Output
 *
 * Returns map with:
 * - `statusCode`: Int HTTP status code
 * - `headers`: Map<String, String> response headers
 * - `body`: String response body
 * - `url`: String requested URL
 * - `method`: String HTTP method used
 *
 * ## Example Configuration
 *
 * ```json
 * {
 *   "url": "https://api.example.com/users",
 *   "method": "POST",
 *   "headers": {
 *     "Content-Type": "application/json",
 *     "X-API-Key": "{{ steps.get_api_key.output.key }}"
 *   },
 *   "body": {
 *     "email": "{{ steps.fetch_lead.output.email }}",
 *     "name": "{{ steps.fetch_lead.output.name }}"
 *   }
 * }
 * ```
 *
 * ## Security
 *
 * - SSRF validation prevents requests to localhost, private IPs, and metadata endpoints
 * - Sensitive headers (Authorization, API keys) are not logged
 */
@Schema(
    name = "WorkflowHttpRequestActionConfig",
    description = "Configuration for HTTP_REQUEST action nodes."
)
@JsonTypeName("workflow_http_request_action")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class WorkflowHttpRequestActionConfig(
    override val version: Int,
    val name: String,
    val config: Map<String, Any?>
) : WorkflowActionConfig {

    override val type: WorkflowNodeType
        get() = WorkflowNodeType.ACTION

    override val subType: WorkflowActionType
        get() = WorkflowActionType.HTTP_REQUEST

    override fun execute(
        context: WorkflowExecutionContext,
        inputs: Map<String, Any?>,
        services: NodeServiceProvider
    ): Map<String, Any?> {
        // Extract inputs (already resolved)
        val url = inputs["url"] as String
        val method = inputs["method"] as String // GET, POST, PUT, DELETE
        val headers = inputs["headers"] as? Map<*, *> ?: emptyMap<Any, Any>()
        val body = inputs["body"] as? Map<String, Any?>

        // Validate URL (prevent SSRF)
        validateUrl(url)

        // Get WebClient on-demand
        val webClient = services.service<WebClient>()

        // Execute HTTP request (external service call)
        val response = webClient
            .method(HttpMethod.valueOf(method))
            .uri(url)
            .headers { h ->
                headers.forEach { (key, value) ->
                    if (key is String && value is String) {
                        if (!isSensitiveHeader(key)) {
                            h.set(key, value)
                        }
                    }
                }
            }
            .bodyValue(body ?: emptyMap<String, Any?>())
            .retrieve()
            .toEntity(String::class.java)
            .block() ?: throw RuntimeException("HTTP request returned null")

        // Log without sensitive data
        logger.info { "HTTP_REQUEST: $method $url -> ${response.statusCode}" }

        // Clear output contract
        return mapOf(
            "statusCode" to response.statusCode.value(),
            "headers" to response.headers.toSingleValueMap(),
            "body" to response.body,
            "url" to url,
            "method" to method
        )
    }

    /**
     * Validates URL to prevent SSRF attacks.
     * Blocks localhost, private IPs, metadata endpoints.
     */
    private fun validateUrl(url: String) {
        val uri = URI(url)
        val host = uri.host?.lowercase() ?: throw IllegalArgumentException("Invalid URL: no host")

        // Block localhost
        if (host in listOf("localhost", "127.0.0.1", "::1")) {
            throw SecurityException("HTTP_REQUEST cannot target localhost")
        }

        // Block private IP ranges (basic check)
        if (host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("172.")) {
            throw SecurityException("HTTP_REQUEST cannot target private IP ranges")
        }

        // Block cloud metadata endpoints
        if (host == "169.254.169.254") {
            throw SecurityException("HTTP_REQUEST cannot target cloud metadata endpoints")
        }
    }

    /**
     * Identifies sensitive headers that should not be logged.
     */
    private fun isSensitiveHeader(headerName: String): Boolean {
        return headerName.lowercase() in listOf(
            "authorization",
            "x-api-key",
            "api-key",
            "cookie",
            "set-cookie"
        )
    }
}
