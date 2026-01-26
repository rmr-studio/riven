# Phase 4: Import Updates - Research

**Researched:** 2026-01-26
**Domain:** TypeScript import path migration
**Confidence:** HIGH

## Summary

This phase migrates all files from importing types from `@/lib/types/types` (openapi-typescript generated) to the domain barrels (`@/lib/types/entity`, `@/lib/types/block`, `@/lib/types/workspace`, `@/lib/types/user`). The primary technical challenge is that enum member casing differs between sources:

- `@/lib/types/types` uses SCREAMING_CASE: `SchemaType.TEXT`, `BlockMetadataType.CONTENT`
- `@/lib/types/models` (used by barrels) uses PascalCase: `SchemaType.Text`, `BlockMetadataType.Content`

This means every enum member reference must also be updated when changing import paths.

**Primary recommendation:** Update imports domain-by-domain, with each plan covering import path changes AND enum member casing updates together to maintain type safety.

## File Inventory

### Entity Domain (22 files)

Files importing from `@/lib/types/types`:

| File | Types Imported |
|------|----------------|
| `entity/components/forms/enum-options-editor.tsx` | OptionSortingType |
| `entity/components/forms/instance/entity-field-registry.tsx` | SchemaType |
| `entity/components/forms/instance/entity-relationship-picker.tsx` | EntityRelationshipCardinality |
| `entity/components/forms/type/attribute/schema-form.tsx` | SchemaType |
| `entity/components/forms/type/configuration-form.tsx` | EntityPropertyType |
| `entity/components/forms/type/relationship/relationship-candidate.tsx` | EntityRelationshipCardinality |
| `entity/components/forms/type/relationship/relationship-form.tsx` | EntityTypeRelationshipType |
| `entity/components/tables/entity-data-table.tsx` | EntityPropertyType |
| `entity/components/tables/entity-draft-row.tsx` | EntityPropertyType |
| `entity/components/tables/entity-table-utils.tsx` | DataType, EntityPropertyType, EntityRelationshipCardinality, SchemaType |
| `entity/components/types/entity-type-data-table.tsx` | EntityPropertyType |
| `entity/components/types/entity-type.tsx` | DataType |
| `entity/components/ui/modals/type/attribute-form-modal.tsx` | SchemaType |
| `entity/components/ui/modals/type/delete-definition-modal.tsx` | DeleteAction, EntityTypeRelationshipType, EntityTypeRequestDefinition |
| `entity/context/configuration-provider.tsx` | EntityPropertyType |
| `entity/hooks/form/type/use-new-type-form.ts` | EntityCategory, IconColour, IconType |
| `entity/hooks/form/type/use-relationship-form.ts` | EntityTypeRelationshipType, EntityTypeRequestDefinition |
| `entity/hooks/form/type/use-schema-form.ts` | EntityTypeRequestDefinition, OptionSortingType, SchemaType |
| `entity/hooks/query/type/use-relationship-candidates.ts` | EntityTypeRelationshipType |
| `entity/hooks/use-entity-type-table.tsx` | EntityPropertyType |
| `entity/stores/entity.store.ts` | EntityPropertyType |
| `entity/util/relationship.util.ts` | EntityRelationshipCardinality |

**Entity domain enums used:**
- EntityPropertyType (Attribute, Relationship)
- EntityCategory (Custom, Service, ...)
- EntityRelationshipCardinality (OneToOne, OneToMany, ManyToOne, ManyToMany)
- EntityTypeRelationshipType (Origin, Reference)
- EntityTypeRequestDefinition (SaveSchema, SaveRelationship, DeleteSchema, DeleteRelationship)
- SchemaType (Text, Number, Date, Email, Phone, etc.)
- DataType (String, Number, Boolean, etc.)
- OptionSortingType (Manual, Alphabetical, etc.)
- DeleteAction (RemoveBidirectional, DeleteRelationship, RemoveEntityType)

### Block Domain (22 files)

Files importing from `@/lib/types/types`:

