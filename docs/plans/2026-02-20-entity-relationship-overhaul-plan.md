# Entity Relationship System Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the JSONB/ORIGIN-REFERENCE relationship system with first-class relational tables, query-time inverse resolution, per-target-type cardinality, and semantic type constraints.

**Architecture:** Two new tables (`relationship_definitions`, `relationship_target_rules`) replace the JSONB `relationships` column on `entity_types`. Bidirectional visibility becomes a query-time resolution instead of materialized REFERENCE definitions. Instance data uses a single row per link with no inverse row storage. Write-time cardinality enforcement validates against target rules.

**Tech Stack:** Kotlin 2.1.21, Spring Boot 3.5.3, Spring Data JPA, PostgreSQL (JSONB + relational), JUnit 5, Mockito-Kotlin

**Design doc:** `docs/plans/2026-02-20-entity-relationship-overhaul-design.md`

---

## Task 1: Database Schema — New Tables

Create the new `relationship_definitions` and `relationship_target_rules` SQL schema files and update the `entity_relationships` table.

**Files:**
- Create: `core/db/schema/01_tables/relationship_definitions.sql`
- Create: `core/db/schema/01_tables/relationship_target_rules.sql`
- Modify: `core/db/schema/01_tables/entities.sql` — remove `type` column and `relationships` JSONB column from `entity_types`; update `entity_relationships` table to drop `source_entity_type_id`, `target_entity_type_id`, rename `relationship_field_id` → `relationship_definition_id`, add FK to `relationship_definitions`
- Modify: `core/db/schema/02_indexes/entity_indexes.sql` — update indexes for renamed columns, add indexes for new tables

**Step 1: Create `relationship_definitions.sql`**

```sql
CREATE TABLE public.relationship_definitions (
    "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "workspace_id"          UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    "source_entity_type_id" UUID NOT NULL REFERENCES public.entity_types(id) ON DELETE CASCADE,
    "name"                  TEXT NOT NULL,
    "icon_type"             TEXT NOT NULL,
    "icon_value"            TEXT NOT NULL,
    "allow_polymorphic"     BOOLEAN NOT NULL DEFAULT FALSE,
    "cardinality_default"   TEXT NOT NULL CHECK (cardinality_default IN ('ONE_TO_ONE','ONE_TO_MANY','MANY_TO_ONE','MANY_TO_MANY')),
    "protected"             BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at"            TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at"            TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "created_by"            UUID,
    "updated_by"            UUID,
    "deleted"               BOOLEAN NOT NULL DEFAULT FALSE,
    "deleted_at"            TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
```

**Step 2: Create `relationship_target_rules.sql`**

```sql
CREATE TABLE public.relationship_target_rules (
    "id"                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "relationship_definition_id" UUID NOT NULL REFERENCES public.relationship_definitions(id) ON DELETE CASCADE,
    "target_entity_type_id"      UUID REFERENCES public.entity_types(id) ON DELETE CASCADE,
    "semantic_type_constraint"   TEXT,
    "cardinality_override"       TEXT CHECK (cardinality_override IN ('ONE_TO_ONE','ONE_TO_MANY','MANY_TO_ONE','MANY_TO_MANY')),
    "inverse_visible"            BOOLEAN NOT NULL DEFAULT FALSE,
    "inverse_name"               TEXT,
    "created_at"                 TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at"                 TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT chk_target_or_semantic CHECK (
        target_entity_type_id IS NOT NULL OR semantic_type_constraint IS NOT NULL
    )
);
```

**Step 3: Update `entities.sql`**

In the `entity_types` table:
- Remove the `"type"` column and its CHECK constraint
- Remove the `"relationships"` JSONB column

In the `entity_relationships` table:
- Remove `"source_entity_type_id"` and `"target_entity_type_id"` columns
- Rename `"relationship_field_id"` to `"relationship_definition_id"`
- Add FK: `REFERENCES public.relationship_definitions(id) ON DELETE RESTRICT`
- Update unique constraint to use `relationship_definition_id`

**Step 4: Update `entity_indexes.sql`**

- Remove indexes on `source_entity_type_id` and `target_entity_type_id`
- Add partial indexes for new tables:
  - `relationship_definitions`: `(workspace_id, source_entity_type_id) WHERE deleted = false`
  - `relationship_target_rules`: `(relationship_definition_id)`, `(target_entity_type_id)`

**Step 5: Commit**

```
feat(schema): add relationship_definitions and relationship_target_rules tables
```

---

## Task 2: Delete Obsolete Enums

Remove enums that are no longer needed. This must happen before creating new models to avoid naming conflicts and import confusion.

**Files:**
- Delete: `core/src/main/kotlin/riven/core/enums/entity/EntityCategory.kt`
- Delete: `core/src/main/kotlin/riven/core/enums/entity/EntityTypeRelationshipType.kt`
- Delete: `core/src/main/kotlin/riven/core/enums/entity/EntityTypeRelationshipChangeType.kt`
- Delete: `core/src/main/kotlin/riven/core/enums/entity/EntityTypeRelationshipDataLossReason.kt`
- Modify: `core/src/main/kotlin/riven/core/enums/entity/EntityRelationshipCardinality.kt` — remove `invert()` extension

