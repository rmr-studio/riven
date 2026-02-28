# Research Summary: PostHog Server-Side Analytics Integration

**Project:** Riven Core — PostHog analytics integration
**Synthesized:** 2026-02-28
**Research files:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

This project adds server-side product analytics to the Riven Core Spring Boot API using the official PostHog Java SDK. The integration is a pure instrumentation layer — no new controllers, no new database tables, no changes to existing domain services. A single `jakarta.servlet.Filter` intercepts all `/api/v1/**` requests, extracts user and workspace identity from the Spring Security context, and fires fire-and-forget events to PostHog Cloud via the SDK's internal async queue. The SDK handles batching, retry, and HTTP dispatch entirely on its own background thread, meaning zero added latency to API responses.

The recommended architecture is three new components: a `PostHogConfiguration` bean (SDK initialization + lifecycle management), a `PostHogService` wrapper (safe-to-fail capture method), and a `PostHogCaptureFilter` (request interception). All three slot cleanly into the existing `riven.core.{layer}.{domain}` package structure under the `analytics` sub-domain. No existing classes require modification beyond adding the Gradle dependency, adding configuration properties, and registering the filter bean. The PostHog and `ActivityService` concerns are fully independent — PostHog is operational usage analytics, ActivityService is workspace-scoped audit trail.

The primary implementation risks are all filter-order and threading concerns: the filter must run after Spring Security (so `SecurityContextHolder` is populated), and userId/workspaceId must be extracted synchronously on the servlet thread before any async handoff. These pitfalls are well-understood and have straightforward mitigations. A secondary risk is SDK version uncertainty — web access was unavailable during research, so the exact version of `com.posthog.java:posthog` must be verified at Maven Central before pinning in `build.gradle.kts`.

---

## Key Findings

### From STACK.md

- **PostHog Java SDK** (`com.posthog.java:posthog`) is the only supported integration path per PROJECT.md constraints. Artifact coordinates are stable; version requires live verification at Maven Central before pinning.
- **No Spring Boot starter exists** for PostHog. The integration pattern is a manual `@Configuration` bean — consistent with how Nango and other infrastructure clients are already configured in this codebase.
- **The SDK is self-contained**: it bundles its own HTTP client, internal event queue, and background flush thread. No additional async libraries are needed.
- **Graceful shutdown** requires `@Bean(destroyMethod = "shutdown")` to flush the in-memory queue before JVM exit. This must be set from the start.
- **Configuration** follows the existing `@ConfigurationProperties` pattern: two env vars (`POSTHOG_API_KEY`, `POSTHOG_HOST`) bound via `application.yml`.

### From FEATURES.md

**Table stakes (must-have for Phase 1):**
- `capture()` call per API request with `userId` (UUID) and `workspaceId` as required properties on every event
- HTTP endpoint tracking: `endpoint` (templated, not raw URL), `method`, `statusCode`, `latencyMs`, `isError`
- Async/non-blocking dispatch via SDK internal queue — not negotiable for a request-path filter
- Graceful shutdown to flush buffered events
- `POSTHOG_API_KEY` / `POSTHOG_HOST` env var configuration

**Key implementation detail:** Use `HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE` (or UUID regex replacement) to produce templated endpoint values like `/api/v1/{workspaceId}/entities/{entityId}`. Raw UUIDs in endpoint values cause high-cardinality PostHog event explosion.

**Differentiators (Phase 2+, explicitly deferred):**
- `identify()` calls to attach user properties (email, role) to PostHog person profiles
- Group analytics via `groupIdentify()` for workspace-level funnels
- Explicit domain events (workflow executed, entity type published) via PostHogService injection into domain services

**Anti-features (never build):**
- Session replay, autocapture (client-side only concepts)
- PII in event properties (email, workspace name, request body content, Authorization header values)
- Synchronous feature flag checks in the request path
- Replacing ActivityService — the two systems are complementary, not redundant
- Per-request `flush()` calls (defeats async batching)

### From ARCHITECTURE.md

**Three new components, zero existing class modifications:**

| Component | Package | Responsibility |
|-----------|---------|----------------|
| `PostHogConfigurationProperties` | `configuration.properties` | Binds `riven.posthog.*` env vars |
| `PostHogConfiguration` | `configuration.analytics` | Singleton `PostHog` SDK bean with `destroyMethod = "shutdown"` |
| `PostHogService` | `service.analytics` | Thin wrapper; `capture()` method; swallows all SDK errors; no `@PreAuthorize` |
| `PostHogCaptureFilter` | `filter.analytics` | `jakarta.servlet.Filter`; runs after Spring Security; reads SecurityContext; calls PostHogService |

