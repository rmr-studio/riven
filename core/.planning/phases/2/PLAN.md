---
phase: 02-http-auto-capture
plan: 01
type: execute
wave: 1
depends_on: [1-01]
files_modified:
  - src/main/kotlin/riven/core/filter/analytics/PostHogCaptureFilter.kt
  - src/main/kotlin/riven/core/configuration/analytics/PostHogConfiguration.kt
  - src/main/kotlin/riven/core/exceptions/ExceptionHandler.kt
  - src/test/kotlin/riven/core/filter/analytics/PostHogCaptureFilterTest.kt
autonomous: true
requirements: [FILT-01, FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07, TEST-01, TEST-02]

must_haves:
  truths:
    - "Every authenticated API request fires a $api_request event via PostHogService"
    - "Events include HTTP method, route template endpoint, status code, and latency in ms"
    - "Events include authenticated userId as distinctId and workspaceId as property"
    - "UUID path segments are normalized to {id} to prevent high-cardinality pollution"
    - "Actuator, Swagger/docs, /public/**, /api/auth/**, and /error routes produce no events"
    - "4xx/5xx responses include errorClass and errorMessage in event properties"
    - "2xx responses do not include error context in event properties"
    - "Filter adds no meaningful latency -- event dispatch is delegated to PostHogService async queue"
    - "Tests run with POSTHOG_ENABLED=false and make zero network calls to PostHog"
  artifacts:
    - path: "src/main/kotlin/riven/core/filter/analytics/PostHogCaptureFilter.kt"
      provides: "OncePerRequestFilter that captures API request events"
      exports: ["PostHogCaptureFilter"]
    - path: "src/main/kotlin/riven/core/configuration/analytics/PostHogConfiguration.kt"
      provides: "FilterRegistrationBean wiring with order -99"
      contains: "FilterRegistrationBean"
    - path: "src/main/kotlin/riven/core/exceptions/ExceptionHandler.kt"
      provides: "Request attribute storing exception context for filter consumption"
      contains: "POSTHOG_EXCEPTION_CLASS"
    - path: "src/test/kotlin/riven/core/filter/analytics/PostHogCaptureFilterTest.kt"
      provides: "Unit tests for all filter behaviors"
      min_lines: 100
  key_links:
    - from: "PostHogCaptureFilter"
      to: "PostHogService.capture()"
      via: "constructor injection, called in doFilterInternal after chain.doFilter()"
      pattern: "postHogService\\.capture"
    - from: "PostHogCaptureFilter"
      to: "ApiRequestEvent"
      via: "builds event from request/response metadata, passes .properties to capture()"
      pattern: "ApiRequestEvent"
    - from: "PostHogCaptureFilter"
      to: "SecurityContextHolder"
      via: "reads Jwt.subject for userId after security chain has populated context"
      pattern: "SecurityContextHolder"
    - from: "ExceptionHandler"
      to: "PostHogCaptureFilter"
      via: "stores exception class/message as request attributes that filter reads post-doFilter"
      pattern: "POSTHOG_EXCEPTION_CLASS"
    - from: "PostHogConfiguration"
      to: "PostHogCaptureFilter"
      via: "FilterRegistrationBean with order -99 and /api/* URL pattern"
      pattern: "FilterRegistrationBean"
---

<objective>
Implement an HTTP auto-capture filter that fires a `$api_request` PostHog event for every authenticated API request, capturing method, endpoint route template, status code, latency, userId, workspaceId, and error context on failures.

Purpose: Gives the team automatic visibility into API usage patterns without per-endpoint instrumentation. This is the core data pipeline for PostHog analytics.
Output: Working filter + configuration + exception handler integration + comprehensive unit tests.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/1/1-01-SUMMARY.md

<interfaces>
<!-- Phase 1 artifacts this plan depends on. Executor uses these directly. -->

