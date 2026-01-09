# Workflow Execution Engine

## What This Is

A Temporal-based workflow execution engine that enables end users to create, save, and execute DAG-structured workflows with full bidirectional integration with the existing dynamic Entity system. Workflows execute actions (CRUD operations, API calls, conditional branching) based on SQL-like expression evaluation of entity data and conditions.

## Core Value

End-to-end workflow lifecycle: create graph → save → execute via Temporal → see results. Users can define a workflow, persist it, trigger execution, and observe completion with entity modifications and action outcomes.

## Requirements

### Validated

<!-- Existing infrastructure from codebase -->

- ✓ Workflow data model (WorkflowDefinitionEntity, WorkflowNodeEntity, WorkflowEdgeEntity) — existing
- ✓ Workflow execution tracking (WorkflowExecutionEntity, WorkflowExecutionNodeEntity) — existing
- ✓ Workflow node type system (WorkflowNodeType enum with action/control/trigger/utility subtypes) — existing
- ✓ Temporal configuration (TemporalEngineConfiguration, connection to Temporal Cloud) — existing
- ✓ DAG graph structure (nodes connected by edges, stored in PostgreSQL) — existing
- ✓ Trigger types defined (webhook, schedule, entity event triggers) — existing
- ✓ Dynamic Entity system (EntityType with mutable schemas, Entity instances with JSONB payloads) — existing

### Active

<!-- Core functionality to build for v1 -->

- [ ] Temporal workflow execution logic (workflow definitions, activities for actions)
- [ ] Expression parser (parse SQL-like expressions: `entity.status = 'active' AND count > 10`)
- [ ] Expression evaluator (evaluate parsed expressions against entity data with type safety)
- [ ] Entity context resolution (fetch entity data by ID/type for expression evaluation)
- [ ] Entity field traversal (access nested fields: `client.address.city`, `project.owner.email`)
- [ ] Workflow action executors (CRUD operations on entities, API calls, conditional branches)
- [ ] Backend API for workflow management (create, update, retrieve, execute workflows)
- [ ] Workflow execution coordinator (topological sort, node scheduling, state management)
- [ ] Error handling and retry logic (Temporal retry policies, error surfacing to execution records)
- [ ] Test workflow end-to-end (define simple workflow via API, execute, verify entity modifications)

### Out of Scope

- Visual workflow builder UI — v1 focuses on backend execution engine; workflows defined programmatically or via API
- Advanced expression functions (aggregations, window functions) — defer complex functions to v2, start with comparisons and basic operations
- Workflow versioning UI — version management exists in data model but no user-facing versioning controls
- Real-time execution monitoring dashboard — execution records stored but no live dashboard
- Workflow marketplace/templates — no pre-built workflow library

## Context

**Existing Infrastructure:**
- Spring Boot 3.5.3 + Kotlin 2.1.21 backend with PostgreSQL database
- Temporal 1.32.1 SDK integrated with configuration in place
- Multi-tenant SaaS architecture with workspace-level isolation (Row-Level Security)
- Entity system with flexible JSONB schemas (EntityType defines schema, Entity stores instances)
- Block system for content composition (separate from workflows)

**Workflow Data Model (Already Defined):**
- `WorkflowDefinitionEntity` - Workflow metadata and versioning
- `WorkflowNodeEntity` - Individual workflow nodes (actions, triggers, controls)
- `WorkflowEdgeEntity` - Connections between nodes (DAG structure)
- `WorkflowExecutionEntity` - Execution instances with status tracking
- `WorkflowExecutionNodeEntity` - Per-node execution state

**Node Type System:**
- `WorkflowNodeType` - Base enum (ACTION, CONTROL, TRIGGER, UTILITY, HUMAN_INTERACTION)
- Extension enums: `WorkflowActionType`, `WorkflowControlType`, `WorkflowTriggerType`, `WorkflowUtilityActionType`, `WorkflowHumanInteractionType`
- Each type has specific behavior and configuration requirements

**Entity Integration:**
- Workflows can read entity data for conditional logic
- Workflows can create/update/delete entities as actions
- Entity events (created, updated, deleted) can trigger workflow execution
- Expressions reference entity fields dynamically based on EntityType schema

**Technical Requirements:**
- Expression syntax: SQL-like (`=` for equality, `AND`/`OR` for logic, `.` for field access)
- DAG execution: Topological sort to determine node execution order
- Temporal patterns: Deterministic workflows, non-deterministic activities, signals for external events
- Type safety: Expression evaluation must respect EntityType schema and field types

## Constraints

- **Tech Stack**: Must use existing Spring Boot + Kotlin backend, PostgreSQL database, Temporal 1.32.1 SDK — maintain consistency with entity and block systems
- **Multi-Tenancy**: All workflow operations must respect workspace-level isolation via Row-Level Security
- **Determinism**: Temporal workflows must be deterministic (no random, no current time in workflow code)
- **Schema Flexibility**: Expression evaluator must handle dynamic EntityType schemas (fields added/removed at runtime)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SQL-like expression syntax | Familiar to users, aligns with database query patterns | — Pending |
| DAG structure (no cycles) | Enables topological execution order, prevents infinite loops | — Pending |
| Full entity integration | Workflows are first-class orchestrators of entity lifecycle | — Pending |
| Defer visual builder to v2 | Focus on execution engine correctness before UX layer | — Pending |

---
*Last updated: 2026-01-09 after initialization*
