---
phase: 02-scoring-improvements-signal-classification
plan: "02"
subsystem: identity
tags: [scoring, confidence-gate, cross-type-discount, tdd]
dependency_graph:
  requires: [02-01]
  provides: [SCOR-01, SCOR-02, TEST-05, TEST-06]
  affects: [IdentityMatchScoringService, IdentityMatchScoringServiceTest]
tech_stack:
  added: []
  patterns: [confidence-gate, cross-type-discount, tdd-red-green]
key_files:
  modified:
    - src/main/kotlin/riven/core/service/identity/IdentityMatchScoringService.kt
    - src/test/kotlin/riven/core/service/identity/IdentityMatchScoringServiceTest.kt
decisions:
  - "Confidence gate checks DEFAULT_WEIGHTS base weight, not discounted MatchSignal.weight — ensures cross-type signals are not double-penalized"
  - "Null candidateSignalType treated as same-type (no discount) for backward Temporal serialization compatibility"
  - "Multi-signal candidates (2+) automatically pass confidence gate regardless of individual weights"
  - "passesConfidenceGate() logs rejections at DEBUG level with candidate ID, signal type, and base weight"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-29"
  tasks_completed: 1
  files_modified: 2
---

# Phase 02 Plan 02: Confidence Gate and Cross-Type Discount Summary

Confidence gate (CONFIDENCE_GATE_THRESHOLD=0.85) and cross-type scoring discount (CROSS_TYPE_DISCOUNT=0.5) in IdentityMatchScoringService, validated by 11 new unit tests covering all gate and discount behaviors.

## What Was Built

### Confidence Gate (`passesConfidenceGate`)

A new private method `passesConfidenceGate(candidateEntityId, signals)` was added to `IdentityMatchScoringService` and wired into `scoreCandidate()` immediately after the empty-signals guard and before `computeCompositeScore`.

Rules:
- If `signals.size >= 2`: automatic pass (multi-signal candidates are inherently more trustworthy)
- If `signals.size == 1`: read base weight from `MatchSignalType.DEFAULT_WEIGHTS`; reject if base weight < 0.85
- Rejected candidates log at DEBUG level with candidate UUID, signal type, and base weight
- The gate reads the **base** weight from `DEFAULT_WEIGHTS`, not the effective (discounted) weight on the `MatchSignal` — this prevents cross-type signals from being double-penalized

Gate outcomes by signal type:
| Signal Type       | Base Weight | Gate Result |
|-------------------|-------------|-------------|
| EMAIL             | 0.9         | PASS        |
| PHONE             | 0.85        | PASS        |
| CUSTOM_IDENTIFIER | 0.7         | REJECT      |
| NAME              | 0.5         | REJECT      |
| COMPANY           | 0.3         | REJECT      |

### Cross-Type Discount in `buildSignals`

`buildSignals()` now detects cross-type matches by comparing the trigger's `signalType` with `CandidateMatch.candidateSignalType`. When they differ (and `candidateSignalType` is non-null), a 0.5x discount is applied to the base weight and `MatchSignal.crossType` is set to `true`.

Logic: `val isCrossType = best.candidateSignalType != null && best.candidateSignalType != signalType`

### Constants Added

```kotlin
const val CONFIDENCE_GATE_THRESHOLD = 0.85
const val CROSS_TYPE_DISCOUNT = 0.5
```

## Tests Added

Eleven new test cases across two `@Nested` inner classes in `IdentityMatchScoringServiceTest`:

**`ConfidenceGate` (7 tests):**
- Single NAME signal (weight 0.5) at 0.9 similarity — REJECTED
- Single COMPANY signal (weight 0.3) — REJECTED
- Single CUSTOM_IDENTIFIER signal (weight 0.7) — REJECTED
- Single EMAIL signal (weight 0.9) — ACCEPTED
- Single PHONE signal (weight 0.85) — ACCEPTED (boundary)
- NAME + COMPANY two-signal candidate — ACCEPTED (multi-signal rule)
- Cross-type EMAIL (discounted to 0.45) — ACCEPTED (gate checks base weight 0.9)

**`CrossTypeDiscount` (4 tests):**
- Same-type EMAIL: weight=0.9, crossType=false
- Cross-type (EMAIL trigger, NAME attribute): weight=0.45, crossType=true
- Null candidateSignalType: weight=0.9, crossType=false (backward compat)
- Cross-type signal weight is lower than same-type signal weight (composite impact)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files Exist
- `src/main/kotlin/riven/core/service/identity/IdentityMatchScoringService.kt` — modified
- `src/test/kotlin/riven/core/service/identity/IdentityMatchScoringServiceTest.kt` — modified

### Commits
- `8e1dc0289` — test(02-02): add failing tests for confidence gate and cross-type discount
- `f24c010cd` — feat(02-02): implement confidence gate and cross-type discount in IdentityMatchScoringService

### Test Results
Full suite: `./gradlew test` — BUILD SUCCESSFUL

## Self-Check: PASSED
