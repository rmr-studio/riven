-- =====================================================
-- MIGRATION: Entity Relationships Restructure
-- Branch: entity-relationships
-- Date: 2026-02-20
-- =====================================================
--
-- SUMMARY OF CHANGES:
--   This migration restructures the entity relationships system by:
--     1. Removing the "type" and "relationships" columns from entity_types
--     2. Removing the CHECK constraint that tied type/relationships together
--     3. Creating a new relationship_definitions table (replaces inline JSONB config)
--     4. Creating a new relationship_target_rules table (per-target cardinality/visibility)
--     5. Restructuring entity_relationships to reference relationship_definitions
--     6. Updating indexes and constraints accordingly
--     7. Adding RLS policies for the two new tables
--
-- IMPORTANT: Read each step carefully. Steps are ordered for safe execution.
-- If you have existing data, review the DATA MIGRATION section (Step 4).
--
-- Run this in a transaction so it's all-or-nothing.
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Drop dependent objects on entity_relationships
-- (constraints, indexes, RLS policies)
-- =====================================================
-- These must be dropped before we alter columns on entity_relationships.

-- Drop existing unique constraint
ALTER TABLE public.entity_relationships
    DROP CONSTRAINT IF EXISTS uq_relationship_source_target_field;

-- Drop indexes that reference columns being removed
DROP INDEX IF EXISTS idx_entity_relationships_workspace_source_type;
DROP INDEX IF EXISTS idx_entity_relationships_workspace_target_type;

-- Drop RLS policies on entity_relationships (will be recreated after restructure)
DROP POLICY IF EXISTS "entity_relationships_select_by_org" ON entity_relationships;
DROP POLICY IF EXISTS "entity_relationships_write_by_org" ON entity_relationships;


-- =====================================================
-- STEP 2: Alter entity_types — remove columns and constraint
-- =====================================================

-- Remove the CHECK constraint linking type and relationships columns
-- (The constraint name may vary — this drops all CHECK constraints matching the pattern)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.entity_types'::regclass
          AND contype = 'c'
          AND (
            conname LIKE '%type%relationship%'
            OR conname LIKE '%entity_types_check%'
          )
    LOOP
        EXECUTE format('ALTER TABLE public.entity_types DROP CONSTRAINT IF EXISTS %I', r.conname);
        RAISE NOTICE 'Dropped CHECK constraint: %', r.conname;
    END LOOP;
END $$;

-- Remove the "type" CHECK constraint explicitly (auto-generated name varies)
-- This handles the inline CHECK (type IN ('STANDARD', 'RELATIONSHIP'))
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.entity_types'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%type%'
    LOOP
        EXECUTE format('ALTER TABLE public.entity_types DROP CONSTRAINT IF EXISTS %I', r.conname);
        RAISE NOTICE 'Dropped type CHECK constraint: %', r.conname;
    END LOOP;
END $$;

-- Drop the columns
ALTER TABLE public.entity_types DROP COLUMN IF EXISTS "type";
ALTER TABLE public.entity_types DROP COLUMN IF EXISTS "relationships";


-- =====================================================
-- STEP 3: Create new tables
-- =====================================================