**Data flow:** Request arrives → Spring Security chain runs → PostHogCaptureFilter executes → extracts userId/workspaceId synchronously → calls `postHogService.capture()` → SDK queues event internally → filter returns → response sent to client. PostHog dispatch is entirely off the request thread.

**Why a Filter over Interceptor or AOP:** Only a `jakarta.servlet.Filter` reliably provides access to response status code and runs at the right position relative to the Spring Security filter chain. This is also the pattern already used in `SecurityConfig` for CORS.

**New package:** `filter/` package does not currently exist in the codebase. The `filter.analytics` sub-package follows the established `riven.core.{layer}.{domain}` convention.

### From PITFALLS.md

**Top pitfalls ranked by severity:**

1. **Filter ordering — SecurityContext not populated (CRITICAL):** If the filter runs before Spring Security's `BearerTokenAuthenticationFilter`, `SecurityContextHolder` is empty and all events arrive with null userId. Fix: register `FilterRegistrationBean` with `order = 1` (any positive number after Spring Security's -100).

2. **Async threading — SecurityContext lost (CRITICAL):** If userId/workspaceId are read from `SecurityContextHolder` inside an async block (CompletableFuture, coroutine), the ThreadLocal context is absent. Fix: extract both values synchronously on the servlet thread before any async dispatch, and pass them as explicit parameters.

3. **Missing graceful shutdown (CRITICAL):** Without `@Bean(destroyMethod = "shutdown")`, the SDK's in-memory queue is discarded on deployment. Fix: add `destroyMethod` to the `@Bean` declaration from day one.

4. **PII leakage into PostHog properties (CRITICAL before staging):** Authorization headers, request bodies, email addresses, workspace names must never appear in event properties. Fix: define an explicit property allowlist covering only HTTP method, sanitized URI template, status code, latency, userId UUID, workspaceId UUID.

5. **High-cardinality endpoint values (MODERATE):** Raw UUID-containing URIs explode event cardinality in PostHog. Fix: UUID regex replacement or `HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE` to capture route templates.

6. **Actuator/docs noise (MODERATE):** Registering the filter on `/*` captures health check polling and Swagger crawls. Fix: restrict `FilterRegistrationBean` to `/api/v1/*` and add a `shouldNotFilter` exclusion list.

7. **SDK instantiated multiple times (MODERATE):** Multiple `PostHog` instances create multiple background threads and duplicate events. Fix: declare as a singleton `@Bean` only; never construct inside a service.

8. **PostHogService must not call SecurityContextHolder (MODERATE):** The service must accept `userId` and `workspaceId` as explicit parameters so it can be called from Temporal worker threads (no Spring Security context) in Phase 2.

---

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1: SDK Foundation and HTTP Filter**

Rationale: All subsequent analytics capability depends on the SDK being correctly initialized, the filter running in the right position, and basic event capture being verified end-to-end. This is the entire MVP and should ship as one atomic unit.

Delivers:
- Every authenticated API request captured as an `api_request` event in PostHog
- Per-user and per-workspace segmentation on all events
- Latency and error rate visibility across all endpoints

Components:
- `PostHogConfigurationProperties` (env var binding)
- `PostHogConfiguration` (SDK singleton bean with shutdown hook)
- `PostHogService` (capture wrapper, safe-to-fail, explicit userId/workspaceId parameters)
- `PostHogCaptureFilter` (request interception, filter order, URI normalization, SecurityContext extraction)
- `build.gradle.kts` dependency addition (verify version first)
- `application.yml` additions (`riven.posthog.*`)
- Test profile guard (`POSTHOG_ENABLED=false` or `@ConditionalOnProperty`)

Features from FEATURES.md: all table stakes items
Pitfalls to address: Pitfalls 1, 2, 3, 4, 5, 6, 7, 8, 10, 11

Research flag: STANDARD PATTERNS — filter/security integration is well-documented Spring Boot. No additional research needed. SDK version must be verified at Maven Central before implementation begins.

---

**Phase 2: Explicit Domain Events**

Rationale: Once the HTTP filter is validated and PostHog is confirmed to be receiving data correctly, explicit business-semantic events can be added. These require injecting `PostHogService` into domain service methods or using Spring's `ApplicationEventPublisher` to decouple analytics from business logic.

