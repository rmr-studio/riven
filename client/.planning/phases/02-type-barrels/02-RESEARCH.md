# Phase 2: Type Barrels - Research

**Researched:** 2025-01-25
**Domain:** TypeScript barrel exports and type re-exports for domain organization
**Confidence:** HIGH

## Summary

Phase 2 requires creating domain-based barrel exports in `lib/types/{domain}/` directories (entity, block, workspace, user) that provide single import paths for all types in each domain. These barrels will consolidate generated OpenAPI types with custom types and type guards, enabling consumers to import via `import type { EntityType } from "@/lib/types/entity"`.

The existing feature module interface files demonstrate the current patterns: re-exporting from `@/lib/types` and `@/lib/types/types`, adding custom types (interfaces, type aliases, enums), and providing type guards. The new barrel structure will move these to `lib/types/{domain}/` and add categorization (models.ts, requests.ts, responses.ts).

**Primary recommendation:** Create categorized barrel files in each domain directory, re-export generated types using `export type { }` syntax, co-locate custom types and type guards, and aggregate everything through `index.ts`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | Type system and re-exports | Project requirement, strict mode enabled |
| @openapitools/openapi-generator-cli | 2.28.0 | Generates source types in models/ | Already configured and generating types |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.25.67 | Form validation schemas | Form values types derived from Zod schemas |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Categorized files (models.ts, etc.) | Single barrel file | Categories provide organization, easier navigation |
| `export type { }` syntax | `export { }` | Type-only exports are cleaner, no runtime artifacts |
| Domain barrels | Central barrel | Domain barrels provide semantic imports, better tree-shaking |

**Installation:**
No additional packages required - TypeScript re-export syntax is built-in.

## Architecture Patterns

### Recommended Project Structure
```
lib/types/
├── apis/                    # Generated (do not modify)
├── models/                  # Generated (do not modify)
├── runtime.ts               # Generated (do not modify)
├── types.ts                 # Generated (do not modify)
├── index.ts                 # Generated (do not modify)
├── entity/                  # Custom barrel (protected by .openapi-generator-ignore)
│   ├── models.ts           # Entity model type re-exports
│   ├── requests.ts         # Entity request type re-exports
│   ├── responses.ts        # Entity response type re-exports
│   ├── guards.ts           # Type guard functions
│   ├── custom.ts           # Custom types not from OpenAPI
│   └── index.ts            # Aggregate all exports
├── block/                   # Custom barrel (protected)
│   ├── models.ts
│   ├── requests.ts
│   ├── responses.ts
│   ├── guards.ts
│   ├── custom.ts
│   └── index.ts
├── workspace/               # Custom barrel (protected)
│   ├── models.ts
│   ├── requests.ts
│   ├── responses.ts
│   ├── custom.ts
│   └── index.ts
└── user/                    # Custom barrel (protected)
    ├── models.ts
    ├── requests.ts
    ├── responses.ts
    ├── custom.ts
    └── index.ts
```

### Pattern 1: Type-Only Re-Export
**What:** Re-export generated types with explicit `export type` syntax
**When to use:** All type re-exports from generated code
**Example:**
```typescript
// Source: TypeScript best practice for type-only exports
// lib/types/entity/models.ts
export type {
    Entity,
    EntityType,
    EntityAttribute,
    EntityAttributePayload,
    EntityAttributePrimitivePayload,
    EntityAttributeRelationPayload,
    EntityRelationshipDefinition,
    EntityTypeAttributeColumn,
    EntityLink,
} from "@/lib/types/models";
```

