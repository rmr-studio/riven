# Architecture

**Analysis Date:** 2026-01-09

## Pattern Overview

**Overall:** Layered Monolithic Backend + Modern React SPA Frontend

**Key Characteristics:**
- Multi-tenant SaaS platform with workspace-level isolation
- Traditional layered architecture (Controller → Service → Repository → Entity)
- Domain-Driven Design with rich domain models
- JWT-based authentication via Supabase OAuth2
- PostgreSQL with Row-Level Security (RLS) for multi-tenancy
- Mutable entity types, immutable block types (versioning pattern)

## Layers

**API/Controller Layer (Backend):**
- Purpose: HTTP request handlers, input validation, security checks
- Contains: REST controllers with `@RestController`, `@RequestMapping`
- Location: `core/src/main/kotlin/riven/core/controller/`
- Depends on: Service layer for business logic
- Used by: Frontend HTTP clients, external API consumers
- Pattern: Thin controllers delegate to services, annotated with `@PreAuthorize` for workspace security

**Service Layer (Backend):**
- Purpose: Business logic, orchestration, validation, transactional boundaries
- Contains: 22 service classes with complex domain logic
- Location: `core/src/main/kotlin/riven/core/service/`
- Depends on: Repository layer for data access
- Used by: Controller layer
- Key Services:
  - `EntityTypeRelationshipService` (1,372 lines) - Bidirectional relationship orchestration
  - `BlockEnvironmentService` (674 lines) - Block tree batch operations
  - `EntityTypeService` - Mutable schema management
  - `SchemaService` - JSON Schema validation
- Pattern: Constructor injection, `@Transactional` boundaries, `@Service` stereotype

**Repository Layer (Backend):**
- Purpose: Data access, JPA query methods
- Contains: Spring Data JPA repositories extending `JpaRepository<T, ID>`
- Location: `core/src/main/kotlin/riven/core/repository/`
- Depends on: JPA entity layer
- Used by: Service layer
- Pattern: Interface-based repositories with custom JPQL queries

**Entity Layer (Backend):**
- Purpose: Database table mappings
- Contains: JPA entities with `@Entity`, `@Table` annotations
- Location: `core/src/main/kotlin/riven/core/entity/`
- Depends on: PostgreSQL database
- Used by: Repository layer
- Pattern: JSONB type mapping via Hypersistence Utils, audit fields (createdAt, updatedAt, createdBy, updatedBy)

**Domain Models/DTOs (Backend):**
- Purpose: Rich domain objects returned by services
- Contains: Data classes representing business concepts (100+ files)
- Location: `core/src/main/kotlin/riven/core/models/`
- Depends on: Nothing (pure data structures)
- Used by: Service layer and controllers
- Pattern: Immutable data classes, sealed classes for polymorphism

**Component Layer (Frontend):**
- Purpose: UI components, feature modules
- Contains: React components, hooks, context providers
- Location: `client/components/feature-modules/`
- Depends on: Service layer (API clients), UI components
- Used by: Next.js pages/layouts
- Pattern: Feature-driven modules (entity/, blocks/, workspace/)

**Service Layer (Frontend):**
- Purpose: API client methods
- Contains: Static service classes with async methods
- Location: `client/components/feature-modules/{feature}/service/`
- Depends on: Backend REST API, Supabase client
- Used by: React hooks (mutations, queries)
- Pattern: Static classes with `static async` methods, session validation, UUID validation

## Data Flow

**Backend Request Lifecycle (Entity Type Creation):**

1. HTTP POST `/api/v1/entity/schema/workspace/{workspaceId}`
2. `EntityTypeController.createEntityType()` - Validates request, checks workspace access
3. `EntityTypeService.publishEntityType()` - Business logic, creates entity type with default schema
4. `EntityTypeRepository.save()` - Persists entity type to database
5. Database INSERT into `entity_types` table (JSONB columns: schema, relationships)
6. Trigger fires: Updates workspace entity count
7. Convert `EntityTypeEntity` → `EntityType` domain model
8. HTTP 201 Created with entity type JSON

**Frontend State Management:**
- TanStack Query (React Query) - Server state (caching, refetching, optimistic updates)
- Zustand - Client state (UI state, drafts, form state)
- React Hook Form - Form state (validation, submission)
- Pattern: Service methods called by TanStack Query mutations/queries

**Block Environment Save Flow (Multi-Operation Batch):**

1. HTTP PUT `/api/v1/block/environment` with operations: [ADD, MOVE, REMOVE, REORDER, UPDATE]
2. `BlockEnvironmentController.saveBlockEnvironment()`
3. `BlockEnvironmentService.saveBlockEnvironment()`:
   - Validate version conflict
   - Normalize operations (deduplication)
   - For each operation type:
     - Validate nesting constraints
     - Create/update BlockEntity
     - Manage block_children links