From src/main/kotlin/riven/core/service/analytics/PostHogService.kt:
```kotlin
interface PostHogService {
    fun capture(userId: UUID, workspaceId: UUID, event: String, properties: Map<String, Any> = emptyMap())
    fun identify(userId: UUID, properties: Map<String, Any> = emptyMap())
    fun groupIdentify(userId: UUID, workspaceId: UUID, properties: Map<String, Any> = emptyMap())
}
```

From src/main/kotlin/riven/core/models/analytics/AnalyticsEvent.kt:
```kotlin
sealed interface AnalyticsEvent {
    val eventName: String
    val properties: Map<String, Any>
}

data class ApiRequestEvent(
    val method: String,
    val endpoint: String,
    val statusCode: Int,
    val latencyMs: Long,
    val isError: Boolean = false,
    val errorClass: String? = null,
    val errorMessage: String? = null
) : AnalyticsEvent {
    override val eventName: String = "\$api_request"
    override val properties: Map<String, Any>
        get() = buildMap {
            put("method", method)
            put("endpoint", endpoint)
            put("statusCode", statusCode)
            put("latencyMs", latencyMs)
            put("isError", isError)
            errorClass?.let { put("errorClass", it) }
            errorMessage?.let { put("errorMessage", it) }
        }
}
```

From src/main/kotlin/riven/core/configuration/analytics/PostHogConfiguration.kt:
```kotlin
@Configuration
@EnableConfigurationProperties(PostHogConfigurationProperties::class)
class PostHogConfiguration {
    // ... existing beans: counters, circuit breaker, SDK client, service beans
    // New FilterRegistrationBean will be added here
}
```

From src/main/kotlin/riven/core/exceptions/ExceptionHandler.kt:
```kotlin
@ControllerAdvice
class ExceptionHandler(private val logger: KLogger, private val config: ApplicationConfigurationProperties) {
    // Handles: AccessDeniedException, InvalidRelationshipException, SchemaValidationException,
    //   AuthorizationDeniedException, NotFoundException, IllegalArgumentException,
    //   ConflictException, UniqueConstraintViolationException
    // Each returns ResponseEntity<ErrorResponse>
}
```

From src/main/kotlin/riven/core/configuration/auth/SecurityConfig.kt:
```kotlin
// Security permits: /api/auth/**, /actuator/**, /docs/**, /public/**
// All other requests require authentication
// Spring Security FilterChainProxy runs at default order -100
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create PostHogCaptureFilter and wire exception context in ExceptionHandler</name>
  <files>
    src/main/kotlin/riven/core/filter/analytics/PostHogCaptureFilter.kt
    src/main/kotlin/riven/core/exceptions/ExceptionHandler.kt
  </files>
  <action>
**1a. Create PostHogCaptureFilter** at `src/main/kotlin/riven/core/filter/analytics/PostHogCaptureFilter.kt`.

The filter extends `OncePerRequestFilter` and captures a `$api_request` event for every authenticated API request. Constructor-inject `PostHogService` and `KLogger`.

**`shouldNotFilter(request)` override** -- return `true` (skip) for non-product routes. Check `request.requestURI` against these prefixes:
- `/actuator`
- `/docs`
- `/public`
- `/api/auth`
- `/error`
- `/swagger-ui`
- `/v3/api-docs`

Store these as a `companion object` list of strings. Use `excludedPrefixes.any { request.requestURI.startsWith(it) }`.

**`doFilterInternal(request, response, filterChain)` implementation:**

```
val startTime = System.nanoTime()

