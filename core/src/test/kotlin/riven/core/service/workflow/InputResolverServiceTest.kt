package riven.core.service.workflow

import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.configuration.auth.WorkspaceSecurity
import riven.core.models.workflow.environment.NodeExecutionData
import riven.core.models.workflow.environment.WorkflowExecutionContext
import riven.core.service.auth.AuthTokenService
import java.time.Instant
import java.util.*
import kotlin.test.assertEquals
import kotlin.test.assertNull

@SpringBootTest(
    classes = [
        AuthTokenService::class,
        WorkspaceSecurity::class,
        InputResolverServiceTest.TestConfig::class,
        TemplateParserService::class,
        InputResolverService::class
    ]
)
class InputResolverServiceTest {

    private lateinit var context: WorkflowExecutionContext

    @Configuration
    class TestConfig

    @Autowired
    private lateinit var templateParserService: TemplateParserService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    private lateinit var inputResolverService: InputResolverService

    @BeforeEach
    fun setup() {
        context = WorkflowExecutionContext(
            workflowExecutionId = UUID.randomUUID(),
            workspaceId = UUID.randomUUID(),
            metadata = emptyMap(),
            dataRegistry = mutableMapOf()
        )
    }

    // ========== Simple Template Resolution Tests ==========

    @Test
    fun `resolve simple template from registry`() {
        // Populate registry
        context.dataRegistry["fetch_leads"] = NodeExecutionData(
            nodeId = UUID.randomUUID(),
            nodeName = "fetch_leads",
            status = "COMPLETED",
            output = mapOf("count" to 42),
            error = null,
            executedAt = Instant.now()
        )

        val result = inputResolverService.resolve("{{ steps.fetch_leads.output.count }}", context)

        assertEquals(42, result)
    }

    @Test
    fun `resolve nested property access`() {
        // Populate registry with nested data
        context.dataRegistry["fetch_user"] = NodeExecutionData(
            nodeId = UUID.randomUUID(),
            nodeName = "fetch_user",
            status = "COMPLETED",
            output = mapOf(
                "user" to mapOf(
                    "email" to "user@example.com",
                    "profile" to mapOf(
                        "name" to "John Doe"
                    )
                )
            ),
            error = null,
            executedAt = Instant.now()
        )

        val result = inputResolverService.resolve("{{ steps.fetch_user.output.user.profile.name }}", context)

        assertEquals("John Doe", result)
    }

    @Test
    fun `resolve template accessing top-level output`() {
        // Populate registry
        context.dataRegistry["get_status"] = NodeExecutionData(
            nodeId = UUID.randomUUID(),
            nodeName = "get_status",
            status = "COMPLETED",
            output = mapOf("status" to "active"),
            error = null,
            executedAt = Instant.now()
        )

        val result = inputResolverService.resolve("{{ steps.get_status.output.status }}", context)

        assertEquals("active", result)
    }

    // ========== Static Value Tests ==========

    @Test
    fun `resolve static string returns unchanged`() {
        val result = inputResolverService.resolve("static value", context)

        assertEquals("static value", result)
    }

    @Test
    fun `resolve non-string value returns unchanged`() {
        assertEquals(42, inputResolverService.resolve(42, context))
        assertEquals(true, inputResolverService.resolve(true, context))
        assertEquals(3.14, inputResolverService.resolve(3.14, context))
    }

    @Test
    fun `resolve null returns null`() {
        assertNull(inputResolverService.resolve(null, context))
    }

    // ========== Missing Data Tests (Graceful Degradation) ==========

    @Test
    fun `resolve template for missing node returns null`() {
        // Registry is empty - node doesn't exist
        val result = inputResolverService.resolve("{{ steps.missing_node.output }}", context)

        assertNull(result)
    }

    @Test
    fun `resolve template for missing property returns null`() {
        // Node exists but property doesn't
        context.dataRegistry["fetch_leads"] = NodeExecutionData(
            nodeId = UUID.randomUUID(),
            nodeName = "fetch_leads",
            status = "COMPLETED",
            output = mapOf("count" to 42),
            error = null,
            executedAt = Instant.now()
        )

        val result = inputResolverService.resolve("{{ steps.fetch_leads.output.missing_field }}", context)

        assertNull(result)
    }

    @Test
    fun `resolve template for failed node returns null`() {
        // Node failed - status is FAILED
        context.dataRegistry["failed_node"] = NodeExecutionData(
            nodeId = UUID.randomUUID(),
            nodeName = "failed_node",
            status = "FAILED",
            output = null,
            error = "Something went wrong",
            executedAt = Instant.now()
        )

        val result = inputResolverService.resolve("{{ steps.failed_node.output }}", context)

        assertNull(result)
    }

