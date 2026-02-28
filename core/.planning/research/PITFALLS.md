# Domain Pitfalls: PostHog Server-Side Integration in Spring Boot

**Domain:** PostHog Java SDK + Spring Boot 3.5.3 / Kotlin HTTP filter analytics
**Researched:** 2026-02-28
**Confidence note:** PostHog Java SDK internals (MEDIUM — training data, SDK behavior documented in public source). Spring Boot filter/security integration (HIGH — well-established patterns). Spring Security thread propagation (HIGH — official Spring documentation).

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or production incidents.

---

### Pitfall 1: SecurityContext Is Thread-Local — Async Dispatch Loses userId and workspaceId

**What goes wrong:** The HTTP filter captures the request on the servlet thread. If you extract `userId` and `workspaceId` from `SecurityContextHolder` and then dispatch the PostHog event on a different thread (e.g., a `CompletableFuture`, Spring `@Async`, or a Kotlin coroutine on a different dispatcher), the `SecurityContextHolder` context is absent. The event either fails to capture the user identity or throws an `AccessDeniedException` inside the async block.

**Why it happens:** `SecurityContextHolder` defaults to `MODE_THREADLOCAL`. The security context is bound to the HTTP servlet thread only. Any async handoff — even `CompletableFuture.runAsync {}` — crosses to a thread that has no security context unless it is explicitly propagated.

**Consequences:**
- All events sent to PostHog have `null` or missing `distinct_id` (the userId).
- Events grouped by `workspaceId` fail silently, producing ungrouped analytics.
- If the async block calls `authTokenService.getUserId()` instead of reading pre-extracted values, it throws `AccessDeniedException` and the event is silently dropped.

**Prevention:**
- Extract `userId` and `workspaceId` as local `val` assignments **on the servlet thread** — before any async handoff — and capture them in the lambda/coroutine closure.
- Never call `authTokenService.getUserId()` or `SecurityContextHolder.getContext()` from inside an async block in the filter.
- The safe pattern: extract at `doFilter()` entry, pass extracted values into the async dispatch:

```kotlin
// SAFE: extract synchronously on servlet thread
val userId = extractUserId(request)       // reads SecurityContext here
val workspaceId = extractWorkspaceId(request)

// SAFE: pass extracted values into async block — never read SecurityContext inside
CompletableFuture.runAsync {
    postHogService.capture(userId, workspaceId, eventName, properties)
}
```

**Warning signs:**
- PostHog events arriving with `distinct_id` = `null` or `anonymous`.
- `AccessDeniedException` stack traces in logs originating from filter or async threads.
- Events show up in PostHog but have no user-level properties.

**Phase:** Address in the initial filter implementation phase — this is the foundational design decision.

---

### Pitfall 2: Synchronous Event Dispatch Adds Latency to Every API Request

**What goes wrong:** If `PostHog.capture()` is called synchronously on the request thread — or if the PostHog SDK's internal HTTP dispatch is called in a way that blocks — every API response is held until the analytics network call completes. At a minimum this adds 20-200ms to every request. Under load or PostHog Cloud degradation, it blocks the thread pool entirely.

**Why it happens:** The PostHog Java SDK internally batches events on a background thread with a queue, but if the SDK client is misconfigured (`flushAt = 1` or `flushInterval` set very low) or if the caller wraps the capture in a synchronous flush, it becomes blocking. Additionally, calling `posthog.flush()` from within the request path causes an explicit synchronous drain.

**Consequences:**
- API p99 latency increases noticeably on all endpoints.
- Under PostHog Cloud network latency spikes, the servlet thread pool exhausts.
- Temporal workflow activities that call the API can time out if latency bleeds into their window.

**Prevention:**
- Use `PostHog.capture()` only — never `flush()` — from within the filter or any request-path code.
- Verify the SDK is configured with a queue size (`flushAt`) of at least 20 and a `flushInterval` of at least 10 seconds so that batching absorbs traffic.
- Dispatch the `capture()` call itself to a dedicated Spring `TaskExecutor` or Kotlin's `Dispatchers.IO` if there is any doubt about the SDK's internal threading — though for well-configured SDKs this is not required.
- Never call `posthog.flush()` from within a servlet filter. Reserve it for `@PreDestroy` shutdown only.

