# Codebase Structure

**Analysis Date:** 2026-02-07

## Directory Layout

```
core/
├── src/main/
│   ├── kotlin/riven/core/              # Main application code
│   │   ├── CoreApplication.kt          # Spring Boot entry point
│   │   ├── configuration/              # Spring beans and config
│   │   │   ├── audit/                  # JPA audit listener config
│   │   │   ├── auth/                   # Security, JWT, OAuth2 config
│   │   │   ├── openapi/                # OpenAPI/Swagger config
│   │   │   ├── properties/             # @ConfigurationProperties classes
│   │   │   ├── storage/                # Supabase file storage setup
│   │   │   ├── util/                   # Jackson, logging, misc config
│   │   │   └── workflow/               # Temporal engine, worker setup
│   │   ├── controller/                 # REST API endpoints
│   │   │   ├── entity/                 # EntityController, EntityTypeController
│   │   │   ├── block/                  # BlockController, BlockTypeController, BlockEnvironmentController
│   │   │   ├── workflow/               # WorkflowController, ExecutionController
│   │   │   ├── workspace/              # WorkspaceController, InviteController
│   │   │   └── user/                   # UserController
│   │   ├── service/                    # Business logic layer ⭐ PRIMARY FOCUS
│   │   │   ├── entity/                 # Entity services
│   │   │   │   ├── EntityService.kt                      # Entity CRUD
│   │   │   │   ├── EntityValidationService.kt           # Schema validation
│   │   │   │   ├── EntityRelationshipService.kt         # Relationship management
│   │   │   │   ├── type/                                # Entity type services
│   │   │   │   │   ├── EntityTypeService.kt             # Type lifecycle
│   │   │   │   │   ├── EntityTypeAttributeService.kt    # Attribute operations
│   │   │   │   │   ├── EntityTypeRelationshipService.kt # Relationship sync
│   │   │   │   │   ├── EntityTypeRelationshipDiffService.kt
│   │   │   │   │   └── EntityTypeRelationshipImpactAnalysisService.kt
│   │   │   │   └── query/                               # Query building, filtering
│   │   │   ├── block/                  # Block services
│   │   │   │   ├── BlockService.kt                      # Block CRUD
│   │   │   │   ├── BlockTypeService.kt                  # Block type versioning
│   │   │   │   ├── BlockEnvironmentService.kt           # Batch operations ⭐ LARGEST
│   │   │   │   ├── BlockChildrenService.kt              # Hierarchy management
│   │   │   │   ├── BlockTreeLayoutService.kt            # Layout persistence
│   │   │   │   ├── BlockReferenceHydrationService.kt    # Reference resolution
│   │   │   │   └── DefaultBlockEnvironmentService.kt    # Default environment setup
│   │   │   ├── workflow/               # Workflow orchestration
│   │   │   │   ├── WorkflowDefinitionService.kt         # Definition management
│   │   │   │   ├── WorkflowExecutionService.kt          # Execution lifecycle
│   │   │   │   ├── WorkflowGraphService.kt              # Workflow graph building
│   │   │   │   ├── WorkflowNodeConfigRegistry.kt        # Node config registry
│   │   │   │   ├── engine/                              # Temporal engine integration
│   │   │   │   │   ├── WorkflowCoordinator.kt           # Workflow definition
│   │   │   │   │   ├── coordinator/                     # Coordination logic
│   │   │   │   │   ├── execution/                       # Execution helpers
│   │   │   │   │   ├── error/                           # Error handling
│   │   │   │   │   └── completion/                      # Completion callbacks
│   │   │   │   ├── queue/                               # Task queue processing
│   │   │   │   └── state/                               # State management
│   │   │   ├── schema/                 # JSON Schema validation
│   │   │   │   └── SchemaService.kt
│   │   │   ├── auth/                   # Authentication
│   │   │   │   └── AuthTokenService.kt
│   │   │   ├── activity/               # Activity logging
│   │   │   │   └── ActivityService.kt
│   │   │   ├── workspace/              # Workspace management
│   │   │   │   ├── WorkspaceService.kt
│   │   │   │   └── WorkspaceInviteService.kt
│   │   │   ├── user/                   # User management
│   │   │   │   └── UserService.kt
│   │   │   └── storage/                # File storage (Supabase)
│   │   │       └── StorageService.kt
│   │   ├── repository/                 # JPA repositories (data access)
│   │   │   ├── entity/                 # EntityRepository, EntityTypeRepository, etc.
│   │   │   ├── block/                  # BlockRepository, BlockTypeRepository, etc.
│   │   │   ├── activity/               # ActivityLogRepository
│   │   │   ├── workflow/               # Workflow repositories + projections
│   │   │   ├── workspace/              # WorkspaceRepository, MemberRepository
│   │   │   └── user/                   # UserRepository
│   │   ├── entity/                     # JPA entity classes (database tables)
│   │   │   ├── entity/                 # Entity, EntityType, EntityRelationship entities
│   │   │   ├── block/                  # Block, BlockType, BlockChildren entities
│   │   │   ├── activity/               # ActivityLog entity
│   │   │   ├── workflow/               # Workflow, WorkflowExecution entities
│   │   │   ├── workspace/              # Workspace, WorkspaceMember entities
│   │   │   ├── user/                   # User entity
│   │   │   └── util/                   # BaseEntity, AuditableEntity base classes
│   │   ├── models/                     # Domain models (DTOs) ⭐ PRIMARY FOCUS
│   │   │   ├── entity/                 # Entity, EntityType domain models
│   │   │   │   ├── Entity.kt
│   │   │   │   ├── EntityType.kt
│   │   │   │   ├── EntityRelationship.kt
│   │   │   │   ├── EntityLink.kt
│   │   │   │   ├── configuration/      # Relationship definitions, attribute schema
│   │   │   │   ├── payload/            # Entity attribute types
│   │   │   │   ├── validation/         # Validation errors, breaking changes
│   │   │   │   ├── query/              # Query filtering, result models
│   │   │   │   └── relationship/       # Relationship analysis models
│   │   │   ├── block/                  # Block domain models
│   │   │   │   ├── Block.kt
│   │   │   │   ├── BlockType.kt
│   │   │   │   ├── BlockEnvironment.kt
│   │   │   │   ├── metadata/           # Sealed Metadata interface with concrete types
│   │   │   │   │   ├── Metadata.kt     # Sealed interface
│   │   │   │   │   ├── BlockContentMetadata.kt
│   │   │   │   │   ├── EntityReferenceMetadata.kt
│   │   │   │   │   └── BlockReferenceMetadata.kt
│   │   │   │   ├── tree/               # Block hierarchy models
│   │   │   │   │   ├── BlockTree.kt
│   │   │   │   │   ├── Node.kt        # Sealed: ContentNode, ReferenceNode
│   │   │   │   │   └── BlockTreeLayout.kt
│   │   │   │   ├── layout/             # Grid layout, widget models
│   │   │   │   ├── operation/          # Block operations (ADD, MOVE, REMOVE, etc.)
│   │   │   │   └── display/            # Display structure, nesting rules
│   │   │   ├── workflow/               # Workflow domain models
│   │   │   │   ├── WorkflowDefinition.kt
│   │   │   │   ├── WorkflowExecution.kt
│   │   │   │   ├── node/               # Node definitions, configs, triggers
│   │   │   │   ├── engine/             # Engine-specific models
│   │   │   │   └── engine/state/       # Data store, context, output models
│   │   │   ├── common/                 # Shared models
│   │   │   │   ├── validation/Schema.kt    # Generic Schema<T> model
│   │   │   │   ├── Icon.kt             # Icon definition
│   │   │   │   ├── grid/               # Grid models
│   │   │   │   ├── json/               # JSON utilities
│   │   │   │   └── http/               # HTTP models
│   │   │   ├── request/                # API request models
│   │   │   │   ├── entity/type/        # Entity type requests
│   │   │   │   └── block/              # Block requests
│   │   │   ├── response/               # API response models
│   │   │   │   ├── entity/             # Entity responses
│   │   │   │   ├── block/              # Block responses
│   │   │   │   ├── workflow/           # Workflow responses
│   │   │   │   └── common/             # ErrorResponse, common responses
│   │   │   ├── activity/               # Activity models
│   │   │   ├── workspace/              # Workspace models
│   │   │   └── user/                   # User models
│   │   ├── enums/                      # Application enumerations
│   │   │   ├── entity/                 # Entity-specific enums
│   │   │   ├── block/                  # Block-specific enums
│   │   │   ├── workflow/               # Workflow-specific enums
│   │   │   ├── common/                 # Common enums (icon, validation, etc.)
│   │   │   ├── core/                   # Core enums (ApplicationEntityType, etc.)
│   │   │   ├── activity/               # Activity and operation type enums
│   │   │   ├── workspace/              # Workspace role enums
│   │   │   └── util/                   # Utility enums
│   │   ├── projection/                 # Read-only projections for queries
│   │   │   ├── entity/                 # Entity projections
│   │   │   ├── workflow/               # Workflow projections
│   │   │   └── user/                   # User projections
│   │   ├── deserializer/               # Custom JSON deserializers
│   │   │   └── [Metadata deserializers, custom JSON unmarshalling]
│   │   ├── exceptions/                 # Custom exceptions and global handler
│   │   │   ├── ExceptionHandler.kt     # @ControllerAdvice global handler
│   │   │   ├── ArgumentExceptions.kt   # Custom exception types
│   │   │   └── query/                  # Query-specific exceptions
│   │   └── util/                       # Utility functions
│   │       ├── ServiceUtil.kt          # findOrThrow, findManyResults helpers
│   │       └── [Other utilities]
│   └── resources/
│       ├── application.yml             # Spring Boot configuration
│       ├── application-test.yml        # Test configuration
│       └── [properties, schemas]
├── src/test/
│   └── kotlin/riven/core/              # Test code (mirrors main structure)
│       ├── service/                    # Service integration tests
│       │   ├── entity/                 # Entity service tests
│       │   ├── block/                  # Block service tests
│       │   ├── workflow/               # Workflow service tests
│       │   └── schema/                 # Schema validation tests
│       ├── models/                     # Model and validation tests
│       ├── entity/                     # Entity serialization tests
│       └── [Other test packages]
├── build.gradle.kts                    # Gradle build configuration
├── schema.sql                          # PostgreSQL DDL (638 lines)
└── CLAUDE.md                           # Developer reference
```

