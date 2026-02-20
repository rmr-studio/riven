# Database Migration: `entity-semantics` branch

**Date:** 2026-02-20
**Branch:** `entity-semantics` → `main`

## Changed Files

| File | Status | Description |
|------|--------|-------------|
| `db/schema/00_extensions/extensions.sql` | Modified | Added `vector` extension |
| `db/schema/01_tables/entity_semantic_metadata.sql` | New | New table + 3 indexes |

## Migration Steps

Run in order against the target database.

### Step 1 — Enable the `vector` extension

```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

Source: `db/schema/00_extensions/extensions.sql`

### Step 2 — Create the `entity_type_semantic_metadata` table + indexes

```bash
psql -d $DB_NAME -f db/schema/01_tables/entity_semantic_metadata.sql
```

Source: `db/schema/01_tables/entity_semantic_metadata.sql`

This creates:

- Table `public.entity_type_semantic_metadata` with FK references to `workspaces(id)` and `entity_types(id)` (both `ON DELETE CASCADE`)
- Unique constraint on `(entity_type_id, target_type, target_id)`
- CHECK constraints on `target_type` (`ENTITY_TYPE`, `ATTRIBUTE`, `RELATIONSHIP`) and `classification` (`IDENTIFIER`, `CATEGORICAL`, `QUANTITATIVE`, `TEMPORAL`, `FREETEXT`, `RELATIONAL_REFERENCE`)
- 3 indexes:
  - `idx_entity_semantic_metadata_workspace` — on `workspace_id`
  - `idx_entity_semantic_metadata_entity_type` — partial on `entity_type_id` where `deleted = false`
  - `idx_entity_semantic_metadata_target` — partial on `(target_type, target_id)` where `deleted = false`

## Dependencies

Both `workspaces` and `entity_types` tables already exist on main. No ordering issues beyond running Step 1 before Step 2.

## Gaps to Address

No corresponding files were added for:

- **`05_rls/`** — No RLS policy for the new table. Other entity tables have RLS policies (`entity_rls.sql`). If RLS is enforced at the DB level, one should be added here.
- **`09_grants/`** — No grants for the new table.

These may be intentional if access control is handled purely at the application layer via `@PreAuthorize`.