**Step 1: Delete the 4 enum files**

Delete `EntityCategory.kt`, `EntityTypeRelationshipType.kt`, `EntityTypeRelationshipChangeType.kt`, `EntityTypeRelationshipDataLossReason.kt`.

**Step 2: Remove `invert()` from `EntityRelationshipCardinality.kt`**

Keep the enum values (`ONE_TO_ONE`, `ONE_TO_MANY`, `MANY_TO_ONE`, `MANY_TO_MANY`). Delete the `fun EntityRelationshipCardinality.invert()` extension function.

**Step 3: Commit**

```
refactor(enums): remove obsolete relationship enums
```

---

## Task 3: Delete Obsolete Models and Validators

Remove old relationship models, validators, and analysis classes.

**Files:**
- Delete: `core/src/main/kotlin/riven/core/models/entity/configuration/EntityRelationshipDefinition.kt`
- Delete: `core/src/main/kotlin/riven/core/models/entity/validation/EntityRelationshipDefinitionValidator.kt`
- Delete: `core/src/main/kotlin/riven/core/models/entity/validation/ValidEntityRelationshipDefinition.kt`
- Delete: `core/src/main/kotlin/riven/core/models/entity/relationship/EntityTypeReferenceRelationshipBuilder.kt`
- Delete: `core/src/main/kotlin/riven/core/models/entity/relationship/EntityRelationshipOverlap.kt`
- Delete: `core/src/main/kotlin/riven/core/models/entity/relationship/analysis/EntityImpactSummary.kt`
- Delete: `core/src/main/kotlin/riven/core/models/entity/relationship/analysis/EntityTypeRelationshipDataLossWarning.kt`
- Delete: `core/src/main/kotlin/riven/core/models/entity/relationship/analysis/EntityTypeRelationshipDeleteRequest.kt`
- Delete: `core/src/main/kotlin/riven/core/models/entity/relationship/analysis/EntityTypeRelationshipDiff.kt`
- Delete: `core/src/main/kotlin/riven/core/models/entity/relationship/analysis/EntityTypeRelationshipImpactAnalysis.kt`
- Delete: `core/src/main/kotlin/riven/core/models/entity/relationship/analysis/EntityTypeRelationshipModification.kt`
- Delete: `core/src/test/kotlin/riven/core/models/entity/validation/EntityRelationshipDefinitionValidatorTest.kt`

**Step 1: Delete all 11 model/validator files and the validator test**

Remove the entire `models/entity/relationship/` directory (builder, overlap, and analysis subdirectory). Remove `EntityRelationshipDefinition.kt` from `models/entity/configuration/`. Remove both validator files from `models/entity/validation/`. Remove the validator test.

**Step 2: Commit**

```
refactor(models): remove obsolete relationship models, validators, and analysis classes
```

---

## Task 4: Delete Obsolete Services and Tests

Remove services that are entirely replaced and their tests.

**Files:**
- Delete: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipDiffService.kt`
- Delete: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipImpactAnalysisService.kt`
- Delete: `core/src/test/kotlin/riven/core/service/entity/type/EntityTypeRelationshipServiceTest.kt`
- Delete: `core/src/test/kotlin/riven/core/service/entity/EntityRelationshipServiceTest.kt`

**Step 1: Delete both service files and both test files**

The `EntityTypeRelationshipService.kt` is NOT deleted yet — it will be gutted and rewritten in Task 8. The diff and impact analysis services are fully replaced. Old tests are invalid — new tests will be written alongside the rewritten services.

**Step 2: Commit**

```
refactor(services): remove obsolete diff, impact analysis services and old tests
```

---

## Task 5: New JPA Entities and Domain Models

Create the new `RelationshipDefinitionEntity`, `RelationshipTargetRuleEntity` JPA entities and their domain models.

**Files:**
- Create: `core/src/main/kotlin/riven/core/entity/entity/RelationshipDefinitionEntity.kt`
- Create: `core/src/main/kotlin/riven/core/entity/entity/RelationshipTargetRuleEntity.kt`
- Create: `core/src/main/kotlin/riven/core/models/entity/RelationshipDefinition.kt`
- Create: `core/src/main/kotlin/riven/core/models/entity/RelationshipTargetRule.kt`

**Step 1: Create `RelationshipDefinitionEntity.kt`**