Delivers:
- `workflow_executed`, `entity_type_published`, and other business-meaningful events
- Coverage for Temporal workflow activity events (which the HTTP filter cannot capture)
- User `identify()` calls to enrich PostHog person profiles

Features from FEATURES.md: differentiators (identify, explicit domain events, potentially group analytics)
Pitfalls to address: Pitfall 9 (Temporal activity context), Anti-Pattern 1 (avoid transactional entanglement)

Research flag: NEEDS RESEARCH — the event-publishing pattern (ApplicationEventPublisher vs. direct service injection inside @Transactional boundaries) should be researched to avoid transactional rollback risks. Temporal activity instrumentation has no established pattern in this codebase.

---

### Phase Summary

| Phase | Name | Rationale | Research Needed |
|-------|------|-----------|-----------------|
| 1 | SDK Foundation and HTTP Filter | Foundational; all analytics requires working SDK + filter | No — standard patterns; verify SDK version |
| 2 | Explicit Domain Events | Extends coverage to business events and Temporal activities | Yes — transactional event publishing, Temporal context |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (SDK integration pattern) | HIGH | Spring Boot `@Configuration @Bean` pattern is stable and matches existing codebase conventions exactly. SDK coordinates are confirmed; version needs live verification. |
| Features (table stakes) | HIGH | HTTP filter tracking, async dispatch, env var config are well-understood requirements. |
| Features (differentiators) | MEDIUM | `identify()`, `groupIdentify()` method signatures are from training data; verify against current SDK before Phase 2. |
| Architecture (filter/security integration) | HIGH | `jakarta.servlet.Filter`, `FilterRegistrationBean`, `SecurityContextHolder` behavior is stable Spring Boot/Security. Pattern matches existing codebase. |
| Architecture (SDK internals) | MEDIUM | SDK's async queue behavior and `shutdown()` lifecycle are from training data. Validate against current SDK README. |
| Pitfalls | HIGH | All critical pitfalls are Spring/security patterns (HIGH confidence), not SDK-specific. SDK-specific pitfalls are MEDIUM but clearly flagged. |

**Overall confidence: MEDIUM-HIGH**

Primary gap: PostHog Java SDK exact version is unverified. This is a single blocking action item before implementation can begin — check Maven Central for `com.posthog.java:posthog` latest stable version.

Secondary gap: SDK API surface (`Builder` options, `groupIdentify` signature, `enable` config flag) should be verified against the current PostHog Java docs before Phase 2 domain event work.

---

## Gaps to Address

1. **SDK version verification (blocker for Phase 1):** Confirm current stable version of `com.posthog.java:posthog` at https://central.sonatype.com/artifact/com.posthog.java/posthog before adding the dependency.
2. **SDK API surface verification (before Phase 2):** Confirm `groupIdentify`, `identify`, `isFeatureEnabled` method signatures at https://posthog.com/docs/libraries/java.
3. **PostHog Cloud host URL (before Phase 1 goes to staging):** Confirm whether the project uses `https://app.posthog.com` or `https://us.i.posthog.com` (API ingestion endpoint) — these differ between the data ingestion endpoint and the app domain.
4. **`POSTHOG_ENABLED` flag in SDK (before test profile work):** Confirm the `enable` builder option exists in the current SDK version; if not, use `@ConditionalOnProperty` in `PostHogConfiguration` instead.
5. **`HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE` availability (implementation detail):** Confirm this Spring MVC attribute is available in Spring Boot 3.5.3 and populated at the time the filter's `doFilter` method reads it.

---

## Sources (Aggregated)

| Source | Confidence | Notes |
|--------|------------|-------|
| PostHog Java SDK README (github.com/PostHog/posthog-java) | MEDIUM | Training data only — verify current at GitHub releases |
| PostHog official docs /libraries/java | MEDIUM | Training data only — verify method signatures |
| Maven Central (com.posthog.java:posthog) | LOW | Not queried — web access unavailable during research |
| Spring Boot `OncePerRequestFilter` / `FilterRegistrationBean` | HIGH | Stable Spring API, well-documented |
| Spring Security `SecurityContextHolder` threading | HIGH | Stable, well-established behavior |
| Spring `@Bean(destroyMethod)` lifecycle | HIGH | Stable Spring API |
| `HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE` | HIGH | Stable Spring MVC |
| PROJECT.md constraints | HIGH | Read directly from project file |
| Existing codebase patterns (NangoClientConfiguration, SecurityConfig, ActivityService) | HIGH | Read directly from source |
| PostHog Cloud pricing / event limits | LOW | Not verified — check current plan |
