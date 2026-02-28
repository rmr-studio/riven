# Technology Stack: PostHog Server-Side Integration

**Project:** PostHog analytics integration for Riven Core (Spring Boot 3.5.3 / Kotlin 2.1.21)
**Researched:** 2026-02-28
**Scope:** Analytics SDK addition only — existing stack is unchanged

---

## IMPORTANT: Version Verification Required

Web search and WebFetch tools were unavailable during this research session. The PostHog Java SDK version
cited below (`3.x`) is from training data (knowledge cutoff: August 2025). Before adding the dependency,
verify the current release at:

- https://central.sonatype.com/artifact/com.posthog.java/posthog (Maven Central)
- https://github.com/PostHog/posthog-java/releases (GitHub Releases)
- https://posthog.com/docs/libraries/java (Official docs)

**Confidence on SDK existence and group/artifact ID:** HIGH (stable, well-established library)
**Confidence on exact version number:** LOW (not verified against live registry)

---

## Recommended Stack

### Core Addition: PostHog Java SDK

| Technology | Coordinates | Version | Purpose | Why |
|------------|-------------|---------|---------|-----|
| PostHog Java SDK | `com.posthog.java:posthog` | `3.x` (VERIFY) | Analytics event capture | Official SDK; only supported path per PROJECT.md constraint |

**Confidence:** MEDIUM — group ID and artifact ID are stable and well-established. Version requires live
verification before pinning in `build.gradle.kts`.

### No Additional Dependencies Required

The PostHog Java SDK is self-contained. It does not require:
- A separate HTTP client (it bundles its own)
- A separate async library (it has an internal queue with background flushing)
- A Spring Boot auto-configuration starter (none exists; manual `@Bean` registration is the pattern)

The existing stack already provides everything else needed:
- **Async dispatch**: The SDK's internal queue handles batching and async HTTP dispatch. No additional
  executor framework or reactive dependency is needed.
- **Configuration binding**: Spring Boot's `@ConfigurationProperties` handles env var binding (already
  in use in `ApplicationConfigurationProperties.kt`).
- **Constructor injection**: Standard Spring pattern already used throughout the codebase.

---

## Gradle Dependency

```kotlin
// build.gradle.kts — add to dependencies block

// PostHog Analytics
implementation("com.posthog.java:posthog:3.x") // VERIFY version at Maven Central before pinning
```

**Note on version pinning:** Pin to an exact version (e.g. `3.1.0`), not a range. The project does not
use a BOM for PostHog, so a floating range would be resolved at build time and produce non-reproducible
builds.

---

## Spring Boot Integration Pattern

There is no official Spring Boot starter for PostHog. The correct integration pattern is:

### 1. Configuration Bean (`@Configuration`)

Register the `PostHog` client as a singleton Spring bean. Add to an existing config class rather than
creating a new one — the `configuration/` package already hosts `ObjectMapperConfig`, `LoggerConfig`,
etc. A new `AnalyticsConfig` class is warranted given the distinct infrastructure concern.

```kotlin
// configuration/AnalyticsConfig.kt

@Configuration
class AnalyticsConfig(
    private val properties: ApplicationConfigurationProperties
) {
    @Bean
    fun postHog(): PostHog {
        return PostHog.Builder(properties.posthogApiKey)
            .host("https://app.posthog.com") // or EU: "https://eu.posthog.com"
            .build()
    }
}
```

**Confidence:** HIGH — this is the standard pattern from PostHog official docs and matches the existing
codebase convention (constructor injection, `@Configuration` in `configuration/` package).

### 2. Environment Variable Configuration

Add to `application.yml` (following existing env var pattern in the codebase):

```yaml
riven:
  posthog-api-key: ${POSTHOG_API_KEY}
  posthog-host: ${POSTHOG_HOST:https://app.posthog.com}
```

Add corresponding fields to `ApplicationConfigurationProperties.kt`:

```kotlin
val posthogApiKey: String
val posthogHost: String = "https://app.posthog.com"
```

**Confidence:** HIGH — matches existing codebase configuration pattern exactly.

### 3. Service Wrapper

Wrap `PostHog` in a `PostHogService` rather than injecting the SDK client directly into filters/services.
This follows the codebase convention (thin service wrappers for infrastructure clients) and makes the
analytics layer mockable in tests.

```kotlin
// service/analytics/PostHogService.kt

@Service
class PostHogService(
    private val postHog: PostHog,
    private val logger: KLogger
) {
    fun capture(distinctId: String, event: String, properties: Map<String, Any?> = emptyMap()) {
        try {
            postHog.capture(distinctId, event, properties)
        } catch (e: Exception) {
            logger.warn(e) { "PostHog capture failed for event=$event" }
        }
    }
}
```

**Confidence:** HIGH — matches service layer patterns in the codebase.

### 4. HTTP Filter

A `OncePerRequestFilter` captures all API requests without per-endpoint code:

