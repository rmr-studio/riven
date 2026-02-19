---
phase: 01-semantic-metadata-foundation
plan: 01
subsystem: database
tags: [postgres, pgvector, jpa, hibernate, spring-data, kotlin, soft-delete]

# Dependency graph
requires: []
provides:
  - entity_type_semantic_metadata PostgreSQL table with target_type discriminator, audit columns, soft-delete, and 3 indexes
  - pgvector extension registered in extensions.sql (INFRA-01)
  - SemanticMetadataTargetType enum (ENTITY_TYPE, ATTRIBUTE, RELATIONSHIP)
  - SemanticAttributeClassification enum with 6 lowercase wire-format constants
  - EntityTypeSemanticMetadataEntity JPA entity extending AuditableSoftDeletableEntity with toModel()
  - EntityTypeSemanticMetadata domain model
  - EntityTypeSemanticMetadataRepository with discriminator-aware queries, hardDeleteByTarget, softDeleteByEntityTypeId
  - Testcontainers switched to pgvector/pgvector:pg16 image (INFRA-04)
affects:
  - 01-02 (service layer builds on this repository)
  - 01-03 (API layer builds on service which uses this repository)
  - Phase 3 (embedding pipeline uses pgvector extension and this table)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AuditableSoftDeletableEntity inheritance for soft-delete with @SQLRestriction filter
    - target_type discriminator pattern for polymorphic metadata targets
    - lowercase enum constants for Jackson wire-format alignment
    - hardDelete vs softDelete distinction: attributes/relationships hard-delete on removal, entity types soft-delete cascade

key-files:
  created:
    - db/schema/01_tables/entity_semantic_metadata.sql
    - src/main/kotlin/riven/core/enums/entity/SemanticMetadataTargetType.kt
    - src/main/kotlin/riven/core/enums/entity/SemanticAttributeClassification.kt
    - src/main/kotlin/riven/core/entity/entity/EntityTypeSemanticMetadataEntity.kt
    - src/main/kotlin/riven/core/models/entity/EntityTypeSemanticMetadata.kt
    - src/main/kotlin/riven/core/repository/entity/EntityTypeSemanticMetadataRepository.kt
  modified:
    - db/schema/00_extensions/extensions.sql
    - src/test/kotlin/riven/core/service/entity/query/EntityQueryIntegrationTestBase.kt

key-decisions:
  - "SemanticAttributeClassification uses lowercase enum constant names to match JSON wire format — ObjectMapperConfig does not enable ACCEPT_CASE_INSENSITIVE_ENUMS"
  - "hardDeleteByTarget for attribute/relationship orphan cleanup, softDeleteByEntityTypeId for entity type cascade (locked decisions from research phase)"
  - "pgvector/pgvector:pg16 as Testcontainers image — includes vector extension pre-installed, no manual setup required"

patterns-established:
  - "Discriminator-based metadata: target_type TEXT CHECK constraint + targetId UUID identifies which domain object metadata describes"
  - "Lowercase enum constants: use @Suppress(EnumEntryName) when enum values must be lowercase to match wire format"

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 1 Plan 01: Semantic Metadata Foundation — Data Layer Summary

**PostgreSQL entity_type_semantic_metadata table with target_type discriminator, pgvector extension, JPA entity extending AuditableSoftDeletableEntity, 6-value classification enum with lowercase wire-format constants, and full repository including hard-delete and soft-delete-cascade JPQL**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T06:03:14Z
- **Completed:** 2026-02-19T06:06:34Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Registered pgvector extension in extensions.sql (INFRA-01) and switched Testcontainers to pgvector/pgvector:pg16 (INFRA-04)
- Created entity_type_semantic_metadata table with target_type discriminator, unique constraint on (entity_type_id, target_type, target_id), soft-delete columns, audit columns, and 3 partial indexes
- Created full Kotlin data layer: 2 enums, 1 JPA entity, 1 domain model, 1 repository — all following established patterns from EntityTypeEntity

## Task Commits

Each task was committed atomically:

1. **Task 1: Database schema and pgvector extension** - `abc57fe6` (feat)
2. **Task 2: Enums, JPA entity, domain model, and repository** - `d3a59f2e` (feat)

**Plan metadata:** `(pending — created after self-check)`

## Files Created/Modified
- `db/schema/00_extensions/extensions.sql` - Added pgvector CREATE EXTENSION IF NOT EXISTS "vector"
- `db/schema/01_tables/entity_semantic_metadata.sql` - Full DDL: table + unique constraint + 3 partial indexes
- `src/main/kotlin/riven/core/enums/entity/SemanticMetadataTargetType.kt` - ENTITY_TYPE, ATTRIBUTE, RELATIONSHIP discriminator enum
- `src/main/kotlin/riven/core/enums/entity/SemanticAttributeClassification.kt` - 6 lowercase classification values with @Suppress(EnumEntryName)
- `src/main/kotlin/riven/core/entity/entity/EntityTypeSemanticMetadataEntity.kt` - JPA entity with toModel(), extends AuditableSoftDeletableEntity, JSONB tags
- `src/main/kotlin/riven/core/models/entity/EntityTypeSemanticMetadata.kt` - Domain model data class
- `src/main/kotlin/riven/core/repository/entity/EntityTypeSemanticMetadataRepository.kt` - 4 derived queries + 2 JPQL mutations
- `src/test/kotlin/riven/core/service/entity/query/EntityQueryIntegrationTestBase.kt` - Testcontainers image updated to pgvector/pgvector:pg16

## Decisions Made
- Used lowercase enum constant names for `SemanticAttributeClassification` (e.g. `identifier` not `IDENTIFIER`) because the project's ObjectMapperConfig does not enable `ACCEPT_CASE_INSENSITIVE_ENUMS` — Jackson requires exact case match with the wire format. Applied `@Suppress("EnumEntryName")` to suppress Kotlin lint warning.
- `hardDeleteByTarget` for metadata records orphaned by attribute/relationship removal — hard-delete preserves the unique constraint for future re-adds. `softDeleteByEntityTypeId` for cascade on entity type deletion — soft-delete for audit trail.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- All artifacts from the must_haves spec are in place: table DDL, pgvector extension, both enums, JPA entity, domain model, repository
- Plan 02 (service layer) can import EntityTypeSemanticMetadataRepository and EntityTypeSemanticMetadata directly
- Plan 03 (API layer) builds on the service Plan 02 will create
- pgvector extension is registered and Testcontainers is configured for integration tests that will be added in Plan 02+

## Self-Check: PASSED

All 7 files verified present on disk. Both task commits (abc57fe6, d3a59f2e) verified in git history.

---
*Phase: 01-semantic-metadata-foundation*
*Completed: 2026-02-19*
