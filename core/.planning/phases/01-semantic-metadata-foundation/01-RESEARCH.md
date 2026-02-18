# Phase 1: Semantic Metadata Foundation - Research

**Researched:** 2026-02-18
**Domain:** Spring Boot 3.5.3 / Kotlin JPA entity extension, PostgreSQL schema, workspace-scoped REST API
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Metadata richness
- Core fields as defined in success criteria: semantic definition (entity types), semantic type classification + description (attributes), semantic context (relationships)
- Add tags/keywords as a shared extra field across all three metadata targets (entity types, attributes, relationships)
- Tags are free-form string arrays — no workspace-level vocabulary management in this phase
- All three targets share the same field set (definition/description + tags) — one metadata shape, not tailored per target

#### API response shape
- Semantic metadata is NOT inline in entity type responses by default
- Available via `?include=semantics` query parameter on entity type endpoints — opt-in
- Dedicated endpoints live under a new `KnowledgeController` at `/api/v1/knowledge/...`, not as sub-routes on existing controllers
- Metadata updates use full replacement (PUT), not partial updates (PATCH)
- Provide both individual and bulk endpoints — bulk endpoint for setting metadata on multiple attributes at once (needed for template installation in Phase 2)

#### Classification system
- Strict enum with 6 predefined values only: `identifier`, `categorical`, `quantitative`, `temporal`, `freetext`, `relational_reference`
- API rejects unknown classification values with 400
- Classification is optional (nullable) — users can set description/tags first and classify later
- No endpoint to list valid classification values — clients hardcode the enum

#### Metadata lifecycle
- Auto-create empty metadata records when entity types, attributes, or relationships are created — guarantees 1:1 relationship
- Cascade soft-delete metadata when parent entity type is soft-deleted — restoring entity type restores metadata
- Hard-delete attribute/relationship metadata when the attribute or relationship is removed — no orphans
- Skip activity logging for metadata mutations — metadata edits are frequent during setup and low-impact

### Claude's Discretion
- Database table structure (single table vs multiple, column types, indexes)
- JPA entity design and mapping approach
- Endpoint URL structure within `/api/v1/knowledge/`
- Error response format for validation failures
- How `?include=semantics` is implemented (join fetch, separate query, etc.)

### Deferred Ideas (OUT OF SCOPE)
- Custom/extensible classification values beyond the predefined 6 — revisit if users need domain-specific types
- Tag vocabulary management (workspace-level tag lists, autocomplete, deduplication) — future phase
- Activity logging for metadata mutations — reconsider when usage patterns are clearer
</user_constraints>

---

## Summary

This phase adds a semantic metadata layer on top of the existing entity type system. The existing `entity_types` table stores schema as JSONB — attributes and relationships are embedded within that JSONB. Semantic metadata is stored in a **new separate table** (`entity_type_semantic_metadata`) to keep entity CRUD queries clean, using a discriminator approach (a `target_type` column + `target_id`) to cover entity types, attributes, and relationships in a single table. This avoids three separate tables while maintaining the one-metadata-shape design decision.

The implementation touches three code layers: (1) a new SQL schema file in `db/schema/01_tables/`, (2) a new JPA entity + repository + service in the existing `entity` domain, and (3) a new `KnowledgeController` in `controller/`. All patterns follow the established Spring Boot / Kotlin conventions documented in CLAUDE.md: constructor injection, data classes, `@PreAuthorize` on service methods, `toModel()` mapping, and `ServiceUtil.findOrThrow`.

The `?include=semantics` parameter on entity type endpoints is implemented as a separate follow-up query — the existing `EntityTypeService` methods return domain models unmodified, and the controller passes a flag down to decide whether to attach metadata. The `KnowledgeController` owns direct CRUD for metadata records.

**Primary recommendation:** Single `entity_type_semantic_metadata` table with `target_type` enum discriminator covering entity-type, attribute, and relationship targets; one JPA entity; one service; one controller. Auto-create metadata records via service hooks called from `EntityTypeService.publishEntityType` (and the attribute/relationship save operations).

---

## Standard Stack

All libraries are already in the project. No new dependencies required for this phase.