```kotlin
package riven.core.entity.entity

import jakarta.persistence.*
import riven.core.entity.util.AuditableSoftDeletableEntity
import riven.core.enums.common.icon.IconColour
import riven.core.enums.common.icon.IconType
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.models.common.Icon
import riven.core.models.entity.RelationshipDefinition
import java.util.*

@Entity
@Table(
    name = "relationship_definitions",
    indexes = [
        Index(name = "idx_rel_def_workspace_source", columnList = "workspace_id, source_entity_type_id"),
    ]
)
data class RelationshipDefinitionEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false, columnDefinition = "uuid")
    val workspaceId: UUID,

    @Column(name = "source_entity_type_id", nullable = false, columnDefinition = "uuid")
    val sourceEntityTypeId: UUID,

    @Column(name = "name", nullable = false)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "icon_type", nullable = false)
    var iconType: IconType = IconType.LINK,

    @Enumerated(EnumType.STRING)
    @Column(name = "icon_value", nullable = false)
    var iconColour: IconColour = IconColour.NEUTRAL,

    @Column(name = "allow_polymorphic", nullable = false)
    var allowPolymorphic: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(name = "cardinality_default", nullable = false)
    var cardinalityDefault: EntityRelationshipCardinality,

    @Column(name = "protected", nullable = false)
    val protected: Boolean = false,
) : AuditableSoftDeletableEntity() {

    fun toModel(targetRules: List<RelationshipTargetRule> = emptyList()): RelationshipDefinition {
        val id = requireNotNull(this.id) { "RelationshipDefinitionEntity ID cannot be null" }
        return RelationshipDefinition(
            id = id,
            workspaceId = this.workspaceId,
            sourceEntityTypeId = this.sourceEntityTypeId,
            name = this.name,
            icon = Icon(this.iconType, this.iconColour),
            allowPolymorphic = this.allowPolymorphic,
            cardinalityDefault = this.cardinalityDefault,
            protected = this.protected,
            targetRules = targetRules,
            createdAt = this.createdAt,
            updatedAt = this.updatedAt,
            createdBy = this.createdBy,
            updatedBy = this.updatedBy,
        )
    }
}
```

**Step 2: Create `RelationshipTargetRuleEntity.kt`**

```kotlin
package riven.core.entity.entity

import jakarta.persistence.*
import riven.core.entity.util.AuditableEntity
import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.models.entity.RelationshipTargetRule
import java.util.*

@Entity
@Table(
    name = "relationship_target_rules",
    indexes = [
        Index(name = "idx_target_rule_def", columnList = "relationship_definition_id"),
        Index(name = "idx_target_rule_type", columnList = "target_entity_type_id"),
    ]
)
data class RelationshipTargetRuleEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "relationship_definition_id", nullable = false, columnDefinition = "uuid")
    val relationshipDefinitionId: UUID,

    @Column(name = "target_entity_type_id", nullable = true, columnDefinition = "uuid")
    val targetEntityTypeId: UUID?,

    @Column(name = "semantic_type_constraint", nullable = true)
    val semanticTypeConstraint: String?,

    @Enumerated(EnumType.STRING)
    @Column(name = "cardinality_override", nullable = true)
    val cardinalityOverride: EntityRelationshipCardinality?,

    @Column(name = "inverse_visible", nullable = false)
    var inverseVisible: Boolean = false,

    @Column(name = "inverse_name", nullable = true)
    var inverseName: String?,
) : AuditableEntity() {

    fun toModel(): RelationshipTargetRule {
        val id = requireNotNull(this.id) { "RelationshipTargetRuleEntity ID cannot be null" }
        return RelationshipTargetRule(
            id = id,
            relationshipDefinitionId = this.relationshipDefinitionId,
            targetEntityTypeId = this.targetEntityTypeId,
            semanticTypeConstraint = this.semanticTypeConstraint,
            cardinalityOverride = this.cardinalityOverride,
            inverseVisible = this.inverseVisible,
            inverseName = this.inverseName,
            createdAt = this.createdAt,
            updatedAt = this.updatedAt,
        )
    }
}
```

Note: `RelationshipTargetRuleEntity` extends `AuditableEntity` (not `AuditableSoftDeletableEntity`) — target rules are hard-deleted when removed, since they are configuration, not user data.

**Step 3: Create `RelationshipDefinition.kt` domain model**

```kotlin
package riven.core.models.entity

import riven.core.enums.entity.EntityRelationshipCardinality
import riven.core.models.common.Icon
import java.time.ZonedDateTime
import java.util.*

data class RelationshipDefinition(
    val id: UUID,
    val workspaceId: UUID,
    val sourceEntityTypeId: UUID,
    val name: String,
    val icon: Icon,
    val allowPolymorphic: Boolean,
    val cardinalityDefault: EntityRelationshipCardinality,
    val protected: Boolean,
    val targetRules: List<RelationshipTargetRule> = emptyList(),
    val createdAt: ZonedDateTime?,
    val updatedAt: ZonedDateTime?,
    val createdBy: UUID?,
    val updatedBy: UUID?,
)
```

**Step 4: Create `RelationshipTargetRule.kt` domain model**

```kotlin
package riven.core.models.entity

import riven.core.enums.entity.EntityRelationshipCardinality
import java.time.ZonedDateTime
import java.util.*

data class RelationshipTargetRule(
    val id: UUID,
    val relationshipDefinitionId: UUID,
    val targetEntityTypeId: UUID?,
    val semanticTypeConstraint: String?,
    val cardinalityOverride: EntityRelationshipCardinality?,
    val inverseVisible: Boolean,
    val inverseName: String?,
    val createdAt: ZonedDateTime?,
    val updatedAt: ZonedDateTime?,
)
```

**Step 5: Commit**

```
feat(models): add RelationshipDefinition and RelationshipTargetRule entities and domain models
```

---

## Task 6: New Repositories

Create Spring Data JPA repositories for the new tables.

