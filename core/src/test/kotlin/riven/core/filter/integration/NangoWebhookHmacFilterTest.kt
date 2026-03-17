package riven.core.filter.integration

import io.github.oshai.kotlinlogging.KLogger
import jakarta.servlet.FilterChain
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import riven.core.configuration.properties.NangoConfigurationProperties
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlin.test.assertEquals

/**
 * Unit tests for NangoWebhookHmacFilter.
 *
 * Verifies HMAC-SHA256 signature validation: valid signatures pass through,
 * invalid or missing signatures return 401 without calling the filter chain.
 */
class NangoWebhookHmacFilterTest {

    private lateinit var filter: NangoWebhookHmacFilter
    private lateinit var filterChain: FilterChain
    private lateinit var logger: KLogger

    private val secretKey = "test-secret-key"
    private val properties = NangoConfigurationProperties(secretKey = secretKey)

    @BeforeEach
    fun setup() {
        logger = mock()
        filter = NangoWebhookHmacFilter(properties, logger)
        filterChain = mock()
    }

    // ------ Test Helpers ------

    private fun computeHmac(key: String, body: ByteArray): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(key.toByteArray(), "HmacSHA256"))
        return mac.doFinal(body).joinToString("") { "%02x".format(it) }
    }

    // ------ Tests ------

    @Test
    fun `valid HMAC signature passes through filter chain`() {
        val body = """{"type":"auth"}""".toByteArray()
        val signature = computeHmac(secretKey, body)

        val request = MockHttpServletRequest()
        request.setContent(body)
        request.addHeader("X-Nango-Hmac-Sha256", signature)

        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain, times(1)).doFilter(any(), any())
        assertEquals(200, response.status)
    }

    @Test
    fun `invalid HMAC signature returns 401 and does not call filter chain`() {
        val body = """{"type":"auth"}""".toByteArray()
        val wrongSignature = computeHmac("wrong-secret", body)

        val request = MockHttpServletRequest()
        request.setContent(body)
        request.addHeader("X-Nango-Hmac-Sha256", wrongSignature)

        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain, never()).doFilter(any(), any())
        assertEquals(401, response.status)
    }

    @Test
    fun `missing X-Nango-Hmac-Sha256 header returns 401`() {
        val body = """{"type":"auth"}""".toByteArray()

        val request = MockHttpServletRequest()
        request.setContent(body)
        // No signature header added

        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain, never()).doFilter(any(), any())
        assertEquals(401, response.status)
    }

    @Test
    fun `empty request body with valid HMAC for empty body passes`() {
        val body = ByteArray(0)
        val signature = computeHmac(secretKey, body)

        val request = MockHttpServletRequest()
        request.setContent(body)
        request.addHeader("X-Nango-Hmac-Sha256", signature)

        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain, times(1)).doFilter(any(), any())
        assertEquals(200, response.status)
    }

    @Test
    fun `request body is re-readable after filter passes through`() {
        val body = """{"type":"auth","connectionId":"test-conn"}""".toByteArray()
        val signature = computeHmac(secretKey, body)

        val request = MockHttpServletRequest()
        request.setContent(body)
        request.addHeader("X-Nango-Hmac-Sha256", signature)

        val response = MockHttpServletResponse()

        // Capture the wrapped request passed to filterChain
        var capturedBody: String? = null
        org.mockito.kotlin.whenever(filterChain.doFilter(any(), any())).thenAnswer { invocation ->
            val wrappedRequest = invocation.getArgument<jakarta.servlet.http.HttpServletRequest>(0)
            capturedBody = wrappedRequest.inputStream.readBytes().toString(Charsets.UTF_8)
        }

        filter.doFilter(request, response, filterChain)

        assertEquals(String(body), capturedBody)
    }
}