### Pattern 2: Custom Type Definition Alongside Re-Exports
**What:** Define custom types that extend or complement generated types
**When to use:** When generated types need augmentation or domain-specific helpers
**Example:**
```typescript
// Source: Derived from components/feature-modules/entity/interface/entity.interface.ts
// lib/types/entity/custom.ts
import type {
    EntityPropertyType,
    EntityRelationshipDefinition,
    EntityRelationshipCardinality,
    SchemaType,
    DataType,
    SchemaUUID,
    Icon
} from "@/lib/types/models";

export interface EntityTypeDefinition {
    id: string;
    type: EntityPropertyType;
    definition: EntityAttributeDefinition | EntityRelationshipDefinition;
}

export interface EntityAttributeDefinition {
    id: string;
    schema: SchemaUUID;
}

export interface EntityTypeAttributeRow {
    id: string;
    label: string;
    type: EntityPropertyType;
    protected?: boolean;
    required: boolean;
    schemaType: SchemaType | "RELATIONSHIP";
    additionalConstraints: string[];
    dataType?: DataType;
    unique?: boolean;
    cardinality?: EntityRelationshipCardinality;
    entityTypeKeys?: string[];
    allowPolymorphic?: boolean;
    bidirectional?: boolean;
}

export interface EntityRelationshipCandidate {
    icon: Icon;
    name: string;
    key: string;
    existingRelationship: EntityRelationshipDefinition;
}

export enum RelationshipLimit {
    SINGULAR,
    MANY,
}
```

### Pattern 3: Type Guards in Separate File
**What:** Keep type guard functions in dedicated guards.ts file
**When to use:** Type narrowing for discriminated unions
**Example:**
```typescript
// Source: Derived from components/feature-modules/entity/interface/entity.interface.ts
// lib/types/entity/guards.ts
import type {
    EntityAttributePayload,
    EntityAttributeRelationPayload,
    EntityRelationshipDefinition,
} from "./models";
import type { EntityAttributeDefinition } from "./custom";
import { EntityPropertyType } from "@/lib/types/models";

export const isRelationshipDefinition = (
    attribute: EntityRelationshipDefinition | EntityAttributeDefinition
): attribute is EntityRelationshipDefinition => {
    return !("schema" in attribute);
};

export const isAttributeDefinition = (
    attribute: EntityRelationshipDefinition | EntityAttributeDefinition
): attribute is EntityAttributeDefinition => {
    return "schema" in attribute;
};

export const isRelationshipPayload = (
    payload: EntityAttributePayload
): payload is EntityAttributeRelationPayload => {
    return payload.type === EntityPropertyType.Relationship;
};
```

### Pattern 4: Barrel Index Aggregation
**What:** Index file re-exports all categorized files
**When to use:** Every domain barrel
**Example:**
```typescript
// lib/types/entity/index.ts
export type * from "./models";
export type * from "./requests";
export type * from "./responses";
export * from "./guards";
export * from "./custom";
```

### Anti-Patterns to Avoid
- **Importing from generated files directly:** Always import from domain barrels after Phase 4
- **Mixing runtime and type exports:** Use `export type` for types, regular `export` for guards/enums
- **Creating aliases:** Keep original generated names, no semantic renaming
- **Importing internal barrel files:** Consumers use `@/lib/types/entity`, not `@/lib/types/entity/models`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type narrowing | Type assertions (`as`) | Type guard functions | Guards provide runtime safety and proper narrowing |
| Operation type extraction | Manual interface duplication | `operations["opName"]` from types.ts | Generated types are authoritative |
| Form value types | Duplicate interface | `z.infer<typeof schema>` | Zod inference is type-safe |

**Key insight:** The generated `types.ts` contains `components` and `operations` that can be used for response/request extraction. This is the pattern used in workspace and user interfaces.

## Common Pitfalls

### Pitfall 1: Circular Import Dependencies
**What goes wrong:** Barrel files importing from each other create circular dependencies
**Why it happens:** Type guards need types from models, custom types need generated types
**How to avoid:** Order imports carefully: generated -> models.ts -> custom.ts -> guards.ts -> index.ts
**Warning signs:** TypeScript errors about undefined types, runtime import failures

### Pitfall 2: Mixing Type and Value Exports
**What goes wrong:** `export type *` doesn't work with functions/enums/const
**Why it happens:** Type guards and custom enums are values, not just types
**How to avoid:** Use `export type *` for type-only files, `export *` for files with runtime values
**Warning signs:** "Cannot re-export a type when the '--isolatedModules' flag is provided"

