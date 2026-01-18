# Architecture

**Analysis Date:** 2026-01-18

## Pattern Overview

**Overall:** Multi-Module Monorepo with Layered Backend Architecture

**Key Characteristics:**
- Monorepo containing backend (Kotlin/Spring Boot), frontend (Next.js), and landing page (Next.js)
- Backend follows classic layered architecture: Controller -> Service -> Repository -> Entity
- Frontend follows feature-module pattern with domain-driven organization
- Multi-tenant SaaS with workspace-scoped resources
- Two primary domain systems: Entity System (mutable schemas) and Block System (immutable versioned content)

## Layers

**Presentation Layer (Controllers):**
- Purpose: REST API endpoints, request/response handling, OpenAPI documentation
- Location: `core/src/main/kotlin/riven/core/controller/`
- Contains: REST controllers organized by domain (entity, block, workspace, workflow, user)
- Depends on: Service layer, Auth utilities
- Used by: Frontend clients, external API consumers

**Service Layer:**
- Purpose: Business logic, orchestration, validation, transaction management
- Location: `core/src/main/kotlin/riven/core/service/`
- Contains: Domain services (~31 services), validation logic, impact analysis
- Depends on: Repository layer, other services, Auth service
- Used by: Controllers, Temporal workflows

**Repository Layer:**
- Purpose: Data access, JPA queries, database operations
- Location: `core/src/main/kotlin/riven/core/repository/`
- Contains: Spring Data JPA repositories (~19 repositories)
- Depends on: JPA Entities
- Used by: Services

**Entity Layer (JPA Entities):**
- Purpose: Database table mappings, relationships, audit fields
- Location: `core/src/main/kotlin/riven/core/entity/`
- Contains: JPA entity classes with Hibernate annotations
- Depends on: None (leaf layer)
- Used by: Repositories, converted to Models via `toModel()`

**Models Layer (DTOs):**
- Purpose: Domain objects, API request/response types, transfer objects
- Location: `core/src/main/kotlin/riven/core/models/`
- Contains: Data classes for domain concepts, polymorphic types via sealed interfaces
- Depends on: Enums
- Used by: Services, Controllers, Serialization

**Configuration Layer:**
- Purpose: Spring configuration, security, external integrations
- Location: `core/src/main/kotlin/riven/core/configuration/`
- Contains: Security config, Supabase config, Temporal config, audit config
- Depends on: Properties, external SDKs
- Used by: Spring context

## Data Flow

**Entity Type Management (Mutable Pattern):**

1. Client sends `POST /api/v1/entity/schema/workspace/{workspaceId}/definition` with schema change
2. `EntityTypeController` delegates to `EntityTypeService.saveEntityTypeDefinition()`
3. Service performs impact analysis via `EntityTypeRelationshipImpactAnalysisService`
4. If impact detected and `impactConfirmed=false`, returns 409 Conflict with impact details
5. User confirms, client resends with `impactConfirmed=true`
6. Service updates entity type in-place (mutable), cascades to related types
7. `EntityTypeRelationshipService` handles bidirectional relationship synchronization
8. Activity logged via `ActivityService`
9. Response includes all affected entity types

**Block Environment Operations (Transactional Batch):**

1. Client sends `POST /api/v1/block/environment/save` with operations array
2. `BlockEnvironmentController` delegates to `BlockEnvironmentService.saveBlockEnvironment()`
3. Service validates version for conflict detection
4. Operations filtered (cascade deleted blocks) and normalized (deduplicated)
5. Execute in phases: REMOVE -> ADD -> UPDATE -> MOVE -> REORDER
6. ID mappings collected for temporary -> permanent UUID resolution
7. Layout snapshot updated with new mappings
8. Single transactional commit for atomicity
9. Response includes updated layout, ID mappings, version

**Workflow Execution (Temporal):**

1. Workflow triggered via `WorkflowExecutionController`
2. `WorkflowOrchestrationService` (Temporal workflow) receives execution input
3. Workflow loads nodes/edges from repository
4. Delegates to `WorkflowCoordinationService` (Temporal activity) for DAG execution
5. Activities handle non-deterministic operations (DB, HTTP)
6. Results aggregated and returned

**State Management:**
- Backend: Stateless REST API with JWT authentication
- Frontend: Zustand stores (client state) + TanStack Query (server state cache)
- Database: PostgreSQL with Row-Level Security for multi-tenancy

## Key Abstractions

