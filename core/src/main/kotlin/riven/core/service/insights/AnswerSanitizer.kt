package riven.core.service.insights

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.stereotype.Component
import riven.core.models.insights.CitationRef
import java.util.UUID

/**
 * Sanitizes the assistant's raw answer text into:
 * 1. A clean `content` string with stray markdown stripped (everything except inline entity links).
 * 2. A `citations` list derived from inline `[label](entity:<uuid>)` markers, validated against
 *    the seeded entity pool. Unknown citations are replaced with their bare label so the prose
 *    still reads naturally.
 *
 * This is the single source of truth for `citations[]` — the LLM is no longer trusted to emit a
 * separate JSON array.
 */
@Component
class AnswerSanitizer(
    private val extractor: InlineCitationExtractor,
    private val logger: KLogger,
) {

    data class SanitizedAnswer(val content: String, val citations: List<CitationRef>)

    /**
     * @param rawAnswer the raw assistant text from the LLM
     * @param poolEntityIdToType map of pool entityId -> entityType label (e.g. "customer",
     *        "feature_usage_event", "identity_cluster"). Citations whose entityId is not
     *        present in this map are dropped and replaced with their bare label.
     */
    fun sanitize(rawAnswer: String, poolEntityIdToType: Map<UUID, String>): SanitizedAnswer {
        if (rawAnswer.isBlank()) return SanitizedAnswer(content = rawAnswer, citations = emptyList())

        // 1. Strip stray markdown OUTSIDE of inline entity links so [label](entity:uuid) survives.
        val stripped = stripStrayMarkdown(rawAnswer)

        // 2. Re-extract inline citations against the cleaned text.
        val extracted = extractor.extract(stripped)

        // 3. Walk the text, rewriting valid markers to ResolvedCitation tokens (kept as-is) and
        //    invalid markers to their bare label. Build the citation list from survivors,
        //    deduplicated by entityId (first occurrence wins).
        val builder = StringBuilder()
        var cursor = 0
        val seen = mutableSetOf<UUID>()
        val citations = mutableListOf<CitationRef>()
        var droppedCount = 0

        for (cite in extracted) {
            if (cite.range.first > cursor) {
                builder.append(stripped, cursor, cite.range.first)
            }
            val type = poolEntityIdToType[cite.entityId]
            if (type == null) {
                // Unknown citation — replace with bare label.
                builder.append(cite.label)
                droppedCount++
            } else {
                // Keep marker verbatim so the frontend can render the pill.
                builder.append(stripped, cite.range.first, cite.range.last + 1)
                if (seen.add(cite.entityId)) {
                    citations += CitationRef(entityId = cite.entityId, entityType = type, label = cite.label)
                }
            }
            cursor = cite.range.last + 1
        }
        if (cursor < stripped.length) builder.append(stripped, cursor, stripped.length)

        if (droppedCount > 0) {
            logger.debug { "Dropped $droppedCount inline citation(s) not in pool — replaced with bare labels" }
        }
        return SanitizedAnswer(content = builder.toString(), citations = citations)
    }

    // ------ Private helpers ------

    /**
     * Defensively strip markdown that the model shouldn't have emitted, while preserving
     * inline entity-link spans. Strategy: identify link spans first, then run the strippers
     * on the inter-span segments only.
     */
    private fun stripStrayMarkdown(text: String): String {
        val linkSpans = extractor.extract(text).map { it.range }
        if (linkSpans.isEmpty()) return stripSegment(text)

        val out = StringBuilder()
        var cursor = 0
        for (span in linkSpans) {
            if (span.first > cursor) {
                out.append(stripSegment(text.substring(cursor, span.first)))
            }
            out.append(text, span.first, span.last + 1)
            cursor = span.last + 1
        }
        if (cursor < text.length) out.append(stripSegment(text.substring(cursor)))
        return out.toString()
    }

    private fun stripSegment(segment: String): String {
        var s = segment

        // Fenced code blocks: drop only the fences, keep inner content.
        s = FENCE_REGEX.replace(s) { it.groupValues[1] }

        // Inline code: `text` -> text (skip if it would catch a triple-backtick, already handled above).
        s = INLINE_CODE_REGEX.replace(s) { it.groupValues[1] }

        // Bold: **text** and __text__
        s = BOLD_STAR_REGEX.replace(s) { it.groupValues[1] }
        s = BOLD_UNDER_REGEX.replace(s) { it.groupValues[1] }

        // Italic: *text* and _text_ (only when clearly paired, not adjacent to word chars to avoid
        // mangling things like snake_case identifiers).
        s = ITALIC_STAR_REGEX.replace(s) { m ->
            m.groupValues[1] + m.groupValues[2] + m.groupValues[3]
        }
        s = ITALIC_UNDER_REGEX.replace(s) { m ->
            m.groupValues[1] + m.groupValues[2] + m.groupValues[3]
        }

        // Per-line leading markers: headings, blockquotes, list bullets, ordered list numbers.
        s = s.lineSequence().joinToString("\n") { line ->
            line
                .replace(HEADING_PREFIX, "")
                .replace(BLOCKQUOTE_PREFIX, "")
                .replace(BULLET_PREFIX, "")
                .replace(ORDERED_PREFIX, "")
        }

        return s
    }

    companion object {
        private val FENCE_REGEX = Regex("""```[a-zA-Z0-9_+-]*\n?([\s\S]*?)```""")
        private val INLINE_CODE_REGEX = Regex("""`([^`\n]+)`""")
        private val BOLD_STAR_REGEX = Regex("""\*\*([^*\n]+)\*\*""")
        private val BOLD_UNDER_REGEX = Regex("""__([^_\n]+)__""")

        // For italics, require the surrounding chars to be non-word so we don't break snake_case
        // or multiplication/glob expressions. Captures the leading boundary char, the inner
        // content, and the trailing boundary char so the replacement can preserve them.
        private val ITALIC_STAR_REGEX = Regex("""(^|[^\w*])\*([^*\n]+)\*([^\w*]|$)""")
        private val ITALIC_UNDER_REGEX = Regex("""(^|[^\w_])_([^_\n]+)_([^\w_]|$)""")

        private val HEADING_PREFIX = Regex("""^#{1,6}\s+""")
        private val BLOCKQUOTE_PREFIX = Regex("""^>\s+""")
        private val BULLET_PREFIX = Regex("""^\s*[-*]\s+""")
        private val ORDERED_PREFIX = Regex("""^\s*\d+\.\s+""")
    }
}