### Core (already in build.gradle.kts)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Spring Data JPA | via Spring Boot 3.5.3 | ORM, repository, auditing | Project standard |
| Hypersistence Utils | 3.9.2 | `@Type(JsonBinaryType::class)` for JSONB arrays (tags) | Already used for all JSONB columns |
| PostgreSQL driver | via Spring Boot | Database driver | Project standard |
| springdoc-openapi | 2.8.6 | Swagger annotations on controller | Project standard |
| kotlin-logging-jvm | 7.0.0 | KLogger injection via LoggerConfig | Project standard |

### Supporting (test only, already present)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Testcontainers PostgreSQL | 2.0.3 | Integration tests with pgvector image | Switch `postgres:16-alpine` to `pgvector/pgvector:pg16` |
| mockito-kotlin | 3.2.0 | Unit test mocking | All service unit tests |
| H2 | via Spring Boot | Unit tests (test profile) | Metadata entity uses standard JPA — H2 compatible |

### New Infrastructure

| Item | Purpose | Notes |
|------|---------|-------|
| `pgvector/pgvector:pg16` Docker image | Integration tests that need `CREATE EXTENSION vector` | Replaces `postgres:16-alpine` in `EntityQueryIntegrationTestBase` companion object |
| `CREATE EXTENSION IF NOT EXISTS vector` | Enable pgvector in PostgreSQL | Add to `db/schema/00_extensions/extensions.sql` |

### No New Dependencies

The tags field (free-form `text[]`) is stored as a JSONB array via Hypersistence `JsonBinaryType`, which is the existing pattern. No new Gradle dependencies are needed.

---

## Architecture Patterns

### Recommended Package Structure

```
src/main/kotlin/riven/core/
├── entity/entity/
│   └── EntityTypeSemanticMetadataEntity.kt   # new JPA entity
├── models/entity/
│   └── EntityTypeSemanticMetadata.kt          # new domain model
├── enums/entity/
│   └── SemanticMetadataTargetType.kt          # ENTITY_TYPE | ATTRIBUTE | RELATIONSHIP
│   └── SemanticAttributeClassification.kt    # identifier | categorical | ...
├── repository/entity/
│   └── EntityTypeSemanticMetadataRepository.kt # new JPA repo
├── service/entity/
│   └── EntityTypeSemanticMetadataService.kt   # new service
└── controller/
    └── knowledge/
        └── KnowledgeController.kt              # new controller
```

```
db/schema/
├── 00_extensions/
│   └── extensions.sql         # add CREATE EXTENSION IF NOT EXISTS vector
└── 01_tables/
    └── entity_semantic_metadata.sql   # new table file
```

### Pattern 1: Single Table with Target Discriminator

**What:** One `entity_type_semantic_metadata` table covers all three metadata targets (entity types, attributes, relationships) via a `target_type` column and `target_id` column. `entity_type_id` is always present as a FK for cascade soft-delete.

**When to use:** When all targets share an identical field shape (confirmed by locked decision: "one metadata shape, not tailored per target").

**SQL schema:**
```sql
-- Source: db/schema/01_tables/entity_semantic_metadata.sql (new file)
CREATE TABLE IF NOT EXISTS public.entity_type_semantic_metadata
(
    "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "workspace_id"    UUID    NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    "entity_type_id"  UUID    NOT NULL REFERENCES entity_types (id) ON DELETE CASCADE,
    "target_type"     TEXT    NOT NULL CHECK (target_type IN ('ENTITY_TYPE', 'ATTRIBUTE', 'RELATIONSHIP')),
    "target_id"       UUID    NOT NULL,
    -- Shared metadata fields (same shape for all target types)
    "definition"      TEXT,
    "classification"  TEXT    CHECK (classification IN (
                          'identifier', 'categorical', 'quantitative',
                          'temporal', 'freetext', 'relational_reference'
                      )),
    "tags"            JSONB   NOT NULL DEFAULT '[]'::jsonb,
    -- Soft-delete (follows entity type lifecycle)
    "deleted"         BOOLEAN NOT NULL DEFAULT FALSE,
    "deleted_at"      TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    -- Auditing
    "created_at"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created_by"      UUID,
    "updated_by"      UUID,

    UNIQUE (entity_type_id, target_type, target_id)
);

CREATE INDEX idx_entity_semantic_metadata_workspace
    ON public.entity_type_semantic_metadata (workspace_id);
CREATE INDEX idx_entity_semantic_metadata_entity_type
    ON public.entity_type_semantic_metadata (entity_type_id)
    WHERE deleted = false;
CREATE INDEX idx_entity_semantic_metadata_target
    ON public.entity_type_semantic_metadata (target_type, target_id)
    WHERE deleted = false;
```

