-- Add provenance tracking fields to entities table
-- This migration adds source tracking at the entity level

-- 1. Add source_type column (nullable first, then set NOT NULL with default)
ALTER TABLE entities ADD COLUMN source_type VARCHAR(50);

-- 2. Backfill existing rows with USER_CREATED
UPDATE entities SET source_type = 'USER_CREATED' WHERE source_type IS NULL;

-- 3. Set default and NOT NULL constraint
ALTER TABLE entities ALTER COLUMN source_type SET DEFAULT 'USER_CREATED';
ALTER TABLE entities ALTER COLUMN source_type SET NOT NULL;

-- 4. Add remaining provenance columns (nullable)
ALTER TABLE entities ADD COLUMN source_integration_id UUID;
ALTER TABLE entities ADD COLUMN source_external_id TEXT;
ALTER TABLE entities ADD COLUMN source_url TEXT;
ALTER TABLE entities ADD COLUMN first_synced_at TIMESTAMPTZ;
ALTER TABLE entities ADD COLUMN last_synced_at TIMESTAMPTZ;

-- 5. Add sync_version column with NOT NULL and default
ALTER TABLE entities ADD COLUMN sync_version BIGINT NOT NULL DEFAULT 0;

-- 6. Add indexes for common query patterns
CREATE INDEX idx_entities_source_integration ON entities(source_integration_id) WHERE source_integration_id IS NOT NULL;
CREATE INDEX idx_entities_source_external_id ON entities(source_external_id) WHERE source_external_id IS NOT NULL;
