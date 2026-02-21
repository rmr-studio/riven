# Entity Relationship System Overhaul

## Context

The current relationship system stores definitions as JSONB inside `entity_types`, uses an ORIGIN/REFERENCE dualism for bidirectional relationships, stores duplicate inverse rows at the instance level, and applies a single cardinality across all target types. This design replaces it with first-class relational tables, query-time inverse resolution, per-target-type cardinality, and semantic type constraints.

## Goals

- Eliminate ORIGIN/REFERENCE dualism — one definition per logical relationship, one source of truth
- Move relationship definitions out of JSONB into proper database tables with foreign keys
- Support per-target-type cardinality with a default for polymorphic/unmatched types
- Bidirectional inverse visibility is opt-in per target type, resolved at query time (no REFERENCE definitions)
- Semantic type constraints — dynamic/reactive filters evaluated at write time against live metadata
- Write-time cardinality enforcement at the instance level
- Single instance row per link (no inverse row storage)
- Drop the `EntityCategory` enum entirely (no STANDARD/RELATIONSHIP distinction)
- Preserve compatibility with the existing entity query engine (`RelationshipSqlGenerator`, `QueryFilterValidator`, `RelationshipFilter` variants)

## Non-Goals

- Retroactive validation of existing links when semantic classifications change (future enhancement)
- N-ary relationships (the model remains directional: source → target)
- Data migration (database will be wiped)

---

## Type-Level Schema

### `relationship_definitions`

Replaces the JSONB `relationships` column on `entity_types`. One row per logical relationship.

```sql
CREATE TABLE relationship_definitions (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_entity_type_id UUID NOT NULL REFERENCES entity_types(id) ON DELETE CASCADE,
    name                  TEXT NOT NULL,
    icon_type             TEXT NOT NULL,
    icon_value            TEXT NOT NULL,
    allow_polymorphic     BOOLEAN NOT NULL DEFAULT FALSE,
    cardinality_default   TEXT NOT NULL CHECK (cardinality_default IN ('ONE_TO_ONE','ONE_TO_MANY','MANY_TO_ONE','MANY_TO_MANY')),
    protected             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at            TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by            UUID,
    updated_by            UUID,
    deleted               BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at            TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
```

### `relationship_target_rules`

Per-target-type configuration. Each rule specifies an allowed target (by explicit type, semantic classification, or both) with its own cardinality override and inverse visibility.

```sql
CREATE TABLE relationship_target_rules (
    id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_definition_id UUID NOT NULL REFERENCES relationship_definitions(id) ON DELETE CASCADE,
    target_entity_type_id      UUID REFERENCES entity_types(id) ON DELETE CASCADE,
    semantic_type_constraint   TEXT,
    cardinality_override       TEXT CHECK (cardinality_override IN ('ONE_TO_ONE','ONE_TO_MANY','MANY_TO_ONE','MANY_TO_MANY')),
    inverse_visible            BOOLEAN NOT NULL DEFAULT FALSE,
    inverse_name               TEXT,
    created_at                 TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at                 TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT chk_target_or_semantic CHECK (
        target_entity_type_id IS NOT NULL OR semantic_type_constraint IS NOT NULL
    )
);
```

### Constraint modes

| Scenario | `allow_polymorphic` | Target rules |
|----------|-------------------|--------------|
| Single type (Note -> Company) | `false` | 1 rule: `target_entity_type_id = company_uuid` |
| Multi-type (Note -> Company, Job) | `false` | 2 rules: one per type ID |
| Polymorphic (Note -> anything) | `true` | 0 rules (or optional overrides for specific types) |
| Semantic (Note -> any ORGANIZATION) | `false` | 1 rule: `semantic_type_constraint = "ORGANIZATION"`, `target_entity_type_id = null` |
| Mixed (Note -> Job + any ORGANIZATION) | `false` | 2 rules: one explicit type, one semantic |

For multi-type and polymorphic definitions, `cardinality_default` applies to any target type without a rule (or without a `cardinality_override`).

---

## Instance-Level Schema

### `entity_relationships` (simplified)

Single row per link. No inverse rows. Dropped `source_entity_type_id` and `target_entity_type_id` (derivable). Renamed `relationship_field_id` to `relationship_definition_id` with a proper foreign key.

```sql
CREATE TABLE entity_relationships (
    id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id               UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_entity_id           UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id           UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_definition_id UUID NOT NULL REFERENCES relationship_definitions(id) ON DELETE RESTRICT,
    created_at                 TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at                 TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by                 UUID,
    updated_by                 UUID,
    deleted                    BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at                 TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    CONSTRAINT uq_entity_relationship UNIQUE (source_entity_id, relationship_definition_id, target_entity_id)
);
```

`ON DELETE RESTRICT` on `relationship_definition_id` forces explicit cleanup of instance data before a definition can be removed.

---

## Write-Time Validation

When saving a link (insert into `entity_relationships`):

1. Load `relationship_definition` by ID
2. Check target entity type is allowed:
   - `allow_polymorphic = true` and no matching rule → accept (use `cardinality_default`)
   - `allow_polymorphic = false` → must match a rule:
     - Rule with `target_entity_type_id` matching target's type → match
     - Rule with `semantic_type_constraint` matching target type's semantic classification (looked up from `entity_type_semantic_metadata`) → match
     - Rule with both set → both must match
     - No rule matches → reject
