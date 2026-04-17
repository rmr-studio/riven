package riven.core.service.insights

import org.springframework.stereotype.Component
import java.util.UUID

/**
 * Extracts inline entity-link citations of the form `[label](entity:<uuid>)` from prose.
 *
 * The model is instructed (see [PromptBuilder]) to emit citations in this single canonical
 * form. The server is the source of truth for the resulting [riven.core.models.insights.CitationRef]
 * list — it parses these markers, validates the UUIDs against the seeded pool, and rewrites
 * unknown markers back to plain text in [AnswerSanitizer].
 */
@Component
class InlineCitationExtractor {

    /**
     * Matches `[label](entity:<uuid>)` where:
     * - label is 1..120 chars, no newlines, no closing bracket
     * - uuid is the canonical 36-char hyphenated form (case-insensitive)
     */
    private val pattern = Regex("""\[([^\]\n]{1,120})\]\(entity:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)""")

    data class ExtractedCitation(
        val entityId: UUID,
        val label: String,
        val range: IntRange,
    )

    fun extract(text: String): List<ExtractedCitation> {
        if (text.isEmpty()) return emptyList()
        return pattern.findAll(text).mapNotNull { match ->
            val label = match.groupValues[1].trim()
            val uuidRaw = match.groupValues[2]
            val parsed = runCatching { UUID.fromString(uuidRaw) }.getOrNull() ?: return@mapNotNull null
            if (label.isBlank()) return@mapNotNull null
            ExtractedCitation(entityId = parsed, label = label, range = match.range)
        }.toList()
    }
}
