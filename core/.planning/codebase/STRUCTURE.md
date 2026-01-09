# Codebase Structure

**Analysis Date:** 2026-01-09

## Directory Layout

```
riven/
├── core/                                    # Spring Boot backend
│   ├── src/main/kotlin/riven/core/
│   │   ├── CoreApplication.kt              # Entry point
│   │   ├── controller/                     # REST API endpoints (7 files)
│   │   ├── service/                        # Business logic (22 services)
│   │   ├── repository/                     # JPA repositories (13+ interfaces)
│   │   ├── entity/                         # JPA entity mappings (30+ files)
│   │   ├── models/                         # Domain models/DTOs (100+ files)
│   │   ├── configuration/                  # Spring configuration (13 files)
│   │   ├── enums/                          # Application enums (40+ files)
│   │   ├── deserializer/                   # Custom JSON deserializers (8 files)
│   │   ├── exceptions/                     # Custom exceptions
│   │   └── util/                           # Utilities
│   ├── src/main/resources/
│   │   └── application.yml                # Spring Boot configuration
│   ├── src/test/kotlin/riven/core/        # Unit & integration tests
│   ├── db/schema/                          # Organized database schema
│   ├── schema.sql                          # Consolidated schema (568 lines)
│   ├── build.gradle.kts                    # Gradle build configuration
│   └── CLAUDE.md                           # Backend development reference
│
└── client/                                  # Next.js frontend
    ├── app/                                # App Router (file-based routing)
    ├── components/
    │   ├── feature-modules/               # Domain-driven modules
    │   │   ├── entity/                   # Entity system
    │   │   ├── blocks/                   # Block system
    │   │   └── workspace/                # Workspace management
    │   └── ui/                            # shadcn components (70+)
    ├── lib/
    │   ├── types/types.ts                # OpenAPI-generated types
    │   └── util/                          # Shared utilities
    ├── package.json                        # Dependencies
    └── jest.config.ts                      # Test configuration
```

## Directory Purposes

