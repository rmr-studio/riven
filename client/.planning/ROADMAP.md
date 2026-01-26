# Roadmap: OpenAPI Migration

## Overview

Sequential migration from openapi-typescript manual fetch patterns to openapi-generator-cli generated API classes. The migration builds in layers: API factories first, then type barrels for clean imports, then service migrations, then import updates across the codebase, and finally cleanup of legacy files. Each phase enables the next, culminating in removal of the old `types.ts` file.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Create API factories and protect custom directories
- [x] **Phase 2: Type Barrels** - Create domain-based barrel exports
- [x] **Phase 3: Service Migration** - Migrate all services to generated APIs
- [x] **Phase 4: Import Updates** - Update all imports to use domain barrels
- [x] **Phase 5: Cleanup** - Remove legacy files

## Phase Details

### Phase 1: Foundation
**Goal**: API factory functions exist for all remaining generated APIs, and custom directories are protected from regeneration
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-03, TYPE-05
**Success Criteria** (what must be TRUE):
  1. `createBlockApi(session)` returns configured BlockApi instance
  2. `createUserApi(session)` returns configured UserApi instance
  3. `createWorkspaceApi(session)` returns configured WorkspaceApi instance
  4. Running `npm run types` does not delete `lib/types/entity/`, `lib/types/block/`, `lib/types/workspace/`, or `lib/types/user/` directories
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md - Create API factories and update generator ignore

### Phase 2: Type Barrels
**Goal**: Domain-based barrel exports provide single import paths for all types in each domain
**Depends on**: Phase 1 (generator protection must be in place)
**Requirements**: TYPE-01, TYPE-02, TYPE-03, TYPE-04
**Success Criteria** (what must be TRUE):
  1. `import type { EntityType } from "@/lib/types/entity"` resolves correctly
  2. `import type { BlockType } from "@/lib/types/block"` resolves correctly
  3. `import type { Workspace } from "@/lib/types/workspace"` resolves correctly
  4. `import type { User } from "@/lib/types/user"` resolves correctly
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md - Create entity and block type barrels
- [x] 02-02-PLAN.md - Create workspace and user type barrels

### Phase 3: Service Migration
**Goal**: All services use generated API classes with `normalizeApiError` error handling
**Depends on**: Phase 1 (API factories must exist)
**Requirements**: SVC-01, SVC-02, SVC-03, SVC-04, SVC-05
**Success Criteria** (what must be TRUE):
  1. `BlockService` methods use `createBlockApi` and `normalizeApiError`
  2. `BlockTypeService` methods use `createBlockApi` and `normalizeApiError`
  3. `LayoutService` methods use `createBlockApi` and `normalizeApiError`
  4. `UserService` methods use `createUserApi` and `normalizeApiError`
  5. `WorkspaceService` methods use `createWorkspaceApi` and `normalizeApiError`
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md - Migrate block-related services (BlockService, BlockTypeService, LayoutService)
- [x] 03-02-PLAN.md - Migrate user and workspace services
- [x] 03-03-PLAN.md - Fix TypeScript errors in migrated services (gap closure)

### Phase 4: Import Updates
**Goal**: All files import types from domain barrels instead of legacy `types.ts`
**Depends on**: Phase 2 (type barrels must exist)
**Requirements**: IMP-01, IMP-02, IMP-03, IMP-04
**Success Criteria** (what must be TRUE):
  1. No files import from `@/lib/types/types` for entity-related types
  2. No files import from `@/lib/types/types` for block-related types
  3. No files import from `@/lib/types/types` for workspace-related types
  4. No files import from `@/lib/types/types` for user-related types
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md - Enhance barrels with enum exports and create common barrel
- [x] 04-02-PLAN.md - Update entity domain imports (~22 files)
- [x] 04-03-PLAN.md - Update block domain imports (~22 files)
- [x] 04-04-PLAN.md - Update workspace, user, UI, and lib/util imports (~11 files)

### Phase 5: Cleanup
**Goal**: Legacy interface files removed, types.ts deleted, documentation updated
**Depends on**: Phase 4 (all imports must be updated first)
**Requirements**: CLN-01, CLN-02
**Success Criteria** (what must be TRUE):
  1. No `.interface.ts` files exist in entity/block/workspace/user modules (legacy re-exports removed)
  2. `lib/types/types.ts` does not exist
  3. `CLAUDE.md` documents new import patterns
  4. Application builds successfully without legacy files
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md - Entity domain cleanup (update imports, delete entity.interface.ts)
- [x] 05-02-PLAN.md - Block domain cleanup (migrate custom types, update imports, delete 7 interface files)
- [x] 05-03-PLAN.md - Final cleanup (workspace/user/lib interfaces, delete types.ts, update CLAUDE.md)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/1 | Complete | 2025-01-25 |
| 2. Type Barrels | 2/2 | Complete | 2026-01-25 |
| 3. Service Migration | 3/3 | Complete | 2026-01-26 |
| 4. Import Updates | 4/4 | Complete | 2026-01-26 |
| 5. Cleanup | 3/3 | Complete | 2026-01-26 |

---
*Roadmap created: 2025-01-25*
*Last updated: 2026-01-26 — MILESTONE COMPLETE*
