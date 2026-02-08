---
Created: 2026-02-08
Domains:
  - "[[Workflows]]"
tags:
  - architecture/subdomain
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