**Files:**
- Create: `core/src/main/kotlin/riven/core/repository/entity/RelationshipDefinitionRepository.kt`
- Create: `core/src/main/kotlin/riven/core/repository/entity/RelationshipTargetRuleRepository.kt`

**Step 1: Create `RelationshipDefinitionRepository.kt`**

```kotlin
package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import riven.core.entity.entity.RelationshipDefinitionEntity
import java.util.*

@Repository
interface RelationshipDefinitionRepository : JpaRepository<RelationshipDefinitionEntity, UUID> {

    fun findByWorkspaceIdAndSourceEntityTypeId(workspaceId: UUID, sourceEntityTypeId: UUID): List<RelationshipDefinitionEntity>

    fun findByIdAndWorkspaceId(id: UUID, workspaceId: UUID): Optional<RelationshipDefinitionEntity>

    @Query("""
        SELECT rd FROM RelationshipDefinitionEntity rd
        WHERE rd.workspaceId = :workspaceId
        AND rd.sourceEntityTypeId IN :entityTypeIds
    """)
    fun findByWorkspaceIdAndSourceEntityTypeIdIn(workspaceId: UUID, entityTypeIds: List<UUID>): List<RelationshipDefinitionEntity>
}
```

**Step 2: Create `RelationshipTargetRuleRepository.kt`**

```kotlin
package riven.core.repository.entity

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import riven.core.entity.entity.RelationshipTargetRuleEntity
import java.util.*

@Repository
interface RelationshipTargetRuleRepository : JpaRepository<RelationshipTargetRuleEntity, UUID> {

    fun findByRelationshipDefinitionId(definitionId: UUID): List<RelationshipTargetRuleEntity>

    fun findByRelationshipDefinitionIdIn(definitionIds: List<UUID>): List<RelationshipTargetRuleEntity>

    fun deleteByRelationshipDefinitionId(definitionId: UUID)

    @Query("""
        SELECT rtr FROM RelationshipTargetRuleEntity rtr
        WHERE rtr.targetEntityTypeId = :entityTypeId
        AND rtr.inverseVisible = true
    """)
    fun findInverseVisibleByTargetEntityTypeId(entityTypeId: UUID): List<RelationshipTargetRuleEntity>

    @Query("""
        SELECT rtr FROM RelationshipTargetRuleEntity rtr
        WHERE rtr.targetEntityTypeId IN :entityTypeIds
        AND rtr.inverseVisible = true
    """)
    fun findInverseVisibleByTargetEntityTypeIdIn(entityTypeIds: List<UUID>): List<RelationshipTargetRuleEntity>
}
```

**Step 3: Commit**

```
feat(repos): add RelationshipDefinition and RelationshipTargetRule repositories
```

---

## Task 7: Update Existing Entities and Models

Update `EntityTypeEntity`, `EntityRelationshipEntity`, `EntityRelationship` domain model, and `EntityFactory` to remove old fields and rename columns.

**Files:**
- Modify: `core/src/main/kotlin/riven/core/entity/entity/EntityTypeEntity.kt` — remove `type: EntityCategory` and `relationships: List<EntityRelationshipDefinition>?` fields; update `toModel()`
- Modify: `core/src/main/kotlin/riven/core/models/entity/EntityType.kt` — remove `type` and `relationships` fields; remove `attributes` computed property
- Modify: `core/src/main/kotlin/riven/core/entity/entity/EntityRelationshipEntity.kt` — drop `sourceTypeId`, `targetTypeId`; rename `fieldId` → `definitionId`; update unique constraint and indexes
- Modify: `core/src/main/kotlin/riven/core/models/entity/EntityRelationship.kt` — rename `fieldId` → `definitionId`
- Modify: `core/src/test/kotlin/riven/core/service/util/factory/entity/EntityFactory.kt` — remove old params, add new factory methods

**Step 1: Update `EntityTypeEntity.kt`**

Remove these fields:
- `val type: EntityCategory` (line 70-71)
- `var relationships: List<EntityRelationshipDefinition>? = null` (line 81-82)

Remove from `toModel()`:
- `type = this.type` (line 108)
- `relationships = this.relationships` (line 110)

Remove imports: `EntityCategory`, `EntityRelationshipDefinition`.

**Step 2: Update `EntityType.kt`**

Remove these fields:
- `val type: EntityCategory`
- `val relationships: List<EntityRelationshipDefinition>? = null`
- `val attributes` computed property (depends on `relationships`)

Remove imports: `EntityCategory`, `EntityRelationshipDefinition`.

**Step 3: Update `EntityRelationshipEntity.kt`**

Remove:
- `val sourceTypeId: UUID` (mapped to `source_entity_type_id`)
- `val targetTypeId: UUID` (mapped to `target_entity_type_id`)
- Indexes referencing those columns

Rename:
- `val fieldId: UUID` → `val definitionId: UUID`
- Column mapping: `relationship_field_id` → `relationship_definition_id`
- Unique constraint column: `relationship_field_id` → `relationship_definition_id`

Update `toModel()`: `fieldId = this.fieldId` → `definitionId = this.definitionId`

**Step 4: Update `EntityRelationship.kt`**

Rename `val fieldId: UUID` → `val definitionId: UUID`.

