# Riven Core - Backend Development Reference

## 1. Backend Overview

Riven Core is a Spring Boot backend providing RESTful APIs for a multi-tenant SaaS platform with two primary systems:

1. **Entity System** - Mutable schema-driven entity type management with bidirectional relationship orchestration, polymorphic support, and impact analysis
2. **Block System** - Immutable versioned content composition framework with hierarchical tree structures and reference resolution

The backend handles schema validation, relationship synchronization, audit logging, and complex business logic for both systems.

## 2. Tech Stack

- **Framework:** Spring Boot 3.5.3
- **Language:** Kotlin 2.1.21 (JVM target: Java 21)
- **Build Tool:** Gradle 8.7.0
- **Database:** PostgreSQL with Row-Level Security (RLS)
- **Authentication:** Spring Security + OAuth2 Resource Server (JWT via Supabase)
- **Validation:** NetworkNT JSON Schema Validator (Draft 2019-09)
- **Documentation:** SpringDoc OpenAPI 2.8.6
- **Storage:** Supabase Storage (Ktor client)
- **PDF Generation:** OpenPDF 1.3.30
- **Logging:** Kotlin Logging 7.0.0 + SLF4J 2.0.16
- **ORM:** Spring Data JPA + Hibernate 6.3 + Hypersistence Utils 3.9.2
- **Testing:** JUnit 5 + Mockito 5.20.0 + H2 (in-memory)

## 3. Architecture

### 3.1 Project Structure

```
core/
├── src/main/kotlin/riven/core/
│   ├── CoreApplication.kt              # Spring Boot entry point
│   ├── configuration/                  # Spring configuration beans
│   │   ├── SecurityConfig.kt          # JWT/CORS configuration
│   │   ├── SupabaseConfig.kt          # Supabase client setup
│   │   └── AuditorAwareConfig.kt      # JPA audit configuration
│   ├── controller/                     # REST API endpoints
│   │   ├── entity/                    # Entity type/instance endpoints
│   │   └── block/                     # Block type/instance endpoints
│   ├── service/                        # Business logic layer ⭐ PRIMARY FOCUS
│   │   ├── entity/                    # Entity services (3 files, ~1.1KB)
│   │   │   ├── EntityService.kt
│   │   │   ├── EntityValidationService.kt
│   │   │   └── type/                  # Entity type services (4 files)
│   │   │       ├── EntityTypeService.kt
│   │   │       ├── EntityRelationshipService.kt  # 1,368 lines - LARGEST
│   │   │       ├── EntityAttributeService.kt
│   │   │       ├── EntityTypeRelationshipDiffService.kt
│   │   │       └── EntityTypeRelationshipImpactAnalysisService.kt
│   │   ├── block/                     # Block services (7 files)
│   │   │   ├── BlockService.kt
│   │   │   ├── BlockTypeService.kt
│   │   │   ├── BlockEnvironmentService.kt  # 674 lines - orchestration
│   │   │   ├── BlockChildrenService.kt
│   │   │   ├── BlockReferenceHydrationService.kt
│   │   │   ├── BlockTreeLayoutService.kt
│   │   │   └── DefaultBlockEnvironmentService.kt
│   │   ├── auth/                      # Auth services
│   │   │   └── AuthTokenService.kt
│   │   ├── activity/                  # Audit logging
│   │   │   └── ActivityService.kt
│   │   ├── organisation/              # Org management
│   │   │   ├── OrganisationService.kt
│   │   │   └── OrganisationInviteService.kt
│   │   ├── user/                      # User services
│   │   │   └── UserService.kt
│   │   ├── schema/                    # JSON Schema validation
│   │   │   └── SchemaService.kt
│   │   └── storage/                   # File storage
│   │       └── StorageService.kt
│   ├── repository/                     # JPA repositories (data access)
│   │   ├── entity/
│   │   ├── block/
│   │   └── organisation/
│   ├── entity/                         # JPA entities (database tables)
│   │   ├── entity/
│   │   ├── block/
│   │   └── organisation/
│   ├── models/                         # Domain models (DTOs) ⭐ PRIMARY FOCUS
│   │   ├── entity/                    # Entity domain models
│   │   │   ├── EntityType.kt
│   │   │   ├── Entity.kt
│   │   │   ├── EntityRelationship.kt
│   │   │   ├── configuration/         # Relationship configuration
│   │   │   │   └── EntityRelationshipDefinition.kt
│   │   │   └── relationship/analysis/ # Impact analysis models
│   │   │       ├── EntityTypeRelationshipDiff.kt
│   │   │       ├── EntityTypeRelationshipImpactAnalysis.kt
│   │   │       ├── EntityTypeRelationshipDataLossWarning.kt
│   │   │       ├── EntityTypeRelationshipModification.kt
│   │   │       └── EntityImpactSummary.kt
│   │   ├── block/                     # Block domain models
│   │   │   ├── Block.kt
│   │   │   ├── BlockType.kt
│   │   │   ├── BlockEnvironment.kt
│   │   │   ├── metadata/              # Polymorphic block payloads
│   │   │   │   ├── Metadata.kt       # Sealed interface
│   │   │   │   ├── BlockContentMetadata.kt
│   │   │   │   ├── EntityReferenceMetadata.kt
│   │   │   │   └── BlockReferenceMetadata.kt
│   │   │   ├── tree/                  # Block hierarchy models
│   │   │   │   ├── BlockTree.kt
│   │   │   │   ├── Node.kt           # Sealed: ContentNode, ReferenceNode
│   │   │   │   └── BlockTreeLayout.kt
│   │   │   ├── display/
│   │   │   │   └── BlockTypeNesting.kt
│   │   │   └── operation/
│   │   │       └── BlockOperation.kt  # ADD, MOVE, REMOVE, etc.
│   │   ├── request/                   # API request models
│   │   │   └── entity/type/
│   │   │       ├── SaveTypeDefinitionRequest.kt
│   │   │       └── DeleteDefinitionRequest.kt
│   │   └── common/
│   │       ├── validation/Schema.kt   # Generic Schema<T>
│   │       └── json/JsonObject.kt
│   ├── enums/                          # Application enums
│   ├── deserializer/                   # Custom JSON deserializers
│   ├── exceptions/                     # Custom exceptions
│   └── util/                           # Utilities
├── src/main/resources/
│   ├── application.yml                # Configuration properties
│   └── application-test.yml           # Test configuration
├── schema.sql                          # PostgreSQL DDL (568 lines)
├── build.gradle.kts                    # Gradle build configuration
└── CLAUDE.md                           # This file

**Total:** 21 services, ~5,911 lines of service code
```

