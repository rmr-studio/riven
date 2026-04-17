package riven.core.models.insights

/**
 * LLM token usage breakdown for a single chat completion.
 */
data class TokenUsage(
    val inputTokens: Int = 0,
    val outputTokens: Int = 0,
    val cacheReadTokens: Int = 0,
    val cacheWriteTokens: Int = 0,
)