### Pitfall 3: Forgetting to Export From Index
**What goes wrong:** Types exist in category files but not accessible from barrel import
**Why it happens:** Adding types to category file without updating index
**How to avoid:** Index uses wildcard re-export (`export * from`), which auto-includes new exports
**Warning signs:** "Module has no exported member" errors

### Pitfall 4: Breaking Generated Type References
**What goes wrong:** Custom types shadow generated types incorrectly
**Why it happens:** Using same name for extended type causes confusion
**How to avoid:** Only shadow when extending (interface extends), otherwise use different name
**Warning signs:** Type mismatches in components that expected original type

### Pitfall 5: Import Path Confusion During Migration
**What goes wrong:** Some files use old paths, some use new, inconsistent state
**Why it happens:** Partial migration leaves mixed imports
**How to avoid:** Phase 2 creates barrels only; Phase 4 updates imports systematically
**Warning signs:** Duplicate type definitions in scope

## Code Examples

Verified patterns from official sources:

### Entity Models Barrel
```typescript
// lib/types/entity/models.ts
// Re-export core entity model types from generated code

export type {
    // Core entity types
    Entity,
    EntityType,
    EntityCategory,
    EntityLink,

    // Attribute system
    EntityAttribute,
    EntityAttributePayload,
    EntityAttributePrimitivePayload,
    EntityAttributeRelationPayload,
    EntityAttributeRelationPayloadReference,
    EntityTypeAttributeColumn,

    // Relationship system
    EntityRelationshipDefinition,
    EntityRelationshipCardinality,

    // Schema types
    SchemaUUID,
    SchemaType,
    DataType,

    // Display types
    DisplayName,
    Icon,

    // Impact analysis
    EntityImpactSummary,
    EntityTypeImpactResponse,
    EntityTypeRelationshipImpactAnalysis,
    EntityTypeRelationshipDataLossWarning,
    EntityTypeRelationshipDataLossReason,
    EntityTypeRelationshipType,
} from "@/lib/types/models";
```

### Entity Requests Barrel
```typescript
// lib/types/entity/requests.ts
// Re-export entity-related request types from generated code

export type {
    CreateEntityTypeRequest,
    SaveEntityRequest,
    SaveTypeDefinitionRequest,
    SaveTypeDefinitionRequestDefinition,
    SaveAttributeDefinitionRequest,
    SaveRelationshipDefinitionRequest,
    DeleteTypeDefinitionRequest,
    DeleteTypeDefinitionRequestDefinition,
    DeleteAttributeDefinitionRequest,
    DeleteRelationshipDefinitionRequest,
    EntityAttributeRequest,
    EntityAttributeRequestPayload,
    EntityReferenceRequest,
    EntityTypeRequestDefinition,
} from "@/lib/types/models";
```

### Entity Responses Barrel
```typescript
// lib/types/entity/responses.ts
// Re-export entity-related response types from generated code

export type {
    SaveEntityResponse,
    DeleteEntityResponse,
    EntityTypeImpactResponse,
} from "@/lib/types/models";
```

### Block Models Barrel
```typescript
// lib/types/block/models.ts
// Re-export core block model types from generated code

export type {
    // Core block types
    Block,
    BlockType,
    BlockDisplay,
    BlockBinding,
    BlockComponentNode,
    BlockMeta,
    BlockPayload,
    BlockTypeNesting,
    BlockRenderStructure,

    // Tree types
    BlockTree,
    BlockTreeRoot,
    BlockTreeLayout,
    BlockTreeReference,
    BlockEnvironment,
    TreeLayout,
    TreeLayoutColumn,

    // Node types
    Node,
    ContentNode,
    ReferenceNode,

    // Metadata types
    BlockContentMetadata,
    BlockReferenceMetadata,
    EntityReferenceMetadata,
    Metadata,

    // Reference types
    EntityReference,
    ReferenceItem,
    ReferencePayload,

    // Layout types
    GridRect,
    LayoutGrid,
    LayoutGridItem,
    Widget,

    // Configuration types
    BlockListConfiguration,
    ListConfig,
    ListDisplayConfig,
    FormStructure,
    FormWidgetConfig,
    RenderContent,

    // Operations
    BlockOperation,
    AddBlockOperation,
    RemoveBlockOperation,
    MoveBlockOperation,
    UpdateBlockOperation,
    ReorderBlockOperation,
    StructuralOperationRequest,

    // Hydration
    BlockHydrationResult,
} from "@/lib/types/models";
```