## Directory Purposes

**configuration/:**
- Purpose: Spring Boot configuration beans and property loading
- Key Files:
  - `auth/SecurityConfig.kt`: OAuth2, JWT, CORS configuration
  - `auth/OrganisationSecurity.kt`: Workspace role validation component
  - `audit/AuditConfig.kt`: JPA Auditing setup
  - `storage/SupabaseConfiguration.kt`: Supabase client initialization
  - `workflow/TemporalEngineConfiguration.kt`: Temporal worker setup

**controller/:**
- Purpose: REST API endpoints and HTTP request handling
- Thin controllers: Parameter binding, authorization checks, delegation to services
- Organized by domain (entity, block, workflow, workspace, user)
- OpenAPI/Swagger annotations for documentation

**service/:**
- Purpose: Business logic, orchestration, transaction boundaries
- Entity system: type management, relationships, validation
- Block system: batch operations, hierarchy, layout
- Workflow system: definitions, executions, state management
- Supporting services: auth, activity, schema, storage

**repository/:**
- Purpose: JPA data access layer
- Thin repositories extending `JpaRepository<Entity, ID>`
- Custom query methods where needed
- No business logic (delegated to services)

**entity/:**
- Purpose: JPA entity classes mapping to database tables
- Annotated with `@Entity`, `@Table`, `@Column`
- Contains JSONB columns for flexible data (Hypersistence Utils)
- Base classes: `AuditableEntity` (createdAt, updatedAt, createdBy, updatedBy)
- Soft delete support via `deleted` flag or moved tables

