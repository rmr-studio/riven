---
type: resource
Created: 2026-03-01
Updated: 2026-03-01
tags:
  - tool/flyway
  - database/migration
  - riven/infrastructure
---
# Flyway

## Summary

Flyway is a versioned database migration tool that will manage schema changes for Riven Core. Currently the project uses raw SQL files in `db/schema/` with manual execution order — Flyway replaces this with automatic, tracked, ordered migrations that run on application startup.

**Current state:**
- Gradle dependencies already present (`flyway-core` + `flyway-database-postgresql`)
- `spring.flyway.enabled: false` in all profiles
- Schema managed via 32 SQL files across `db/schema/00_extensions/` through `db/schema/09_grants/`
- Total schema: ~1,276 lines of SQL

**Target state:**
- Flyway enabled in production and integration test profiles
- `db/schema/` files consolidated into a single `V1__baseline.sql` migration
- All new schema changes as versioned Flyway migrations (`V2+`)
- `ddl-auto: validate` in production (Flyway migrates, Hibernate validates)

## Current Schema Management

The `db/schema/` directory organises SQL by concern with numbered directories controlling execution order:

```
db/schema/
├── 00_extensions/extensions.sql          # uuid-ossp, vector
├── 01_tables/                            # Table definitions (9 files)
│   ├── workspace.sql
│   ├── user.sql
│   ├── activity.sql
│   ├── blocks.sql
│   ├── entities.sql
│   ├── entity_semantic_metadata.sql
│   ├── integrations.sql
│   ├── lock.sql
│   └── workflow.sql
├── 02_indexes/                           # Index definitions (7 files)
├── 03_functions/                         # PostgreSQL functions (4 files)
├── 04_constraints/                       # Constraints (3 files)
├── 05_rls/                               # Row Level Security policies (4 files)
├── 08_triggers/                          # Trigger definitions (3 files)
└── 09_grants/                            # Permission grants (1 file)
```

**Execution order matters** — tables before indexes, functions before triggers, tables before constraints/RLS. This order is documented in `db/schema/README.md` and enforced manually.

**Pain points this structure creates:**
- No tracking of what's been applied to a given database
- Must nuke-and-rebuild to apply schema changes (acceptable in dev, not in prod)
- No incremental migration path
- Manual coordination of execution order

## Adoption Strategy

### When to Switch

Adopt Flyway when **any** of these become true:
- Persistent data exists that cannot be wiped (staging, beta, production)
- Multiple developers are making concurrent schema changes
- Preparing for first production deployment

### Pre-Production (Current Phase)

Continue editing `db/schema/` files directly. They represent the desired state and are easy to reason about during rapid iteration. Nuke-and-rebuild is cheap.

### Transition

When ready, perform a one-time baseline conversion (described below), then all future changes go through Flyway migrations exclusively.

## Baseline Migration

### Step 1 — Create the migration directory

```
src/main/resources/db/migration/
```

### Step 2 — Consolidate `db/schema/` into `V1__baseline.sql`

Concatenate all SQL files in the correct execution order defined in `db/schema/README.md`:

```bash
#!/bin/bash
# Generate V1__baseline.sql from existing schema files
OUTPUT="src/main/resources/db/migration/V1__baseline.sql"

# Execution order from db/schema/README.md
FILES=(
    # Extensions
    "db/schema/00_extensions/extensions.sql"
    # Tables (dependency order)
    "db/schema/01_tables/workspace.sql"
    "db/schema/01_tables/user.sql"
    "db/schema/01_tables/activity.sql"
    "db/schema/01_tables/blocks.sql"
    "db/schema/01_tables/entities.sql"
    "db/schema/01_tables/entity_semantic_metadata.sql"
    "db/schema/01_tables/integrations.sql"
    "db/schema/01_tables/lock.sql"
    "db/schema/01_tables/workflow.sql"
    # Indexes
    "db/schema/02_indexes/workspace_indexes.sql"
    "db/schema/02_indexes/user_indexes.sql"
    "db/schema/02_indexes/activity_indexes.sql"
    "db/schema/02_indexes/block_indexes.sql"
    "db/schema/02_indexes/entity_indexes.sql"
    "db/schema/02_indexes/integration_indexes.sql"
    "db/schema/02_indexes/workflow_indexes.sql"
    # Functions
    "db/schema/03_functions/workspace_functions.sql"
    "db/schema/03_functions/user_functions.sql"
    "db/schema/03_functions/entity_functions.sql"
    # Constraints
    "db/schema/04_constraints/workspace_constraints.sql"
    "db/schema/04_constraints/block_constraints.sql"
    "db/schema/04_constraints/entity_constraints.sql"
    "db/schema/04_constraints/workflow_constraints.sql"
    # RLS
    "db/schema/05_rls/workspace_rls.sql"
    "db/schema/05_rls/block_rls.sql"
    "db/schema/05_rls/entity_rls.sql"
    "db/schema/05_rls/integration_rls.sql"
    # Triggers
    "db/schema/08_triggers/workspace_triggers.sql"
    "db/schema/08_triggers/user_triggers.sql"
    "db/schema/08_triggers/entity_triggers.sql"
    # Grants
    "db/schema/09_grants/auth_grants.sql"
)

echo "-- Riven Core Baseline Schema" > "$OUTPUT"
echo "-- Generated from db/schema/ on $(date +%Y-%m-%d)" >> "$OUTPUT"
echo "" >> "$OUTPUT"

for file in "${FILES[@]}"; do
    echo "-- ======================================" >> "$OUTPUT"
    echo "-- Source: $file" >> "$OUTPUT"
    echo "-- ======================================" >> "$OUTPUT"
    cat "$file" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
done
```

**Important:** Remove any `DROP TABLE IF EXISTS ... CASCADE` statements from the baseline. These exist in the current schema files for nuke-and-rebuild convenience but should not appear in a migration that creates tables from scratch.

### Step 3 — Handle auth/Supabase-specific SQL

The following files reference Supabase's `auth` schema, which Flyway **cannot modify** on Supabase-hosted databases:
- `db/schema/03_functions/auth_functions.sql` — `custom_access_token_hook()`
- `db/schema/09_grants/auth_grants.sql` — grants to `supabase_auth_admin`

**Options:**
1. **Exclude from Flyway entirely** — apply these via Supabase dashboard or CLI. Keep them in `db/schema/` as reference.
2. **Include with conditional guards** — wrap in `DO $$ BEGIN ... EXCEPTION WHEN ... END $$` blocks that gracefully skip on permission errors.
3. **Separate migration location** — put Supabase-specific SQL in a `db/migration-supabase/` directory, only included when running against Supabase.

**Recommended:** Option 1. Keep auth grants and auth functions as Supabase-managed. They're infrastructure-level, not application-level.

### Step 4 — Baseline existing databases

For any database that already has the schema applied (dev, staging):

```bash
flyway baseline -baselineVersion=1 -baselineDescription="Initial_schema"
```

Or via Spring Boot config (auto-baselines on first migrate):

```yaml
spring:
  flyway:
    baseline-on-migrate: true
    baseline-version: 1
```

This creates the `flyway_schema_history` table with a `BASELINE` entry at V1. Flyway will **not** execute `V1__baseline.sql` on this database — it considers everything up to V1 as already applied.

For **fresh databases** (new developer, CI): Flyway runs `V1__baseline.sql` to create everything from scratch.

### Step 5 — New migrations start at V2+

```
src/main/resources/db/migration/
    V1__baseline.sql
    V2__Add_workflow_status_column.sql
    V3__Create_notification_table.sql
    ...
```

## Configuration

### Gradle (already present)

```kotlin
// build.gradle.kts
implementation("org.flywaydb:flyway-core")
implementation("org.flywaydb:flyway-database-postgresql")
```

No Gradle plugin needed — Spring Boot auto-configuration handles runtime migration.

### Production (`application.yml`)

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true          # Auto-baseline for existing DBs
    baseline-version: 1
    schemas:
      - public
    table: flyway_schema_history
    validate-on-migrate: true
    clean-disabled: true               # Safety — never clean prod
  jpa:
    hibernate:
      ddl-auto: validate               # Flyway migrates, Hibernate validates
```

### Unit Tests (`application-test.yml`) — No Change

```yaml
spring:
  flyway:
    enabled: false                     # H2 cannot run PostgreSQL-specific SQL
  jpa:
    hibernate:
      ddl-auto: create-drop            # Hibernate generates schema from entities
