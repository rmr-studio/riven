-- =====================================================
-- ENTITY TYPES: Add semantic_group, drop description
-- =====================================================

-- Add semantic_group column to entity_types
ALTER TABLE entity_types ADD COLUMN IF NOT EXISTS semantic_group TEXT NOT NULL DEFAULT 'UNCATEGORIZED';

-- Remove description column from entity_types (migrated to semantic metadata definition)
ALTER TABLE entity_types DROP COLUMN IF EXISTS description;
