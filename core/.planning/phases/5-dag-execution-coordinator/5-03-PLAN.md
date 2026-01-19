---
phase: 5-dag-execution-coordinator
plan: 03
type: execute
---

<objective>
Integrate DAG execution coordinator with Temporal workflow for parallel orchestration.

Purpose: Bring together topological sort, active node queue, and state machine to orchestrate complete workflow execution with parallel node scheduling.
Output: DagExecutionCoordinator service, updated WorkflowExecutionWorkflowImpl using coordinator, integration test validating parallel DAG execution.
</objective>

<execution_context>
~/.claude/get-shit-done/workflows/execute-phase.md
./summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/5-dag-execution-coordinator/5-RESEARCH.md
@.planning/phases/5-dag-execution-coordinator/5-CONTEXT.md
@.planning/phases/5-dag-execution-coordinator/5-01-SUMMARY.md
@.planning/phases/5-dag-execution-coordinator/5-02-SUMMARY.md
@.planning/phases/4.1-action-execution/4.1-03-SUMMARY.md
@.planning/phases/03-temporal-workflow-engine/03-01-SUMMARY.md
@src/main/kotlin/riven/core/service/workflow/temporal/workflows/WorkflowExecutionWorkflowImpl.kt
@src/main/kotlin/riven/core/service/workflow/temporal/activities/WorkflowNodeActivitiesImpl.kt
@src/main/kotlin/riven/core/models/workflow/WorkflowNode.kt
@src/main/kotlin/riven/core/models/workflow/environment/WorkflowExecutionContext.kt

**Tech stack available:**
- Temporal SDK 1.32.1 with Async.function() and Promise.allOf()
- TopologicalSorter (Plan 1) - dependency order with cycle detection
- DagValidator (Plan 1) - structural validation
- ActiveNodeQueue (Plan 2) - ready node scheduling
- WorkflowState + StateTransition (Plan 2) - orchestration state machine
- WorkflowNode.execute() polymorphism (Phase 4.1)
- WorkflowExecutionContext with data registry (Phase 4.1)

**Established patterns:**
- Workflow-Activity split: workflows orchestrate (deterministic), activities execute (non-deterministic)
- Temporal Async/Promise for parallel execution (from research)
- Polymorphic node execution eliminates type switching
- Service layer with constructor injection

**Constraining decisions:**
- Phase 5-RESEARCH.md: Use Temporal Async/Promise.allOf for parallel execution - maintains determinism, handles synchronization
- Phase 5-CONTEXT.md: Conditional nodes return edge ID from execute() - orchestrator uses that to follow correct path
- Phase 5-RESEARCH.md: All workflow state must live in Temporal workflow context - no external state
- Phase 4.1-03: Nodes implement execute(context, inputs, services) - coordinator passes WorkflowExecutionContext between nodes

**Key insight from research:**
The coordinator is the "brain" that connects all pieces: it validates the DAG (DagValidator), determines execution order (TopologicalSorter), schedules ready nodes (ActiveNodeQueue), executes in parallel (Temporal Async/Promise), and tracks state (WorkflowState). The workflow becomes a simple orchestrator calling coordinator.execute().
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create DAG execution coordinator</name>
  <files>src/main/kotlin/riven/core/service/workflow/coordinator/DagExecutionCoordinator.kt</files>
  <action>
Create DagExecutionCoordinator service that orchestrates complete DAG execution.