**Step 5: Update `EntityFactory.kt`**

Remove from `createEntityType()`: `type` parameter, `relationships` parameter, relationship column generation in `defaultOrder`.

Remove: `createRelationshipDefinition()` factory method entirely.

Update `createRelationshipEntity()`: remove `sourceTypeId`, `targetTypeId` params; rename `fieldId` → `definitionId`.

Add new factory methods:

```kotlin
fun createRelationshipDefinitionEntity(
    id: UUID = UUID.randomUUID(),
    workspaceId: UUID = UUID.randomUUID(),
    sourceEntityTypeId: UUID = UUID.randomUUID(),
    name: String = "Related Entity",
    cardinalityDefault: EntityRelationshipCardinality = EntityRelationshipCardinality.MANY_TO_MANY,
    allowPolymorphic: Boolean = false,
    protected: Boolean = false,
): RelationshipDefinitionEntity

fun createTargetRuleEntity(
    id: UUID = UUID.randomUUID(),
    relationshipDefinitionId: UUID = UUID.randomUUID(),
    targetEntityTypeId: UUID? = UUID.randomUUID(),
    semanticTypeConstraint: String? = null,
    cardinalityOverride: EntityRelationshipCardinality? = null,
    inverseVisible: Boolean = false,
    inverseName: String? = null,
): RelationshipTargetRuleEntity
```

**Step 6: Compile check**

Run: `./gradlew compileKotlin`

This will fail with compile errors in files that still reference deleted fields/types. Those files (services, controllers, repository, query engine, request DTOs) are addressed in subsequent tasks. The goal here is to get the entity and model layer correct. Note the compile errors — they serve as a checklist for the remaining tasks.

**Step 7: Commit**

```
refactor(entities): update EntityType, EntityRelationship to remove old relationship fields
```

---

## Task 8: Update EntityRelationshipRepository

Update all queries to use the renamed column and remove references to deleted columns.

**Files:**
- Modify: `core/src/main/kotlin/riven/core/repository/entity/EntityRelationshipRepository.kt`

**Step 1: Rename all references**

Throughout the file:
- `relationship_field_id` → `relationship_definition_id` (in native SQL queries)
- `fieldId` → `definitionId` (in JPQL property references)
- Remove any queries referencing `source_entity_type_id` or `target_entity_type_id`

Key methods to update:
- `findBySourceId` → property rename
- `findAllBySourceIdAndFieldId` → rename to `findAllBySourceIdAndDefinitionId`
- `findBySourceIdAndTargetIdAndFieldId` → rename to `findBySourceIdAndTargetIdAndDefinitionId`
- `countBySourceIdAndFieldId` → rename to `countBySourceIdAndDefinitionId`
- `deleteAllBySourceIdAndFieldId` → rename to `deleteAllBySourceIdAndDefinitionId`
- `deleteAllBySourceIdAndFieldIdAndTargetIdIn` → rename to `deleteAllBySourceIdAndDefinitionIdAndTargetIdIn`
- `findEntityLinksBySourceId` native query: rename `r.relationship_field_id as fieldId` → `r.relationship_definition_id as definitionId`
- `EntityLinkProjection` interface: rename `getFieldId()` → `getDefinitionId()`

Add new query for inverse lookups:

```kotlin
@Query("""
    SELECT er FROM EntityRelationshipEntity er
    WHERE er.targetId = :targetId
    AND er.definitionId = :definitionId
""")
fun findByTargetIdAndDefinitionId(targetId: UUID, definitionId: UUID): List<EntityRelationshipEntity>
```

**Step 2: Commit**

```
refactor(repo): rename relationship_field_id to relationship_definition_id in EntityRelationshipRepository
```

---

## Task 9: Update Request DTOs

Simplify the save and delete request DTOs for relationship definitions.

**Files:**
- Modify: `core/src/main/kotlin/riven/core/models/request/entity/type/SaveTypeDefinitionRequest.kt`
- Modify: `core/src/main/kotlin/riven/core/models/request/entity/type/DeleteDefinitionRequest.kt`

**Step 1: Update `SaveRelationshipDefinitionRequest`**

Replace the `relationship: EntityRelationshipDefinition` field with fields matching the new model:

```kotlin
@JsonDeserialize(using = JsonDeserializer.None::class)
data class SaveRelationshipDefinitionRequest(
    override val key: String,
    override val id: UUID,
    val name: String,
    val iconType: IconType?,
    val iconColour: IconColour?,
    val allowPolymorphic: Boolean = false,
    val cardinalityDefault: EntityRelationshipCardinality,
    val targetRules: List<SaveTargetRuleRequest> = emptyList(),
) : TypeDefinition {
    override val type: EntityTypeRequestDefinition = EntityTypeRequestDefinition.SAVE_RELATIONSHIP
}

data class SaveTargetRuleRequest(
    val id: UUID? = null,
    val targetEntityTypeId: UUID? = null,
    val semanticTypeConstraint: String? = null,
    val cardinalityOverride: EntityRelationshipCardinality? = null,
    val inverseVisible: Boolean = false,
    val inverseName: String? = null,
)
```

**Step 2: Simplify `DeleteRelationshipDefinitionRequest`**