```kotlin
// filter/PostHogAnalyticsFilter.kt

@Component
class PostHogAnalyticsFilter(
    private val postHogService: PostHogService
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val start = System.currentTimeMillis()
        try {
            filterChain.doFilter(request, response)
        } finally {
            val latencyMs = System.currentTimeMillis() - start
            // Extract userId and workspaceId from security context after filter chain
            postHogService.capture(
                distinctId = resolveUserId(request),
                event = "api_request",
                properties = mapOf(
                    "endpoint" to request.requestURI,
                    "method" to request.method,
                    "status_code" to response.status,
                    "latency_ms" to latencyMs,
                    "workspace_id" to resolveWorkspaceId(request)
                )
            )
        }
    }
}
```

**Confidence:** HIGH — `OncePerRequestFilter` is the standard Spring mechanism for request-scoped
cross-cutting concerns. The pattern is well-established.

---

## Async Dispatch: SDK Internal Queue

The PostHog Java SDK queues events internally and flushes them to PostHog Cloud on a background thread.
This means:

- `postHog.capture(...)` returns immediately — it does not block on HTTP
- The filter adds no meaningful latency to API responses (satisfies the performance constraint)
- No separate `@Async`, `CompletableFuture`, or coroutine wrapper is needed

**Confidence:** HIGH — this is the documented architecture of the PostHog Java SDK. Confirmed in
PostHog's Java SDK README (training data).

### Graceful Shutdown

The SDK client must be shut down on application stop to flush the in-memory queue:

```kotlin
// In AnalyticsConfig.kt, mark the bean for destroy:

@Bean(destroyMethod = "shutdown")
fun postHog(): PostHog { ... }
```

This ensures events buffered at shutdown are flushed before the JVM exits.

**Confidence:** HIGH — `destroyMethod` is a standard Spring `@Bean` lifecycle hook.

---

## What NOT to Use

| Approach | Why Not |
|----------|---------|
| Custom HTTP client (OkHttp, WebClient, Ktor) to call PostHog REST API directly | Violates PROJECT.md constraint: "Must use the official PostHog Java SDK". Also re-implements retry, batching, and queue logic the SDK already handles. |
| Micrometer/Actuator metrics forwarded to PostHog | Wrong layer: Actuator metrics are operational (JVM, DB pool), not product analytics. PostHog wants user-level behavioral events, not infrastructure counters. |
| PostHog JavaScript snippet (server-side rendering) | N/A — this is a REST API, not a web server rendering HTML. |
| Third-party Spring Boot PostHog starters | None are officially maintained; the SDK is simple enough that a custom `@Bean` is preferred over an unmaintained community starter. |
| Spring `@Async` / CompletableFuture wrapper around SDK | Unnecessary overhead — the SDK already dispatches asynchronously via its internal queue. Wrapping it would create a thread-per-event pattern that is strictly worse. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Analytics SDK | `com.posthog.java:posthog` | Segment Java SDK | Project specifies PostHog; not a choice to revisit |
| PostHog deployment | Cloud | Self-hosted | Explicitly out of scope per PROJECT.md |
| Event dispatch | SDK internal queue (async) | Manual `@Async` executor | SDK already handles this; double-wrapping adds complexity with no benefit |
| Integration point | `OncePerRequestFilter` | Spring AOP interceptor | Filter is lower-level, runs for all requests regardless of mapped controller method; AOP requires pointcut expressions that can miss edge cases (404, unauthenticated requests) |
| Config registration | `@Configuration` `@Bean` | Spring Boot auto-configuration `@ConditionalOnProperty` | Overkill for a single client with no conditional behavior needed |

---

## Version Verification Checklist

Before implementation, confirm:

- [ ] Current stable version of `com.posthog.java:posthog` at https://central.sonatype.com/artifact/com.posthog.java/posthog
- [ ] No breaking API changes in the `Builder` / `capture()` interface between training-data version and current
- [ ] PostHog Cloud host URL is still `https://app.posthog.com` (EU users: `https://eu.posthog.com`)
- [ ] `shutdown()` is still the correct lifecycle method name on the current SDK version

---

## Sources

| Source | Confidence | Notes |
|--------|------------|-------|
| PostHog Java SDK README (github.com/PostHog/posthog-java) | MEDIUM | Training data only — verify current |
| PostHog official docs /libraries/java | MEDIUM | Training data only — verify current |
| Maven Central (com.posthog.java:posthog) | LOW | Not queried — web access unavailable |
| Spring Boot `OncePerRequestFilter` docs | HIGH | Stable Spring API, well-documented |
| Spring `@Bean` destroyMethod lifecycle | HIGH | Stable Spring API |
| PROJECT.md constraints | HIGH | Read directly from project file |
| Existing codebase patterns (build.gradle.kts, ApplicationConfigurationProperties) | HIGH | Read directly from source |
