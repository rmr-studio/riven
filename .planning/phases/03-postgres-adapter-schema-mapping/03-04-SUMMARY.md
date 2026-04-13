---
phase: 03-postgres-adapter-schema-mapping
plan: 04
subsystem: api
status: deferred
tags: [deferred, spring-ai, boot4, nl-suggestions, llm]

deferred_requirements:
  - MAP-07

covered_by_prior_plan:
  # MAP-03/04/05 core functionality already shipped in 03-03 (domain/semantic/identifier
  # selection persisted via Save path). Only their LLM-suggestion *enhancement* is deferred,
  # which does not block the user flow — users can still pick values manually.
  - requirement: MAP-03
    shipped_in: 03-03
    note: "Mapping UI accepts LifecycleDomain via SaveCustomSourceMappingRequest.lifecycleDomain; LLM-suggested default deferred with MAP-07."
  - requirement: MAP-04
    shipped_in: 03-03
    note: "Mapping UI accepts SemanticGroup via SaveCustomSourceMappingRequest.semanticGroup; LLM-suggested default deferred with MAP-07."
  - requirement: MAP-05
    shipped_in: 03-03
    note: "Identifier column selection via SaveCustomSourceFieldMappingRequest.isIdentifier; LLM-suggested identifier deferred with MAP-07."

deferral_reason: "Spring AI 2.0 required for multi-provider LLM (Anthropic + OpenAI) only supports Boot 4.x. Boot 4 upgrade scoped to new phase 03.5-boot4-upgrade. Return to this plan after 03.5 lands."

user_decision:
  date: 2026-04-13
  option_selected: "R1 — defer MAP-07 until after Boot 4 upgrade (new phase 03.5)"
  provider_strategy: "Multi-provider via Spring AI ChatModel abstraction — not single-vendor SDK"
  default_provider: "Anthropic (Claude) as default chat model"
  secondary_provider: "OpenAI reasoning model (o-series) for complex schema disambiguation"
  env_vars:
    - "ANTHROPIC_API_KEY (default provider)"
    - "OPENAI_REASONING_API_KEY (separate key from existing OPENAI_API_KEY used by embeddings)"
  rationale: "Keeps embeddings provider key and LLM reasoning key independently rotatable; avoids coupling mapping-suggestion availability to embedding-provider outages."

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "Plan 03-04 deferred — no code, no build.gradle.kts edit, no Spring AI dependency pulled. Bookkeeping only."
  - "MAP-07 remains Pending; MAP-03/04/05 stay Complete via 03-03 (manual selection works; LLM-suggested defaults are a later UX enhancement)."
  - "Multi-provider chosen over single-vendor starter — Spring AI 2.0 ChatModel abstraction lets Anthropic default + OpenAI reasoning swap without SDK churn."
  - "Boot 4 upgrade scoped to its own phase (03.5) rather than smuggled into 03-04 — the upgrade touches runtime, autoconfig, test harness, and is a phase-sized blast radius."
  - "Separate ANTHROPIC_API_KEY + OPENAI_REASONING_API_KEY (distinct from embeddings' OPENAI_API_KEY) — independent rotation + blast-radius isolation."

requirements-completed: []
requirements-deferred:
  - MAP-07

duration: 0 min
completed: 2026-04-13
---

# Phase 3 Plan 04: NL-Assisted Mapping Suggestions — DEFERRED

**Status:** DEFERRED — no implementation work performed. Plan reopens after phase 03.5 (Boot 4 upgrade) completes.

## One-Liner

MAP-07 (LLM-assisted mapping suggestions via Spring AI) deferred because the multi-provider approach chosen by the user requires Spring AI 2.0, which only targets Spring Boot 4.x. Boot 4 upgrade is a phase-sized change scoped to new phase 03.5.

## Why Deferred (R1 Decision)

On 2026-04-13, the user selected R1 from the deferral options:

> **R1 — Defer 03-04 until after a separate Boot 4 upgrade phase (03.5) lands.**

The plan's original checkpoint (Task 1 in 03-04-PLAN.md) framed the decision as A/B/C (Anthropic starter / OpenAI starter / defer outright). Between plan authorship and execution day, the user's preferred shape shifted to **multi-provider via Spring AI `ChatModel` abstraction** (Anthropic default + OpenAI reasoning for hard cases), which requires Spring AI 2.x. Spring AI 2.x only publishes compatible starters against Spring Boot 4.x, so a Boot 4 upgrade is a prerequisite — out of scope for plan 03-04.

## What This Plan Does NOT Do

- Does NOT add `org.springframework.ai:*` to `core/build.gradle.kts`.
- Does NOT add Spring AI BOM or `dependencyManagement` block.
- Does NOT create `NlMappingSuggestionService`, `NlMappingPromptBuilder`, `NlSuggestionProperties`, or any NL-related entity / repository / DDL.
- Does NOT add `nlSuggestion: NlTableSuggestion?` field to `CustomSourceSchemaResponse.TableSchemaResponse`.
- Does NOT touch `application.yml`.