### 3.2 Service Layer Architecture

#### Entity System Services

**EntityTypeService.kt** (486 lines) - Entity type lifecycle management
- `publishEntityType()` - Creates new entity type with default schema
- `updateEntityTypeConfiguration()` - Updates metadata (name, icon, description)
- `saveEntityTypeDefinition()` - Adds/updates attributes or relationships
- `removeEntityTypeDefinition()` - Removes definitions with impact analysis
- `deleteEntityType()` - Deletes type with cascade impact analysis
- `reorderEntityTypeColumns()` - Manages attribute/relationship display order

**EntityRelationshipService.kt** (1,368 lines) - **LARGEST & MOST COMPLEX SERVICE**
- Bidirectional relationship creation and synchronization
- Cardinality enforcement (ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY)
- Polymorphic relationship support (single relationship → multiple entity types)
- Overlap detection and naming collision prevention
- Inverse relationship validation and cascade operations

**Key Responsibilities:**
- `createRelationships()` - Creates ORIGIN relationships, cascades REFERENCE relationships
- `updateRelationships()` - Modifies relationships using diff-based approach
- `removeRelationships()` - Removes relationships with cascade removal of inverses
- `validateRelationshipDefinitions()` - Comprehensive validation

**Change Handlers:**
- `handleInverseNameChange()` - Updates REFERENCE names when ORIGIN inverse name changes
- `handleCardinalityChange()` - Updates inverse cardinality
- `handleBidirectionalEnabled()` - Creates inverse REFERENCE relationships
- `handleBidirectionalDisabled()` - Removes inverse REFERENCE relationships
- `handleBidirectionalTargetsChanged()` - Adds/removes specific inverses

**Validation Methods:**
- `validateRelationshipForCreateOrUpdate()` - Ensures bidirectional relationships properly configured
- `validateRelationshipForDelete()` - Ensures no orphaned relationships
- `validateNamingCollisions()` - Prevents duplicate relationship names
- `validateOriginBidirectionalRelationship()` - Validates ORIGIN bidirectional config

**Helper Methods:**
- `resolveNameCollision()` - Generates unique names ("Inverse Name" → "Inverse Name 2")
- `isUsingDefaultInverseName()` - Checks if REFERENCE uses default inverse name
- `createInverseReferenceRelationships()` - Builds REFERENCE relationships for targets
- `updateOriginForReferenceRelationship()` - Updates ORIGIN bidirectionalEntityTypeKeys

**EntityTypeRelationshipImpactAnalysisService.kt** (199 lines) - Impact analysis
- `analyze()` - Returns empty analysis (currently stubbed with TODO)
- `analyzeModificationImpact()` - Detects data loss from cardinality/target changes
- `analyseRelationRemovalImpact()` - Identifies affected entity types
- `hasNotableImpacts()` - Determines if user confirmation needed

**EntityTypeRelationshipDiffService.kt** (45 lines) - Diff computation
- `calculateModification()` - Compares old vs. new relationship definitions
- Identifies changes: name, cardinality, inverse name, target types, bidirectional status

