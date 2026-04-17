package riven.core.service.insights

import org.springframework.stereotype.Component
import riven.core.exceptions.LlmResponseParseException
import tools.jackson.core.json.JsonReadFeature
import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.json.JsonMapper

/**
 * Parses the structured `{answer}` envelope returned by [riven.core.service.insights.llm.AnthropicChatClient].
 *
 * Citations are no longer emitted by the model — they are derived server-side by parsing inline
 * `[label](entity:<uuid>)` markers from the answer text (see [InlineCitationExtractor] and
 * [AnswerSanitizer]). For backward tolerance, a model-emitted `citations` field is silently
 * ignored if present.
 *
 * Tolerates LLM-JSON quirks:
 * 1. The leading `{` is supplied by assistant-prefill — if missing, prepend it.
 * 2. The model sometimes appends extra prose after the JSON object — trim to the last `}`.
 * 3. The model sometimes wraps the JSON in a ```json fenced block — strip the fences.
 * 4. The model occasionally emits real newlines / tabs inside string values rather than `\n` /
 *    `\t` escapes. Use a dedicated lenient parser with ALLOW_UNESCAPED_CONTROL_CHARS so we accept
 *    those rather than 502-ing the demo.
 */
@Component
class InsightsResponseParser(@Suppress("unused") objectMapper: ObjectMapper) {

    // LLM responses get a dedicated lenient mapper so we don't weaken the shared ObjectMapper
    // contract for the rest of the app.
    private val lenientMapper: ObjectMapper = JsonMapper.builder()
        .enable(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS)
        .build()

    data class ParsedResponse(val answer: String)

    fun parse(rawText: String): ParsedResponse {
        val normalized = normalize(rawText)
        try {
            val node = lenientMapper.readTree(normalized)
            val answer = node.get("answer")?.asString()
                ?: throw LlmResponseParseException("Missing 'answer' field in LLM response")
            return ParsedResponse(answer = answer)
        } catch (e: LlmResponseParseException) {
            throw e
        } catch (e: Exception) {
            throw LlmResponseParseException("Failed to parse LLM response as JSON: ${e.message}", e)
        }
    }

    private fun normalize(rawText: String): String {
        var text = rawText.trim()
        // Strip ```json ... ``` or ``` ... ``` fences the model sometimes adds.
        if (text.startsWith("```")) {
            text = text.removePrefix("```json").removePrefix("```").trim()
            if (text.endsWith("```")) text = text.removeSuffix("```").trim()
        }
        val withOpen = if (text.startsWith("{")) text else "{$text"
        val lastBrace = withOpen.lastIndexOf('}')
        return if (lastBrace >= 0) withOpen.substring(0, lastBrace + 1) else withOpen
    }
}
