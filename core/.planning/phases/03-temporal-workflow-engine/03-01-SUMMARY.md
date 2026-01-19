---
phase: 03-temporal-workflow-engine
plan: 01
subsystem: workflow
tags: [temporal, workflow-orchestration, async-execution, spring-boot]

# Dependency graph
requires:
  - phase: 02-entity-context-integration
    provides: Entity context resolution for expression evaluation
provides:
  - Temporal workflow orchestration infrastructure
  - REST API for triggering workflow executions
  - Worker registration for background execution
  - Activity framework for node execution
affects: [04-action-executors, 05-dag-execution-coordinator]

# Tech tracking
tech-stack:
  added: [temporal-sdk-1.24.1, temporal-kotlin-1.32.1]
  patterns: [workflow-activity-split, deterministic-orchestration, async-workflow-start, activity-dependency-injection]

key-files:
  created:
    - src/main/kotlin/riven/core/service/workflow/temporal/workflows/WorkflowExecutionWorkflow.kt
    - src/main/kotlin/riven/core/service/workflow/temporal/workflows/WorkflowExecutionWorkflowImpl.kt
    - src/main/kotlin/riven/core/service/workflow/temporal/activities/WorkflowNodeActivities.kt
    - src/main/kotlin/riven/core/service/workflow/temporal/activities/WorkflowNodeActivitiesImpl.kt
    - src/main/kotlin/riven/core/service/workflow/temporal/workers/TemporalWorkerConfiguration.kt
    - src/main/kotlin/riven/core/service/workflow/WorkflowExecutionService.kt
    - src/main/kotlin/riven/core/controller/workflow/WorkflowExecutionController.kt
    - src/main/kotlin/riven/core/models/workflow/temporal/WorkflowExecutionInput.kt
    - src/main/kotlin/riven/core/models/workflow/temporal/WorkflowExecutionResult.kt
    - src/main/kotlin/riven/core/repository/workflow/WorkflowNodeRepository.kt
    - src/main/kotlin/riven/core/repository/workflow/WorkflowExecutionNodeRepository.kt
    - src/main/kotlin/riven/core/repository/workflow/WorkflowDefinitionRepository.kt
    - src/main/kotlin/riven/core/repository/workflow/WorkflowExecutionRepository.kt
    - src/test/kotlin/riven/core/service/workflow/WorkflowExecutionIntegrationTest.kt
    - src/test/resources/application-test.yml
  modified:
    - src/main/kotlin/riven/core/configuration/workflow/TemporalEngineConfiguration.kt

key-decisions:
  - "Use Temporal SDK for workflow orchestration instead of hand-rolling state machine"
  - "Workflows are deterministic orchestrators, activities execute all side effects"
  - "Worker registers on 'workflow-execution-queue' task queue"
  - "Activity timeout set to 5 minutes with 3 retry attempts max"
  - "V1: Sequential node execution, parallel execution deferred to Phase 5"
  - "V1: Simple node ID extraction from DAG, topological sort deferred to Phase 5"
  - "Activity implementation as Spring bean enables dependency injection"
  - "Async workflow start returns immediately, doesn't block REST endpoint"

patterns-established:
  - "Workflow-Activity split: Workflows orchestrate (deterministic), Activities execute (non-deterministic)"
  - "Spring bean activities: Constructor injection for EntityService, repositories, expression evaluators"
  - "Execution record persistence: Create in PostgreSQL before starting Temporal workflow"
  - "Activity stub configuration: StartToCloseTimeout mandatory, RetryOptions with exponential backoff"
  - "Node type routing: ACTION (entity CRUD), CONTROL_FLOW (expressions), TRIGGER (skip), others (skip v1)"

issues-created: []

# Metrics
duration: 17min
completed: 2026-01-10
---

# Phase 3 Plan 1: Temporal Workflow Engine Summary

**Temporal workflow orchestration operational with worker registration, activity execution, and REST API triggering**

## Performance

- **Duration:** 17 min (10 min initial + 7 min Task 3)
- **Started:** 2026-01-10T00:51:45Z
- **Completed:** 2026-01-10T16:07:00Z
- **Tasks:** 3/3 (All tasks completed)
- **Files modified:** 16

## Accomplishments

