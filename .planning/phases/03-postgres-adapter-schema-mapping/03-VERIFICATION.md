---
phase: 03-postgres-adapter-schema-mapping
verified: 2026-04-13T00:00:00Z
status: passed
score: 5/5 success criteria verified (14/15 requirements satisfied; MAP-07 deferred-by-decision per R1)
deferred_requirements:
  - id: MAP-07
    reason: "R1 decision 2026-04-13 — blocked on phase 03.5 Boot 4 upgrade (Spring AI 2.x required)"
    tracking: "03-04-SUMMARY.md (status: deferred); new phase 03.5-boot4-upgrade"
---

# Phase 3: Postgres Adapter & Schema Mapping — Verification Report

**Phase Goal (ROADMAP):** A user can introspect a connected Postgres database, map columns to entity-type attributes (with NL-assisted suggestions and index warnings), and have readonly `CUSTOM_SOURCE` entity types produced — with FK-inferred relationships where possible.

**Verified:** 2026-04-13
**Status:** passed (with MAP-07 deferred by explicit R1 user decision)
**Re-verification:** No — initial verification.

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth (ROADMAP Success Criterion) | Status | Evidence |
|---|---|---|---|
| 1 | `GET /api/v1/custom-sources/connections/{id}/schema` returns live tables/columns/types via INFORMATION_SCHEMA using a per-workspace cached HikariCP pool (maxPoolSize=2, idleTimeout=10m, maxLifetime=30m). | VERIFIED | `CustomSourceMappingController.kt:44` `@GetMapping("/schema")`; `PostgresIntrospector` queries `information_schema` + `pg_constraint` + `pg_attribute`; `WorkspaceConnectionPoolManager.kt:87-89` sets `maximumPoolSize/idleTimeout/maxLifetime` from `ConnectorPoolProperties`; pool keyed by `connectionId` via `ConcurrentHashMap.computeIfAbsent`. Verified by 6 pool tests + 11 adapter Testcontainers tests (03-02). |
| 2 | User can persist column-to-attribute mappings per table, assigning LifecycleDomain (or UNCATEGORIZED), SemanticGroup (or CUSTOM), and an identifier column — optionally accepting LLM-suggested values. | VERIFIED (LLM optional/deferred) | `SaveCustomSourceMappingRequest` exposes `lifecycleDomain`, `semanticGroup`; `SaveCustomSourceFieldMappingRequest.isIdentifier`. `CustomSourceFieldMappingService` persists via `CustomSourceFieldMappingRepository` + `CustomSourceTableMappingRepository`. LLM pre-fill (MAP-07) explicitly deferred — "optionally" language satisfied by manual selection path. |
| 3 | Saving mappings creates `EntityTypeEntity` rows with `sourceType=CUSTOM_SOURCE`, `readonly=true`, and FK constraints produce best-effort `RelationshipDefinitionEntity` rows. | VERIFIED | `CustomSourceFieldMappingService.kt:309-310` sets `sourceType = SourceType.CONNECTOR, readonly = true`; `:361-368` creates `RelationshipDefinitionEntity` rows from FK metadata. Composite FKs surfaced via `compositeFkSkipped`; pending relationships captured in field-row metadata. Note: canonical enum name is `SourceType.CONNECTOR` in code (requirement doc uses `CUSTOM_SOURCE` colloquially; the single CUSTOM_SOURCE source-type value ships as `CONNECTOR`). |
| 4 | `PostgresAdapter.fetchRecords()` honors `WHERE updated_at > :cursor` when present, falls back to PK-based comparison (inserts-only) when not, and returns `RecordBatch` with typed values mapped directly to `EntityAttributePrimitivePayload` (no SchemaMappingService transform). | VERIFIED | `PostgresFetcher` uses server-side cursor (`autoCommit=false` + `fetchSize`), cursor SQL variants for null (no WHERE), timestamp (`?::timestamptz`), and text/uuid PK (`column::text > ?`). `PgTypeMapper` maps pg types directly to `EntityAttributePrimitivePayload`. `PostgresAdapter.syncMode() = SyncMode.POLL` (line 54). Registered via `@SourceTypeAdapter(SourceType.CONNECTOR)` (line 42). Verified by 11 Testcontainers adapter tests. |
| 5 | At the mapping step the UI/API surfaces a warning if the chosen sync-cursor column has no `pg_indexes` entry for the target table. | VERIFIED | `CursorIndexProbe.kt:38` queries `pg_indexes`; invoked from BOTH `CustomSourceSchemaInferenceService` (GET /schema) AND `CustomSourceFieldMappingService` (POST /mapping) for belt-and-suspenders coverage. Surface: `CursorIndexWarning { column, suggestedDdl }`. |

