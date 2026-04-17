package riven.core.service.insights.llm

import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.mock
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.whenever
import org.springframework.http.HttpStatus
import org.springframework.http.HttpStatusCode
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import reactor.core.publisher.Mono
import riven.core.configuration.properties.AnthropicConfigurationProperties
import riven.core.exceptions.LlmCallException
import riven.core.service.insights.llm.dto.AnthropicContentBlock
import riven.core.service.insights.llm.dto.AnthropicMessagesRequest
import riven.core.service.insights.llm.dto.AnthropicMessagesResponse
import riven.core.service.insights.llm.dto.AnthropicUsage
import riven.core.service.insights.llm.dto.ChatMessage

/**
 * Unit tests for [AnthropicChatClient] that exercise the Anthropic Messages API contract:
 * request-body shape (system cache_control, prefill, model/max_tokens, messages),
 * response parsing (text + TokenUsage), and error handling (4xx, 5xx, malformed).
 *
 * Uses a mocked WebClient fluent chain — MockWebServer is not on the test classpath.
 * Per-request headers (`x-api-key`, `anthropic-version`) are configured as WebClient
 * default headers in [riven.core.configuration.insights.InsightsWebClientConfig] and
 * cannot be asserted from a mocked WebClient chain — that wiring is covered by the
 * WebClientConfig bean test / an integration smoke test (see
 * `docs/insights-demo-smoke-test.md`).
 */
@Suppress("UNCHECKED_CAST")
class AnthropicChatClientTest {

    private val logger: KLogger = mock(KLogger::class.java)
    private val webClient: WebClient = mock(WebClient::class.java)
    private val requestBodyUriSpec: WebClient.RequestBodyUriSpec = mock(WebClient.RequestBodyUriSpec::class.java)
    private val requestBodySpec: WebClient.RequestBodySpec = mock(WebClient.RequestBodySpec::class.java)
    private val requestHeadersSpec: WebClient.RequestHeadersSpec<*> =
        mock(WebClient.RequestHeadersSpec::class.java) as WebClient.RequestHeadersSpec<*>
    private val responseSpec: WebClient.ResponseSpec = mock(WebClient.ResponseSpec::class.java)

    private val properties = AnthropicConfigurationProperties(
        apiKey = "test-key",
        model = "claude-sonnet-4-5-20250929",
        maxTokens = 1024,
        baseUrl = "https://api.anthropic.com",
        apiVersion = "2023-06-01",
        requestTimeoutSeconds = 30,
    )

    private lateinit var client: AnthropicChatClient

    @BeforeEach
    fun setup() {
        whenever(webClient.post()).thenReturn(requestBodyUriSpec)
        whenever(requestBodyUriSpec.uri(any<String>())).thenReturn(requestBodySpec)
        whenever(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec)
        whenever(requestHeadersSpec.retrieve()).thenReturn(responseSpec)
        client = AnthropicChatClient(webClient, properties, logger)
    }

    // ------ Happy path + request shape ------

    @Test
    fun `request body has cached system block, model, max_tokens, and assistant prefill`() {
        stubResponseMono(successResponse("answer body", inputTokens = 10, outputTokens = 5))

        client.sendMessage("SYSTEM PROMPT", listOf(ChatMessage(ChatMessage.ROLE_USER, "hello")))

        val bodyCaptor = argumentCaptor<Any>()
        org.mockito.kotlin.verify(requestBodySpec).bodyValue(bodyCaptor.capture())
        val req = bodyCaptor.firstValue as AnthropicMessagesRequest

        assertEquals("claude-sonnet-4-5-20250929", req.model)
        assertEquals(1024, req.max_tokens)
        assertEquals(1, req.system.size)
        assertEquals("SYSTEM PROMPT", req.system.first().text)
        assertNotNull(req.system.first().cache_control)
        assertEquals("ephemeral", req.system.first().cache_control?.type)

        // User message + assistant prefill of `{`.
        assertEquals(2, req.messages.size)
        assertEquals(ChatMessage.ROLE_USER, req.messages.first().role)
        assertEquals("hello", req.messages.first().content)
        assertEquals(ChatMessage.ROLE_ASSISTANT, req.messages.last().role)
        assertEquals("{", req.messages.last().content)
    }

