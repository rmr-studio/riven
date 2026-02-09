---
Created: 2026-02-09
Domains:
  - "[[Workflows]]"
tags:
  - architecture/subdomain
---
# Trigger Nodes

## Overview

Trigger nodes define workflow entry points — they specify when and how a workflow should be initiated. Trigger nodes do not execute during workflow runtime; instead, they are evaluated by workflow scheduling and event handling systems to determine when to start a workflow execution.

Each trigger node implements `WorkflowTriggerConfig` with a specific `WorkflowTriggerType` subtype.

## Implemented Trigger Nodes

| Node | Description | Status |
|------|-------------|--------|
| [[WorkflowEntityEventTriggerConfig]] | Triggers when an entity is created, updated, or deleted | Implemented |
| [[WorkflowScheduleTriggerConfig]] | Triggers on a recurring schedule or cron expression | Implemented |
| [[WorkflowWebhookTriggerConfig]] | Triggers when an HTTP request is received | Implemented |
| [[WorkflowFunctionTriggerConfig]] | Triggers when called programmatically | Implemented |

All trigger types defined in `WorkflowTriggerType` enum have implementations.
