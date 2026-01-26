# Phase 5: Cleanup - Research

**Researched:** 2026-01-26
**Domain:** Legacy file removal, TypeScript cleanup, documentation updates
**Confidence:** HIGH

## Summary

Phase 5 completes the OpenAPI migration by removing legacy interface re-export files from feature modules and the old `lib/types/types.ts` file. The migration infrastructure (domain barrels in `lib/types/{domain}/`) is already in place from Phase 2, and imports have been updated in Phase 4. This phase performs the final deletion of obsolete files and updates CLAUDE.md to reflect the new patterns.

Key findings:
- 11 legacy `.interface.ts` files exist in feature modules, varying in content (some pure re-exports, some with custom types)
- Custom types from interface files have already been moved to domain barrels (`lib/types/{domain}/custom.ts`)
- `lib/types/types.ts` still has 17 references (mostly in interface files and planning docs)
- `lib/interfaces/interface.ts` is NOT legacy - it contains shared utility types and has 44 usages
- `lib/interfaces/common.interface.ts` and `lib/interfaces/template.interface.ts` may need cleanup
- Current TypeScript error count: 281 (baseline for verification)

**Primary recommendation:** Delete interface files by domain, verify build after each, then delete types.ts last.

## Standard Stack

No new libraries needed for this phase - it's a removal/cleanup phase.

### File Locations

| Category | Location | Status |
|----------|----------|--------|
| Legacy interface files | `components/feature-modules/*/interface/*.interface.ts` | TO DELETE |
| Legacy types file | `lib/types/types.ts` | TO DELETE |
| Domain barrels | `lib/types/{entity,block,workspace,user,common}/` | KEEP |
| Shared utilities | `lib/interfaces/interface.ts` | KEEP |
| Common re-exports | `lib/interfaces/common.interface.ts` | REVIEW |
| Unused template file | `lib/interfaces/template.interface.ts` | DELETE |

## Architecture Patterns

### Target Import Pattern (Post-Cleanup)

```typescript
// Domain types (OpenAPI-generated models + custom types)
import type { EntityType, EntityRelationshipDefinition } from "@/lib/types/entity";
import type { BlockType, BlockNode } from "@/lib/types/block";
import type { Workspace, WorkspaceMember } from "@/lib/types/workspace";
import type { User } from "@/lib/types/user";

// Shared utility types (React patterns, form helpers)
import type { ChildNodeProps, ClassNameProps, FCWC } from "@/lib/interfaces/interface";

// Enums (runtime values)
import { BlockMetadataType, NodeType } from "@/lib/types/block";
import { EntityPropertyType, EntityCategory } from "@/lib/types/entity";

// Common display types
import type { Icon, DisplayName } from "@/lib/types/common";
import { IconColour, IconType } from "@/lib/types/common";
```

### Files to Delete (By Domain)

**Entity Domain (1 file):**
```
components/feature-modules/entity/interface/entity.interface.ts
```
- Contains: Re-exports (already in barrels) + custom types (already migrated) + type guards (already in `guards.ts`)
- References overlap detection hook (needs import update in hook first)

**Block Domain (7 files):**
```
components/feature-modules/blocks/interface/block.interface.ts
components/feature-modules/blocks/interface/command.interface.ts
components/feature-modules/blocks/interface/editor.interface.ts
components/feature-modules/blocks/interface/grid.interface.ts
components/feature-modules/blocks/interface/layout.interface.ts
components/feature-modules/blocks/interface/panel.interface.ts
components/feature-modules/blocks/interface/render.interface.ts
```
- Mix of: Pure re-exports, custom types, and Gridstack integration types

**Workspace Domain (1 file):**
```
components/feature-modules/workspace/interface/workspace.interface.ts
```
- Contains: Pure re-exports from operations (already in `custom.ts`)

**User Domain (1 file):**
```
components/feature-modules/user/interface/user.interface.ts
```
- Contains: Pure re-exports from operations (already in `custom.ts`)

**Authentication Domain (1 file):**
```
components/feature-modules/authentication/interface/auth.interface.ts
```
- Contains: Supabase auth types (custom, not OpenAPI)
- Special handling: These types are auth-specific, not generated

### Remaining Import References

After Phase 4, these imports to interface files remain (22 files):
- Most are within the interface files themselves (cross-references)
- Some components still import from interface files for local types

These will need import updates when deleting the interface files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type definitions | Manual type definitions | Domain barrels (`@/lib/types/{domain}`) | Centralized, auto-generated, consistent |
| Type guards | Inline type checks | Guard functions in `{domain}/guards.ts` | Reusable, tested, co-located |
| Custom types | Scattered definitions | `{domain}/custom.ts` files | Single source of truth |

