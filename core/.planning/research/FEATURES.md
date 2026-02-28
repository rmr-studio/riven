# Feature Landscape: PostHog Server-Side Integration

**Domain:** Server-side analytics SDK integration for Spring Boot API
**Researched:** 2026-02-28
**Overall confidence:** MEDIUM (training knowledge; web verification unavailable in this session)

---

## Context: Server-Side vs Client-Side PostHog

PostHog has two integration surfaces that are fundamentally different in purpose and capability:

| Concern | Server-Side (this project) | Client-Side (browser/mobile) |
|---------|---------------------------|------------------------------|
| Who captures | Your server code | End user's browser/device |
| User identification | Explicit — you pass `distinctId` | Automatic — anonymous ID, cookies |
| Session data | None | Session replay, pageviews, mouse events |
| Performance impact | Async queue flush | Non-blocking JS snippet |
| Feature flags | Via API (not real-time) | Real-time, local evaluation |
| Autocapture | No | Yes (clicks, inputs, navigation) |
| Main use case | API request analytics, business events, backend workflows | Product UX analytics, funnels, heatmaps |

This project's use case is **API-level operational analytics**: which endpoints are hit, latency, error rates, by whom. This is fundamentally a server-side integration concern.

---

## Table Stakes

Features users (internal team) expect from a server-side PostHog integration. Missing = the integration is not useful.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Event capture** (`capture`) | Core primitive — without it, nothing is tracked | Low | `PostHog.capture(distinctId, event, properties)` — sends named event with arbitrary properties map |
| **User identity on events** | Every event must be attributable to a user | Low | Pass `distinctId` = userId (UUID string) on every `capture()` call |
| **Workspace context** | Multi-tenant system — workspaceId is the primary segmentation dimension | Low | Pass as a property: `properties["workspaceId"] = workspaceId.toString()` |
| **HTTP endpoint tracking** | Primary observable: which endpoints are called | Low | `event = "api_request"`, properties include `endpoint`, `method`, `statusCode`, `latencyMs` |
| **Latency capture** | Response time is an operational metric the team needs | Low | Compute `latencyMs` in filter, add to event properties |
| **HTTP status code capture** | Error rate tracking requires status codes | Low | `statusCode` property, derive `isError = statusCode >= 400` |
| **Async / non-blocking dispatch** | Filter MUST NOT add latency to API requests | Medium | PostHog Java SDK queues events in-memory and flushes in background thread — works out of the box |
| **Environment variable configuration** | API key must not be committed | Low | `POSTHOG_API_KEY` + `POSTHOG_HOST` env vars, wired via `@ConfigurationProperties` |
| **Graceful shutdown** | Events in buffer must flush before JVM exits | Low | Call `PostHog.shutdown()` on application shutdown — Spring `@PreDestroy` or `DisposableBean` |
| **PostHog Cloud connectivity** | Project uses PostHog Cloud, not self-hosted | Low | Host defaults to `https://us.i.posthog.com` (or EU endpoint) — configure via env var |

---

## Differentiators

Features that go beyond baseline tracking. Not required for the HTTP filter milestone but valuable for future phases.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Identify calls** | Attach persistent user properties (email, role, workspace name) to a userId | Low | `PostHog.identify(distinctId, properties)` — call once on first event for a user or on user update; enriches all future events attributed to that user |
| **Group analytics** | Track events at workspace level, not just user level | Medium | `PostHog.groupIdentify("workspace", workspaceId, properties)` + pass `$groups: {workspace: workspaceId}` on capture events — enables workspace-level funnels and retention |
| **Explicit domain events** | Track meaningful business operations (workflow executed, entity type published) beyond HTTP calls | Medium | Phase 2 of project plan — inject `PostHogService` into domain services, call `capture()` with business-meaningful event names |
| **Error event enrichment** | Track exception type and domain context on 5xx events | Low | Add `exceptionClass`, `exceptionMessage`, `domain` to error event properties in filter's error path |
| **Feature flags (server-side evaluation)** | Gate backend features or vary behavior per workspace/user | High | `PostHog.isFeatureEnabled(flagKey, distinctId)` — requires flag definitions in PostHog dashboard; adds a synchronous call (can be async with local evaluation if flag cache configured). Not needed for analytics milestone. |
| **Alias** | Link anonymous pre-auth events to identified userId | Medium | `PostHog.alias(previousId, userId)` — only useful if capturing pre-auth events (e.g., public endpoints); not applicable for this all-authenticated API |
| **Batch property super-properties** | Attach common properties to all events without repeating them per call | Low | Not a native SDK concept — implement as a Kotlin helper that merges a base property map before every `capture()` call |

