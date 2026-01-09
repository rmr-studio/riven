DROP TABLE IF EXISTS "workflow_definitions" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_definitions"
(
    "id"                   UUID PRIMARY KEY                NOT NULL DEFAULT uuid_generate_v4(),
    "workspace_id"         UUID REFERENCES workspaces (id) NOT NULL,
    "name"                 TEXT                            NOT NULL,
    "description"          TEXT,
    "published_version_id" UUID REFERENCES workflow_definition_versions (id),
    "status"               TEXT                            NOT NULL,
    "icon_type"            TEXT                            NOT NULL,
    "icon_colour"          TEXT                            NOT NULL,
    "tags"                 JSONB                           NOT NULL DEFAULT '[]'::JSONB,
    "updated_at"           TIMESTAMPTZ                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"           TIMESTAMPTZ                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by"           UUID,
    "created_by"           UUID,
    "deleted"              BOOLEAN                         NOT NULL DEFAULT FALSE,
    "deleted_at"           TIMESTAMPTZ
);

DROP TABLE IF EXISTS "workflow_definition_versions" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_definition_versions"
(
    "id"                     UUID PRIMARY KEY                          NOT NULL DEFAULT uuid_generate_v4(),
    "workspace_id"           UUID REFERENCES workspaces (id)           NOT NULL,
    "version_number"         INTEGER                                   NOT NULL,
    "workflow_definition_id" UUID REFERENCES workflow_definitions (id) NOT NULL,
    "workflow"               JSONB                                     NOT NULL,
    "canvas"                 JSONB                                     NOT NULL,
    "updated_at"             TIMESTAMPTZ                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"             TIMESTAMPTZ                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by"             UUID,
    "created_by"             UUID,
    "deleted"                BOOLEAN                                   NOT NULL DEFAULT FALSE,
    "deleted_at"             TIMESTAMPTZ
);

DROP TABLE IF EXISTS "workflow_nodes" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_nodes"
(
    "id"           UUID PRIMARY KEY                NOT NULL DEFAULT uuid_generate_v4(),
    "workspace_id" UUID REFERENCES workspaces (id) NOT NULL,
    "key"          TEXT                            NOT NULL,
    "name"         TEXT                            NOT NULL,
    "description"  TEXT,
    "type"         TEXT                            NOT NULL,
    "version"      INTEGER                         NOT NULL DEFAULT 1,
    "source_id"    UUID                            REFERENCES workflow_nodes (id) ON DELETE SET NULL,
    "config"       JSONB                           NOT NULL,
    "system"       BOOLEAN                         NOT NULL DEFAULT FALSE,
    "deleted"      BOOLEAN                         NOT NULL DEFAULT FALSE,
    "deleted_at"   TIMESTAMPTZ,
    "created_at"   TIMESTAMPTZ                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMPTZ                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by"   UUID,
    "updated_by"   UUID
);


DROP TABLE IF EXISTS "workflow_edges" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_edges"
(
    "id"             UUID PRIMARY KEY                    NOT NULL DEFAULT uuid_generate_v4(),
    "workspace_id"   UUID REFERENCES workspaces (id)     NOT NULL,
    "source_node_id" UUID REFERENCES workflow_nodes (id) NOT NULL,
    "target_node_id" UUID REFERENCES workflow_nodes (id) NOT NULL,
    "label"          TEXT,
    "deleted"        BOOLEAN                             NOT NULL DEFAULT FALSE,
    "deleted_at"     TIMESTAMPTZ
);

DROP TABLE IF EXISTS "workflow_executions" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_executions"
(
    "id"                             UUID PRIMARY KEY                                  NOT NULL DEFAULT uuid_generate_v4(),
    "workspace_id"                   UUID REFERENCES workspaces (id)                   NOT NULL,
    "workflow_definition_id"         UUID REFERENCES workflow_definitions (id)         NOT NULL,
    "workflow_definition_version_id" UUID REFERENCES workflow_definition_versions (id) NOT NULL,
    "engine_workflow_id"             UUID,
    "engine_run_id"                  UUID,
    "status"                         TEXT                                              NOT NULL,
    "trigger_type"                   TEXT                                              NOT NULL,
    "started_at"                     TIMESTAMPTZ                                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at"                   TIMESTAMPTZ,
    "duration_ms"                    BIGINT                                            NOT NULL DEFAULT 0,
    "error"                          JSONB,
    "input"                          JSONB,
    "output"                         JSONB
);

-- Tracks each workflow node execution during a workflow run.
-- Stores input/output payloads per node execution.
DROP TABLE IF EXISTS "workflow_node_executions" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_node_executions"
(
    "id"                    UUID PRIMARY KEY                         NOT NULL DEFAULT uuid_generate_v4(),
    "workspace_id"          UUID REFERENCES workspaces (id)          NOT NULL,
    "workflow_execution_id" UUID REFERENCES workflow_executions (id) NOT NULL,
    "workflow_node_id"      UUID REFERENCES workflow_nodes (id)      NOT NULL,
    "sequence_index"        INTEGER                                  NOT NULL,
    "status"                TEXT                                     NOT NULL,
    "started_at"            TIMESTAMPTZ                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at"          TIMESTAMPTZ,
    "duration_ms"           BIGINT                                   NOT NULL DEFAULT 0,
    "attempt"               INTEGER                                  NOT NULL DEFAULT 1,
    "error"                 JSONB,
    "input"                 JSONB,
    "output"                JSONB
);


-- Stores serialized execution context snapshots.
DROP TABLE IF EXISTS "workflow_execution_context" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_execution_context"
(
);

-- Tracks execution of each node during a workflow run.
-- Stores input/output payloads per node execution.
DROP TABLE IF EXISTS "workflow_node_context" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_node_context"
(
);