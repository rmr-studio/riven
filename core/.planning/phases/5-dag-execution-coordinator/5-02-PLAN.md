---
phase: 5-dag-execution-coordinator
plan: 02
type: execute
---

<objective>
Implement active node queue and workflow state machine for orchestration.

Purpose: Enable parallel execution of independent nodes while respecting dependencies, and track workflow progression through state transitions.
Output: ActiveNodeQueue for scheduling, WorkflowState for orchestration state tracking.
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

**Tech stack available:**
- Temporal SDK 1.32.1 with Async/Promise (deterministic parallel execution)
- TopologicalSorter from Plan 1 (provides dependency order)
- WorkflowNode polymorphic execution
- WorkflowExecutionContext with mutable data registry

**Established patterns:**
- Immutable data classes for domain models
- Service layer with constructor injection
- State machine pattern for workflow orchestration

**Constraining decisions:**
- Phase 5-RESEARCH.md: Use active node queue pattern - maintains ready-to-execute nodes, processes concurrently, adds successors on completion
- Phase 5-CONTEXT.md: Maintain active node queue for parallel execution - nodes ready to execute are queued, processed concurrently
- Phase 5-RESEARCH.md: Model workflow as state machine with states (INITIALIZING, EXECUTING_NODES, WAITING, COMPLETED) and transitions driven by node completions

**Key insight from research:**
The active node queue bridges topological sort (static dependency order) with runtime execution (dynamic parallel scheduling). As nodes complete, we decrement in-degree of successors and enqueue those that become ready (in-degree reaches 0).
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement active node queue with in-degree tracking</name>
  <files>src/main/kotlin/riven/core/service/workflow/coordinator/ActiveNodeQueue.kt</files>
  <action>
Create ActiveNodeQueue service for parallel node scheduling with in-degree tracking.

**Core Functionality:**
1. **Initialize:** Accept nodes and edges, calculate initial in-degree map
2. **Enqueue ready nodes:** Add nodes with in-degree 0 to ready queue
3. **Dequeue batch:** Return all currently ready nodes for parallel execution
4. **Mark completed:** Decrement in-degree of successors, enqueue newly ready nodes
5. **Check completion:** Return true if queue empty and all nodes processed

**Interface:**
```kotlin
@Service
class ActiveNodeQueue {
    fun initialize(nodes: List<WorkflowNode>, edges: List<WorkflowEdge>)
    fun getReadyNodes(): List<WorkflowNode>
    fun markNodeCompleted(nodeId: UUID)
    fun hasMoreWork(): Boolean
    fun getRemainingNodes(): List<WorkflowNode>
}
```

**State Management:**
- Maintain mutable in-degree map: Map<UUID, Int>
- Maintain ready queue: ArrayDeque<WorkflowNode>
- Maintain completed set: Set<UUID> (for tracking progress)
- Maintain node lookup: Map<UUID, WorkflowNode> (for O(1) access)
- Maintain edge adjacency list: Map<UUID, List<WorkflowEdge>> (sourceId → outgoing edges)

**Implementation details:**
- initialize() clears all state, calculates in-degree, enqueues zero in-degree nodes
- getReadyNodes() returns current ready queue as list and clears the queue (batch semantics)
- markNodeCompleted() decrements successors' in-degree, adds to completed set, enqueues ready successors
- hasMoreWork() returns true if ready queue non-empty OR remaining nodes with in-degree > 0
- getRemainingNodes() returns nodes with in-degree > 0 (for debugging/error reporting)

**What to avoid:**
- Don't recalculate in-degree on every operation (maintain mutable state)
- Don't use priority queue (FIFO order is sufficient, parallel execution handles optimization)
- Don't validate cycles here (TopologicalSorter handles that in Plan 1)
- Don't expose mutable state directly (provide controlled mutation methods)

**Thread Safety:**
This service is NOT thread-safe. It's designed to be used within Temporal's deterministic workflow context, which is single-threaded. Document this clearly in KDoc.
  </action>
  <verify>
1. ./gradlew compileKotlin succeeds
2. Service annotated with @Service
3. All methods present: initialize, getReadyNodes, markNodeCompleted, hasMoreWork, getRemainingNodes
4. KDoc clearly states NOT thread-safe (Temporal workflow context only)
  </verify>
  <done>
ActiveNodeQueue.kt exists, compiles without errors, manages in-degree tracking, maintains ready queue, includes comprehensive KDoc with thread-safety warning.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create workflow state machine</name>
  <files>src/main/kotlin/riven/core/models/workflow/coordinator/WorkflowState.kt, src/main/kotlin/riven/core/models/workflow/coordinator/StateTransition.kt</files>
  <action>
Create WorkflowState data class and state transition logic for workflow orchestration.

