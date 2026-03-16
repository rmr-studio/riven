---
phase: 2
slug: matching-pipeline
status: draft
nyquist_compliant: true
wave_0_complete: true
wave_0_strategy: tdd-alongside
created: 2026-03-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JUnit 5 + Mockito (mockito-kotlin) |
| **Config file** | none — Spring Boot test auto-configuration |
| **Quick run command** | `./gradlew test --tests "riven.core.service.identity.*"` |
| **Full suite command** | `./gradlew test` |
| **Estimated runtime** | ~30 seconds |

---

## Wave 0 Strategy: TDD Alongside Implementation

Phase 2 uses `tdd="true"` on task definitions in Plans 02-02 and 02-03. Tests are co-created with implementation in the RED-GREEN-REFACTOR cycle within each task, rather than in a separate Wave 0 plan. This is valid because:

1. Each TDD task explicitly lists test behaviors in `<behavior>` blocks before implementation.
2. The `<verify>` element runs the specific test class, enforcing the Nyquist rule.
3. Plan 02-01 creates test factories (IdentityFactory) as a prerequisite for all TDD tasks.
4. Plan 02-04 creates the pipeline integration test alongside Temporal wiring.

This approach avoids a separate `02-00-PLAN.md` while maintaining equivalent test-first discipline.

---

## Sampling Rate

- **After every task commit:** Run `./gradlew test --tests "riven.core.service.identity.*"`
- **After every plan wave:** Run `./gradlew test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 02-01-01 | 01 | 1 | MATCH-04, MATCH-06 | compile | `./gradlew compileKotlin` | pending |
| 02-01-02 | 01 | 1 | SUGG-01, SUGG-02 | compile | `./gradlew compileKotlin compileTestKotlin` | pending |
| 02-02-01 | 02 | 2 | MATCH-02, MATCH-03 | unit (TDD) | `./gradlew test --tests "riven.core.service.identity.IdentityMatchCandidateServiceTest"` | pending |
| 02-02-02 | 02 | 2 | MATCH-04, MATCH-05, MATCH-06 | unit (TDD) | `./gradlew test --tests "riven.core.service.identity.IdentityMatchScoringServiceTest"` | pending |
| 02-03-01 | 03 | 2 | SUGG-01, SUGG-02, SUGG-03, SUGG-04, SUGG-05 | unit (TDD) | `./gradlew test --tests "riven.core.service.identity.IdentityMatchSuggestionServiceTest"` | pending |
| 02-04-01 | 04 | 3 | MATCH-02..06, SUGG-01..05 | compile | `./gradlew compileKotlin` | pending |
| 02-04-02 | 04 | 3 | ALL | integration | `./gradlew test --tests "riven.core.service.identity.IdentityMatchPipelineIntegrationTest"` | pending |

*Status: pending / green / red / flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Temporal workflow runs end-to-end | MATCH-02 | Requires running Temporal server | Start Temporal dev server, trigger workflow via test harness, verify suggestion persisted |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 strategy documented (TDD alongside implementation)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
