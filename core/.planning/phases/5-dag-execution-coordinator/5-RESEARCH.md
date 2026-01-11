# Phase 5: DAG Execution Coordinator - Research

**Researched:** 2026-01-11
**Domain:** DAG orchestration, topological sorting, parallel execution, Temporal workflow patterns
**Confidence:** HIGH

<research_summary>
## Summary

Researched the ecosystem for building a DAG execution coordinator within Temporal workflows. The standard approach uses **Kahn's algorithm** for topological sorting to determine execution order, an **active node queue pattern** for parallel execution, and a **state machine** to track workflow progression.

Key finding: Don't hand-roll topological sort or concurrent execution primitives. Use proven algorithms (Kahn's for cycle detection + parallel scheduling, DFS for simpler ordering) and Temporal's built-in Async/Promise constructs for deterministic parallel execution.

The critical constraint is **determinism in Temporal workflows** - all workflow state must be deterministic and replayable. Activities (non-deterministic operations) are executed via Async.function/procedure, and Promise.allOf waits for parallel completion.

**Primary recommendation:** Use Kahn's algorithm for topological sort (enables early cycle detection and parallel execution tracking via in-degree), maintain active node queue with ready-to-execute nodes, use Temporal's Async/Promise.allOf for parallel activity execution, model workflow as state machine with transitions driven by node completions.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Temporal Java SDK | 1.32.1 | Workflow orchestration | Existing infrastructure, deterministic execution guarantees |
| Kahn's Algorithm | N/A (standard algorithm) | Topological sort with cycle detection | Better for task scheduling & parallel execution, early cycle detection |
| DFS-based Topological Sort | N/A (standard algorithm) | Alternative topological sort | Simpler implementation if no cycle detection needed |
| Java ExecutorService | JDK 21 built-in | Thread pool management | Standard Java concurrency primitive for parallel execution |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Java TopologicalSorter | JDK 9+ | Built-in topo sort | Alternative to manual Kahn's implementation |
| Async/Promise (Temporal SDK) | Part of SDK | Parallel activity execution | All parallel execution in Temporal workflows |
| BlockingQueue | JDK built-in | Task queue management | Active node queue implementation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Kahn's Algorithm | DFS-based sort | DFS simpler but no early cycle detection, harder to parallelize |
| Temporal Async/Promise | Custom thread pools | Custom pools break Temporal determinism - never do this |
| Manual state tracking | Workflow framework state machines | Manual tracking error-prone, framework patterns more robust |

**Installation:**
```kotlin
// Temporal SDK already in project (build.gradle.kts)
implementation("io.temporal:temporal-sdk:1.32.1")

// Java standard library - no additional dependencies needed for:
// - java.util.concurrent (ExecutorService, BlockingQueue)
// - Graph algorithms (implement Kahn's or use TopologicalSorter in JDK 9+)
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/main/kotlin/riven/core/
├── workflow/
│   ├── coordinator/              # DAG orchestration logic
│   │   ├── DagExecutionCoordinator.kt
│   │   ├── TopologicalSorter.kt  # Kahn's algorithm implementation
│   │   └── NodeQueue.kt          # Active node queue
│   ├── state/                    # State machine
│   │   ├── WorkflowState.kt
│   │   └── StateTransition.kt
│   └── temporal/                 # Temporal workflow definitions
│       ├── WorkflowDefinition.kt
│       └── WorkflowActivities.kt
```