**State Machine States:**
```kotlin
enum class WorkflowExecutionPhase {
    INITIALIZING,       // Building dependency graph, validating DAG
    EXECUTING_NODES,    // Processing active nodes
    COMPLETED,          // All nodes finished successfully
    FAILED              // Execution error occurred
}
```

**WorkflowState (Immutable):**
```kotlin
data class WorkflowState(
    val phase: WorkflowExecutionPhase,
    val activeNodes: Set<UUID>,           // Currently executing (in Temporal Async)
    val completedNodes: Set<UUID>,        // Finished execution
    val failedNodes: Set<UUID>,           // Failed execution (empty in v1, populated in Phase 7)
    val dataRegistry: Map<UUID, Any?>     // Node outputs (nodeId → output map)
)
```

**State Events (Sealed Interface):**
```kotlin
sealed interface StateEvent

data class NodesReady(val nodeIds: Set<UUID>) : StateEvent
data class NodeCompleted(val nodeId: UUID, val output: Any?) : StateEvent
data class NodeFailed(val nodeId: UUID, val error: String) : StateEvent
data object AllNodesCompleted : StateEvent
data object WorkflowFailed : StateEvent
```

**State Transition Logic:**
Create StateTransition object with apply() function:
```kotlin
object StateTransition {
    fun apply(state: WorkflowState, event: StateEvent): WorkflowState
}
```

**Transition Rules:**
- NodesReady: phase → EXECUTING_NODES, add nodeIds to activeNodes
- NodeCompleted: remove from activeNodes, add to completedNodes, store output in dataRegistry
- NodeFailed: phase → FAILED, add to failedNodes (v1 implementation, enhanced in Phase 7)
- AllNodesCompleted: phase → COMPLETED (if activeNodes empty and no more work)
- WorkflowFailed: phase → FAILED

**Implementation details:**
- All transitions return new WorkflowState (immutable pattern)
- StateTransition.apply() uses when expression on sealed StateEvent
- Validate state transitions (e.g., can't complete node not in activeNodes)
- Include KDoc explaining state machine diagram and valid transitions

**What to avoid:**
- Don't make WorkflowState mutable (use immutable data class with copy())
- Don't put business logic here (pure state transitions only)
- Don't validate node execution (that's in activities/coordinator)
- Don't implement retry logic here (that's Phase 7 - Temporal handles retries)

**Note on dataRegistry:**
Store outputs by nodeId (UUID) for now. In Phase 5 Plan 3, the coordinator will map these to node names for template resolution ({{ steps.nodeName.output }}).
  </action>
  <verify>
1. ./gradlew compileKotlin succeeds
2. WorkflowExecutionPhase enum has all 4 states
3. WorkflowState is immutable data class
4. StateEvent is sealed interface with 5 concrete events
5. StateTransition.apply() handles all event types
6. KDoc includes state machine diagram
  </verify>
  <done>
WorkflowState.kt and StateTransition.kt exist, compile without errors, implement immutable state machine, handle all transitions, include comprehensive KDoc with state diagram.
  </done>
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] ./gradlew compileKotlin succeeds without errors
- [ ] ActiveNodeQueue manages ready nodes and in-degree correctly
- [ ] WorkflowState is immutable with all required fields
- [ ] StateTransition.apply() handles all event types
- [ ] KDoc explains usage patterns and thread safety constraints
- [ ] No business logic in state machine (pure state transitions)
</verification>

<success_criteria>

- All tasks completed
- All verification checks pass
- ActiveNodeQueue schedules nodes respecting dependencies
- WorkflowState tracks orchestration phase and node status
- State transitions are immutable and deterministic
- Services/models follow Kotlin/Spring conventions
- Comprehensive KDoc with examples and constraints
</success_criteria>

<output>
After completion, create `.planning/phases/5-dag-execution-coordinator/5-02-SUMMARY.md`:

# Phase 5 Plan 2: Active Node Queue & State Machine Summary

**[Substantive one-liner - what shipped]**

## Accomplishments

- Implemented active node queue for parallel scheduling with in-degree tracking
- Created immutable workflow state machine with 4 phases
- Built state transition logic with sealed event interface
- Established foundation for deterministic orchestration

## Files Created/Modified

- `src/main/kotlin/riven/core/service/workflow/coordinator/ActiveNodeQueue.kt` - Ready node scheduling
- `src/main/kotlin/riven/core/models/workflow/coordinator/WorkflowState.kt` - State machine model
- `src/main/kotlin/riven/core/models/workflow/coordinator/StateTransition.kt` - Transition logic

## Decisions Made

[Document state machine design, immutability choice, thread-safety constraints]

## Issues Encountered

[Problems and resolutions, or "None"]

## Next Step

Ready for 5-03-PLAN.md: DAG Execution Coordinator (final integration)
</output>
