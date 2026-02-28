# Roadmap: PostHog Analytics Integration

**Project:** PostHog Analytics Integration
**Core Value:** Understand how the API is actually used — which endpoints, how often, by whom, and how fast — so the team can make informed product and infrastructure decisions.
**Depth:** Quick
**Created:** 2026-02-28

---

## Phases

- [x] **Phase 1: SDK Foundation** - PostHog SDK wired into Spring Boot with safe-to-fail capture service and env var configuration
- [ ] **Phase 2: HTTP Auto-Capture** - Filter intercepts every authenticated API request and ships events to PostHog with user/workspace context

---

## Phase Details

### Phase 1: SDK Foundation
**Goal**: The PostHog SDK is initialized, configured, and available as an injectable service that callers can safely use without risking application stability
**Depends on**: Nothing (first phase)
**Requirements**: SDK-01, SDK-02, SDK-03, SDK-04, SDK-05, SDK-06
**Success Criteria** (what must be TRUE):
  1. Application starts and shuts down cleanly — PostHog SDK initializes on startup and flushes its queue on graceful shutdown without errors
  2. `PostHogService` can be injected into any Spring bean and called with a `userId` and `workspaceId` without throwing exceptions, even when PostHog Cloud is unreachable
  3. `POSTHOG_API_KEY`, `POSTHOG_HOST`, and `POSTHOG_ENABLED` environment variables control SDK behavior without code changes
  4. Workspace-level events can be associated via `groupIdentify()` so PostHog can aggregate events by workspace
**Plans**: 1 plan
Plans:
- [x] 1-01-PLAN.md — SDK dependencies, configuration, service interface/implementations, workspace event integration, and unit tests

### Phase 2: HTTP Auto-Capture
**Goal**: Every authenticated API request is automatically captured as a PostHog event with endpoint, method, status code, latency, userId, and workspaceId — with no meaningful latency added to responses
**Depends on**: Phase 1
**Requirements**: FILT-01, FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07, TEST-01, TEST-02
**Success Criteria** (what must be TRUE):
  1. Making any authenticated `GET /api/v1/**` request results in a `$api_request` event appearing in PostHog within seconds, tagged with the correct userId and workspaceId
  2. The endpoint property in PostHog shows `/api/v1/{workspaceId}/entities/{id}` (templated) rather than a raw UUID path, keeping cardinality manageable
  3. A 500-level response includes exception class and error message in the PostHog event properties; 2xx responses do not
  4. Hitting `/actuator/health` or `/swagger-ui/**` produces no PostHog event
  5. Running `./gradlew test` with `POSTHOG_ENABLED=false` completes without any network calls to PostHog Cloud — the SDK is not instantiated at all
**Plans**: 1 plan
Plans:
- [ ] 2-01-PLAN.md — PostHogCaptureFilter, FilterRegistrationBean wiring, ExceptionHandler error context, and unit tests

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. SDK Foundation | 1/1 | Complete | 2026-02-28 |
| 2. HTTP Auto-Capture | 0/1 | In Progress | - |

---

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| SDK-01 | Phase 1 | Complete |
| SDK-02 | Phase 1 | Complete |
| SDK-03 | Phase 1 | Complete |
| SDK-04 | Phase 1 | Complete |
| SDK-05 | Phase 1 | Complete |
| SDK-06 | Phase 1 | Complete |
| FILT-01 | Phase 2 | Pending |
| FILT-02 | Phase 2 | Pending |
| FILT-03 | Phase 2 | Pending |
| FILT-04 | Phase 2 | Pending |
| FILT-05 | Phase 2 | Pending |
| FILT-06 | Phase 2 | Pending |
| FILT-07 | Phase 2 | Pending |
| TEST-01 | Phase 2 | Pending |
| TEST-02 | Phase 2 | Pending |

**v1 requirements mapped:** 15/15

---
*Created: 2026-02-28*