4. Start `@Transactional` boundary
5. `BlockRepository.save()`, `BlockChildrenRepository.save()`, `BlockTreeLayoutService.updateLayoutSnapshot()`
6. Commit transaction
7. Hydrate blocks (if needed): Fetch entity references, fetch block references, build hierarchical tree
8. HTTP 200 SaveEnvironmentResponse with updated tree

**State Management:**
- Backend: No persistent in-memory state, stateless services
- Frontend: TanStack Query cache + Zustand stores
- Database: PostgreSQL with transactional consistency

## Key Abstractions

**Sealed Classes (Polymorphism):**
- Purpose: Discriminated unions for type-safe polymorphism
- Examples:
  - `Metadata` (BlockContentMetadata, EntityReferenceMetadata, BlockReferenceMetadata)
  - `BlockOperation` (ADD, MOVE, REMOVE, UPDATE, REORDER)
  - `Node` (ContentNode, ReferenceNode)
- Pattern: Sealed interface/class with concrete implementations, custom Jackson deserializers
- Location: `core/src/main/kotlin/riven/core/models/block/metadata/`, `core/src/main/kotlin/riven/core/deserializer/`

**Generic Schema Model:**
- Purpose: Parameterized schema supporting UUID keys (entities) and String keys (blocks)
- Examples:
  - `EntityTypeSchema = Schema<UUID>` - Entity type schemas
  - `BlockTypeSchema = Schema<String>` - Block type schemas
- Pattern: Generic data class with type parameter for key type
- Location: `core/src/main/kotlin/riven/core/models/common/validation/Schema.kt`

**Service Pattern (Frontend):**
- Purpose: API client methods with validation
- Examples: `EntityTypeService`, `BlockTypeService`, `EntityService`
- Pattern: Static class with `static async` methods, session validation, error handling
- Location: `client/components/feature-modules/{feature}/service/*.service.ts`

## Entry Points

**Backend Entry:**
- Location: `core/src/main/kotlin/riven/core/CoreApplication.kt`
- Triggers: `./gradlew bootRun` or `java -jar core.jar`
- Responsibilities: Spring Boot application initialization, component scanning
- Port: `${SERVER_PORT}` (8081 default)

**Frontend Entry:**
- Location: `client/app/layout.tsx` (App Router root layout)
- Triggers: `npm run dev` or Next.js server
- Responsibilities: Root React component, providers, global styles
- Port: 3000 (Next.js default)

**API Documentation:**
- Swagger UI: `http://localhost:8081/docs/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8081/docs/v3/api-docs`
- Responsibilities: Interactive API documentation, schema browsing

## Error Handling

**Strategy (Backend):** Throw exceptions, catch at controller level (Spring exception handlers)

**Patterns:**
- `SchemaValidationException` - Schema validation failures
- `AccessDeniedException` - Authorization failures
- `NotFoundException` - Missing entities
- `IllegalArgumentException` - Invalid input
- `IllegalStateException` - Constraint violations
- Spring `@ControllerAdvice` - Global exception handling

**Strategy (Frontend):** Try-catch in service methods, error propagation via TanStack Query

**Patterns:**
- Service methods throw errors with descriptive messages
- TanStack Query `onError` callbacks handle errors
- Toast notifications for user-facing errors (Sonner library)

## Cross-Cutting Concerns

**Logging:**
- Backend: Kotlin Logging 7.0.0 + SLF4J 2.0.16
- Frontend: Console logging (development), no production logging detected
- Pattern: Structured logging with context, log at service boundaries

**Validation:**
- Backend: JSON Schema validation via NetworkNT validator (Draft 2019-09)
- Frontend: Zod schemas + React Hook Form validation
- Pattern: Validate at API boundaries, fail fast on invalid input

**Authentication:**
- Backend: Spring Security OAuth2 Resource Server (JWT validation)
- Frontend: Supabase client with SSR support
- Pattern: JWT in httpOnly cookies, `@PreAuthorize` on controllers, workspace security checks

**Authorization:**
- Backend: Custom `@workspaceSecurity.hasWorkspace()` checks
- Frontend: Session validation in service methods
- Pattern: Row-Level Security (RLS) at database level

**Audit:**
- Backend: ActivityService logs all mutations
- Pattern: JPA audit fields (createdAt, updatedAt, createdBy, updatedBy), activity log table

---

*Architecture analysis: 2026-01-09*
*Update when major patterns change*
