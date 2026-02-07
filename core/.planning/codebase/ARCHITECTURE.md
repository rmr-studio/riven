# Architecture

**Analysis Date:** 2026-02-07

## Pattern Overview

**Overall:** Multi-tenant Spring Boot REST API with layered architecture (controllers → services → repositories → entities)

**Key Characteristics:**
- Three primary subsystems: **Entity System** (mutable schema-driven types), **Block System** (immutable versioned content), and **Workflow System** (temporal orchestration)
- Role-based access control with workspace-scoped security (JWT + Spring Security)
- PostgreSQL with Row-Level Security (RLS) for multi-tenant data isolation
- Transactional service boundaries with explicit workflow coordination
- Strong separation between domain models (DTOs) and JPA entities

## Layers

**Controller Layer:**
- Purpose: Handle HTTP requests and responses, perform parameter validation, delegate to services
- Location: `src/main/kotlin/riven/core/controller/`
- Contains: REST endpoints organized by domain (entity, block, workflow, workspace, user)
- Depends on: Service layer, domain models
- Used by: HTTP clients (frontend, external APIs)
- Patterns: `@RestController`, `@RequestMapping`, `@PreAuthorize`, thin controllers

**Service Layer:**
- Purpose: Core business logic, orchestration, validation, transaction boundaries
- Location: `src/main/kotlin/riven/core/service/`
- Contains: Domain services (EntityTypeService, EntityService, BlockEnvironmentService, etc.)
- Depends on: Repository layer, external services (AuthTokenService, ActivityService, SchemaService)
- Used by: Controllers, other services (rare), workflow workers
- Patterns: `@Service`, `@Transactional`, constructor injection, method-level `@PreAuthorize`

**Repository Layer:**
- Purpose: Data access abstraction, database queries
- Location: `src/main/kotlin/riven/core/repository/`
- Contains: JPA repositories (thin, minimal business logic)
- Depends on: JPA entities, Spring Data JPA
- Used by: Services only
- Patterns: Extending `JpaRepository<Entity, ID>`, custom query methods

**JPA Entity Layer (Database):**
- Purpose: Represent database tables with Hibernate ORM
- Location: `src/main/kotlin/riven/core/entity/`
- Contains: Annotated entity classes (`@Entity`, `@Table`)
- Depends on: Jakarta Persistence annotations, Hypersistence utilities (JSONB support)
- Used by: Repositories, services (via mappers/converters)
- Patterns: `@Entity`, `@Column`, `@ManyToOne`, `@OneToMany`, `@JsonBinaryType` for JSONB

**Domain Model Layer (DTOs):**
- Purpose: Type-safe domain models for API contracts and business logic
- Location: `src/main/kotlin/riven/core/models/`
- Contains: Data classes (Entity, EntityType, Block, BlockType, requests, responses)
- Depends on: Enums, common models
- Used by: Controllers (input/output), services (business logic)
- Patterns: `data class`, sealed interfaces for polymorphism, composition over inheritance

**Configuration Layer:**
- Purpose: Spring Boot beans, external service configuration, security setup
- Location: `src/main/kotlin/riven/core/configuration/`
- Contains: SecurityConfig, SupabaseConfiguration, AuditConfig, ObjectMapperConfig
- Depends on: Spring Framework, properties classes
- Used by: Spring application context
- Patterns: `@Configuration`, `@Bean`, `@ConfigurationProperties`

**Utility/Support Layer:**
- Purpose: Cross-cutting concerns (logging, error handling, common utilities)
- Location: `src/main/kotlin/riven/core/exceptions/`, `src/main/kotlin/riven/core/util/`
- Contains: ExceptionHandler, custom exceptions, service utilities
- Used by: All layers
- Patterns: `@ControllerAdvice`, `@ExceptionHandler`, static utility functions

## Data Flow

**Entity CRUD Flow:**

1. **Request** → `EntityController.saveEntity()` or `getEntity()`
2. **Validation** → Controller parameter validation
3. **Authorization** → `@PreAuthorize` checks workspace membership via `WorkspaceSecurity`
4. **Service Processing** → `EntityService.saveEntity()` or `getEntity()`
   - Calls `EntityValidationService` for payload schema validation against `EntityTypeSchema`
   - Calls `EntityRelationshipService` for relationship hydration
   - Calls `ActivityService` to log audit trail
