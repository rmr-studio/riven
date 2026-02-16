-- =====================================================
-- INTEGRATION DEFINITIONS INDEXES
-- =====================================================

CREATE INDEX idx_integration_definitions_category ON integration_definitions(category);
CREATE INDEX idx_integration_definitions_active ON integration_definitions(active) WHERE active = true;
-- Note: slug index is provided by the UNIQUE constraint, no explicit index needed

-- =====================================================
-- INTEGRATION CONNECTIONS INDEXES
-- =====================================================

-- Note: workspace_id index is provided as the leading column of UNIQUE(workspace_id, integration_id)
CREATE INDEX idx_integration_connections_status ON integration_connections(status);
CREATE INDEX idx_integration_connections_integration ON integration_connections(integration_id);
