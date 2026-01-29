package riven.core.service.workflow

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import riven.core.models.workflow.node.config.validation.ConfigValidationError

class ConfigValidationServiceTest {

    private lateinit var templateParserService: TemplateParserService
    private lateinit var configValidationService: ConfigValidationService

    @BeforeEach
    fun setUp() {
        templateParserService = TemplateParserService()
        configValidationService = ConfigValidationService(templateParserService)
    }

    @Nested
    inner class ValidateTemplateOrUuid {

        @Test
        fun `returns empty for valid UUID`() {
            val errors = configValidationService.validateTemplateOrUuid(
                "550e8400-e29b-41d4-a716-446655440000",
                "entityTypeId"
            )
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns empty for valid template`() {
            val errors = configValidationService.validateTemplateOrUuid(
                "{{ steps.fetch.output.id }}",
                "entityTypeId"
            )
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns error for null value`() {
            val errors = configValidationService.validateTemplateOrUuid(null, "entityTypeId")
            assertEquals(1, errors.size)
            assertEquals("entityTypeId", errors[0].field)
            assertTrue(errors[0].message.contains("null"))
        }

        @Test
        fun `returns error for blank value`() {
            val errors = configValidationService.validateTemplateOrUuid("  ", "entityTypeId")
            assertEquals(1, errors.size)
            assertEquals("entityTypeId", errors[0].field)
            assertTrue(errors[0].message.contains("blank"))
        }

        @Test
        fun `returns error for invalid UUID and non-template`() {
            val errors = configValidationService.validateTemplateOrUuid(
                "not-a-uuid",
                "entityTypeId"
            )
            assertEquals(1, errors.size)
            assertEquals("entityTypeId", errors[0].field)
            assertTrue(errors[0].message.contains("UUID"))
        }

        @Test
        fun `returns error for malformed template`() {
            val errors = configValidationService.validateTemplateOrUuid(
                "{{ }}",
                "entityTypeId"
            )
            assertEquals(1, errors.size)
            assertEquals("entityTypeId", errors[0].field)
            assertTrue(errors[0].message.contains("Empty template"))
        }
    }

    @Nested
    inner class ValidateTemplateSyntax {

        @Test
        fun `returns empty for valid simple template`() {
            val errors = configValidationService.validateTemplateSyntax(
                "{{ steps.node.output }}",
                "field"
            )
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns empty for valid nested template`() {
            val errors = configValidationService.validateTemplateSyntax(
                "{{ steps.node.output.nested.value }}",
                "field"
            )
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns empty for embedded template`() {
            val errors = configValidationService.validateTemplateSyntax(
                "Hello {{ steps.user.output.name }}!",
                "field"
            )
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns empty for static value (not a template)`() {
            val errors = configValidationService.validateTemplateSyntax(
                "static value",
                "field"
            )
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns error for empty template`() {
            val errors = configValidationService.validateTemplateSyntax("{{ }}", "field")
            assertEquals(1, errors.size)
            assertEquals("field", errors[0].field)
        }

        @Test
        fun `returns error for empty path segment`() {
            val errors = configValidationService.validateTemplateSyntax(
                "{{ steps..output }}",
                "field"
            )
            assertEquals(1, errors.size)
            assertEquals("field", errors[0].field)
        }
    }

    @Nested
    inner class ValidateRequiredString {

        @Test
        fun `returns empty for non-null non-blank value`() {
            val errors = configValidationService.validateRequiredString("value", "field")
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns error for null when required`() {
            val errors = configValidationService.validateRequiredString(null, "field", required = true)
            assertEquals(1, errors.size)
            assertEquals("field", errors[0].field)
        }

        @Test
        fun `returns error for blank when required`() {
            val errors = configValidationService.validateRequiredString("  ", "field", required = true)
            assertEquals(1, errors.size)
        }

        @Test
        fun `returns empty for null when not required`() {
            val errors = configValidationService.validateRequiredString(null, "field", required = false)
            assertTrue(errors.isEmpty())
        }
    }

    @Nested
    inner class ValidateTemplateMap {

        @Test
        fun `returns empty for null map`() {
            val errors = configValidationService.validateTemplateMap(null, "payload")
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns empty for empty map`() {
            val errors = configValidationService.validateTemplateMap(emptyMap(), "payload")
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns empty for valid static values`() {
            val errors = configValidationService.validateTemplateMap(
                mapOf("name" to "John", "email" to "john@example.com"),
                "payload"
            )
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns empty for valid templates`() {
            val errors = configValidationService.validateTemplateMap(
                mapOf(
                    "name" to "{{ steps.fetch.output.name }}",
                    "email" to "{{ steps.fetch.output.email }}"
                ),
                "payload"
            )
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns error for invalid template in map`() {
            val errors = configValidationService.validateTemplateMap(
                mapOf(
                    "name" to "{{ steps.fetch.output.name }}",
                    "email" to "{{ }}"  // Invalid
                ),
                "payload"
            )
            assertEquals(1, errors.size)
            assertEquals("payload.email", errors[0].field)
        }

        @Test
        fun `returns multiple errors for multiple invalid templates`() {
            val errors = configValidationService.validateTemplateMap(
                mapOf(
                    "name" to "{{ }}",
                    "email" to "{{ steps..output }}"
                ),
                "payload"
            )
            assertEquals(2, errors.size)
            assertTrue(errors.any { it.field == "payload.name" })
            assertTrue(errors.any { it.field == "payload.email" })
        }
    }

    @Nested
    inner class ValidateOptionalDuration {

        @Test
        fun `returns empty for null`() {
            val errors = configValidationService.validateOptionalDuration(null, "timeout")
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns empty for positive seconds`() {
            val errors = configValidationService.validateOptionalDuration(30L, "timeout")
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns empty for zero seconds`() {
            val errors = configValidationService.validateOptionalDuration(0L, "timeout")
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns error for negative seconds`() {
            val errors = configValidationService.validateOptionalDuration(-5L, "timeout")
            assertEquals(1, errors.size)
            assertTrue(errors[0].message.contains("negative"))
        }

        @Test
        fun `returns empty for valid ISO-8601 duration`() {
            val errors = configValidationService.validateOptionalDuration("PT30S", "timeout")
            assertTrue(errors.isEmpty())
        }

        @Test
        fun `returns error for invalid ISO-8601 duration`() {
            val errors = configValidationService.validateOptionalDuration("invalid", "timeout")
            assertEquals(1, errors.size)
            assertTrue(errors[0].message.contains("duration"))
        }
    }

    @Nested
    inner class Combine {

        @Test
        fun `returns valid for empty lists`() {
            val result = configValidationService.combine(emptyList(), emptyList())
            assertTrue(result.isValid)
        }

        @Test
        fun `combines errors from multiple lists`() {
            val errors1 = listOf(
                ConfigValidationError("field1", "error1")
            )
            val errors2 = listOf(
                ConfigValidationError("field2", "error2")
            )

            val result = configValidationService.combine(errors1, errors2)
            assertFalse(result.isValid)
            assertEquals(2, result.errors.size)
        }
    }
}
