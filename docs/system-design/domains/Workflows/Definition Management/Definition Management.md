---
Created: 2026-02-08
Domains:
  - "[[Workflows]]"
tags:
  - architecture/subdomain
---
# Subdomain: Definition Management

## Overview

Definition Management provides CRUD operations for workflow definitions, graph structure (nodes and edges), and execution records. These are thin service wrappers over repositories with workspace scoping and authorization checks. WorkflowDefinitionService handles workflow metadata. WorkflowGraphService manages node and edge operations. WorkflowExecutionService handles execution lifecycle (starting, querying, status updates).

## Components

| Component | Purpose | Type |
| --------- | ------- | ------------------------------- |
| [[WorkflowDefinitionService]] | Workflow definition CRUD — create, update, delete, query definitions with workspace scoping | Service |
| [[WorkflowGraphService]] | Graph node and edge management — add/remove/update nodes and edges within a workflow definition | Service |
| [[WorkflowExecutionService]] | Execution lifecycle — start execution (enqueues), query execution status and history | Service |

## Technical Debt

|Issue|Impact|Effort|
|---|---|---|
| None identified | N/A | N/A |

---

## Recent Changes

| Date | Change | Feature/ADR |
| ---- | ------ | ----------- |
|      |        | [[]]        |