---

## Anti-Features

Features to explicitly NOT build in the server-side integration.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Session replay** | Server-side has no concept of a user session or DOM — session replay is browser-only | If UX session replay is needed, add PostHog JS snippet to the frontend separately |
| **Autocapture** | PostHog autocapture is client-side JavaScript only; it does not exist for JVM SDKs | Use the HTTP filter as the server-side analogue: one place that captures all requests automatically |
| **PII in event properties** | Sending email addresses, full names, or payload content to PostHog creates GDPR/privacy risk | Send only IDs (userId UUID, workspaceId UUID); resolve PII in PostHog via identify properties only if legally reviewed |
| **Synchronous feature flag checks in request path** | Blocking network call to PostHog inside a filter or controller adds latency for every request | If feature flags are added, use local evaluation mode (SDK caches flags in background) or confine to startup/config decisions |
| **Replacing ActivityService** | ActivityService is an audit trail with DB durability, workspace-scoped access control, and query capability. PostHog is a lossy analytics stream | Coexist: ActivityService = "what happened to data", PostHog = "how the API is used" |
| **Exposing PostHog data to workspace users** | Project scope explicitly excludes user-facing analytics surfaces | Internal team consumption via PostHog dashboard only |
| **Capturing request/response body content** | API payloads contain user-defined entity data — expensive, verbose, and privacy-sensitive | Capture structural metadata only: endpoint, method, latency, status, entity type name (not values) |
| **Per-request blocking flush** | Calling `flush()` synchronously after every event defeats async buffering | Let the SDK flush on its background interval (default: 10,000ms) and at shutdown |

---

## PostHog Java SDK: Verified Capability Map

The PostHog Java SDK (`com.posthog.java:posthog`) provides these methods. Confidence is MEDIUM based on training knowledge of the SDK as of 2025; verify against current Maven release before implementation.

**Current stable version:** `3.x` series (verify: `https://github.com/PostHog/posthog-java/releases`)

### Core Methods

| Method | Signature (simplified) | Purpose |
|--------|------------------------|---------|
| `capture` | `capture(distinctId: String, event: String, properties: Map<String, Any>)` | Send a named event with properties |
| `identify` | `identify(distinctId: String, properties: Map<String, Any>)` | Set persistent user properties |
| `alias` | `alias(alias: String, distinctId: String)` | Link two distinct IDs |
| `groupIdentify` | `groupIdentify(groupType: String, groupKey: String, properties: Map<String, Any>)` | Set group-level properties |
| `isFeatureEnabled` | `isFeatureEnabled(key: String, distinctId: String): Boolean` | Check if a feature flag is on for a user |
| `getFeatureFlag` | `getFeatureFlag(key: String, distinctId: String): Any?` | Get feature flag value (supports multivariate flags) |
| `flush` | `flush()` | Synchronously flush the event queue |
| `shutdown` | `shutdown()` | Flush and stop background thread |

### SDK Configuration Options

| Option | What It Controls | This Project's Value |
|--------|-----------------|----------------------|
| `apiKey` | PostHog project API key | `POSTHOG_API_KEY` env var |
| `host` | PostHog Cloud endpoint | `POSTHOG_HOST` env var (default: `https://us.i.posthog.com`) |
| `flushAt` | Events per batch before flush | Leave at default (20) or tune to 50 for high-traffic API |
| `flushInterval` | Background flush interval (ms) | Leave at default (10,000ms) |
| `maxQueueSize` | Max events held in memory before drop | Tune based on expected burst traffic |
| `enable` | Toggle SDK on/off | Wire to `POSTHOG_ENABLED` env var for easy disabling in test/dev |

---

## Event Schema: HTTP Filter Event

The primary event this milestone produces. All properties are safe to send (no PII, no payload content).