## Common Pitfalls

### Pitfall 1: Deleting Files With Active Consumers
**What goes wrong:** Deleting an interface file that still has imports
**Why it happens:** Not checking all import references before deletion
**How to avoid:**
1. Run `grep` to find all imports of the file
2. Update imports to use domain barrel equivalents
3. Only delete when import count is zero
**Warning signs:** TypeScript compilation fails immediately after deletion

### Pitfall 2: Breaking Cross-References Between Interface Files
**What goes wrong:** Interface files import from each other (e.g., `render.interface.ts` imports from `block.interface.ts`)
**Why it happens:** Interfaces evolved organically with interdependencies
**How to avoid:**
1. Map dependencies between interface files
2. Delete leaf files first (no dependents)
3. Update imports in dependent files before deleting dependencies
**Warning signs:** Circular dependency errors, missing type errors

### Pitfall 3: Losing Custom Types During Deletion
**What goes wrong:** Custom types unique to interface files get deleted
**Why it happens:** Assuming all types are re-exports when some are local definitions
**How to avoid:**
1. Compare interface file contents against domain barrel contents
2. Migrate any missing custom types before deletion
3. CONTEXT.md specifies: move custom types to `@/lib/types/{domain}/index.ts`
**Warning signs:** `Cannot find name` errors for custom types after deletion

### Pitfall 4: Enum Value vs Type Confusion
**What goes wrong:** Importing type where runtime value is needed
**Why it happens:** TypeScript `import type` strips runtime values
**How to avoid:**
- Use `import { EnumName }` for runtime access
- Use `import type { TypeName }` for type-only
**Warning signs:** `EnumName only refers to a type, but is being used as a value here`

### Pitfall 5: Not Updating CLAUDE.md
**What goes wrong:** Documentation shows old patterns, confuses future development
**Why it happens:** Focusing only on code changes
**How to avoid:**
1. Review all CLAUDE.md sections mentioning types, interfaces, imports
2. Update examples to show new patterns
3. Remove references to deleted files/patterns
**Warning signs:** Documentation audit reveals stale content

## Code Examples

### Example 1: Entity Interface Deletion Pattern

**Current entity.interface.ts content (will delete):**
```typescript
// Re-exports (already in @/lib/types/entity)
export type { EntityType, EntityRelationshipDefinition, ... } from "@/lib/types";

// Custom types (already in @/lib/types/entity/custom.ts)
export interface EntityTypeDefinition { ... }
export interface EntityTypeAttributeRow { ... }
export enum RelationshipLimit { ... }

// Type guards (already in @/lib/types/entity/guards.ts)
export const isRelationshipDefinition = ...
export const isAttributeDefinition = ...
```

**After deletion, consumers import from:**
```typescript
// Types and custom types
import type {
    EntityType,
    EntityRelationshipDefinition,
    EntityTypeDefinition,
    EntityTypeAttributeRow
} from "@/lib/types/entity";

// Enums
import { RelationshipLimit, EntityPropertyType } from "@/lib/types/entity";

// Guards
import { isRelationshipDefinition, isAttributeDefinition } from "@/lib/types/entity";
```

### Example 2: Block Interface With Custom Types

**grid.interface.ts (will delete):**
```typescript
import { GridStack, GridStackNode, GridStackOptions, GridStackWidget } from "gridstack";
import { WidgetRenderStructure } from "./render.interface";

export interface GridEnvironment { ... }
export interface GridProviderProps extends ChildNodeProps { ... }
export interface GridActionResult<T> { ... }
export interface GridstackContextValue { ... }
```

**These types need migration to `lib/types/block/custom.ts` or stay local if only used by grid context.**

### Example 3: CLAUDE.md Update Pattern

**Before (old pattern):**
```markdown
#### 1. Type Safety with OpenAPI

\`\`\`typescript
// lib/types/types.ts - generated from OpenAPI spec
import { components } from "@/lib/types/types";

// feature-modules/entity/interface/entity.interface.ts - semantic re-exports
export type EntityType = components["schemas"]["EntityType"];
\`\`\`

**Always use re-exported types from feature interfaces, never import directly from lib/types.**
```

**After (new pattern):**
```markdown
#### 1. Type Safety with OpenAPI

\`\`\`typescript
// Domain barrels aggregate generated types, custom types, and guards
import type { EntityType, EntityRelationshipDefinition } from "@/lib/types/entity";
import type { BlockType, BlockNode } from "@/lib/types/block";

// Enums are runtime values, not type-only imports
import { EntityPropertyType, BlockMetadataType } from "@/lib/types/entity";
import { NodeType } from "@/lib/types/block";
\`\`\`

**Import domain types from `@/lib/types/{domain}`, not from feature interface files.**
```