try {
    filterChain.doFilter(request, response)
} finally {
    val latencyMs = (System.nanoTime() - startTime) / 1_000_000
    captureRequest(request, response, latencyMs)
}
```

**`captureRequest(request, response, latencyMs)` private method:**

1. Extract userId from SecurityContext -- do NOT use `AuthTokenService.getUserId()` (it throws on missing auth). Instead:
   ```kotlin
   val authentication = SecurityContextHolder.getContext().authentication ?: return
   val jwt = (authentication.principal as? Jwt) ?: return
   val userId = try { UUID.fromString(jwt.subject) } catch (_: Exception) { return }
   ```
   If any of these are null/fail, return silently (unauthenticated request that passed through -- e.g. a permitAll route that wasn't in the exclude list).

2. Extract route template endpoint. Read `HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE` from request attributes (available AFTER doFilter):
   ```kotlin
   val routeTemplate = request.getAttribute(
       org.springframework.web.servlet.HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE
   ) as? String
   ```
   If `routeTemplate` is non-null, use it directly (it already has `{workspaceId}`, `{id}` placeholders). If null (e.g. 404), fall back to `normalizeUri(request.requestURI)`.

3. Extract workspaceId. Read `HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE` (a `Map<String, String>`) and get the `"workspaceId"` key:
   ```kotlin
   @Suppress("UNCHECKED_CAST")
   val pathVars = request.getAttribute(
       org.springframework.web.servlet.HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE
   ) as? Map<String, String>
   val workspaceId = pathVars?.get("workspaceId")?.let {
       try { UUID.fromString(it) } catch (_: Exception) { null }
   }
   ```
   If workspaceId is null, still capture the event but without workspace association -- pass `null` and handle in the capture call. (Some endpoints like health or root may not have workspaceId.) Actually, since `PostHogService.capture()` requires a non-null `workspaceId: UUID`, skip the capture if workspaceId is null. Log at debug level: "Skipping PostHog capture: no workspaceId in path for ${request.method} ${request.requestURI}".

4. Extract error context from request attributes (set by ExceptionHandler):
   ```kotlin
   val errorClass = request.getAttribute("posthog.error.class") as? String
   val errorMessage = request.getAttribute("posthog.error.message") as? String
   ```

5. Build `ApiRequestEvent`:
   ```kotlin
   val statusCode = response.status
   val isError = statusCode >= 400
   val event = ApiRequestEvent(
       method = request.method,
       endpoint = endpoint,  // routeTemplate or normalized URI
       statusCode = statusCode,
       latencyMs = latencyMs,
       isError = isError,
       errorClass = if (isError) errorClass else null,
       errorMessage = if (isError) errorMessage else null
   )
   ```

6. Call `postHogService.capture(userId, workspaceId, event.eventName, event.properties)`. Wrap in try-catch to prevent any PostHogService failure from affecting the response (defense in depth -- PostHogService already swallows, but be safe):
   ```kotlin
   try {
       postHogService.capture(userId, workspaceId, event.eventName, event.properties)
   } catch (e: Exception) {
       logger.warn { "PostHog capture failed in filter: ${e.message}" }
   }
   ```

**`normalizeUri(uri: String)` private method** -- UUID fallback normalization:
```kotlin
private fun normalizeUri(uri: String): String =
    uri.replace(UUID_PATTERN, "{id}")