### Pattern 1: Active Node Queue for Parallel Execution
**What:** Maintain a queue of nodes that are ready to execute (all dependencies satisfied). Process queue concurrently, adding successors as nodes complete.
**When to use:** All DAG execution scenarios where parallel execution is desired
**Example:**
```kotlin
// Kahn's algorithm with active node queue
class DagExecutionCoordinator {
    fun executeWorkflow(nodes: List<WorkflowNode>, edges: List<WorkflowEdge>) {
        // 1. Calculate in-degree for all nodes
        val inDegree = nodes.associateWith { node ->
            edges.count { it.targetId == node.id }
        }.toMutableMap()

        // 2. Initialize queue with nodes having in-degree 0
        val readyQueue = ArrayDeque<WorkflowNode>()
        nodes.filter { inDegree[it] == 0 }.forEach { readyQueue.add(it) }

        // 3. Process queue: execute ready nodes in parallel
        while (readyQueue.isNotEmpty()) {
            val readyNodes = readyQueue.toList()
            readyQueue.clear()

            // Execute all ready nodes in parallel using Temporal Async
            val promises = readyNodes.map { node ->
                Async.function { executeNode(node) }
            }

            // Wait for all to complete (deterministic in Temporal)
            Promise.allOf(promises).get()

            // 4. Decrease in-degree of successors, add to queue if ready
            readyNodes.forEach { completedNode ->
                val successors = edges.filter { it.sourceId == completedNode.id }
                successors.forEach { edge ->
                    val targetNode = nodes.find { it.id == edge.targetId }!!
                    inDegree[targetNode] = inDegree[targetNode]!! - 1
                    if (inDegree[targetNode] == 0) {
                        readyQueue.add(targetNode)
                    }
                }
            }
        }

        // 5. Check for cycle (if any nodes left with in-degree > 0)
        if (inDegree.any { it.value > 0 }) {
            throw IllegalStateException("Cycle detected in workflow DAG")
        }
    }
}
```

### Pattern 2: Conditional Node Edge Selection
**What:** Conditional nodes return an edge ID from their execute() method, and the orchestrator uses that to follow the correct path
**When to use:** CONDITION node types that evaluate expressions and branch
**Example:**
```kotlin
interface WorkflowNode {
    fun execute(context: WorkflowExecutionContext): ExecutionResult
}

data class ExecutionResult(
    val output: Any?,
    val selectedEdgeId: UUID? = null  // For conditional nodes
)

// Conditional node implementation
class ConditionalNode : WorkflowNode {
    override fun execute(context: WorkflowExecutionContext): ExecutionResult {
        val result = evaluateCondition(context)
        val selectedEdge = if (result) trueBranchEdgeId else falseBranchEdgeId
        return ExecutionResult(output = result, selectedEdgeId = selectedEdge)
    }
}

// Orchestrator uses selectedEdgeId to determine next node(s)
fun getNextNodes(node: WorkflowNode, result: ExecutionResult, edges: List<WorkflowEdge>): List<WorkflowNode> {
    return if (result.selectedEdgeId != null) {
        // Conditional: follow single selected edge
        edges.filter { it.id == result.selectedEdgeId }.map { getNodeById(it.targetId) }
    } else {
        // Regular: follow all outgoing edges
        edges.filter { it.sourceId == node.id }.map { getNodeById(it.targetId) }
    }
}
```

### Pattern 3: State Machine for Workflow Orchestration
**What:** Model workflow execution as state machine with states (INITIALIZING, EXECUTING_NODE, WAITING, COMPLETED) and transitions driven by node completions
**When to use:** All workflow orchestration to track execution progress and handle state transitions
**Example:**
```kotlin
enum class WorkflowExecutionState {
    INITIALIZING,       // Building dependency graph
    EXECUTING_NODES,    // Processing active nodes
    WAITING_FOR_NODES,  // Blocked waiting for dependencies
    COMPLETED,          // All nodes finished
    FAILED              // Execution error
}

data class WorkflowState(
    val state: WorkflowExecutionState,
    val activeNodes: Set<UUID>,           // Currently executing
    val completedNodes: Set<UUID>,        // Finished execution
    val waitingNodes: Set<UUID>,          // Blocked by dependencies
    val executionContext: WorkflowExecutionContext
)

// State transitions
fun transition(currentState: WorkflowState, event: StateEvent): WorkflowState {
    return when (event) {
        is NodeCompleted -> {
            val newCompleted = currentState.completedNodes + event.nodeId
            val newActive = currentState.activeNodes - event.nodeId
            val newReady = getReadyNodes(currentState, newCompleted)

            currentState.copy(
                activeNodes = newActive + newReady,
                completedNodes = newCompleted,
                waitingNodes = currentState.waitingNodes - newReady
            )
        }
        is NodesReady -> currentState.copy(
            state = WorkflowExecutionState.EXECUTING_NODES,
            activeNodes = currentState.activeNodes + event.nodeIds
        )
        is AllNodesCompleted -> currentState.copy(
            state = WorkflowExecutionState.COMPLETED
        )
    }
}
```

