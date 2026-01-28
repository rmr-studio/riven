# Roadmap: Workflow Execution Engine

## Overview

This roadmap guides the development of a Temporal-based workflow execution engine from foundational expression evaluation through complete end-to-end workflow lifecycle. We begin by building the expression system for conditional logic, integrate with the existing entity system for data resolution, implement core Temporal workflow patterns, add action executors for workflow nodes, coordinate DAG-based execution, expose management APIs, handle errors gracefully, and validate the complete system through comprehensive testing.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Expression System Foundation** - Parser and evaluator for SQL-like expressions
- [x] **Phase 2: Entity Context Integration** - Resolve entity data for expression evaluation
- [x] **Phase 3: Temporal Workflow Engine** - Core workflow execution with Temporal activities
- [x] **Phase 4: Action Executors** - Implement node action types (CRUD, API calls, conditionals)
- [x] **Phase 4.1: Action Execution (INSERTED)** - Data registry, template resolution, polymorphic execution
- [x] **Phase 5: DAG Execution Coordinator** - Topological sort, node scheduling, state management
- [x] **Phase 6: Backend API Layer** - REST endpoints for workflow management
- [x] **Phase 6.1: Execution Queue Management (INSERTED)** - Execution queue management
- [x] **Phase 7: Error Handling & Retry Logic** - Temporal retry policies and error surfacing
- [ ] **Phase 7.1: Node Configuration Development (INSERTED)** - Strongly-typed node configs with validation
- [ ] **Phase 8: End-to-End Testing** - Validate complete workflow lifecycle

## Phase Details

### Phase 1: Expression System Foundation
**Goal**: Build SQL-like expression parser and evaluator with type-safe evaluation
**Depends on**: Nothing (first phase)
**Research**: Unlikely (parser libraries exist, expression evaluation patterns established)
**Status**: ✅ COMPLETED

Plans:
- [x] 01-01: Expression parser and evaluator (2026-01-10) - SQL-like syntax, recursive descent parser, type-safe evaluation

### Phase 2: Entity Context Integration
**Goal**: Enable expression evaluation against dynamic entity data with field traversal
**Depends on**: Phase 1
**Research**: Unlikely (entity system already exists, integration patterns clear)
**Status**: ✅ COMPLETED

Plans:
- [x] 02-01: Entity context provider with relationship traversal (2026-01-10) - EntityContextService with depth-limited recursion, cardinality-aware handling, comprehensive test coverage

### Phase 3: Temporal Workflow Engine
**Goal**: Implement core Temporal workflow definitions and activities for workflow execution
**Depends on**: Phase 2
**Research**: Completed (03-RESEARCH.md - Temporal SDK patterns, deterministic workflow requirements)
**Status**: ✅ COMPLETED

Plans:
- [x] 03-01: Temporal workflow and activity infrastructure (2026-01-10) - Workflow orchestration, activity execution, REST API, integration tests

### Phase 4: Action Executors
**Goal**: Implement workflow node action executors (entity CRUD, API calls, conditional branches)
**Depends on**: Phase 3
**Research**: Unlikely (CRUD operations follow existing entity service patterns)
**Status**: ✅ COMPLETED

Plans:
- [x] 04-01: Entity CRUD action executors (2026-01-11) - CREATE/UPDATE/DELETE/QUERY with extensible executeAction pattern
- [x] 04-02: HTTP request actions and conditional control flow (2026-01-10) - HTTP_REQUEST with SSRF protection, CONDITION with expression evaluation, extensibility proven

### Phase 4.1: Action Execution (INSERTED)
**Goal**: Implement data registry, input resolution, and polymorphic execution for action execution
**Depends on**: Phase 4
**Research**: Completed (see 4.1-CONTEXT.md)
**Status**: ✅ COMPLETED

Plans:
- [x] 4.1-01: Data Registry & Output Capture (2026-01-11) - WorkflowExecutionContext with data registry, output capture in all executors
- [x] 4.1-02: Template-Based Input Resolution (2026-01-11) - TemplateParserService and InputResolverService enable {{ steps.name.output }} references
- [x] 4.1-03: Polymorphic Execution Refactor (2026-01-11) - Nodes implement execute(), eliminated type switching, foundation for LOOP/SWITCH/PARALLEL