**models/:**
- Purpose: Type-safe domain models for API contracts and business logic
- DTOs separate from JPA entities
- Organized by domain (entity, block, workflow, common)
- Subdivided by purpose:
  - `entity/`: Entity, EntityType, relationships, validation models
  - `block/`: Block, BlockType, metadata, tree, layout, operation models
  - `workflow/`: Workflow definitions, executions, state models
  - `common/`: Shared models (Schema, Icon, validation)
  - `request/`: API request models
  - `response/`: API response models
- Polymorphism via sealed interfaces (`Metadata`, `Node`)

**enums/:**
- Purpose: Type-safe enumerations for domain constants
- Organized by domain (entity, block, workflow, common)
- Examples:
  - `EntityRelationshipCardinality`: ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY
  - `BlockOperationType`: ADD, MOVE, REMOVE, REORDER, UPDATE
  - `WorkspaceRoles`: OWNER, ADMIN, MEMBER

**exceptions/:**
- Purpose: Custom exceptions and centralized error handling
- `ExceptionHandler.kt`: Global `@ControllerAdvice` mapping exceptions to HTTP responses
- Custom exceptions: `SchemaValidationException`, `NotFoundException`, `ConflictException`, etc.

**util/:**
- Purpose: Reusable utility functions
- `ServiceUtil.kt`: findOrThrow, findManyResults, collection helpers
- Configuration utilities, logging setup

