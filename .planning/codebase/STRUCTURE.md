# Codebase Structure

**Analysis Date:** 2026-01-18

## Directory Layout

```
riven/
├── client/                     # Next.js frontend application
│   ├── app/                    # App Router (file-based routing)
│   ├── components/             # React components
│   │   ├── feature-modules/    # Domain-driven feature modules
│   │   ├── ui/                 # shadcn/ui base components
│   │   └── provider/           # Context providers
│   ├── hooks/                  # Global custom hooks
│   ├── lib/                    # Shared utilities and types
│   └── stores/                 # Global Zustand stores
├── core/                       # Spring Boot backend (Kotlin)
│   ├── src/main/kotlin/riven/core/
│   │   ├── configuration/      # Spring config beans
│   │   ├── controller/         # REST API endpoints
│   │   ├── deserializer/       # Custom JSON deserializers
│   │   ├── entity/             # JPA entities
│   │   ├── enums/              # Application enums
│   │   ├── exceptions/         # Custom exceptions
│   │   ├── models/             # Domain models/DTOs
│   │   ├── projection/         # JPA projections
│   │   ├── repository/         # Spring Data repositories
│   │   ├── service/            # Business logic services
│   │   └── util/               # Utilities
│   ├── src/test/               # Test sources
│   └── db/schema/              # PostgreSQL DDL scripts
├── db/                         # Database migration scripts
├── landing/                    # Marketing landing page (Next.js)
└── .planning/                  # Planning documents
```

## Directory Purposes

**client/app/:**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components, layouts, route handlers
- Key files: `layout.tsx` (root), `page.tsx` (pages), `route.ts` (API)

**client/components/feature-modules/:**
- Purpose: Domain-driven feature modules (blocks, entity, authentication, etc.)
- Contains: Each module has: `components/`, `hooks/`, `interface/`, `service/`, `util/`, `context/`, `stores/`
- Key files: Module-specific components, services, and hooks

**client/components/ui/:**
- Purpose: Reusable shadcn/ui base components
- Contains: 70+ Radix-based UI primitives
- Key files: `button.tsx`, `dialog.tsx`, `form.tsx`, `table.tsx`

**client/lib/types/:**
- Purpose: OpenAPI-generated TypeScript types
- Contains: `types.ts` generated from backend OpenAPI spec
- Key files: `types.ts` (auto-generated, do not edit manually)

**core/src/main/kotlin/riven/core/configuration/:**
- Purpose: Spring configuration beans and properties
- Contains: Security, audit, storage, workflow configurations
- Key files: `SecurityConfig.kt`, `SupabaseConfiguration.kt`, `ObjectMapperConfig.kt`

**core/src/main/kotlin/riven/core/controller/:**
- Purpose: REST API endpoints organized by domain
- Contains: Controllers for entity, block, workspace, workflow, user
- Key files: `EntityTypeController.kt`, `EntityController.kt`, `BlockEnvironmentController.kt`

**core/src/main/kotlin/riven/core/service/:**
- Purpose: Business logic and orchestration
- Contains: 31 services organized by domain
- Key files: `EntityTypeService.kt`, `EntityTypeRelationshipService.kt`, `BlockEnvironmentService.kt`

**core/src/main/kotlin/riven/core/entity/:**
- Purpose: JPA entities mapping to database tables
- Contains: Entity classes with Hibernate annotations
- Key files: `EntityTypeEntity.kt`, `BlockEntity.kt`, `WorkflowNodeEntity.kt`

**core/src/main/kotlin/riven/core/models/:**
- Purpose: Domain models, DTOs, request/response types
- Contains: Data classes, sealed interfaces for polymorphism
- Key files: `EntityType.kt`, `Block.kt`, `Metadata.kt`, `Node.kt`

**core/src/main/kotlin/riven/core/repository/:**
- Purpose: Spring Data JPA repositories
- Contains: Interfaces extending `JpaRepository`
- Key files: `EntityTypeRepository.kt`, `BlockRepository.kt`, `WorkflowNodeRepository.kt`

**core/db/schema/:**
- Purpose: PostgreSQL DDL organized by category
- Contains: Extensions, tables, indexes, functions, constraints, RLS, triggers, grants
- Key files: `01_tables/*.sql`, `05_rls/*.sql`

## Key File Locations

**Entry Points:**
- `core/src/main/kotlin/riven/core/CoreApplication.kt`: Spring Boot main class
- `client/app/layout.tsx`: Next.js root layout
- `client/app/page.tsx`: Next.js home page

