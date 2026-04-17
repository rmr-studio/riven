package riven.core.service.insights

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import riven.core.enums.insights.InsightsMessageRole
import riven.core.enums.knowledge.DefinitionCategory
import riven.core.models.insights.InsightsMessageModel
import riven.core.service.insights.llm.dto.ChatMessage
import riven.core.service.util.factory.knowledge.BusinessDefinitionFactory
import java.util.UUID

class PromptBuilderTest {

    private val builder = PromptBuilder()

    @Test
    fun `system prompt embeds the pool summary verbatim`() {
        val summary = "abc-123 | type=customer | label=Foo"
        val system = builder.buildSystem(summary, emptyList())
        assertTrue(system.contains(summary))
        // Inline-citation contract is documented.
        assertTrue(system.contains("[Human-readable label](entity:<uuid>)"))
        assertTrue(system.contains("entity:<uuid>"))
    }

    @Test
    fun `system prompt instructs inline entity-link citation format and forbids other markdown`() {
        val system = builder.buildSystem("pool", emptyList())
        // Inline citation example
        assertTrue(system.contains("[Human-readable label](entity:<uuid>)"))
        // Explicit forbids
        assertTrue(system.contains("no **bold**"))
        assertTrue(system.contains("no # headings"))
        assertTrue(system.contains("no bullet"))
        assertTrue(system.contains("no code fences"))
        // Schema is now answer-only
        assertTrue(system.contains("""{"answer": string}"""))
    }

    @Test
    fun `definitions section header is always emitted even when list is empty`() {
        val system = builder.buildSystem("pool", emptyList())
        assertTrue(system.contains("## Workspace business definitions"))
        assertTrue(system.contains("(No custom business definitions configured.)"))
    }

    @Test
    fun `definitions render as term category colon definition in supplied order`() {
        val first = BusinessDefinitionFactory.createDefinitionModel(
            term = "valuable customer",
            definition = "LTV > \$1k AND active in 30 days",
            category = DefinitionCategory.SEGMENT,
        )
        val second = BusinessDefinitionFactory.createDefinitionModel(
            term = "retention",
            definition = "active 90 days after first purchase",
            category = DefinitionCategory.METRIC,
        )

        val system = builder.buildSystem("pool", listOf(first, second))

        val firstIdx = system.indexOf("- valuable customer (SEGMENT): LTV > \$1k AND active in 30 days")
        val secondIdx = system.indexOf("- retention (METRIC): active 90 days after first purchase")
        assertTrue(firstIdx >= 0, "first definition should render verbatim")
        assertTrue(secondIdx >= 0, "second definition should render verbatim")
        assertTrue(firstIdx < secondIdx, "supplied order should be preserved when under cap")
    }

    @Test
    fun `long definition is truncated to 400 chars at a word boundary with ellipsis`() {
        val longText = "word ".repeat(120).trim() // ~600 chars, word-spaced.
        val def = BusinessDefinitionFactory.createDefinitionModel(
            term = "longone",
            definition = longText,
        )

        val system = builder.buildSystem("pool", listOf(def))

        val prefix = "- longone (METRIC): "
        val lineStart = system.indexOf(prefix)
        assertTrue(lineStart >= 0)
        val lineEnd = system.indexOf('\n', lineStart).let { if (it == -1) system.length else it }
        val renderedDefinition = system.substring(lineStart + prefix.length, lineEnd)
        assertTrue(renderedDefinition.length <= 400, "truncated to <= 400 chars, got ${renderedDefinition.length}")
        assertTrue(renderedDefinition.endsWith("…"), "expected trailing ellipsis, got: $renderedDefinition")
        // Everything before the ellipsis should be whole words (not a mid-word cut).
        val body = renderedDefinition.dropLast(1).trimEnd()
        assertTrue(body.isEmpty() || !body.last().isWhitespace())
    }

    @Test
    fun `block stays under 12000 chars and reports omissions when exceeded`() {
        val defs = (1..50).map { i ->
            BusinessDefinitionFactory.createDefinitionModel(
                term = "term-%03d".format(i),
                // 400 chars worth so the block cap matters.
                definition = "x".repeat(400),
                category = if (i % 2 == 0) DefinitionCategory.METRIC else DefinitionCategory.CUSTOM,
            )
        }

        val system = builder.buildSystem("pool", defs)

        val blockStart = system.indexOf("## Workspace business definitions")
        val blockEnd = system.indexOf("## Output format")
        assertTrue(blockStart >= 0 && blockEnd > blockStart)
        val block = system.substring(blockStart, blockEnd)
        assertTrue(block.length < 12_000 + 500, "definitions block ballooned: ${block.length}")
        assertTrue(
            Regex("""- \(\d+ additional definitions omitted for brevity\)""").containsMatchIn(block),
            "expected an omission notice line",
        )
    }

    @Test
    fun `definitions block precedes the entity pool block`() {
        val def = BusinessDefinitionFactory.createDefinitionModel(term = "foo")
        val system = builder.buildSystem("POOL_MARKER", listOf(def))
        val defsIdx = system.indexOf("## Workspace business definitions")
        val poolIdx = system.indexOf("===== ENTITY POOL =====")
        assertTrue(defsIdx >= 0 && poolIdx > defsIdx, "definitions must precede the pool")
    }

    @Test
    fun `messages preserve history order and append the new user message last`() {
        val sessionId = UUID.randomUUID()
        val history = listOf(
            msg(sessionId, InsightsMessageRole.USER, "first"),
            msg(sessionId, InsightsMessageRole.ASSISTANT, "second"),
        )
        val out = builder.buildMessages(history, "third")

        assertEquals(3, out.size)
        assertEquals(ChatMessage.ROLE_USER, out[0].role)
        assertEquals("first", out[0].content)
        assertEquals(ChatMessage.ROLE_ASSISTANT, out[1].role)
        assertEquals("second", out[1].content)
        assertEquals(ChatMessage.ROLE_USER, out[2].role)
        assertEquals("third", out[2].content)
    }

    private fun msg(sid: UUID, role: InsightsMessageRole, content: String) = InsightsMessageModel(
        id = UUID.randomUUID(),
        sessionId = sid,
        role = role,
        content = content,
        citations = emptyList(),
        tokenUsage = null,
        createdAt = null,
        createdBy = null,
    )
}
