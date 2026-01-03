# Riven - AI Development Reference

## 1. Project Overview

Riven is a full-stack SaaS platform for dynamic entity and content management with schema-driven architecture. It enables multi-tenant organizations to define custom entity types with flexible schemas, build composable content blocks using drag-and-drop hierarchical systems, and manage complex data relationships with cardinality constraints and impact analysis.

## 2. Tech Stack

### Backend (`/core`)
- **Framework:** Spring Boot 3.5.3 + Kotlin 2.1.21 + Java 21
- **Build Tool:** Gradle 8.7.0
- **Database:** PostgreSQL (schema.sql manages DDL)
- **Key Libraries:**
  - Spring Data JPA, Hibernate 63, Hypersistence Utils
  - Spring Security, OAuth2 Resource Server (JWT via Supabase)
  - JSON Schema Validator (networknt)
  - SpringDoc OpenAPI 2.8.6
  - Supabase Storage (with Ktor client)
  - OpenPDF 1.3.30
  - Kotlin Logging 7.0.0

### Frontend (`/client`)
- **Framework:** Next.js 15.3.4 (App Router) + React 19 + TypeScript 5
- **UI:** Tailwind CSS 4 + shadcn/ui (70+ components)
- **State:** TanStack Query 5.81.2 (server state) + Zustand 5.0.8 (client state)
- **Forms:** React Hook Form 7.58.1 + Zod 3.25.67
- **Key Libraries:**
  - Gridstack 12.3.3 (drag-and-drop layouts)
  - @xyflow/react 12.10.0 (node graphs)
  - Framer Motion 12.23.24 (animations)
  - Supabase 2.50.0 (auth/backend)
  - OpenAPI TypeScript 7.8.0 (type generation)

## 3. Architecture

### Directory Structure

```
riven/
├── core/                                    # Spring Boot backend
│   ├── src/main/kotlin/riven/core/
│   │   ├── CoreApplication.kt              # Entry point
│   │   ├── configuration/                  # Spring config (auth, storage, audit)
│   │   ├── controller/                     # REST endpoints
│   │   │   ├── entity/                    # Entity type APIs
│   │   │   └── block/                     # Block APIs
│   │   ├── service/                        # Business logic (READ THIS SECTION)
│   │   │   ├── entity/type/               # Entity type services ⭐
│   │   │   └── block/                     # Block services ⭐
│   │   ├── repository/                     # JPA repositories
│   │   ├── entity/                         # JPA entities
│   │   ├── models/                         # Domain models (DTOs)
│   │   │   ├── entity/                    # Entity models ⭐
│   │   │   └── block/                     # Block models ⭐
│   │   ├── enums/                          # Enums
│   │   ├── deserializer/                   # Custom JSON deserializers
│   │   ├── exceptions/                     # Custom exceptions
│   │   └── util/                           # Utilities
│   ├── src/main/resources/
│   │   └── application.yml                # Config
│   ├── schema.sql                          # Database schema (568 lines)
│   ├── build.gradle.kts                    # Build config
│   └── AGENTS.md                           # Development guidelines
│
└── client/                                  # Next.js frontend
    ├── app/                                # App Router (file-based routing)
    ├── components/
    │   ├── feature-modules/               # Domain-driven modules
    │   │   ├── entity/                   # Entity system ⭐
    │   │   └── blocks/                   # Block system ⭐
    │   └── ui/                            # shadcn components
    ├── lib/
    │   ├── types/types.ts                # OpenAPI-generated types
    │   └── util/                          # Shared utilities
    ├── package.json                        # Dependencies
    └── CLAUDE.md                           # Frontend architecture guide
```

## 4. Development Commands

### Backend
```bash
./gradlew clean build    # Compile, test, assemble JAR
./gradlew test          # Run JUnit 5 tests only
./gradlew bootRun       # Start dev server (needs Postgres)
```

### Frontend
```bash
npm run dev             # Start Next.js dev server
npm run build          # Production build
npm run types          # Generate types from OpenAPI (http://localhost:8081/docs/v3/api-docs)
npm test               # Run Jest tests
npm run lint           # ESLint
```

