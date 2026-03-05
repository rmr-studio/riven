---
phase: 02-loader-pipeline
plan: 01
subsystem: database, api
tags: [jpa, spring-data, json-schema, stale-reconciliation, pipeline-data-classes]

# Dependency graph
requires:
  - phase: 01-database-foundation
    provides: Catalog tables, JPA entities, repositories, JSON Schema files
provides:
  - Stale column on manifest_catalog for reconciliation
  - Delete-by methods on all child repositories for delete-reinsert pattern
  - Pipeline intermediate data classes (ScannedManifest, ResolvedManifest, etc.)
  - ADR-004 field mapping format enforced in integration.schema.json
  - Test fixture manifests for model, template, and integration patterns
affects: [02-02-PLAN, 02-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [stale-based-reconciliation, delete-reinsert-child-reconciliation, pipeline-data-contracts]

key-files:
  created:
    - src/main/kotlin/riven/core/models/catalog/ManifestPipelineModels.kt
    - src/test/resources/manifests/models/customer.json
    - src/test/resources/manifests/templates/saas-starter/manifest.json
    - src/test/resources/manifests/integrations/hubspot/manifest.json
  modified:
    - db/schema/01_tables/catalog.sql
    - src/main/kotlin/riven/core/entity/catalog/ManifestCatalogEntity.kt
    - src/main/kotlin/riven/core/repository/catalog/ManifestCatalogRepository.kt
    - src/main/kotlin/riven/core/repository/catalog/CatalogEntityTypeRepository.kt
    - src/main/kotlin/riven/core/repository/catalog/CatalogRelationshipRepository.kt
    - src/main/kotlin/riven/core/repository/catalog/CatalogRelationshipTargetRuleRepository.kt
    - src/main/kotlin/riven/core/repository/catalog/CatalogFieldMappingRepository.kt
    - src/main/kotlin/riven/core/repository/catalog/CatalogSemanticMetadataRepository.kt
    - src/main/resources/manifests/schemas/integration.schema.json

key-decisions:
  - "Pipeline data classes use Map<String, Any> for schema/mappings JSONB passthrough rather than typed structures"
  - "Test fixtures placed in src/test/resources/manifests/ matching production directory structure"

patterns-established:
  - "Stale reconciliation: markAllStale() at load start, un-stale on upsert, findByStaleTrue() for post-load summary"
  - "Child deletion: deleteByManifestId on direct children, deleteBy*IdIn on grandchildren for cascading delete-reinsert"

requirements-completed: [TEST-05]

# Metrics
duration: 3min
completed: 2026-03-05
---

# Phase 2 Plan 01: Schema Evolution and Pipeline Foundation Summary

**Stale reconciliation column, child deletion methods, 8 pipeline data classes, ADR-004 field mapping schema, and 3 test fixture manifests covering model/$ref+extend/integration patterns**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T07:01:25Z
- **Completed:** 2026-03-05T07:04:33Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Stale-based reconciliation infrastructure ready: `stale` column on `manifest_catalog`, bulk `markAllStale()` JPQL, and stale query methods
- Delete-by methods on all 5 child repositories enabling delete-reinsert reconciliation pattern
- 8 pipeline data classes defining typed contracts between scanner, resolver, and upsert stages
- Integration JSON Schema updated to enforce ADR-004 field mapping format (`source` required, optional `transform`)
- Three test fixture manifests exercising model, template ($ref + extend + shorthand + full relationships), and integration (field mappings + readonly) patterns

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema evolution + entity/repository updates** - `186ea5ec9` (feat)
2. **Task 2: Pipeline data classes, JSON Schema, test fixtures** - `ccbc0f0d2` (feat)

## Files Created/Modified
- `db/schema/01_tables/catalog.sql` - Added `stale BOOLEAN NOT NULL DEFAULT false` column
- `src/main/kotlin/riven/core/entity/catalog/ManifestCatalogEntity.kt` - Added `stale` field
- `src/main/kotlin/riven/core/repository/catalog/ManifestCatalogRepository.kt` - Added markAllStale, findByStaleTrue, findByManifestTypeAndStaleTrue
- `src/main/kotlin/riven/core/repository/catalog/CatalogEntityTypeRepository.kt` - Added deleteByManifestId
- `src/main/kotlin/riven/core/repository/catalog/CatalogRelationshipRepository.kt` - Added deleteByManifestId
- `src/main/kotlin/riven/core/repository/catalog/CatalogRelationshipTargetRuleRepository.kt` - Added deleteByCatalogRelationshipIdIn
- `src/main/kotlin/riven/core/repository/catalog/CatalogFieldMappingRepository.kt` - Added deleteByManifestId
- `src/main/kotlin/riven/core/repository/catalog/CatalogSemanticMetadataRepository.kt` - Added deleteByCatalogEntityTypeIdIn
- `src/main/resources/manifests/schemas/integration.schema.json` - Updated fieldMappings to ADR-004 format
- `src/main/kotlin/riven/core/models/catalog/ManifestPipelineModels.kt` - 8 pipeline data classes
- `src/test/resources/manifests/models/customer.json` - Model fixture with 4 attributes and semantics
- `src/test/resources/manifests/templates/saas-starter/manifest.json` - Template fixture with $ref+extend, inline entity, 2 relationship formats
- `src/test/resources/manifests/integrations/hubspot/manifest.json` - Integration fixture with readonly entities, field mappings, relationship

## Decisions Made
- Pipeline data classes use `Map<String, Any>` for schema and mappings fields to match JSONB passthrough pattern (no typed structures needed since these are persisted as-is)
- Test fixtures placed in `src/test/resources/manifests/` mirroring production directory structure so scanner service tests can use them directly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Stale column and delete-by methods ready for ManifestUpsertService (02-03-PLAN)
- Pipeline data classes ready for ManifestScannerService and ManifestResolverService (02-02-PLAN)
- Test fixtures ready for scanner and resolver unit tests
- ADR-004 schema ready for integration manifest validation

---
*Phase: 02-loader-pipeline*
*Completed: 2026-03-05*