### Pattern 4: Temporal Async/Promise for Parallel Activities
**What:** Use Temporal's Async.function/procedure with Promise.allOf for deterministic parallel execution
**When to use:** Whenever executing multiple activities concurrently in Temporal workflows
**Example:**
```kotlin
// Execute multiple nodes in parallel (Temporal-safe)
fun executeNodesInParallel(nodes: List<WorkflowNode>): List<Any?> {
    val promises = nodes.map { node ->
        // Async.function returns Promise<T>
        Async.function {
            val activity = Workflow.newActivityStub(
                WorkflowActivities::class.java,
                ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofMinutes(5))
                    .build()
            )
            activity.executeNodeActivity(node.id)
        }
    }

    // Wait for all promises to complete (deterministic)
    Promise.allOf(promises).get()

    // Collect results
    return promises.map { it.get() }
}
```

### Anti-Patterns to Avoid
- **Custom thread pools in workflows:** Breaks Temporal determinism. Always use Async/Promise.
- **Non-deterministic operations in workflows:** No random, no System.currentTimeMillis(), no external calls. Delegate to activities.
- **Ignoring cycle detection:** Always check for cycles before execution or use Kahn's algorithm which detects cycles during execution.
- **Sequential execution when parallelizable:** Use active node queue pattern to exploit parallelism in independent branches.
- **Mutable shared state across activities:** Activities should be stateless; all state lives in workflow context.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Topological sort | Custom DAG traversal | Kahn's algorithm or DFS-based sort | Well-studied algorithms, edge cases (cycles, disconnected components) are tricky |
| Cycle detection | Manual visited tracking | Kahn's algorithm (detects via remaining in-degree) | Easy to get wrong, Kahn's provides early detection |
| Parallel execution in Temporal | Thread pools, CompletableFuture | Temporal Async/Promise | Custom concurrency breaks determinism, causes replay errors |
| In-degree calculation | Manual edge counting | Standard graph algorithm libraries | Off-by-one errors, missing edge cases |
| State machine implementation | Ad-hoc state tracking | Established state machine patterns | Missing transitions, invalid state bugs |
| Dependency resolution | Custom ordering logic | Topological sort | Reinventing the wheel, likely has bugs |

**Key insight:** DAG execution and topological sorting are solved problems in computer science (50+ years of research). Modern implementations are efficient (O(V+E) linear time) and handle all edge cases. Temporal provides battle-tested concurrency primitives that maintain determinism - using anything else risks replay failures and non-deterministic behavior that breaks workflow resumption.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Non-Determinism in Temporal Workflows
**What goes wrong:** Workflow replay fails with "non-deterministic error" causing execution to fail
**Why it happens:** Workflows must follow deterministic constraints - same input produces same Commands. Using random numbers, system time, or external calls in workflow code breaks this.
**How to avoid:**
- Delegate all non-deterministic operations to Activities
- Never use: Math.random(), System.currentTimeMillis(), external HTTP calls, database queries
- Always use: Workflow.getInfo().getCurrentTimeMillis() for time, Activities for external calls
**Warning signs:** Non-deterministic error in Temporal logs, workflow fails on resume after restart

### Pitfall 2: Deadlock from Improper Lock Ordering
**What goes wrong:** Scheduler deadlock where multiple threads wait for each other, execution freezes
**Why it happens:** Acquiring locks in different orders across threads (e.g., Thread A locks Node then Edge, Thread B locks Edge then Node)
**How to avoid:**
- Always acquire locks in consistent order (e.g., always DagRun before TaskInstance)
- Minimize lock scope - hold locks for minimum time necessary
- Use lock-free data structures where possible (Temporal handles workflow state atomically)
**Warning signs:** Execution hangs indefinitely, thread dumps show circular wait