    @Test
    fun `resolve template with null in traversal path returns null`() {
        // Property exists but is null
        context.dataRegistry["fetch_user"] = NodeExecutionData(
            nodeId = UUID.randomUUID(),
            nodeName = "fetch_user",
            status = "COMPLETED",
            output = mapOf("user" to null),
            error = null,
            executedAt = Instant.now()
        )

        val result = inputResolverService.resolve("{{ steps.fetch_user.output.user.email }}", context)

        assertNull(result)
    }

    @Test
    fun `resolve template accessing property on non-map returns null`() {
        // Trying to access property on a primitive (string)
        context.dataRegistry["fetch_data"] = NodeExecutionData(
            nodeId = UUID.randomUUID(),
            nodeName = "fetch_data",
            status = "COMPLETED",
            output = mapOf("value" to "primitive string"),
            error = null,
            executedAt = Instant.now()
        )

        val result = inputResolverService.resolve("{{ steps.fetch_data.output.value.nested }}", context)

        assertNull(result)
    }

    // ========== Error Cases ==========

    @Test
    fun `resolve template without steps prefix throws error`() {
        val exception = assertThrows<IllegalArgumentException> {
            inputResolverService.resolve("{{ loop.item }}", context)
        }
        assertEquals("Template path must start with 'steps'. Got: loop", exception.message)
    }

    @Test
    fun `resolve template with only steps segment throws error`() {
        val exception = assertThrows<IllegalArgumentException> {
            inputResolverService.resolve("{{ steps }}", context)
        }
        assert(exception.message!!.contains("must include node name"))
    }

    // ========== Recursive Resolution Tests ==========

    @Test
    fun `resolveAll resolves templates in flat config`() {
        // Populate registry
        context.dataRegistry["fetch_user"] = NodeExecutionData(
            nodeId = UUID.randomUUID(),
            nodeName = "fetch_user",
            status = "COMPLETED",
            output = mapOf(
                "email" to "user@example.com",
                "name" to "John Doe"
            ),
            error = null,
            executedAt = Instant.now()
        )

        val config = mapOf(
            "to" to "{{ steps.fetch_user.output.email }}",
            "subject" to "Welcome {{ steps.fetch_user.output.name }}!"
        )

        val resolved = inputResolverService.resolveAll(config, context)

        assertEquals("user@example.com", resolved["to"])
        assertEquals("Welcome John Doe!", resolved["subject"]) // Embedded template resolved
    }

    @Test
    fun `resolveAll resolves templates in nested config`() {
        // Populate registry
        context.dataRegistry["fetch_config"] = NodeExecutionData(
            nodeId = UUID.randomUUID(),
            nodeName = "fetch_config",
            status = "COMPLETED",
            output = mapOf(
                "url" to "https://api.example.com",
                "token" to "secret123"
            ),
            error = null,
            executedAt = Instant.now()
        )

        val config = mapOf(
            "http" to mapOf(
                "url" to "{{ steps.fetch_config.output.url }}",
                "headers" to mapOf(
                    "Authorization" to "Bearer {{ steps.fetch_config.output.token }}"
                )
            ),
            "static" to "value"
        )

        val resolved = inputResolverService.resolveAll(config, context)

        @Suppress("UNCHECKED_CAST")
        val http = resolved["http"] as Map<String, Any?>
        assertEquals("https://api.example.com", http["url"])

        @Suppress("UNCHECKED_CAST")
        val headers = http["headers"] as Map<String, Any?>
        assertEquals("Bearer secret123", headers["Authorization"])

        assertEquals("value", resolved["static"])
    }

    @Test
    fun `resolveAll resolves templates in lists`() {
        // Populate registry
        context.dataRegistry["fetch_emails"] = NodeExecutionData(
            nodeId = UUID.randomUUID(),
            nodeName = "fetch_emails",
            status = "COMPLETED",
            output = mapOf(
                "primary" to "primary@example.com",
                "secondary" to "secondary@example.com"
            ),
            error = null,
            executedAt = Instant.now()
        )

        val config = mapOf(
            "recipients" to listOf(
                "{{ steps.fetch_emails.output.primary }}",
                "{{ steps.fetch_emails.output.secondary }}",
                "static@example.com"
            )
        )

        val resolved = inputResolverService.resolveAll(config, context)

        @Suppress("UNCHECKED_CAST")
        val recipients = resolved["recipients"] as List<Any?>
        assertEquals(listOf("primary@example.com", "secondary@example.com", "static@example.com"), recipients)
    }

    @Test
    fun `resolveAll preserves static values`() {
        val config = mapOf(
            "string" to "static",
            "number" to 42,
            "boolean" to true,
            "null" to null,
            "nested" to mapOf("key" to "value")
        )

        val resolved = inputResolverService.resolveAll(config, context)

        assertEquals(config, resolved)
    }

    @Test
    fun `resolveAll handles missing data gracefully`() {
        // Registry is empty
        val config = mapOf(
            "field1" to "{{ steps.missing.output }}",
            "field2" to "static"
        )

        val resolved = inputResolverService.resolveAll(config, context)

        assertNull(resolved["field1"])
        assertEquals("static", resolved["field2"])
    }
}