**EntityType (Mutable Schema):**
- Purpose: User-defined business object schemas with attributes and relationships
- Examples: `core/src/main/kotlin/riven/core/entity/entity/EntityTypeEntity.kt`, `core/src/main/kotlin/riven/core/models/entity/EntityType.kt`
- Pattern: In-place updates, version counter incremented

**BlockType (Immutable Versioned):**
- Purpose: Content type definitions with copy-on-write versioning
- Examples: `core/src/main/kotlin/riven/core/entity/block/BlockTypeEntity.kt`, `core/src/main/kotlin/riven/core/models/block/BlockType.kt`
- Pattern: New row created on update, `sourceId` links to original

**EntityRelationshipDefinition:**
- Purpose: Defines bidirectional relationships between entity types
- Examples: `core/src/main/kotlin/riven/core/models/entity/configuration/EntityRelationshipDefinition.kt`
- Pattern: ORIGIN (user-created) + REFERENCE (system-created inverse), cardinality enforcement

**Metadata (Polymorphic Block Payload):**
- Purpose: Discriminated union for block content types
- Examples: `core/src/main/kotlin/riven/core/models/block/metadata/Metadata.kt`, `BlockContentMetadata.kt`, `EntityReferenceMetadata.kt`, `BlockReferenceMetadata.kt`
- Pattern: Sealed interface with `type` discriminator, custom JSON deserializer

**Node (Polymorphic Block Tree):**
- Purpose: Discriminated union for block tree nodes
- Examples: `core/src/main/kotlin/riven/core/models/block/tree/Node.kt`
- Pattern: Sealed interface - `ContentNode` (with children) or `ReferenceNode` (entity/block reference)

**Schema<T> (Generic Type Definition):**
- Purpose: JSON Schema representation for entity/block validation
- Examples: `core/src/main/kotlin/riven/core/models/common/validation/Schema.kt`
- Pattern: Generic over key type - `Schema<UUID>` for entities, `Schema<String>` for blocks

## Entry Points

**Backend REST API:**
- Location: `core/src/main/kotlin/riven/core/CoreApplication.kt`
- Triggers: HTTP requests to `/api/v1/**`
- Responsibilities: Bootstrap Spring Boot, scan components, configure properties

**Controllers:**
- Location: `core/src/main/kotlin/riven/core/controller/`
- Triggers: HTTP requests routed by Spring MVC
- Responsibilities: Request validation, service delegation, response serialization

**Temporal Workflows:**
- Location: `core/src/main/kotlin/riven/core/service/workflow/engine/WorkflowOrchestrationService.kt`
- Triggers: Temporal workflow invocation
- Responsibilities: Deterministic workflow logic, activity delegation

**Frontend App Router:**
- Location: `client/app/`
- Triggers: HTTP requests to Next.js routes
- Responsibilities: Page rendering, API route handling, SSR

## Error Handling

**Strategy:** Exception-based with global handler and typed responses

**Patterns:**
- `NotFoundException`: Entity not found (404)
- `IllegalArgumentException`: Invalid request data (400)
- `IllegalStateException`: Invalid state transitions (409)
- `SchemaValidationException`: Payload validation failures (400)
- `AccessDeniedException`: Authorization failures (403)
- Global exception handler in `core/src/main/kotlin/riven/core/exceptions/ExceptionHandler.kt`
- Impact analysis returns 409 Conflict with `EntityTypeImpactResponse` for schema changes

## Cross-Cutting Concerns

**Logging:**
- Framework: Kotlin Logging (SLF4J wrapper)
- Injectable `KLogger` bean in `core/src/main/kotlin/riven/core/configuration/util/LoggerConfig.kt`
- Temporal uses `Workflow.getLogger()` for determinism

**Validation:**
- JSON Schema validation via NetworkNT validator (Draft 2019-09)
- `SchemaService` in `core/src/main/kotlin/riven/core/service/schema/SchemaService.kt`
- Three modes: NONE, SOFT (warnings), STRICT (errors)

**Authentication:**
- JWT via Spring Security OAuth2 Resource Server
- Supabase as identity provider
- Token decoding in `core/src/main/kotlin/riven/core/configuration/auth/TokenDecoder.kt`
- User extraction via `AuthTokenService`

**Authorization:**
- Method-level via `@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")`
- Workspace membership checked per request
- PostgreSQL RLS for database-level multi-tenancy

**Auditing:**
- JPA auditing via `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy`
- Activity logging via `ActivityService` to `activity_log` table
- `AuditableEntity` base class for common audit fields

---

*Architecture analysis: 2026-01-18*