## State of the Art

| Old Pattern | Current Pattern | Changed | Impact |
|-------------|-----------------|---------|--------|
| `import { Type } from "@/lib/types/types"` | `import type { Type } from "@/lib/types/{domain}"` | Phase 4 | Domain-scoped imports |
| `import { Type } from "@/components/.../interface/*.interface"` | `import type { Type } from "@/lib/types/{domain}"` | Phase 5 | Single source of truth |
| Custom types in feature interface files | Custom types in `lib/types/{domain}/custom.ts` | Phase 2 | Co-located with generated types |
| Type guards scattered | Guards in `lib/types/{domain}/guards.ts` | Phase 2 | Centralized, reusable |

**Deprecated/Removed:**
- `lib/types/types.ts` - replaced by domain barrels
- `*/interface/*.interface.ts` - re-exports consolidated to domain barrels
- `lib/interfaces/template.interface.ts` - unused, references non-existent schemas

## Open Questions

### Question 1: Block Interface Custom Types

**What we know:** Block interface files contain Gridstack integration types (GridEnvironment, GridstackContextValue, etc.) that aren't in the domain barrel
**What's unclear:** Should these move to `lib/types/block/custom.ts` or stay as local context types?
**Recommendation:** If types are only used by grid context provider, keep them local. If used by multiple components, migrate to barrel.

### Question 2: Auth Interface Types

**What we know:** `auth.interface.ts` contains Supabase-specific types, not OpenAPI types
**What's unclear:** Should these move to `lib/types/auth/` or stay in authentication module?
**Recommendation:** Keep in authentication module - these are auth-framework-specific, not domain types.

### Question 3: lib/interfaces/common.interface.ts

**What we know:** Re-exports types from `@/lib/types` plus defines `Address` type
**What's unclear:** Should this file be cleaned up/removed?
**Recommendation:** Keep but simplify - consumers can import directly from `@/lib/types/common`

## Pre-Existing TypeScript Errors

**Baseline: 281 errors** (must not increase after cleanup)

Key categories:
1. **Property naming** (`enum` vs `_enum`, `protected` vs `_protected`) - form utilities
2. **Icon type mismatch** (`icon` property vs `type` property) - schema.util.ts
3. **Template interface** - references non-existent schemas (deleting will REDUCE errors)
4. **EntityType enum confusion** - code treats model type as enum values
5. **Missing type declarations** - lodash, missing module errors

Phase 5 should not fix these - only verify same error count (or less) after cleanup.

## Sources

### Primary (HIGH confidence)
- Codebase analysis via Glob/Grep tools
- Direct file inspection of all 11 interface files
- TypeScript compilation output (`tsc --noEmit`)

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions from user discussion
- STATE.md accumulated context
- PROJECT.md migration goals

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- File inventory: HIGH - verified via Glob
- Import references: HIGH - verified via Grep counts
- Custom type locations: HIGH - verified domain barrel contents
- Error baseline: HIGH - measured via tsc

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable codebase, no external dependencies)

## Deletion Dependency Graph

```
                     [types.ts]
                         |
        +----------------+----------------+
        |                |                |
   [block.interface.ts]  |    [workspace.interface.ts]
        |                |                |
        v                v                v
   [command.interface.ts]  [layout.interface.ts]
   [editor.interface.ts]
   [grid.interface.ts]
   [panel.interface.ts]
   [render.interface.ts]
```

**Deletion order (leaf to root):**
1. Delete leaf interfaces (no internal dependents): panel, grid, render
2. Delete mid-level: command, editor, layout
3. Delete block.interface.ts (after updating command/editor imports)
4. Delete entity, workspace, user, auth interfaces (parallel)
5. Delete lib/interfaces/template.interface.ts
6. Verify build
7. Delete lib/types/types.ts LAST

## Checklist for Cleanup

- [ ] Entity interface: migrate overlap detection re-exports
- [ ] Block interfaces: update cross-references before deletion
- [ ] Workspace interface: pure re-exports, safe to delete after imports updated
- [ ] User interface: pure re-exports, safe to delete after imports updated
- [ ] Auth interface: custom types, may need local migration
- [ ] template.interface.ts: unused, delete directly
- [ ] CLAUDE.md: update all type import examples
- [ ] types.ts: delete after all interface files removed
- [ ] Final tsc verification: error count <= 281
