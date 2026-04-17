package riven.core.configuration.properties

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Configuration for the Anthropic Messages API client used by the Insights chat demo.
 *
 * Properties are defined under `riven.insights.anthropic.*` in `application.yml`.
 * `apiKey` is intentionally optional (default empty) so non-insights tests and dev
 * environments without an Anthropic key continue to start successfully.
 */
@ConfigurationProperties(prefix = "riven.insights.anthropic")
data class AnthropicConfigurationProperties(
    val apiKey: String = "",
    val model: String = "claude-sonnet-4-5-20250929",
    val maxTokens: Int = 1024,
    val baseUrl: String = "https://api.anthropic.com",
    val apiVersion: String = "2023-06-01",
    val requestTimeoutSeconds: Long = 60,
    /** Overrides [model] for the demo-pool augmentation planner. Empty falls back to [model]. */
    val plannerModel: String = "",
    /** Max output tokens for the demo-pool augmentation planner — lower than [maxTokens] because the planner returns a compact JSON plan. */
    val plannerMaxTokens: Int = 512,
)
