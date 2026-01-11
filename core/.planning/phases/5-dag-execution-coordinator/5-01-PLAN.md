---
phase: 5-dag-execution-coordinator
plan: 01
type: execute
---

<objective>
Implement topological sorting with cycle detection for DAG execution order.

Purpose: Enable correct execution order by determining which nodes can run in parallel and detecting invalid workflow graphs with cycles.
Output: TopologicalSorter service using Kahn's algorithm, DagValidator for pre-execution validation.
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
@.planning/phases/4.1-action-execution/4.1-03-SUMMARY.md
@.planning/phases/03-temporal-workflow-engine/03-01-SUMMARY.md

**Tech stack available:**
- Temporal SDK 1.32.1 (from Phase 3)
- WorkflowNode polymorphic execution (from Phase 4.1)
- WorkflowExecutionContext with data registry (from Phase 4.1)
- Spring Boot 3.5.3 + Kotlin 2.1.21

**Established patterns:**
- Polymorphic node execution: nodes implement execute()
- Service layer pattern: @Service with constructor injection
- No type switching: use polymorphism and sealed interfaces

**Constraining decisions:**
- Phase 5-RESEARCH.md: Use Kahn's algorithm (not DFS) for topological sort - enables early cycle detection and parallel execution tracking via in-degree
- Phase 5-CONTEXT.md: Correct execution order is top priority - nodes must execute in right order respecting dependencies
- Phase 5-RESEARCH.md: Don't hand-roll topological sort - use standard algorithm (O(V+E) linear time, handles all edge cases)

**Key insight from research:**
Kahn's algorithm provides both topological ordering AND cycle detection in a single pass. As we process nodes, we track in-degree (number of incoming edges). If any nodes remain with in-degree > 0 after processing, a cycle exists.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement Kahn's algorithm topological sorter</name>
  <files>src/main/kotlin/riven/core/service/workflow/coordinator/TopologicalSorter.kt</files>
  <action>
Create TopologicalSorter service implementing Kahn's algorithm for topological sort with cycle detection.

**Algorithm:**
1. Calculate in-degree for each node (count of incoming edges)
2. Initialize queue with all nodes having in-degree 0
3. Process queue: dequeue node, add to result, decrement in-degree of successors
4. If successor in-degree becomes 0, add to queue
5. After processing, if any nodes remain with in-degree > 0, throw exception (cycle detected)

**Interface:**
```kotlin
@Service
class TopologicalSorter {
    fun sort(nodes: List<WorkflowNode>, edges: List<WorkflowEdge>): List<WorkflowNode>
}
```

**Implementation details:**
- Return nodes in topological order (dependencies before dependents)
- Throw IllegalStateException with descriptive message if cycle detected (include unreachable node count)
- Use ArrayDeque for queue (standard Java collection)
- Use Map<UUID, Int> for in-degree tracking
- Time complexity: O(V + E) where V = nodes, E = edges

**What to avoid:**
- Don't use DFS-based sort (no early cycle detection, harder to parallelize)
- Don't use custom queue implementations (ArrayDeque is standard and efficient)
- Don't silently ignore cycles (always throw exception with clear message)
- Don't modify input collections (nodes/edges should be immutable from sorter's perspective)

**Testing:**
Include KDoc with example usage and edge cases (linear chain, diamond DAG, cycle detection).
  </action>
  <verify>
1. ./gradlew compileKotlin succeeds
2. Grep for "class TopologicalSorter" finds the service
3. Service properly annotated with @Service
4. Algorithm matches Kahn's from research (in-degree calculation, queue processing, cycle detection)
  </verify>
  <done>
TopologicalSorter.kt exists, compiles without errors, implements Kahn's algorithm, throws exception on cycles, includes comprehensive KDoc with examples.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create DAG validation utilities</name>
  <files>src/main/kotlin/riven/core/service/workflow/coordinator/DagValidator.kt</files>
  <action>
Create DagValidator service for pre-execution DAG structure validation.

**Validations:**
1. **No cycles:** Use TopologicalSorter to detect cycles (catch IllegalStateException)
2. **Connected components:** Ensure single connected component (all nodes reachable from start nodes)
3. **No orphaned nodes:** Every node (except start nodes) has at least one incoming edge
4. **Edge consistency:** All edge source/target nodes exist in node list
5. **Conditional node edges:** Conditional nodes must have at least 2 outgoing edges (true/false branches)

**Interface:**
```kotlin
@Service
class DagValidator(
    private val topologicalSorter: TopologicalSorter
) {
    fun validate(nodes: List<WorkflowNode>, edges: List<WorkflowEdge>): ValidationResult
}

data class ValidationResult(
    val valid: Boolean,
    val errors: List<String>
)
```

**Implementation details:**
- Return ValidationResult with all errors (don't fail on first error)
- Use descriptive error messages: "Cycle detected: 3 nodes unreachable", "Orphaned node: {nodeId}", etc.
- Leverage TopologicalSorter for cycle detection (don't duplicate logic)
- Check for disconnected components using BFS/DFS from start nodes
- Start nodes: nodes with in-degree 0 after edge processing

**What to avoid:**
- Don't throw exceptions (return ValidationResult with errors instead)
- Don't validate business logic (entity types exist, etc.) - that's Phase 6/7 work
- Don't validate node configs (that's done during node execution)
- Don't duplicate topological sort logic (use TopologicalSorter)

**Testing:**
Include KDoc with validation examples and common error scenarios.
  </action>
  <verify>
1. ./gradlew compileKotlin succeeds
2. DagValidator properly injects TopologicalSorter
3. validate() returns ValidationResult with errors list
4. Service annotated with @Service
  </verify>
  <done>
DagValidator.kt exists, compiles without errors, validates cycles/components/orphans/edges/conditionals, returns ValidationResult, includes comprehensive KDoc.
  </done>
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] ./gradlew compileKotlin succeeds without errors
- [ ] TopologicalSorter implements Kahn's algorithm correctly
- [ ] DagValidator validates all structural constraints
- [ ] Both services include comprehensive KDoc with examples
- [ ] No business logic validation (deferred to later phases)
</verification>

<success_criteria>

- All tasks completed
- All verification checks pass
- TopologicalSorter.sort() returns topologically ordered nodes
- TopologicalSorter detects cycles and throws descriptive exception
- DagValidator.validate() catches structural issues
- Services follow Spring Boot conventions (@Service, constructor injection)
- KDoc explains algorithm choices and usage patterns
</success_criteria>

<output>
After completion, create `.planning/phases/5-dag-execution-coordinator/5-01-SUMMARY.md`:

# Phase 5 Plan 1: Topological Sort & DAG Validation Summary

**[Substantive one-liner - what shipped]**

## Accomplishments

- Implemented Kahn's algorithm for topological sorting with O(V+E) complexity
- Created cycle detection mechanism (remaining in-degree > 0)
- Built DAG validator for pre-execution structural validation
- Established foundation for parallel execution scheduling

## Files Created/Modified

- `src/main/kotlin/riven/core/service/workflow/coordinator/TopologicalSorter.kt` - Kahn's algorithm implementation
- `src/main/kotlin/riven/core/service/workflow/coordinator/DagValidator.kt` - DAG structure validation

## Decisions Made

[Document algorithm choice (Kahn's vs DFS), validation scope, error handling strategy]

## Issues Encountered

[Problems and resolutions, or "None"]

## Next Step

Ready for 5-02-PLAN.md: Active Node Queue & State Machine
</output>