5. **Database Access** → `EntityRepository.save()` or `findById()`
   - JPA converts `EntityEntity` ↔ `Entity` domain model
   - PostgreSQL RLS policies enforce workspace isolation
6. **Response** → Return domain model `Entity` as JSON

**Entity Type Definition Flow:**

1. **Request** → `EntityTypeController.publishEntityType()` or `updateEntityTypeDefinition()`
2. **Authorization** → Verify workspace membership
3. **Service Processing** → `EntityTypeService.publishEntityType()` or `saveEntityTypeDefinition()`
   - Calls `EntityAttributeService` to add/update attribute schemas
   - Calls `EntityRelationshipService` to manage relationship definitions
   - Calls `EntityTypeRelationshipDiffService` to compute changes
   - Calls `EntityTypeRelationshipImpactAnalysisService` to warn of data loss
4. **Database Access** → `EntityTypeRepository.save()` (mutable, updates in-place)
   - Trigger fires to update denormalized `entity_count`
5. **Activity Logging** → Records change in `activity_logs`
6. **Response** → Return updated `EntityType`

**Block Environment Batch Operations Flow:**

1. **Request** → `BlockEnvironmentController.saveBlockEnvironment()`
2. **Authorization** → `@PreAuthorize` validates workspace access
3. **Locking/Versioning** → Check layout version for optimistic concurrency
4. **Transactional Processing** → Within `@Transactional` boundary:
   - Normalize operations (de-duplicate, order)
   - For each operation (ADD, MOVE, REMOVE, UPDATE, REORDER):
     - Validate nesting rules via `BlockTypeNesting`
     - Execute via `BlockService`, `BlockChildrenService`
     - Update parent-child links in `block_children` table
   - Save updated layout snapshot via `BlockTreeLayoutService`
   - Hydrate references via `BlockReferenceHydrationService` if needed
5. **Commit/Rollback** → All-or-nothing atomicity
6. **Response** → Return `SaveEnvironmentResponse` with updated tree

**Workflow Execution Flow:**

1. **Trigger** → WebSocket message, HTTP request, or scheduled job
2. **Queue Processing** → `WorkflowQueueService` enqueues `WorkflowExecutionRequest`
3. **Temporal Engine** → Temporal Worker processes via `WorkflowDefinitionService`
4. **Node Execution** → Evaluates node configs, executes actions
   - Reads from `WorkflowDataStore` for context
   - Invokes `WorkflowNodeServiceInjectionProvider` to inject services
   - Records output in `NodeOutput`
5. **State Machine** → Transitions states via `WorkflowStateService`
6. **Completion** → Final state saved, client notified via WebSocket

**Authentication & Authorization Flow:**

1. **Request** → Client includes JWT in `Authorization: Bearer <token>` header
2. **JWT Decoding** → `TokenDecoder` extracts claims and authorities
3. **Spring Security** → `SecurityConfig` validates token via `JwtDecoder`
4. **Authority Extraction** → `CustomAuthenticationTokenConverter` builds `GrantedAuthority` list:
   - Format: `ROLE_<workspaceId>_<WorkspaceRole>`
   - Example: `ROLE_550e8400-e29b-41d4-a716-446655440000_OWNER`
5. **Method-Level Authorization** → `@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")` checks authorities
6. **Row-Level Security** → PostgreSQL RLS policies filter based on `auth.uid()` and workspace membership

## State Management

**In-Memory State:**
- Request-scoped authentication context via `SecurityContextHolder`
- Temporal workflow state via `WorkflowDataStore` (persisted in Temporal backend)
- Transaction context via `@Transactional` Spring annotation

**Persistent State:**
- Entity data: `entities` table (workspace-scoped)
- Entity relationships: `entity_relationships` table (bidirectional links)
- Block hierarchies: `blocks` + `block_children` tables (tree structure)
- Block layouts: `block_tree_layouts` table (grid snapshots)
- Workflow execution: `workflow_executions` table + Temporal server
- Activity audit: `activity_logs` table (append-only)