| File | Types Imported |
|------|----------------|
| `blocks/components/modals/entity-selector-modal.tsx` | EntityType |
| `blocks/components/modals/type-picker-modal.tsx` | EntityType |
| `blocks/components/panel/panel-wrapper.tsx` | EntityType |
| `blocks/components/panel/toolbar/panel-quick-insert.tsx` | EntityType |
| `blocks/components/render/list/content-block-list.tsx` | BlockListOrderingMode, ListFilterLogicType |
| `blocks/components/render/reference/entity/entity-reference.tsx` | EntityType |
| `blocks/components/sync/widget.sync.tsx` | NodeType, RenderType |
| `blocks/config/entity-block-config.ts` | EntityType |
| `blocks/context/block-environment-provider.tsx` | EntityType |
| `blocks/context/block-renderer-provider.tsx` | NodeType |
| `blocks/context/layout-change-provider.tsx` | BlockOperationType |
| `blocks/context/tracked-environment-provider.tsx` | BlockOperationType |
| `blocks/hooks/use-entity-references.tsx` | EntityType |
| `blocks/hooks/use-entity-selector.ts` | EntityType |
| `blocks/interface/block.interface.ts` | BlockMetadataType, components, NodeType, operations |
| `blocks/interface/command.interface.ts` | components |
| `blocks/interface/editor.interface.ts` | EntityType |
| `blocks/interface/layout.interface.ts` | components |
| `blocks/util/block/factory/block.factory.ts` | BlockListOrderingMode, BlockMetadataType, BlockReferenceFetchPolicy, BlockValidationScope, EntityType, ListFilterLogicType, NodeType, Presentation, ReferenceType |
| `blocks/util/block/factory/instance.factory.ts` | BlockMetadataType, EntityType |
| `blocks/util/list/list-sorting.util.ts` | BlockListOrderingMode, SortDir |
| `blocks/util/render/render.util.ts` | NodeType, RenderType |

**Block domain enums used:**
- BlockMetadataType (Content, EntityReference, BlockReference)
- NodeType (Content, Reference, Error)
- RenderType (Content, Grid, etc.)
- BlockOperationType (Add, Remove, Move, Update, Reorder)
- BlockListOrderingMode (Manual, etc.)
- ListFilterLogicType (And, Or)
- BlockReferenceFetchPolicy (Lazy, Eager)
- BlockValidationScope (Soft, Strict)
- Presentation (Entity, etc.)
- ReferenceType (Entity, Block)
- SortDir (Asc, Desc)

**Note:** Block domain files also import `EntityType` which is a model type, not an enum.

### Workspace Domain (2 files)

| File | Types Imported |
|------|----------------|
| `workspace/components/form/workspace-form.tsx` | WorkspacePlan |
| `workspace/interface/workspace.interface.ts` | components, operations |

**Workspace domain enums used:**
- WorkspacePlan (Free, Pro, Enterprise, etc.)

### User Domain (1 file)

| File | Types Imported |
|------|----------------|
| `user/interface/user.interface.ts` | components, operations |

### UI Components (7 files)

| File | Types Imported |
|------|----------------|
| `components/ui/attribute-type-dropdown.tsx` | DataType, IconColour, IconType, SchemaType |
| `components/ui/data-table/data-table-schema.tsx` | DataFormat, DataType |
| `components/ui/icon/icon-cell.tsx` | IconColour, IconType |
| `components/ui/icon/icon-mapper.tsx` | IconColour, IconType |
| `components/ui/icon/icon-selector.tsx` | IconColour, IconType |

**UI enums used:**
- IconColour (Neutral, Blue, Green, etc.)
- IconType (ALargeSmall, Calculator, etc.)
- SchemaType (same as entity)
- DataType (same as entity)
- DataFormat (Iso8601, etc.)

### Lib Utilities (3 files)

| File | Types Imported |
|------|----------------|
| `lib/util/form/common/icon.form.ts` | IconColour, IconType |
| `lib/util/form/entity-instance-validation.util.ts` | DataFormat, DataType, EntityRelationshipCardinality, SchemaType |
| `lib/util/form/schema.util.ts` | DataFormat, DataType, IconColour, IconType, SchemaType |

### Domain Barrel Internal (3 files)

These barrel files import from `@/lib/types/types` for `operations` type:

| File | Types Imported |
|------|----------------|
| `lib/types/block/responses.ts` | operations |
| `lib/types/user/custom.ts` | operations |
| `lib/types/workspace/custom.ts` | operations |

**Note:** These imports are acceptable as they extract types from the `operations` schema. They should remain as-is since `operations` isn't re-exported from domain barrels.

## Enum Member Casing Migration

### Critical: SCREAMING_CASE to PascalCase

When migrating from `@/lib/types/types` to domain barrels, all enum member references must be updated:

| Enum | SCREAMING_CASE (types.ts) | PascalCase (models) |
|------|---------------------------|---------------------|
| BlockMetadataType | `.CONTENT` | `.Content` |
| BlockMetadataType | `.ENTITY_REFERENCE` | `.EntityReference` |
| BlockMetadataType | `.BLOCK_REFERENCE` | `.BlockReference` |
| NodeType | `.CONTENT` | `.Content` |
| NodeType | `.REFERENCE` | `.Reference` |
| NodeType | `.ERROR` | `.Error` |
| SchemaType | `.TEXT` | `.Text` |
| SchemaType | `.NUMBER` | `.Number` |
| SchemaType | `.DATE` | `.Date` |
| SchemaType | `.DATETIME` | `.Datetime` |
| SchemaType | `.EMAIL` | `.Email` |
| SchemaType | `.PHONE` | `.Phone` |
| SchemaType | `.URL` | `.Url` |
| SchemaType | `.CURRENCY` | `.Currency` |
| SchemaType | `.MULTI_SELECT` | `.MultiSelect` |
| SchemaType | `.FILE_ATTACHMENT` | `.FileAttachment` |
| SchemaType | `.SELECT` | `.Select` |
| SchemaType | `.CHECKBOX` | `.Checkbox` |
| SchemaType | `.LOCATION` | `.Location` |
| EntityPropertyType | `.ATTRIBUTE` | `.Attribute` |
| EntityPropertyType | `.RELATIONSHIP` | `.Relationship` |
| DataType | `.STRING` | `.String` |
| DataType | `.NUMBER` | `.Number` |
| DataType | `.BOOLEAN` | `.Boolean` |
| IconColour | `.NEUTRAL` | `.Neutral` |
| IconColour | (all others) | (PascalCase) |
| IconType | `.A_LARGE_SMALL` | `.ALargeSmall` |
| IconType | `.CALCULATOR` | `.Calculator` |
| IconType | (many others) | (PascalCase) |

### Files Requiring Heavy Casing Changes

These files have extensive enum member usage that will need multiple updates:

1. **`lib/util/form/schema.util.ts`** - 50+ SchemaType, DataType, IconType, IconColour references
2. **`blocks/util/block/factory/block.factory.ts`** - 15+ BlockMetadataType, NodeType references
3. **`entity/components/forms/instance/entity-field-registry.tsx`** - 15+ SchemaType references
4. **`entity/components/tables/entity-table-utils.tsx`** - Multiple SchemaType references

## Common Barrel Requirement

Per CONTEXT.md decision, shared/utility types spanning domains should go in `@/lib/types/common`:

**Types used by multiple domains (candidates for common barrel):**
- IconColour, IconType - Used by entity, UI, lib/util
- DataType, DataFormat - Used by entity, UI, lib/util
- SchemaType - Used by entity, UI, lib/util (but entity-specific)

**Recommendation:** Create `@/lib/types/common` barrel for:
- IconColour, IconType (display/icon types)
- DataType, DataFormat (data representation types)

SchemaType should remain in entity barrel as it's conceptually entity-specific.

## Interface Files

The following interface files currently import from `@/lib/types/types` and serve as re-export points:

| Interface File | Status |
|----------------|--------|
| `blocks/interface/block.interface.ts` | Uses `components`, `operations` - partial migration |
| `blocks/interface/command.interface.ts` | Uses `components` only |
| `blocks/interface/editor.interface.ts` | Uses `EntityType` model |
| `blocks/interface/layout.interface.ts` | Uses `components` only |
| `workspace/interface/workspace.interface.ts` | Uses `components`, `operations` |
| `user/interface/user.interface.ts` | Uses `components`, `operations` |

Per CONTEXT.md: "Consumers import from barrels, leaving interface files for Phase 5 cleanup."

**Action for Phase 4:** Update consumer files, not interface files. Interface files will be cleaned up in Phase 5.

## Pre-existing Type Errors

Per CONTEXT.md: "Note and skip pre-existing errors."

Document but do not fix:

1. **`entity-block-environment.tsx`**
   - References non-existent EntityType enum (should be ApplicationEntityType)
   - BlockEnvironment interface vs generated type mismatch

2. **`use-blocks-hydration.ts`**
   - TS2345: Passes `string[]` instead of `Record<string, EntityReferenceHydrationRequest[]>`

These errors exist independently of the import migration.

## Architecture Patterns

### Import Statement Pattern

```typescript
// BEFORE: Mixed from types.ts
import { BlockMetadataType, components, NodeType, operations } from "@/lib/types/types";

// AFTER: Separated by domain
import type { BlockContentMetadata, BlockNode } from "@/lib/types/block";
import { BlockMetadataType, NodeType } from "@/lib/types/block";  // enums need regular import
```

### Enum Import Pattern

Enums must use regular `import`, not `import type`:

```typescript
// CORRECT: Regular import for enums (runtime values)
import { BlockMetadataType, NodeType } from "@/lib/types/block";

// INCORRECT: Type import for enums
import type { BlockMetadataType, NodeType } from "@/lib/types/block";  // Error: enum is a value
```

### Domain-Scoped Imports