**Why `classification` field exists on all targets:** Locked decision says same field shape — the field is nullable so entity types and relationships simply leave it null.

### Pattern 2: JPA Entity — extending AuditableSoftDeletableEntity

**What:** New `EntityTypeSemanticMetadataEntity` data class extending `AuditableSoftDeletableEntity` (same as `EntityTypeEntity`). The `@SQLRestriction("deleted = false")` on the superclass automatically filters deleted records.

```kotlin
// Source: riven.core.entity.entity.EntityTypeSemanticMetadataEntity (new file)
@Entity
@Table(
    name = "entity_type_semantic_metadata",
    indexes = [
        Index(columnList = "workspace_id", name = "idx_esm_workspace_id"),
        Index(columnList = "entity_type_id", name = "idx_esm_entity_type_id"),
    ],
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["entity_type_id", "target_type", "target_id"])
    ]
)
data class EntityTypeSemanticMetadataEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false, columnDefinition = "uuid")
    val workspaceId: UUID,

    @Column(name = "entity_type_id", nullable = false, columnDefinition = "uuid")
    val entityTypeId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    val targetType: SemanticMetadataTargetType,

    @Column(name = "target_id", nullable = false, columnDefinition = "uuid")
    val targetId: UUID,

    @Column(name = "definition", nullable = true)
    var definition: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "classification", nullable = true)
    var classification: SemanticAttributeClassification? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "tags", columnDefinition = "jsonb", nullable = false)
    var tags: List<String> = emptyList(),
) : AuditableSoftDeletableEntity() {

    fun toModel(): EntityTypeSemanticMetadata = EntityTypeSemanticMetadata(
        id = requireNotNull(id),
        workspaceId = workspaceId,
        entityTypeId = entityTypeId,
        targetType = targetType,
        targetId = targetId,
        definition = definition,
        classification = classification,
        tags = tags,
        createdAt = createdAt,
        updatedAt = updatedAt,
        createdBy = createdBy,
        updatedBy = updatedBy,
    )
}
```

### Pattern 3: Enum for Classification (Validated at API Layer)

**What:** `SemanticAttributeClassification` Kotlin enum with 6 values. Spring MVC deserializes this directly from JSON — invalid values produce `HttpMessageNotReadableException` which the global `@ControllerAdvice` catches as a 400 via `IllegalArgumentException`.

```kotlin
// Source: riven.core.enums.entity.SemanticAttributeClassification (new file)
enum class SemanticAttributeClassification {
    identifier,
    categorical,
    quantitative,
    temporal,
    freetext,
    relational_reference
}
```

**Note on Jackson enum deserialization:** By default Jackson is case-sensitive for enum names. Use lowercase enum names that match the API contract exactly. The `ObjectMapperConfig` in this project does not enable `ACCEPT_CASE_INSENSITIVE_ENUMS` — do not change global ObjectMapper config. Instead, use lowercase enum constant names matching the wire format.

### Pattern 4: `?include=semantics` Implementation

**What:** The existing `EntityTypeController` endpoints accept an optional `@RequestParam include: List<String> = emptyList()`. When `"semantics"` is present, the controller calls an overloaded service method (or passes a flag) that performs a second query to attach `EntityTypeSemanticMetadata` to the response.

**Implementation strategy (separate query, not join fetch):** Prefer a separate query over join fetch. The metadata table has one row per target — a LEFT JOIN on the entity type list query would produce N rows for entity types with attributes/relationships. A separate lookup by `entity_type_id IN (...)` after fetching entity types is simpler and correct.