**schema.sql:**
- Location: `core/schema.sql`
- Purpose: PostgreSQL DDL and RLS policies
- Contents: Table definitions, indexes, constraints, triggers, RLS policies
- Not auto-executed; must run manually or via migration tool

## Key File Locations

**Entry Points:**
- `src/main/kotlin/riven/core/CoreApplication.kt`: Spring Boot main application
- Controllers: `src/main/kotlin/riven/core/controller/[domain]/`
- Temporal workers: Auto-discovered in `riven.core.service.workflow` package

**Configuration:**
- Security: `src/main/kotlin/riven/core/configuration/auth/SecurityConfig.kt`
- OAuth2: `src/main/kotlin/riven/core/configuration/auth/TokenDecoder.kt`
- Database: `src/main/resources/application.yml`
- Database schema: `schema.sql`

**Core Logic:**
- Entity types: `src/main/kotlin/riven/core/service/entity/type/EntityTypeService.kt`
- Relationships: `src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt` (1,462 lines - largest)
- Entity instances: `src/main/kotlin/riven/core/service/entity/EntityService.kt`
- Block batch ops: `src/main/kotlin/riven/core/service/block/BlockEnvironmentService.kt` (674 lines)
- Block hierarchy: `src/main/kotlin/riven/core/service/block/BlockChildrenService.kt`
- Workflow execution: `src/main/kotlin/riven/core/service/workflow/WorkflowExecutionService.kt`

**Domain Models:**
- Entity: `src/main/kotlin/riven/core/models/entity/Entity.kt`
- EntityType: `src/main/kotlin/riven/core/models/entity/EntityType.kt`
- Block: `src/main/kotlin/riven/core/models/block/Block.kt`
- BlockType: `src/main/kotlin/riven/core/models/block/BlockType.kt`
- Metadata: `src/main/kotlin/riven/core/models/block/metadata/Metadata.kt` (sealed interface)

**Testing:**
- Service tests: `src/test/kotlin/riven/core/service/[domain]/`
- Test utilities: `src/test/kotlin/riven/core/service/util/factory/`
- Database setup: Uses TestContainers + in-memory H2 for tests

## Naming Conventions

**Files:**
- Service classes: `EntityTypeService.kt`, `BlockEnvironmentService.kt` (noun + Service)
- Repository classes: `EntityTypeRepository.kt`, `BlockRepository.kt` (noun + Repository)
- Entity classes: `EntityTypeEntity.kt`, `BlockEntity.kt` (noun + Entity)
- Controller classes: `EntityTypeController.kt`, `BlockController.kt` (noun + Controller)
- Models: `Entity.kt`, `EntityType.kt`, `Block.kt` (simple nouns)
- Test classes: `EntityServiceTest.kt`, `BlockEnvironmentServiceTest.kt` (noun + Test)

