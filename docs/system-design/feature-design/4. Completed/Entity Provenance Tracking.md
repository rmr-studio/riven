---
tags:
  - priority/high
  - status/draft
  - architecture/feature
Created: 2026-02-13
Domains:
  - "[[Entities]]"
Sub-Domain: "[[Entity Integration Sync]]"
---
# Quick Design: Entity Provenance Tracking

## What & Why

Every entity in the system currently exists without any record of where its data originated. As the platform integrates with third-party tools (CRMs, payment systems, support platforms), entities will be created and updated from multiple sources: direct user input, integration syncs, bulk imports, API calls, and workflow automations. Without provenance metadata, there is no way to determine which source originally created an entity, which source last modified a given attribute, or how to resolve conflicts when two sources attempt to update the same field.

Entity provenance tracking adds source-of-origin metadata at both the entity level (where did this entity come from?) and the attribute level (which specific field was last touched by which source?). This enables three critical capabilities: conflict resolution during integration sync (knowing whether a user manually overrode an integration-synced value), audit trails for data origin (tracing any piece of data back to its source system), and deep linking back to source systems via `source_url` and `source_external_id`. This feature is the foundational layer that the entire integration sync pipeline depends on -- without it, the system cannot safely merge data from external platforms into the entity ecosystem.

---

## Data Changes

### Entity-Level Provenance (V001 Migration)

Seven new columns added to the `entities` table:

| Column | Type | Constraints | Default | Purpose |
|--------|------|-------------|---------|---------|
| `source_type` | `VARCHAR(50)` | `NOT NULL` | `'USER_CREATED'` | Enum indicating the origin of this entity |
| `source_integration_id` | `UUID` | Nullable, FK to `integration_definitions` | `NULL` | Which integration created this entity (if applicable) |
| `source_external_id` | `TEXT` | Nullable | `NULL` | The entity's ID in the source system (e.g., Stripe customer ID) |
| `source_url` | `TEXT` | Nullable | `NULL` | Deep link back to the entity in the source system |
| `first_synced_at` | `TIMESTAMPTZ` | Nullable | `NULL` | Timestamp of initial sync from the source system |
| `last_synced_at` | `TIMESTAMPTZ` | Nullable | `NULL` | Timestamp of most recent sync update |
| `sync_version` | `BIGINT` | `NOT NULL` | `0` | Monotonically increasing version counter for optimistic concurrency during sync |

### Attribute-Level Provenance (V002 Migration)

New `entity_attribute_provenance` table:

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | `UUID` | PK | Row identifier |
| `entity_id` | `UUID` | `NOT NULL`, FK to `entities` | The entity this attribute belongs to |
| `attribute_id` | `UUID` | `NOT NULL` | The attribute definition being tracked |
| `source_type` | `VARCHAR(50)` | `NOT NULL` | Origin of this attribute's current value |
| `source_integration_id` | `UUID` | Nullable, FK to `integration_definitions` | Which integration last set this attribute |
| `source_external_field` | `VARCHAR(255)` | Nullable | The field name in the source system that maps to this attribute |
| `last_updated_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` | When this attribute was last updated from the source |
| `override_by_user` | `BOOLEAN` | `NOT NULL`, default `false` | Whether a user manually overrode the integration-synced value |
| `override_at` | `TIMESTAMPTZ` | Nullable | When the user override occurred |

Unique constraint on `(entity_id, attribute_id)` -- each attribute on each entity has exactly one provenance record.

### SourceType Enum

New `SourceType` enum in `riven.core.enums.integration` with five values:

- `USER_CREATED` -- entity or attribute created directly by a user
- `INTEGRATION` -- data originated from a third-party integration sync
- `IMPORT` -- data came from a bulk import operation
- `API` -- data created via the public API
- `WORKFLOW` -- data produced by a workflow automation

---

## Components Affected

- **EntityEntity** (JPA entity) -- gains seven new provenance fields, all with sensible defaults so existing persistence operations are unaffected. Fields mapped with standard JPA annotations (`@Column`, `@Enumerated`).
- **Entity** (domain model / DTO) -- updated with corresponding provenance fields to carry provenance data through the service layer.
- **EntityAttributeProvenanceEntity** (new JPA entity) -- maps to the `entity_attribute_provenance` table. Standard `@Entity`/`@Table` annotations, UUID primary key with `GenerationType.UUID`.
- **EntityAttributeProvenanceRepository** (new repository) -- extends `JpaRepository<EntityAttributeProvenanceEntity, UUID>`. Provides query methods for looking up provenance by entity ID and attribute ID.

