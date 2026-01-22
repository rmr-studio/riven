# Phase 1: Interface Migration - Research

**Researched:** 2026-01-22
**Domain:** TypeScript type system migration (openapi-typescript to openapi-generator)
**Confidence:** HIGH

## Summary

This phase involves migrating two interface files from the old `components["schemas"]` import pattern (openapi-typescript) to direct model imports from generated individual model files (openapi-generator-cli). The migration is straightforward with clear 1:1 mappings for most types.

The generated models in `@/lib/types/models/` provide individually exported interfaces and const-based enums. The main complexity involves:
1. Handling the `Address` type which does not exist in either the old or new generated types (appears to be a custom local type)
2. Preserving enum imports which now come from individual model files instead of a single types.ts
3. Maintaining backward compatibility for all consumers of these interface files

**Primary recommendation:** Replace `components["schemas"]["TypeName"]` with direct imports from `@/lib/types/models/TypeName` and define the `Address` type locally as it's not in the OpenAPI spec.

## Current State

### lib/interfaces/common.interface.ts

**File location:** `/home/jared/dev/worktrees/riven-openapi/client/lib/interfaces/common.interface.ts`

**Current imports:**
```typescript
import { components } from "../types/types";
```

**Types exported (7 total):**
| Export Name | Current Source | Notes |
|-------------|----------------|-------|
| `Address` | `components["schemas"]["Address"]` | NOT in OpenAPI spec - custom type needed |
| `Condition` | `components["schemas"]["Condition"]` | Exists in new models |
| `SchemaOptions` | `components["schemas"]["SchemaOptions"]` | Exists in new models |
| `FormStructure` | `components["schemas"]["FormStructure"]` | Exists in new models |
| `Icon` | `components["schemas"]["Icon"]` | Exists in new models |
| `Schema` | `components["schemas"]["SchemaString"]` | Aliased - maps to SchemaString |
| `SchemaUUID` | `components["schemas"]["SchemaUUID"]` | Exists in new models |

**Consumer count:** 14 files import from this interface

### entity/interface/entity.interface.ts

**File location:** `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/entity/interface/entity.interface.ts`

**Current imports:**
```typescript
import { Icon, SchemaUUID } from "@/lib/interfaces/common.interface";
import {
    components,
    DataType,
    EntityPropertyType,
    EntityRelationshipCardinality,
    SchemaType,
} from "@/lib/types/types";
```

**OpenAPI types re-exported (20 total):**
| Export Name | Current Source |
|-------------|----------------|
| `EntityType` | `components["schemas"]["EntityType"]` |
| `EntityTypeAttributeColumn` | `components["schemas"]["EntityTypeAttributeColumn"]` |
| `Entity` | `components["schemas"]["Entity"]` |
| `EntityRelationshipDefinition` | `components["schemas"]["EntityRelationshipDefinition"]` |
| `EntityAttributePayload` | `components["schemas"]["EntityAttributePayload"]` |
| `EntityAttribute` | `components["schemas"]["EntityAttribute"]` |
| `CreateEntityTypeRequest` | `components["schemas"]["CreateEntityTypeRequest"]` |
| `EntityTypeImpactResponse` | `components["schemas"]["EntityTypeImpactResponse"]` |
| `SaveTypeDefinitionRequest` | `components["schemas"]["SaveTypeDefinitionRequest"]` |
| `SaveRelationshipDefinitionRequest` | `components["schemas"]["SaveRelationshipDefinitionRequest"]` |
| `SaveAttributeDefinitionRequest` | `components["schemas"]["SaveAttributeDefinitionRequest"]` |
| `DeleteTypeDefinitionRequest` | `components["schemas"]["DeleteTypeDefinitionRequest"]` |
| `DeleteAttributeDefinitionRequest` | `components["schemas"]["DeleteAttributeDefinitionRequest"]` |
| `DeleteRelationshipDefinitionRequest` | `components["schemas"]["DeleteRelationshipDefinitionRequest"]` |
| `DeleteEntityResponse` | `components["schemas"]["DeleteEntityResponse"]` |
| `EntityAttributePrimitivePayload` | `components["schemas"]["EntityAttributePrimitivePayload"]` |
| `EntityAttributeRelationPayloadReference` | `components["schemas"]["EntityAttributeRelationPayloadReference"]` |
| `EntityAttributeRelationPayload` | `components["schemas"]["EntityAttributeRelationPayload"]` |
| `SaveEntityRequest` | `components["schemas"]["SaveEntityRequest"]` |
| `SaveEntityResponse` | `components["schemas"]["SaveEntityResponse"]` |
| `EntityAttributeRequest` | `components["schemas"]["EntityAttributeRequest"]` |
| `EntityLink` | `components["schemas"]["EntityLink"]` |

