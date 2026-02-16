# Migration Guide — Integrations Branch

**Branch:** `master` (integrations feature work)
**Base:** Initial project commit (`933fa67`)
**Date:** 2026-02-15

---

## Summary of Database Changes

This branch introduces three categories of schema changes:

1. **Entity provenance tracking** — new columns on `entities` + a new `entity_attribute_provenance` table
2. **Integration platform tables** — `integration_definitions` (global catalog) + `integration_connections` (workspace-scoped)
3. **Seed data** — initial v1 integration catalog (HubSpot, Salesforce, Stripe, Zendesk, Intercom, Gmail)

---

## Flyway Migrations (Run Automatically)

These are located in `src/main/resources/db/migration/` and are executed by Flyway in version order on application boot. **If Flyway is configured, you do not need to run these manually** — Spring Boot will apply them.

If you need to run them manually (e.g. against a standalone database), execute them **in exact version order**:

### V001 — Add Entity Provenance Fields

**File:** `V001__add_entity_provenance_fields.sql`
**Commit:** `bf8519a` (feat(01-01): configure Flyway and add entity provenance tracking)

**What it does:**
- Adds 7 new columns to the existing `entities` table:
  - `source_type` (VARCHAR(50), NOT NULL, DEFAULT `'USER_CREATED'`) — origin of the entity
  - `source_integration_id` (UUID, nullable) — FK added later in V004
  - `source_external_id` (TEXT, nullable) — external system ID
  - `source_url` (TEXT, nullable) — link back to source
  - `first_synced_at` / `last_synced_at` (TIMESTAMPTZ, nullable) — sync timestamps
  - `sync_version` (BIGINT, NOT NULL, DEFAULT 0) — optimistic concurrency for sync
- Backfills all existing rows with `source_type = 'USER_CREATED'`
- Creates partial indexes on `source_integration_id` and `source_external_id`

**Prerequisites:** `entities` table must exist.

```bash
psql -d $DB_NAME -f src/main/resources/db/migration/V001__add_entity_provenance_fields.sql
```

---

### V002 — Create Entity Attribute Provenance Table

**File:** `V002__create_entity_attribute_provenance.sql`
**Commit:** `bf8519a` (feat(01-01): configure Flyway and add entity provenance tracking)

**What it does:**
- Creates new table `entity_attribute_provenance` for per-attribute source tracking
- Columns: `id`, `entity_id` (FK → entities), `attribute_id`, `source_type`, `source_integration_id`, `source_external_field`, `last_updated_at`, `override_by_user`, `override_at`
- Unique constraint on `(entity_id, attribute_id)`
- Indexes on `entity_id` and `source_integration_id` (partial)

**Prerequisites:** V001 must have run (depends on `entities` table).

```bash
psql -d $DB_NAME -f src/main/resources/db/migration/V002__create_entity_attribute_provenance.sql
```

---

### V003 — Create Integration Definitions Table

**File:** `V003__create_integration_definitions.sql`
**Commit:** `521b712` (feat(01-02): integration enums, database migrations, and RLS policies)

**What it does:**
- Creates new table `integration_definitions` — the **global** integration catalog (not workspace-scoped, no RLS)
- Columns: `id`, `slug` (UNIQUE), `name`, `icon_url`, `description`, `category`, `nango_provider_key`, `capabilities` (JSONB), `sync_config` (JSONB), `auth_config` (JSONB), `active`, `created_at`, `updated_at`
- Indexes on `category` and `active` (partial, WHERE active = true)
- Creates a generic `update_updated_at_column()` trigger function
- Attaches `set_integration_definitions_updated_at` trigger for auto-updating `updated_at`

**Prerequisites:** V002 must have run.

> **Note:** The `slug` column has a UNIQUE constraint which implicitly creates an index — no separate `idx_integration_definitions_slug` index is needed.

```bash
psql -d $DB_NAME -f src/main/resources/db/migration/V003__create_integration_definitions.sql
```

---

### V004 — Create Integration Connections Table

**File:** `V004__create_integration_connections.sql`
**Commit:** `521b712` (feat(01-02): integration enums, database migrations, and RLS policies)

**What it does:**
- Creates new table `integration_connections` — **workspace-scoped** connections
- Columns: `id`, `workspace_id` (FK → workspaces), `integration_id` (FK → integration_definitions), `nango_connection_id`, `status` (DEFAULT `'PENDING_AUTHORIZATION'`), `connection_metadata` (JSONB), `created_at`, `updated_at`, `created_by`, `updated_by`
- Unique constraint on `(workspace_id, integration_id)` — one connection per integration per workspace
- Indexes on `status` and `integration_id`
- **Enables RLS** on `integration_connections` with workspace-scoped policy
- **Retroactively adds FK constraints** for provenance columns created in V001/V002:
  - `entities.source_integration_id` → `integration_definitions(id) ON DELETE SET NULL`
  - `entity_attribute_provenance.source_integration_id` → `integration_definitions(id) ON DELETE SET NULL`

**Prerequisites:** V003 must have run (depends on `integration_definitions`). Also requires `workspaces` and `workspace_members` tables for RLS.

> **Note:** The `workspace_id` index is provided by the leading column of the UNIQUE constraint — no separate `idx_integration_connections_workspace` index is needed.

```bash
psql -d $DB_NAME -f src/main/resources/db/migration/V004__create_integration_connections.sql
```

---

### V005 — Seed Initial Integrations

**File:** `V005__seed_initial_integrations.sql`
**Commit:** `dbd845f` (feat(01-04): seed v1 integration catalog)

**What it does:**
- Inserts 6 integration definitions into the catalog:

| Slug         | Name       | Category   | Nango Provider Key |
|-------------|------------|------------|-------------------|
| `hubspot`   | HubSpot    | CRM        | `hubspot`         |
| `salesforce`| Salesforce | CRM        | `salesforce`      |
| `stripe`    | Stripe     | PAYMENTS   | `stripe`          |
| `zendesk`   | Zendesk    | SUPPORT    | `zendesk`         |
| `intercom`  | Intercom   | SUPPORT    | `intercom`        |
| `gmail`     | Gmail      | EMAIL      | `google-mail`     |

**Prerequisites:** V004 must have run (depends on `integration_definitions` table).

> **Idempotency warning:** This migration uses plain `INSERT` statements. Running it twice will fail due to the UNIQUE constraint on `slug`. This is by design — Flyway tracks applied versions.

```bash
psql -d $DB_NAME -f src/main/resources/db/migration/V005__seed_initial_integrations.sql
```

---

### V006 — Add Provenance RLS and Schema Cleanup *(UNCOMMITTED)*

**File:** `V006__add_provenance_rls_and_schema_cleanup.sql`
**Status:** Untracked / uncommitted — exists on disk but not yet committed

**What it does:**
1. **Enables RLS** on `entity_attribute_provenance` with workspace-scoped policies (inherits scope through `entity_id` → `entities.workspace_id`)
2. **Drops redundant indexes** (defensive `IF EXISTS`):
   - `idx_integration_definitions_slug` (covered by UNIQUE constraint)
   - `idx_integration_connections_workspace` (covered by UNIQUE composite leading column)
3. **Drops redundant RLS policy**:
   - `integration_connections_select_by_workspace` (superseded by the `FOR ALL` policy)

**Prerequisites:** V005 must have run. Requires `entity_attribute_provenance`, `entities`, and `workspace_members` tables.

```bash
psql -d $DB_NAME -f src/main/resources/db/migration/V006__add_provenance_rls_and_schema_cleanup.sql
```

---

## Complete Execution Order (Manual)

If running all migrations manually against a database that has the base schema (workspaces, users, entities, etc.) but none of these integrations changes:

```bash
DB_NAME="your_database"
MIGRATION_DIR="src/main/resources/db/migration"

psql -d $DB_NAME -f "$MIGRATION_DIR/V001__add_entity_provenance_fields.sql"
psql -d $DB_NAME -f "$MIGRATION_DIR/V002__create_entity_attribute_provenance.sql"
psql -d $DB_NAME -f "$MIGRATION_DIR/V003__create_integration_definitions.sql"
psql -d $DB_NAME -f "$MIGRATION_DIR/V004__create_integration_connections.sql"
psql -d $DB_NAME -f "$MIGRATION_DIR/V005__seed_initial_integrations.sql"
psql -d $DB_NAME -f "$MIGRATION_DIR/V006__add_provenance_rls_and_schema_cleanup.sql"
```

---

## Reference Schema Updates (db/schema/)

The following reference schema files were also updated to reflect the post-migration state. These are **not** executed as migrations — they represent the canonical DDL for fresh database setup.

### New files added:
| File | Description |
|------|-------------|
| `db/schema/01_tables/integrations.sql` | DDL for `integration_definitions` and `integration_connections` tables |
| `db/schema/02_indexes/integration_indexes.sql` | Indexes for both integration tables |
| `db/schema/05_rls/integration_rls.sql` | RLS policy for `integration_connections` |

### Modified files:
| File | Change |
|------|--------|
| `db/schema/01_tables/entities.sql` | Added provenance columns to `entities`, added `entity_attribute_provenance` table, added FK references to `integration_definitions` |
| `db/schema/02_indexes/integration_indexes.sql` | Removed redundant `slug` and `workspace_id` indexes (covered by UNIQUE constraints) |
| `db/schema/05_rls/integration_rls.sql` | Consolidated two separate SELECT/WRITE policies into a single `FOR ALL` policy |

### Schema README impact:
The `db/schema/README.md` execution order and quick setup script do **not** yet include the new integration files. If you use the quick setup script for fresh databases, you will need to add:
- `integrations.sql` to the TABLES array (after `entities.sql`)
- `integration_indexes.sql` to the INDEXES array
- `integration_rls.sql` to the RLS array

---

## Dependency Graph

```
V001 (entity provenance columns)
  └─► V002 (entity_attribute_provenance table)
        └─► V003 (integration_definitions table + trigger)
              └─► V004 (integration_connections + RLS + FK backfill)
                    └─► V005 (seed 6 integrations)
                          └─► V006 (provenance RLS + cleanup) [UNCOMMITTED]
```

---

## Warnings and Gotchas

1. **V001 performs a backfill UPDATE** — on large `entities` tables, this may take significant time. Consider running during low-traffic periods.

2. **V004 adds FK constraints retroactively** — if any rows in `entities.source_integration_id` or `entity_attribute_provenance.source_integration_id` reference non-existent `integration_definitions` IDs, the `ALTER TABLE ADD CONSTRAINT` will fail. These columns should be NULL for all pre-existing rows.

3. **V005 is not idempotent** — the `INSERT` statements will fail on duplicate `slug` values. If you need to re-run, either `DELETE FROM integration_definitions` first or wrap in `INSERT ... ON CONFLICT DO NOTHING`.

4. **V006 is uncommitted** — verify it should be included before deploying. It performs cleanup (dropping redundant indexes and policies) that is safe but assumes V003/V004 have already been applied.

5. **RLS requires `auth.uid()` function** — the RLS policies reference `auth.uid()` (Supabase auth function). If running outside Supabase, ensure this function exists or the policies will fail to evaluate.

6. **`update_updated_at_column()` function** — V003 creates this as a generic trigger function. If this function already exists in your database from another source, `CREATE OR REPLACE` will overwrite it. Verify the implementation is compatible.
