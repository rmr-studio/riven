# Architecture Patterns: PostHog Server-Side Analytics Integration

**Domain:** Server-side analytics instrumentation in a Spring Boot 3.5.3 + Kotlin backend
**Researched:** 2026-02-28
**Confidence:** MEDIUM — PostHog Java SDK patterns verified from training data (Aug 2025 cutoff); Spring Boot filter patterns are HIGH confidence from official Spring documentation. SDK-specific API surface should be validated against current PostHog Java docs before implementation.

---

## Recommended Architecture

The integration spans three new components that slot into the existing layered architecture without modifying any existing layer:

```
Incoming HTTP Request
        │
        ▼
┌───────────────────────────────────────────────────┐
│  PostHogCaptureFilter  (jakarta.servlet.Filter)   │  ← NEW
│  - Wraps request/response via ContentCachingX     │
│  - Records method, URI pattern, status, latency   │
│  - Extracts userId + workspaceId from JWT context │
│  - Delegates capture to PostHogService (async)    │
└───────────────────────────────────────────────────┘
        │  (calls, fire-and-forget)
        ▼
┌───────────────────────────────────────────────────┐
│  PostHogService  (Spring @Service)                │  ← NEW
│  - Wraps PostHog Java SDK client                  │
│  - Exposes capture(event, userId, properties)     │
│  - Handles SDK client lifecycle                   │
│  - Swallows/logs SDK errors to prevent leakage    │
└───────────────────────────────────────────────────┘
        │  (SDK call, async internally)
        ▼
┌───────────────────────────────────────────────────┐
│  PostHog Java SDK (PostHog client bean)           │  ← NEW (SDK managed)
│  - Batches events internally                      │
│  - Dispatches to PostHog Cloud API asynchronously │
│  - Managed as singleton @Bean via PostHogConfig   │
└───────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Package | Responsibility | Communicates With |
|-----------|---------|---------------|-------------------|
| `PostHogConfigurationProperties` | `configuration.properties` | Binds `riven.posthog.*` env vars (api-key, host, enabled flag) | Spring boot context only |
| `PostHogConfiguration` | `configuration.analytics` | Creates `PostHog` SDK singleton bean; enables/disables via flag | `PostHogConfigurationProperties` |
| `PostHogService` | `service.analytics` | Wraps SDK client, exposes `capture()` method, handles errors silently | `PostHog` SDK bean |
| `PostHogCaptureFilter` | `filter.analytics` | Intercepts every `/api/v1/**` request; resolves user context; calls `PostHogService` | `PostHogService`, `SecurityContextHolder` |

No new controllers, repositories, JPA entities, or domain models are required. This is an instrumentation layer only.

---

## Data Flow

### Request → PostHog Event (HTTP Filter Path)

```
1. Client sends: POST /api/v1/{workspaceId}/entities
2. Spring Security filter chain runs → JWT validated → SecurityContext populated
3. PostHogCaptureFilter.doFilter() executes AFTER auth filters:
   a. Record start = System.currentTimeMillis()
   b. Wrap response in ContentCachingResponseWrapper
   c. chain.doFilter(request, response)  ← actual request processing happens here
   d. Record latency = System.currentTimeMillis() - start
   e. Extract userId from SecurityContextHolder (JWT sub claim, may be null for unauthenticated)
   f. Extract workspaceId from URI path pattern (regex or AntPathMatcher)
   g. Build properties map: endpoint, method, statusCode, latency, workspaceId
   h. Call postHogService.capture("api_request", userId, properties)  ← non-blocking
4. PostHogService.capture():
   a. If disabled → return immediately
   b. SDK client.capture(distinctId, eventName, properties)  ← SDK queues internally
   c. SDK batch thread dispatches to PostHog Cloud on its own schedule
5. Response returned to client (steps 3h and 4 do not block response)
```

**Critical ordering constraint:** The filter must run AFTER the Spring Security filter chain so that `SecurityContextHolder` is populated when the filter reads userId. This is achieved by registering the filter with `@Order(Ordered.LOWEST_PRECEDENCE)` or after `SecurityConfig`'s filter chain order.

### URI Pattern Normalisation

Raw URIs contain UUIDs that would produce high-cardinality PostHog event names and break aggregation. The filter must normalise before capturing:

```
/api/v1/550e8400.../entities/9b1deb4d...  →  /api/v1/{workspaceId}/entities/{entityId}
```

Use `AntPathMatcher` or a small regex replace to swap UUID segments with named placeholders. This produces low-cardinality `endpoint` values that PostHog can meaningfully aggregate.

### Authenticated vs Unauthenticated Requests

- **Authenticated request:** `userId` = UUID from `SecurityContextHolder` JWT `sub` claim. Use as PostHog `distinctId`.
- **Unauthenticated request** (e.g. `/actuator/**`, `/docs/**`): `userId` is null. Use `"anonymous"` as `distinctId` or skip capture entirely. Recommendation: skip — unauthenticated traffic is not user-attributable and pollutes analytics.

---

## How This Fits Into the Existing Layered Architecture

```
Existing layers (unchanged):
  Controller → Service → Repository → JPA Entity

New analytics layer (orthogonal, not in the call chain):
  PostHogCaptureFilter (runs alongside the controller layer, not inside it)
       ↓
  PostHogService (peer of other @Service beans, no @PreAuthorize needed)
       ↓
  PostHog SDK bean (peer of Supabase, Temporal config beans)
```

**Key principle:** The analytics layer is entirely cross-cutting. It does not depend on any domain service, does not write to PostgreSQL, and cannot affect request processing. It is safe-to-fail by design.

### Why a Filter, Not an Interceptor or AOP

| Mechanism | Accesses response status | Accesses latency | Works with Spring Security | Fits existing codebase |
|-----------|------------------------|-----------------|---------------------------|----------------------|
| `jakarta.servlet.Filter` | Yes (after chain) | Yes | Yes (ordered after security chain) | Yes — SecurityConfig already adds filters |
| Spring `HandlerInterceptor` | No (status not yet written at `postHandle`) | Yes | Partial | Possible but incomplete |
| Spring AOP `@Around` on controllers | No (response body, not HTTP status) | Yes | Partial | Not idiomatic for HTTP observability |

**Use a `jakarta.servlet.Filter` registered as a `FilterRegistrationBean`.** This is what `SecurityConfig` already uses for CORS; it's the established pattern.

---

## Package Structure

Following the existing convention `riven.core.{layer}.{domain}`:

```
src/main/kotlin/riven/core/
├── configuration/
│   ├── analytics/
│   │   └── PostHogConfiguration.kt          ← @Configuration, creates PostHog bean
│   └── properties/
│       └── PostHogConfigurationProperties.kt ← @ConfigurationProperties(prefix = "riven.posthog")
├── filter/
│   └── analytics/
│       └── PostHogCaptureFilter.kt           ← jakarta.servlet.Filter implementation
└── service/
    └── analytics/
        └── PostHogService.kt                 ← @Service wrapping SDK client
```

**Note on `filter/` package:** No filter package currently exists. The new `filter.analytics` sub-package is the right home per the `riven.core.{layer}.{domain}` convention. Do not put the filter in `configuration/` — it is a runtime component, not a bean configuration.

---

## Patterns to Follow

### Pattern 1: ConfigurationProperties for SDK credentials

Follow the `NangoConfigurationProperties` / `NangoClientConfiguration` pattern exactly.

```kotlin
// riven.core.configuration.properties.PostHogConfigurationProperties
@ConfigurationProperties(prefix = "riven.posthog")
data class PostHogConfigurationProperties(
    val apiKey: String = "",
    val host: String = "https://app.posthog.com",
    val enabled: Boolean = true,
    val flushAt: Int = 20,          // SDK batch size
    val flushIntervalSeconds: Int = 30   // SDK flush interval
)
```

**application.yml addition:**
```yaml
riven:
  posthog:
    api-key: ${POSTHOG_API_KEY:}
    host: ${POSTHOG_HOST:https://app.posthog.com}
    enabled: ${POSTHOG_ENABLED:true}
```

### Pattern 2: PostHog SDK bean as a singleton

```kotlin
// riven.core.configuration.analytics.PostHogConfiguration
@Configuration
@EnableConfigurationProperties(PostHogConfigurationProperties::class)
class PostHogConfiguration {

    @Bean
    fun postHog(properties: PostHogConfigurationProperties): PostHog {
        return PostHog.Builder(properties.apiKey)
            .host(properties.host)
            .flushAt(properties.flushAt)
            .flushInterval(properties.flushIntervalSeconds, TimeUnit.SECONDS)
            .build()
    }
}
```

The SDK client manages its own internal async queue and background flush thread. No `@Async` or `CompletableFuture` is needed in `PostHogService` — the SDK is already non-blocking from the caller's perspective.

### Pattern 3: PostHogService — thin wrapper, safe-to-fail

```kotlin
// riven.core.service.analytics.PostHogService
@Service
class PostHogService(
    private val logger: KLogger,
    private val postHog: PostHog,
    private val properties: PostHogConfigurationProperties
) {

    /**
     * Captures an analytics event for the given user. Swallows all SDK errors
     * to prevent analytics failures from affecting request processing.
     */
    fun capture(event: String, distinctId: UUID, properties: Map<String, Any?>) {
        if (!this.properties.enabled) return
        try {
            postHog.capture(distinctId.toString(), event, properties)
        } catch (ex: Exception) {
            logger.warn { "PostHog capture failed for event '$event': ${ex.message}" }
        }
    }
}
```

**No @PreAuthorize on PostHogService.** It is not workspace-scoped data access; it is outbound telemetry. Access control does not apply.

### Pattern 4: PostHogCaptureFilter — request interception

```kotlin
// riven.core.filter.analytics.PostHogCaptureFilter
@Component
class PostHogCaptureFilter(
    private val postHogService: PostHogService,
    private val logger: KLogger
) : Filter {

    // UUIDs are 8-4-4-4-12 hex characters
    private val uuidPattern = Regex(
        "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        RegexOption.IGNORE_CASE
    )

    override fun doFilter(
        request: ServletRequest,
        response: ServletResponse,
        chain: FilterChain
    ) {
        val httpRequest = request as HttpServletRequest
        val httpResponse = response as HttpServletResponse
        val start = System.currentTimeMillis()

        chain.doFilter(request, response)   // processing happens here

        captureRequest(httpRequest, httpResponse, System.currentTimeMillis() - start)
    }

    private fun captureRequest(
        request: HttpServletRequest,
        response: HttpServletResponse,
        latencyMs: Long
    ) {
        val userId = resolveUserId() ?: return   // skip unauthenticated requests
        val normalizedUri = normalizeUri(request.requestURI)

        val properties = mapOf(
            "endpoint" to normalizedUri,
            "method" to request.method,
            "status_code" to response.status,
            "latency_ms" to latencyMs,
            "workspace_id" to extractWorkspaceId(request.requestURI)
        )

        postHogService.capture("api_request", userId, properties)
    }

    private fun resolveUserId(): UUID? {
        val auth = SecurityContextHolder.getContext().authentication ?: return null
        val jwt = auth.principal as? Jwt ?: return null
        return jwt.claims["sub"]?.let { runCatching { UUID.fromString(it.toString()) }.getOrNull() }
    }

    private fun normalizeUri(uri: String): String =
        uuidPattern.replace(uri, "{id}")

    private fun extractWorkspaceId(uri: String): String? {
        // /api/v1/{workspaceId}/... — workspaceId is the 4th segment
        val segments = uri.split("/")
        return segments.getOrNull(3)
    }
}
```

**Registration in SecurityConfig or a dedicated FilterConfig:**

```kotlin
@Bean
fun postHogFilterRegistration(filter: PostHogCaptureFilter): FilterRegistrationBean<PostHogCaptureFilter> {
    return FilterRegistrationBean(filter).apply {
        addUrlPatterns("/api/v1/*")
        order = Ordered.LOWEST_PRECEDENCE   // run last, after security filters
    }
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling PostHogService from domain services

**What:** Injecting `PostHogService` into `EntityService`, `BlockEnvironmentService`, etc. to capture domain-level events.

**Why bad:** Entangles analytics with business logic. If PostHog is unreachable or the SDK throws, it pollutes `@Transactional` boundaries, potentially causing rollbacks. Domain services would grow cross-cutting concerns they shouldn't own.

**Instead:** The HTTP filter handles 100% of coverage for Phase 1. Explicit domain events (future Phase 2) should be added via a separate event-publishing pattern — `ApplicationEventPublisher` with async `@EventListener` — not direct service injection.

### Anti-Pattern 2: Blocking response completion on PostHog dispatch

**What:** Calling `postHog.capture()` and awaiting a flush before returning the HTTP response.

**Why bad:** Adds latency for every request proportional to network I/O to PostHog Cloud. Under PostHog Cloud outage, all API requests slow or fail.

**Instead:** The PostHog Java SDK batches internally and flushes on its own background thread. Never call `postHog.flush()` synchronously in the filter.

### Anti-Pattern 3: High-cardinality event names from raw URIs

**What:** Storing `/api/v1/550e8400.../entities/9b1deb4d...` as the endpoint property.

**Why bad:** Every unique UUID combination produces a distinct event signature in PostHog. Aggregation, funnels, and trends become meaningless.

**Instead:** Normalise URI segments containing UUIDs to `{id}` before capture. The filter does this via regex substitution on the raw URI.

### Anti-Pattern 4: Placing PostHog credentials in source code or application.yml literals

**What:** Hardcoding `apiKey = "phc_..."` in any configuration file.

**Why bad:** API key committed to source control is exposed in repository history permanently.

**Instead:** Bind via environment variable: `${POSTHOG_API_KEY:}` in application.yml. The empty default means the application starts safely (analytics disabled) if the key is not set.

### Anti-Pattern 5: Registering the filter before Spring Security's filter chain

**What:** Declaring `order = Ordered.HIGHEST_PRECEDENCE` on the `FilterRegistrationBean`.

**Why bad:** The filter attempts to read `SecurityContextHolder` before JWT validation has populated it. `resolveUserId()` returns null for all requests, making userId capture impossible.

**Instead:** Use `order = Ordered.LOWEST_PRECEDENCE` so the filter runs after the full security chain.

---

## Scalability Considerations

| Concern | At current scale | If volume grows significantly |
|---------|-----------------|------------------------------|
| SDK batch flush | Default `flushAt=20`, `flushInterval=30s` is sufficient | Increase `flushAt` to reduce HTTP round-trips to PostHog Cloud |
| Filter overhead | UUID regex replace is O(n) on URI length — negligible | No change needed; URI lengths are bounded |
| PostHog Cloud rate limits | Free/standard tier is generous for internal tool traffic | Upgrade PostHog plan; no code change needed |
| SecurityContext thread safety | `SecurityContextHolder` default is `ThreadLocal` — safe per-request | Safe; Spring Boot's default threading model preserves this |

---

## Dependency Addition

The PostHog Java SDK must be added to `build.gradle.kts`. Discuss with the team before adding (per CLAUDE.md always-perform list).

```kotlin
// PostHog Java SDK — server-side analytics
implementation("com.posthog.java:posthog:1.1.0")
```

**Confidence note (MEDIUM):** The artifact coordinates `com.posthog.java:posthog` and version `1.1.0` are from training data (Aug 2025). Verify the current version at [Maven Central](https://central.sonatype.com/artifact/com.posthog.java/posthog) before adding. The groupId and artifactId are stable; the version requires confirmation.

---

## Integration With `ActivityService`

The two systems are fully independent:

| Concern | `ActivityService` | `PostHogService` |
|---------|-----------------|-----------------|
| Purpose | Audit trail — what business operations happened | Analytics — how the API is used operationally |
| Storage | PostgreSQL `activity_logs` table | PostHog Cloud (external) |
| Trigger | Explicit calls in domain service methods | HTTP filter — automatic for every request |
| User visibility | Potentially exposed to workspace members | Internal team only |
| Workspace scoping | Workspace-scoped, RLS-protected | Workspace context captured as property only |
| Failure handling | Must succeed (transactional, rolled back on failure) | Must not fail silently-swallowed; never throws |

They do not share code, beans, or interfaces. Adding PostHog does not require modifying `ActivityService` in any way.

---

## Sources

- PostHog Java SDK — training knowledge (Aug 2025 cutoff) — MEDIUM confidence. Verify: https://posthog.com/docs/libraries/java
- Spring Boot `jakarta.servlet.Filter` and `FilterRegistrationBean` — HIGH confidence (stable Spring API)
- `SecurityContextHolder` threading model — HIGH confidence (Spring Security core, unchanged across versions)
- Existing codebase patterns: `NangoClientConfiguration`, `NangoConfigurationProperties`, `SecurityConfig`, `AuthTokenService`, `ActivityService` — HIGH confidence (read directly from source)
- `application.yml` env-var binding conventions — HIGH confidence (read directly from source)