**core/src/main/kotlin/riven/core/controller/**
- Purpose: REST API endpoints, HTTP request handlers
- Contains: `@RestController` classes, `@RequestMapping` annotations
- Key files:
  - `entity/EntityTypeController.kt` - Entity type schema operations
  - `entity/EntityController.kt` - Entity instance CRUD
  - `block/BlockEnvironmentController.kt` - Block tree operations
  - `block/BlockTypeController.kt` - Block type versioning
  - `workspace/WorkspaceController.kt` - Workspace management
- Subdirectories: entity/, block/, workspace/, user/

**core/src/main/kotlin/riven/core/service/**
- Purpose: Business logic, orchestration, validation
- Contains: `@Service` classes with complex domain logic
- Key files:
  - `entity/type/EntityTypeRelationshipService.kt` (1,372 lines) - Bidirectional relationships
  - `block/BlockEnvironmentService.kt` (674 lines) - Block tree orchestration
  - `entity/type/EntityTypeService.kt` (492 lines) - Entity type management
  - `schema/SchemaService.kt` (368 lines) - JSON Schema validation
- Subdirectories: entity/, entity/type/, block/, schema/, auth/, activity/, workspace/, user/, storage/, workflow/

**core/src/main/kotlin/riven/core/repository/**
- Purpose: JPA data access, Spring Data repositories
- Contains: Interfaces extending `JpaRepository<T, ID>`
- Key files:
  - `entity/EntityTypeRepository.kt`, `entity/EntityRepository.kt`, `entity/EntityRelationshipRepository.kt`
  - `block/BlockTypeRepository.kt`, `block/BlockRepository.kt`, `block/BlockChildrenRepository.kt`
  - `workspace/WorkspaceRepository.kt`, `workspace/WorkspaceMemberRepository.kt`
- Subdirectories: entity/, block/, workspace/, user/, activity/

**core/src/main/kotlin/riven/core/entity/**
- Purpose: JPA entity mappings (database tables)
- Contains: `@Entity` classes with `@Table`, `@Column` annotations
- Key files:
  - `entity/EntityTypeEntity.kt`, `entity/EntityEntity.kt`, `entity/EntityRelationshipEntity.kt`
  - `block/BlockTypeEntity.kt`, `block/BlockEntity.kt`, `block/BlockChildEntity.kt`
  - `workspace/WorkspaceEntity.kt`, `workspace/WorkspaceMemberEntity.kt`
- Subdirectories: entity/, block/, workspace/, user/, activity/, workflow/, util/

**core/src/main/kotlin/riven/core/models/**
- Purpose: Rich domain models (DTOs) returned by services
- Contains: Data classes representing business concepts (100+ files)
- Key files:
  - `entity/Entity.kt`, `entity/EntityType.kt`, `entity/EntityRelationship.kt`
  - `block/Block.kt`, `block/BlockType.kt`, `block/BlockEnvironment.kt`
  - `block/metadata/` - Polymorphic block payloads (8 files)
  - `entity/relationship/analysis/` - Impact analysis models (6+ files)
- Subdirectories: entity/, block/, request/, response/, common/, activity/, user/, workflow/

**core/src/main/kotlin/riven/core/configuration/**
- Purpose: Spring configuration beans
- Contains: `@Configuration` classes for security, storage, workflow, audit
- Key files:
  - `auth/SecurityConfig.kt` - JWT and OAuth2 setup
  - `storage/SupabaseConfiguration.kt` - Supabase client configuration
  - `workflow/TemporalEngineConfiguration.kt` - Temporal workflow engine
  - `audit/AuditConfig.kt` - JPA audit configuration
- Subdirectories: auth/, storage/, workflow/, audit/, properties/, util/

**core/src/main/kotlin/riven/core/enums/**
- Purpose: Application-wide enums
- Contains: 40+ enum files
- Key files:
  - `entity/EntityRelationshipCardinality.kt` (ONE_TO_ONE, ONE_TO_MANY, etc.)
  - `entity/EntityTypeRelationshipType.kt` (ORIGIN, REFERENCE)
  - `block/request/BlockOperationType.kt` (ADD, MOVE, REMOVE, UPDATE, REORDER)
  - `common/icon/IconType.kt` (1,670 lines - 700+ icon types)
- Subdirectories: entity/, block/, activity/, workspace/, core/, workflow/, client/, common/

**client/components/feature-modules/**
- Purpose: Domain-driven feature modules
- Contains: Entity system, block system, workspace management
- Key directories:
  - `entity/` - Entity type forms, relationship forms, schema forms
  - `blocks/` - Block builder, block renderer, block tree operations
  - `workspace/` - Workspace UI, member management
- Subdirectories: components/, hooks/, service/, interface/, stores/

**client/components/ui/**
- Purpose: Reusable UI components (shadcn/ui)
- Contains: 70+ components from Radix UI + shadcn
- Key files:
  - `card.tsx`, `button.tsx`, `input.tsx`, `form.tsx`, `dialog.tsx`, `dropdown-menu.tsx`
- Subdirectories: data-table/, forms/, layouts/, navigation/, feedback/

**client/lib/**
- Purpose: Shared utilities and types
- Contains: OpenAPI-generated types, validation utilities, service utilities
- Key files:
  - `types/types.ts` - OpenAPI-generated types from backend
  - `util/supabase/client.ts` - Supabase client initialization
  - `util/service.util.ts` - Shared service utilities (session validation, UUID validation)
- Subdirectories: types/, util/

**core/db/schema/**
- Purpose: Organized database schema by category
- Contains: SQL files organized by type
- Subdirectories:
  - `00_extensions/` - PostgreSQL extensions
  - `01_tables/` - Table definitions
  - `02_indexes/` - Index definitions
  - `03_functions/` - PL/pgSQL functions
  - `04_constraints/` - Constraints (FK, unique, check)
  - `05_rls/` - Row-Level Security policies
  - `06_types/` - Custom types
  - `07_views/` - Database views
  - `08_triggers/` - Database triggers
  - `09_grants/` - Permission grants

## Key File Locations

**Entry Points:**
- `core/src/main/kotlin/riven/core/CoreApplication.kt` - Backend entry point
- `client/app/layout.tsx` - Frontend root layout
- `client/app/page.tsx` - Frontend home page

**Configuration:**
- `core/src/main/resources/application.yml` - Spring Boot configuration
- `core/build.gradle.kts` - Gradle build configuration
- `client/tsconfig.json` - TypeScript configuration
- `client/next.config.ts` - Next.js configuration
- `client/jest.config.ts` - Jest test configuration
- `core/.env` - Backend environment variables (gitignored)
- `client/.env` - Frontend environment variables (gitignored)

**Core Logic:**
- `core/src/main/kotlin/riven/core/service/entity/type/` - Entity type services
- `core/src/main/kotlin/riven/core/service/block/` - Block services
- `client/components/feature-modules/entity/` - Entity UI
- `client/components/feature-modules/blocks/` - Block UI

**Testing:**
- `core/src/test/kotlin/riven/core/` - Backend unit & integration tests
- `client/components/feature-modules/*/__tests__/` - Frontend component tests

**Documentation:**
- `core/CLAUDE.md` - Backend development reference (39 KB)
- `core/AGENTS.md` - Agent development guidelines
- `core/schema.sql` - Consolidated database schema (568 lines)

## Naming Conventions

**Files (Backend):**
- PascalCase.kt for classes: `EntityTypeService.kt`, `BlockEnvironmentService.kt`
- Suffix conventions: `*Service.kt`, `*Controller.kt`, `*Repository.kt`, `*Entity.kt`, `*Test.kt`

**Files (Frontend):**
- kebab-case.tsx for components: `entity-type-form.tsx`, `block-builder.tsx`
- kebab-case.ts for utilities: `service.util.ts`, `validation.util.ts`
- use-kebab-case.ts for hooks: `use-entity-form.ts`, `use-block-deletion-guard.ts`
- kebab-case.service.ts for services: `entity-type.service.ts`, `block.service.ts`
- kebab-case.store.ts for stores: `data-table.store.ts`
- kebab-case.interface.ts for type definitions: `block.interface.ts`, `entity.interface.ts`

**Directories:**
- lowercase with hyphens: `entity-type/`, `block-environment/`, `feature-modules/`
- Feature-oriented: entity/, blocks/, workspace/
- Layered organization: service/, repository/, entity/, models/

**Special Patterns:**
- `index.ts` - Barrel exports for public API
- `*.test.tsx` - Co-located test files
- `__tests__/` - Test directories

## Where to Add New Code

**New Entity Type Feature:**
- Primary code: `core/src/main/kotlin/riven/core/service/entity/type/`
- Models: `core/src/main/kotlin/riven/core/models/entity/`
- Tests: `core/src/test/kotlin/riven/core/service/entity/type/`
- Frontend: `client/components/feature-modules/entity/`

**New Block Feature:**
- Primary code: `core/src/main/kotlin/riven/core/service/block/`
- Models: `core/src/main/kotlin/riven/core/models/block/`
- Tests: `core/src/test/kotlin/riven/core/service/block/`
- Frontend: `client/components/feature-modules/blocks/`

**New REST Endpoint:**
- Controller: `core/src/main/kotlin/riven/core/controller/{feature}/`
- Service: `core/src/main/kotlin/riven/core/service/{feature}/`
- Tests: `core/src/test/kotlin/riven/core/controller/{feature}/`

**New UI Component:**
- Reusable: `client/components/ui/`
- Feature-specific: `client/components/feature-modules/{feature}/components/`
- Tests: `client/components/feature-modules/{feature}/__tests__/` or co-located `*.test.tsx`

**Utilities:**
- Backend: `core/src/main/kotlin/riven/core/util/`
- Frontend: `client/lib/util/`
- Type definitions: `client/lib/types/` or `client/components/feature-modules/{feature}/interface/`

## Special Directories

**core/db/schema/**
- Purpose: Organized database schema (replaces monolithic schema.sql for new changes)
- Source: Manual SQL files organized by type
- Committed: Yes (source of truth)

**core/schema.sql**
- Purpose: Consolidated schema for reference
- Source: Combined from db/schema/ files
- Committed: Yes (legacy format)

**client/node_modules/**
- Purpose: Frontend dependencies
- Source: npm install
- Committed: No (in .gitignore)

**core/.gradle/**
- Purpose: Gradle cache and build artifacts
- Source: Gradle build process
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-01-09*
*Update when directory structure changes*