**Custom local types (must preserve):**
| Type/Interface | Purpose |
|----------------|---------|
| `EntityTypeDefinition` | Interface combining id, type, and definition |
| `RelationshipLimit` | Local enum (SINGULAR, MANY) |
| `EntityRelationshipCandidate` | Interface for relationship picker |
| `EntityAttributeDefinition` | Interface with id and schema |
| `EntityTypeAttributeRow` | Complex interface for table rows |
| `RelationshipPickerProps` | Props interface for picker component |

**Type guards exported:**
- `isRelationshipDefinition()`
- `isAttributeDefinition()`
- `isRelationshipPayload()`

**Re-exports from hooks:**
```typescript
export type {
    OverlapDetectionResult,
    OverlapResolution,
    RelationshipOverlap,
} from "../hooks/use-relationship-overlap-detection";
```

**Consumer count:** 40+ files import from this interface

## Target State

### Generated Models Structure

**Location:** `/home/jared/dev/worktrees/riven-openapi/client/lib/types/models/`
**Index:** `/home/jared/dev/worktrees/riven-openapi/client/lib/types/index.ts` re-exports all models

**Model file pattern:**
```typescript
// lib/types/models/EntityType.ts
export interface EntityType {
    id: string;
    key: string;
    // ... all properties
}

export function instanceOfEntityType(value: object): value is EntityType { ... }
export function EntityTypeFromJSON(json: any): EntityType { ... }
export function EntityTypeToJSON(json: any): EntityType { ... }
```

**Enum pattern (const objects):**
```typescript
// lib/types/models/DataType.ts
export const DataType = {
    String: 'STRING',
    Number: 'NUMBER',
    // ...
} as const;
export type DataType = typeof DataType[keyof typeof DataType];
```

### Import Pattern Change

**Before:**
```typescript
import { components } from "@/lib/types/types";
export type EntityType = components["schemas"]["EntityType"];
```

**After:**
```typescript
import { EntityType } from "@/lib/types/models/EntityType";
// Or via barrel:
import { EntityType } from "@/lib/types";
```

## Type Mapping

### common.interface.ts Mappings

| Current Export | New Import Source | Action |
|----------------|-------------------|--------|
| `Address` | N/A - not in spec | Define locally |
| `Condition` | `@/lib/types/models/Condition` | Direct import |
| `SchemaOptions` | `@/lib/types/models/SchemaOptions` | Direct import |
| `FormStructure` | `@/lib/types/models/FormStructure` | Direct import |
| `Icon` | `@/lib/types/models/Icon` | Direct import |
| `Schema` (alias for SchemaString) | `@/lib/types/models/SchemaString` | Import as SchemaString, export as Schema |
| `SchemaUUID` | `@/lib/types/models/SchemaUUID` | Direct import |

### entity.interface.ts Mappings

All 20 OpenAPI types have direct equivalents in `@/lib/types/models/`:

| Type | New Import |
|------|------------|
| `EntityType` | `@/lib/types/models/EntityType` |
| `EntityTypeAttributeColumn` | `@/lib/types/models/EntityTypeAttributeColumn` |
| `Entity` | `@/lib/types/models/Entity` |
| `EntityRelationshipDefinition` | `@/lib/types/models/EntityRelationshipDefinition` |
| `EntityAttributePayload` | `@/lib/types/models/EntityAttributePayload` |
| `EntityAttribute` | `@/lib/types/models/EntityAttribute` |
| `CreateEntityTypeRequest` | `@/lib/types/models/CreateEntityTypeRequest` |
| `EntityTypeImpactResponse` | `@/lib/types/models/EntityTypeImpactResponse` |
| `SaveTypeDefinitionRequest` | `@/lib/types/models/SaveTypeDefinitionRequest` |
| `SaveRelationshipDefinitionRequest` | `@/lib/types/models/SaveRelationshipDefinitionRequest` |
| `SaveAttributeDefinitionRequest` | `@/lib/types/models/SaveAttributeDefinitionRequest` |
| `DeleteTypeDefinitionRequest` | `@/lib/types/models/DeleteTypeDefinitionRequest` |
| `DeleteAttributeDefinitionRequest` | `@/lib/types/models/DeleteAttributeDefinitionRequest` |
| `DeleteRelationshipDefinitionRequest` | `@/lib/types/models/DeleteRelationshipDefinitionRequest` |
| `DeleteEntityResponse` | `@/lib/types/models/DeleteEntityResponse` |
| `EntityAttributePrimitivePayload` | `@/lib/types/models/EntityAttributePrimitivePayload` |
| `EntityAttributeRelationPayloadReference` | `@/lib/types/models/EntityAttributeRelationPayloadReference` |
| `EntityAttributeRelationPayload` | `@/lib/types/models/EntityAttributeRelationPayload` |
| `SaveEntityRequest` | `@/lib/types/models/SaveEntityRequest` |
| `SaveEntityResponse` | `@/lib/types/models/SaveEntityResponse` |
| `EntityAttributeRequest` | `@/lib/types/models/EntityAttributeRequest` |
| `EntityLink` | `@/lib/types/models/EntityLink` |