**Core Algorithm (from research - Kahn's with active node queue):**
1. **Validate DAG:** Use DagValidator to check structure (cycles, connectivity)
2. **Initialize state:** Create initial WorkflowState with phase = INITIALIZING
3. **Initialize queue:** Use ActiveNodeQueue with nodes and edges
4. **Execution loop:** While queue.hasMoreWork():
   a. Get ready nodes from queue
   b. Transition state: NodesReady event
   c. Execute ready nodes in parallel (handled by caller - returns Promise list)
   d. Wait for all to complete
   e. For each completed node:
      - Transition state: NodeCompleted event with output
      - Mark node completed in queue (triggers successor in-degree decrement)
      - Update data registry with output
5. **Complete:** Transition state to COMPLETED

**Interface:**
```kotlin
@Service
class DagExecutionCoordinator(
    private val dagValidator: DagValidator,
    private val topologicalSorter: TopologicalSorter,
    private val activeNodeQueue: ActiveNodeQueue
) {
    /**
     * Execute DAG workflow with parallel node scheduling.
     *
     * @param nodes All workflow nodes
     * @param edges DAG edges (source → target)
     * @param nodeExecutor Lambda that executes a batch of nodes in parallel (Temporal Async/Promise)
     * @return Final WorkflowState with all outputs
     */
    fun executeWorkflow(
        nodes: List<WorkflowNode>,
        edges: List<WorkflowEdge>,
        nodeExecutor: (List<WorkflowNode>) -> List<Pair<UUID, Any?>>
    ): WorkflowState
}
```

**Implementation details:**
- Validate DAG first, throw exception if invalid (include all validation errors)
- Use topologicalSorter for pre-execution validation (redundant with validator but provides ordering insight)
- Initialize ActiveNodeQueue with nodes and edges
- Create initial WorkflowState with INITIALIZING phase
- Execution loop: while (activeNodeQueue.hasMoreWork())
- Get batch of ready nodes: val readyNodes = activeNodeQueue.getReadyNodes()
- Call nodeExecutor(readyNodes) - this returns List<Pair<UUID, Any?>> (nodeId → output)
- For each result, apply NodeCompleted event and mark in queue
- After loop, check if all nodes completed (queue empty, no remaining nodes)
- If remaining nodes exist, throw exception (cycle or deadlock)
- Return final WorkflowState with COMPLETED phase

**What to avoid:**
- Don't execute nodes directly (delegate to nodeExecutor lambda - this keeps coordinator deterministic)
- Don't handle Temporal Async/Promise here (caller handles that via nodeExecutor)
- Don't implement retry logic (Phase 7 work)
- Don't validate node configs or business logic (those are activity/node responsibilities)
- Don't handle conditional branching logic yet (v1: execute all outgoing edges, enhanced in Phase 7)

**Conditional Node Handling (v1 - Simple):**
For now, execute all outgoing edges from every node. Conditional nodes will return edge selection in their output, but v1 doesn't use that for branching yet. Full conditional branching is Phase 7 work.

**KDoc:**
Include comprehensive KDoc with:
- Algorithm explanation (Kahn's + active queue + state machine)
- Thread safety: ONLY use in Temporal workflow context (deterministic, single-threaded)
- Example usage with Temporal Async/Promise pattern
- Error handling: what exceptions can be thrown and why
  </action>
  <verify>
1. ./gradlew compileKotlin succeeds
2. DagExecutionCoordinator annotated with @Service
3. Constructor injects DagValidator, TopologicalSorter, ActiveNodeQueue
4. executeWorkflow() method signature matches specification
5. KDoc includes algorithm explanation and Temporal usage example
  </verify>
  <done>
DagExecutionCoordinator.kt exists, compiles without errors, orchestrates validation→initialization→execution loop→completion, delegates node execution to caller, includes comprehensive KDoc.
  </done>
</task>

<task type="auto">
  <name>Task 2: Integrate coordinator with Temporal workflow</name>
  <files>src/main/kotlin/riven/core/service/workflow/temporal/workflows/WorkflowExecutionWorkflowImpl.kt</files>
  <action>
Update WorkflowExecutionWorkflowImpl to use DagExecutionCoordinator for orchestration.

**Current State (from Phase 3):**
- Sequential node execution (nodes.forEach { executeNode() })
- Activity stub for WorkflowNodeActivities
- Simple execution without parallelism

**Target State (Phase 5):**
- Use DagExecutionCoordinator for parallel orchestration
- Fetch workflow definition with nodes and edges
- Create nodeExecutor lambda using Temporal Async/Promise
- Pass nodeExecutor to coordinator.executeWorkflow()

**Implementation:**
1. Add DagExecutionCoordinator injection (NOT Spring injection - pass via activity):
   - Fetch coordinator instance via activity call (activities are Spring beans)
   - OR: Create coordinator inline using required dependencies fetched via activities

2. Fetch workflow definition, nodes, and edges via activities:
   ```kotlin
   val workflowDef = activities.loadWorkflowDefinition(workflowId)
   val nodes = activities.loadWorkflowNodes(workflowId)
   val edges = activities.loadWorkflowEdges(workflowId)
   ```

3. Create nodeExecutor lambda using Temporal Async/Promise:
   ```kotlin
   val nodeExecutor: (List<WorkflowNode>) -> List<Pair<UUID, Any?>> = { readyNodes ->
       // Execute all ready nodes in parallel
       val promises = readyNodes.map { node ->
           Async.function { activities.executeNode(node.id, context) }
       }

       // Wait for all (deterministic)
       Promise.allOf(promises).get()

       // Collect results
       readyNodes.zip(promises.map { it.get() }).map { (node, output) ->
           node.id to output
       }
   }
   ```

4. Call coordinator (via activity):
   ```kotlin
   val finalState = activities.executeWorkflowWithCoordinator(nodes, edges, context)
   ```

**What to avoid:**
- Don't create Spring beans in workflow code (non-deterministic, breaks replay)
- Don't use Workflow.newActivityStub multiple times (reuse existing stub)
- Don't execute activities sequentially when they can be parallel (defeats purpose)
- Don't mix workflow logic and activity logic (maintain separation)

**Pattern Choice:**
Since workflows can't use Spring beans directly (non-deterministic), delegate coordinator execution to an activity method:
```kotlin
// In WorkflowNodeActivities.kt (add new method)
fun executeWorkflowWithCoordinator(
    nodes: List<WorkflowNode>,
    edges: List<WorkflowEdge>,
    context: WorkflowExecutionContext
): WorkflowState

// In WorkflowNodeActivitiesImpl.kt
override fun executeWorkflowWithCoordinator(...): WorkflowState {
    // Coordinator is Spring bean, injected into this activity
    val nodeExecutor = { readyNodes: List<WorkflowNode> ->
        // Execute nodes using existing executeNode logic
        readyNodes.map { node ->
            val output = executeNode(node.id, context)
            node.id to output
        }
    }
    return dagExecutionCoordinator.executeWorkflow(nodes, edges, nodeExecutor)
}
```

Then workflow simply calls:
```kotlin
val finalState = activities.executeWorkflowWithCoordinator(nodes, edges, context)
```

**Testing:**
After update, existing WorkflowExecutionIntegrationTest should still pass (backward compatibility).
  </action>
  <verify>
1. ./gradlew compileKotlin succeeds
2. WorkflowExecutionWorkflowImpl uses coordinator (via activity delegation)
3. New activity method executeWorkflowWithCoordinator added to interface and impl
4. DagExecutionCoordinator injected into WorkflowNodeActivitiesImpl
5. No Spring beans used directly in workflow code
6. Existing integration test still passes
  </verify>
  <done>
WorkflowExecutionWorkflowImpl updated, delegates to coordinator via activity, uses parallel execution, maintains Temporal determinism, existing tests pass.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add integration test for parallel DAG execution</name>
  <files>src/test/kotlin/riven/core/service/workflow/DagExecutionIntegrationTest.kt</files>
  <action>
Create integration test validating parallel DAG execution with TopologicalSorter, ActiveNodeQueue, and DagExecutionCoordinator.

**Test Scenarios:**
1. **Linear DAG (A → B → C):** Validates sequential execution order
2. **Diamond DAG (A → B,C → D):** Validates B and C execute in parallel
3. **Parallel branches (A → B,C,D → E):** Validates maximum parallelism
4. **Cycle detection:** Validates exception thrown for cyclic DAG
5. **Disconnected components:** Validates validator catches orphaned nodes

**Test Structure:**
```kotlin
@SpringBootTest
@Transactional
class DagExecutionIntegrationTest {
    @Autowired
    private lateinit var dagExecutionCoordinator: DagExecutionCoordinator

    @Autowired
    private lateinit var topologicalSorter: TopologicalSorter

    @Autowired
    private lateinit var dagValidator: DagValidator

    @Test
    fun `test diamond DAG executes B and C in parallel`() {
        // Create nodes: A, B, C, D
        // Create edges: A→B, A→C, B→D, C→D
        // Create mock nodeExecutor that tracks execution order
        // Execute via coordinator
        // Assert: B and C in same batch (parallel), D after both
    }

    @Test
    fun `test cycle detection throws exception`() {
        // Create nodes: A, B, C
        // Create edges: A→B, B→C, C→A (cycle)
        // Assert: topologicalSorter.sort() throws IllegalStateException
    }

    // ... more tests
}
```

**Implementation details:**
- Use @SpringBootTest for full Spring context (enables coordinator autowiring)
- Use @Transactional for test isolation
- Create mock WorkflowNode implementations (simple test nodes that return fixed outputs)
- Create nodeExecutor that tracks which batches of nodes execute together (proves parallelism)
- Validate outputs in WorkflowState.dataRegistry
- Use assertThrows for error cases (cycles, invalid DAGs)

**What to avoid:**
- Don't test Temporal workflow directly (use coordinator unit test style)
- Don't create real workflow executions (expensive, slow tests)
- Don't test individual components (TopologicalSorter, queue) - they have their own unit tests
- Focus on integration: do components work together correctly?

**Test Data:**
Create helper functions for common DAG structures:
```kotlin
private fun createLinearDag(): Pair<List<WorkflowNode>, List<WorkflowEdge>>
private fun createDiamondDag(): Pair<List<WorkflowNode>, List<WorkflowEdge>>
private fun createParallelDag(): Pair<List<WorkflowNode>, List<WorkflowEdge>>
private fun createCyclicDag(): Pair<List<WorkflowNode>, List<WorkflowEdge>>
```
  </action>
  <verify>
1. ./gradlew test runs DagExecutionIntegrationTest
2. All test scenarios pass (linear, diamond, parallel, cycle, disconnected)
3. Tests validate parallel execution (B and C in same batch)
4. Tests validate execution order (topological order respected)
5. Tests validate error handling (cycles throw exceptions)
6. ./gradlew build succeeds (all tests pass)
  </verify>
  <done>
DagExecutionIntegrationTest.kt exists, all tests pass, validates parallel execution, validates topological order, validates error handling, proves coordinator integration correctness.
  </done>
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] ./gradlew compileKotlin succeeds without errors
- [ ] ./gradlew test runs all tests successfully
- [ ] ./gradlew build completes without errors
- [ ] DagExecutionCoordinator orchestrates validation→execution→completion
- [ ] WorkflowExecutionWorkflowImpl uses coordinator via activity delegation
- [ ] Integration test proves parallel execution works
- [ ] No Temporal determinism violations (no Spring beans in workflow)
- [ ] Existing Phase 3 integration test still passes (backward compatibility)
</verification>

<success_criteria>

- All tasks completed
- All verification checks pass
- DagExecutionCoordinator.executeWorkflow() orchestrates full DAG execution
- Parallel node execution proven via integration test
- WorkflowExecutionWorkflowImpl maintains Temporal determinism
- State machine tracks workflow progression correctly
- Tests validate topological order and parallelism
- Phase 5 complete: DAG execution coordinator operational
</success_criteria>

<output>
After completion, create `.planning/phases/5-dag-execution-coordinator/5-03-SUMMARY.md`:

# Phase 5 Plan 3: DAG Execution Coordinator Summary

**[Substantive one-liner - what shipped]**

## Accomplishments

- Implemented DagExecutionCoordinator orchestrating validation→execution→completion
- Integrated coordinator with Temporal workflow via activity delegation
- Created integration test proving parallel execution correctness
- Achieved maximum parallelism in independent DAG branches
- Completed Phase 5: DAG execution coordinator operational

## Files Created/Modified

- `src/main/kotlin/riven/core/service/workflow/coordinator/DagExecutionCoordinator.kt` - Main orchestrator
- `src/main/kotlin/riven/core/service/workflow/temporal/workflows/WorkflowExecutionWorkflowImpl.kt` - Updated to use coordinator
- `src/main/kotlin/riven/core/service/workflow/temporal/activities/WorkflowNodeActivities.kt` - Added executeWorkflowWithCoordinator
- `src/main/kotlin/riven/core/service/workflow/temporal/activities/WorkflowNodeActivitiesImpl.kt` - Coordinator integration
- `src/test/kotlin/riven/core/service/workflow/DagExecutionIntegrationTest.kt` - Parallel execution tests

## Decisions Made

[Document coordinator delegation pattern, parallel execution strategy, test coverage approach]

## Issues Encountered

[Problems and resolutions, or "None"]

## Next Phase Readiness

Ready for Phase 6: Backend API Layer
- DAG execution coordinator operational
- Parallel node execution working
- State machine tracks workflow progression
- Integration tests prove correctness

**Blockers:** None

**Follow-up Work:**
- Future: Conditional branching logic (Phase 7)
- Future: Error handling and retry policies (Phase 7)
- Future: Advanced control flow (LOOP, SWITCH, PARALLEL nodes)

---
*Phase: 5-dag-execution-coordinator*
*Completed: [Date]*
</output>