```kotlin
// In EntityTypeController (modification)
@GetMapping("workspace/{workspaceId}")
fun getEntityTypesForWorkspace(
    @PathVariable workspaceId: UUID,
    @RequestParam(required = false, defaultValue = "") include: List<String>
): ResponseEntity<List<EntityType>> {
    val entityTypes = entityTypeService.getWorkspaceEntityTypes(workspaceId)
    // semantics attachment handled by controller delegating to KnowledgeService
    // ... (see code examples section)
}
```

**Response model:** Introduce `EntityTypeWithSemantics` wrapper or add nullable `semantics` field to `EntityType`. Prefer a separate response wrapper `EntityTypeResponse(entityType: EntityType, semantics: EntityTypeSemanticMetadataBundle?)` to avoid modifying the core `EntityType` domain model.

### Pattern 5: Auto-create Metadata on Entity Type Publish

**What:** When `EntityTypeService.publishEntityType` saves a new entity type, it calls `EntityTypeSemanticMetadataService.initializeForEntityType(entityTypeId, workspaceId)` to create an empty metadata record for the entity type itself. The identifier attribute also gets an empty metadata record for `target_type = ATTRIBUTE`.

**Transactional scope:** The metadata initialization is within the same `@Transactional` method as the entity type save. If metadata creation fails, the entity type save rolls back.

### Pattern 6: KnowledgeController URL Structure

Use the following URL structure under `/api/v1/knowledge/`:

```
GET    /api/v1/knowledge/workspace/{workspaceId}/entity-type/{entityTypeId}
PUT    /api/v1/knowledge/workspace/{workspaceId}/entity-type/{entityTypeId}

GET    /api/v1/knowledge/workspace/{workspaceId}/entity-type/{entityTypeId}/attributes
PUT    /api/v1/knowledge/workspace/{workspaceId}/entity-type/{entityTypeId}/attribute/{attributeId}
PUT    /api/v1/knowledge/workspace/{workspaceId}/entity-type/{entityTypeId}/attributes/bulk

GET    /api/v1/knowledge/workspace/{workspaceId}/entity-type/{entityTypeId}/relationships
PUT    /api/v1/knowledge/workspace/{workspaceId}/entity-type/{entityTypeId}/relationship/{relationshipId}
```

All endpoints include `workspaceId` in path (consistent with existing controllers). The `entity_type_id` FK is used for authorization — verify entity type belongs to workspace before operating on its metadata.

### Anti-Patterns to Avoid

