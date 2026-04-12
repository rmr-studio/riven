package riven.core.controller.customsource

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.github.oshai.kotlinlogging.KLogger
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.doThrow
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import riven.core.configuration.properties.ApplicationConfigurationProperties
import riven.core.enums.customsource.SslMode
import riven.core.enums.integration.ConnectionStatus
import riven.core.exceptions.ExceptionHandler
import riven.core.exceptions.NotFoundException
import riven.core.exceptions.customsource.ReadOnlyVerificationException
import riven.core.exceptions.customsource.SsrfRejectedException
import riven.core.models.customsource.CustomSourceConnectionModel
import riven.core.service.customsource.CustomSourceConnectionService
import riven.core.service.customsource.TestResult
import java.time.ZonedDateTime
import java.util.UUID
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

/**
 * MockMvc-level tests for [CustomSourceConnectionController] covering CONN-05.
 *
 * Uses a standalone MockMvc setup so the real [ExceptionHandler] runs (to verify
 * SsrfRejectedException / ReadOnlyVerificationException → 400 mapping and
 * NotFoundException → 404). Cross-workspace @PreAuthorize blocking is covered
 * at the service-layer test — standalone MockMvc does not load method security.
 */
class CustomSourceConnectionControllerTest {

    private val service: CustomSourceConnectionService = mock()
    private val logger: KLogger = mock()
    private val objectMapper: ObjectMapper = jacksonObjectMapper()
    private lateinit var mockMvc: MockMvc

    private val workspaceId: UUID = UUID.randomUUID()
    private val connectionId: UUID = UUID.randomUUID()

    private fun model(status: ConnectionStatus = ConnectionStatus.CONNECTED) =
        CustomSourceConnectionModel(
            id = connectionId,
            workspaceId = workspaceId,
            name = "prod-warehouse",
            host = "db.example.com",
            port = 5432,
            database = "analytics",
            user = "readonly",
            sslMode = "require",
            connectionStatus = status,
            lastVerifiedAt = ZonedDateTime.now(),
            createdAt = ZonedDateTime.now(),
            updatedAt = ZonedDateTime.now(),
        )

    @BeforeEach
    fun setup() {
        val config = ApplicationConfigurationProperties(
            includeStackTrace = false,
            supabaseUrl = "https://test.supabase.co",
            supabaseKey = "test-key",
        )
        mockMvc = MockMvcBuilders
            .standaloneSetup(CustomSourceConnectionController(service))
            .setControllerAdvice(ExceptionHandler(logger, config))
            .build()
    }

    private fun validCreateJson(): String = """
        {
          "workspaceId": "$workspaceId",
          "name": "prod-warehouse",
          "host": "db.example.com",
          "port": 5432,
          "database": "analytics",
          "user": "readonly",
          "password": "hunter2",
          "sslMode": "require"
        }
    """.trimIndent()

    private fun validTestJson(): String = """
        {
          "host": "db.example.com",
          "port": 5432,
          "database": "analytics",
          "user": "readonly",
          "password": "hunter2",
          "sslMode": "require"
        }
    """.trimIndent()

    // ------ POST /test ------

    @Test
    fun `POST test returns 200 and TestResult`() {
        whenever(service.test(any())).thenReturn(TestResult(pass = true, category = null, message = "All gates passed"))

        mockMvc.perform(
            post("/api/v1/custom-sources/connections/test")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validTestJson()),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.pass").value(true))
    }

    // ------ POST / ------