```typescript
// Entity types
import type { EntityType, EntityAttribute } from "@/lib/types/entity";
import { EntityPropertyType, SchemaType } from "@/lib/types/entity";

// Block types
import type { Block, BlockType, ContentNode } from "@/lib/types/block";
import { BlockMetadataType, NodeType } from "@/lib/types/block";

// Workspace types
import type { Workspace } from "@/lib/types/workspace";
import { WorkspacePlan } from "@/lib/types/workspace";

// User types
import type { User } from "@/lib/types/user";

// Common types (to be created)
import type { Icon } from "@/lib/types/common";
import { IconColour, IconType, DataType, DataFormat } from "@/lib/types/common";
```

## Migration Strategy

### Recommended Plan Structure

Based on file counts and complexity:

1. **Plan 04-01: Entity Imports** (~22 files)
   - Update import paths from `@/lib/types/types` to `@/lib/types/entity`
   - Update enum member references to PascalCase
   - Most impactful: schema.util.ts, entity-field-registry.tsx

2. **Plan 04-02: Block Imports** (~22 files)
   - Update import paths to `@/lib/types/block`
   - Update enum member references (BlockMetadataType, NodeType, etc.)
   - Most impactful: block.factory.ts, block.interface.ts

3. **Plan 04-03: Workspace, User, Common** (~12 files)
   - Create common barrel for shared types
   - Update workspace and user imports
   - Update UI component imports
   - Update lib/util imports

### Barrel Modifications Needed

Before consumer updates, barrels need to export enums:

**`lib/types/entity/index.ts`** - Add:
```typescript
export {
    EntityPropertyType,
    EntityCategory,
    EntityRelationshipCardinality,
    EntityTypeRelationshipType,
    EntityTypeRequestDefinition,
    SchemaType,
    DataType,
    OptionSortingType,
    DeleteAction,
} from "@/lib/types/models";
```

**`lib/types/block/index.ts`** - Add:
```typescript
export {
    BlockMetadataType,
    NodeType,
    RenderType,
    BlockOperationType,
    BlockListOrderingMode,
    ListFilterLogicType,
    BlockReferenceFetchPolicy,
    SortDir,
    Presentation,
    ReferenceType,
} from "@/lib/types/models";
```

**`lib/types/workspace/index.ts`** - Add:
```typescript
export { WorkspacePlan, WorkspaceRoles } from "@/lib/types/models";
```

**New `lib/types/common/index.ts`** - Create:
```typescript
export type { Icon, DisplayName } from "@/lib/types/models";
export { IconColour, IconType, DataType, DataFormat } from "@/lib/types/models";
```

## Common Pitfalls

### Pitfall 1: Type vs Value Import

**What goes wrong:** Using `import type` for enums causes "cannot be used as a value" errors
**Why it happens:** Enums are both types and runtime values
**How to avoid:** Always use regular `import` for enums, `import type` for interfaces/type aliases
**Warning signs:** "X only refers to a type, but is being used as a value here"

### Pitfall 2: Casing Mismatch

**What goes wrong:** Code compiles but runtime comparison fails
**Why it happens:** `SchemaType.TEXT` !== `SchemaType.Text` at development time, but both resolve to `'TEXT'` string
**How to avoid:** Update ALL enum member references when changing import source
**Warning signs:** Type checking passes but behavior is wrong

### Pitfall 3: Mixed Import Sources

**What goes wrong:** Same type imported from multiple sources
**Why it happens:** Incremental migration leaves some old imports
**How to avoid:** Grep for old imports after each plan completes
**Warning signs:** Duplicate identifier warnings, confusing autocomplete

### Pitfall 4: Missing Barrel Exports

**What goes wrong:** Import error "Module has no exported member"
**Why it happens:** Barrel doesn't export all needed types/enums
**How to avoid:** Check barrel exports before updating consumers
**Warning signs:** TS2305 errors after import path change

## Verification Approach

After each plan:

```bash
# Check for remaining legacy imports
grep -r "from ['\"]@/lib/types/types['\"]" --include="*.ts" --include="*.tsx" | grep -v ".planning"

# Type check
npx tsc --noEmit

# Verify no SCREAMING_CASE enum members remain (for migrated files)
grep -E "\.(CONTENT|ENTITY_REFERENCE|BLOCK_REFERENCE|TEXT|NUMBER|EMAIL)" [migrated-files]
```

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis via grep/read tools
- `lib/types/models/*.ts` - Generated enum definitions with PascalCase
- `lib/types/types.ts` - openapi-typescript generated with SCREAMING_CASE
- `.planning/phases/04-import-updates/04-CONTEXT.md` - User decisions

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` - Prior migration decisions
- `.planning/phases/02-type-barrels/` - Barrel creation context

## Metadata

**Confidence breakdown:**
- File inventory: HIGH - Direct grep analysis
- Enum mapping: HIGH - Verified against generated code
- Migration strategy: MEDIUM - Based on prior phase patterns

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable types, low churn expected)