No changes to [[EntityService]], [[EntityController]], or [[EntityRepository]] are required in this phase. The provenance fields are additive and default-valued, so existing CRUD flows continue to work without modification.

---

## API Changes

None. All provenance fields have sensible defaults (`source_type` defaults to `USER_CREATED`, nullable fields default to `NULL`, `sync_version` defaults to `0`). Existing entity creation and update endpoints operate unchanged -- they produce entities with `USER_CREATED` provenance automatically. Provenance data will be populated by integration sync services in later phases, not through the REST API directly.

---

## Failure Handling

- **Flyway migration on existing database:** The `baseline-on-migrate=true` configuration with `baseline-version=0` ensures Flyway can adopt an existing schema without requiring a clean database. If the schema already exists, Flyway baselines and begins tracking from V001 onward.
- **Adding NOT NULL columns to populated tables:** The `source_type` and `sync_version` columns are added with `DEFAULT` values, which PostgreSQL handles as metadata-only operations on modern versions (12+) -- no full table rewrite or row-level lock is needed. This avoids blocking writes on large `entities` tables.
- **Migration failure mid-execution:** Each Flyway migration (V001, V002) runs in its own transaction. If V002 fails, V001 remains applied and the system can retry V002 on next startup. The two migrations are independent in that V001 modifies the `entities` table while V002 creates a new table.

---

## Gotchas & Edge Cases

- **Existing entity creation must not break.** Every provenance field either has a `DEFAULT` value or is nullable. The `EntityEntity` JPA class sets Kotlin defaults matching the database defaults, so any code path that creates an entity without specifying provenance fields produces a valid `USER_CREATED` entity.
- **Attribute provenance is forward-looking only.** No backfill of provenance records is performed for existing entities or their attributes. Provenance tracking begins when integration sync or explicitly provenance-aware operations write to the `entity_attribute_provenance` table. Historical data will not have attribute-level provenance.
- **Source type is immutable after creation.** The `source_type` on the `entities` table follows a "first source wins" rule -- it records how the entity was originally created and never changes afterward. An entity created by integration sync remains `INTEGRATION` even if a user later edits it. User edits are tracked at the attribute level via the `override_by_user` flag in `entity_attribute_provenance`.
- **Foreign key to integration_definitions.** The `source_integration_id` columns on both tables reference `integration_definitions`, which is created in a later migration (V004). The FK constraints are added in V004, not V001/V002, to avoid circular migration dependencies.
- **Unique constraint on attribute provenance.** The `UNIQUE(entity_id, attribute_id)` constraint means there is exactly one provenance record per attribute per entity. If an attribute is updated by a different source, the existing provenance record is updated in place rather than creating a new row.

---

## Tasks

- [ ] **V001 Migration + Entity Provenance Fields:** Add Flyway dependencies, configure baseline-on-migrate, create V001 migration adding 7 provenance columns to `entities` table, create `SourceType` enum, update `EntityEntity` JPA class and `Entity` domain model with provenance fields.
- [ ] **V002 Migration + Attribute Provenance:** Create V002 migration for `entity_attribute_provenance` table, create `EntityAttributeProvenanceEntity` JPA class, create `EntityAttributeProvenanceRepository`.

---

## Notes

- The provenance system is the foundation that later phases of the integration sync pipeline build upon. Phase 4 (conflict resolution) uses `override_by_user` and `sync_version` to determine whether incoming sync data should overwrite existing values. Phase 6 (provenance UI) surfaces provenance metadata to users so they can see where each piece of data originated.
- The `sync_version` field enables optimistic concurrency control during sync operations -- the sync process increments the version on each successful sync, and concurrent sync attempts can detect stale writes by comparing versions.
- The `source_external_field` column in attribute provenance is critical for [[Integration Schema Mapping]] -- it records which field in the source system (e.g., `stripe.customer.email`) maps to which entity attribute, enabling bidirectional mapping traceability.