### Enum Mappings

Enums currently imported from `@/lib/types/types` need new sources:

| Enum | New Import |
|------|------------|
| `DataType` | `@/lib/types/models/DataType` |
| `EntityPropertyType` | `@/lib/types/models/EntityPropertyType` |
| `EntityRelationshipCardinality` | `@/lib/types/models/EntityRelationshipCardinality` |
| `SchemaType` | `@/lib/types/models/SchemaType` |

**Important:** The new enums use `const` objects instead of TypeScript `enum`. Values are identical but access pattern differs:
- Old: `DataType.STRING` (TypeScript enum)
- New: `DataType.String` (const object, value is `'STRING'`)

## Consumers

### Files importing from common.interface.ts (14 files)

| File | Types Used |
|------|------------|
| `lib/util/form/schema.util.ts` | Icon, SchemaOptions |
| `lib/util/form/entity-instance-validation.util.ts` | SchemaUUID |
| `components/ui/data-table/data-table-schema.tsx` | Schema |
| `components/ui/data-table/components/cells/cell-editor-widget.tsx` | SchemaUUID |
| `components/ui/data-table/components/cells/edit-renderers.tsx` | SchemaUUID |
| `components/ui/icon/icon-selector.tsx` | Icon |
| `components/feature-modules/entity/interface/entity.interface.ts` | Icon, SchemaUUID |
| `components/feature-modules/entity/components/tables/entity-table-utils.tsx` | SchemaUUID |
| `components/feature-modules/entity/hooks/form/type/use-schema-form.ts` | SchemaOptions |
| `components/feature-modules/entity/components/tables/entity-data-table.tsx` | SchemaUUID |
| `components/feature-modules/entity/components/forms/type/relationship/relationship-candidate.tsx` | Icon |
| `components/feature-modules/entity/components/forms/instance/entity-field-registry.tsx` | SchemaUUID |
| `components/feature-modules/entity/components/forms/instance/entity-field-cell.tsx` | SchemaUUID |
| `components/feature-modules/blocks/components/forms/form-widget.types.ts` | Schema, SchemaUUID |
| `components/feature-modules/blocks/components/bespoke/AddressCard.tsx` | Address |

### Files importing from entity.interface.ts (40+ files)

Key consumers include:
- Entity service files (`entity.service.ts`, `entity-type.service.ts`)
- Entity hooks (query, mutation, form hooks)
- Entity components (forms, tables, modals)
- Entity stores (`configuration.store.ts`, `entity.store.ts`)
- Entity context providers

All use re-exported types, so migration is transparent if exports remain the same.

## Risks & Considerations

### HIGH Priority

1. **Address type does not exist in OpenAPI spec**
   - Current: `components["schemas"]["Address"]`
   - Reality: Neither old nor new types.ts contains Address
   - Used by: `AddressCard.tsx` component
   - Solution: Define Address interface locally in common.interface.ts
   - Shape needed (from AddressCard usage):
   ```typescript
   export interface Address {
       street?: string;
       city?: string;
       state?: string;
       postalCode?: string;
       country?: string;
   }
   ```

2. **Enum syntax difference**
   - Old: TypeScript `enum` (e.g., `enum DataType { STRING = "STRING" }`)
   - New: Const objects (e.g., `const DataType = { String: 'STRING' } as const`)
   - Impact: Code using enum member access patterns may break
   - Example: `DataType.STRING` becomes `DataType.String` (but value stays `"STRING"`)
   - **entity.interface.ts uses enums in type definitions** - must verify compatibility

### MEDIUM Priority