Remove the `DeleteAction` enum entirely. The new model only needs the definition ID:

```kotlin
@JsonDeserialize(using = JsonDeserializer.None::class)
data class DeleteRelationshipDefinitionRequest(
    override val key: String,
    override val id: UUID,
) : TypeDefinition {
    override val type: EntityTypeRequestDefinition = EntityTypeRequestDefinition.DELETE_RELATIONSHIP
}
```

Delete the `DeleteAction` enum (`REMOVE_BIDIRECTIONAL`, `REMOVE_ENTITY_TYPE`, `DELETE_RELATIONSHIP`).

**Step 3: Commit**

```
refactor(dto): simplify relationship save and delete request DTOs
```

---

## Task 10: Rewrite EntityTypeRelationshipService — Tests First

Rewrite the type-level relationship service with TDD. Write tests first, then implement.

**Files:**
- Rewrite: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeRelationshipService.kt`
- Create: `core/src/test/kotlin/riven/core/service/entity/type/EntityTypeRelationshipServiceTest.kt`

**Step 1: Write test class skeleton**

Create test file with `@SpringBootTest` config mocking `RelationshipDefinitionRepository`, `RelationshipTargetRuleRepository`, `EntityTypeRepository`, `EntityRelationshipRepository`, `KLogger`, `AuthTokenService`, `ActivityService`.

Test cases to write:

1. `createRelationshipDefinition_singleTarget_savesDefinitionAndRule`
2. `createRelationshipDefinition_multiTarget_savesDefinitionAndMultipleRules`
3. `createRelationshipDefinition_polymorphic_savesDefinitionWithNoRules`
4. `createRelationshipDefinition_withSemanticConstraint_savesRuleWithConstraint`
5. `updateRelationshipDefinition_changeName_updatesDefinition`
6. `updateRelationshipDefinition_addTargetRule_savesNewRule`
7. `updateRelationshipDefinition_removeTargetRule_deletesRule`
8. `updateRelationshipDefinition_changeCardinalityDefault_updatesDefinition`
9. `deleteRelationshipDefinition_noInstanceData_deletesDefinitionAndRules`
10. `deleteRelationshipDefinition_withInstanceData_returnsImpactAnalysis`
11. `deleteRelationshipDefinition_protectedDefinition_throwsException`
12. `getDefinitionsForEntityType_returnsForwardAndInverseDefinitions`

**Step 2: Run tests to verify they fail**

Run: `./gradlew test --tests "riven.core.service.entity.type.EntityTypeRelationshipServiceTest"`
Expected: All tests FAIL (service not yet implemented).

**Step 3: Implement `EntityTypeRelationshipService`**

Gut the existing file entirely. Replace with a clean service that operates on `RelationshipDefinitionRepository` and `RelationshipTargetRuleRepository`:

Public methods:
- `createRelationshipDefinition(workspaceId, sourceEntityTypeId, request)` → saves definition + rules
- `updateRelationshipDefinition(workspaceId, definitionId, request)` → updates definition fields + diffs rules (add/remove/update)
- `deleteRelationshipDefinition(workspaceId, definitionId, impactConfirmed)` → impact check or delete
- `getDefinitionsForEntityType(workspaceId, entityTypeId)` → returns forward definitions + inverse-visible definitions
- `getDefinitionById(workspaceId, definitionId)` → single lookup with rules

All methods use `@PreAuthorize("@workspaceSecurity.hasWorkspace(#workspaceId)")`.

Impact analysis for delete: count `entity_relationships` rows for this definition. If > 0 and `impactConfirmed = false`, return impact summary. If `impactConfirmed = true`, soft-delete instance data then soft-delete the definition.

**Step 4: Run tests to verify they pass**

Run: `./gradlew test --tests "riven.core.service.entity.type.EntityTypeRelationshipServiceTest"`
Expected: All PASS.

**Step 5: Commit**

```
feat(service): rewrite EntityTypeRelationshipService for table-based relationship definitions
```

---

## Task 11: Rewrite EntityRelationshipService — Tests First

Simplify the instance-level relationship service with TDD. Single-row writes, cardinality enforcement, no inverse rows.

**Files:**
- Rewrite: `core/src/main/kotlin/riven/core/service/entity/EntityRelationshipService.kt`
- Create: `core/src/test/kotlin/riven/core/service/entity/EntityRelationshipServiceTest.kt`

**Step 1: Write test class skeleton**

Test cases to write:

1. `saveRelationships_newLinks_createsRows`
2. `saveRelationships_removeLinks_deletesRows`
3. `saveRelationships_noChange_noOps`
4. `saveRelationships_enforcesCardinality_oneToOne_rejectsSecondLink`
5. `saveRelationships_enforcesCardinality_manyToOne_allowsMultipleSources`
6. `saveRelationships_polymorphic_acceptsAnyTargetType`
7. `saveRelationships_nonPolymorphic_rejectsUnlistedTargetType`
8. `saveRelationships_cardinalityOverride_usesRuleOverDefault`
9. `saveRelationships_semanticConstraint_stub` (placeholder — validates structure, actual semantic lookup deferred)
10. `findRelatedEntities_forward_returnsTargets`
11. `findRelatedEntities_inverse_returnsSources`

**Step 2: Run tests to verify they fail**

Run: `./gradlew test --tests "riven.core.service.entity.EntityRelationshipServiceTest"`

**Step 3: Implement simplified `EntityRelationshipService`**

Key changes from current:
- `saveRelationships` takes `Map<UUID, List<UUID>>` (definitionId → targetEntityIds) — same interface
- For each definition: load definition + rules, validate target types against rules, enforce cardinality, insert/delete rows
- No `createInverseRelationships()` or `removeInverseRelationships()` — deleted entirely
- `findRelatedEntities` gains a direction parameter for inverse queries
- `archiveEntities` simplified — no inverse cleanup needed

Write-time validation flow (private method):
```kotlin
private fun validateAndResolveCardinality(
    definition: RelationshipDefinition,
    targetEntityTypeId: UUID
): EntityRelationshipCardinality
```
1. If `allowPolymorphic` and no matching rule → return `cardinalityDefault`
2. Find matching rule by `targetEntityTypeId` or `semanticTypeConstraint`
3. If `!allowPolymorphic` and no rule matches → throw `InvalidRelationshipException`
4. Return `rule.cardinalityOverride ?: definition.cardinalityDefault`

**Step 4: Run tests to verify they pass**

Run: `./gradlew test --tests "riven.core.service.entity.EntityRelationshipServiceTest"`

**Step 5: Commit**

```
feat(service): rewrite EntityRelationshipService with cardinality enforcement and no inverse rows
```

---

## Task 12: Update Query Engine

Update `RelationshipSqlGenerator` and `QueryFilterValidator` for renamed columns and direction support.

**Files:**
- Create: `core/src/main/kotlin/riven/core/enums/entity/query/QueryDirection.kt`
- Modify: `core/src/main/kotlin/riven/core/service/entity/query/RelationshipSqlGenerator.kt`
- Modify: `core/src/main/kotlin/riven/core/service/entity/query/QueryFilterValidator.kt`

**Step 1: Create `QueryDirection` enum**

```kotlin
package riven.core.enums.entity.query