- **Modifying EntityTypeEntity:** Do not add metadata fields to `EntityTypeEntity`. The locked decision and INFRA-06 require a separate table.
- **Three separate metadata tables:** One table with a discriminator is the right call given identical field shapes and simpler service code.
- **Join fetch for `?include=semantics`:** The entity type list queries return many rows; a join would complicate result mapping. Use a separate `findByEntityTypeIdIn` query instead.
- **Catching exceptions in controller:** Never catch-and-wrap. The `@ControllerAdvice` `ExceptionHandler` handles all domain exceptions. `IllegalArgumentException` (from `require()`) maps to 400.
- **.let wrapping entire method body:** CLAUDE.md forbids `authTokenService.getUserId().let { userId -> /* entire body */ }`. Always `val userId = authTokenService.getUserId()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Enum validation of classification values | Custom validator | Kotlin enum + Jackson deserialization | Jackson throws `HttpMessageNotReadableException` on unknown enum values; `@ControllerAdvice` maps to 400 |
| Soft-delete filtering | Manual `WHERE deleted = false` in every query | `AuditableSoftDeletableEntity` + `@SQLRestriction` | Superclass automatically appends the restriction to all JPQL/derived queries |
| UUID generation | `UUID.randomUUID()` in service | `@GeneratedValue(strategy = GenerationType.UUID)` on JPA entity | Consistent with all other entities |
| Audit columns | Manual timestamp/user assignment | `AuditableEntity` + Spring Data JPA auditing | `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy` populate automatically |
| JSONB array storage | Custom serialization for tags | `@Type(JsonBinaryType::class)` with `List<String>` | Hypersistence handles serialization — established pattern in `EntityTypeEntity.schema` |

**Key insight:** Every infrastructure pattern needed for this feature already exists in the codebase. The new code composes existing primitives.

---

## Common Pitfalls

### Pitfall 1: `@SQLRestriction` on Metadata After Soft-Delete of Entity Type

**What goes wrong:** When an entity type is soft-deleted, its metadata records are also soft-deleted (cascade). If the entity type is later restored, the metadata records have `deleted = true` and are invisible to all standard JPA queries due to `@SQLRestriction("deleted = false")`. The restore operation must also un-soft-delete the metadata.

**Why it happens:** `@SQLRestriction` applies to all derived/JPQL queries; deleted metadata becomes permanently invisible until explicitly restored via native SQL.

**How to avoid:** When implementing entity type restore (out of scope for this phase but must not be broken), ensure `EntityTypeSemanticMetadataService` has a `restoreForEntityType(entityTypeId)` method using native SQL to bypass `@SQLRestriction`.

**Warning signs:** Restoring an entity type and finding its metadata empty. Write a test that soft-deletes and then restores, verifying metadata round-trips correctly.

### Pitfall 2: Attribute/Relationship Target IDs Are UUID Keys Inside JSONB

**What goes wrong:** Attributes and relationships are not rows in separate tables — they are entries in the `schema` JSONB and `relationships` JSONB on `entity_types`. Their IDs are `UUID` keys within those JSONB maps. When creating metadata for an attribute, the `target_id` is the attribute's UUID key (from `schema.properties` map), not a foreign key to another table.

**Why it happens:** The entity schema is JSONB-based. Attribute "existence" is implicit — there is no `attributes` table to FK against.

**How to avoid:** The `entity_type_id` FK on `entity_type_semantic_metadata` ensures the parent entity type exists. Attribute/relationship metadata records are hard-deleted (not soft-deleted) when the corresponding attribute/relationship is removed from the JSONB — this must happen in `EntityTypeAttributeService.removeAttributeDefinition` and the relationship removal path.

**Warning signs:** Orphan metadata records for attributes that no longer exist in the schema. Add a cleanup call in the remove methods.

### Pitfall 3: Jackson Enum Deserialization Case Sensitivity

**What goes wrong:** The enum constants are lowercase (`identifier`, `categorical`, etc.) to match the API contract. If a client sends `"Identifier"` or `"IDENTIFIER"`, Jackson throws `HttpMessageNotReadableException`, which bubbles as a 400. This is the desired behavior per the locked decision ("API rejects unknown classification values with 400") but must be confirmed to work correctly.

**Why it happens:** The existing `ObjectMapperConfig` does not enable `ACCEPT_CASE_INSENSITIVE_ENUMS`. Enum constant names must exactly match the wire format.

**How to avoid:** Name enum constants in lowercase exactly matching the spec. Test with an invalid value to verify the 400 response.

**Warning signs:** `HttpMessageNotReadableException` in logs for valid enum values sent with different case.

### Pitfall 4: `entity_type_id` Authorization Check

**What goes wrong:** `KnowledgeController` receives `entityTypeId` in the path. A user could supply any `entityTypeId` — must verify it belongs to the target workspace before operating on its metadata.

**Why it happens:** `@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")` verifies the user has workspace access, but not that the entity type belongs to that workspace. The service must also verify `entityType.workspaceId == workspaceId` or use a repository query that filters by both.

**How to avoid:** In `EntityTypeSemanticMetadataService`, use a repository method `findByEntityTypeIdAndWorkspaceId` for all lookups. This ensures workspace scoping without a separate existence check.

**Warning signs:** A user can read/write metadata for entity types in other workspaces.

### Pitfall 5: H2 Compatibility for Tags Field

**What goes wrong:** Unit tests use H2 in PostgreSQL compat mode. `@Type(JsonBinaryType::class)` with `List<String>` serializes to JSONB in PostgreSQL but stores as text in H2. Hypersistence Utils supports H2 for `JsonBinaryType` but requires H2 >= 2.x.