-- 3a. relationship_definitions
CREATE TABLE IF NOT EXISTS public.relationship_definitions
(
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

-- 3b. relationship_target_rules
CREATE TABLE IF NOT EXISTS public.relationship_target_rules
(
    "id"                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "relationship_definition_id" UUID NOT NULL REFERENCES public.relationship_definitions(id) ON DELETE CASCADE,
    "target_entity_type_id"      UUID REFERENCES public.entity_types(id) ON DELETE CASCADE,
    "semantic_type_constraint"   TEXT,
    "cardinality_override"       TEXT CHECK (cardinality_override IN ('ONE_TO_ONE','ONE_TO_MANY','MANY_TO_ONE','MANY_TO_MANY')),
    "inverse_visible"            BOOLEAN NOT NULL DEFAULT FALSE,
    "inverse_name"               TEXT,
    "created_at"                 TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at"                 TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "created_by"                 UUID,
    "updated_by"                 UUID,

    CONSTRAINT chk_target_or_semantic CHECK (
        target_entity_type_id IS NOT NULL OR semantic_type_constraint IS NOT NULL
    )
);


-- =====================================================
-- STEP 4: DATA MIGRATION (if applicable)
-- =====================================================
-- If you have existing data in entity_relationships or entity_types.relationships,
-- you need to migrate it BEFORE altering entity_relationships columns.
--
-- OPTION A: No existing relationship data (fresh/dev environment)
--   → Skip this step, proceed to Step 5.
--
-- OPTION B: You have existing entity_relationships rows
--   → You must create corresponding relationship_definitions first,
--     then map old relationship_field_id values to new relationship_definition_id values.
--
-- Example migration for Option B (CUSTOMIZE THIS FOR YOUR DATA):
--
-- INSERT INTO public.relationship_definitions (id, workspace_id, source_entity_type_id, name, icon_type, icon_value, cardinality_default)
-- SELECT DISTINCT
--     relationship_field_id,              -- reuse as the definition ID
--     workspace_id,
--     source_entity_type_id,
--     'Migrated Relationship',            -- placeholder name
--     'LUCIDE',                           -- placeholder icon_type
--     'link',                             -- placeholder icon_value
--     'MANY_TO_MANY'                      -- placeholder cardinality
-- FROM public.entity_relationships
-- WHERE deleted = FALSE;
--
-- After creating definitions, proceed to Step 5 which will remap the column.


-- =====================================================
-- STEP 5: Restructure entity_relationships table
-- =====================================================

-- Drop columns that are being removed
ALTER TABLE public.entity_relationships DROP COLUMN IF EXISTS "source_entity_type_id";
ALTER TABLE public.entity_relationships DROP COLUMN IF EXISTS "target_entity_type_id";
ALTER TABLE public.entity_relationships DROP COLUMN IF EXISTS "relationship_field_id";

-- Add the new foreign key column
-- (If you ran the data migration in Step 4, you may want to populate this from relationship_field_id first)
ALTER TABLE public.entity_relationships
    ADD COLUMN IF NOT EXISTS "relationship_definition_id" UUID;

-- If you have existing rows, you would UPDATE them here:
-- UPDATE public.entity_relationships SET relationship_definition_id = relationship_field_id;

-- Now make it NOT NULL and add the FK constraint
ALTER TABLE public.entity_relationships
    ALTER COLUMN "relationship_definition_id" SET NOT NULL;

ALTER TABLE public.entity_relationships
    ADD CONSTRAINT fk_entity_rel_definition
    FOREIGN KEY ("relationship_definition_id")
    REFERENCES public.relationship_definitions(id)
    ON DELETE RESTRICT;


-- =====================================================
-- STEP 6: Recreate indexes
-- =====================================================

-- 6a. New indexes for relationship_definitions
CREATE INDEX IF NOT EXISTS idx_rel_def_workspace_source
    ON relationship_definitions (workspace_id, source_entity_type_id)
    WHERE deleted = FALSE;

-- 6b. New indexes for relationship_target_rules
CREATE INDEX IF NOT EXISTS idx_target_rule_def
    ON relationship_target_rules (relationship_definition_id);

CREATE INDEX IF NOT EXISTS idx_target_rule_type
    ON relationship_target_rules (target_entity_type_id);

-- 6c. Recreate entity_relationships indexes (unchanged from before, but old type-based ones are gone)
DROP INDEX IF EXISTS idx_entity_relationships_workspace_source;
CREATE INDEX IF NOT EXISTS idx_entity_relationships_workspace_source
    ON entity_relationships (workspace_id, source_entity_id)
    WHERE deleted = FALSE AND deleted_at IS NULL;

DROP INDEX IF EXISTS idx_entity_relationships_workspace_target;
CREATE INDEX IF NOT EXISTS idx_entity_relationships_workspace_target
    ON entity_relationships (workspace_id, target_entity_id)
    WHERE deleted = FALSE AND deleted_at IS NULL;


-- =====================================================
-- STEP 7: Recreate constraints
-- =====================================================

ALTER TABLE public.entity_relationships
    DROP CONSTRAINT IF EXISTS uq_entity_relationship;

ALTER TABLE public.entity_relationships
    ADD CONSTRAINT uq_entity_relationship
    UNIQUE (source_entity_id, relationship_definition_id, target_entity_id);


-- =====================================================
-- STEP 8: RLS policies for new tables
-- =====================================================

-- 8a. relationship_definitions RLS
ALTER TABLE public.relationship_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rel_definitions_select_by_workspace" ON public.relationship_definitions
    FOR SELECT TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "rel_definitions_write_by_workspace" ON public.relationship_definitions
    FOR ALL TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

-- 8b. relationship_target_rules RLS
-- Scoped through parent relationship_definition → workspace
ALTER TABLE public.relationship_target_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "target_rules_select_by_workspace" ON public.relationship_target_rules
    FOR SELECT TO authenticated
    USING (
        relationship_definition_id IN (
            SELECT id FROM relationship_definitions WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "target_rules_write_by_workspace" ON public.relationship_target_rules
    FOR ALL TO authenticated
    USING (
        relationship_definition_id IN (
            SELECT id FROM relationship_definitions WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        relationship_definition_id IN (
            SELECT id FROM relationship_definitions WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            )
        )
    );

-- 8c. Recreate entity_relationships RLS (same logic, just dropped earlier for safety)
CREATE POLICY "entity_relationships_select_by_org" ON entity_relationships
    FOR SELECT TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "entity_relationships_write_by_org" ON entity_relationships
    FOR ALL TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );


COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION
-- =====================================================
-- Run these queries to verify the migration was successful:
--
-- 1. Verify entity_types no longer has "type" or "relationships" columns:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'entity_types' AND column_name IN ('type', 'relationships');
--    → Should return 0 rows
--
-- 2. Verify new tables exist:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public' AND table_name IN ('relationship_definitions', 'relationship_target_rules');
--    → Should return 2 rows
--
-- 3. Verify entity_relationships has relationship_definition_id:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'entity_relationships' AND column_name = 'relationship_definition_id';
--    → Should return 1 row
--
-- 4. Verify entity_relationships no longer has removed columns:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'entity_relationships'
--    AND column_name IN ('source_entity_type_id', 'target_entity_type_id', 'relationship_field_id');
--    → Should return 0 rows
--
-- 5. Verify RLS is enabled on new tables:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE tablename IN ('relationship_definitions', 'relationship_target_rules');
--    → Both should show rowsecurity = true
--
-- 6. Verify indexes:
--    SELECT indexname FROM pg_indexes
--    WHERE tablename IN ('relationship_definitions', 'relationship_target_rules', 'entity_relationships');