**EntityAttributeService.kt** (78 lines) - Attribute schema operations
- `saveAttributeDefinition()` - Adds/updates attributes with schema validation
- `removeAttributeDefinition()` - Removes attributes from schema
- Performs breaking change detection before modifying schema

**EntityService.kt** (221 lines) - Entity instance management
- Create, read, update entities with schema validation
- Delegates to EntityValidationService for payload validation
- Records activity logs for audit trail

**EntityValidationService.kt** (232 lines) - Schema validation
- `validateEntity()` - Validates entity payload against entity type schema
- `validateRelationshipEntity()` - Validates relationship constraints (TODO: incomplete)
- `detectSchemaBreakingChanges()` - Identifies incompatible schema changes
- `validateExistingEntitiesAgainstNewSchema()` - Impact analysis on live data

#### Block System Services

**BlockEnvironmentService.kt** (674 lines) - Block tree orchestration
- `saveBlockEnvironment()` - Batch block operations with transactional safety
- Supports operations: ADD, MOVE, REMOVE, REORDER, UPDATE
- Cascade deletion handling
- Operation normalization and deduplication
- Layout snapshot management
- ID mapping for block references

**BlockService.kt** (346 lines) - Block instance management
- `createBlock()` - Creates block with payload validation
- Block CRUD operations
- Parent-child link management via BlockChildrenService
- Enforces nesting rules from BlockType

**BlockTypeService.kt** (240 lines) - Block type versioning
- `publishBlockType()` - Creates new block type (immutable)
- `updateBlockType()` - Creates new version with copy-on-write pattern
- System vs. organization block type handling
- Activity logging for audit trail

**BlockChildrenService.kt** (440 lines) - Hierarchy management
- `listChildren()` - Returns ordered children
- `getChildrenForBlocks()` - Batch fetch children
- `addChild()` - Creates parent-child link with validation
- `moveChild()` - Reparents block
- `reorderChildren()` - Updates order indices
- `cascadeRemove()` - Deletes block and all descendants
- Validates nesting constraints from parent BlockType

**BlockReferenceHydrationService.kt** (143 lines) - Reference resolution
- `hydrateBlockReferences()` - Resolves entity/block references in batch
- Handles EntityReferenceMetadata (links to entities)
- Handles BlockReferenceMetadata (links to block trees)
- Batch fetching for performance

**BlockTreeLayoutService.kt** (90 lines) - Grid layout persistence
- `fetchLayoutById()` - Retrieves layout by ID
- `fetchLayoutForEntity()` - Gets entity's layout
- `updateLayoutSnapshot()` - Persists layout changes
- `extractBlockIdsFromTreeLayout()` - Extracts all block IDs from layout tree

#### Cross-Cutting Services

**SchemaService.kt** (368 lines) - JSON Schema validation
- Uses networknt JSON Schema validator (SpecVersion.V201909)
- `validate()` - Validates payload with ValidationScope (NONE, SOFT, STRICT)
- `validateOrThrow()` - Throws on validation errors in STRICT mode
- Recursive custom validation checks
- Supports field format validation (dates, URIs, etc.)

**AuthTokenService.kt** (67 lines) - JWT extraction
- `getUserId()` - Extracts user ID from JWT "sub" claim
- `getUserEmail()` - Extracts email from JWT claims
- `getAllClaims()` - Returns all JWT claims
- `getCurrentUserAuthorities()` - Gets user authorities for RBAC

**ActivityService.kt** (82 lines) - Activity logging
- `logActivity()` - Records single activity with details
- `logActivities()` - Batch records multiple activities
- Supports flexible JSON details for rich audit trails

**OrganisationService.kt** (332 lines) - Organization lifecycle
- `getOrganisationById()` - Retrieves org with optional metadata
- `createOrganisation()` - Creates org and adds creator as first member
- `updateOrganisation()` - Updates org properties
- Member management and role assignment

### 3.3 Service Dependency Graph

#### Entity System Dependencies

```
EntityTypeService
├── EntityRelationshipService (bidirectional relationship management)
├── EntityAttributeService (attribute schema operations)
├── EntityTypeRelationshipDiffService (diff computation)
├── EntityTypeRelationshipImpactAnalysisService (impact analysis)
├── EntityRepository (data access)
├── AuthTokenService (JWT extraction)
└── ActivityService (audit logging)

EntityService
├── EntityTypeService (schema access)
├── EntityValidationService (payload validation)
├── EntityRepository (data access)
├── AuthTokenService (JWT extraction)
└── ActivityService (audit logging)

EntityValidationService
├── SchemaService (JSON Schema validation)
└── EntityRelationshipRepository (relationship validation)
```

#### Block System Dependencies