**Stateless HTTP:** Controllers are stateless; all state retrieved from database per request

## Key Abstractions

**EntityType (Mutable Schema):**
- Purpose: Defines schema for entity instances
- Examples: `src/main/kotlin/riven/core/models/entity/EntityType.kt`, `src/main/kotlin/riven/core/entity/entity/EntityTypeEntity.kt`
- Pattern: Single row per type, updated in-place via `EntityTypeRepository.save()`
- Versioning: Implicit via `version` counter field
- Schema Storage: JSONB column containing `Schema<UUID>` (keys are attribute UUIDs)

**BlockType (Immutable Versioned):**
- Purpose: Defines schema for block instances with versioning
- Examples: `src/main/kotlin/riven/core/models/block/BlockType.kt`, `src/main/kotlin/riven/core/entity/block/BlockTypeEntity.kt`
- Pattern: New row created per version, linked via `sourceId` to original
- Versioning: Explicit via `version` counter, `sourceId` foreign key
- Schema Storage: JSONB column containing `Schema<String>` (keys are string references)

**EntityRelationshipDefinition (Bidirectional Sync):**
- Purpose: Defines relationships between entity types with automatic inverse creation
- Examples: `src/main/kotlin/riven/core/models/entity/configuration/EntityRelationshipDefinition.kt`
- Pattern: ORIGIN (user-created) relationships automatically create REFERENCE (system-created) inverses
- Synchronization: Changes to ORIGIN cascade to REFERENCE via `EntityRelationshipService.updateRelationships()`
- Cardinality: ONE_TO_MANY ↔ MANY_TO_ONE, ONE_TO_ONE ↔ ONE_TO_ONE, MANY_TO_MANY ↔ MANY_TO_MANY

**Metadata (Polymorphic Block Payloads):**
- Purpose: Sealed interface supporting three block types
- Examples:
  - `BlockContentMetadata`: Direct content storage with optional children
  - `EntityReferenceMetadata`: References to entities with projection/hydration
  - `BlockReferenceMetadata`: References to block trees
- Pattern: Sealed interface with discriminator in JSON (`type` field)
- Serialization: Custom deserializers in `src/main/kotlin/riven/core/deserializer/`

**Schema<T> (Generic JSON Schema):**
- Purpose: Parameterized JSON schema for validation
- Examples: `src/main/kotlin/riven/core/models/common/validation/Schema.kt`
- Pattern: Recursive structure supporting nested objects, arrays, type definitions
- Type Parameters:
  - `Schema<UUID>` for entity attributes (keys are UUIDs)
  - `Schema<String>` for block properties (keys are strings)
- Validation: Via networknt JSON Schema validator (Draft 2019-09)

**Block Tree (Hierarchical Structure):**
- Purpose: Represent complete block hierarchy with node types
- Examples: `src/main/kotlin/riven/core/models/block/tree/BlockTree.kt`, `src/main/kotlin/riven/core/models/block/tree/Node.kt`
- Pattern: Sealed `Node` interface with `ContentNode` (has children) and `ReferenceNode` (external reference)
- Hydration: `BlockReferenceHydrationService` resolves references recursively

## Entry Points

**HTTP Server (Spring Boot):**
- Location: `src/main/kotlin/riven/core/CoreApplication.kt`
- Triggers: Application startup, incoming HTTP requests
- Responsibilities: Server initialization, request routing, exception handling

**REST Controllers:**
- `EntityController` (`src/main/kotlin/riven/core/controller/entity/EntityController.kt`): Entity CRUD endpoints
- `EntityTypeController` (`src/main/kotlin/riven/core/controller/entity/EntityTypeController.kt`): Entity type lifecycle
- `BlockEnvironmentController` (`src/main/kotlin/riven/core/controller/block/BlockEnvironmentController.kt`): Block batch operations
- `BlockTypeController` (`src/main/kotlin/riven/core/controller/block/BlockTypeController.kt`): Block type lifecycle
- `WorkflowController` (`src/main/kotlin/riven/core/controller/workflow/`): Workflow execution and definition
- `WorkspaceController` (`src/main/kotlin/riven/core/controller/workspace/`): Workspace management