**Why it happens:** The existing codebase uses H2 for unit tests (application-test.yml: `ddl-auto: create-drop`) and the existing JSONB fields work fine. Tags follow the same pattern — it should work, but confirm no `columnDefinition = "jsonb"` issues in H2 mode.

**How to avoid:** Follow the exact same pattern as `EntityTypeEntity.schema` (already uses `@Type(JsonBinaryType::class)` + `columnDefinition = "jsonb"`). If H2 has issues, the integration profile (pgvector image) is the fallback for metadata-specific tests.

**Warning signs:** H2 test failures with `Unknown data type: "JSONB"`.

### Pitfall 6: pgvector Extension in Integration Tests

**What goes wrong:** INFRA-01 requires `CREATE EXTENSION IF NOT EXISTS vector`. The existing integration test base class uses `postgres:16-alpine` which does NOT include pgvector. Tests that trigger the extension creation SQL will fail.

**Why it happens:** `pgvector/pgvector:pg16` is a separate Docker image with the extension pre-installed.

**How to avoid:** Change the Testcontainers image in `EntityQueryIntegrationTestBase` companion object from `postgres:16-alpine` to `pgvector/pgvector:pg16`. The extension is then enabled via SQL in the database initialization script or via JDBC after container startup. The `asCompatibleSubstituteFor("postgres")` call is required for Testcontainers to accept the image.

**Warning signs:** `ERROR: extension "vector" is not available` during integration tests.

---

## Code Examples

Verified patterns from official sources (codebase inspection):

### Auto-create Metadata on Entity Type Create

```kotlin
// Source: riven.core.service.entity.type.EntityTypeService.publishEntityType (modification)
@Transactional
@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
fun publishEntityType(workspaceId: UUID, request: CreateEntityTypeRequest): EntityType {
    val userId = authTokenService.getUserId()   // val at top, never .let { userId -> }
    val primaryId: UUID = UUID.randomUUID()

    val savedEntity = entityTypeRepository.save(
        EntityTypeEntity(/* ... existing fields ... */)
    )

    // Auto-create metadata for entity type and its initial identifier attribute
    val entityTypeId = requireNotNull(savedEntity.id)
    semanticMetadataService.initializeForEntityType(
        entityTypeId = entityTypeId,
        workspaceId = workspaceId,
        attributeIds = listOf(primaryId)
    )

    activityService.log(/* ... existing activity log ... */)
    return savedEntity.toModel()
}
```

### Repository Pattern (matches EntityTypeRepository)

```kotlin
// Source: riven.core.repository.entity.EntityTypeSemanticMetadataRepository (new file)
interface EntityTypeSemanticMetadataRepository : JpaRepository<EntityTypeSemanticMetadataEntity, UUID> {

    // Used by KnowledgeController for single-target reads
    fun findByEntityTypeIdAndTargetTypeAndTargetId(
        entityTypeId: UUID,
        targetType: SemanticMetadataTargetType,
        targetId: UUID
    ): Optional<EntityTypeSemanticMetadataEntity>

    // Used for ?include=semantics — fetch all metadata for a batch of entity types
    fun findByEntityTypeIdIn(entityTypeIds: List<UUID>): List<EntityTypeSemanticMetadataEntity>

    // Used for cleanup when attribute/relationship is removed (hard delete)
    @Modifying
    @Query("DELETE FROM EntityTypeSemanticMetadataEntity e WHERE e.entityTypeId = :entityTypeId AND e.targetType = :targetType AND e.targetId = :targetId")
    fun deleteByEntityTypeIdAndTargetTypeAndTargetId(
        entityTypeId: UUID,
        targetType: SemanticMetadataTargetType,
        targetId: UUID
    )

    // Used for bulk attribute metadata reads
    fun findByEntityTypeIdAndTargetType(
        entityTypeId: UUID,
        targetType: SemanticMetadataTargetType
    ): List<EntityTypeSemanticMetadataEntity>
}
```

### Service Structure (matches CLAUDE.md section comment style)

