---
phase: 04-import-updates
plan: 04
subsystem: ui, util
tags: [imports, enums, domain-barrels, typescript]

# Dependency graph
requires:
  - phase: 04-01
    provides: Domain barrels for workspace, user, common, entity types
provides:
  - Updated workspace-form.tsx to use workspace barrel
  - Updated UI icon components to use common barrel
  - Updated attribute-type-dropdown to use common and entity barrels
  - Updated data-table-schema to use common barrel
  - Updated lib/util/form files to use domain barrels
  - All enum members use PascalCase
affects: [05-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Import enums from domain barrels, not @/lib/types/types"
    - "Enum members use PascalCase (DataType.String not DataType.STRING)"

key-files:
  created: []
  modified:
    - components/feature-modules/workspace/components/form/workspace-form.tsx
    - components/ui/icon/icon-cell.tsx
    - components/ui/icon/icon-mapper.tsx
    - components/ui/icon/icon-selector.tsx
    - components/ui/attribute-type-dropdown.tsx
    - components/ui/data-table/data-table-schema.tsx
    - lib/util/form/common/icon.form.ts
    - lib/util/form/entity-instance-validation.util.ts
    - lib/util/form/schema.util.ts

key-decisions:
  - "Interface files using operations left as-is (Phase 5 cleanup)"
  - "Enum string VALUES in object literals unchanged (keys use string values like 'NEUTRAL')"

patterns-established:
  - "Import shared types (Icon, DataType, DataFormat, IconColour, IconType) from @/lib/types/common"
  - "Import entity domain types (SchemaType, EntityRelationshipCardinality) from @/lib/types/entity"
  - "Import workspace domain types (WorkspacePlan) from @/lib/types/workspace"

# Metrics
duration: 5min
completed: 2026-01-26
---

# Phase 04 Plan 04: Remaining Files Import Updates Summary

**Updated workspace, UI components, and lib/util files to use domain barrels with PascalCase enum members**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-25T21:24:22Z
- **Completed:** 2026-01-25T21:29:38Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Workspace-form imports WorkspacePlan from workspace barrel
- UI icon components import IconColour, IconType from common barrel
- Attribute-type-dropdown imports from both common and entity barrels
- Data-table-schema imports DataFormat, DataType from common
- Lib/util/form files import from appropriate domain barrels
- All enum member references updated to PascalCase

## Task Commits

Each task was committed atomically:

1. **Task 1: Update workspace and user domain files** - `03eeed4` (chore)
2. **Task 2: Update UI components and lib/util files** - `3863a4d` (feat - bundled with 04-03)

**Note:** Task 2 was partially bundled with 04-03 execution. Files verified to be correctly updated.

## Files Created/Modified
- `workspace-form.tsx` - WorkspacePlan import from workspace barrel, enum casing
- `icon-cell.tsx` - IconColour, IconType from common barrel
- `icon-mapper.tsx` - IconColour, IconType from common barrel
- `icon-selector.tsx` - IconColour, IconType from common barrel
- `attribute-type-dropdown.tsx` - DataType, IconColour, IconType from common; SchemaType from entity
- `data-table-schema.tsx` - DataFormat, DataType from common; enum PascalCase
- `icon.form.ts` - IconColour, IconType from common barrel
- `entity-instance-validation.util.ts` - DataFormat, DataType from common; SchemaType, EntityRelationshipCardinality from entity
- `schema.util.ts` - DataFormat, DataType, IconColour, IconType from common; SchemaType from entity

## Decisions Made
- Interface files (workspace.interface.ts, user.interface.ts) left unchanged because they use `operations` for type extraction which will be cleaned up in Phase 5
- Object literal keys using enum string VALUES (like `NEUTRAL: "text-primary"`) unchanged - these are string literal keys that match the enum values

## Deviations from Plan

None - plan executed as specified.

## Issues Encountered
- Task 2 was already partially executed by a previous 04-03 run that bundled these files
- Enum replacement with `replace_all` caused partial replacements (e.g., `DATETIME` becoming `DateTIME` when `DATE` was replaced first) - required manual fixup

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- IMP-03 and IMP-04 requirements satisfied
- No workspace/user domain files import from @/lib/types/types
- UI components use @/lib/types/common for shared types
- lib/util files use domain barrels
- All enum members use PascalCase
- Pre-existing type errors in lib/util/form files (property naming differences like `enum` vs `_enum`) should be addressed in Phase 5

---
*Phase: 04-import-updates*
*Completed: 2026-01-26*