The existing `CustomSourceSchemaResponse` shape from 03-03 is final for Phase 3. When 03-04 reopens post-03.5, the `nlSuggestion` field will be added as a backward-compatible optional — no breaking change to frontend consumers.

## Requirements Status

| Requirement | Status     | Rationale                                                                                                     |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| MAP-03      | Complete   | Shipped in 03-03 via `SaveCustomSourceMappingRequest.lifecycleDomain` — user manually picks domain. The LLM-suggested *default* is the part deferred, not the capability itself. |
| MAP-04      | Complete   | Shipped in 03-03 via `SaveCustomSourceMappingRequest.semanticGroup` — user manually picks. LLM default deferred with MAP-07. |
| MAP-05      | Complete   | Shipped in 03-03 via `SaveCustomSourceFieldMappingRequest.isIdentifier` per column — user manually flags. LLM default deferred with MAP-07. |
| MAP-07      | **Deferred** | LLM-assisted mapping: requires Spring AI 2.x + Boot 4. Reopens after phase 03.5-boot4-upgrade. |

**Classification note:** Only MAP-07 is `Pending`/`Deferred`. MAP-03/04/05 remain `Complete` because 03-03's save path accepts these values from the user — the LLM-suggested *pre-fill* is a separate UX enhancement and does not gate the requirement.

## User Decision — 2026-04-13

- **Decision:** Defer 03-04; stand up a new phase **03.5-boot4-upgrade** to migrate core to Spring Boot 4.x; reopen 03-04 immediately after 03.5 lands.
- **Provider strategy:** Multi-provider via Spring AI **`ChatModel`** abstraction (NOT a vendor starter). Anthropic (Claude) default. OpenAI reasoning (o-series) for schema shapes Claude flags as ambiguous.
- **Keys:** `ANTHROPIC_API_KEY` (new, default provider) + `OPENAI_REASONING_API_KEY` (new, distinct from the existing `OPENAI_API_KEY` used by the embeddings provider). Distinct keys keep rotation + blast radius isolated.
- **Dependency gate:** `core/CLAUDE.md` "Discuss any new dependency before adding it" — Spring AI is net-new. When 03-04 reopens, re-run the dependency-approval checkpoint against Spring AI 2.x coordinates (not the 1.0.x coordinates the original plan targeted).

## Reopening Conditions

Plan 03-04 is eligible to reopen when ALL of the following are true:

1. Phase 03.5 (Boot 4 upgrade) is marked complete in ROADMAP.md.
2. `core/gradle/libs.versions.toml` (or equivalent) reports `spring-boot = 4.x`.
3. User has confirmed or revised the multi-provider decision above (Anthropic default + OpenAI reasoning fallback).
4. Both `ANTHROPIC_API_KEY` and `OPENAI_REASONING_API_KEY` are procured and available to the target environment (env var, not hardcoded).

At reopen, the original 03-04-PLAN.md should be **rewritten**, not resumed — the original targets Spring AI 1.0.x + a single-provider starter, which no longer matches the locked strategy.

## Deviations from Plan

**The entire plan was not executed.** This is a deliberate deferral, not a partial execution. No tasks were attempted, no checkpoints opened, no build files edited.

## Deferred Issues

- **MAP-07 (LLM-assisted mapping suggestions)** — waiting on phase 03.5 (Boot 4 upgrade). See Reopening Conditions above.

## Next Phase Readiness

- **Phase 3 closes at plan 03-03** for ingestion-path purposes — `PostgresAdapter`, schema inference, mapping save, and readonly EntityType creation all ship without NL assist.
- **Phase 4 (Ingestion Orchestrator)** is unblocked. It reads `CustomSourceTableMappingEntity.published=true` rows; NL suggestions were never on its input contract.
- **Phase 7 (Frontend Mapping UI)** is unblocked for manual mapping flows. The "LLM suggestions" row in UI-05 renders as empty/placeholder until 03-04 reopens; that degradation is cosmetic, not functional.

## Self-Check: PASSED

- [x] No files created in `core/` (bookkeeping-only plan)
- [x] `.planning/phases/03-postgres-adapter-schema-mapping/03-04-SUMMARY.md` — FOUND (this file)
- [x] `.planning/STATE.md` — updated (see STATE commit)
- [x] `.planning/ROADMAP.md` — updated to mark 03-04 deferred
- [x] `.planning/REQUIREMENTS.md` — MAP-07 remains Pending (no over-deferral of MAP-03/04/05)
- [x] No `build.gradle.kts` edit
- [x] No Spring AI dependency added

---
*Phase: 03-postgres-adapter-schema-mapping*
*Deferred: 2026-04-13 (pending phase 03.5-boot4-upgrade)*