```

### Integration Tests (`application-integration.yml`)

```yaml
spring:
  flyway:
    enabled: true                      # Flyway runs against real PostgreSQL
    locations: classpath:db/migration
    clean-disabled: false              # Allow clean in test environments
  jpa:
    hibernate:
      ddl-auto: validate               # Validates entity/schema alignment
```

## Supabase Considerations

### Schema Restrictions

Supabase restricts third-party modifications to `auth`, `storage`, and `realtime` schemas. Flyway migrations must only target the `public` schema (and any custom schemas you create).

**Do not include in Flyway migrations:**
- `auth.users` references or modifications
- `storage.*` operations
- `realtime.*` operations
- Auth hook functions that reference `auth` schema internals
- Grants to Supabase internal roles (`supabase_auth_admin`)

### Connection

```yaml
spring:
  flyway:
    url: jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
    user: postgres
    password: ${SUPABASE_DB_PASSWORD}
    schemas:
      - public
```

- Use the **direct connection** (port 5432), not the pooled connection (port 6543)
- SSL is required (`sslmode=require`)
- If `spring.flyway.url` is omitted, Flyway uses the application's primary `DataSource`

## Test Strategy

| Profile         | Flyway   | ddl-auto      | Database    | Purpose                            |
|-----------------|----------|---------------|-------------|-------------------------------------|
| `test`          | Disabled | `create-drop` | H2          | Fast unit tests, entity-generated schema |
| `integration`   | Enabled  | `validate`    | Testcontainers PostgreSQL | Validates migrations work on real PG |
| Production      | Enabled  | `validate`    | Supabase PostgreSQL | Flyway owns schema, Hibernate validates |

**Why keep Flyway off for H2 unit tests:**
- PostgreSQL extensions (`uuid-ossp`, `vector`) — not supported in H2
- RLS policies (`CREATE POLICY`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) — not supported
- Dollar-quoting (`$$`) for function bodies — not supported
- JSONB operators (`->`, `->>`, `@>`) — limited support
- `CREATE INDEX CONCURRENTLY` — not supported

The dual approach gives fast unit tests (H2, ~seconds) plus migration-validated integration tests (Testcontainers, ~30s startup).

## Ongoing Workflow

Once Flyway is adopted, all schema changes follow this process:

### Creating a New Migration

1. Create a new file in `src/main/resources/db/migration/`:
   ```
   V{next_version}__{description}.sql
   ```

2. Write the DDL/DML:
   ```sql
   -- V2__Add_notification_preferences.sql
   ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{}'::jsonb;
   CREATE INDEX idx_users_notification_prefs ON users USING GIN (notification_preferences);
   ```

3. Start the application (or run integration tests) — Flyway applies it automatically.

### Rules

- **Never edit an applied migration** — create a new one instead
- **Never delete a migration file** — Flyway tracks all historical files
- **One logical change per migration** — easier to debug, review, and roll back manually
- **Use `IF NOT EXISTS` / `CREATE OR REPLACE`** where possible for idempotency
- **Keep `db/schema/` in sync** (optional) — update as a human-readable reference of current state, or deprecate in favour of Flyway being the single source of truth
- **For team development** — consider timestamp-based versions (`V20260301120000__description.sql`) to avoid version conflicts across branches

### Repeatable Migrations

Use `R__` prefix for objects that should be recreated when changed:

```sql
-- R__entity_functions.sql
CREATE OR REPLACE FUNCTION sync_entity_identifier_key()
RETURNS TRIGGER AS $$
BEGIN
    -- function body
END;
$$ LANGUAGE plpgsql;
```

Functions, views, and triggers are good candidates — their definitions are idempotent and benefit from the "always current" semantics of repeatable migrations.

## References

- [Flyway Documentation](https://documentation.red-gate.com/flyway/)
- [Spring Boot Database Initialization](https://docs.spring.io/spring-boot/how-to/data-initialization.html)
- [Flyway + Supabase with GitHub Actions](https://dev.to/sruhleder/how-to-migrate-supabase-databases-with-flyway-github-actions-2ani)
- [Best Practices for Flyway and Hibernate](https://rieckpil.de/howto-best-practices-for-flyway-and-hibernate-with-spring-boot/)

## Linked Features

- [[Tech Stack]]
- [[Temporal]]