### Full Stack
- Backend runs on `http://localhost:8081`
- Frontend runs on `http://localhost:3000`
- Swagger UI: `http://localhost:8081/docs/swagger-ui.html`
- OpenAPI spec: `http://localhost:8081/docs/v3/api-docs`

## 5. Code Conventions

### Backend (Kotlin/Spring Boot)

**Style:**
- JetBrains Kotlin style: 4-space indentation, trailing commas, expression-bodied functions
- PascalCase: classes, Spring components (`EntityTypeService`)
- camelCase: functions, properties
- SCREAMING_SNAKE_CASE: constants in `companion object`
- Package names: lowercase, feature-oriented

**Patterns:**
- Constructor injection (no field injection)
- Nullable semantics over Optional wrappers
- Service layer handles business logic
- Repository layer for data access only
- Controllers are thin delegators

**Testing:**
- Tests in `src/test/kotlin/riven`, suffixed with `Test`
- Use Spring Boot test slices + Mockito
- H2 for JPA tests
- High coverage on service/controller layers

**Commits:**
- Imperative, concise subjects: `Add invoice PDF renderer`
- Group related changes into single commits
- Include body text when context needed

### Frontend (TypeScript/React)

**File Naming:**
- Components: `kebab-case.tsx`
- Utilities: `kebab-case.util.ts`
- Services: `kebab-case.service.ts`
- Hooks: `use-kebab-case.ts`
- Stores: `kebab-case.store.ts`

**Code Naming:**
- Components: `PascalCase`
- Hooks: `use{Name}` prefix
- Props: `{ComponentName}Props`
- Types/Interfaces: `PascalCase`

**Type Safety:**
- ALWAYS use re-exported types from feature `interface/` files
- NEVER import directly from `lib/types/types.ts`
- Use type guards for discriminated unions, not type assertions

**Service Pattern:**
```typescript
export class EntityTypeService {
    static async getEntityTypes(
        session: Session | null,
        organisationId: string
    ): Promise<EntityType[]> {
        validateSession(session);
        validateUuid(organisationId);
        // API call with error handling
    }
}
```

## 6. Key Domain Concepts & Service Layer Logic

### Entity System ⭐ CRITICAL FOR DEVELOPMENT

The entity system is a **mutable schema-driven data modeling layer** allowing orgs to define custom entity types.

#### Service Layer (`/core/src/main/kotlin/riven/core/service/entity/type/`)

**EntityTypeService.kt (19.7KB)** - Core entity type operations:
- `publishEntityType()` - Create new entity type
- `updateEntityTypeConfiguration()` - Update metadata (name, icon, description)
- `saveEntityTypeDefinition()` - Add/update attributes or relationships
- `removeEntityTypeDefinition()` - Remove attributes/relationships with impact analysis
- `deleteEntityType()` - Delete type (with cascade impact analysis)