```
BlockEnvironmentService
├── BlockService (block CRUD)
├── BlockTreeLayoutService (layout management)
├── BlockReferenceHydrationService (reference resolution)
├── BlockChildrenService (hierarchy management)
├── BlockTreeLayoutRepository (layout persistence)
├── AuthTokenService (JWT extraction)
└── ActivityService (audit logging)

BlockService
├── BlockTypeService (type validation)
├── BlockChildrenService (parent-child links)
├── SchemaService (payload validation)
├── AuthTokenService (JWT extraction)
└── ActivityService (audit logging)

BlockChildrenService
├── BlockRepository (block loading)
├── BlockChildrenRepository (edge management)

BlockReferenceHydrationService
├── EntityService (entity references)
└── BlockService (block references)
```

## 4. Domain Models (DTOs)

### 4.1 Entity System Models

**EntityType** - Mutable schema definition
```kotlin
data class EntityType(
    val id: UUID,
    val key: String,                    // Unique identifier within org
    val version: Int,                   // Schema version counter
    val schema: EntityTypeSchema,       // JSON Schema with UUID keys
    val relationships: List<EntityRelationshipDefinition>?,
    val name: DisplayName,              // Human-readable name
    val icon: Icon?,
    val identifierKey: UUID,            // Points to unique attribute
    val protected: Boolean,             // System types can't be deleted
    val order: List<EntityTypeOrderingKey>,  // Column display order
    val entitiesCount: Long,            // Denormalized entity count
    // Audit fields: createdAt, updatedAt, createdBy, updatedBy
)
```

**EntityRelationshipDefinition** - Defines relationships between types
```kotlin
data class EntityRelationshipDefinition(
    val id: UUID,
    val name: String,                   // Human-readable label
    val relationshipType: EntityTypeRelationshipType,  // ORIGIN or REFERENCE
    val sourceEntityTypeKey: String,    // Links to source entity type
    val originRelationshipId: UUID?,    // For REFERENCE types
    val entityTypeKeys: List<String>?,  // Allowed entity type keys
    val allowPolymorphic: Boolean,      // Can link to any entity type
    val required: Boolean,              // Enforced on RELATIONSHIP entity types
    val cardinality: EntityRelationshipCardinality,
    val bidirectional: Boolean,         // Whether relationship is bidirectional
    val bidirectionalEntityTypeKeys: List<String>?,  // Subset for bidirectional
    val inverseName: String?,           // Default naming for inverse
    val protected: Boolean,             // Can't be deleted if set
    // Audit fields
)
```

**Entity** - Instance data
```kotlin
data class Entity(
    val id: UUID,
    val entityType: EntityType,
    val typeVersion: Int,               // Schema version at creation
    val payload: JsonObject,            // JSONB validated against schema
    val validationErrors: List<String>?,
    // Audit fields
)
```

### 4.2 Relationship Analysis Models

**EntityTypeRelationshipDiff** - Compares old vs. new states
```kotlin
data class EntityTypeRelationshipDiff(
    val added: List<SaveRelationshipDefinitionRequest>,
    val removed: List<EntityTypeRelationshipDeleteRequest>,
    val modified: List<EntityTypeRelationshipModification>
)
```

**EntityTypeRelationshipImpactAnalysis** - Impact of relationship changes
```kotlin
data class EntityTypeRelationshipImpactAnalysis(
    val affectedEntityTypes: List<String>,      // Types impacted
    val dataLossWarnings: List<EntityTypeRelationshipDataLossWarning>,
    val columnsRemoved: List<EntityImpactSummary>,
    val columnsModified: List<EntityImpactSummary>
)
```

**EntityTypeRelationshipModification** - What changed
```kotlin
data class EntityTypeRelationshipModification(
    val previous: EntityRelationshipDefinition,  // Old state
    val updated: EntityRelationshipDefinition,   // New state
    val changes: Set<EntityTypeRelationshipChangeType>
)
```

### 4.3 Block System Models

**BlockType** - Immutable versioned content schema
```kotlin
data class BlockType(
    val id: UUID,
    val key: String,
    val version: Int,                   // Immutable versioning
    val name: String,
    val sourceId: UUID?,                // Original block type if versioned
    val schema: BlockTypeSchema,        // JSON Schema with String keys
    val nesting: BlockTypeNesting?,     // Defines allowed child types
    val display: BlockDisplay,          // Display and rendering hints
    val strictness: ValidationScope,    // NONE, SOFT, STRICT
    val system: Boolean,                // System vs. org-scoped
    val archived: Boolean,
    // Audit fields
)
```

**Block** - Content instance
```kotlin
data class Block(
    val id: UUID,
    val name: String?,
    val type: BlockType,
    val payload: Metadata,              // Polymorphic: see below
    val archived: Boolean,
    val validationErrors: List<String>?,
    // Audit fields
)
```