**Warning signs:**
- API latency increases after adding the filter (measure with Actuator metrics before and after).
- Thread pool exhaustion under load (`HikariPool` or Tomcat thread pool metrics spike).
- Slow request logs for endpoints that previously completed in <10ms.

**Phase:** Address during filter implementation. Measure latency impact with a load test before committing the filter to production.

---

### Pitfall 3: PostHog SDK Not Shut Down on Application Shutdown — In-Flight Events Lost

**What goes wrong:** The PostHog Java SDK maintains an internal in-memory event queue and a background flush thread. If the Spring application context is shut down without explicitly calling `posthog.shutdown()`, the queue is discarded. Events captured in the seconds before shutdown — including the final requests before a rolling deploy — are lost silently.

**Why it happens:** The SDK background thread is not a Spring-managed bean lifecycle component. Spring's `@PreDestroy` and `DisposableBean` hooks are not automatically wired to the SDK's internal flush/shutdown mechanism. If the SDK instance is constructed as a raw `PostHog(...)` object in a `@Bean`, its `shutdown()` method will not be called during context destruction unless explicitly registered.

**Consequences:**
- Analytics gaps around deployment windows (most likely during rolling restarts).
- The SDK background thread may continue running briefly after Spring context shutdown, causing resource leaks in containerized environments.
- If the JVM exits abruptly (OOM, SIGKILL), the queue is always lost — this is unavoidable, but `shutdown()` handles graceful termination cases.

**Prevention:**
- Register the `PostHog` instance as a Spring `@Bean` and implement `DisposableBean` or annotate the `@Bean` method's close action:

```kotlin
@Bean(destroyMethod = "shutdown")
fun postHogClient(properties: PostHogConfigurationProperties): PostHog {
    return PostHog.Builder(properties.apiKey)
        .host(properties.host)
        .flushAt(properties.flushAt)
        .flushInterval(properties.flushInterval)
        .build()
}
```

- Alternatively, implement `DisposableBean.destroy()` in the `PostHogService` wrapper and call `client.shutdown()` from there.
- The `destroyMethod = "shutdown"` approach on `@Bean` is the simplest and most idiomatic Spring pattern.

**Warning signs:**
- Events appear to stop arriving in PostHog during deployments.
- PostHog dashboard shows gaps correlated with deploy timestamps.
- No `shutdown()` call visible in the configuration bean.

**Phase:** Address in the initial SDK configuration phase, before any filter or service code is written.

---

### Pitfall 4: PII and Sensitive Data Leaking into PostHog Properties

**What goes wrong:** The HTTP filter constructs event properties from the request. If it captures request headers, path variables, query parameters, or request body fragments, it may inadvertently send PII (user emails, entity IDs that resolve to personal data, workspace names, JWT fragments in headers, Supabase keys in `Authorization` headers) to PostHog Cloud.

**Why it happens:** It is tempting to log request properties broadly ("capture everything and filter later"). The `Authorization` header contains the full JWT. Query parameters on `/api/v1/workspace/{workspaceId}/entity/{entityId}` contain UUIDs that could be correlated with personal data. Request bodies can contain any schema payload.

**Consequences:**
- PII in PostHog Cloud, which is a third-party US-hosted SaaS. This creates GDPR and data residency compliance obligations.
- If workspaceId UUIDs are sent as PostHog group identifiers alongside personally identifying JWT claims, they become linkable.
- Email addresses from JWT claims (`getUserEmail()`) sent as event properties create a direct PII exposure.

**Prevention:**
- Capture only: HTTP method, sanitized URL path (with path variable values replaced by type placeholders, e.g. `/api/v1/workspace/{workspaceId}/entity/{entityId}` not `/api/v1/workspace/abc-123/entity/def-456`), HTTP status code, and response time in milliseconds.
- Use `userId` as the PostHog `distinct_id` (a UUID — not personally identifying on its own).
- Use `workspaceId` as the PostHog group identifier (also a UUID).
- Do NOT capture: `Authorization` header values, request bodies, query parameter values, user email, workspace name, entity names, or any string-valued path variable content.
- Implement a URL sanitizer that replaces UUID path variable values with `{id}` tokens before capturing the path:

```kotlin
fun sanitizePath(uri: String): String =
    uri.replace(UUID_PATTERN, "{id}")

private val UUID_PATTERN = Regex(
    "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)
```

**Warning signs:**
- PostHog event properties contain email addresses or workspace names.
- `Authorization` or `Content-Type` header values appear in captured properties.
- PostHog person profiles contain information that maps directly to identifiable users.

**Phase:** Address before the filter is enabled in any non-local environment. Define the exact set of captured properties in a design decision, and code-review the property map before enabling.

---

### Pitfall 5: Filter Runs Before Spring Security — SecurityContext Not Yet Populated

**What goes wrong:** Spring Security processes the JWT and populates `SecurityContextHolder` in the `BearerTokenAuthenticationFilter`, which runs in the Spring Security filter chain. If the PostHog analytics filter is registered at a position that runs before `BearerTokenAuthenticationFilter`, the security context is empty when the PostHog filter tries to read `userId` and `workspaceId`. All events arrive with null identity.

**Why it happens:** The filter registration order in Spring Boot is controlled by `@Order` (or `FilterRegistrationBean.setOrder()`). The default order for custom servlet filters is 0 (HIGHEST_PRECEDENCE) unless specified. Spring Security's filter chain runs at order -100 by default. A custom filter registered without an explicit order may run before or after security processing non-deterministically, or consistently in the wrong order.

**Consequences:**
- All events captured with anonymous/null `distinct_id`.
- Filter captures unauthenticated actuator and docs requests alongside API requests (may be desired, but probably not).
- `SecurityContextHolder.getContext().authentication` is always null inside the filter.

**Prevention:**
- Register the PostHog filter with an order greater than `SecurityProperties.DEFAULT_FILTER_ORDER` (which is -100). A value of 1 or any positive number ensures it runs after the Spring Security filter chain completes:

```kotlin
@Bean
fun postHogFilterRegistration(postHogFilter: PostHogAnalyticsFilter): FilterRegistrationBean<PostHogAnalyticsFilter> {
    val registration = FilterRegistrationBean(postHogFilter)
    registration.order = 1  // runs after Spring Security (order -100)
    registration.addUrlPatterns("/api/*")
    return registration
}
```

- Verify by logging the authentication object inside the filter during development — it must be non-null for protected endpoints.
- Alternatively, handle null authentication gracefully: treat unauthenticated requests as anonymous (send event without `distinct_id`) rather than skipping the event entirely.

**Warning signs:**
- `SecurityContextHolder.getContext().authentication` is always `null` inside the filter for authenticated requests.
- All PostHog events arrive as anonymous events with no user association.
- Breakpoint in the filter shows `authentication = null` even for requests that pass the controller's `@PreAuthorize` checks.

**Phase:** Address in the initial filter implementation phase when defining the filter bean and its registration order.

---

### Pitfall 6: Capturing Events for Non-API Paths (Actuator, Docs, Auth)

**What goes wrong:** A `OncePerRequestFilter` registered on `/*` intercepts every request including `/actuator/health`, `/docs/swagger-ui`, and `/api/auth/**`. This generates high-volume noise events with no userId (unauthenticated), bloats PostHog Cloud event volume (which is billable), and makes usage analytics meaningless.

**Why it happens:** The filter URL pattern defaults to all paths unless restricted via `FilterRegistrationBean.addUrlPatterns()` or an explicit path check inside the filter's `doFilterInternal`.

**Consequences:**
- Health check polling from load balancers fires hundreds of events per minute.
- Swagger/OpenAPI endpoint crawls generate events.
- Event volume billing with PostHog Cloud increases unexpectedly.
- Per-user analytics are diluted by anonymous noise.

**Prevention:**
- Register the filter only on `/api/v1/*` via `FilterRegistrationBean.addUrlPatterns("/api/v1/*")`.
- Additionally, implement an exclusion list inside the filter for known high-frequency noise paths:

```kotlin
private val excludedPaths = setOf(
    "/actuator/health",
    "/actuator/info",
    "/actuator/prometheus"
)

override fun shouldNotFilter(request: HttpServletRequest): Boolean {
    return excludedPaths.any { request.requestURI.startsWith(it) }
}
```

- Exclude paths that do not require a `userId` by design (e.g. `/api/auth/**`).

**Warning signs:**
- PostHog event volume is much higher than API request volume suggests.
- PostHog dashboard shows large numbers of anonymous events.
- `/actuator/health` appears as a frequently captured endpoint.

**Phase:** Address in initial filter implementation.

---

## Moderate Pitfalls

---

### Pitfall 7: SDK Client Instantiated Multiple Times (Singleton Violation)

**What goes wrong:** The PostHog Java SDK constructor creates a background flush thread per instance. If the `PostHog` client is instantiated more than once (e.g., constructed inside a `@Service` constructor rather than in a `@Configuration @Bean`, or constructed in both a service and a filter), multiple background threads run simultaneously, causing duplicate event capture and resource waste.

**Prevention:**
- Declare the `PostHog` client as a singleton `@Bean` in a `@Configuration` class. Inject it via constructor injection into all consumers. Never `new PostHog(...)` inside a service or filter constructor.

---

### Pitfall 8: Missing workspaceId Breaks Group Analytics

**What goes wrong:** The project design requires every event to carry `workspaceId` for per-workspace analytics. The `workspaceId` is a path variable (`/api/v1/workspace/{workspaceId}/...`) not a header or JWT claim. If the filter uses a generic URL pattern match rather than extracting the workspace segment from the URI, events are sent without workspace group context.

**Why it happens:** The JWT claims contain `userId` (`sub`) and workspace roles (with embedded workspaceId), but extracting `workspaceId` from JWT roles requires knowing which workspace is being accessed — a request may carry roles for multiple workspaces. The path variable is the authoritative source for which workspace is targeted.

**Prevention:**
- Parse `workspaceId` from the request URI path using a regex or `AntPathMatcher` against the pattern `/api/v1/workspace/{workspaceId}/**`. Fall back to `null` for paths that are not workspace-scoped.
- Send `workspaceId` as a PostHog group property (`$group_type = "workspace"`) when available, and omit it (or send as a standalone property) when the path is not workspace-scoped.
- Do not attempt to extract `workspaceId` from JWT roles — the roles claim lists all workspaces the user belongs to, not the one being accessed.

**Warning signs:**
- PostHog events have `userId` but no `workspaceId` property.
- Group analytics by workspace show no data.

---

### Pitfall 9: Capturing Temporal Workflow Events via the HTTP Filter Is Incomplete

**What goes wrong:** Temporal activities are invoked by the Temporal Worker — not via HTTP. The HTTP filter captures HTTP requests only. Workflow execution events (`workflow_started`, `node_executed`, `workflow_completed`) are entirely invisible to the filter. If the team later wants operational analytics on workflow throughput, they will find no data.

**Why it happens:** This is a known limitation called out in the project context (Phase 2), but it is worth flagging as a pitfall: teams often assume the HTTP filter is comprehensive and delay adding explicit event capture. The result is a blind spot in analytics for one of the three primary subsystems.

**Prevention:**
- Document clearly in the `PostHogService` interface that it is designed for injection into Temporal workflow activities as well as HTTP contexts.
- Ensure the `PostHogService.capture()` method does not depend on `SecurityContextHolder` (Temporal activities run on worker threads without a Spring Security context). Accept `userId` and `workspaceId` as explicit method parameters from the start.
- Do not add `SecurityContextHolder` reads inside `PostHogService` — only inside the HTTP filter, which then passes extracted values into the service.

**Warning signs:**
- `PostHogService.capture()` calls `authTokenService.getUserId()` internally.
- No clear path for calling `PostHogService.capture()` from a Temporal activity without an HTTP request context.

---

### Pitfall 10: PostHog API Key Committed to Source Control or application.yml

**What goes wrong:** The `POSTHOG_API_KEY` is treated as a low-sensitivity configuration value and hardcoded in `application.yml` or a `.env` committed file.