```
Event: "api_request"

Required properties:
  endpoint        String   "/api/v1/entity-types/{entityTypeId}/entities"
  method          String   "GET" | "POST" | "PUT" | "DELETE"
  statusCode      Int      200
  latencyMs       Long     45
  isError         Boolean  false (statusCode >= 400)
  userId          String   UUID string (from JWT "sub" claim)
  workspaceId     String   UUID string (from security context)

Optional enrichment (Phase 2):
  domain          String   "entity" | "block" | "workflow" | "workspace"
  operationType   String   "read" | "write" | "delete"
  entityTypeId    String   UUID (from path variable, if extractable)
```

**Templated endpoint pattern:** Strip path variable values but preserve structure. `/api/v1/entity-types/abc-123/entities` should be captured as `/api/v1/entity-types/{entityTypeId}/entities`. This prevents high-cardinality endpoint explosion in PostHog. This is the main implementation challenge in the filter.

---

## Feature Dependencies

```
Async event dispatch → All other features (SDK must initialize before filter)

HTTP filter (event capture) → userId + workspaceId resolution
     ↓
Spring Security context must be readable inside the filter
     ↓
OncePerRequestFilter after SecurityContextPersistenceFilter

group analytics → identify (workspace must be identified before group tracking)

feature flags → SDK initialization (flags polled at startup)

explicit domain events (Phase 2) → HTTP filter established (validates PostHog works first)
```

---

## MVP Recommendation

For the HTTP filter milestone defined in `.planning/PROJECT.md`, prioritize:

1. **Event capture** — core SDK `capture()` call inside a Spring filter
2. **userId + workspaceId on every event** — non-negotiable for this multi-tenant system; events without workspace context are nearly useless for analysis
3. **Async dispatch** — use SDK's built-in background queue; no additional threading needed
4. **Graceful shutdown** — `@PreDestroy` on the PostHog bean calling `shutdown()`
5. **Templated endpoint property** — use Spring's `HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE` request attribute to get the route template, not the literal URL

**Defer:**
- **Identify calls** — useful but not required for Phase 1; add in Phase 2 when explicit domain events land
- **Group analytics** — requires more PostHog dashboard setup; add after basic events are flowing and validated
- **Feature flags** — no current use case in this codebase; adds SDK complexity for no benefit now
- **Explicit domain events** — already scoped out of this milestone in PROJECT.md

---

## Implementation Notes for Downstream Phases

### Endpoint template extraction (critical implementation detail)

PostHog will explode with high cardinality if you send raw URLs like `/api/v1/entities/550e8400-e29b-41d4-a716-446655440000`. Use Spring's `HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE`:

```kotlin
val template = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE)?.toString()
    ?: request.requestURI  // fallback for unmatched routes (404s)
```

This gives you `/api/v1/entity-types/{entityTypeId}/entities` — safe for PostHog grouping.

### Security context availability in filters

The filter must run after Spring Security's filter chain completes authentication. Register as `OncePerRequestFilter` and ensure it runs after `SecurityContextHolderFilter`. Use `AuthTokenService.getUserId()` only after the security context is populated — it will throw or return null on unauthenticated requests (public endpoints like `/actuator/health`). Guard with a null check.

### SDK singleton

The `PostHog` client should be a singleton Spring `@Bean`. The SDK manages its own background thread for flushing — creating multiple instances creates multiple background threads and wastes resources.

### Testing considerations

The PostHog SDK will attempt network calls in tests. The `enable` configuration option (or a `@ConditionalOnProperty`) is the cleanest way to disable PostHog in the `test` and `integration` Spring profiles without requiring mocking.

---

## Sources

- Training knowledge of PostHog Java SDK (as of August 2025) — MEDIUM confidence
- PostHog Java SDK GitHub: `https://github.com/PostHog/posthog-java` (verify current API before implementation)
- PostHog Cloud docs: `https://posthog.com/docs/libraries/java` (verify method signatures)
- Maven Central: `https://mvnrepository.com/artifact/com.posthog.java/posthog` (verify latest version)
- Project context: `.planning/PROJECT.md` — HIGH confidence (authoritative for scope)
- Codebase context: `.planning/codebase/INTEGRATIONS.md`, `ARCHITECTURE.md` — HIGH confidence

**Verification required before implementation:**
- [ ] Confirm PostHog Java SDK version on Maven Central (latest 3.x)
- [ ] Confirm `groupIdentify` method signature has not changed
- [ ] Confirm `enable` config option exists in current SDK version
- [ ] Confirm `HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE` availability in Spring Boot 3.5.3
