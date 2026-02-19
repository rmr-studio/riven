# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Entity data is semantically enriched and embedded so that the system understands what business concepts its data represents
**Current focus:** Phase 1 — Semantic Metadata Foundation

## Current Position

Phase: 1 of 4 (Semantic Metadata Foundation)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-19 — Completed Plan 02 (service layer: EntityTypeSemanticMetadataService, lifecycle hooks, unit tests)

Progress: [██░░░░░░░░] 17%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 5 min
- Total execution time: 10 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-semantic-metadata-foundation | 2/3 | 10 min | 5 min |

**Recent Trend:**
- Last 5 plans: 3 min, 7 min
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- pgvector over dedicated vector DB: keeps infrastructure single-PostgreSQL, sufficient for initial scale
- Queue-based enrichment triggers: follows existing workflow queue pattern, decouples writes from embedding generation
- Semantic metadata in separate table (INFRA-06): avoids polluting entity_types CRUD hot path
- SemanticAttributeClassification uses lowercase enum constants (identifier, categorical, etc.) to match JSON wire format — Jackson requires exact case match, ACCEPT_CASE_INSENSITIVE_ENUMS not enabled
- hardDeleteByTarget for attribute/relationship orphan cleanup; softDeleteByEntityTypeId for entity type deletion cascade
- Lifecycle hooks wired into addOrUpdateRelationship (catches all add paths including inverse reference creation) rather than only updateRelationships.diff.added path
- No activity logging for semantic metadata mutations (enforced via locked decision)

### Pending Todos

None yet.

### Blockers/Concerns

- Research flags: verify `com.pgvector:pgvector:0.1.6` version at Maven Central before Phase 3
- Research flags: verify `ankane/pgvector:pg16` Docker Hub image tag before Phase 3 Testcontainers config (NOTE: plan 01 used pgvector/pgvector:pg16 which is the correct image)
- Research flags: verify Temporal SDK 1.24.1 child workflow API before Phase 4 planning
- Research flags: decide token-count strategy for enriched text (character heuristic vs. JVM tiktoken) during Phase 3 planning

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 01-02-PLAN.md (service layer: EntityTypeSemanticMetadataService, lifecycle hooks wired into 3 existing services, 13 unit tests)
Resume file: None