### Pitfall 3: Race Conditions in Parallel Node Execution
**What goes wrong:** Incorrect execution order, nodes run before dependencies complete, data corruption
**Why it happens:** Multiple threads access shared state (execution context, node completion tracking) without synchronization
**How to avoid:**
- Use Temporal's Promise.allOf which handles synchronization deterministically
- Never share mutable state across activities - pass immutable data
- Rely on Temporal's event history for coordination, not custom synchronization
**Warning signs:** Intermittent failures, different results on replay, nodes executing out of order

### Pitfall 4: Ignoring Cycle Detection
**What goes wrong:** Infinite loop in workflow execution, nodes never complete
**Why it happens:** DAG contains cycle (Node A → Node B → Node A), no pre-execution validation
**How to avoid:**
- Use Kahn's algorithm which detects cycles (if nodes remain with in-degree > 0 after processing)
- Validate DAG structure before workflow execution starts
- Implement max execution depth safeguard
**Warning signs:** Workflow runs forever, same nodes executing repeatedly, stack overflow

### Pitfall 5: Incorrect In-Degree Calculation
**What goes wrong:** Nodes execute too early (before dependencies) or never execute (stuck in queue)
**Why it happens:** Off-by-one errors in counting incoming edges, missing edges in calculation
**How to avoid:**
- Use standard graph representation (adjacency list or edge list)
- Test with known DAGs (linear chain, diamond, disconnected components)
- Assert in-degree counts before execution
**Warning signs:** Dependency violations in logs, nodes unexpectedly blocked
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Kahn's Algorithm Implementation (Standard)
```kotlin
// Source: Standard CS algorithm, verified against GeeksforGeeks/Wikipedia
fun topologicalSort(nodes: List<WorkflowNode>, edges: List<WorkflowEdge>): List<WorkflowNode> {
    // 1. Calculate in-degree for each node
    val inDegree = nodes.associateWith { node ->
        edges.count { it.targetId == node.id }
    }.toMutableMap()

    // 2. Initialize queue with zero in-degree nodes
    val queue = ArrayDeque<WorkflowNode>()
    val result = mutableListOf<WorkflowNode>()

    nodes.filter { inDegree[it] == 0 }.forEach { queue.add(it) }

    // 3. Process queue
    while (queue.isNotEmpty()) {
        val current = queue.removeFirst()
        result.add(current)

        // 4. Decrease in-degree of neighbors
        edges.filter { it.sourceId == current.id }.forEach { edge ->
            val target = nodes.find { it.id == edge.targetId }!!
            inDegree[target] = inDegree[target]!! - 1
            if (inDegree[target] == 0) {
                queue.add(target)
            }
        }
    }

    // 5. Check for cycle
    if (result.size != nodes.size) {
        throw IllegalStateException("Cycle detected: ${nodes.size - result.size} nodes unreachable")
    }

    return result
}
```

### Temporal Parallel Activity Execution
```kotlin
// Source: Temporal Java SDK documentation + community examples
@WorkflowInterface
interface DagWorkflow {
    @WorkflowMethod
    fun executeWorkflow(workflowId: UUID): WorkflowExecutionResult
}

class DagWorkflowImpl : DagWorkflow {
    override fun executeWorkflow(workflowId: UUID): WorkflowExecutionResult {
        // Create activity stub
        val activities = Workflow.newActivityStub(
            WorkflowActivities::class.java,
            ActivityOptions.newBuilder()
                .setStartToCloseTimeout(Duration.ofMinutes(5))
                .setRetryOptions(RetryOptions.newBuilder()
                    .setMaximumAttempts(3)
                    .build())
                .build()
        )

        // Load workflow definition (deterministic - from workflow input or signal)
        val workflow = activities.loadWorkflowDefinition(workflowId)

        // Execute nodes in parallel batches (respecting dependencies)
        val readyNodes = getInitialReadyNodes(workflow)
        val completedNodes = mutableSetOf<UUID>()

        while (readyNodes.isNotEmpty()) {
            // Execute all ready nodes in parallel
            val promises = readyNodes.map { node ->
                Async.function {
                    activities.executeNode(node.id, getNodeInputs(node, completedNodes))
                }
            }

            // Wait for all to complete (deterministic)
            Promise.allOf(promises).get()

            // Mark completed and get next batch
            completedNodes.addAll(readyNodes.map { it.id })
            readyNodes = getNextReadyNodes(workflow, completedNodes)
        }

        return WorkflowExecutionResult(
            workflowId = workflowId,
            status = "COMPLETED",
            completedNodes = completedNodes.toList()
        )
    }
}
```

