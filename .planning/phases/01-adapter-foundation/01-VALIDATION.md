---
phase: 1
slug: adapter-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JUnit 5 + mockito-kotlin (existing) |
| **Config file** | `core/src/test/resources/application-test.yml` (H2 PostgreSQL-compat, `ddl-auto: create-drop`) |
| **Quick run command** | `./gradlew test --tests "riven.core.service.ingestion.adapter.*" --tests "riven.core.enums.integration.SourceTypeJpaRoundTripTest"` |
| **Full suite command** | `./gradlew test` |
| **Estimated runtime** | ~30 seconds (quick) / ~N/A (full) |

---

## Sampling Rate

- **After every task commit:** Run quick command (adapter + enum round-trip, ~30s)
- **After every plan wave:** Run full suite (guards against Nango regression)
- **Before `/gsd:verify-work`:** `./gradlew build` + full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-TBD-01 | TBD | 1 | ADPT-01 | unit | `./gradlew test --tests "IngestionAdapterContractTest"` | ❌ W0 | ⬜ pending |
| 1-TBD-02 | TBD | 1 | ADPT-02 | unit | `./gradlew test --tests "RecordBatchTest"` | ❌ W0 | ⬜ pending |
| 1-TBD-03 | TBD | 1 | ADPT-03 | unit | `./gradlew test --tests "SyncModeTest"` | ❌ W0 | ⬜ pending |
| 1-TBD-04 | TBD | 1 | ADPT-04 | unit (JPA slice / H2) | `./gradlew test --tests "SourceTypeJpaRoundTripTest"` | ❌ W0 | ⬜ pending |
| 1-TBD-05 | TBD | 2 | ADPT-05 | unit | `./gradlew test --tests "NangoAdapterTest"` | ❌ W0 | ⬜ pending |
| 1-TBD-06 | TBD | 2 | Registry wiring | Spring context | `./gradlew test --tests "AdapterRegistryWiringTest"` | ❌ W0 | ⬜ pending |
| 1-TBD-07 | TBD | 2 | Don't-regress | unit (existing) | `./gradlew test --tests "riven.core.service.integration.*"` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs to be finalized by planner; plan numbers fill in once PLAN.md files exist.*

---

## Wave 0 Requirements

- [ ] `core/src/test/kotlin/riven/core/service/ingestion/adapter/IngestionAdapterContractTest.kt` — stub for ADPT-01
- [ ] `core/src/test/kotlin/riven/core/models/ingestion/adapter/RecordBatchTest.kt` — stub for ADPT-02
- [ ] `core/src/test/kotlin/riven/core/models/ingestion/adapter/SyncModeTest.kt` — stub for ADPT-03
- [ ] `core/src/test/kotlin/riven/core/entity/entity/SourceTypeJpaRoundTripTest.kt` — stub for ADPT-04 (or extend existing `EntityTypeRepositoryTest`)
- [ ] `core/src/test/kotlin/riven/core/service/ingestion/adapter/nango/NangoAdapterTest.kt` — stub for ADPT-05
- [ ] `core/src/test/kotlin/riven/core/service/ingestion/adapter/AdapterRegistryWiringTest.kt` — stub for registry composition
- [ ] `core/src/test/kotlin/riven/core/service/util/factory/IngestionTestFactory.kt` — only if `SourceRecord` type is introduced in Phase 1

*Framework install:* none — JUnit 5 + mockito-kotlin already present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `NangoAdapter` not wired into live sync path | Success criterion #4 | Static absence check, not a runtime behavior | `grep -r "NangoAdapter" core/src/main/kotlin/riven/core/service/integration/` returns zero matches |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
