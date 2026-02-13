package riven.core.service.integration

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import reactor.util.retry.Retry
import riven.core.configuration.properties.NangoConfigurationProperties
import riven.core.exceptions.NangoApiException
import riven.core.exceptions.RateLimitException
import riven.core.models.integration.NangoConnection
import riven.core.models.integration.NangoConnectionList
import riven.core.models.integration.NangoErrorResponse
import java.time.Duration

/**
 * Spring WebClient-based HTTP client for Nango REST API.
 *
 * Provides retry logic and rate limit handling for OAuth flows and connection management.
 */
@Service
class NangoClientWrapper(
    @Qualifier("nangoWebClient") private val webClient: WebClient,
    private val nangoProperties: NangoConfigurationProperties
) {
    private val logger = KotlinLogging.logger {}

    private fun ensureConfigured() {
        require(nangoProperties.secretKey.isNotBlank()) {
            "Nango secret key is not configured. Set NANGO_SECRET_KEY environment variable."
        }
    }

    /**
     * Get a specific connection by provider config key and connection ID.
     *
     * @param providerConfigKey The provider configuration key (e.g., "hubspot")
     * @param connectionId The unique connection ID
     * @return The Nango connection details
     * @throws NangoApiException if the API returns an error
     * @throws RateLimitException if rate limited
     */
    fun getConnection(providerConfigKey: String, connectionId: String): NangoConnection {
        ensureConfigured()
        return webClient.get()
            .uri("/connection/{connectionId}?provider_config_key={providerConfigKey}",
                connectionId, providerConfigKey)
            .retrieve()
            .onStatus({ it.value() == 429 }) { response ->
                val retryAfter = response.headers().asHttpHeaders()
                    .getFirst("Retry-After")?.toLongOrNull() ?: 60
                Mono.error(RateLimitException("Nango rate limited, retry after $retryAfter seconds"))
            }
            .onStatus({ it.is4xxClientError || it.is5xxServerError }) { response ->
                response.bodyToMono(NangoErrorResponse::class.java)
                    .flatMap { error ->
                        Mono.error(NangoApiException(
                            "Nango API error: ${error.error ?: "Unknown"}",
                            response.statusCode().value()
                        ))
                    }
            }
            .bodyToMono(NangoConnection::class.java)
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                .filter { it is RateLimitException }
                .doBeforeRetry { logger.warn { "Retrying Nango API call: ${it.failure().message}" } }
            )
            .block() ?: throw NangoApiException("Empty response from Nango API", 500)
    }

    /**
     * List all connections.
     *
     * @return List of all Nango connections
     */
    fun listConnections(): NangoConnectionList {
        ensureConfigured()
        return webClient.get()
            .uri("/connections")
            .retrieve()
            .onStatus({ it.value() == 429 }) { response ->
                val retryAfter = response.headers().asHttpHeaders()
                    .getFirst("Retry-After")?.toLongOrNull() ?: 60
                Mono.error(RateLimitException("Nango rate limited, retry after $retryAfter seconds"))
            }
            .onStatus({ it.is4xxClientError || it.is5xxServerError }) { response ->
                response.bodyToMono(NangoErrorResponse::class.java)
                    .flatMap { error ->
                        Mono.error(NangoApiException(
                            "Nango API error: ${error.error ?: "Unknown"}",
                            response.statusCode().value()
                        ))
                    }
            }
            .bodyToMono(NangoConnectionList::class.java)
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                .filter { it is RateLimitException }
                .doBeforeRetry { logger.warn { "Retrying Nango API call: ${it.failure().message}" } }
            )
            .block() ?: NangoConnectionList()
    }

    /**
     * Delete a connection by provider config key and connection ID.
     *
     * @param providerConfigKey The provider configuration key
     * @param connectionId The unique connection ID
     */
    fun deleteConnection(providerConfigKey: String, connectionId: String) {
        ensureConfigured()
        webClient.delete()
            .uri("/connection/{connectionId}?provider_config_key={providerConfigKey}",
                connectionId, providerConfigKey)
            .retrieve()
            .onStatus({ it.value() == 429 }) { response ->
                val retryAfter = response.headers().asHttpHeaders()
                    .getFirst("Retry-After")?.toLongOrNull() ?: 60
                Mono.error(RateLimitException("Nango rate limited, retry after $retryAfter seconds"))
            }
            .onStatus({ it.is4xxClientError || it.is5xxServerError }) { response ->
                response.bodyToMono(NangoErrorResponse::class.java)
                    .flatMap { error ->
                        Mono.error(NangoApiException(
                            "Nango API error: ${error.error ?: "Unknown"}",
                            response.statusCode().value()
                        ))
                    }
            }
            .toBodilessEntity()
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                .filter { it is RateLimitException }
                .doBeforeRetry { logger.warn { "Retrying Nango API call: ${it.failure().message}" } }
            )
            .block()
    }
}