3. Determine applicable cardinality:
   - Matching rule with `cardinality_override` set → use override
   - Otherwise → use `cardinality_default`
4. Enforce cardinality (count existing links, reject if exceeded)

---

## Inverse Resolution (Query-Time)

Bidirectional visibility is resolved at query time instead of through REFERENCE definitions.

**Forward query** (entity is source): `WHERE source_entity_id = :entityId AND relationship_definition_id = :defId`

**Inverse query** (entity is target): `WHERE target_entity_id = :entityId AND relationship_definition_id = :defId`

To find all relationships an entity type participates in:

```sql
-- Definitions where type is the source
SELECT * FROM relationship_definitions WHERE source_entity_type_id = :typeId;

-- Definitions where type is a visible target (inverse)
SELECT rd.*, rtr.inverse_name, rtr.cardinality_override
FROM relationship_definitions rd
JOIN relationship_target_rules rtr ON rtr.relationship_definition_id = rd.id
WHERE rtr.target_entity_type_id = :typeId
  AND rtr.inverse_visible = true;
```

---

## Query Engine Compatibility

**`RelationshipSqlGenerator`**: Column rename (`relationship_field_id` -> `relationship_definition_id`). Add direction awareness — caller passes `QueryDirection` (FORWARD/INVERSE) and generator uses `source_entity_id` or `target_entity_id` accordingly.

**`QueryFilterValidator`**: Input changes from `Map<UUID, EntityRelationshipDefinition>` to `Map<UUID, RelationshipDefinition>`. Same validation logic.

**`QueryFilter.Relationship`**: Unchanged. The `relationshipId: UUID` now points to a row in `relationship_definitions`.

**`RelationshipFilter` variants**: All six variants (Exists, NotExists, TargetEquals, TargetMatches, TargetTypeMatches, CountMatches) work unchanged.

**Public API contract**: Filter JSON structure is unchanged — transparent to API consumers.

---

## Impact Analysis

Scoped to the single definition being changed. No cascading across entity types.

### Delete a relationship definition

```sql
SELECT COUNT(*) FROM entity_relationships
WHERE relationship_definition_id = :defId AND deleted = false;
```

Warn if count > 0: "X entity links will be removed."

### Remove a target rule

```sql
SELECT COUNT(*) FROM entity_relationships er
JOIN entities e ON er.target_entity_id = e.id
WHERE er.relationship_definition_id = :defId
  AND e.type_id = :targetTypeId
  AND er.deleted = false;
```

Warn if count > 0: "X links to [TargetTypeName] entities will be removed."

### Restrict cardinality

```sql
SELECT er.source_entity_id, e.type_id AS target_type_id, COUNT(*) AS link_count
FROM entity_relationships er
JOIN entities e ON er.target_entity_id = e.id
WHERE er.relationship_definition_id = :defId AND er.deleted = false
GROUP BY er.source_entity_id, e.type_id
HAVING COUNT(*) > 1;
```

Warn if violations exist: "X source entities have more links than the new cardinality allows."

### Disable polymorphic (true -> false)

```sql
SELECT DISTINCT e.type_id, COUNT(*) AS link_count
FROM entity_relationships er
JOIN entities e ON er.target_entity_id = e.id
WHERE er.relationship_definition_id = :defId
  AND er.deleted = false
  AND e.type_id NOT IN (
      SELECT target_entity_type_id FROM relationship_target_rules
      WHERE relationship_definition_id = :defId
      AND target_entity_type_id IS NOT NULL
  )
GROUP BY e.type_id;
```

Warn if any exist: "Links to X entity types not covered by target rules will be removed."

All use the existing two-pass pattern: `impactConfirmed = false` returns analysis, `impactConfirmed = true` executes.

---

## Kotlin Model Changes

### New models

- `RelationshipDefinition` — replaces `EntityRelationshipDefinition`
- `RelationshipTargetRule` — new, per-target-type configuration

### Deleted models/classes

- `EntityRelationshipDefinition`
- `EntityTypeReferenceRelationshipBuilder`
- `EntityTypeRelationshipDiff`
- `EntityTypeRelationshipModification`
- `EntityTypeRelationshipImpactAnalysis`
- `EntityTypeRelationshipDeleteRequest`
- `EntityTypeRelationshipDataLossWarning`
- `EntityImpactSummary`
- `EntityRelationshipDefinitionValidator`

### Deleted enums

- `EntityTypeRelationshipType` (ORIGIN/REFERENCE)
- `EntityTypeRelationshipChangeType`
- `EntityTypeRelationshipDataLossReason`
- `EntityCategory` (STANDARD/RELATIONSHIP)

### Kept enums

- `EntityRelationshipCardinality` — unchanged, `invert()` extension removed
- `EntityPropertyType` — `RELATIONSHIP` variant still used by `columns` JSONB

### Service changes

- `EntityTypeRelationshipService` — rewritten for table-based definitions, no cascade logic
- `EntityRelationshipService` — simplified to single-row writes with cardinality enforcement
- `EntityTypeRelationshipDiffService` — deleted
- `EntityTypeRelationshipImpactAnalysisService` — replaced by scoped impact queries

### `EntityTypeEntity` changes

- Remove `relationships` JSONB column
- Remove `type` / `EntityCategory` column
- Keep `columns` JSONB (references `relationship_definitions.id` with `EntityPropertyType.RELATIONSHIP`)
