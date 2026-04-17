package riven.core.service.insights

import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.doThrow
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.reset
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import riven.core.configuration.properties.AnthropicConfigurationProperties
import riven.core.models.insights.TokenUsage
import riven.core.service.insights.llm.AnthropicChatClient
import riven.core.service.insights.llm.dto.ChatCompletionResult
import java.util.UUID

class DemoAugmentationPlannerTest {

    private val client: AnthropicChatClient = mock()
    private val logger: KLogger = mock()
    private val properties = AnthropicConfigurationProperties(
        apiKey = "k",
        plannerMaxTokens = 512,
    )

    private val planner = DemoAugmentationPlanner(client, properties, logger)

    private val sessionId = UUID.randomUUID()
    private val workspaceId = UUID.randomUUID()

    @BeforeEach
    fun setup() {
        reset(client)
    }

    private fun respond(text: String) {
        whenever(client.sendMessage(any(), any(), anyOrNull(), anyOrNull()))
            .thenReturn(ChatCompletionResult(text = text, usage = TokenUsage()))
    }

    @Test
    fun `parses a valid plan response`() {
        respond(
            """
            {"customers":[
              {"name":"Ada Byron","email":"ada@example.com","plan":"Pro","ltv":1200,"signupDaysAgo":30,"cluster":"Power users","eventCount":3}
            ],
            "events":[
              {"customerRef":"Ada Byron","feature":"timeline","action":"used","count":5,"daysAgo":2}
            ],
            "reasoning":"needed a pro power user"}
            """.trimIndent()
        )

        val plan = planner.plan(sessionId, workspaceId, "who's our top pro user?", "pool", emptyList())

        assertEquals(1, plan.customers.size)
        assertEquals("Ada Byron", plan.customers.first().name)
        assertEquals("Power users", plan.customers.first().cluster)
        assertEquals(1, plan.events.size)
        assertEquals("timeline", plan.events.first().feature)
        assertEquals("needed a pro power user", plan.reasoning)
    }

    @Test
    fun `empty plan parses as empty`() {
        respond("""{"customers":[],"events":[],"reasoning":"sufficient"}""")
        val plan = planner.plan(sessionId, workspaceId, "hi", "pool", emptyList())
        assertTrue(plan.customers.isEmpty())
        assertTrue(plan.events.isEmpty())
        assertEquals("sufficient", plan.reasoning)
    }

    @Test
    fun `returns empty plan when LLM throws`() {
        doThrow(RuntimeException("boom"))
            .whenever(client).sendMessage(any(), any(), anyOrNull(), anyOrNull())

        val plan = planner.plan(sessionId, workspaceId, "hi", "pool", emptyList())
        assertTrue(plan.customers.isEmpty())
        assertTrue(plan.events.isEmpty())
        assertEquals("", plan.reasoning)
    }

    @Test
    fun `returns empty plan on malformed JSON`() {
        respond("not json at all, sorry")
        val plan = planner.plan(sessionId, workspaceId, "hi", "pool", emptyList())
        assertTrue(plan.customers.isEmpty())
        assertTrue(plan.events.isEmpty())
    }

    @Test
    fun `lenient parser accepts unescaped newlines inside strings`() {
        respond(
            """
            {"customers":[{"name":"Tess Marino"}],"events":[],"reasoning":"multi
line reasoning is fine"}
            """.trimIndent()
        )
        val plan = planner.plan(sessionId, workspaceId, "hi", "pool", emptyList())
        assertEquals(1, plan.customers.size)
        assertEquals("Tess Marino", plan.customers.first().name)
        assertTrue(plan.reasoning.contains("multi"))
    }

    @Test
    fun `passes planner model override and max tokens to client`() {
        respond("""{"customers":[],"events":[],"reasoning":""}""")
        planner.plan(sessionId, workspaceId, "hi", "pool", emptyList())

        val modelCaptor = argumentCaptor<String>()
        val maxCaptor = argumentCaptor<Int>()
        verify(client).sendMessage(any(), any(), modelCaptor.capture(), maxCaptor.capture())
        // default plannerModel is empty → should fall back to main model
        assertEquals(properties.model, modelCaptor.firstValue)
        assertEquals(512, maxCaptor.firstValue)
    }
}
