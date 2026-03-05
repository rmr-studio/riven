---
phase: 02
slug: loader-pipeline
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-05
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JUnit 5 + Mockito (mockito-kotlin) |
| **Config file** | `src/test/resources/application-test.yml` |
| **Quick run command** | `./gradlew test --tests "riven.core.service.catalog.*"` |
| **Full suite command** | `./gradlew test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `./gradlew test --tests "riven.core.service.catalog.*"`
- **After every plan wave:** Run `./gradlew test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 01 | 1 | TEST-05 (infra) | compile | `./gradlew build -x test` | N/A | pending |
| 02-01-T2 | 01 | 1 | TEST-05 (fixtures) | compile | `./gradlew build -x test` | N/A | pending |
| 02-02-T1 | 02 | 2 | VAL-02, VAL-03 | unit | `./gradlew test --tests "riven.core.service.catalog.ManifestScannerServiceTest"` | No - Wave 0 | pending |
| 02-02-T2 | 02 | 2 | LOAD-03, LOAD-04, LOAD-05, LOAD-06, LOAD-07, TEST-01, TEST-02, TEST-03, TEST-04 | unit | `./gradlew test --tests "riven.core.service.catalog.ManifestResolverServiceTest"` | No - Wave 0 | pending |
| 02-03-T1 | 03 | 3 | PERS-01, PERS-02 | unit | `./gradlew test --tests "riven.core.service.catalog.ManifestUpsertServiceTest"` | No - Wave 0 | pending |
| 02-03-T2 | 03 | 3 | LOAD-01, LOAD-02, PERS-03, PERS-04 | unit | `./gradlew test --tests "riven.core.service.catalog.ManifestLoaderServiceTest"` | No - Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/test/kotlin/riven/core/service/catalog/ManifestScannerServiceTest.kt` — stubs for VAL-02, VAL-03
- [ ] `src/test/kotlin/riven/core/service/catalog/ManifestResolverServiceTest.kt` — stubs for LOAD-03, LOAD-04, LOAD-05, LOAD-06, LOAD-07, TEST-01, TEST-02, TEST-03, TEST-04
- [ ] `src/test/kotlin/riven/core/service/catalog/ManifestUpsertServiceTest.kt` — stubs for PERS-01, PERS-02
- [ ] `src/test/kotlin/riven/core/service/catalog/ManifestLoaderServiceTest.kt` — stubs for LOAD-01, LOAD-02, PERS-03, PERS-04
- [ ] `src/test/resources/manifests/` — test fixture manifests (TEST-05)
- No framework install needed — JUnit 5 and Mockito already configured

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Startup summary log | CONTEXT Area 1 | Log output verification | Check application logs for summary line after startup |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