**EntityRelationshipService.kt (60KB)** - Relationship management:
- **Bidirectional relationship creation/validation** - Every relationship has an inverse
- **Cardinality enforcement** - ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY
- **Inverse relationship synchronization** - When creating relationship A→B, automatically creates B→A
- **Polymorphic relationship support** - Single relationship can target multiple entity types
- **Overlap detection** - Prevents conflicting relationships (e.g., can't have both ONE_TO_ONE and ONE_TO_MANY to same target)
- **Naming collision prevention** - Ensures relationship keys are unique

**EntityTypeRelationshipImpactAnalysisService.kt** - Impact analysis:
- Detects **data loss** when modifying/deleting relationships
- Identifies **affected entities** (count, specific IDs if needed)
- Generates **warnings** for destructive operations
- Analyzes **polymorphic candidates** when changing relationship targets
- Returns `409 Conflict` if impact detected, requiring user confirmation

**EntityAttributeService.kt** - Attribute schema management:
- JSON Schema validation for attribute definitions
- Protected attribute handling (can't delete if used)
- SchemaUUID-based attribute references

**EntityTypeRelationshipDiffService.kt** - Diff computation:
- Compares old vs. new relationship states
- Identifies additions, modifications, deletions
- Used by impact analysis to determine scope

#### Key Entity Models (`/core/src/main/kotlin/riven/core/models/entity/`)

**EntityType** - Mutable schema definition:
```kotlin
data class EntityType(
    val id: UUID,
    val key: String,                    // Unique identifier within org
    val schema: Map<String, Any>,       // JSON Schema with UUID keys
    val relationships: List<EntityRelationshipDefinition>,
    val displayName: String,
    val icon: Icon?,
    val description: String?,
    val columnOrder: List<String>?,
    val version: Long,                  // For schema evolution tracking
    val count: Long                     // Denormalized entity count
)
```

**EntityRelationshipDefinition** - Defines relationships between types:
```kotlin
data class EntityRelationshipDefinition(
    val key: String,                    // Relationship identifier
    val name: String,                   // Display name
    val targetEntityTypes: List<String>, // Can be polymorphic (multiple targets)
    val cardinality: EntityRelationshipCardinality,
    val inverseKey: String?,            // Key of inverse relationship
    val isInverse: Boolean = false      // Whether this is the inverse side
)
```

**Entity** - Instance data:
```kotlin
data class Entity(
    val id: UUID,
    val typeKey: String,
    val typeVersion: Long,              // Schema version at creation
    val payload: Map<String, Any>,      // JSONB validated against schema
    val validationErrors: List<ValidationError>?
)
```

#### Database Schema (PostgreSQL)

**entity_types table:**
- **Mutable pattern** - Single row per type, updated in-place (unlike block_types)
- Unique constraint: `(organisation_id, key)`
- JSONB columns: `schema`, `relationships`, `column_order`
- Denormalized `count` field (updated via triggers)
- `version` column for schema evolution

**entities table:**
- Foreign key to `entity_types` with `ON DELETE RESTRICT` (prevents type deletion if entities exist)
- `type_version` tracks schema version at entity creation
- JSONB `payload` column for flexible attribute storage
- Soft delete via `archived_entities` table

**entity_relationships table:**
- Stores actual relationship data between entity instances
- Links `source_entity_id` to `target_entity_id`
- References relationship definition via `relationship_key`

#### Critical Patterns

**Impact Analysis Flow:**
1. User initiates schema change (modify/delete relationship)
2. Service performs **dry-run analysis** via `analyzeRelationshipModificationImpact()`
3. If impact detected, returns `409 Conflict` with impact details
4. Frontend displays warnings to user
5. User confirms understanding
6. Service applies change with `impactConfirmed=true`

**Relationship Overlap Detection:**
```kotlin
// Example: Can't have both ONE_TO_ONE and ONE_TO_MANY from Client → Project
// EntityRelationshipService checks for:
// 1. Inverse relationship already exists
// 2. Duplicate relationships (same source, target, cardinality)
// 3. Cardinality conflicts (incompatible cardinalities to same target)
```

**Polymorphic Relationships:**
```kotlin
// A "Project" can be related to multiple entity types:
// relationships: [
//   { key: "owner", targetEntityTypes: ["Client", "Partner"], cardinality: MANY_TO_ONE }
// ]
// This creates inverse relationships in both Client and Partner
```

---

### Block System ⭐ CRITICAL FOR DEVELOPMENT

The block system is an **immutable versioned content composition framework** with hierarchical structures.

#### Service Layer (`/core/src/main/kotlin/riven/core/service/block/`)

**BlockService.kt (12.6KB)** - Core block operations:
- `createBlock()` - Create block with schema validation
- Block CRUD operations (get, update, delete)
- Parent-child relationship management
- Nesting validation (respects block type nesting rules)

**BlockTypeService.kt (9.7KB)** - Block type management:
- `publishBlockType()` - Create **immutable** block type
- **Copy-on-write versioning** - Updates create new version with `source_id` link
- Archive management
- System vs. organization block types (system types have `organisation_id IS NULL`)

**BlockEnvironmentService.kt (27.7KB)** - Environment orchestration:
- `saveEnvironment()` - **Batch operations** for block trees
- `hydrateBlocks()` - Resolve references, fetch related data, build tree structures
- **Structural operations:**
  - `ADD` - Add new block to tree
  - `MOVE` - Change parent or reorder
  - `REMOVE` - Delete block (cascade to children)
  - `REORDER` - Update order indices
  - `UPDATE` - Modify block payload
- Validation and integrity checks
- Transaction management

**BlockChildrenService.kt (16.4KB)** - Hierarchy management:
- Parent-child link creation via `block_children` table
- Order index management (maintains child order)
- Cascade removal (deleting parent removes all descendants)
- Tree traversal utilities

**BlockTreeLayoutService.kt** - Grid layout persistence:
- Manages Gridstack layouts bound to entities
- JSONB storage of grid configurations
- Version tracking

**BlockReferenceHydrationService.kt** - Reference resolution:
- Resolves entity references (loads related entities)
- Resolves block references (loads reusable block trees)
- Merges metadata for rendering

**DefaultBlockEnvironmentService.kt** - Default implementation

#### Key Block Models (`/core/src/main/kotlin/riven/core/models/block/`)

**BlockType** - Immutable schema (versioned):
```kotlin
data class BlockType(
    val id: UUID,
    val key: String,                    // Identifier
    val version: Long,                  // Immutable versioning
    val schema: Map<String, Any>,       // JSON Schema (string keys, not UUIDs)
    val nesting: NestingConfiguration?, // Defines allowed child types
    val displayStructure: BlockDisplayStructure?, // Form widgets, rendering hints
    val validationStrictness: ValidationStrictness, // NONE, SOFT, STRICT
    val isSystemType: Boolean,          // System vs. org-scoped
    val sourceId: UUID?                 // Original block type if versioned
)
```

**Block** - Content instance:
```kotlin
data class Block(
    val id: UUID,
    val blockTypeKey: String,
    val blockTypeVersion: Long,
    val payload: BlockPayload,          // Polymorphic (see below)
    val validationErrors: List<ValidationError>?
)
```

**BlockPayload (Polymorphic):**
```kotlin
sealed class BlockPayload {
    // Direct child blocks
    data class BlockContentMetadata(
        val type: BlockMetadataType.CONTENT,
        val listConfig: ListConfiguration?
    )

    // References to entities
    data class EntityReferenceMetadata(
        val type: BlockMetadataType.ENTITY_REFERENCE,
        val entityIds: List<UUID>,
        val fetchPolicy: BlockFetchPolicy
    )

    // References to other blocks (reusable templates)
    data class BlockReferenceMetadata(
        val type: BlockMetadataType.BLOCK_REFERENCE,
        val blockId: UUID
    )
}
```

**BlockEnvironment** - Complete block tree with operations:
```kotlin
data class BlockEnvironment(
    val rootBlockId: UUID,
    val operations: List<BlockOperation>,  // ADD, MOVE, REMOVE, etc.
    val layout: GridStackLayout?
)
```

#### Database Schema (PostgreSQL)

**block_types table:**
- **Immutable pattern** - New version = new row
- Unique constraint: `(organisation_id, key, version)`
- JSONB columns: `schema`, `display_structure`, `nesting`
- `source_id` tracks original type for versioning
- System types: `organisation_id IS NULL`

**blocks table:**
- Foreign key to `block_types`
- JSONB `payload` (polymorphic: content, entity refs, block refs)
- Soft delete via `archived` flag

**block_children table:**
- Parent-child relationships
- Unique constraint on `child_id` (block can have only one parent)
- `order_index` for maintaining child order
- Cascade delete on parent removal

**block_tree_layouts table:**
- Stores Gridstack layouts bound to entities
- JSONB `layout` column
- Foreign key to `entities` table

#### Critical Patterns

**Immutable Versioning:**
```kotlin
// To "update" a BlockType:
// 1. Create new row with version++
// 2. Set source_id to original BlockType.id
// 3. Existing blocks continue using old version
// 4. New blocks use latest version
// This preserves historical data integrity
```

**Environment Save Flow:**
```kotlin
// BlockEnvironmentService.saveEnvironment():
// 1. Validate all operations (nesting, references, etc.)
// 2. Start transaction
// 3. Execute operations in order (ADD, MOVE, REMOVE, UPDATE, REORDER)
// 4. Update block_children links
// 5. Save layout if provided
// 6. Commit transaction
// 7. Return SaveEnvironmentResponse with updated tree
```

**Block Hydration:**
```kotlin
// BlockEnvironmentService.hydrateBlocks():
// 1. Fetch root block + all descendants
// 2. For EntityReferenceMetadata blocks:
//    - Fetch referenced entities
//    - Merge entity data into block payload
// 3. For BlockReferenceMetadata blocks:
//    - Fetch referenced block tree
//    - Merge block tree into current tree
// 4. Build hierarchical tree structure
// 5. Return BlockTree with all data resolved
```

**Nesting Validation:**
```kotlin
// BlockType.nesting defines allowed child types:
// nesting: {
//   allowedChildren: ["text_block", "image_block"],
//   maxDepth: 3,
//   maxChildren: 10
// }
// BlockService validates before creating parent-child links
```

---

### Frontend Patterns (Entity & Block Modules)

**Feature Module Structure:**
```
feature-modules/entity/
├── components/forms/type/           # EntityTypeForm, RelationshipForm, SchemaForm
├── hooks/
│   ├── form/                       # use-entity-form, use-relationship-form
│   ├── mutation/                   # TanStack mutations (save, delete, etc.)
│   └── query/                      # TanStack queries (fetch types, entities)
├── service/EntityTypeService.ts    # Static class with API calls
├── interface/                      # Re-exported OpenAPI types
└── stores/                         # Zustand stores (form state, drafts)
```

**Critical Frontend Patterns:**

**Auto-save with Draft Management:**
```typescript
// 1-second debounced auto-save to localStorage
useEffect(() => {
    const subscription = form.watch((values) => {
        const timeoutId = setTimeout(() => {
            const storageKey = `entity-type-draft-${organisationId}-${entityTypeKey}`;
            localStorage.setItem(storageKey, JSON.stringify({
                values,
                timestamp: Date.now()
            }));
        }, 1000);
        return () => clearTimeout(timeoutId);
    });
    return () => subscription.unsubscribe();
}, [form]);
```

**Impact Confirmation Flow:**
```typescript
// When backend returns 409 with impact analysis:
const mutation = useSaveDefinitionMutation(organisationId, {
    onError: (error) => {
        if (error.status === 409) {
            // Show impact dialog with warnings
            showImpactDialog(error.impactAnalysis);
        }
    }
});

// User confirms, retry with impactConfirmed=true:
mutation.mutate({ ...definition, impactConfirmed: true });
```

**Portal-Based Block Rendering:**
```typescript
// Blocks render into Gridstack containers via portals
const container = getWidgetContainer(widgetId);
createPortal(
    <BlockComponent data={blockData} />,
    container
);
```

## 7. Development Gotchas

### Backend
1. **Mutable vs. Immutable** - EntityTypes are mutable (updated in-place), BlockTypes are immutable (copy-on-write)
2. **Impact analysis required** - Always analyze impact before destructive entity schema changes
3. **Bidirectional relationships** - Creating relationship A→B automatically creates B→A inverse
4. **Foreign key constraints** - Can't delete entity type if entities exist (`ON DELETE RESTRICT`)
5. **Schema validation** - Entity payload validated against JSON Schema; block payload validated against BlockType schema
6. **Transaction boundaries** - BlockEnvironmentService.saveEnvironment() is transactional; failure rolls back all operations
7. **Polymorphic relationships** - A single relationship can target multiple entity types
8. **Denormalized counts** - entity_types.count updated via database triggers

### Frontend
1. **Never import from lib/types directly** - Always use re-exported types from feature interfaces
2. **Auto-save is 1 second debounced** - Don't add additional debouncing
3. **Draft storage keys must be unique** - Include both organisationId and entity key
4. **Impact confirmation required** - Schema changes need `impactConfirmed=true` after showing impact
5. **Portal rendering requires containers** - Gridstack must be initialized before rendering widgets
6. **Store factories are per-instance** - Never reuse store instances across entities
7. **Session validation is critical** - Always call `validateSession()` before API calls
8. **Type guards over assertions** - Use type guard functions, not `as` casts
9. **OpenAPI types regenerate** - Run `npm run types` after backend schema changes
10. **Client components need directive** - Add `"use client"` when using hooks/browser APIs

### Multi-Tenancy
1. **Row-level security (RLS)** - PostgreSQL enforces organization-scoped data access
2. **Organisation context required** - All major operations need organisationId
3. **System vs. org resources** - System block types have `organisation_id IS NULL`

## 8. Common Tasks

### Add New Entity Attribute
1. User edits entity type via `SchemaForm` component
2. Form validates via Zod + auto-saves to localStorage
3. Submit calls `EntityTypeService.saveEntityTypeDefinition()`
4. Backend validates JSON Schema
5. Impact analysis runs (checks if attribute deletion affects existing entities)
6. If impact detected, returns 409 with warnings
7. Frontend shows impact dialog, user confirms
8. Retry with `impactConfirmed=true`
9. Backend updates `entity_types.schema` JSONB column
10. TanStack Query cache updated, UI reflects changes

### Add New Relationship Between Entity Types
1. User opens `RelationshipForm` in entity type configuration
2. Select target entity type(s), cardinality, and relationship name
3. Submit calls `EntityRelationshipService.saveEntityTypeDefinition()`
4. Backend checks for overlaps (conflicts with existing relationships)
5. If overlap detected, returns validation error
6. If valid, creates bidirectional relationship:
   - Adds relationship to source entity type
   - Adds inverse relationship to target entity type(s)
7. Updates `entity_types.relationships` JSONB for both types
8. Returns updated entity types to frontend
9. TanStack Query cache updates both types

### Create Block Tree with Nested Children
1. User drags block types from palette to Gridstack grid
2. Each drop triggers `BlockEnvironmentService.saveEnvironment()` with `ADD` operation
3. Backend validates nesting (checks `BlockType.nesting.allowedChildren`)
4. Creates `block` row in database
5. Creates `block_children` link to parent (if not root)
6. Returns updated tree structure
7. Frontend re-renders grid with new block

### Hydrate Block Tree with Entity References
1. Block contains `EntityReferenceMetadata` payload
2. Frontend calls `BlockEnvironmentService.hydrateBlocks()`
3. Backend:
   - Fetches block tree (root + all descendants)
   - For each `EntityReferenceMetadata` block, fetches referenced entities
   - Merges entity data into block payload
   - Builds hierarchical tree structure
4. Returns fully hydrated `BlockTree`
5. Frontend renders blocks with entity data

## 9. Critical Files Reference

### Entity System (Backend)
- `/core/src/main/kotlin/riven/core/service/entity/type/EntityRelationshipService.kt` (60KB)
- `/core/src/main/kotlin/riven/core/service/entity/type/EntityTypeService.kt` (19.7KB)
- `/core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipImpactAnalysisService.kt`
- `/core/src/main/kotlin/riven/core/models/entity/EntityType.kt`
- `/core/src/main/kotlin/riven/core/models/entity/relationship/analysis/`

### Block System (Backend)
- `/core/src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt` (27.7KB)
- `/core/src/main/kotlin/riven/core/service/block/BlockService.kt` (12.6KB)
- `/core/src/main/kotlin/riven/core/service/block/BlockTypeService.kt` (9.7KB)
- `/core/src/main/kotlin/riven/core/models/block/Block.kt`
- `/core/src/main/kotlin/riven/core/models/block/tree/`

### Entity System (Frontend)
- `/client/components/feature-modules/entity/hooks/form/use-relationship-form.ts`
- `/client/components/feature-modules/entity/hooks/mutation/`
- `/client/components/feature-modules/entity/service/EntityTypeService.ts`

### Block System (Frontend)
- `/client/components/feature-modules/blocks/components/block-builder/`
- `/client/components/feature-modules/blocks/components/block-renderer/`
- `/client/components/feature-modules/blocks/hooks/util/`

### Database Schema
- `/core/schema.sql` (568 lines - authoritative source of truth)

## Maintenance

When making significant changes, update this file:
- **New dependencies** → Update Tech Stack section
- **Architectural shifts** → Update Architecture section
- **New conventions** → Update Code Conventions section
- **Domain changes** → Update Key Domain Concepts section
- **New gotchas** → Add to Development Gotchas section

Keep this file accurate and concise - it's the primary reference for AI assistants working on this codebase.