- Temporal workflow and activity definitions with deterministic orchestration
- Worker configuration registers workflows and activities, starts successfully
- REST API endpoint triggers workflow execution asynchronously
- Activity implementation routes node types with stub v1 execution
- Execution records persist to PostgreSQL (WorkflowExecutionEntity, WorkflowExecutionNodeEntity)
- WorkflowClient bean exposed for service layer integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Temporal workflow and activity definitions with worker registration** - `33f69f8` (feat)
2. **Task 2: Create REST API endpoint for triggering workflow executions** - `03718e2` (feat)
3. **Task 3: Add integration test validating end-to-end workflow execution** - `65eeefa` (test)

**Plan metadata:** (this commit) - docs: complete plan

## Files Created/Modified

**Workflow Infrastructure:**
- `WorkflowExecutionWorkflow.kt` - Temporal workflow interface with @WorkflowMethod
- `WorkflowExecutionWorkflowImpl.kt` - Deterministic workflow orchestrator (sequential v1)
- `WorkflowNodeActivities.kt` - Activity interface for node execution
- `WorkflowNodeActivitiesImpl.kt` - Activity implementation as Spring bean with routing
- `TemporalWorkerConfiguration.kt` - Worker factory that registers workflows and activities

**Service & API Layer:**
- `WorkflowExecutionService.kt` - Starts workflows asynchronously, persists execution records
- `WorkflowExecutionController.kt` - POST /api/v1/workflow/executions/start endpoint
- `StartWorkflowExecutionRequest.kt` - API request model

**Models:**
- `WorkflowExecutionInput.kt` - Workflow method parameters
- `WorkflowExecutionResult.kt` + `NodeExecutionResult.kt` - Return types

**Repositories:**
- `WorkflowNodeRepository.kt` - Fetch node configuration
- `WorkflowExecutionNodeRepository.kt` - Persist node execution state
- `WorkflowDefinitionRepository.kt` - Fetch workflow definitions
- `WorkflowExecutionRepository.kt` - Persist workflow execution records
- `WorkflowDefinitionVersionRepository.kt` - Fetch DAG structure

**Configuration:**
- `TemporalEngineConfiguration.kt` - Added WorkflowClient bean

**Testing:**
- `WorkflowExecutionIntegrationTest.kt` - Integration test with TestWorkflowEnvironment
- `application-test.yml` - H2 test database configuration

## Decisions Made

**Temporal SDK Integration:**
- Use Temporal Java SDK 1.24.1 (kotlin-wrapper 1.32.1) for workflow orchestration
- Rationale: Mature SDK with Spring Boot integration, handles determinism, retry, state management

**Workflow-Activity Split:**
- Workflows are pure orchestrators (deterministic, no side effects)
- Activities execute all non-deterministic operations (DB, HTTP, random)
- Rationale: Enables workflow replay, automatic failure recovery, exactly-once semantics

**Activity as Spring Bean:**
- WorkflowNodeActivitiesImpl is @Component with constructor injection
- Rationale: Enables dependency injection for EntityService, repositories, expression evaluators

**Async Workflow Start:**
- WorkflowClient.start() returns immediately, doesn't block REST endpoint
- Rationale: Improves API responsiveness, workflows run in background

**V1 Simplifications:**
- Sequential node execution (no parallelism)
- Simple node ID extraction (no topological sort)
- Stub implementations for ACTION and CONTROL_FLOW nodes
- Rationale: Establish infrastructure first, optimize execution in Phase 5

**Task Queue Consistency:**
- Worker registers on "workflow-execution-queue"
- Service starts workflows on same queue name
- Rationale: Queue name mismatch causes "No worker found" errors

## Deviations from Plan

None - plan executed exactly as written. Task 3 was deferred in initial session but completed in follow-up session with fresh context.

## Issues Encountered

**Compilation Errors:**
- Initial errors with WorkflowNodeType enum values (CONTROL_FLOW not CONTROL)
- Error field in WorkflowExecutionNodeEntity is non-nullable (fixed with emptyMap())
- Activity logging signature mismatch (Activity enum parameter comes first)
- JsonObject import path correction (riven.core.models.common.json.JsonObject)

**Resolution:** All fixed during Task 1 and 2 implementation. Code compiles successfully.

## Next Phase Readiness

**Ready for Phase 4: Action Executors**
- Temporal workflow infrastructure operational
- Activity framework established with node type routing
- REST API can trigger workflow executions
- Execution state persists to PostgreSQL

**Blockers:**
- None

**Follow-up Work:**
- Future: Parallel node execution (Phase 5)
- Future: Topological sort for DAG execution order (Phase 5)
- Future: Actual ACTION node implementation (Phase 4)
- Future: Actual CONTROL_FLOW expression evaluation (Phase 4)

---
*Phase: 03-temporal-workflow-engine*
*Completed: 2026-01-10*