**Directories:**
- By domain: `entity/`, `block/`, `workflow/`, `workspace/`, `user/`
- By type: `configuration/`, `controller/`, `service/`, `repository/`, `models/`, `enums/`, `exceptions/`
- By sub-domain: `entity/type/`, `block/metadata/`, `workflow/engine/`

**Functions/Methods:**
- camelCase: `publishEntityType()`, `saveBlockEnvironment()`, `hydrateBlockReferences()`
- Getter prefix: `get`, `fetch`, `find` (e.g., `getEntity()`, `fetchLayoutById()`)
- Setter prefix: `save`, `update`, `create` (e.g., `saveEntity()`, `updateEntityType()`)
- Predicate prefix: `is`, `has`, `can` (e.g., `isUpdatingWorkspaceMember()`)
- Action prefix: `validate`, `analyze`, `synchronize` (e.g., `validateRelationships()`)

**Classes/Components:**
- PascalCase: `EntityTypeService`, `BlockEnvironmentService`, `WorkflowExecutionService`
- Interface prefix: `I` not used; sealed interfaces prefer concrete implementations
- Abstract classes: Rare; prefer composition and inheritance from base entity classes

**Constants:**
- SCREAMING_SNAKE_CASE in `companion object`:
  ```kotlin
  companion object {
      const val DEFAULT_SCHEMA_VERSION = 1
      const val MAX_NESTING_DEPTH = 10
  }
  ```

**Package Names:**
- lowercase, dot-separated, feature-oriented
- Examples: `riven.core.service.entity.type`, `riven.core.models.block.metadata`

## Where to Add New Code

**New Feature (Entity Type Feature):**
- Primary code: `src/main/kotlin/riven/core/service/entity/type/EntityTypeNewFeatureService.kt`
- Controller endpoint: `src/main/kotlin/riven/core/controller/entity/EntityTypeController.kt` (add method)
- Domain models: `src/main/kotlin/riven/core/models/entity/[related]/`
- Request/response models: `src/main/kotlin/riven/core/models/request/entity/type/` and `response/entity/type/`
- Tests: `src/test/kotlin/riven/core/service/entity/type/EntityTypeNewFeatureServiceTest.kt`

**New Component/Module:**
- Implementation: `src/main/kotlin/riven/core/service/[domain]/NewService.kt`
- Interface: Create sealed interface in `models/` if polymorphism needed
- Entities: `src/main/kotlin/riven/core/entity/[domain]/NewEntity.kt`
- Repository: `src/main/kotlin/riven/core/repository/[domain]/NewRepository.kt`
- Controller: `src/main/kotlin/riven/core/controller/[domain]/NewController.kt`
- Tests: `src/test/kotlin/riven/core/service/[domain]/NewServiceTest.kt`

**Utilities/Helpers:**
- Shared helpers: `src/main/kotlin/riven/core/util/NewUtil.kt`
- Type-specific helpers: `src/main/kotlin/riven/core/service/[domain]/NewHelper.kt`
- Model helpers: `src/main/kotlin/riven/core/models/common/NewHelper.kt`

**Cross-Domain Enhancements:**
- New enums: `src/main/kotlin/riven/core/enums/[domain]/NewEnum.kt`
- New exception types: `src/main/kotlin/riven/core/exceptions/NewException.kt`
- New configurations: `src/main/kotlin/riven/core/configuration/NewConfig.kt`

## Special Directories

**src/main/resources/:**
- Generated: No
- Committed: Yes
- Contents: `application.yml` (Spring Boot properties), other configuration files

**build/:**
- Generated: Yes (during Gradle build)
- Committed: No (.gitignore)
- Contents: Compiled classes, JAR artifacts, test reports

**db/schema/**
- Generated: No
- Committed: Yes
- Purpose: Organized PostgreSQL DDL scripts (extensions, tables, indexes, functions, constraints, RLS, triggers, grants)
- Contents: Separate SQL files per schema category for modularity

**schema.sql:**
- Generated: No
- Committed: Yes
- Purpose: Monolithic PostgreSQL schema definition (all tables, triggers, RLS policies)
- Execution: Run manually: `psql -U postgres -d riven_core -a -f schema.sql`

---

*Structure analysis: 2026-02-07*