**Metadata (Polymorphic Payload)** - Sealed interface
```kotlin
sealed interface Metadata {
    val type: BlockMetadataType
    val readonly: Boolean
    val deletable: Boolean
    val meta: BlockMeta
}

// Three concrete types:
data class BlockContentMetadata(
    val data: JsonObject,
    val listConfig: BlockListConfiguration?,
    // Common fields
)

data class EntityReferenceMetadata(
    val items: List<ReferenceItem>,     // Referenced entity IDs
    val presentation: Presentation,     // SUMMARY, ENTITY, TABLE, GRID, INLINE
    val projection: Projection,         // Field selection
    val fetchPolicy: BlockReferenceFetchPolicy,  // LAZY, EAGER
    // Common fields
)

data class BlockReferenceMetadata(
    val item: ReferenceItem,            // Referenced block ID
    val expandDepth: Int,               // How deep to expand
    val fetchPolicy: BlockReferenceFetchPolicy,
    // Common fields
)
```

**BlockTree** - Complete block hierarchy
```kotlin
data class BlockTree(
    val root: Node                      // Polymorphic: ContentNode or ReferenceNode
)

sealed interface Node {
    val type: NodeType                  // CONTENT or REFERENCE
    val block: Block
    val warnings: List<String>
}

data class ContentNode(
    val children: List<Node>?           // Child nodes
)

data class ReferenceNode(
    val reference: ReferencePayload     // EntityReference or BlockTreeReference
)
```

### 4.4 Schema Model (Generic)

**Schema<T>** - Parameterized schema (UUID for entities, String for blocks)
```kotlin
data class Schema<T>(
    val label: String?,
    val key: SchemaType,
    val type: DataType,                 // OBJECT, ARRAY, STRING, NUMBER, BOOLEAN
    val format: DataFormat?,            // EMAIL, PHONE, DATE, URL, etc.
    val required: Boolean,
    val properties: Map<T, Schema<T>>?, // Nested schemas
    val items: Schema<T>?,              // Array item schema
    val unique: Boolean,
    val protected: Boolean,
    val options: SchemaOptions?         // Constraints, defaults, enums
)
```

**Type Aliases:**
- `EntityTypeSchema = Schema<UUID>` (keys are UUIDs)
- `BlockTypeSchema = Schema<String>` (keys are Strings)

## 5. Development Commands

### Backend

```bash
# Build and test
./gradlew clean build          # Compile, test, assemble JAR
./gradlew test                 # Run JUnit 5 tests only
./gradlew compileKotlin        # Compile Kotlin sources

# Run
./gradlew bootRun              # Start dev server (requires PostgreSQL)

# Database
# Ensure PostgreSQL is running and schema.sql has been executed
# Set environment variables:
#   POSTGRES_DB_JDBC, JWT_AUTH_URL, JWT_SECRET_KEY,
#   SUPABASE_URL, SUPABASE_KEY, ORIGIN_API_URL, SERVER_PORT
```

### OpenAPI Documentation

- **Swagger UI:** http://localhost:8081/docs/swagger-ui.html
- **OpenAPI JSON:** http://localhost:8081/docs/v3/api-docs

## 6. Code Conventions

### 6.1 Kotlin Style

- **Indentation:** 4 spaces (JetBrains Kotlin style)
- **Trailing commas:** Use in multi-line declarations
- **Expression-bodied functions:** Prefer for simple functions
- **Nullable semantics:** Use nullable types (`T?`) over `Optional<T>`

### 6.2 Naming Conventions

- **Classes/Components:** PascalCase (`EntityTypeService`, `BlockEnvironmentService`)
- **Functions/Properties:** camelCase (`publishEntityType`, `relationshipDefinitions`)
- **Constants:** SCREAMING_SNAKE_CASE in `companion object`
- **Package names:** lowercase, feature-oriented (`entity.type`, `block.tree`)

### 6.3 Service Layer Patterns

**Constructor Injection (Required)**
```kotlin
@Service
class EntityTypeService(
    private val entityTypeRepository: EntityTypeRepository,
    private val activityService: ActivityService,
    private val authTokenService: AuthTokenService
) {
    // No field injection, no @Autowired
}
```

**Transactional Boundaries**
```kotlin
@Transactional
fun publishEntityType(request: PublishEntityTypeRequest): EntityType {
    // All database operations in single transaction
}
```

**Service Layer Responsibilities**
- Services contain business logic (validation, orchestration, impact analysis)
- Repositories are thin data access layers (no business logic)
- Controllers delegate to services (thin controllers)

### 6.4 Error Handling

- **Validation Exceptions:** `SchemaValidationException` for payload/schema failures
- **Authorization:** `AccessDeniedException` for org/resource access
- **Not Found:** `NotFoundException` for missing entities
- **State Violations:** `IllegalStateException`, `IllegalArgumentException` for constraints

### 6.5 Testing Conventions

- **Location:** `src/test/kotlin/riven` (mirrors main package structure)
- **Naming:** Test classes suffixed with `Test` (`EntityTypeServiceTest`)
- **Framework:** JUnit 5 + Mockito + Spring Boot Test
- **Database:** H2 in-memory for JPA tests
- **Coverage:** High coverage on service and controller layers

