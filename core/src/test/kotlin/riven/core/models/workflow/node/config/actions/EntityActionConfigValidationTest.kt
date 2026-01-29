package riven.core.models.workflow.node.config.actions

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import riven.core.service.workflow.ConfigValidationService
import riven.core.service.workflow.TemplateParserService

class EntityActionConfigValidationTest {

    private lateinit var templateParserService: TemplateParserService
    private lateinit var configValidationService: ConfigValidationService

    @BeforeEach
    fun setUp() {
        templateParserService = TemplateParserService()
        configValidationService = ConfigValidationService(templateParserService)
    }

    @Nested
    inner class WorkflowCreateEntityActionConfigValidation {

        @Test
        fun `valid config with static UUID passes validation`() {
            val config = WorkflowCreateEntityActionConfig(
                entityTypeId = "550e8400-e29b-41d4-a716-446655440000",
                payload = mapOf("name" to "Test Entity")
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `valid config with template entityTypeId passes validation`() {
            val config = WorkflowCreateEntityActionConfig(
                entityTypeId = "{{ steps.fetch.output.typeId }}",
                payload = mapOf("name" to "{{ steps.data.output.name }}")
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `invalid entityTypeId fails validation`() {
            val config = WorkflowCreateEntityActionConfig(
                entityTypeId = "not-a-uuid",
                payload = emptyMap()
            )
            val result = config.validate(configValidationService)
            assertFalse(result.isValid)
            assertTrue(result.errors.any { it.field == "entityTypeId" })
        }

        @Test
        fun `invalid template in payload fails validation`() {
            val config = WorkflowCreateEntityActionConfig(
                entityTypeId = "550e8400-e29b-41d4-a716-446655440000",
                payload = mapOf("name" to "{{ }}")  // Invalid empty template
            )
            val result = config.validate(configValidationService)
            assertFalse(result.isValid)
            assertTrue(result.errors.any { it.field == "payload.name" })
        }

        @Test
        fun `negative timeout fails validation`() {
            val config = WorkflowCreateEntityActionConfig(
                entityTypeId = "550e8400-e29b-41d4-a716-446655440000",
                timeoutSeconds = -5
            )
            val result = config.validate(configValidationService)
            assertFalse(result.isValid)
            assertTrue(result.errors.any { it.field == "timeoutSeconds" })
        }
    }

    @Nested
    inner class WorkflowUpdateEntityActionConfigValidation {

        @Test
        fun `valid config with static UUID passes validation`() {
            val config = WorkflowUpdateEntityActionConfig(
                entityId = "550e8400-e29b-41d4-a716-446655440000",
                payload = mapOf("status" to "active")
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `valid config with template entityId passes validation`() {
            val config = WorkflowUpdateEntityActionConfig(
                entityId = "{{ steps.find.output.entityId }}",
                payload = mapOf("name" to "{{ steps.data.output.name }}")
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `invalid entityId fails validation`() {
            val config = WorkflowUpdateEntityActionConfig(
                entityId = "not-a-uuid-or-template",
                payload = emptyMap()
            )
            val result = config.validate(configValidationService)
            assertFalse(result.isValid)
            assertTrue(result.errors.any { it.field == "entityId" })
        }
    }

    @Nested
    inner class WorkflowDeleteEntityActionConfigValidation {

        @Test
        fun `valid config with static UUID passes validation`() {
            val config = WorkflowDeleteEntityActionConfig(
                entityId = "550e8400-e29b-41d4-a716-446655440000"
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `valid config with template passes validation`() {
            val config = WorkflowDeleteEntityActionConfig(
                entityId = "{{ steps.find_expired.output.entityId }}"
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `invalid entityId fails validation`() {
            val config = WorkflowDeleteEntityActionConfig(
                entityId = "invalid"
            )
            val result = config.validate(configValidationService)
            assertFalse(result.isValid)
            assertTrue(result.errors.any { it.field == "entityId" })
        }
    }

    @Nested
    inner class WorkflowQueryEntityActionConfigValidation {

        @Test
        fun `valid config with static UUID passes validation`() {
            val config = WorkflowQueryEntityActionConfig(
                entityId = "550e8400-e29b-41d4-a716-446655440000"
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `valid config with template passes validation`() {
            val config = WorkflowQueryEntityActionConfig(
                entityId = "{{ steps.trigger.output.entityId }}"
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `blank entityId fails validation`() {
            val config = WorkflowQueryEntityActionConfig(
                entityId = "   "
            )
            val result = config.validate(configValidationService)
            assertFalse(result.isValid)
            assertTrue(result.errors.any { it.field == "entityId" })
        }
    }

    @Nested
    inner class WorkflowHttpRequestActionConfigValidation {

        @Test
        fun `valid GET request passes validation`() {
            val config = WorkflowHttpRequestActionConfig(
                url = "https://api.example.com/users",
                method = "GET"
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `valid POST request with body passes validation`() {
            val config = WorkflowHttpRequestActionConfig(
                url = "https://api.example.com/users",
                method = "POST",
                headers = mapOf("Content-Type" to "application/json"),
                body = mapOf("name" to "{{ steps.user.output.name }}")
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `template URL passes validation`() {
            val config = WorkflowHttpRequestActionConfig(
                url = "{{ steps.config.output.apiUrl }}/users",
                method = "GET"
            )
            val result = config.validate(configValidationService)
            assertTrue(result.isValid, "Expected valid config: ${result.errors}")
        }

        @Test
        fun `invalid HTTP method fails validation`() {
            val config = WorkflowHttpRequestActionConfig(
                url = "https://api.example.com",
                method = "INVALID"
            )
            val result = config.validate(configValidationService)
            assertFalse(result.isValid)
            assertTrue(result.errors.any { it.field == "method" })
        }

        @Test
        fun `blank URL fails validation`() {
            val config = WorkflowHttpRequestActionConfig(
                url = "",
                method = "GET"
            )
            val result = config.validate(configValidationService)
            assertFalse(result.isValid)
            assertTrue(result.errors.any { it.field == "url" })
        }

        @Test
        fun `invalid template in headers fails validation`() {
            val config = WorkflowHttpRequestActionConfig(
                url = "https://api.example.com",
                method = "GET",
                headers = mapOf("Authorization" to "{{ }}")  // Invalid
            )
            val result = config.validate(configValidationService)
            assertFalse(result.isValid)
            assertTrue(result.errors.any { it.field == "headers.Authorization" })
        }
    }
}