### State Machine Workflow State Tracking
```kotlin
// Source: State machine pattern, adapted for workflow orchestration
data class DagExecutionState(
    val phase: ExecutionPhase,
    val activeNodes: Set<UUID>,
    val completedNodes: Set<UUID>,
    val failedNodes: Set<UUID>,
    val dataRegistry: Map<UUID, Any?> // Output from completed nodes
)

enum class ExecutionPhase {
    INITIALIZING,
    EXECUTING,
    COMPLETED,
    FAILED
}

// State transitions (deterministic)
fun handleNodeCompletion(
    state: DagExecutionState,
    completedNodeId: UUID,
    output: Any?
): DagExecutionState {
    val newCompleted = state.completedNodes + completedNodeId
    val newActive = state.activeNodes - completedNodeId
    val newRegistry = state.dataRegistry + (completedNodeId to output)

    // Determine next ready nodes based on new completed set
    val nextReady = getNodesWithSatisfiedDependencies(newCompleted)

    val newPhase = when {
        newActive.isEmpty() && nextReady.isEmpty() -> ExecutionPhase.COMPLETED
        else -> ExecutionPhase.EXECUTING
    }

    return state.copy(
        phase = newPhase,
        activeNodes = newActive + nextReady,
        completedNodes = newCompleted,
        dataRegistry = newRegistry
    )
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

What's changed recently:

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom thread pools in workflows | Temporal Async/Promise primitives | Always required | Temporal enforces determinism, custom pools break replay |
| Manual DAG libraries | Java 9+ TopologicalSorter | JDK 9 (2017) | Built-in support, but many still implement Kahn's manually for flexibility |
| Temporal Versioning (experimental) | Worker Versioning (production-ready) | 2025 | Old versioning deprecated March 2026, must migrate |
| Airflow-style task orchestration | Temporal workflow orchestration | 2020-2025 | Temporal better for long-running stateful workflows vs. batch ETL |

**New tools/patterns to consider:**
- **Worker Versioning (2025):** Production-ready approach to deploy new workflow code without breaking in-flight workflows. Tag workers by version, route executions appropriately.
- **Dynamic DAG Workflows:** Accept workflow definition as input (DSL), build execution plan at runtime. Enables user-defined workflows without code changes.
- **Temporal Nexus (2024):** Cross-workflow orchestration for complex multi-workflow scenarios. Not needed for Phase 5 but relevant for future phases.

**Deprecated/outdated:**
- **Experimental Worker Versioning:** Support removed March 2026, migrate to production Worker Versioning or Patching
- **Custom saga orchestration frameworks:** Temporal provides built-in saga patterns with compensation, don't build custom
- **Airflow for long-running workflows:** Airflow designed for batch ETL, not durable stateful workflows (seconds to days)
</sota_updates>

<open_questions>
## Open Questions

Things that couldn't be fully resolved:

1. **Optimal parallelism level**
   - What we know: Temporal Async/Promise.allOf enables parallel execution, no hard limits
   - What's unclear: Performance characteristics with 100+ parallel activities, impact on worker resources
   - Recommendation: Start with natural DAG parallelism (execute all ready nodes), add throttling if performance issues arise

2. **Conditional node edge selection implementation**
   - What we know: Pattern is clear (return edge ID from execute()), community uses similar approaches
   - What's unclear: Best way to represent multi-way conditionals (SWITCH with 3+ branches)
   - Recommendation: Start with binary (true/false) conditionals, extend to multi-way by returning edge ID or key

3. **Cycle detection timing**
   - What we know: Kahn's detects cycles during execution (remaining in-degree > 0), DFS can detect pre-execution
   - What's unclear: Whether to validate DAG before workflow starts or rely on Kahn's runtime detection
   - Recommendation: Add pre-execution validation in API layer (Phase 6), use Kahn's as runtime safeguard

4. **State persistence strategy**
   - What we know: Temporal automatically persists workflow state via event history
   - What's unclear: Whether to explicitly save execution state snapshots or rely entirely on Temporal replay
   - Recommendation: Trust Temporal's event history, avoid redundant state snapshots unless debugging requires it
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Temporal Workflow Documentation](https://docs.temporal.io/workflows) - Official determinism requirements, workflow best practices
- [Temporal Java SDK Documentation](https://docs.temporal.io/develop/java) - Async/Promise patterns, activity execution
- [Topological Sorting - GeeksforGeeks](https://www.geeksforgeeks.org/dsa/topological-sorting/) - Kahn's algorithm and DFS implementation details
- [Kahn's Algorithm vs DFS - GeeksforGeeks](https://www.geeksforgeeks.org/dsa/kahns-algorithm-vs-dfs-approach-a-comparative-analysis/) - Algorithm selection criteria
- [Temporal Java SDK Samples](https://github.com/temporalio/samples-java) - Official parallel execution examples

### Secondary (MEDIUM confidence - cross-verified with official docs)
- [Best Practices for Temporal Workflows - Medium](https://medium.com/@ajayshekar01/best-practices-for-building-temporal-workflows-a-practical-guide-with-examples-914fedd2819c) - Workflow patterns, verified against Temporal docs
- [Understanding Non-Determinism in Temporal - Medium](https://medium.com/@sanhdoan/understanding-non-determinism-in-temporal-io-why-it-matters-how-to-avoid-it-3d397d8a5793) - Common pitfalls, verified against official documentation
- [Temporal DAG Execution - Community Forum](https://community.temporal.io/t/executing-a-dag-in-a-workflow/8472) - Community patterns for DAG orchestration
- [Temporal DAG Orchestration - Code Exchange](https://temporal.io/code-exchange/temporalgraph-graph-based-orchestration) - TemporalGraph reference implementation
- [Parallel DAG Execution - Medium](https://medium.com/@pavloosadchyi/parallel-running-dag-of-tasks-in-pythons-celery-4ea73c88c915) - Active node queue pattern example
- [Temporal Java Parallel Execution - Baeldung](https://www.baeldung.com/spring-boot-temporal-workflow-engine) - Spring Boot + Temporal integration patterns
- [Java ThreadPoolExecutor - DigitalOcean](https://www.digitalocean.com/community/tutorials/threadpoolexecutor-java-thread-pool-example-executorservice) - Java concurrency patterns (context only, not for use in Temporal workflows)

### Tertiary (LOW confidence - academic/theoretical, needs validation)
- [Parallel Real-Time Scheduling of DAGs - Academic Paper](https://www.cse.wustl.edu/~lu/papers/tpds-dags.pdf) - Theoretical scheduling algorithms
- [DAG Scheduling on Multiprocessors - Academic Paper](https://arxiv.org/abs/2208.11830) - Advanced scheduling theory
- [State Machine Workflows - Symfony Docs](https://symfony.com/doc/current/workflow/workflow-and-state-machine.html) - State machine concepts (different framework)
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Temporal Java SDK 1.32.1, DAG algorithms (Kahn's, DFS)
- Ecosystem: Topological sort algorithms, parallel execution patterns, state machine orchestration
- Patterns: Active node queue, conditional edge selection, Async/Promise parallel execution
- Pitfalls: Non-determinism, deadlocks, race conditions, cycle detection

**Confidence breakdown:**
- Standard stack: HIGH - Temporal SDK documented, topological sort algorithms well-established
- Architecture: HIGH - Patterns verified from official Temporal docs and CS algorithms
- Pitfalls: HIGH - Documented in Temporal community, deadlock patterns verified in Airflow issues
- Code examples: HIGH - Derived from official Temporal SDK docs and standard algorithms

**Research date:** 2026-01-11
**Valid until:** 2026-02-11 (30 days - Temporal SDK stable, algorithms are timeless)

**Critical constraint:** ALL workflow code must be deterministic for Temporal replay. This is non-negotiable and shapes all architecture decisions.
</metadata>

---

*Phase: 5-dag-execution-coordinator*
*Research completed: 2026-01-11*
*Ready for planning: yes*
