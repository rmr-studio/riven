---
phase: 02-scoring-improvements-signal-classification
plan: 01
subsystem: identity
tags: [signal-type, scoring, candidate-matching, classification-cache, semantic-metadata]
dependency_graph:
  requires: [01-02]
  provides: [MatchSource enum, candidateSignalType on CandidateMatch, signal_type SQL column, classification cache with MatchSignalType]
  affects: [EntityTypeClassificationService, IdentityMatchCandidateService, EntityTypeSemanticMetadataService]
tech_stack:
  added: []
  patterns: [signal-type-aware candidate tagging, auto-derivation on classification save]
key_files:
  created:
    - src/main/kotlin/riven/core/enums/identity/MatchSource.kt
  modified:
    - src/main/kotlin/riven/core/enums/identity/MatchSignalType.kt
    - src/main/kotlin/riven/core/models/identity/CandidateMatch.kt
    - src/main/kotlin/riven/core/models/identity/MatchSignal.kt
    - src/main/kotlin/riven/core/entity/entity/EntityTypeSemanticMetadataEntity.kt
    - src/main/kotlin/riven/core/models/entity/EntityTypeSemanticMetadata.kt
    - src/main/kotlin/riven/core/service/identity/EntityTypeClassificationService.kt
    - src/main/kotlin/riven/core/service/identity/IdentityMatchCandidateService.kt
    - src/main/kotlin/riven/core/service/entity/EntityTypeSemanticMetadataService.kt
    - db/schema/01_tables/entities.sql
    - src/test/kotlin/riven/core/service/util/factory/identity/IdentityFactory.kt
    - src/test/kotlin/riven/core/service/identity/EntityTypeClassificationServiceTest.kt
    - src/test/kotlin/riven/core/service/identity/IdentityMatchCandidateServiceTest.kt
decisions:
  - "fromColumnValue() chosen over valueOf() for CUSTOM -> CUSTOM_IDENTIFIER mapping to avoid IllegalArgumentException"
  - "CUSTOM_IDENTIFIER as fallback when signal_type column is null (pre-existing rows without signal_type)"
  - "deriveSignalType() defaults to CUSTOM when no schemaType available in upsert request DTOs"
  - "matchSource defaults to TRIGRAM for backward Temporal serialization compatibility"
metrics:
  duration: 67 minutes
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_changed: 12
---

# Phase 02 Plan 01: Signal-Type Infrastructure Summary

Signal-type-aware scoring foundations: MatchSource enum, extended CandidateMatch/MatchSignal models, signal_type SQL column, classification cache returning Map<UUID, MatchSignalType>, candidateSignalType populated in candidate queries, and auto-derivation in metadata service.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create MatchSource enum, extend models, SQL schema, JPA entity/domain model, test factory | 437308238 | 7 files |
| 2 | Extend classification cache, wire candidateSignalType in queries, add auto-derivation, write tests | 56c213d60 | 6 files |

## What Was Built

### MatchSource Enum
New `src/main/kotlin/riven/core/enums/identity/MatchSource.kt` with 5 `@JsonProperty`-annotated values: TRIGRAM, EXACT_NORMALIZED, NICKNAME, EMAIL_DOMAIN, PHONETIC. Allows downstream scoring to distinguish how a candidate was found.

### Extended CandidateMatch
Added `candidateSignalType: MatchSignalType? = null` (signal type of the candidate's metadata row) and `matchSource: MatchSource = MatchSource.TRIGRAM` (defaults preserve Temporal serialization boundary safety).

### Extended MatchSignal
Added `matchSource: MatchSource = MatchSource.TRIGRAM` and `crossType: Boolean = false`. Updated `toMap()` to include both fields in JSONB serialization.

### SQL Schema
Added `signal_type TEXT CHECK (signal_type IS NULL OR signal_type IN ('NAME', 'COMPANY', 'PHONE', 'EMAIL', 'CUSTOM'))` column after `classification` on `entity_type_semantic_metadata`. Declarative update to existing table definition.

### JPA Entity + Domain Model
Added `signalType: String?` to `EntityTypeSemanticMetadataEntity` and `EntityTypeSemanticMetadata`. `toModel()` updated to propagate the field.

### MatchSignalType.fromColumnValue()
New companion method handles the `CUSTOM` -> `CUSTOM_IDENTIFIER` name mismatch. Returns null for null/unknown values rather than throwing.

### EntityTypeClassificationService Cache Upgrade
Cache type changed from `ConcurrentHashMap<UUID, Set<UUID>>` to `ConcurrentHashMap<UUID, Map<UUID, MatchSignalType>>`. New `getIdentifierSignalTypes()` as primary method. `getIdentifierAttributeIds()` delegates via `.keys` for backward compatibility.

### Candidate Query Signal Type Wiring
Both `runCandidateQuery` (trigram) and `findPhoneExactDigitsCandidates` now SELECT `sm.signal_type AS candidate_signal_type` and populate `candidateSignalType` on constructed `CandidateMatch` objects. Phone exact-digits candidates explicitly get `matchSource = MatchSource.EXACT_NORMALIZED`.

### Auto-Derivation in EntityTypeSemanticMetadataService
New `deriveSignalType(classification, schemaType)` private helper. Called in `upsertMetadataInternal` and `bulkUpsertAttributeMetadata` to auto-set `signal_type` whenever classification is IDENTIFIER (defaults to "CUSTOM" since request DTOs don't carry schemaType).

### Test Coverage
- `EntityTypeClassificationServiceTest`: Added `GetIdentifierSignalTypesTests` (6 tests), `FromColumnValueTests` (7 tests), `getIdentifierAttributeIds delegates to getIdentifierSignalTypes key set` test.
- `IdentityMatchCandidateServiceTest`: Updated mock query rows to include 5th column for `candidate_signal_type`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] IdentityMatchCandidateServiceTest ArrayIndexOutOfBoundsException after adding 5th column**
- **Found during:** Task 2 verification
- **Issue:** Adding `sm.signal_type` as 5th column to SELECT caused existing mock query rows (4 elements) to throw `ArrayIndexOutOfBoundsException` at `row[4]`.
- **Fix:** Updated `candidateQuery()` helper to use `Array<Any?>` and added 5th `null` element to all test candidate row arrays.
- **Files modified:** `src/test/kotlin/riven/core/service/identity/IdentityMatchCandidateServiceTest.kt`
- **Commit:** 56c213d60

### Design Decisions (from plan guidance)

**deriveSignalType defaults to CUSTOM, not EMAIL/PHONE** — The `SaveSemanticMetadataRequest` and `BulkSaveSemanticMetadataRequest` DTOs carry no `schemaType` field. Without schema type available at the call site, the derivation always produces "CUSTOM" for IDENTIFIER classifications. EMAIL/PHONE auto-detection will require either API changes to pass schemaType, or a lookup against the entity type's schema at the service layer — deferred to a future plan.

## Self-Check: PASSED

All key files verified on disk:
- FOUND: src/main/kotlin/riven/core/enums/identity/MatchSource.kt
- FOUND: src/main/kotlin/riven/core/models/identity/CandidateMatch.kt
- FOUND: src/main/kotlin/riven/core/models/identity/MatchSignal.kt

All commits verified:
- FOUND: 437308238 (Task 1)
- FOUND: 56c213d60 (Task 2)
