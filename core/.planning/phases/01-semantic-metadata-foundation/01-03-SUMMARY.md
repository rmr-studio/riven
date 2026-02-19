---
phase: 01-semantic-metadata-foundation
plan: 03
subsystem: entity
tags: [semantic-metadata, controller, rest-api, knowledge, response-models]
dependency_graph:
  requires:
    - phase: 01-02
      provides: EntityTypeSemanticMetadataService, SaveSemanticMetadataRequest, BulkSaveSemanticMetadataRequest
  provides:
    - KnowledgeController (8 REST endpoints at /api/v1/knowledge)
    - SemanticMetadataBundle response model
    - EntityTypeWithSemanticsResponse response model
    - ?include=semantics on entity type list and detail endpoints
  affects: ["phase-02-template-installation", "any future knowledge/semantic consumers"]
tech_stack:
  added: []
  patterns: ["thin-controller-delegates-to-service", "opt-in-response-enrichment-via-include-param", "bundle-assembly-from-flat-list"]
key_files:
  created:
    - src/main/kotlin/riven/core/controller/knowledge/KnowledgeController.kt
    - src/main/kotlin/riven/core/models/response/entity/type/SemanticMetadataBundle.kt
    - src/main/kotlin/riven/core/models/response/entity/type/EntityTypeWithSemanticsResponse.kt
  modified:
    - src/main/kotlin/riven/core/controller/entity/EntityTypeController.kt
key-decisions:
  - "EntityTypeController list/detail endpoints return EntityTypeWithSemanticsResponse consistently (semantics=null when not requested) rather than switching response types — consistent typing avoids client-side branching"
  - "buildBundle helper duplicated in both KnowledgeController and EntityTypeController (rather than extracted to shared utility) — it is simple response-mapping logic appropriate per-controller per CLAUDE.md"
  - "?include=semantics uses getMetadataForEntityTypes (batch, no workspace auth) for list endpoint and getAllMetadataForEntityType (single, with workspace auth) for detail endpoint — batch call is called from within already-authorized context"
patterns-established:
  - "Opt-in response enrichment: ?include=semantics pattern for attaching related metadata to primary resource responses"
  - "Bundle assembly: partition flat metadata list by targetType, associateBy targetId into typed maps"
metrics:
  duration: 3 min
  completed: 2026-02-19
  tasks: 3
  files: 4
---

# Phase 1 Plan 03: KnowledgeController and Semantics API Layer Summary

**KnowledgeController with 8 semantic metadata CRUD endpoints at /api/v1/knowledge plus opt-in ?include=semantics on entity type list and detail endpoints.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T06:19:27Z
- **Completed:** 2026-02-19T06:22:28Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Created KnowledgeController at `/api/v1/knowledge` with 8 endpoints covering entity type, attribute (individual + bulk), relationship, and bundle metadata operations
- Created `SemanticMetadataBundle` and `EntityTypeWithSemanticsResponse` response models
- Added `?include=semantics` query parameter to `getEntityTypesForWorkspace` and `getEntityTypeByKeyForWorkspace` in EntityTypeController — backward compatible (null semantics when not requested)
- Full build and 625-test suite pass with zero failures, zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Response models and KnowledgeController** - `d85a33f7` (feat)
2. **Task 2: ?include=semantics on EntityTypeController** - `73cc1770` (feat)
3. **Task 3: End-to-end compilation and test verification** - (no code changes; verification via existing commits)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/main/kotlin/riven/core/controller/knowledge/KnowledgeController.kt` - REST controller for semantic metadata CRUD (8 endpoints, delegates to EntityTypeSemanticMetadataService)
- `src/main/kotlin/riven/core/models/response/entity/type/SemanticMetadataBundle.kt` - Bundle wrapping entity type + attribute + relationship metadata maps
- `src/main/kotlin/riven/core/models/response/entity/type/EntityTypeWithSemanticsResponse.kt` - Wrapper for entity type with optional semantics bundle
- `src/main/kotlin/riven/core/controller/entity/EntityTypeController.kt` - Added EntityTypeSemanticMetadataService dependency, ?include=semantics param on list and detail endpoints, buildBundle helper

## Decisions Made

- `EntityTypeController` list and detail endpoints now return `EntityTypeWithSemanticsResponse` consistently rather than switching between `EntityType` and `EntityTypeWithSemanticsResponse` based on the include param — consistent typing avoids client-side branching. The `semantics` field is null when not requested.
- `buildBundle` helper is duplicated in both `KnowledgeController` and `EntityTypeController` rather than extracted to a shared utility. Per CLAUDE.md, simple response-mapping logic belongs per-controller. The duplication is minimal (~8 lines each).
- For the list endpoint, `getMetadataForEntityTypes` (no `@PreAuthorize`, called internally) is used rather than calling `getAllMetadataForEntityType` per entity type in a loop — avoids N+1 and the calling context already has workspace access verified via `getWorkspaceEntityTypes`.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

**Files verified:**
- FOUND: src/main/kotlin/riven/core/controller/knowledge/KnowledgeController.kt (8 endpoints)
- FOUND: src/main/kotlin/riven/core/models/response/entity/type/SemanticMetadataBundle.kt
- FOUND: src/main/kotlin/riven/core/models/response/entity/type/EntityTypeWithSemanticsResponse.kt

**Commits verified:**
- d85a33f7: feat(01-03): add KnowledgeController with semantic metadata CRUD endpoints
- 73cc1770: feat(01-03): add ?include=semantics to EntityTypeController

**Test suite:** 625 tests, 0 failures, 0 errors (`./gradlew test` — BUILD SUCCESSFUL)

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 1 is now complete. All three plans delivered:
- **01-01:** Database schema (entity_type_semantic_metadata table with pgvector-ready embedding column)
- **01-02:** Service layer (EntityTypeSemanticMetadataService with full CRUD, lifecycle hooks, 13 unit tests)
- **01-03:** API layer (KnowledgeController with 8 endpoints, ?include=semantics on EntityTypeController)

Phase 1 success criteria are fully met:
1. User can set/get semantic definition on entity type (KnowledgeController GET/PUT /entity-type/{id})
2. User can assign classification + description to attribute with validation (PUT /attribute/{id}, 400 on invalid enum)
3. User can set semantic context on relationship (PUT /relationship/{id})
4. All endpoints enforce workspace security (service-layer @PreAuthorize)
5. Metadata in separate table, existing CRUD unaffected (lifecycle hooks are additive)

Ready for Phase 2 (template installation) which will use the bulk attribute metadata endpoint (`PUT /attributes/bulk`).

---
*Phase: 01-semantic-metadata-foundation*
*Completed: 2026-02-19*
