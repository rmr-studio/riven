package riven.core.configuration.insights

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.WebClient
import riven.core.configuration.properties.AnthropicConfigurationProperties

/**
 * Wires the Anthropic Messages API WebClient used by the Insights chat demo.
 *
 * The bean is pre-configured with the base URL, API key header, and Anthropic API
 * version header so the client can stay focused on request/response shape only.
 */
@Configuration
@EnableConfigurationProperties(AnthropicConfigurationProperties::class)
class InsightsWebClientConfig {

    @Bean
    @Qualifier("anthropicWebClient")
    fun anthropicWebClient(
        builder: WebClient.Builder,
        properties: AnthropicConfigurationProperties,
    ): WebClient {
        val apiKey = properties.apiKey
        val base = builder
            .baseUrl(properties.baseUrl)
            .defaultHeader("anthropic-version", properties.apiVersion)
            .defaultHeader("Content-Type", "application/json")
            .codecs { it.defaultCodecs().maxInMemorySize(4 * 1024 * 1024) }
        if (apiKey.isNotBlank()) {
            base.defaultHeader("x-api-key", apiKey)
        }
        return base.build()
    }
}
