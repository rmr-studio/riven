package riven.core.service.insights

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import riven.core.exceptions.LlmResponseParseException
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule

class InsightsResponseParserTest {

    private val mapper = JsonMapper.builder().addModule(KotlinModule.Builder().build()).build()
    private val parser = InsightsResponseParser(mapper)

    @Test
    fun `parses well-formed JSON response`() {
        val raw = """{"answer":"hello"}"""

        val parsed = parser.parse(raw)

        assertEquals("hello", parsed.answer)
    }

    @Test
    fun `prepends opening brace when missing (assistant prefill case)`() {
        val raw = """"answer":"hi"}"""
        val parsed = parser.parse(raw)
        assertEquals("hi", parsed.answer)
    }

    @Test
    fun `silently ignores a model-emitted citations field for backward tolerance`() {
        val raw = """{"answer":"hello","citations":[{"entityId":"not-a-uuid","entityType":"c","label":"L"}]}"""
        val parsed = parser.parse(raw)
        assertEquals("hello", parsed.answer)
    }

    @Test
    fun `throws on missing answer field`() {
        val raw = """{"citations":[]}"""
        assertThrows<LlmResponseParseException> { parser.parse(raw) }
    }

    @Test
    fun `throws on malformed JSON`() {
        val raw = """{"answer":"foo","citations":["""
        assertThrows<LlmResponseParseException> { parser.parse(raw) }
    }
}