3. **Import path changes for enums**
   - Current: `import { DataType } from "@/lib/types/types"`
   - New: `import { DataType } from "@/lib/types/models/DataType"` or `import { DataType } from "@/lib/types"`
   - entity.interface.ts needs to update these imports

4. **Schema alias preservation**
   - `Schema` is an alias for `SchemaString`
   - Must maintain: `export type Schema = SchemaString`
   - Consumers expect `Schema` not `SchemaString`

### LOW Priority

5. **Re-export chain from common to entity interface**
   - entity.interface.ts imports `Icon` and `SchemaUUID` from common.interface.ts
   - After migration, could import directly from models, but maintaining current pattern preserves consistency

6. **Custom types must be preserved exactly**
   - All local interfaces, enums, and type guards in entity.interface.ts must remain unchanged
   - These are not affected by OpenAPI type migration

## Recommendations

### Approach

1. **Migrate common.interface.ts first**
   - Simpler file, fewer exports
   - entity.interface.ts depends on it
   - Define Address locally

2. **Then migrate entity.interface.ts**
   - Replace all `components["schemas"]` imports
   - Update enum imports to new model paths
   - Keep all custom local types unchanged
   - Keep re-exports from hooks unchanged

3. **Use barrel import from `@/lib/types`**
   - Cleaner than individual model file imports
   - Models index re-exports everything

### Suggested common.interface.ts After Migration

```typescript
// Direct model imports
import { Condition } from "@/lib/types/models/Condition";
import { FormStructure } from "@/lib/types/models/FormStructure";
import { Icon } from "@/lib/types/models/Icon";
import { SchemaOptions } from "@/lib/types/models/SchemaOptions";
import { SchemaString } from "@/lib/types/models/SchemaString";
import { SchemaUUID } from "@/lib/types/models/SchemaUUID";

// Re-export for consumers
export type { Condition, FormStructure, Icon, SchemaOptions, SchemaUUID };

// Alias preservation
export type Schema = SchemaString;

// Custom local type (not in OpenAPI spec)
export interface Address {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}
```

### Suggested entity.interface.ts After Migration (partial)

```typescript
import { Icon, SchemaUUID } from "@/lib/interfaces/common.interface";
import {
    DataType,
    Entity,
    EntityAttribute,
    EntityAttributePayload,
    EntityAttributePrimitivePayload,
    EntityAttributeRelationPayload,
    EntityAttributeRelationPayloadReference,
    EntityAttributeRequest,
    EntityLink,
    EntityPropertyType,
    EntityRelationshipCardinality,
    EntityRelationshipDefinition,
    EntityType,
    EntityTypeAttributeColumn,
    EntityTypeImpactResponse,
    CreateEntityTypeRequest,
    DeleteAttributeDefinitionRequest,
    DeleteEntityResponse,
    DeleteRelationshipDefinitionRequest,
    DeleteTypeDefinitionRequest,
    SaveAttributeDefinitionRequest,
    SaveEntityRequest,
    SaveEntityResponse,
    SaveRelationshipDefinitionRequest,
    SaveTypeDefinitionRequest,
    SchemaType,
} from "@/lib/types";

// Re-export all OpenAPI types
export type {
    Entity,
    EntityAttribute,
    EntityAttributePayload,
    // ... etc
};

// Local types remain unchanged
export interface EntityTypeDefinition { ... }
// ... etc
```

### Testing Strategy

1. Run `npm run build` after each file migration
2. TypeScript compiler will catch any type mismatches
3. Pay special attention to enum usage patterns
4. Verify AddressCard component still works with local Address type

## Sources

### Primary (HIGH confidence)
- Direct file inspection of:
  - `/home/jared/dev/worktrees/riven-openapi/client/lib/interfaces/common.interface.ts`
  - `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/entity/interface/entity.interface.ts`
  - `/home/jared/dev/worktrees/riven-openapi/client/lib/types/models/*.ts` (generated models)
  - `/home/jared/dev/worktrees/riven-openapi/client/lib/types/index.ts` (barrel export)
  - `/home/jared/dev/worktrees/riven-openapi/client/lib/types/types.ts` (old openapi-typescript output)

### Secondary (MEDIUM confidence)
- Consumer file analysis via grep

## Metadata

**Confidence breakdown:**
- Type mappings: HIGH - verified by direct file inspection
- Consumer analysis: HIGH - verified by grep search
- Address type issue: HIGH - confirmed not in either old or new types
- Enum compatibility: MEDIUM - syntax verified, runtime compatibility assumed

**Research date:** 2026-01-22
**Valid until:** 60 days (stable migration, no external dependencies)
