package riven.core.service.insights

import org.springframework.stereotype.Component
import riven.core.enums.insights.InsightsMessageRole
import riven.core.enums.knowledge.DefinitionCategory
import riven.core.models.insights.InsightsMessageModel
import riven.core.models.knowledge.WorkspaceBusinessDefinition
import riven.core.service.insights.llm.dto.ChatMessage

/**
 * Builds the system prompt and message history sent to the Anthropic chat client.
 *
 * The system prompt is fully self-contained (role description + workspace business definitions +
 * citation contract + pool summary) so it can be marked cacheable on every turn.
 */
@Component
class PromptBuilder {

    companion object {
        /** Per-definition character cap before truncation (at a word boundary). */
        internal const val DEFINITION_CHAR_CAP = 400

        /** Total character cap for the definitions block (~3000 tokens). */
        internal const val DEFINITIONS_BLOCK_CHAR_CAP = 12_000

        /**
         * Priority order when the full list would exceed the block cap. METRIC and SEGMENT
         * carry the highest LLM-answer signal, so they are preserved first.
         */
        private val CATEGORY_PRIORITY: Map<DefinitionCategory, Int> = mapOf(
            DefinitionCategory.METRIC to 0,
            DefinitionCategory.SEGMENT to 1,
            DefinitionCategory.LIFECYCLE_STAGE to 2,
            DefinitionCategory.STATUS to 3,
            DefinitionCategory.CUSTOM to 4,
        )
    }

    /**
     * Builds the cached system prompt. Embeds the workspace business definitions (inside the
     * cached prefix so the LLM frames answers using workspace terminology) followed by the
     * demo entity pool summary so it can cite real entity IDs without inventing them.
     */
    fun buildSystem(poolSummary: String, definitions: List<WorkspaceBusinessDefinition>): String {
        val definitionsBlock = renderDefinitionsBlock(definitions)
        return """
            You are Insights, an analytics assistant embedded in the Riven product.
            Your job is to help product, growth, and customer-success operators answer
            cross-domain questions about their customers, feature usage, and cohorts.

            ## Workspace business definitions
            These definitions reflect how this workspace talks about its business. When the user's question uses any of these terms, interpret and compute according to the definition. When reporting cohorts or metrics, reference the defining term explicitly (e.g. "Using your definition of 'valuable customer'...").
            $definitionsBlock

            ## Output format
            Respond with a single JSON object matching this schema:
            {"answer": string}

            The `answer` field is plain text with ONE allowed piece of markup: inline entity
            links of the form [Human-readable label](entity:<uuid>). Use these EVERY time you
            mention an entity from the pool. Example:

              "Customers such as [Sarah Chen](entity:7c2f3a80-0000-0000-0000-000000000001)
               and [Marcus Okafor](entity:a1b2c3d4-0000-0000-0000-000000000002) show ..."

            Rules:
            - Use ONLY entity ids that appear in the pool above. Never invent ids. If you don't
              have a relevant entity, write the answer without citing.
            - Do NOT use any other markdown: no **bold**, no _italics_, no # headings, no bullet
              lists, no > blockquotes, no code fences, no tables, no inline `code`.
            - Keep sentences plain. Paragraph breaks via blank lines are fine. Aim for 2-5 short
              paragraphs.
            - When an entity is a cluster, still cite it inline:
              [Power Users](entity:<cluster-uuid>). Use the entity_type "identity_cluster" rows
              from the pool for cluster ids.
            - First mention of each entity should be an inline link. Subsequent mentions of the
              same entity within the same paragraph may drop the link and use the plain label.
            - Do not fabricate metrics beyond what the definitions and pool support.
            - If the pool is empty, answer without citations and say so.

            ===== ENTITY POOL =====
            $poolSummary
            ===== END ENTITY POOL =====
        """.trimIndent()
    }

    /**
     * Builds the messages array for the API call: prior session history + the new user turn.
     * History is included verbatim in chronological order; the new user message is appended last.
     */
    fun buildMessages(history: List<InsightsMessageModel>, userMessage: String): List<ChatMessage> {
        val historic = history.map { msg ->
            val role = when (msg.role) {
                InsightsMessageRole.USER -> ChatMessage.ROLE_USER
                InsightsMessageRole.ASSISTANT -> ChatMessage.ROLE_ASSISTANT
            }
            ChatMessage(role = role, content = msg.content)
        }
        return historic + ChatMessage(role = ChatMessage.ROLE_USER, content = userMessage)
    }

    // ------ Private helpers ------

    /**
     * Renders the definitions block with per-definition truncation and a total block cap.
     * Always emits the block — if the list is empty, emits an explicit placeholder so the
     * cache key remains structurally stable.
     */
    private fun renderDefinitionsBlock(definitions: List<WorkspaceBusinessDefinition>): String {
        if (definitions.isEmpty()) {
            return "- (No custom business definitions configured.)"
        }

        // First pass: try the caller-supplied order. If it fits under the cap, keep it;
        // otherwise fall back to priority ordering (METRIC/SEGMENT first, then alpha by term).
        val firstAttempt = renderUpToCap(definitions)
        val picked = if (firstAttempt.includedAll) {
            firstAttempt
        } else {
            val prioritized = definitions.sortedWith(
                compareBy(
                    { CATEGORY_PRIORITY[it.category] ?: Int.MAX_VALUE },
                    { it.term.lowercase() },
                )
            )
            renderUpToCap(prioritized)
        }

        val rendered = picked.lines.toMutableList()
        val omitted = definitions.size - picked.lines.size
        if (omitted > 0) {
            rendered += "- ($omitted additional definitions omitted for brevity)"
        }
        return rendered.joinToString("\n")
    }

    private data class RenderResult(
        val lines: List<String>,
        val totalLength: Int,
        val includedAll: Boolean,
    )

    private fun renderUpToCap(defs: List<WorkspaceBusinessDefinition>): RenderResult {
        val lines = mutableListOf<String>()
        var total = 0
        for (def in defs) {
            val line = renderDefinitionLine(def)
            // +1 accounts for the newline joining lines.
            val projected = total + line.length + if (lines.isEmpty()) 0 else 1
            if (projected > DEFINITIONS_BLOCK_CHAR_CAP) {
                return RenderResult(lines, total, includedAll = false)
            }
            lines += line
            total = projected
        }
        return RenderResult(lines, total, includedAll = true)
    }

    private fun renderDefinitionLine(def: WorkspaceBusinessDefinition): String {
        val truncated = truncateAtWordBoundary(def.definition, DEFINITION_CHAR_CAP)
        return "- ${def.term} (${def.category.name}): $truncated"
    }

    private fun truncateAtWordBoundary(text: String, cap: Int): String {
        if (text.length <= cap) return text
        // Reserve one char for the ellipsis so the returned string is <= cap.
        val budget = cap - 1
        val slice = text.substring(0, budget)
        val lastSpace = slice.lastIndexOf(' ')
        val cutAt = if (lastSpace > 0) lastSpace else budget
        return slice.substring(0, cutAt).trimEnd() + "…"
    }
}
