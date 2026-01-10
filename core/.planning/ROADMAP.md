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
- [ ] **Phase 4: Action Executors** - Implement node action types (CRUD, API calls, conditionals)
- [ ] **Phase 5: DAG Execution Coordinator** - Topological sort, node scheduling, state management
- [ ] **Phase 6: Backend API Layer** - REST endpoints for workflow management
- [ ] **Phase 7: Error Handling & Retry Logic** - Temporal retry policies and error surfacing
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
**Status**: 🚧 IN PROGRESS (1/2 plans complete)

Plans:
- [x] 04-01: Entity CRUD action executors (2026-01-11) - CREATE/UPDATE/DELETE/QUERY with extensible executeAction pattern
- [ ] 04-02: HTTP request actions and conditional control flow - TBD

### Phase 5: DAG Execution Coordinator
**Goal**: Orchestrate workflow execution with topological sort and parallel node scheduling
**Depends on**: Phase 4
**Research**: Likely (DAG algorithms, concurrent execution patterns)
**Research topics**: Topological sort algorithms, parallel execution strategies, state machine patterns for workflow orchestration
**Plans**: TBD

Plans:
- TBD

### Phase 6: Backend API Layer
**Goal**: Expose REST APIs for workflow creation, update, retrieval, and execution triggering
**Depends on**: Phase 5
**Research**: Unlikely (REST API patterns established in codebase)
**Plans**: TBD

Plans:
- TBD

### Phase 7: Error Handling & Retry Logic
**Goal**: Implement Temporal retry policies and error surfacing to execution records
**Depends on**: Phase 6
**Research**: Likely (Temporal retry policies, error handling patterns)
**Research topics**: Temporal retry configuration, error propagation strategies, compensating transactions for failed workflows
**Plans**: TBD

Plans:
- TBD

### Phase 8: End-to-End Testing
**Goal**: Validate complete workflow lifecycle from API definition through execution to entity modifications
**Depends on**: Phase 7
**Research**: Unlikely (testing patterns established)
**Plans**: TBD

Plans:
- TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Expression System Foundation | 1/1 | ✅ Complete | 2026-01-10 |
| 2. Entity Context Integration | 1/1 | ✅ Complete | 2026-01-10 |
| 3. Temporal Workflow Engine | 0.5/1 (partial) | 🔄 In progress | 2026-01-10 (partial) |
| 4. Action Executors | 0/TBD | Not started | - |
| 5. DAG Execution Coordinator | 0/TBD | Not started | - |
| 6. Backend API Layer | 0/TBD | Not started | - |
| 7. Error Handling & Retry Logic | 0/TBD | Not started | - |
| 8. End-to-End Testing | 0/TBD | Not started | - |