```kotlin
// Source: riven.core.service.entity.EntityTypeSemanticMetadataService (new file)
@Service
class EntityTypeSemanticMetadataService(
    private val repository: EntityTypeSemanticMetadataRepository,
    private val entityTypeRepository: EntityTypeRepository,
    private val authTokenService: AuthTokenService,
    private val logger: KLogger,
) {

    // ------ Public read operations ------

    /** Get semantic metadata for a single entity type. */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getForEntityType(workspaceId: UUID, entityTypeId: UUID): EntityTypeSemanticMetadata { ... }

    /** Get all attribute metadata for an entity type. */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getAttributeMetadata(workspaceId: UUID, entityTypeId: UUID): List<EntityTypeSemanticMetadata> { ... }

    /** Get all relationship metadata for an entity type. */
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun getRelationshipMetadata(workspaceId: UUID, entityTypeId: UUID): List<EntityTypeSemanticMetadata> { ... }

    // ------ Public mutations ------

    /** Replace semantic metadata for a single target (PUT semantics). */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun upsertMetadata(
        workspaceId: UUID,
        entityTypeId: UUID,
        targetType: SemanticMetadataTargetType,
        targetId: UUID,
        request: SaveSemanticMetadataRequest
    ): EntityTypeSemanticMetadata { ... }

    /** Bulk replace metadata for multiple attribute targets. */
    @Transactional
    @PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")
    fun bulkUpsertAttributeMetadata(
        workspaceId: UUID,
        entityTypeId: UUID,
        requests: List<BulkSaveSemanticMetadataRequest>
    ): List<EntityTypeSemanticMetadata> { ... }

    // ------ Internal helpers (called from EntityTypeService) ------

    /** Auto-create empty metadata records for a new entity type + its initial attributes. */
    fun initializeForEntityType(entityTypeId: UUID, workspaceId: UUID, attributeIds: List<UUID>) { ... }

    /** Hard-delete metadata record for a removed attribute/relationship. */
    fun deleteForTarget(entityTypeId: UUID, targetType: SemanticMetadataTargetType, targetId: UUID) { ... }

    /** Soft-delete all metadata for an entity type (called on entity type soft-delete). */
    fun softDeleteForEntityType(entityTypeId: UUID) { ... }
}
```

### KnowledgeController Pattern (matches EntityTypeController)

```kotlin
// Source: riven.core.controller.knowledge.KnowledgeController (new file)
@RestController
@RequestMapping("/api/v1/knowledge")
@Tag(name = "knowledge")
class KnowledgeController(
    private val semanticMetadataService: EntityTypeSemanticMetadataService
) {

    @GetMapping("/workspace/{workspaceId}/entity-type/{entityTypeId}")
    @Operation(summary = "Get semantic metadata for an entity type")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Metadata retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Unauthorized"),
        ApiResponse(responseCode = "404", description = "Entity type not found")
    )
    fun getEntityTypeMetadata(
        @PathVariable workspaceId: UUID,
        @PathVariable entityTypeId: UUID
    ): ResponseEntity<EntityTypeSemanticMetadata> {
        val metadata = semanticMetadataService.getForEntityType(workspaceId, entityTypeId)
        return ResponseEntity.ok(metadata)
    }

    @PutMapping("/workspace/{workspaceId}/entity-type/{entityTypeId}")
    @Operation(summary = "Set semantic metadata for an entity type (full replacement)")
    fun setEntityTypeMetadata(
        @PathVariable workspaceId: UUID,
        @PathVariable entityTypeId: UUID,
        @RequestBody request: SaveSemanticMetadataRequest
    ): ResponseEntity<EntityTypeSemanticMetadata> {
        val metadata = semanticMetadataService.upsertMetadata(
            workspaceId, entityTypeId, SemanticMetadataTargetType.ENTITY_TYPE, entityTypeId, request
        )
        return ResponseEntity.ok(metadata)
    }
    // ... other endpoints following same pattern
}
```

### Testcontainers pgvector Image Switch

