DROP TABLE IF EXISTS "workflow_definitions" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_definitions"
(
);

DROP TABLE IF EXISTS "workflow_versions" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_versions"
(
);


DROP TABLE IF EXISTS "workflow_nodes" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_nodes"
(
);

DROP TABLE IF EXISTS "workflow_edges" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_edges"
(
);

DROP TABLE IF EXISTS "workflow_execution" CASCADE;
CREATE TABLE IF NOT EXISTS "workflow_execution"
(
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