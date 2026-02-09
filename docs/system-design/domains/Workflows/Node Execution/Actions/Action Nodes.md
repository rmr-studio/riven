---
Created: 2026-02-09
Domains:
  - "[[Workflows]]"
tags:
  - architecture/subdomain
---
# Action Nodes

## Overview

Action nodes perform business operations during workflow execution. They modify system state through entity CRUD operations, make external HTTP requests, query data, and manipulate workflow state. Each action node implements `WorkflowActionConfig` with a specific `WorkflowActionType` subtype.

Action nodes are the primary mechanism for workflows to interact with the entity system and external integrations.

## Implemented Action Nodes

| Node | Description | Status |
|------|-------------|--------|
| [[WorkflowCreateEntityActionConfig]] | Creates a new entity instance | Implemented |
| [[WorkflowDeleteEntityActionConfig]] | Deletes an entity instance | Implemented |
| [[WorkflowUpdateEntityActionConfig]] | Updates an existing entity instance | Implemented |
| [[WorkflowHttpRequestActionConfig]] | Makes an HTTP request to an external URL | Implemented |
| [[WorkflowQueryEntityActionConfig]] | Searches and retrieves entity instances | Partial (validation only, execute not implemented) |

## Unimplemented Action Types

The following action types are defined in `WorkflowActionType` enum but have no concrete implementations:

- **LINK_ENTITY** — Would establish relationships between entities
- **INTEGRATION_REQUEST** — Would interact with configured integrations
- **SET_ENVIRONMENT_VARIABLE** — Would modify workflow environment state
- **MAP_DATA** — Would transform data structures between formats
