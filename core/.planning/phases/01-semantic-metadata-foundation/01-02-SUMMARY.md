---
phase: 01-semantic-metadata-foundation
plan: 02
subsystem: entity
tags: [semantic-metadata, service-layer, lifecycle-hooks, unit-tests]
dependency_graph:
  requires: ["01-01"]
  provides: ["EntityTypeSemanticMetadataService", "SaveSemanticMetadataRequest", "BulkSaveSemanticMetadataRequest"]
  affects: ["EntityTypeService", "EntityTypeAttributeService", "EntityTypeRelationshipService"]
tech_stack:
  added: []
  patterns: ["lifecycle-hook-injection", "workspace-ownership-verification", "PUT-semantics-upsert"]
key_files:
  created:
    - src/main/kotlin/riven/core/service/entity/EntityTypeSemanticMetadataService.kt
    - src/main/kotlin/riven/core/models/request/entity/type/SaveSemanticMetadataRequest.kt
    - src/main/kotlin/riven/core/models/request/entity/type/BulkSaveSemanticMetadataRequest.kt
    - src/test/kotlin/riven/core/service/entity/EntityTypeSemanticMetadataServiceTest.kt
  modified:
    - src/main/kotlin/riven/core/service/entity/type/EntityTypeService.kt
    - src/main/kotlin/riven/core/service/entity/type/EntityTypeAttributeService.kt
    - src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt
    - src/test/kotlin/riven/core/service/entity/type/EntityTypeRelationshipServiceTest.kt
decisions:
  - "No activity logging for metadata mutations (locked decision enforced)"
  - "Lifecycle hooks wired into addOrUpdateRelationship to catch both direct adds and inverse reference creation"
  - "deleteForTarget also called in removeReferenceRelationship (direct removal path) in addition to cascade paths"
metrics:
  duration: 7 min
  completed: 2026-02-19
  tasks: 3
  files: 8
---

# Phase 1 Plan 02: EntityTypeSemanticMetadataService Summary

**One-liner:** Full CRUD service for semantic metadata with lifecycle hooks wired into entity type, attribute, and relationship mutation paths.

## What Was Built

### New Service: EntityTypeSemanticMetadataService

Located at `riven.core.service.entity` (not `.type` — this is a domain-level concern, not a sub-service of EntityTypeService).

**Public read operations:**
- `getForEntityType` — returns the ENTITY_TYPE-targeted metadata record for an entity type
- `getAttributeMetadata` — returns all ATTRIBUTE-targeted records for an entity type
- `getRelationshipMetadata` — returns all RELATIONSHIP-targeted records for an entity type
- `getAllMetadataForEntityType` — returns all records (entity type + attributes + relationships)
- `getMetadataForEntityTypes` — batch lookup by entity type IDs (no @PreAuthorize, called internally)

**Public mutations:**
- `upsertMetadata` — PUT semantics: full replacement of definition, classification, tags for a single target
- `bulkUpsertAttributeMetadata` — batch upsert with single-query prefetch to avoid N+1

**Lifecycle hooks:**
- `initializeForEntityType` — batch-creates metadata records on entity type publish
- `initializeForTarget` — creates a single record for a new attribute or relationship
- `deleteForTarget` — hard-deletes a record when attribute/relationship is removed
- `softDeleteForEntityType` — soft-deletes all metadata when entity type is soft-deleted
- `restoreForEntityType` — placeholder (logged as warning; requires native query per research pitfall 1)

### New Request DTOs

- `SaveSemanticMetadataRequest` — nullable classification (PUT semantics, unknown enum values rejected by Jackson as 400)
- `BulkSaveSemanticMetadataRequest` — per-attribute entry with targetId + same nullable fields

### Lifecycle Hooks Wired

| Service | Method | Hook |
|---------|--------|------|
| EntityTypeService | publishEntityType | initializeForEntityType (entity type + identifier attribute) |
| EntityTypeService | deleteEntityType | softDeleteForEntityType (before soft-delete) |
| EntityTypeAttributeService | saveAttributeDefinition | initializeForTarget (new attributes only, detected pre-schema-update) |
| EntityTypeAttributeService | removeAttributeDefinition | deleteForTarget (hard-delete) |
| EntityTypeRelationshipService | addOrUpdateRelationship | initializeForTarget (new relationships only, detected by existingIndex < 0) |
| EntityTypeRelationshipService | removeOriginRelationship | deleteForTarget (ORIGIN metadata) |
| EntityTypeRelationshipService | removeInverseReferenceRelationship | deleteForTarget (REFERENCE metadata, cascade path) |
| EntityTypeRelationshipService | removeReferenceRelationship | deleteForTarget (REFERENCE metadata, direct path) |

### Unit Tests: 13 Test Cases

All in `EntityTypeSemanticMetadataServiceTest`:
- 3 read tests (returns data, not found, wrong workspace)
- 2 attribute/relationship metadata read tests
- 2 upsert tests (create new, update with full replacement)
- 1 bulk upsert test
- 3 lifecycle hook tests (initializeForEntityType, initializeForTarget, deleteForTarget)
- 1 soft-delete test
- 1 workspace rejection test

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Additional Hooks Added (Rule 2 — Missing Critical Functionality)

The plan specified hooks in `updateRelationships` (where `diff.added` is processed) and `removeRelationships` for the removal path. Upon reading the actual code:

- **Added:** The metadata init hook was placed in `addOrUpdateRelationship` (private helper) rather than in `updateRelationships`. This catches **all** addition paths including bidirectional inverse reference creation via `createInverseReferenceRelationships`, not just the `diff.added` path. More comprehensive.

- **Added:** `deleteForTarget` hook also added to `removeReferenceRelationship` (direct REFERENCE removal path, non-DELETE_RELATIONSHIP actions). The plan mentioned the cascade path (`removeInverseReferenceRelationship`) but the direct removal path also needed coverage.

Both additions are correctness requirements — without them, metadata would leak on certain removal paths.

## Self-Check: PASSED

**Files verified:**
- FOUND: src/main/kotlin/riven/core/service/entity/EntityTypeSemanticMetadataService.kt (310 lines, min: 100)
- FOUND: src/main/kotlin/riven/core/models/request/entity/type/SaveSemanticMetadataRequest.kt
- FOUND: src/main/kotlin/riven/core/models/request/entity/type/BulkSaveSemanticMetadataRequest.kt
- FOUND: src/test/kotlin/riven/core/service/entity/EntityTypeSemanticMetadataServiceTest.kt (13 tests, min: 12)

**Commits verified:**
- 969db026: feat(01-02): add EntityTypeSemanticMetadataService and request DTOs
- 40294e99: feat(01-02): wire semantic metadata lifecycle hooks into entity type services
- 879e2d06: test(01-02): add unit tests for EntityTypeSemanticMetadataService

**Test suite:** All tests pass (`./gradlew test` — BUILD SUCCESSFUL)