companion object {
    private val UUID_PATTERN = Regex("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
    private val EXCLUDED_PREFIXES = listOf(
        "/actuator", "/docs", "/public", "/api/auth", "/error", "/swagger-ui", "/v3/api-docs"
    )
}
```

Add KDoc on the class and on `doFilterInternal`.

**1b. Modify ExceptionHandler** at `src/main/kotlin/riven/core/exceptions/ExceptionHandler.kt`.

Add a `private fun storeExceptionForAnalytics(ex: Exception)` method that sets request attributes:
```kotlin
private fun storeExceptionForAnalytics(ex: Exception) {
    val requestAttributes = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()
        as? org.springframework.web.context.request.ServletRequestAttributes ?: return
    val request = requestAttributes.request
    request.setAttribute("posthog.error.class", ex::class.simpleName)
    request.setAttribute("posthog.error.message", ex.message ?: "Unknown error")
}
```

Call `storeExceptionForAnalytics(ex)` as the FIRST line in every existing `@ExceptionHandler` method (before the `return ErrorResponse(...)` block). There are 8 handler methods total:
- `handleAccessDeniedException`
- `handleInvalidRelationshipException`
- `handleSchemaValidationException`
- `handleAuthorizationDenied`
- `handleNotFoundException`
- `handleIllegalArgumentException`
- `handleConflictException`
- `handleConflictException` (UniqueConstraintViolationException)

Do NOT change any existing return values or error handling logic. Just add the one-line call at the top of each method.

**Commit message:** `feat(2-01): add PostHogCaptureFilter and wire exception context for error capture`
  </action>
  <verify>
    <automated>cd /home/jared/dev/worktrees/posthog/core && ./gradlew compileKotlin 2>&1 | tail -5</automated>
  </verify>
  <done>
    - PostHogCaptureFilter.kt exists in filter/analytics package with OncePerRequestFilter extension
    - shouldNotFilter excludes actuator, docs, public, auth, error, swagger-ui, v3/api-docs prefixes
    - doFilterInternal wraps chain.doFilter in try-finally, captures latency, extracts userId/workspaceId/endpoint/errors, fires PostHogService.capture()
    - UUID normalization regex replaces UUIDs with {id} in fallback path
    - ExceptionHandler stores exception class and message as request attributes for all 8 handlers
    - Project compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Register filter in PostHogConfiguration with FilterRegistrationBean</name>
  <files>
    src/main/kotlin/riven/core/configuration/analytics/PostHogConfiguration.kt
  </files>
  <action>
Add a `FilterRegistrationBean` to `PostHogConfiguration.kt` that registers `PostHogCaptureFilter` with the correct order and URL pattern.

Add a new section after the `// ------ Service Beans ------` section:

```kotlin
// ------ HTTP Filter ------

@Bean
fun postHogCaptureFilterRegistration(
    postHogService: PostHogService,
    logger: KLogger
): FilterRegistrationBean<PostHogCaptureFilter> {
    val filter = PostHogCaptureFilter(postHogService, logger)
    val registration = FilterRegistrationBean(filter)
    registration.order = -99  // After Spring Security (-100), so SecurityContext is populated
    registration.addUrlPatterns("/api/*")
    return registration
}
```

Key points:
- Order is `-99`, which is AFTER Spring Security's `FilterChainProxy` at `-100` (FILT-05). This ensures `SecurityContextHolder.getContext().authentication` is populated when the filter runs.
- URL pattern is `/api/*` to match all API routes. The `shouldNotFilter()` override handles fine-grained exclusion.
- The bean is NOT conditional on `riven.posthog.enabled` -- it always registers. When PostHog is disabled, the injected `PostHogService` is `NoOpPostHogService` (which just increments a counter). This means the filter still runs, extracting metadata, but the actual capture is a no-op. This is intentional: the filter overhead is negligible (nanoseconds of attribute reads), and having it always registered simplifies configuration.
- Constructor-inject both `PostHogService` (resolved to either impl or no-op by Spring) and `KLogger` (prototype-scoped from LoggerConfig).

Add the required imports at the top of the file:
```kotlin
import org.springframework.boot.web.servlet.FilterRegistrationBean
import riven.core.filter.analytics.PostHogCaptureFilter
```

**Commit message:** `feat(2-01): register PostHogCaptureFilter with FilterRegistrationBean at order -99`
  </action>
  <verify>
    <automated>cd /home/jared/dev/worktrees/posthog/core && ./gradlew compileKotlin 2>&1 | tail -5</automated>
  </verify>
  <done>
    - PostHogConfiguration has FilterRegistrationBean method that creates PostHogCaptureFilter
    - Filter order is -99 (after Spring Security at -100)
    - URL pattern is /api/*
    - Bean accepts PostHogService and KLogger as parameters (constructor injection)
    - No ConditionalOnProperty -- filter always registers, delegates to NoOpPostHogService when disabled
    - Project compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 3: Write comprehensive unit tests for PostHogCaptureFilter</name>
  <files>
    src/test/kotlin/riven/core/filter/analytics/PostHogCaptureFilterTest.kt
  </files>
  <action>
Create `PostHogCaptureFilterTest.kt` at `src/test/kotlin/riven/core/filter/analytics/`. This is a pure unit test (no Spring context, no `@SpringBootTest`) using `mockito-kotlin` and `MockHttpServletRequest`/`MockHttpServletResponse` from Spring Test.

**Setup:**
```kotlin
class PostHogCaptureFilterTest {

    private lateinit var postHogService: PostHogService
    private lateinit var logger: KLogger
    private lateinit var filter: PostHogCaptureFilter
    private lateinit var filterChain: FilterChain

    private val userId = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")
    private val workspaceId = UUID.fromString("a1b2c3d4-5e6f-7890-abcd-ef1234567890")

    @BeforeEach
    fun setup() {
        postHogService = mock()
        logger = mock()
        filter = PostHogCaptureFilter(postHogService, logger)
        filterChain = mock()
    }
```

Use a helper to create a request with JWT SecurityContext:
```kotlin
private fun createAuthenticatedRequest(
    method: String = "GET",
    uri: String = "/api/v1/$workspaceId/entities",
    routeTemplate: String? = "/api/v1/{workspaceId}/entities",
    pathVariables: Map<String, String>? = mapOf("workspaceId" to workspaceId.toString())
): MockHttpServletRequest {
    val request = MockHttpServletRequest(method, uri)
    routeTemplate?.let {
        request.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE, it)
    }
    pathVariables?.let {
        request.setAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, it)
    }
    return request
}
```

For setting up SecurityContext with a Jwt principal, use `SecurityContextHolder`:
```kotlin
private fun setSecurityContext(subjectId: UUID = userId) {
    val jwt = org.springframework.security.oauth2.jwt.Jwt.withTokenValue("test-token")
        .header("alg", "HS256")
        .subject(subjectId.toString())
        .build()
    val auth = org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken(jwt)
    SecurityContextHolder.getContext().authentication = auth
}

@AfterEach
fun clearSecurityContext() {
    SecurityContextHolder.clearContext()
}
```

Configure `filterChain.doFilter()` mock to set response status (simulating controller execution):
```kotlin
// For most tests, doFilter is a no-op (response defaults to 200)
// For error tests, configure it to set status in the mock answer
```

**Required tests (use `@Test` with backtick names):**

1. **`captures authenticated API request with correct event properties`** (FILT-01, FILT-02, FILT-03)
   - Set up authenticated request with SecurityContext, routeTemplate, pathVariables
   - Call `filter.doFilter(request, response, filterChain)`
   - Verify `postHogService.capture()` called once with: userId, workspaceId, `"\$api_request"`, and a properties map containing `method`, `endpoint` (route template), `statusCode` (200), `latencyMs` (>= 0), `isError` (false)
   - Use `argumentCaptor<Map<String, Any>>()` to inspect properties

2. **`uses route template as endpoint when available`** (FILT-02)
   - Request with routeTemplate = `/api/v1/{workspaceId}/entities/{id}`
   - Verify captured endpoint property equals the template string, NOT the raw URI

3. **`normalizes UUIDs in URI when route template is unavailable`** (FILT-04)
   - Request with `routeTemplate = null` (simulate 404 or unmapped path)
   - URI contains UUIDs: `/api/v1/a1b2c3d4-5e6f-7890-abcd-ef1234567890/entities/f8b1c2d3-4e5f-6789-abcd-ef0123456789`
   - Verify endpoint property is `/api/v1/{id}/entities/{id}`

4. **`skips actuator requests`** (FILT-06)
   - Request to `/actuator/health`
   - Verify `filter.doFilter()` still calls `filterChain.doFilter()` (request passes through)
   - Verify `postHogService.capture()` is NEVER called

5. **`skips swagger-ui requests`** (FILT-06)
   - Request to `/swagger-ui/index.html`
   - Verify capture is never called

6. **`skips docs requests`** (FILT-06)
   - Request to `/docs/openapi.json`
   - Verify capture is never called

7. **`skips unauthenticated requests silently`** (FILT-03)
   - Do NOT set SecurityContext
   - Call doFilter
   - Verify `filterChain.doFilter()` IS called (request passes through)
   - Verify `postHogService.capture()` is NEVER called (no userId = no capture)

8. **`includes error context on 4xx responses`** (FILT-07)
   - Set response status to 404
   - Set request attributes: `posthog.error.class` = `"NotFoundException"`, `posthog.error.message` = `"Entity not found"`
   - Configure `filterChain` mock to set `response.status = 404` and the request attributes during `doFilter`
   - Verify captured properties include `isError=true`, `errorClass="NotFoundException"`, `errorMessage="Entity not found"`

9. **`includes error context on 5xx responses`** (FILT-07)
   - Similar to above but with status 500, `errorClass="RuntimeException"`

10. **`does not include error context on 2xx responses`** (FILT-07)
    - Status 200, no error attributes
    - Verify `isError=false`, no `errorClass` key, no `errorMessage` key in properties

11. **`skips capture when workspaceId is not in path`** (FILT-03)
    - Authenticated request but pathVariables is null or does not contain `workspaceId`
    - Verify capture is NOT called (PostHogService.capture requires non-null workspaceId)

12. **`measures latency in milliseconds`** (FILT-02)
    - Configure `filterChain.doFilter()` mock to sleep 50ms (or use `Thread.sleep(50)` in the answer)
    - Verify `latencyMs` property is >= 50 (not zero)

Use `mockito-kotlin` throughout: `mock()`, `whenever()`, `verify()`, `argumentCaptor()`, `any()`, `eq()`, `never()`. Import from `org.mockito.kotlin.*`.

**Commit message:** `test(2-01): add unit tests for PostHogCaptureFilter`
  </action>
  <verify>
    <automated>cd /home/jared/dev/worktrees/posthog/core && ./gradlew test --tests "riven.core.filter.analytics.PostHogCaptureFilterTest" 2>&1 | tail -20</automated>
  </verify>
  <done>
    - PostHogCaptureFilterTest.kt exists with 12 unit tests
    - Tests cover: authenticated capture, route template endpoint, UUID normalization, excluded routes (actuator, swagger, docs), unauthenticated skip, error context on 4xx/5xx, no error context on 2xx, workspaceId-missing skip, latency measurement
    - All tests pass with ./gradlew test
    - No network calls made (pure mock-based tests)
  </done>
</task>

</tasks>

<verification>
After all tasks complete, run the full verification suite:

1. **Compilation**: `./gradlew compileKotlin compileTestKotlin` -- must succeed with zero errors
2. **All tests**: `./gradlew test` -- all existing + new tests pass
3. **Filter tests specifically**: `./gradlew test --tests "riven.core.filter.analytics.PostHogCaptureFilterTest"` -- 12/12 pass
4. **No PostHog network calls in test**: grep test output for any HTTP connection errors to `us.i.posthog.com` -- should find none (NoOpPostHogService is injected)
5. **File existence check**: confirm all 4 files exist at their expected paths
</verification>

<success_criteria>
- PostHogCaptureFilter extends OncePerRequestFilter and fires $api_request events (FILT-01)
- Events contain method, route template endpoint, status code, latency ms (FILT-02)
- userId extracted from JWT SecurityContext as distinctId, workspaceId from URI template variables (FILT-03)
- UUID normalization via regex fallback when route template unavailable (FILT-04)
- Filter order -99 ensures SecurityContext is populated (FILT-05)
- shouldNotFilter excludes actuator, swagger, docs, auth, error, public routes (FILT-06)
- 4xx/5xx responses include errorClass and errorMessage from ExceptionHandler request attributes (FILT-07)
- application-test.yml already has riven.posthog.enabled=false from Phase 1 (TEST-01)
- NoOpPostHogService is injected when disabled -- no SDK instantiation (TEST-02)
- ./gradlew test passes with zero failures
- ./gradlew build succeeds
</success_criteria>

<output>
After completion, create `.planning/phases/2/2-01-SUMMARY.md`
</output>
