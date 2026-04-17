package riven.core.service.insights

import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.kotlin.mock
import java.util.UUID

class AnswerSanitizerTest {

    private val extractor = InlineCitationExtractor()
    private val logger: KLogger = mock()
    private val sanitizer = AnswerSanitizer(extractor, logger)

    @Test
    fun `strips bold but leaves inline entity links untouched`() {
        val id = UUID.randomUUID()
        val pool = mapOf(id to "customer")
        val raw = "**foo** [bar](entity:$id)"
        val out = sanitizer.sanitize(raw, pool)
        assertEquals("foo [bar](entity:$id)", out.content)
        assertEquals(1, out.citations.size)
    }

    @Test
    fun `strips headings blockquotes list markers and code fences`() {
        val raw = """
            # Title
            > a quote
            - bullet one
            * bullet two
            1. ordered one
            ```
            code block contents
            ```
            inline `code` here
        """.trimIndent()
        val out = sanitizer.sanitize(raw, emptyMap())
        assertFalse(out.content.contains("# Title"))
        assertFalse(out.content.contains("> a quote"))
        assertFalse(out.content.lineSequence().any { it.startsWith("- ") || it.startsWith("* ") })
        assertFalse(out.content.contains("```"))
        assertTrue(out.content.contains("Title"))
        assertTrue(out.content.contains("a quote"))
        assertTrue(out.content.contains("bullet one"))
        assertTrue(out.content.contains("ordered one"))
        assertTrue(out.content.contains("code block contents"))
        assertTrue(out.content.contains("code here"))
    }

    @Test
    fun `strips italics with non-word boundaries but leaves snake_case identifiers alone`() {
        val raw = "This is *italic* but snake_case_name stays."
        val out = sanitizer.sanitize(raw, emptyMap())
        assertTrue(out.content.contains("italic"))
        assertFalse(out.content.contains("*italic*"))
        assertTrue(out.content.contains("snake_case_name"))
    }

    @Test
    fun `drops citations whose entityId is not in the pool and replaces with bare label`() {
        val poolId = UUID.randomUUID()
        val orphanId = UUID.randomUUID()
        val pool = mapOf(poolId to "customer")
        val raw = "Known [Sarah](entity:$poolId) and unknown [Marcus](entity:$orphanId)."
        val out = sanitizer.sanitize(raw, pool)

        assertTrue(out.content.contains("[Sarah](entity:$poolId)"))
        assertFalse(out.content.contains("entity:$orphanId"))
        assertTrue(out.content.contains("Marcus"))
        assertEquals(1, out.citations.size)
        assertEquals(poolId, out.citations.first().entityId)
    }

    @Test
    fun `deduplicates citations by entityId keeping first occurrence`() {
        val id = UUID.randomUUID()
        val pool = mapOf(id to "customer")
        val raw = "First [Foo](entity:$id) and again [Foo Two](entity:$id)."
        val out = sanitizer.sanitize(raw, pool)
        assertEquals(1, out.citations.size)
        assertEquals("Foo", out.citations.first().label)
    }

    @Test
    fun `populates entityType from the pool map`() {
        val customerId = UUID.randomUUID()
        val clusterId = UUID.randomUUID()
        val pool = mapOf(
            customerId to "customer",
            clusterId to "identity_cluster",
        )
        val raw = "[Sarah](entity:$customerId) is in [Power Users](entity:$clusterId)."
        val out = sanitizer.sanitize(raw, pool)
        val byId = out.citations.associateBy { it.entityId }
        assertEquals("customer", byId[customerId]?.entityType)
        assertEquals("identity_cluster", byId[clusterId]?.entityType)
    }

    @Test
    fun `empty answer returns empty content and empty citations`() {
        val out = sanitizer.sanitize("", emptyMap())
        assertEquals("", out.content)
        assertTrue(out.citations.isEmpty())
    }

    @Test
    fun `prose without inline citations yields empty citations and preserves content`() {
        val raw = "Just some plain text with no citations at all."
        val out = sanitizer.sanitize(raw, emptyMap())
        assertEquals(raw, out.content)
        assertTrue(out.citations.isEmpty())
    }

    @Test
    fun `bold immediately adjacent to an inline link does not corrupt the link`() {
        val id = UUID.randomUUID()
        val pool = mapOf(id to "customer")
        val raw = "**Important:** see [Foo](entity:$id) now."
        val out = sanitizer.sanitize(raw, pool)
        assertTrue(out.content.contains("[Foo](entity:$id)"))
        assertFalse(out.content.contains("**"))
        assertEquals(1, out.citations.size)
    }
}