### Phase 5: DAG Execution Coordinator
**Goal**: Orchestrate workflow execution with topological sort and parallel node scheduling
**Depends on**: Phase 4.1
**Research**: Completed (5-RESEARCH.md - Kahn's algorithm, state machine patterns)
**Status**: ✅ COMPLETED

Plans:
- [x] 5-01: Topological Sort & DAG Validation (2026-01-12) - Kahn's algorithm with cycle detection, comprehensive structural validation
- [x] 5-02: Active Node Queue & State Machine (2026-01-12) - In-degree tracked queue, immutable state machine with event-driven transitions
- [x] 5-03: DAG Execution Coordinator (2026-01-12) - Parallel orchestration with Temporal integration, comprehensive integration testing

### Phase 6: Backend API Layer
**Goal**: Expose REST APIs for workflow creation, update, retrieval, and execution triggering
**Depends on**: Phase 5
**Research**: Unlikely (REST API patterns established in codebase)
**Status**: ✅ COMPLETED

Plans:
- [x] 06-01: Workflow definition CRUD APIs (2026-01-20) - WorkflowDefinitionService (303 lines), WorkflowDefinitionController (184 lines), 9 unit tests
- [x] 06-02: Workflow graph management APIs (2026-01-20) - WorkflowGraphService (537 lines), WorkflowGraphController (238 lines), cascade deletion, 15 tests
- [x] 06-03: Workflow execution query APIs (2026-01-20) - Extended WorkflowExecutionService with 4 query methods, 4 GET endpoints, 8 tests

### Phase 6.1: Execution Queue Management (INSERTED)
**Goal**: Database-backed execution queue with tier-based concurrency limits for workflow dispatching
**Depends on**: Phase 6
**Research**: Completed (06.1-RESEARCH.md - ShedLock, SKIP LOCKED, Temporal multi-queue)
**Status**: ✅ COMPLETED

Plans:
- [x] 06.1-01: ShedLock infrastructure and WorkspaceTier enum (2026-01-21)
- [x] 06.1-02: ExecutionQueueEntity, repository, and queue service (2026-01-21)
- [x] 06.1-03: Multi-queue workers, dispatcher service, queue integration (2026-01-21)

### Phase 7: Error Handling & Retry Logic
**Goal**: Implement Temporal retry policies and error surfacing to execution records
**Depends on**: Phase 6.1
**Research**: Completed (07-RESEARCH.md - Temporal RetryOptions, ApplicationFailure, error classification)
**Status**: ✅ COMPLETED

Plans:
- [x] 07-01: Retry configuration infrastructure and structured error models (2026-01-22)
- [x] 07-02: Error classification and Temporal ApplicationFailure integration (2026-01-22)
- [x] 07-03: Error surfacing in API responses and unit tests (2026-01-22)

### Phase 7.1: Node Configuration Development (INSERTED)
**Goal**: Define strongly-typed configuration structures for workflow node types with save-time validation
**Depends on**: Phase 7
**Research**: Completed (07.1-RESEARCH.md - Kotlin data class patterns, existing config structure analysis)
**Status**: Not started
**Plans:** 5 plans

Plans:
- [ ] 07.1-01-PLAN.md — Validation infrastructure (ConfigValidationError, ConfigValidationService)
- [ ] 07.1-02-PLAN.md — Type entity action configs (CREATE, UPDATE, DELETE, QUERY)
- [ ] 07.1-03-PLAN.md — Type HTTP_REQUEST and CONDITION configs
- [ ] 07.1-04-PLAN.md — Deserializer update, validation integration, tests
- [ ] 07.1-05-PLAN.md — Add validate() methods to trigger configs (ENTITY_EVENT, SCHEDULE, FUNCTION, WEBHOOK)

### Phase 8: End-to-End Testing
**Goal**: Validate complete workflow lifecycle from API definition through execution to entity modifications
**Depends on**: Phase 7.1
**Research**: Unlikely (testing patterns established)
**Plans**: TBD

Plans:
- TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 4.1 → 5 → 6 → 6.1 → 7 → 7.1 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Expression System Foundation | 1/1 | ✅ Complete | 2026-01-10 |
| 2. Entity Context Integration | 1/1 | ✅ Complete | 2026-01-10 |
| 3. Temporal Workflow Engine | 1/1 | ✅ Complete | 2026-01-10 |
| 4. Action Executors | 2/2 | ✅ Complete | 2026-01-11 |
| 4.1. Action Execution (INSERTED) | 3/3 | ✅ Complete | 2026-01-11 |
| 5. DAG Execution Coordinator | 3/3 | ✅ Complete | 2026-01-12 |
| 6. Backend API Layer | 3/3 | ✅ Complete | 2026-01-20 |
| 6.1. Execution Queue Management (INSERTED) | 3/3 | ✅ Complete | 2026-01-21 |
| 7. Error Handling & Retry Logic | 3/3 | ✅ Complete | 2026-01-22 |
| 7.1. Node Configuration Development (INSERTED) | 0/5 | Not started | - |
| 8. End-to-End Testing | 0/TBD | Not started | - |