### 6.6 Commit Conventions

- **Imperative mood:** "Add invoice PDF renderer" (not "Added" or "Adds")
- **Concise subjects:** 50 characters or less
- **Group changes:** Related changes in single commit
- **Body text:** Include when context needed (e.g., why, not what)

## 7. Key Domain Concepts & Patterns

### 7.1 Mutable vs. Immutable Pattern

| Aspect | EntityType | BlockType |
|--------|-----------|-----------|
| **Pattern** | Mutable (in-place updates) | Immutable (copy-on-write) |
| **Updates** | Single row updated | New row created with version++ |
| **Schema Keys** | UUID (attribute references) | String (type references) |
| **Version Tracking** | Implicit (version counter) | Explicit (via sourceId link) |
| **Rationale** | Entities need consistent schema evolution | Blocks preserve historical versions |

**Example: EntityType Update**
```kotlin
// Updating an entity type modifies the existing row
entityType.schema = newSchema
entityType.version++
entityTypeRepository.save(entityType)  // UPDATE operation
```

**Example: BlockType Update**
```kotlin
// Updating a block type creates a new version
val newBlockType = blockType.copy(
    id = UUID.randomUUID(),           // New ID
    version = blockType.version + 1,  // Increment version
    sourceId = blockType.id           // Link to original
)
blockTypeRepository.save(newBlockType)  // INSERT operation
```

### 7.2 Bidirectional Relationship Synchronization

**Every relationship has an inverse automatically created and maintained.**

**Relationship Types:**
- **ORIGIN** - Source side of a bidirectional relationship (user-created)
- **REFERENCE** - Inverse side (automatically created/updated by system)

**Flow:**
1. User creates ORIGIN relationship: `Client → Project` (ONE_TO_MANY)
2. System automatically creates REFERENCE: `Project → Client` (MANY_TO_ONE)
3. Cardinality inverses automatically: ONE_TO_MANY ↔ MANY_TO_ONE
4. Changes to ORIGIN cascade to REFERENCE relationships

**Example:**
```kotlin
// User creates: Client → Projects (ONE_TO_MANY)
EntityRelationshipDefinition(
    name = "Projects",
    relationshipType = ORIGIN,
    sourceEntityTypeKey = "client",
    entityTypeKeys = ["project"],
    cardinality = ONE_TO_MANY,
    bidirectional = true,
    inverseName = "Client"
)

// System automatically creates: Project → Client (MANY_TO_ONE)
EntityRelationshipDefinition(
    name = "Client",                    // Uses inverseName from ORIGIN
    relationshipType = REFERENCE,
    sourceEntityTypeKey = "project",
    originRelationshipId = <origin-id>,
    cardinality = MANY_TO_ONE,          // Inverted from ONE_TO_MANY
    bidirectional = true
)
```

**Cardinality Inversion Rules:**
- `ONE_TO_ONE` ↔ `ONE_TO_ONE`
- `ONE_TO_MANY` ↔ `MANY_TO_ONE`
- `MANY_TO_ONE` ↔ `ONE_TO_MANY`
- `MANY_TO_MANY` ↔ `MANY_TO_MANY`

### 7.3 Polymorphic Relationships

**A single relationship can target multiple entity types.**

**Example:**
```kotlin
// Project can be owned by either Client OR Partner
EntityRelationshipDefinition(
    name = "Owner",
    entityTypeKeys = ["client", "partner"],  // Multiple targets
    cardinality = MANY_TO_ONE,
    bidirectional = true
)

// Creates inverse REFERENCE relationships in BOTH:
// - Client → Projects
// - Partner → Projects
```

### 7.4 Relationship Overlap Detection

**Prevents conflicting relationships to the same target entity type.**

**Example of Invalid Overlap:**
```kotlin
// Invalid: Can't have both ONE_TO_ONE and ONE_TO_MANY to same target
Client → Project (ONE_TO_ONE)   // First relationship
Client → Project (ONE_TO_MANY)  // Error: Overlap detected!
```

**Validation in EntityRelationshipService:**
- Checks for duplicate relationships (same source, target, cardinality)
- Checks for incompatible cardinality combinations
- Checks for naming collisions within entity type

### 7.5 Impact Analysis Flow

**When modifying/deleting relationships, impact analysis prevents data loss.**

**Flow:**
1. User initiates schema change (modify/delete relationship)
2. Service performs dry-run via `EntityTypeRelationshipImpactAnalysisService.analyze()`
3. If impact detected (data loss warnings, affected entities):
   - Return `409 Conflict` with impact details
   - Frontend displays warnings to user
4. User confirms understanding of consequences
5. Service applies change with `impactConfirmed=true` flag
6. Backend proceeds with destructive operation

**Impact Analysis Triggers:**
- Cardinality changes (e.g., MANY_TO_MANY → ONE_TO_ONE may delete relationships)
- Target entity type removal from polymorphic relationship
- Bidirectional relationship removal
- Entire relationship deletion