### Block Custom Types
```typescript
// lib/types/block/custom.ts
// Custom types specific to block domain

import type {
    ContentNode,
    ReferenceNode,
    EntityReference,
    BlockTreeReference,
    BlockContentMetadata,
    BlockReferenceMetadata,
    EntityReferenceMetadata,
} from "./models";

// Composite types for convenience
export type BlockNode = ContentNode | ReferenceNode;
export type ReferencePayloadUnion = EntityReference | BlockTreeReference;
export type MetadataUnion = BlockContentMetadata | BlockReferenceMetadata | EntityReferenceMetadata;

// Semantic aliases for clarity (kept same name per decisions)
export type EntityReferencePayload = EntityReference;
export type BlockReferencePayload = BlockTreeReference;
export type WidgetRenderStructure = RenderContent;
export type EntityReferenceHydrationRequest = EntityReferenceRequest;
export type HydrateBlockRequest = HydrateBlocksRequest;
export type HydrateBlockResponse = Record<string, BlockHydrationResult>;

// Re-export operations response type
import type { operations } from "@/lib/types/types";
export type GetBlockTypesResponse = operations["getBlockTypes"]["responses"]["200"]["content"]["*/*"];
```

### Block Guards
```typescript
// lib/types/block/guards.ts
// Type guards for block discriminated unions

import type { Block, ContentNode, ReferenceNode, BlockContentMetadata, BlockReferenceMetadata, EntityReferenceMetadata } from "./models";
import type { BlockNode } from "./custom";
import { BlockMetadataType, NodeType } from "@/lib/types/models";

export const isContentMetadata = (
    payload: Block["payload"]
): payload is BlockContentMetadata => payload?.type === BlockMetadataType.CONTENT;

export const isBlockReferenceMetadata = (
    payload: Block["payload"]
): payload is BlockReferenceMetadata => payload?.type === BlockMetadataType.BLOCK_REFERENCE;

export const isEntityReferenceMetadata = (
    payload: Block["payload"]
): payload is EntityReferenceMetadata => payload?.type === BlockMetadataType.ENTITY_REFERENCE;

export const isContentNode = (node: BlockNode): node is ContentNode =>
    !!node.block && node.type === NodeType.CONTENT;

export const isReferenceNode = (node: BlockNode): node is ReferenceNode =>
    !!node.block && node.type === NodeType.REFERENCE;
```

### Workspace Models Barrel
```typescript
// lib/types/workspace/models.ts
// Re-export workspace model types from generated code

export type {
    Workspace,
    WorkspaceMember,
    WorkspaceInvite,
    WorkspacePlan,
    WorkspaceDefaultCurrency,
    WorkspaceDisplay,
    WorkspaceRoles,
} from "@/lib/types/models";
```

### Workspace Custom Types (Operations-Based)
```typescript
// lib/types/workspace/custom.ts
// Custom types derived from operations for workspace

import type { operations } from "@/lib/types/types";
import type { WorkspaceInvite } from "./models";

// Derived type from model property
export type WorkspaceInviteStatus = WorkspaceInvite["status"];

// Path parameter types from operations
export type GetWorkspacePathParams = operations["getWorkspace"]["parameters"]["path"];
export type DeleteWorkspacePathParams = operations["deleteWorkspace"]["parameters"]["path"];
export type UpdateMemberRolePathParams = operations["updateMemberRole"]["parameters"]["path"];
export type InviteToWorkspacePathParams = operations["inviteToWorkspace"]["parameters"]["path"];
export type RejectInvitePathParams = operations["rejectInvite"]["parameters"]["path"];
export type AcceptInvitePathParams = operations["acceptInvite"]["parameters"]["path"];
export type GetWorkspaceInvitesPathParams = operations["getWorkspaceInvites"]["parameters"]["path"];
export type RemoveMemberFromWorkspacePathParams = operations["removeMemberFromWorkspace"]["parameters"]["path"];
export type RevokeInvitePathParams = operations["revokeInvite"]["parameters"]["path"];

// Query parameter types from operations
export type GetWorkspaceQueryParams = operations["getWorkspace"]["parameters"]["query"];
```

