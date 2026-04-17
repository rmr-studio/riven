package riven.core.service.insights

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.util.UUID

class InlineCitationExtractorTest {

    private val extractor = InlineCitationExtractor()

    @Test
    fun `extracts a single citation`() {
        val id = UUID.randomUUID()
        val text = "Hello [Sarah](entity:$id) world."
        val out = extractor.extract(text)
        assertEquals(1, out.size)
        assertEquals(id, out.first().entityId)
        assertEquals("Sarah", out.first().label)
    }

    @Test
    fun `extracts multiple citations preserving order`() {
        val a = UUID.randomUUID()
        val b = UUID.randomUUID()
        val text = "[A](entity:$a) and [B](entity:$b)"
        val out = extractor.extract(text)
        assertEquals(2, out.size)
        assertEquals(a, out[0].entityId)
        assertEquals(b, out[1].entityId)
    }

    @Test
    fun `ignores malformed markers`() {
        val cases = listOf(
            "[foo](entity:)",
            "[foo](entity:not-a-uuid)",
            "[foo](http://example.com)",
            "[](entity:${UUID.randomUUID()})",
            "[foo]()",
        )
        cases.forEach { text ->
            assertTrue(extractor.extract(text).isEmpty(), "expected no extractions for: $text")
        }
    }

    @Test
    fun `returns empty list for plain text`() {
        assertTrue(extractor.extract("just plain prose with no markers").isEmpty())
        assertTrue(extractor.extract("").isEmpty())
    }

    @Test
    fun `range positions point at the marker substring`() {
        val id = UUID.randomUUID()
        val text = "x [Foo](entity:$id) y"
        val out = extractor.extract(text)
        assertEquals(1, out.size)
        val expected = "[Foo](entity:$id)"
        assertEquals(expected, text.substring(out.first().range))
    }

    @Test
    fun `tolerates nested brackets safely by matching innermost label`() {
        val id = UUID.randomUUID()
        // Outer "[..." would-be label contains another '[', so the regex finds the inner one.
        val text = "see [Inner](entity:$id) here"
        val out = extractor.extract(text)
        assertEquals(1, out.size)
        assertEquals("Inner", out.first().label)
    }
}
