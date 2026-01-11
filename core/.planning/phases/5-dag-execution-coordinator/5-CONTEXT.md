# Phase 5: DAG Execution Coordinator - Context

**Gathered:** 2026-01-11
**Status:** Ready for research

<vision>
## How This Should Work

The DAG execution coordinator is the central orchestration engine that brings the workflow to life. It manages workflow execution within Temporal's workflow state, taking a DAG of WorkflowNodes and WorkflowEdges and orchestrating their execution.

The workflow graph consists of nodes connected by edges (pointers from source to target). The orchestrator runs an execution loop: execute a node → the node's `execute()` method completes → access the node's edge(s) → move the execution pointer to the next node(s).

For most nodes, this is straightforward - they have a single outgoing edge. But conditional nodes are special: they have multiple edges, and their `execute()` function returns an edge ID that tells the orchestrator which path to follow based on the conditional evaluation result.

The orchestrator maintains an **active node queue** - a collection of nodes that are currently ready to execute. It processes these concurrently, and as each node completes, it adds the node's successors to the queue. This enables parallel execution of independent branches while respecting dependencies.

The execution is modeled as a **state machine**, with state transitions driven by node completions. The workflow state (active nodes, execution context, data registry) lives within Temporal's deterministic workflow context.

</vision>

<essential>
## What Must Be Nailed

- **Correct execution order** - This is the top priority. Nodes must execute in the right order, respecting their dependencies. No node should ever run before its inputs are ready. The dependency graph must be honored precisely.

</essential>

<boundaries>
## What's Out of Scope

- **API layer** - That's Phase 6. This phase focuses on building the execution coordinator itself, not the REST endpoints to manage workflows.
- **Error handling and retry logic** - That's Phase 7. Focus on happy-path execution orchestration, not sophisticated failure handling.
- **Workflow versioning** - Managing changes to running workflows and migration strategies are future concerns.
- **Advanced control flow** - Beyond basic conditionals (like loops, parallel splits/joins, sub-workflows) are not in scope for this phase.

</boundaries>

<specifics>
## Specific Ideas

- Use a **state machine pattern** to model workflow execution, with state transitions driven by node completions.
- Conditional nodes return an **edge ID** (or key) from their `execute()` method, and the orchestrator uses that to follow the correct path.
- Maintain an **active node queue** for parallel execution - nodes that are ready to execute are added to the queue, processed concurrently, and their successors are queued when they complete.
- All workflow state (active nodes, execution context, data registry) must live within **Temporal's workflow state** to maintain determinism.

</specifics>

<notes>
## Additional Context

The DAG structure is defined by WorkflowNodes and WorkflowEdges:
- **WorkflowEdges** are pointers between nodes (source → target)
- **Conditional nodes** have multiple outgoing edges, one for each possible evaluation outcome
- The orchestrator needs to handle both sequential execution (following single edges) and parallel execution (processing multiple active nodes concurrently)

The key challenge is balancing central orchestration (managing the execution flow) with parallel execution (running independent nodes concurrently) while maintaining correctness in the dependency graph.

</notes>

---

*Phase: 5-dag-execution-coordinator*
*Context gathered: 2026-01-11*