**Configuration:**
- `core/build.gradle.kts`: Gradle build configuration
- `core/src/main/resources/application.yml`: Spring Boot config (referenced, not in repo)
- `client/package.json`: npm dependencies and scripts
- `client/tsconfig.json`: TypeScript configuration

**Core Logic:**
- `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeService.kt`: Entity type lifecycle (493 lines)
- `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt`: Bidirectional relationships (1373 lines)
- `core/src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt`: Block operations orchestration (675 lines)
- `core/src/main/kotlin/riven/core/service/workflow/engine/WorkflowOrchestrationService.kt`: Temporal workflow

**Testing:**
- `core/src/test/kotlin/riven/`: Backend tests (JUnit 5 + Mockito)
- `client/test/`: Frontend tests (Jest + Testing Library)

**Database Schema:**
- `core/schema.sql`: Full PostgreSQL DDL (568 lines)
- `core/db/schema/`: Organized migration scripts

## Naming Conventions

**Files:**
- Kotlin: `PascalCase.kt` (e.g., `EntityTypeService.kt`, `BlockEntity.kt`)
- TypeScript Components: `kebab-case.tsx` (e.g., `entity-type-header.tsx`)
- TypeScript Services: `kebab-case.service.ts` (e.g., `entity-type.service.ts`)
- TypeScript Hooks: `use-kebab-case.ts` (e.g., `use-entity-type.ts`)
- TypeScript Stores: `kebab-case.store.ts` (e.g., `entity-type-config.store.ts`)

**Directories:**
- Kotlin: lowercase single word (e.g., `entity/`, `block/`, `workflow/`)
- TypeScript: kebab-case (e.g., `feature-modules/`, `entity-type/`)

**Classes/Types:**
- Kotlin: PascalCase (e.g., `EntityTypeService`, `BlockEnvironment`)
- TypeScript: PascalCase (e.g., `EntityType`, `BlockMetadata`)

**Functions:**
- Kotlin: camelCase (e.g., `publishEntityType`, `saveBlockEnvironment`)
- TypeScript: camelCase (e.g., `fetchEntityTypes`, `handleSubmit`)

## Where to Add New Code

**New Backend Feature:**
- Controllers: `core/src/main/kotlin/riven/core/controller/{domain}/`
- Services: `core/src/main/kotlin/riven/core/service/{domain}/`
- Repositories: `core/src/main/kotlin/riven/core/repository/{domain}/`
- Entities: `core/src/main/kotlin/riven/core/entity/{domain}/`
- Models: `core/src/main/kotlin/riven/core/models/{domain}/`
- Tests: `core/src/test/kotlin/riven/core/service/{domain}/`

**New Frontend Feature:**
- Feature module: `client/components/feature-modules/{feature-name}/`
  - Components: `{feature-name}/components/`
  - Hooks: `{feature-name}/hooks/` (with `query/`, `mutation/`, `form/` subdirs)
  - Service: `{feature-name}/service/{feature-name}.service.ts`
  - Interface: `{feature-name}/interface/{feature-name}.interface.ts`
  - Store: `{feature-name}/stores/{feature-name}.store.ts`

**New Page:**
- Page: `client/app/{route}/page.tsx`
- Layout: `client/app/{route}/layout.tsx`
- Dynamic: `client/app/{route}/[param]/page.tsx`

**New API Route:**
- Route handler: `client/app/api/{path}/route.ts`

**New Utility:**
- Backend: `core/src/main/kotlin/riven/core/util/`
- Frontend shared: `client/lib/util/`
- Frontend feature-specific: `client/components/feature-modules/{feature}/util/`

**New UI Component:**
- Shared: `client/components/ui/` (follow shadcn pattern)
- Feature-specific: `client/components/feature-modules/{feature}/components/`

## Special Directories

**core/db/schema/:**
- Purpose: PostgreSQL DDL organized numerically (00_extensions, 01_tables, etc.)
- Generated: No
- Committed: Yes

**core/build/:**
- Purpose: Gradle build outputs
- Generated: Yes
- Committed: No (.gitignore)

**client/node_modules/:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No (.gitignore)

**client/lib/types/:**
- Purpose: OpenAPI-generated TypeScript types
- Generated: Yes (via `npm run types`)
- Committed: Yes

**.planning/:**
- Purpose: Architecture and planning documents
- Generated: No
- Committed: Yes

**core/.planning/:**
- Purpose: Core-specific planning (phases, codebase docs)
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-01-18*
