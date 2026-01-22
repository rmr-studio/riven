# Roadmap: OpenAPI Type System Migration

## Overview

Proof-of-concept migration of the entity module from openapi-typescript (single `types.ts` with `components["schemas"]` pattern) to openapi-generator-cli (direct model imports + generated API classes). Phase 1 migrates interface files to establish the new import pattern, Phase 2 migrates service files to use generated API wrappers.

## Phases

- [x] **Phase 1: Interface Migration** - Replace components["schemas"] re-exports with direct model imports
- [x] **Phase 2: Service Migration** - Replace manual fetch with EntityApi wrappers

## Phase Details

### Phase 1: Interface Migration
**Goal**: Interface files use direct model imports from generated types
**Depends on**: Nothing (first phase)
**Requirements**: INTF-01, INTF-02
**Success Criteria** (what must be TRUE):
  1. No `components["schemas"]` imports exist in `lib/interfaces/common.interface.ts`
  2. No `components["schemas"]` imports exist in `entity/interface/entity.interface.ts`
  3. Custom local types (EntityTypeAttributeRow, RelationshipPickerProps, etc.) remain functional
  4. TypeScript compiles without errors after interface changes
**Plans**: 1 plan in 1 wave

Plans:
- [x] 01-01-PLAN.md — Migrate common.interface.ts and entity.interface.ts to @/lib/types imports

### Phase 2: Service Migration
**Goal**: Service files use generated EntityApi instead of manual fetch
**Depends on**: Phase 1
**Requirements**: SRVC-01, SRVC-02
**Success Criteria** (what must be TRUE):
  1. `entity-type.service.ts` uses EntityApi with Configuration for auth
  2. `entity.service.ts` uses EntityApi with Configuration for auth
  3. No manual fetch calls remain in migrated service files
  4. TypeScript compiles without errors after service changes
  5. API calls function correctly (requests reach backend, responses typed)
**Plans**: 2 plans in 2 waves

Plans:
- [x] 02-01-PLAN.md — Create API factory and migrate EntityTypeService (7 methods)
- [x] 02-02-PLAN.md — Migrate EntityService (4 methods)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Interface Migration | 1/1 | Complete | 2026-01-22 |
| 2. Service Migration | 2/2 | Complete | 2026-01-22 |
