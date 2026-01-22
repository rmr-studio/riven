# Requirements: OpenAPI Type System Migration

**Defined:** 2026-01-22
**Core Value:** Strong compile-time contracts between client and backend API

## v1 Requirements

Requirements for proof-of-concept migration of the entity module.

### Interface Migration

- [x] **INTF-01**: Migrate `lib/interfaces/common.interface.ts` — Replace `components["schemas"]` imports with direct model imports from `@/lib/types/models/`
- [x] **INTF-02**: Migrate `entity/interface/entity.interface.ts` — Replace `components["schemas"]` re-exports with direct model imports, preserve custom local types (EntityTypeAttributeRow, RelationshipPickerProps, etc.)

### Service Migration

- [x] **SRVC-01**: Migrate `entity/service/entity-type.service.ts` — Replace manual fetch with EntityApi wrapper, use Configuration for auth injection
- [x] **SRVC-02**: Migrate `entity/service/entity.service.ts` — Replace manual fetch with EntityApi wrapper, use Configuration for auth injection

## v2 Requirements

Deferred to subsequent milestone after v1 pattern validated.

### Interface Migration

- **INTF-03**: Migrate `authentication/interface/auth.interface.ts`
- **INTF-04**: Migrate `blocks/interface/*.interface.ts` (7 files)
- **INTF-05**: Migrate `user/interface/user.interface.ts`
- **INTF-06**: Migrate `workspace/interface/workspace.interface.ts`

### Service Migration

- **SRVC-03**: Migrate `blocks/service/*.service.ts` (3 files)
- **SRVC-04**: Migrate `user/service/user.service.ts`
- **SRVC-05**: Migrate `workspace/service/workspace.service.ts`

### Cleanup

- **CLNP-01**: Delete `lib/types/types.ts` after all references removed

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend OpenAPI spec changes | Migration uses existing spec as-is |
| New API endpoints | Just migrating existing functionality |
| Changing service layer abstraction | Services remain thin wrappers, pattern stays consistent |
| Generated API class modification | Files in lib/types/ are auto-generated, don't edit |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INTF-01 | Phase 1 | Complete |
| INTF-02 | Phase 1 | Complete |
| SRVC-01 | Phase 2 | Complete |
| SRVC-02 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 4 total
- Mapped to phases: 4
- Unmapped: 0

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after Phase 2 completion*