```kotlin
// Source: EntityQueryIntegrationTestBase companion object (modification)
companion object {
    @JvmStatic
    val postgres: PostgreSQLContainer<*> = PostgreSQLContainer(
        DockerImageName.parse("pgvector/pgvector:pg16")
            .asCompatibleSubstituteFor("postgres")
    )
        .withDatabaseName("riven_test")
        .withUsername("test")
        .withPassword("test")
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `ankane/pgvector` Docker image | `pgvector/pgvector:pg16` official image | `ankane/pgvector` is deprecated; `pgvector/pgvector` is the official maintained image from the pgvector project |
| Metadata inline in entity JSONB | Separate `entity_type_semantic_metadata` table | Required by INFRA-06 to avoid polluting entity type CRUD queries |

---

## Open Questions

1. **Should `?include=semantics` attach metadata to all targets (entity type + all attributes + all relationships) or only entity-type-level metadata?**
   - What we know: The locked decision says metadata is "available via `?include=semantics` on entity type endpoints"
   - What's unclear: Whether the enriched response includes just entity-type metadata or also all attribute/relationship metadata in a nested structure
   - Recommendation: Return a bundle: `{ entityType: EntityType, semantics: EntityTypeSemanticMetadataBundle { entityTypeMetadata, attributeMetadata: Map<UUID, EntityTypeSemanticMetadata>, relationshipMetadata: Map<UUID, EntityTypeSemanticMetadata> } }`. This is the most useful form for a client building a semantic editor.

2. **Hard-delete of attribute metadata: where exactly is the hook?**
   - What we know: `EntityTypeAttributeService.removeAttributeDefinition` modifies the JSONB schema on `EntityTypeEntity`. `EntityTypeRelationshipService` handles relationship removal.
   - What's unclear: Whether attribute removal goes through `EntityTypeAttributeService.removeAttributeDefinition` exclusively or has other code paths.
   - Recommendation: Add the `semanticMetadataService.deleteForTarget(...)` call at the end of `EntityTypeAttributeService.removeAttributeDefinition` and the equivalent relationship removal method. These are the canonical deletion paths.

3. **`entity_type_id` for RELATIONSHIP-type targets**
   - What we know: Relationships are stored in the `relationships` JSONB field on `entity_types`. Each relationship definition has an `id: UUID`.
   - What's unclear: For relationship metadata, `entity_type_id` references the entity type that owns the relationship (source). This is unambiguous but should be confirmed before implementation.
   - Recommendation: `entity_type_id` = ID of the owning entity type; `target_id` = relationship definition's `id`. Document this in KDoc.

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection — `EntityTypeEntity.kt`, `EntityTypeService.kt`, `EntityTypeController.kt`, `EntityTypeRepository.kt`, `EntityTypeAttributeService.kt`, `AuditableSoftDeletableEntity.kt`, `AuditableEntity.kt`, `ExceptionHandler.kt`, `ServiceUtil.kt`, `WorkspaceSecurity.kt`
- Codebase inspection — `build.gradle.kts` (library versions), `application.yml` and `application-test.yml` (test profiles), `db/schema/01_tables/entities.sql` (table conventions), `db/schema/README.md` (execution order)
- Codebase inspection — `EntityQueryIntegrationTestBase.kt` (Testcontainers pattern), `BaseServiceTest.kt`, `WithUserPersona.kt` (test infrastructure), `EntityTypeRelationshipServiceTest.kt` (unit test pattern)
- Codebase inspection — `CLAUDE.md` (architecture rules, coding standards, service structure rules)

### Secondary (MEDIUM confidence)

- [Testcontainers pgvector Module](https://testcontainers.com/modules/pgvector/) — verified `pgvector/pgvector:pg16` image name and `asCompatibleSubstituteFor("postgres")` syntax
- [pgvector/pgvector Docker Hub](https://hub.docker.com/r/pgvector/pgvector) — confirmed this is the official maintained image replacing `ankane/pgvector`

### Tertiary (LOW confidence)

- None. All critical findings verified against codebase or official sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in `build.gradle.kts`; no new dependencies needed
- Architecture: HIGH — all patterns directly verified from existing codebase; new code directly mirrors existing patterns
- Pitfalls: HIGH — `@SQLRestriction` behavior, JSONB attribute IDs, and H2 compat all verified from source; pgvector image verified from official docs

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable Spring Boot / stable codebase patterns; pgvector image tag may release newer pg versions)
