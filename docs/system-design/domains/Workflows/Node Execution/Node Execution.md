---
tags:
  - architecture/subdomain
  - domain/workflow
Created: 2026-02-08
Domains:
  - "[[Workflows]]"
---
# Subdomain: Node Execution

## Overview

Node Execution provides a polymorphic node execution system based on sealed interfaces. WorkflowNodeConfig is the sealed interface with subtypes for triggers, actions, controls, utilities, functions, and human interaction. Each node type implements its own `execute()` method with access to execution context, resolved inputs, and lazily-injected Spring services. WorkflowNodeConfigRegistry discovers all node implementations at startup. WorkflowNodeServiceInjectionProvider enables lazy service lookup during node execution.

## Components

| Component | Purpose | Type |
| --------- | ------- | ------------------------------- |
| [[WorkflowNodeConfig]] | Sealed interface — defines execution contract for all node types (trigger, action, control, utility, function, human interaction) | Model / Interface |
| [[WorkflowNodeConfigRegistry]] | Discovers and registers all WorkflowNodeConfig implementations at startup | Service / Registry |
| [[WorkflowNodeServiceInjectionProvider]] | Provides lazy Spring service injection to node configs during execution | Service / Provider |

## Node Categories

Concrete node implementations are organized by category. Each category has a summary doc listing all nodes and their implementation status.

| Category | Summary | Implemented Nodes | Unimplemented |
|----------|---------|-------------------|---------------|
| [[Action Nodes]] | Business operations (entity CRUD, HTTP requests) | 5 | 4 (LINK_ENTITY, INTEGRATION_REQUEST, SET_ENVIRONMENT_VARIABLE, MAP_DATA) |
| [[Trigger Nodes]] | Workflow entry points (events, schedules, webhooks) | 4 | 0 |
| [[Control Flow Nodes]] | Execution branching and flow control | 1 (CONDITION) | 5 (SWITCH, LOOP, PARALLEL, DELAY, MERGE) |

**Additional node types (interface/enum only, no implementations):**

- **Utility nodes** (WorkflowUtilityActionType): LOG, NOTIFY, VALIDATE, THROW_ERROR — defined in enum but no concrete implementations exist
- **Parse nodes** (WorkflowParseType): Not yet defined in type system
- **Function nodes** (WorkflowFunctionConfig): Stub interface, no implementations
- **Human interaction nodes** (WorkflowHumanInteractionConfig): Stub interface, no implementations

> [!warning] WorkflowHumanInteractionConfig is a stub
> The human interaction node type exists in the type system but has no implementation. Workflow pausing, signal handling, and timeout escalation are not implemented.

> [!warning] Only binary conditions
> Control flow is limited to WorkflowConditionControlConfig, which supports binary true/false branching. There is no switch/case construct.

## Technical Debt

|Issue|Impact|Effort|
|---|---|---|
| Human interaction not implemented | High | High |
| No switch/case control flow | High | High |

---

## Recent Changes

| Date | Change | Feature/ADR |
| ---- | ------ | ----------- |
|      |        | [[]]        |