    @Test
    fun `response text is parsed from content blocks and token usage is populated`() {
        stubResponseMono(
            AnthropicMessagesResponse(
                content = listOf(
                    AnthropicContentBlock(type = "text", text = "\"answer\": \"ok\"}"),
                ),
                usage = AnthropicUsage(
                    input_tokens = 42,
                    output_tokens = 7,
                    cache_read_input_tokens = 100,
                    cache_creation_input_tokens = 200,
                ),
            )
        )

        val result = client.sendMessage("sys", listOf(ChatMessage(ChatMessage.ROLE_USER, "q")))

        // Client re-prepends the stripped prefill `{`.
        assertTrue(result.text.startsWith("{"), "expected client to re-prepend the prefill")
        assertEquals(42, result.usage.inputTokens)
        assertEquals(7, result.usage.outputTokens)
        assertEquals(100, result.usage.cacheReadTokens)
        assertEquals(200, result.usage.cacheWriteTokens)
    }

    @Test
    fun `text is joined across multiple content blocks`() {
        stubResponseMono(
            AnthropicMessagesResponse(
                content = listOf(
                    AnthropicContentBlock(type = "text", text = "\"answer\":"),
                    AnthropicContentBlock(type = "text", text = " \"joined\"}"),
                ),
                usage = AnthropicUsage(),
            )
        )

        val result = client.sendMessage("sys", listOf(ChatMessage(ChatMessage.ROLE_USER, "q")))

        assertTrue(result.text.contains("joined"))
    }

    // ------ Error handling ------

    @Test
    fun `4xx upstream response throws LlmCallException`() {
        stubErrorMono(
            WebClientResponseException.create(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                org.springframework.http.HttpHeaders.EMPTY,
                ByteArray(0),
                null,
            )
        )

        assertThrows<LlmCallException> {
            client.sendMessage("sys", listOf(ChatMessage(ChatMessage.ROLE_USER, "q")))
        }
    }

    @Test
    fun `5xx upstream response throws LlmCallException`() {
        stubErrorMono(
            WebClientResponseException.create(
                HttpStatus.BAD_GATEWAY.value(),
                "Bad Gateway",
                org.springframework.http.HttpHeaders.EMPTY,
                ByteArray(0),
                null,
            )
        )

        assertThrows<LlmCallException> {
            client.sendMessage("sys", listOf(ChatMessage(ChatMessage.ROLE_USER, "q")))
        }
    }

    @Test
    fun `malformed or unexpected exception during call is wrapped as LlmCallException`() {
        stubErrorMono(RuntimeException("deserialization boom"))

        assertThrows<LlmCallException> {
            client.sendMessage("sys", listOf(ChatMessage(ChatMessage.ROLE_USER, "q")))
        }
    }

    // ------ Helpers ------

    private fun successResponse(
        rawText: String,
        inputTokens: Int = 0,
        outputTokens: Int = 0,
    ) = AnthropicMessagesResponse(
        content = listOf(AnthropicContentBlock(type = "text", text = rawText)),
        usage = AnthropicUsage(input_tokens = inputTokens, output_tokens = outputTokens),
    )

    @Suppress("UNCHECKED_CAST")
    private fun stubResponseMono(response: AnthropicMessagesResponse) {
        val mono = mock(Mono::class.java) as Mono<AnthropicMessagesResponse>
        whenever(responseSpec.bodyToMono(AnthropicMessagesResponse::class.java)).thenReturn(mono)
        whenever(mono.timeout(any<java.time.Duration>())).thenReturn(mono)
        whenever(mono.block()).thenReturn(response)
    }

    @Suppress("UNCHECKED_CAST")
    private fun stubErrorMono(ex: Throwable) {
        val mono = mock(Mono::class.java) as Mono<AnthropicMessagesResponse>
        whenever(responseSpec.bodyToMono(AnthropicMessagesResponse::class.java)).thenReturn(mono)
        whenever(mono.timeout(any<java.time.Duration>())).thenReturn(mono)
        whenever(mono.block()).thenThrow(ex)
    }

    // Keeps the unused HttpStatusCode import aligned with WebClientResponseException.create signature.
    @Suppress("unused")
    private val _unusedStatusCodeRef: HttpStatusCode = HttpStatus.OK
}