enum class QueryDirection {
    FORWARD,
    INVERSE
}
```

**Step 2: Update `RelationshipSqlGenerator`**

Throughout all `generate*` methods:
- Replace `relationship_field_id` → `relationship_definition_id` in all SQL strings
- Add `direction: QueryDirection = QueryDirection.FORWARD` parameter to `generate()`
- In `generateExistsFragment`, `generateTargetEquals`, `generateTargetMatches`, `generateTargetTypeMatches`:
  - When `FORWARD`: use `$relAlias.source_entity_id = $entityAlias.id` (current behavior)
  - When `INVERSE`: use `$relAlias.target_entity_id = $entityAlias.id`

The direction is resolved by the caller based on whether the queried entity type is the source or a target in the definition.

**Step 3: Update `QueryFilterValidator`**

Change the `relationshipDefinitions` parameter type:
- From: `Map<UUID, EntityRelationshipDefinition>`
- To: `Map<UUID, RelationshipDefinition>`

The validation logic itself is unchanged — it checks definition exists and depth constraints.

**Step 4: Run existing query tests**

Run: `./gradlew test --tests "riven.core.service.entity.query.*"`
Expected: May fail due to seed data changes (addressed in Task 13). The SQL generation logic should be correct.

**Step 5: Commit**

```
feat(query): add QueryDirection support and rename to relationship_definition_id in SQL generator
```

---

## Task 13: Update Integration Test Base and Query Tests

Update the integration test seed data to use new tables and column names.

**Files:**
- Modify: `core/src/test/kotlin/riven/core/service/entity/query/EntityQueryIntegrationTestBase.kt`
- Modify: `core/src/test/kotlin/riven/core/service/entity/query/EntityQueryRelationshipIntegrationTest.kt`

**Step 1: Update `EntityQueryIntegrationTestBase`**

- Update entity type seeding: remove `type` column and `relationships` JSONB from INSERT statements
- Update relationship seeding: insert into `relationship_definitions` and `relationship_target_rules` tables instead of referencing JSONB definitions
- Update `entity_relationships` INSERT: use `relationship_definition_id` instead of `relationship_field_id`; remove `source_entity_type_id` and `target_entity_type_id`
- The SQL schema bootstrap must now also create `relationship_definitions` and `relationship_target_rules` tables

**Step 2: Update `EntityQueryRelationshipIntegrationTest`**

- Update any references to `fieldId` → `definitionId` if the test inspects results
- Seed data now references definition IDs from `relationship_definitions` table rows rather than JSONB UUIDs
- All filter JSON structure is unchanged — `relationshipId` still carries a UUID

**Step 3: Run integration tests**

Run: `./gradlew test --tests "riven.core.service.entity.query.*"`
Expected: All PASS.

**Step 4: Commit**

```
test(query): update integration test seed data for new relationship schema
```

---

## Task 14: Update Controllers and EntityTypeService

Wire the controllers and `EntityTypeService` to the rewritten relationship service.

**Files:**
- Modify: `core/src/main/kotlin/riven/core/controller/entity/EntityTypeController.kt`
- Modify: `core/src/main/kotlin/riven/core/service/entity/type/EntityTypeService.kt`
- Modify: `core/src/main/kotlin/riven/core/controller/entity/EntityController.kt` (if relationship save flow changed)

**Step 1: Update `EntityTypeService`**

- Remove all references to `EntityRelationshipDefinition`, `EntityCategory`, `EntityTypeRelationshipType`
- Remove the `relationships` field from entity type creation/update flows
- The relationship definition CRUD is now handled by `EntityTypeRelationshipService` directly — `EntityTypeService` no longer mediates relationship changes through JSONB mutations
- Remove relationship-related lifecycle hooks that trigger REFERENCE creation/deletion
- Keep the semantic metadata lifecycle hooks but update them to trigger on `relationship_definitions` changes

**Step 2: Update `EntityTypeController`**

- The `POST /definition` endpoint for `SAVE_RELATIONSHIP` now delegates to `EntityTypeRelationshipService.createRelationshipDefinition` or `updateRelationshipDefinition` directly
- The `DELETE /definition` endpoint for `DELETE_RELATIONSHIP` now delegates to `EntityTypeRelationshipService.deleteRelationshipDefinition`
- The `SaveRelationshipDefinitionRequest` payload has changed (see Task 9) — the controller deserializes the new shape
- Remove `DeleteAction` from the delete flow — a delete is just a delete

**Step 3: Update `EntityController`**

- The `saveEntity` flow calls `EntityRelationshipService.saveRelationships` — this interface is unchanged (`Map<UUID, List<UUID>>`), but internally the service now does cardinality enforcement
- No `impactedEntityIds` returned — remove handling if present in the controller

**Step 4: Compile and test**

Run: `./gradlew build`
Expected: Full compile success and all tests pass.

**Step 5: Commit**

```
feat(controllers): wire controllers to rewritten relationship services
```

---

## Task 15: Update Semantic Metadata Lifecycle Hooks

The semantic metadata service has lifecycle hooks that fire when relationship definitions are created/modified/deleted. These need to trigger on the new table-based definitions.

**Files:**
- Modify: `core/src/main/kotlin/riven/core/service/entity/EntityTypeSemanticMetadataService.kt` — update references from JSONB definitions to table-based definitions

**Step 1: Update lifecycle hook triggers**

The hooks currently reference `EntityRelationshipDefinition` IDs from JSONB. Update to reference `RelationshipDefinition` IDs from the new table. The semantic metadata `targetType = RELATIONSHIP` and `targetId = definition.id` pattern stays the same — only the source of the definition ID changes.

**Step 2: Verify**

Run: `./gradlew test`
Expected: All PASS.

**Step 3: Commit**

```
refactor(semantics): update metadata lifecycle hooks for table-based relationship definitions
```

---

## Task 16: Final Cleanup and Verification

Remove any remaining dead code, verify full build, and clean up.

**Files:**
- Check: All files for remaining references to deleted types (`EntityCategory`, `EntityTypeRelationshipType`, `EntityRelationshipDefinition`, `DeleteAction`, etc.)
- Remove: Any empty directories left after deletions (`models/entity/relationship/analysis/`, etc.)

**Step 1: Search for dead references**

Search the entire codebase for imports or references to deleted types. Fix any remaining compile errors.

**Step 2: Full build and test**

Run: `./gradlew build`
Expected: Clean compile, all tests pass.

Run: `./gradlew test`
Expected: All tests pass.

**Step 3: Commit**

```
chore: final cleanup of dead references after relationship overhaul
```

---

## Task Summary

| Task | Description | Type |
|------|-------------|------|
| 1 | Database schema — new tables, update existing | Schema |
| 2 | Delete obsolete enums | Cleanup |
| 3 | Delete obsolete models and validators | Cleanup |
| 4 | Delete obsolete services and tests | Cleanup |
| 5 | New JPA entities and domain models | Foundation |
| 6 | New repositories | Foundation |
| 7 | Update existing entities and models | Refactor |
| 8 | Update EntityRelationshipRepository | Refactor |
| 9 | Update request DTOs | Refactor |
| 10 | Rewrite EntityTypeRelationshipService (TDD) | Feature |
| 11 | Rewrite EntityRelationshipService (TDD) | Feature |
| 12 | Update query engine | Feature |
| 13 | Update integration tests | Test |
| 14 | Update controllers and EntityTypeService | Feature |
| 15 | Update semantic metadata lifecycle hooks | Refactor |
| 16 | Final cleanup and verification | Cleanup |

## Notes

- **Semantic type constraints**: The `semantic_type_constraint` column and model field exist from Task 1, but entity-type-level semantic classification doesn't exist yet. The write-time validation in Task 11 stubs the semantic lookup — it validates structure but the actual semantic classification query will be implemented when entity-type-level classification is defined in the Knowledge Layer.
- **Database wipe**: No migration logic needed. The DB will be wiped and recreated from the updated schema files.
- **Compile errors**: Tasks 2-4 delete code that other files depend on. The codebase will not compile between Tasks 4 and ~14. This is expected — each task resolves a subset of the errors. Run `./gradlew compileKotlin` after Task 7 to see the remaining error surface.