### User Models Barrel
```typescript
// lib/types/user/models.ts
// Re-export user model types from generated code

export type {
    User,
    UserDisplay,
} from "@/lib/types/models";
```

### User Custom Types (Operations-Based)
```typescript
// lib/types/user/custom.ts
// Custom types derived from operations for user

import type { operations } from "@/lib/types/types";

// Request payloads
export type UpdateUserProfileRequest = operations["updateUserProfile"]["requestBody"]["content"]["application/json"];

// Response payloads
export type GetCurrentUserResponse = operations["getCurrentUser"]["responses"]["200"]["content"]["*/*"];
export type GetUserByIdResponse = operations["getUserById"]["responses"]["200"]["content"]["*/*"];
export type UpdateUserProfileResponse = operations["updateUserProfile"]["responses"]["200"]["content"]["*/*"];

// Path parameters
export type GetUserByIdPathParams = operations["getUserById"]["parameters"]["path"];
export type DeleteUserProfileByIdPathParams = operations["deleteUserProfileById"]["parameters"]["path"];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Feature module interfaces | Domain barrels in lib/types | This migration | Centralized type location, simpler imports |
| Import from `@/lib/types` | Import from `@/lib/types/{domain}` | This migration | Semantic imports, better discoverability |
| `components["schemas"]["X"]` | Re-exported type | This migration | Cleaner consumer code |

**Deprecated/outdated:**
- `components/feature-modules/*/interface/*.interface.ts`: Will be replaced by lib/types/{domain}/ barrels
- Direct imports from `@/lib/types/types`: Replaced by domain imports (Phase 4)
- Direct imports from `@/lib/types`: Replaced by domain imports for models (Phase 4)

## Open Questions

Things that couldn't be fully resolved:

1. **Overlap Detection Types Location**
   - What we know: Types like `RelationshipOverlap`, `OverlapResolution`, `OverlapDetectionResult` exist in entity hooks
   - What's unclear: Whether to move to entity barrel or keep with hook
   - Recommendation: Move to entity/custom.ts since they're pure types used across components

2. **Form Widget Types Location**
   - What we know: `FormWidgetProps`, `FormWidgetMeta` exist in blocks/components/forms/
   - What's unclear: Whether these belong in block barrel or should stay with forms
   - Recommendation: Keep with forms since they're specific to form widget implementation, not domain types

3. **Common Interface Types**
   - What we know: `lib/interfaces/interface.ts` has generic types like `ChildNodeProps`, `Query<T>`
   - What's unclear: Whether these should have their own barrel
   - Recommendation: Outside Phase 2 scope - these are UI/React patterns, not domain types

## Sources

### Primary (HIGH confidence)
- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/entity/interface/entity.interface.ts` - Existing entity type patterns
- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/blocks/interface/block.interface.ts` - Existing block type patterns
- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/workspace/interface/workspace.interface.ts` - Existing workspace type patterns
- `/home/jared/dev/worktrees/riven-openapi/client/components/feature-modules/user/interface/user.interface.ts` - Existing user type patterns
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/models/index.ts` - Generated model exports
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/.openapi-generator-ignore` - Protected directories
- `/home/jared/dev/worktrees/riven-openapi/client/tsconfig.json` - Path aliases configuration

### Secondary (MEDIUM confidence)
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/types.ts` - Generated types.ts with components and operations
- TypeScript documentation on `export type` syntax

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All TypeScript patterns, no external dependencies
- Architecture: HIGH - Follows existing interface file patterns, clear migration path
- Pitfalls: HIGH - Derived from actual code analysis and TypeScript behavior

**Research date:** 2025-01-25
**Valid until:** 2025-02-25 (stable TypeScript patterns, unlikely to change)
