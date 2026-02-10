---
tags:
  - architecture/subdomain
  - domain/workflow
Created: 2026-02-08
Domains:
  - "[[Workflows]]"
---
# Subdomain: Queue Management

## Overview

Queue Management provides asynchronous decoupling between API execution requests and Temporal workflow dispatch. Execution requests are enqueued as PENDING items, then a scheduled dispatcher (running every 5 seconds with ShedLock for distributed coordination) claims batches and processes them. Each item is processed in an isolated transaction to ensure partial failures don't rollback the entire batch. Capacity checks are performed before dispatch to enforce workspace tier limits.

## Components

| Component | Purpose | Type |
| --------- | ------- | ------------------------------- |
| [[WorkflowExecutionQueueService]] | Queue state CRUD — enqueue, claim, dispatch, fail, release, recover stale items | Service |
| [[WorkflowExecutionDispatcherService]] | Scheduled job (every 5s with ShedLock) — polls queue and delegates to processor | Service |
| [[WorkflowExecutionQueueProcessorService]] | Processes individual queue items — capacity check, execution record creation, Temporal dispatch. Uses `REQUIRES_NEW` transactions. | Service |

> [!warning] Fixed batch size
> The dispatcher uses a fixed batch size (10 items) that is not adaptive to current load or pod capacity.

> [!warning] No rate limiting per workspace
> Fair-use enforcement relies on coarse capacity checks. There's no per-workspace rate limiting to prevent abuse.

## Technical Debt

|Issue|Impact|Effort|
|---|---|---|
| Fixed batch size not adaptive to load | Low | Low |
| No per-workspace rate limiting | Medium | Medium |

---

## Recent Changes

| Date | Change | Feature/ADR |
| ---- | ------ | ----------- |
|      |        | [[]]        |