    @Test
    fun `POST returns 201 on create and never leaks credential fields`() {
        whenever(service.create(any())).thenReturn(model())

        val result = mockMvc.perform(
            post("/api/v1/custom-sources/connections")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validCreateJson()),
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.host").value("db.example.com"))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.encryptedCredentials").doesNotExist())
            .andExpect(jsonPath("$.iv").doesNotExist())
            .andExpect(jsonPath("$.keyVersion").doesNotExist())
            .andReturn()

        val body = result.response.contentAsString
        assertFalse(body.contains("hunter2"), "response body must not contain password value")
    }

    @Test
    fun `POST returns 400 on blank password`() {
        val bad = validCreateJson().replace("\"hunter2\"", "\"\"")
        mockMvc.perform(
            post("/api/v1/custom-sources/connections")
                .contentType(MediaType.APPLICATION_JSON)
                .content(bad),
        )
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `POST returns 400 on invalid port`() {
        val bad = validCreateJson().replace("\"port\": 5432", "\"port\": 70000")
        mockMvc.perform(
            post("/api/v1/custom-sources/connections")
                .contentType(MediaType.APPLICATION_JSON)
                .content(bad),
        )
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `POST returns 400 on SsrfRejectedException and body does not leak CIDR`() {
        doThrow(SsrfRejectedException("Host not reachable: this address is blocked for security reasons (private/loopback/metadata)."))
            .whenever(service).create(any())

        val result = mockMvc.perform(
            post("/api/v1/custom-sources/connections")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validCreateJson()),
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value("SSRF_REJECTED"))
            .andReturn()

        val body = result.response.contentAsString
        // Generic message — no specific CIDR string leaks
        assertFalse(body.contains("10.0.0.0/8"))
        assertFalse(body.contains("169.254"))
    }

    @Test
    fun `POST returns 400 on ReadOnlyVerificationException`() {
        doThrow(ReadOnlyVerificationException("Role has write privileges on 3 tables"))
            .whenever(service).create(any())

        mockMvc.perform(
            post("/api/v1/custom-sources/connections")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validCreateJson()),
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value("ROLE_VERIFICATION_FAILED"))
    }

    // ------ GET / ------

    @Test
    fun `GET returns 200 with list and redacted models`() {
        whenever(service.listByWorkspace(workspaceId)).thenReturn(listOf(model()))

        val result = mockMvc.perform(get("/api/v1/custom-sources/connections").param("workspaceId", workspaceId.toString()))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].host").value("db.example.com"))
            .andExpect(jsonPath("$[0].password").doesNotExist())
            .andExpect(jsonPath("$[0].encryptedCredentials").doesNotExist())
            .andExpect(jsonPath("$[0].iv").doesNotExist())
            .andExpect(jsonPath("$[0].keyVersion").doesNotExist())
            .andReturn()

        val tree = objectMapper.readTree(result.response.contentAsString)
        val firstKeys = tree[0].fieldNames().asSequence().toSet()
        assertTrue(firstKeys.none { it in setOf("password", "encryptedCredentials", "iv", "keyVersion") })
    }

    // ------ GET /{id} ------

    @Test
    fun `GET id returns 200 with no credential fields`() {
        whenever(service.getById(workspaceId, connectionId)).thenReturn(model())

        mockMvc.perform(get("/api/v1/custom-sources/connections/$connectionId").param("workspaceId", workspaceId.toString()))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(connectionId.toString()))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.encryptedCredentials").doesNotExist())
            .andExpect(jsonPath("$.iv").doesNotExist())
            .andExpect(jsonPath("$.keyVersion").doesNotExist())
    }

    @Test
    fun `GET id returns 404 on NotFoundException`() {
        doAnswer { throw NotFoundException("not found") }
            .whenever(service).getById(any(), any())

        mockMvc.perform(get("/api/v1/custom-sources/connections/$connectionId").param("workspaceId", workspaceId.toString()))
            .andExpect(status().isNotFound)
    }

    // ------ PATCH /{id} ------

    @Test
    fun `PATCH returns 200 with updated model`() {
        whenever(service.update(any(), any(), any())).thenReturn(model())

        mockMvc.perform(
            patch("/api/v1/custom-sources/connections/$connectionId")
                .param("workspaceId", workspaceId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"name":"renamed"}"""),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.password").doesNotExist())
    }

    // ------ DELETE /{id} ------

    @Test
    fun `DELETE returns 204`() {
        mockMvc.perform(
            delete("/api/v1/custom-sources/connections/$connectionId")
                .param("workspaceId", workspaceId.toString()),
        )
            .andExpect(status().isNoContent)
    }
}
