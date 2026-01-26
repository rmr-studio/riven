# Requirements: OpenAPI Migration

**Defined:** 2025-01-25
**Core Value:** All backend communication flows through generated API classes with consistent error handling

## v1 Requirements

Requirements for completing the migration. Each maps to roadmap phases.

### API Factories

- [x] **API-01**: Create `lib/api/block-api.ts` factory for BlockApi
- [x] **API-02**: Create `lib/api/user-api.ts` factory for UserApi
- [x] **API-03**: Create `lib/api/workspace-api.ts` factory for WorkspaceApi

### Service Migration

- [x] **SVC-01**: Migrate `block.service.ts` to use generated BlockApi with `normalizeApiError`
- [x] **SVC-02**: Migrate `block-type.service.ts` to use generated BlockApi with `normalizeApiError`
- [x] **SVC-03**: Migrate `layout.service.ts` to use generated BlockApi with `normalizeApiError`
- [x] **SVC-04**: Migrate `user.service.ts` to use generated UserApi with `normalizeApiError`
- [x] **SVC-05**: Migrate `workspace.service.ts` to use generated WorkspaceApi with `normalizeApiError`

### Type Barrels

- [x] **TYPE-01**: Create `lib/types/entity/index.ts` barrel with re-exports and custom types/guards
- [x] **TYPE-02**: Create `lib/types/block/index.ts` barrel with re-exports and custom types/guards
- [x] **TYPE-03**: Create `lib/types/workspace/index.ts` barrel with re-exports and custom types
- [x] **TYPE-04**: Create `lib/types/user/index.ts` barrel with re-exports and custom types
- [x] **TYPE-05**: Update `.openapi-generator-ignore` to protect custom barrel directories

### Import Updates

- [x] **IMP-01**: Update entity-related imports (~15 files) to use `@/lib/types/entity`
- [x] **IMP-02**: Update block-related imports (~25 files) to use `@/lib/types/block`
- [x] **IMP-03**: Update workspace-related imports (~5 files) to use `@/lib/types/workspace`
- [x] **IMP-04**: Update user-related imports (~5 files) to use `@/lib/types/user`

### Cleanup

- [x] **CLN-01**: Remove legacy `.interface.ts` files after imports updated
- [x] **CLN-02**: Delete `lib/types/types.ts` after all migrations complete

## v2 Requirements

None — this is a complete migration.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend OpenAPI spec changes | Client-side migration only |
| New API endpoints | Migrating existing functionality only |
| Service method signature changes | Maintaining current API contracts |
| WorkflowApi migration | No existing workflow service to migrate |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1 | Complete |
| API-02 | Phase 1 | Complete |
| API-03 | Phase 1 | Complete |
| TYPE-05 | Phase 1 | Complete |
| TYPE-01 | Phase 2 | Complete |
| TYPE-02 | Phase 2 | Complete |
| TYPE-03 | Phase 2 | Complete |
| TYPE-04 | Phase 2 | Complete |
| SVC-01 | Phase 3 | Complete |
| SVC-02 | Phase 3 | Complete |
| SVC-03 | Phase 3 | Complete |
| SVC-04 | Phase 3 | Complete |
| SVC-05 | Phase 3 | Complete |
| IMP-01 | Phase 4 | Complete |
| IMP-02 | Phase 4 | Complete |
| IMP-03 | Phase 4 | Complete |
| IMP-04 | Phase 4 | Complete |
| CLN-01 | Phase 5 | Complete |
| CLN-02 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2025-01-25*
*Last updated: 2026-01-26 — ALL REQUIREMENTS COMPLETE*