**Score:** 5/5 truths verified.

### Required Artifacts

All plan-frontmatter `provides` entries inspected on disk — every file exists in the expected location.

| Artifact (representative) | Status | Details |
|---|---|---|
| `core/src/main/kotlin/riven/core/service/connector/postgres/PostgresAdapter.kt` | VERIFIED | `@SourceTypeAdapter(SourceType.CONNECTOR)`, `syncMode()=POLL`, `introspectWithFkMetadata` wired. |
| `.../postgres/PostgresIntrospector.kt` + `PostgresFetcher.kt` + `PgTypeMapper.kt` + `SchemaHasher.kt` + `ForeignKeyMetadata.kt` + `IntrospectionResult.kt` | VERIFIED | All seven Postgres-adapter utility files present under `service/connector/postgres/`. |
| `.../pool/WorkspaceConnectionPoolManager.kt` + `configuration/properties/ConnectorPoolProperties.kt` | VERIFIED | Hikari config constants bound via `@ConfigurationProperties`. |
| `.../mapping/CustomSourceSchemaInferenceService.kt` + `CustomSourceFieldMappingService.kt` + `CursorIndexProbe.kt` | VERIFIED | Three mapping services present; responses/requests under `models/connector/{request,response}/`. |
| `.../controller/connector/CustomSourceMappingController.kt` | VERIFIED | `@GetMapping("/schema")` + `@PostMapping("/schema/tables/{tableName}/mapping")`. |
| `.../entity/connector/CustomSourceTableMappingEntity.kt` + `CustomSourceFieldMappingEntity.kt` | VERIFIED | Full JPA + `@SQLRestriction` + `toModel()`. |
| `.../repository/connector/CustomSourceTableMappingRepository.kt` + `CustomSourceFieldMappingRepository.kt` | VERIFIED | Spring Data interfaces with derived queries. |
| `core/db/schema/01_tables/_connector_{table,field}_mappings.sql` + `02_indexes/_connector_mappings.sql` + `04_constraints/_connector_mappings.sql` | VERIFIED | Declarative DDL, indexes, FK ON DELETE CASCADE. |
| `core/src/main/kotlin/riven/core/exceptions/connector/MappingValidationException.kt` | VERIFIED | Wired to `ExceptionHandler` + `ApiError.MAPPING_VALIDATION_FAILED`. |
| NL suggestion services (`NlMappingSuggestionService` etc.) | DEFERRED | Per plan 03-04 (status: deferred). Explicitly out of scope pending 03.5-boot4-upgrade. |

### Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `PostgresAdapter` | `SourceTypeAdapterRegistry` | `@SourceTypeAdapter(SourceType.CONNECTOR)` annotation | WIRED (line 42) |
| `PostgresAdapter` | `WorkspaceConnectionPoolManager` | Pool lookup by `connectionId` | WIRED (adapter tests pass against Testcontainers) |
| `CustomSourceFieldMappingService` | `EntityTypeRepository` | Direct `save(EntityTypeEntity(sourceType=CONNECTOR, readonly=true, ...))` | WIRED (line 309-310) |
| `CustomSourceFieldMappingService` | `RelationshipDefinitionEntity` | FK metadata → `RelationshipDefinitionEntity` create | WIRED (line 361-368) |
| `CustomSourceSchemaInferenceService` | `CursorIndexProbe` | Called on introspection merge | WIRED |
| `CustomSourceFieldMappingService` | `CursorIndexProbe` | Called on Save to probe `isSyncCursor` column | WIRED |
| `DataConnectorConnectionService` | `WorkspaceConnectionPoolManager.evict` | credential-update + softDelete paths | WIRED (Task 3 of 03-02) |
| `CustomSourceMappingController` | `CustomSource*Service` | One-line delegation, thin controller | WIRED |

### Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|---|---|---|---|---|
| PG-01 | 03-00, 03-02 | HikariCP pool (maxPoolSize=2, idleTimeout=10m, maxLifetime=30m) | SATISFIED | `WorkspaceConnectionPoolManager.kt:87-89` + `ConnectorPoolProperties` |
| PG-02 | 03-00, 03-01, 03-02 | `introspectSchema()` via INFORMATION_SCHEMA | SATISFIED | `PostgresIntrospector` — information_schema + pg_constraint + pg_attribute |
| PG-03 | 03-00, 03-02 | `fetchRecords()` cursor via `updated_at` | SATISFIED | `PostgresFetcher` timestamp cursor variant (`?::timestamptz`) |
| PG-04 | 03-00, 03-02 | PK-based fallback for inserts-only | SATISFIED | `PostgresFetcher` PK variant (`column::text > ?`); null-cursor WHERE-less variant |
| PG-05 | 03-00, 03-01, 03-02 | Values mapped directly to `EntityAttributePrimitivePayload` | SATISFIED | `PgTypeMapper` + `PostgresFetcher` typed payload path — no SchemaMappingService |
| PG-06 | 03-00, 03-02 | `syncMode() = POLL` | SATISFIED | `PostgresAdapter.kt:54` |
| PG-07 | 03-00, 03-02, 03-03 | FK constraint introspection → `RelationshipDefinitionEntity` | SATISFIED | `PostgresIntrospector` surfaces `ForeignKeyMetadata`; `CustomSourceFieldMappingService.kt:361-368` materialises rows (composite FKs skipped; pending FKs retained on field row) |
| MAP-01 | 03-00, 03-03 | `CustomSourceSchemaInferenceService` exposes schema via REST | SATISFIED | `GET /api/v1/custom-sources/connections/{id}/schema` |
| MAP-02 | 03-00, 03-01, 03-03 | `CustomSourceFieldMappingService` persists mappings | SATISFIED | `POST .../schema/tables/{tableName}/mapping` + `@Transactional` save orchestration |
| MAP-03 | 03-03 | Assign LifecycleDomain per table | SATISFIED | `SaveCustomSourceMappingRequest.lifecycleDomain` (manual selection; LLM default deferred with MAP-07 but not gating) |
| MAP-04 | 03-03 | Assign SemanticGroup per table | SATISFIED | `SaveCustomSourceMappingRequest.semanticGroup` |
| MAP-05 | 03-03 | Select identifier column | SATISFIED | `SaveCustomSourceFieldMappingRequest.isIdentifier` + `identifierKey` fallback chain |
| MAP-06 | 03-00, 03-03 | Warning if sync-cursor column has no `pg_indexes` entry | SATISFIED | `CursorIndexProbe` invoked from both GET and POST paths |
| **MAP-07** | 03-04 | **NL-assisted mapping suggestions (LLM)** | **DEFERRED** | Plan 03-04 explicitly deferred (status: deferred, R1 decision 2026-04-13). Blocked on phase 03.5 (Boot 4 + Spring AI 2.x). Tracking: `03-04-SUMMARY.md`, `deferred-items.md`, ROADMAP phase row. |
| MAP-08 | 03-00, 03-01, 03-03 | EntityTypes with `sourceType=CUSTOM_SOURCE`, `readonly=true` | SATISFIED | `CustomSourceFieldMappingService.kt:309-310` (code-level enum value is `SourceType.CONNECTOR`) |

**Orphaned requirements:** None. All 15 phase requirement IDs accounted for across plan frontmatters.

**Satisfied:** 14/15 (PG-01..07, MAP-01..06, MAP-08).
**Deferred-by-decision:** 1/15 (MAP-07 — R1 2026-04-13).

### Anti-Patterns Found

None material. Code search surfaced no `TODO`, `FIXME`, placeholder/stub markers, or empty return implementations in Phase 3 production artifacts. `@Disabled` class-level annotations were used strictly as the Wave-0 scaffolding pattern (03-00) and flipped off in the owning plans (03-01/02/03); the only remaining `@Disabled` class is `NlMappingSuggestionServiceTest.kt`, which is correctly still disabled since plan 03-04 is deferred.

### Human Verification Required

None for phase-close gating. The following are covered in Phase 7 (UI) or Phase 8 (E2E):
- Visual confirmation of mapping UI drift status and cursor-index warnings rendering.
- End-to-end happy path: connect → introspect → map → readonly entity type visible.
- MAP-07 LLM UX (deferred; reopens post-03.5).

### Gaps Summary

**No blocking gaps.** All five ROADMAP Success Criteria are satisfied by code on disk with verified wiring. The single unsatisfied requirement in the phase (MAP-07) is a deliberate, documented deferral per user R1 decision on 2026-04-13, tracked in `03-04-SUMMARY.md` (status: deferred) with explicit reopening conditions tied to phase 03.5-boot4-upgrade. Per GSD convention for deferred-by-decision items, this does not constitute a gap against the phase goal: users can still complete the connect→introspect→map→readonly-entity flow manually; LLM pre-fill is a UX enhancement layered on top, not a gate on the Phase 3 outcome.

Classification therefore: **status: passed**, with MAP-07 recorded as a known-deferred requirement rather than re-flagged as a surprise gap.

---

*Verified: 2026-04-13*
*Verifier: Claude (gsd-verifier)*
