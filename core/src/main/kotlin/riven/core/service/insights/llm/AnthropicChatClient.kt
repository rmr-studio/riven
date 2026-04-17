package riven.core.service.insights.llm

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import riven.core.configuration.properties.AnthropicConfigurationProperties
import riven.core.exceptions.LlmCallException
import riven.core.models.insights.TokenUsage
import riven.core.service.insights.llm.dto.AnthropicCacheControl
import riven.core.service.insights.llm.dto.AnthropicMessage
import riven.core.service.insights.llm.dto.AnthropicMessagesRequest
import riven.core.service.insights.llm.dto.AnthropicMessagesResponse
import riven.core.service.insights.llm.dto.AnthropicSystemBlock
import riven.core.service.insights.llm.dto.ChatCompletionResult
import riven.core.service.insights.llm.dto.ChatMessage
import java.time.Duration

/**
 * Thin Anthropic Messages API client used by the Insights demo.
 *
 * - Caches the system prompt via `cache_control: { type: ephemeral }`.
 * - Forces a JSON-shaped answer by appending an assistant-prefill message containing `{`,
 *   matching Anthropic's documented prompt-prefilling pattern.
 * - Surfaces a [LlmCallException] (mapped to HTTP 502) on any non-2xx or transport failure.
 */
@Component
open class AnthropicChatClient(
    @Qualifier("anthropicWebClient") private val webClient: WebClient,
    private val properties: AnthropicConfigurationProperties,
    private val logger: KLogger,
) {

    /**
     * Sends a chat completion request to Anthropic.
     *
     * @param system The system prompt — sent as a single cached block.
     * @param messages The conversation turns. The client will append an assistant prefill of `{` to
     *  bias the model toward producing valid JSON.
     */
    open fun sendMessage(system: String, messages: List<ChatMessage>): ChatCompletionResult =
        sendMessage(system, messages, modelOverride = null, maxTokensOverride = null)

    /**
     * Extended variant allowing callers (e.g. the augmentation planner) to override the model
     * and max-tokens budget used for the request. Null values fall back to the configured defaults.
     */
    open fun sendMessage(
        system: String,
        messages: List<ChatMessage>,
        modelOverride: String?,
        maxTokensOverride: Int?,
    ): ChatCompletionResult {
        val request = buildRequest(system, messages, modelOverride, maxTokensOverride)

        val response = try {
            webClient.post()
                .uri("/v1/messages")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AnthropicMessagesResponse::class.java)
                .timeout(Duration.ofSeconds(properties.requestTimeoutSeconds))
                .block()
        } catch (e: WebClientResponseException) {
            logger.warn { "Anthropic call failed: ${e.statusCode} ${e.responseBodyAsString}" }
            throw LlmCallException("Anthropic call failed with status ${e.statusCode}", e)
        } catch (e: Exception) {
            logger.warn(e) { "Anthropic call failed" }
            throw LlmCallException("Anthropic call failed: ${e.message}", e)
        }

        checkNotNull(response) { "Anthropic returned an empty response" }

        val rawText = response.content
            .filter { it.type == "text" || it.type == null }
            .mapNotNull { it.text }
            .joinToString("")

        // The prefilled `{` is stripped from the response by Anthropic — re-prepend it so callers
        // get a complete JSON document to parse.
        val text = if (rawText.startsWith("{")) rawText else "{$rawText"

        return ChatCompletionResult(
            text = text,
            usage = TokenUsage(
                inputTokens = response.usage.input_tokens,
                outputTokens = response.usage.output_tokens,
                cacheReadTokens = response.usage.cache_read_input_tokens,
                cacheWriteTokens = response.usage.cache_creation_input_tokens,
            ),
        )
    }

    private fun buildRequest(
        system: String,
        messages: List<ChatMessage>,
        modelOverride: String?,
        maxTokensOverride: Int?,
    ): AnthropicMessagesRequest {
        val systemBlock = AnthropicSystemBlock(
            text = system,
            cache_control = AnthropicCacheControl(type = "ephemeral"),
        )

        val withPrefill = messages + ChatMessage(role = ChatMessage.ROLE_ASSISTANT, content = "{")

        return AnthropicMessagesRequest(
            model = modelOverride?.takeIf { it.isNotBlank() } ?: properties.model,
            max_tokens = maxTokensOverride ?: properties.maxTokens,
            system = listOf(systemBlock),
            messages = withPrefill.map { AnthropicMessage(role = it.role, content = it.content) },
        )
    }
}
