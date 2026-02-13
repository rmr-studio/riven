-- Create attribute-level provenance tracking table
-- Tracks the source of individual entity attributes for multi-source entities

CREATE TABLE IF NOT EXISTS entity_attribute_provenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_integration_id UUID,
    source_external_field VARCHAR(255),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    override_by_user BOOLEAN NOT NULL DEFAULT false,
    override_at TIMESTAMPTZ,
    UNIQUE(entity_id, attribute_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_provenance_entity ON entity_attribute_provenance(entity_id);
CREATE INDEX idx_provenance_integration ON entity_attribute_provenance(source_integration_id) WHERE source_integration_id IS NOT NULL;
