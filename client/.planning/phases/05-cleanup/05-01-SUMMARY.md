---
phase: 05-cleanup
plan: 01
subsystem: entity
tags: [types, imports, entity, cleanup, domain-barrel]

# Dependency graph
requires:
  - phase: 02-type-barrels
    provides: Entity domain barrel at @/lib/types/entity
provides:
  - Zero imports from entity.interface.ts
  - Consistent entity type imports from domain barrel
  - Removed deprecated entity.interface.ts file
affects: [05-02, 05-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Import entity types from @/lib/types/entity domain barrel
    - Custom types (RelationshipOverlap, OverlapResolution, etc.) live in domain barrel

key-files:
  created: []
  modified:
    - components/feature-modules/entity/components/forms/* (12 files)
    - components/feature-modules/entity/components/tables/* (3 files)
    - components/feature-modules/entity/components/types/* (4 files)
    - components/feature-modules/entity/components/ui/modals/type/* (2 files)
    - components/feature-modules/entity/context/* (2 files)
    - components/feature-modules/entity/hooks/* (11 files)
    - components/feature-modules/entity/service/* (2 files)
    - components/feature-modules/entity/stores/* (2 files)
    - components/feature-modules/entity/util/* (1 file)
    - lib/util/form/entity-instance-validation.util.ts
    - components/ui/data-table/components/cells/edit-renderers.tsx
  deleted:
    - components/feature-modules/entity/interface/entity.interface.ts

key-decisions:
  - "Import all entity types from @/lib/types/entity domain barrel"
  - "Overlap detection types moved to domain barrel custom.ts"

patterns-established:
  - "Domain barrel imports: import { EntityType, EntityAttributeDefinition } from '@/lib/types/entity'"
  - "Guards and custom types accessed via same barrel"

# Metrics
duration: 15min
completed: 2026-01-26
---

# Phase 5 Plan 1: Entity Interface Migration Summary

**Migrated 42 entity module files from entity.interface.ts to @/lib/types/entity domain barrel**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-26T00:00:00Z
- **Completed:** 2026-01-26T00:15:00Z
- **Tasks:** 2
- **Files modified:** 43

## Accomplishments

- Updated 42 entity module files to import from @/lib/types/entity
- Deleted deprecated entity.interface.ts file
- Zero remaining imports from entity.interface.ts in codebase
- TypeScript compilation passes with no entity.interface-related errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Update entity module imports** - `5b0d2f4` (refactor)
   - Updated 42 files across entity module to use domain barrel
2. **Task 2: Delete entity.interface.ts** - `a222d63` (chore)
   - Removed deprecated interface file

## Files Created/Modified

### Modified (42 files)
- `components/feature-modules/entity/components/forms/instance/entity-relationship-picker.tsx`
- `components/feature-modules/entity/components/forms/instance/relationship/draft-entity-picker.tsx`
- `components/feature-modules/entity/components/forms/type/attribute/schema-form.tsx`
- `components/feature-modules/entity/components/forms/type/configuration-form.tsx`
- `components/feature-modules/entity/components/forms/type/new-entity-type-form.tsx`
- `components/feature-modules/entity/components/forms/type/relationship/entity-type-multi-select.tsx`
- `components/feature-modules/entity/components/forms/type/relationship/relationship-candidate.tsx`
- `components/feature-modules/entity/components/forms/type/relationship/relationship-form.tsx`
- `components/feature-modules/entity/components/forms/type/relationship/relationship-links.tsx`
- `components/feature-modules/entity/components/tables/entity-data-table.tsx`
- `components/feature-modules/entity/components/tables/entity-draft-row.tsx`
- `components/feature-modules/entity/components/tables/entity-table-utils.tsx`
- `components/feature-modules/entity/components/types/entity-type-attributes.tsx`
- `components/feature-modules/entity/components/types/entity-type-data-table.tsx`
- `components/feature-modules/entity/components/types/entity-type.tsx`
- `components/feature-modules/entity/components/types/entity-types-overview.tsx`
- `components/feature-modules/entity/components/ui/modals/type/attribute-form-modal.tsx`
- `components/feature-modules/entity/components/ui/modals/type/delete-definition-modal.tsx`
- `components/feature-modules/entity/context/configuration-provider.tsx`
- `components/feature-modules/entity/context/entity-provider.tsx`
- `components/feature-modules/entity/hooks/form/type/use-new-type-form.ts`
- `components/feature-modules/entity/hooks/form/type/use-relationship-form.ts`
- `components/feature-modules/entity/hooks/form/type/use-schema-form.ts`
- `components/feature-modules/entity/hooks/mutation/instance/use-delete-entity-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/instance/use-save-entity-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/type/use-delete-definition-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/type/use-delete-type-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/type/use-publish-type-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/type/use-save-configuration-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/type/use-save-definition-mutation.ts`
- `components/feature-modules/entity/hooks/query/type/use-entity-types.ts`
- `components/feature-modules/entity/hooks/query/type/use-relationship-candidates.ts`
- `components/feature-modules/entity/hooks/query/use-entities.ts`
- `components/feature-modules/entity/hooks/use-entity-type-table.tsx`
- `components/feature-modules/entity/hooks/use-relationship-overlap-detection.ts`
- `components/feature-modules/entity/service/entity-type.service.ts`
- `components/feature-modules/entity/service/entity.service.ts`
- `components/feature-modules/entity/stores/entity.store.ts`
- `components/feature-modules/entity/stores/type/configuration.store.ts`
- `components/feature-modules/entity/util/relationship.util.ts`
- `lib/util/form/entity-instance-validation.util.ts`
- `components/ui/data-table/components/cells/edit-renderers.tsx`

### Deleted (1 file)
- `components/feature-modules/entity/interface/entity.interface.ts`

## Decisions Made

- Import all entity types from @/lib/types/entity domain barrel
- Overlap detection types (RelationshipOverlap, OverlapResolution, OverlapDetectionResult) moved to domain barrel's custom.ts
- Removed local type definitions that were duplicating domain barrel exports

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - migration was straightforward.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Entity module imports now consistent with domain barrel pattern
- Ready for 05-02 (Block Interface Migration)
- Ready for 05-03 (Interface Directory Cleanup)

---
*Phase: 05-cleanup*
*Completed: 2026-01-26*