**Note:** Impact analysis service is currently stubbed (returns empty analysis). Full implementation is TODO.

### 7.6 Block Environment Operations

**BlockEnvironmentService orchestrates batch operations on block trees.**

**Operation Types:**
- `ADD` - Add new block to tree
- `MOVE` - Change parent or reorder within parent
- `REMOVE` - Delete block (cascade to children)
- `REORDER` - Update order indices of siblings
- `UPDATE` - Modify block payload

**Transaction Flow:**
```kotlin
fun saveEnvironment(request: BlockEnvironmentRequest): SaveEnvironmentResponse {
    // 1. Validate all operations (nesting, references, etc.)
    // 2. Start transaction
    // 3. Execute operations in order (ADD, MOVE, REMOVE, UPDATE, REORDER)
    // 4. Update block_children links
    // 5. Save layout if provided
    // 6. Commit transaction
    // 7. Return updated tree
}
```

**Cascade Deletion:**
- Deleting parent block automatically deletes all descendants
- Handled by `BlockChildrenService.cascadeRemove()`
- Uses recursive tree traversal

### 7.7 Block Hydration (Reference Resolution)

**Blocks with references (EntityReferenceMetadata, BlockReferenceMetadata) need hydration.**

**Flow:**
```kotlin
fun hydrateBlocks(rootBlockId: UUID): BlockTree {
    // 1. Fetch root block + all descendants
    // 2. For each EntityReferenceMetadata block:
    //    - Fetch referenced entities
    //    - Merge entity data into block payload
    // 3. For each BlockReferenceMetadata block:
    //    - Fetch referenced block tree
    //    - Merge block tree into current tree
    // 4. Build hierarchical tree structure
    // 5. Return BlockTree with all data resolved
}
```

**Fetch Policies:**
- `LAZY` - Fetch references only when explicitly requested
- `EAGER` - Fetch references immediately during hydration

### 7.8 Nesting Validation

**BlockTypes define allowed child types and constraints.**

```kotlin
data class BlockTypeNesting(
    val max: Int?,                      // Maximum children allowed
    val allowedTypes: List<String>      // List of allowed block type keys
)
```

**Validation:**
- Before creating parent-child link, check parent's nesting rules
- If child type not in allowedTypes, reject operation
- If max children exceeded, reject operation

### 7.9 Activity Logging (Audit Trail)

**All major operations log activities for audit trail.**

```kotlin
activityService.logActivity(
    userId = userId,
    organisationId = organisationId,
    entityType = ApplicationEntityType.ENTITY_RELATIONSHIP,
    operation = OperationType.CREATE,
    details = mapOf(
        "relationshipId" to relationshipId,
        "name" to relationshipName,
        "cardinality" to cardinality,
        "bidirectional" to bidirectional,
        "targetEntityTypes" to targetEntityTypes
    )
)
```

**Activity Types:**
- `ENTITY_TYPE`, `ENTITY`, `BLOCK_TYPE`, `BLOCK`, `ENTITY_RELATIONSHIP`, etc.

**Operation Types:**
- `CREATE`, `UPDATE`, `DELETE`

## 8. Database Schema Highlights

### 8.1 Entity Tables

**entity_types**
- **Pattern:** Mutable (single row per type, updated in-place)
- **Unique Constraint:** `(organisation_id, key)`
- **JSONB Columns:** `schema`, `relationships`, `column_order`
- **Denormalized:** `count` field (updated via triggers)
- **Foreign Key:** `ON DELETE RESTRICT` if entities exist

**entities**
- **References:** `entity_types` with `ON DELETE RESTRICT`
- **JSONB Column:** `payload` (validated against schema)
- **Version Tracking:** `type_version` (schema version at creation)
- **Soft Delete:** Moved to `archived_entities` table

**entity_relationships**
- **Links:** `source_entity_id` → `target_entity_id`
- **References:** `relationship_key` (from EntityRelationshipDefinition)

### 8.2 Block Tables

**block_types**
- **Pattern:** Immutable (new version = new row)
- **Unique Constraint:** `(organisation_id, key, version)`
- **JSONB Columns:** `schema`, `display_structure`, `nesting`
- **Version Tracking:** `source_id` (links to original type)
- **System Types:** `organisation_id IS NULL`

**blocks**
- **References:** `block_types` (foreign key)
- **JSONB Column:** `payload` (polymorphic: content, entity refs, block refs)
- **Soft Delete:** `archived` flag

**block_children**
- **Parent-Child Links:** `parent_id` → `child_id`
- **Unique Constraint:** `child_id` (block has only one parent)
- **Order Management:** `order_index` (maintains child order)
- **Cascade Delete:** On parent removal

**block_tree_layouts**
- **Stores:** Gridstack layouts bound to entities
- **JSONB Column:** `layout` (grid configuration)
- **Foreign Key:** `entities` table

