package riven.core.service.insights.llm.dto

import com.fasterxml.jackson.annotation.JsonInclude

/**
 * DTOs for the Anthropic Messages API (https://docs.anthropic.com/claude/reference/messages_post).
 *
 * Only the fields actually used by the Insights demo client are modelled.
 */

@JsonInclude(JsonInclude.Include.NON_NULL)
data class AnthropicSystemBlock(
    val type: String = "text",
    val text: String,
    val cache_control: AnthropicCacheControl? = null,
)

data class AnthropicCacheControl(
    val type: String = "ephemeral",
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class AnthropicMessage(
    val role: String,
    val content: String,
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class AnthropicMessagesRequest(
    val model: String,
    val max_tokens: Int,
    val system: List<AnthropicSystemBlock>,
    val messages: List<AnthropicMessage>,
)

data class AnthropicContentBlock(
    val type: String? = null,
    val text: String? = null,
)

data class AnthropicUsage(
    val input_tokens: Int = 0,
    val output_tokens: Int = 0,
    val cache_read_input_tokens: Int = 0,
    val cache_creation_input_tokens: Int = 0,
)

data class AnthropicMessagesResponse(
    val id: String? = null,
    val type: String? = null,
    val role: String? = null,
    val model: String? = null,
    val content: List<AnthropicContentBlock> = emptyList(),
    val stop_reason: String? = null,
    val usage: AnthropicUsage = AnthropicUsage(),
)

/** Internal chat message used by [riven.core.service.insights.llm.AnthropicChatClient]. */
data class ChatMessage(val role: String, val content: String) {
    companion object {
        const val ROLE_USER = "user"
        const val ROLE_ASSISTANT = "assistant"
    }
}

/** Result envelope returned by [riven.core.service.insights.llm.AnthropicChatClient]. */
data class ChatCompletionResult(
    val text: String,
    val usage: riven.core.models.insights.TokenUsage,
)