**Temporal Workflow Workers:**
- Location: `src/main/kotlin/riven/core/service/workflow/`
- Triggers: Temporal server tasks, work queue polling
- Responsibilities: Execute workflow definitions, state transitions, action invocation

**Scheduled Jobs:**
- Configured via `ShedLockConfiguration`
- Triggers: Cron schedules
- Responsibilities: Cleanup, health checks, periodic synchronization

## Error Handling

**Strategy:** Centralized exception handler with domain-specific exceptions

**Patterns:**

**Custom Exceptions:**
```kotlin
// Validation failures
class SchemaValidationException(val reasons: List<String>) : RuntimeException()

// Authorization failures
class AccessDeniedException : RuntimeException()

// Resource not found
class NotFoundException : RuntimeException()

// State violations
class ConflictException : RuntimeException()
class InvalidRelationshipException : RuntimeException()
class UniqueConstraintViolationException : RuntimeException()
```

**Global Exception Handler:**
- Location: `src/main/kotlin/riven/core/exceptions/ExceptionHandler.kt`
- Pattern: `@ControllerAdvice` with `@ExceptionHandler` methods
- Returns: Standardized `ErrorResponse` with HTTP status, error code, message, optional stack trace
- Stack Trace: Included only if `riven.include-stack-trace: true` in config

**Transaction Rollback:**
- `@Transactional` blocks rollback on unchecked exceptions
- `BlockEnvironmentService.saveEnvironment()` atomically fails all-or-nothing
- No partial state persisted on exception

**Logging:**
- Errors logged via `io.github.oshai.kotlinlogging.KLogger`
- Activity trail recorded in `ActivityService` for user-initiated changes

## Cross-Cutting Concerns

**Logging:**
- Framework: Kotlin Logging (SLF4J backend)
- Configuration: `src/main/kotlin/riven/core/configuration/util/LoggerConfig.kt`
- Pattern: Injected `KLogger` instance per service
- Levels: DEBUG (detailed flow), INFO (user actions), WARN (unusual conditions), ERROR (failures)

**Validation:**
- Schema Validation: `SchemaService.validate()` using networknt JSON Schema validator
- Custom Validation: Domain-specific validators in `src/main/kotlin/riven/core/models/entity/validation/`
- Strictness Modes:
  - NONE: Allow invalid payloads
  - SOFT: Warn on invalid payloads
  - STRICT: Reject invalid payloads
- Breaking Change Detection: `EntityValidationService.detectSchemaBreakingChanges()`

**Authentication:**
- Framework: Spring Security + OAuth2 Resource Server
- Token Type: JWT (signed with HMAC-SHA256)
- Claims Extraction: `CustomAuthenticationTokenConverter` builds authorities from JWT
- Claims: `sub` (user ID), `aud` (audience), custom workspace roles

**Authorization:**
- Method-Level: `@PreAuthorize` expressions on controllers and services
- Component: `WorkspaceSecurity` bean for role checks
- Patterns:
  - `@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")`
  - `@PreAuthorize("@workspaceSecurity.hasWorkspaceRole(#workspaceId, T(riven.core.enums.workspace.WorkspaceRoles).OWNER)")`
- Row-Level Security: PostgreSQL RLS policies filter results by authenticated user

**Auditing:**
- Service: `ActivityService` logs all significant operations
- Model: `ActivityLogEntity` in `activity_logs` table
- Details: Flexible JSON details capturing operation context
- Audit Fields: All domain entities track `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

**Multi-Tenancy:**
- Isolation: PostgreSQL RLS policies on all tenant-scoped tables
- Enforcement: `workspace_id` foreign key present in all schemas
- Row-Level Security Policies: Located in `schema.sql`
- Example:
  ```sql
  CREATE POLICY "blocks_select_by_org" ON public.blocks
      FOR SELECT TO authenticated
      USING (workspace_id IN (SELECT workspace_id
                              FROM public.workspace_members
                              WHERE user_id = auth.uid()));
  ```

**Transaction Management:**
- Boundary: Service method level via `@Transactional`
- Isolation: READ_COMMITTED (default)
- Propagation: REQUIRED (create if none exists)
- Read-Only: Marked where applicable for optimization

---

*Architecture analysis: 2026-02-07*