### 8.3 Row-Level Security (RLS)

PostgreSQL RLS enforces multi-tenancy:
```sql
CREATE POLICY "Users can view their own organisations" on organisations
    FOR SELECT
    TO authenticated
    USING (
        id IN (SELECT organisation_id
               FROM organisation_members
               WHERE user_id = auth.uid())
    );
```

## 9. Critical Development Gotchas

### 9.1 Mutable vs. Immutable
- **EntityTypes** are mutable (updated in-place) - DON'T create new versions
- **BlockTypes** are immutable (copy-on-write) - ALWAYS create new versions

### 9.2 Bidirectional Relationships
- Creating relationship A→B automatically creates B→A inverse
- Deleting ORIGIN relationship must cascade delete REFERENCE relationships
- Cardinality changes must update inverse cardinality

### 9.3 Impact Analysis Required
- Always analyze impact before destructive entity schema changes
- Return `409 Conflict` if impact detected
- Require `impactConfirmed=true` flag to proceed

### 9.4 Foreign Key Constraints
- Can't delete entity type if entities exist (`ON DELETE RESTRICT`)
- Must delete all entities first, or handle cascade properly

### 9.5 Schema Validation
- Entity payload validated against `EntityTypeSchema` (JSON Schema Draft 2019-09)
- Block payload validated against `BlockTypeSchema`
- Validation strictness: NONE (allow invalid), SOFT (warn), STRICT (reject)

### 9.6 Transaction Boundaries
- `BlockEnvironmentService.saveEnvironment()` is transactional
- Failure rolls back ALL operations (atomic batch)
- Don't mix transactional and non-transactional operations

### 9.7 Polymorphic Relationships
- Single relationship can target multiple entity types
- Creates inverse relationships in ALL target types
- Removing one target doesn't affect others

### 9.8 Denormalized Counts
- `entity_types.count` updated via database triggers
- Don't manually update count field
- Trigger fires on entity INSERT/DELETE

### 9.9 Naming Collisions
- Relationship names must be unique within entity type
- `EntityRelationshipService.resolveNameCollision()` handles auto-naming
- Pattern: "Inverse Name" → "Inverse Name 2" → "Inverse Name 3"

### 9.10 TODO/Incomplete Features
- `EntityValidationService.validateRelationshipEntity()` - Stub
- `EntityTypeRelationshipImpactAnalysisService.analyze()` - Returns empty (stub)
- Cardinality change data migration - TODO
- Bidirectional relationship data cleanup on deletion - TODO

## 10. Critical Files Reference

### Entity System (Backend)
- `service/entity/type/EntityRelationshipService.kt` (1,368 lines) - **MOST COMPLEX**
- `service/entity/type/EntityTypeService.kt` (486 lines)
- `service/entity/type/EntityTypeRelationshipImpactAnalysisService.kt` (199 lines)
- `service/entity/type/EntityTypeRelationshipDiffService.kt` (45 lines)
- `service/entity/type/EntityAttributeService.kt` (78 lines)
- `service/entity/EntityService.kt` (221 lines)
- `service/entity/EntityValidationService.kt` (232 lines)
- `models/entity/EntityType.kt`
- `models/entity/Entity.kt`
- `models/entity/configuration/EntityRelationshipDefinition.kt`
- `models/entity/relationship/analysis/` (6 files)

### Block System (Backend)
- `service/block/BlockEnvironmentService.kt` (674 lines) - **ORCHESTRATION**
- `service/block/BlockService.kt` (346 lines)
- `service/block/BlockTypeService.kt` (240 lines)
- `service/block/BlockChildrenService.kt` (440 lines)
- `service/block/BlockReferenceHydrationService.kt` (143 lines)
- `service/block/BlockTreeLayoutService.kt` (90 lines)
- `models/block/Block.kt`
- `models/block/BlockType.kt`
- `models/block/BlockEnvironment.kt`
- `models/block/metadata/` (8 files)
- `models/block/tree/` (3 files)

### Common/Supporting
- `service/schema/SchemaService.kt` (368 lines)
- `service/auth/AuthTokenService.kt` (67 lines)
- `service/activity/ActivityService.kt` (82 lines)
- `service/organisation/OrganisationService.kt` (332 lines)
- `models/common/validation/Schema.kt`
- `schema.sql` (568 lines) - **AUTHORITATIVE DATABASE SCHEMA**
- `build.gradle.kts` - Gradle configuration
- `application.yml` - Spring Boot configuration

## 11. Maintenance

When making significant changes, update this file:
- **New dependencies** → Update Tech Stack section
- **New services** → Update Architecture section
- **New patterns** → Update Key Domain Concepts section
- **New gotchas** → Add to Critical Development Gotchas section
- **Breaking changes** → Document in relevant sections

Keep this file accurate and concise - it's the primary backend reference for development.
