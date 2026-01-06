# Riven Database Schema

This directory contains the PostgreSQL database schema for Riven, organized into numbered folders that execute in a specific order.

## Directory Structure

```
db/
├── schema/                      # Database schema files
│   ├── 00_extensions/          # PostgreSQL extensions (e.g., uuid-ossp, pgcrypto)
│   ├── 01_tables/              # Table definitions (DDL)
│   ├── 02_indexes/             # Performance indexes
│   ├── 03_functions/           # Stored procedures and functions
│   ├── 04_constraints/         # Foreign keys, unique constraints, checks
│   ├── 05_rls/                 # Row-level security policies
│   ├── 06_types/               # Custom PostgreSQL types
│   ├── 07_views/               # Database views
│   ├── 08_triggers/            # Database triggers
│   └── 09_grants/              # User permissions and grants
├── seed/                        # Seed data (optional)
│   └── seed-system-block-types.sql
├── run-migrations.sh            # Migration script
└── README.md                    # This file
```

## Execution Order

The numbered folders ensure the correct execution order:

1. **00_extensions** - Install PostgreSQL extensions first
2. **01_tables** - Create tables (base schema)
3. **02_indexes** - Add indexes for performance
4. **03_functions** - Define stored procedures and functions
5. **04_constraints** - Add foreign keys and constraints (requires tables to exist)
6. **05_rls** - Apply row-level security policies
7. **06_types** - Create custom types
8. **07_views** - Create database views
9. **08_triggers** - Add triggers (requires tables and functions)
10. **09_grants** - Grant permissions to users

Within each folder, SQL files are executed in alphabetical order.

## Running Migrations

### Prerequisites

- PostgreSQL database created and accessible
- Environment variables configured (see below)

### Environment Variables

Set the following environment variables before running migrations:

```bash
export POSTGRES_HOST=localhost          # Database host (default: localhost)
export POSTGRES_PORT=5432               # Database port (default: 5432)
export POSTGRES_DB=riven                # Database name (default: riven)
export POSTGRES_USER=postgres           # Database user (default: postgres)
export POSTGRES_PASSWORD=your_password  # Database password (required)
```

### Basic Usage

Run all schema migrations:

```bash
cd db
./run-migrations.sh
```

### With Seed Data

Run migrations and include seed data:

```bash
./run-migrations.sh --with-seed
```

### Dry Run

Preview which files would be executed without actually running them:

```bash
./run-migrations.sh --dry-run
```

### Dry Run with Seed

```bash
./run-migrations.sh --dry-run --with-seed
```

### Help

```bash
./run-migrations.sh --help
```

## Adding New Migrations

### Adding a New Table

1. Create a new SQL file in `schema/01_tables/`:
   ```bash
   touch schema/01_tables/my_new_table.sql
   ```

2. Define your table:
   ```sql
   CREATE TABLE IF NOT EXISTS my_new_table (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       name TEXT NOT NULL,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. Run migrations:
   ```bash
   ./run-migrations.sh
   ```

### Adding Indexes

Create a file in `schema/02_indexes/`:

```sql
-- schema/02_indexes/my_new_table_indexes.sql
CREATE INDEX IF NOT EXISTS idx_my_new_table_name
    ON my_new_table(name);

CREATE INDEX IF NOT EXISTS idx_my_new_table_created_at
    ON my_new_table(created_at DESC);
```

### Adding Functions

Create a file in `schema/03_functions/`:

```sql
-- schema/03_functions/my_functions.sql
CREATE OR REPLACE FUNCTION my_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Function logic
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Adding Constraints

Create a file in `schema/04_constraints/`:

```sql
-- schema/04_constraints/my_new_table_constraints.sql
ALTER TABLE my_new_table
    ADD CONSTRAINT fk_workspace
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces(id)
    ON DELETE CASCADE;
```

### Adding RLS Policies

Create a file in `schema/05_rls/`:

```sql
-- schema/05_rls/my_new_table_rls.sql
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace data"
    ON my_new_table
    FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );
```

### Adding Triggers

Create a file in `schema/08_triggers/`:

```sql
-- schema/08_triggers/my_new_table_triggers.sql
CREATE TRIGGER my_trigger
    BEFORE INSERT OR UPDATE ON my_new_table
    FOR EACH ROW
    EXECUTE FUNCTION my_function();
```

## Best Practices

### File Naming

- Use descriptive names: `workspace_indexes.sql` not `indexes.sql`
- Group related items: `entity_constraints.sql`, `entity_indexes.sql`, `entity_triggers.sql`
- Use snake_case for filenames

### SQL Organization

- One logical unit per file (e.g., all workspace-related indexes in one file)
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Include comments explaining complex logic
- Use consistent formatting (4-space indentation recommended)

### Idempotency

All migration files should be idempotent (safe to run multiple times):

```sql
-- Good - idempotent
CREATE TABLE IF NOT EXISTS my_table (...);
CREATE INDEX IF NOT EXISTS idx_my_index ON my_table(...);

-- Bad - will fail on second run
CREATE TABLE my_table (...);
CREATE INDEX idx_my_index ON my_table(...);
```

### Dependencies

- Ensure dependencies are in earlier-numbered folders
- Foreign key constraints should reference tables defined in 01_tables
- Triggers should reference functions defined in 03_functions
- RLS policies should reference tables defined in 01_tables

## Troubleshooting

### Connection Errors

If you get connection errors:

1. Verify PostgreSQL is running: `pg_isready`
2. Check environment variables are set correctly
3. Verify database exists: `psql -l | grep riven`
4. Test connection manually:
   ```bash
   psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB
   ```

### Migration Failures

If a migration fails:

1. Check the error message for the specific SQL file that failed
2. Review the SQL syntax in that file
3. Ensure dependencies exist (e.g., referenced tables/functions)
4. Run with `--dry-run` to see execution order
5. Manually inspect database state: `psql -d riven`

### Rollback

This script does not provide automatic rollback. To rollback:

1. Manually drop affected objects:
   ```sql
   DROP TABLE IF EXISTS my_table CASCADE;
   ```

2. Or restore from backup:
   ```bash
   pg_restore -d riven backup.dump
   ```

## Integration with Application

The Spring Boot application in `/core` uses this schema. After running migrations:

1. Update `schema.sql` in the core directory if needed (kept as reference)
2. Restart the Spring Boot application
3. The application will use the migrated schema

## Version Control

- All schema changes should be committed to git
- Never modify existing migration files after they've been run in production
- Create new migration files for schema changes
- Document breaking changes in commit messages