**Why it happens:** The PostHog project API key allows event ingestion but does not permit reading data. Teams sometimes treat it as "just a write key" and are less strict about committing it. However, the PostHog project key also controls feature flags and can be used to inject fake events, corrupting analytics.

**Prevention:**
- Add `POSTHOG_API_KEY` to the environment variable pattern already established in this project. Add it to `ApplicationConfigurationProperties` or a dedicated `PostHogConfigurationProperties` with `@ConfigurationProperties(prefix = "posthog")`.
- Add `POSTHOG_API_KEY` to the `.env` example file (not the actual `.env`) and to deployment documentation.
- Never add a default value for the API key in `application.yml`.

---

## Minor Pitfalls

---

### Pitfall 11: Response Status Code Requires Response Wrapper or Post-Filter Approach

**What goes wrong:** `HttpServletRequest` does not expose the response status code before the downstream filter chain completes. A filter that tries to read `response.status` before calling `filterChain.doFilter(request, response)` always reads 200 (default). To capture status code correctly, the PostHog event must be sent after `filterChain.doFilter()` returns, with the timing measurement done via `System.nanoTime()` around the chain invocation.

**Prevention:**
- Structure the filter as: record `startTime`, call `filterChain.doFilter()`, then read `response.status` and calculate duration, then dispatch the PostHog event. This is the standard `OncePerRequestFilter` pattern for response observability.
- Use `ContentCachingResponseWrapper` only if response body inspection is needed — for this project, status code and duration are sufficient, so the standard response object works.

---

### Pitfall 12: High-Cardinality Property Values Degrade PostHog Querying

**What goes wrong:** Sending individual UUIDs (entity IDs, block IDs) as PostHog event property values that vary per request creates extremely high-cardinality properties. PostHog's UI becomes unusable for filtering and aggregating these properties, and the PostHog backend has degraded query performance on high-cardinality string columns.

**Prevention:**
- Only send UUIDs as user identity (`distinct_id`) or group identity (`workspaceId`) — not as arbitrary event properties.
- For path-level analytics, capture the sanitized path template (`/api/v1/workspace/{id}/entity/{id}`) not the concrete UUID values.
- Limit event properties to low-cardinality values: HTTP method, status code bucket (2xx/4xx/5xx), sanitized path, endpoint domain (entity/block/workflow/workspace).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| SDK configuration bean | SDK not shut down on context close (Pitfall 3) | Use `@Bean(destroyMethod = "shutdown")` from day one |
| HTTP filter initial implementation | Filter ordering causes SecurityContext to be null (Pitfall 5) | Register with order > -100, verify authentication in filter during dev |
| HTTP filter user identity extraction | SecurityContext lost on async thread (Pitfall 1) | Extract userId/workspaceId synchronously before any async dispatch |
| HTTP filter async dispatch | Synchronous blocking adds latency (Pitfall 2) | Verify SDK is configured with batching; never call flush() in filter |
| Event property definition | PII in properties (Pitfall 4) | Define exact property allowlist before enabling in staging |
| Filter URL pattern registration | Actuator/docs noise events (Pitfall 6) | Restrict to `/api/v1/*` in FilterRegistrationBean |
| PostHogService design | Service calls SecurityContextHolder internally (Pitfall 9) | Design service to accept userId/workspaceId as parameters |
| Configuration | API key in source (Pitfall 10) | Use `@ConfigurationProperties` with env var binding from the start |

---

## Sources

- PostHog Java SDK source code and README (training data, MEDIUM confidence — verify against current SDK version at `https://github.com/PostHog/posthog-java`)
- Spring Security reference documentation — SecurityContextHolder threading behavior (HIGH confidence — well-established, stable behavior across Spring Security versions)
- Spring Boot `FilterRegistrationBean` and filter ordering documentation (HIGH confidence)
- `OncePerRequestFilter` Javadoc for `shouldNotFilter` pattern (HIGH confidence)
- Spring `@Bean(destroyMethod)` documentation (HIGH confidence)
- PostHog Cloud pricing and high-cardinality property guidance (LOW confidence — verify current pricing model)
