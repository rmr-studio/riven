# Domain Pitfalls: Visual Workflow Builder

**Domain:** Visual workflow builder with node-based canvas
**Technology:** XYFlow 12.10.0 + React 19 + Next.js 15
**Researched:** 2026-01-19

## Critical Pitfalls

Mistakes that cause rewrites, severe performance degradation, or major architectural problems.

---

### Pitfall 1: State Management Anti-Patterns

**What goes wrong:**
Developers store all workflow state in React Flow's internal state and pass update functions through node data props, creating tight coupling between workflow logic and UI state. As nodes proliferate and configuration complexity grows, prop drilling becomes unmaintainable and causes severe performance issues.

**Why it happens:**
React Flow's `useNodesState` hook makes prototyping easy, leading developers to use it for production. The documentation explicitly warns: "Although it is OK to use this hook in production, in practice you may want to use a more sophisticated state management solution."

**Consequences:**
- Infinite re-render loops when event handlers are defined inside components
- Performance degradation with 50+ nodes due to excessive re-renders
- State inconsistencies between workflow definition and node UI
- Difficulty implementing undo/redo (no centralized state history)
- Integration complexity with entity data from external services
- Testing becomes nearly impossible due to coupled state

**Prevention:**
1. **Use external state management from day one** - Integrate Zustand (already in project stack) to manage workflow state separately from React Flow's rendering state
2. **Separate concerns:** Workflow definition state (nodes, edges, validation) vs. UI state (selection, drag, zoom)
3. **Never pass functions through node data** - Use React Context or Zustand store for action handlers
4. **Define event handlers outside components** - Use `useCallback` or store actions to prevent re-render loops
5. **Create centralized store architecture:**
   ```typescript
   interface WorkflowStore {
     nodes: Node[];
     edges: Edge[];
     onNodesChange: OnNodesChange;
     onEdgesChange: OnEdgesChange;
     onConnect: OnConnect;
     updateNodeConfig: (nodeId: string, config: unknown) => void;
     // Separate actions for workflow operations
   }
   ```

**Detection:**
- Nodes re-render on every viewport pan/zoom
- Performance degrades noticeably after adding ~20 nodes
- Node configuration forms cause entire canvas to re-render
- React DevTools shows excessive component updates during interactions
- Difficulty adding undo/redo functionality

**Phase impact:** Foundation (Phase 1) - Must be architected correctly from the start. Refactoring state management later requires touching every component.

**Sources:**
- [React Flow State Management Guide](https://reactflow.dev/learn/advanced-use/state-management)
- [Common React Flow Errors](https://reactflow.dev/learn/troubleshooting/common-errors)

---

### Pitfall 2: nodeTypes/edgeTypes Re-creation

**What goes wrong:**
Defining `nodeTypes` or `edgeTypes` objects inside the component render function causes React Flow to treat them as new types on every render, forcing complete canvas re-initialization and destroying performance.

**Why it happens:**
Natural React pattern is to define objects near usage. React Flow's documentation notes this is one of the most common errors: "It can happen easily that you are defining the nodeTypes or edgeTypes object inside of your component render function."

**Consequences:**
- Severe performance degradation (canvas rebuilds on every render)
- Loss of internal node state during re-renders
- Flickering and visual glitches
- Console warnings about changing nodeTypes/edgeTypes after initial render
- Drag operations become janky or non-functional

**Prevention:**
1. **Define outside component:**
   ```typescript
   // ✅ CORRECT - Outside component
   const nodeTypes = {
     trigger: TriggerNode,
     action: ActionNode,
     condition: ConditionNode,
   };

   export const WorkflowCanvas = () => {
     return <ReactFlow nodeTypes={nodeTypes} />;
   };
   ```

2. **Or use useMemo:**
   ```typescript
   // ✅ ACCEPTABLE - When types need to be dynamic
   const nodeTypes = useMemo(
     () => ({
       trigger: TriggerNode,
       action: ActionNode,
       condition: ConditionNode,
     }),
     [] // Only recreate if dependencies change
   );
   ```

3. **Never define inline:**
   ```typescript
   // ❌ WRONG - Creates new object every render
   <ReactFlow
     nodeTypes={{
       trigger: TriggerNode,
       action: ActionNode,
     }}
   />
   ```

**Detection:**
- React Flow console warning: "It looks like you've created a new nodeTypes or edgeTypes object..."
- Poor performance even with few nodes
- Visual flickering during interactions
- Node selection state resets unexpectedly

**Phase impact:** Foundation (Phase 1) - Easy to fix early, painful to debug later when intermixed with other performance issues.

**Sources:**
- [React Flow Common Errors](https://reactflow.dev/learn/troubleshooting/common-errors)
- [Custom Nodes Documentation](https://reactflow.dev/learn/customization/custom-nodes)

---

### Pitfall 3: Inadequate Connection Validation

**What goes wrong:**
Developers implement basic connection validation (e.g., "source must be trigger") but miss complex scenarios: circular dependencies, type mismatches, cardinality violations, and orphaned branches. Invalid workflows pass validation and cause runtime errors during execution.

**Why it happens:**
React Flow's `isValidConnection` callback is straightforward for simple rules but requires sophisticated graph algorithms for comprehensive validation. Circular dependency detection requires depth-first search across the entire graph. Teams often implement validation incrementally, missing edge cases.

**Consequences:**
- Circular workflows cause infinite loops during execution
- Type mismatches between nodes (e.g., number output → text-only input) fail at runtime
- Cardinality violations (e.g., condition node with 3 outgoing edges when only 2 allowed)
- Orphaned branches (nodes with no path to terminal nodes) execute unexpectedly
- Data flow inconsistencies not caught until execution
- User frustration when "valid-looking" workflows fail

**Prevention:**
1. **Implement comprehensive validation layers:**
   ```typescript
   const isValidConnection = useCallback((connection: Connection) => {
     // Layer 1: Basic type checking
     if (!isCompatibleHandleTypes(connection)) return false;

     // Layer 2: Cycle detection
     if (wouldCreateCycle(connection)) return false;

     // Layer 3: Cardinality constraints
     if (exceedsMaxConnections(connection)) return false;

     // Layer 4: Data type compatibility
     if (!areDataTypesCompatible(connection)) return false;

     return true;
   }, [nodes, edges]);
   ```

2. **Use React Flow utilities correctly:**
   ```typescript
   import { getOutgoers } from '@xyflow/react';

   // ✅ CORRECT - Uses getNodes()/getEdges() inside callback
   const wouldCreateCycle = (connection: Connection) => {
     const nodes = getNodes();
     const edges = getEdges();
     const target = nodes.find(n => n.id === connection.target);

     // Recursively check if source exists in target's descendants
     return hasPath(target, connection.source, nodes, edges);
   };

   // ❌ WRONG - Uses stale closure over nodes/edges
   const wouldCreateCycle = (connection: Connection) => {
     const target = nodes.find(n => n.id === connection.target);
     return hasPath(target, connection.source, nodes, edges);
   };
   ```

3. **Validate beyond connections:**
   - Unreachable nodes (no path from trigger)
   - Dead-end branches (no path to terminal nodes)
   - Required configuration missing (empty conditions, unconfigured actions)

4. **Provide clear visual feedback:**
   - Invalid connection attempts show error tooltip
   - Invalid nodes highlighted in red with warning icon
   - Validation panel shows all issues before workflow activation

**Detection:**
- Circular workflows are created without error
- Workflows with type mismatches pass canvas validation
- Runtime execution errors for "valid" workflows
- Users report confusion about why connections are rejected
- No visual indication of validation state

**Phase impact:**
- Foundation (Phase 1): Basic type + cycle detection
- Node Configuration (Phase 2): Data type compatibility validation
- Pre-activation validation (Phase 3): Comprehensive graph validation

**Sources:**
- [React Flow Cycle Prevention](https://reactflow.dev/examples/interaction/prevent-cycles)
- [Connection Validation](https://reactflow.dev/examples/interaction/validation)
- [Circular Dependency Detection Challenges](https://medium.com/@McQuinTrix/how-to-tackle-circular-dependencies-in-your-nx-project-0c71b09e796a)

---

### Pitfall 4: Performance Degradation at Scale

**What goes wrong:**
Canvas performs well with 10-20 nodes during development but becomes unusable with 100+ nodes in production. Every pan, zoom, or drag operation causes noticeable lag. Users complain about unresponsive UI.

**Why it happens:**
React Flow documentation explicitly warns: "One of the most common performance pitfalls in React Flow is directly accessing the nodes or edges in the components." Default rendering approaches don't scale. Teams optimize after performance problems emerge rather than architecting for scale upfront.

**Consequences:**
- Canvas becomes unresponsive with 50+ nodes
- Every interaction (drag, pan, zoom) causes multi-second freezes
- Browser tab crashes with complex workflows (200+ nodes)
- Node selection causes visible lag
- Users avoid creating complex workflows due to poor UX

**Prevention:**
1. **Memoize everything:**
   ```typescript
   // ✅ Memoize custom nodes
   export const TriggerNode = memo(({ data, id }: NodeProps) => {
     return <div>...</div>;
   });

   // ✅ Memoize edge options
   const defaultEdgeOptions = useMemo(
     () => ({ type: 'smoothstep', animated: true }),
     []
   );

   // ✅ Memoize event handlers
   const onNodesChange = useCallback(
     (changes) => store.applyNodeChanges(changes),
     []
   );
   ```

2. **Never directly access nodes/edges in components:**
   ```typescript
   // ❌ WRONG - Re-renders on every node change
   const SelectedNodesPanel = () => {
     const nodes = useNodes();
     const selected = nodes.filter(n => n.selected);
     return <div>{selected.length} selected</div>;
   };

   // ✅ CORRECT - Store selection separately
   const SelectedNodesPanel = () => {
     const selectedCount = useStore(state => state.selectedNodes.length);
     return <div>{selectedCount} selected</div>;
   };
   ```

3. **Optimize rendering for large graphs:**
   - Use `hidden` property to hide off-screen branches rather than removing from DOM
   - Implement virtual scrolling for node lists/sidebars
   - Lazy-load node configuration panels
   - Disable animations during bulk operations

4. **Simplify visual complexity:**
   - Reduce CSS animations, shadows, gradients in nodes
   - Use solid colors instead of gradients for better performance
   - Minimize DOM elements per node
   - Consider canvas-based rendering for very large graphs (100+ nodes)

5. **Profile before launching:**
   - Test with realistic workflow sizes (100+ nodes)
   - Use React DevTools Profiler to identify re-render hotspots
   - Monitor memory usage during long editing sessions
   - Test on lower-end hardware

**Detection:**
- Noticeable lag when dragging nodes
- Frame rate drops below 30fps during interactions
- React DevTools shows excessive component updates
- Memory usage grows continuously during editing session
- CPU usage spikes to 100% during pan/zoom

**Phase impact:**
- Foundation (Phase 1): Architecture with memoization from start
- Node Types (Phase 2): Profile each node type for performance
- Before production (Phase 3): Load test with 100-200 node workflows

**Sources:**
- [React Flow Performance Guide](https://reactflow.dev/learn/advanced-use/performance)
- [Performance Pitfalls in Visual Development](https://blog.flutterflow.io/performance-pitfalls-in-visual-development-and-how-to-avoid-them/)

---

### Pitfall 5: Auto-Save Without Conflict Resolution

**What goes wrong:**
Auto-save continuously persists workflow changes, but when multiple users (or multiple browser tabs) edit the same workflow simultaneously, last-write-wins causes lost work. Users don't realize their changes were overwritten until significant work is lost.

**Why it happens:**
Auto-save implementations typically lack real-time collaboration or conflict detection. HighLevel's documentation explicitly warns: "There's no real-time co-editing/locking, and last save wins - if multiple users (or tabs) edit the same workflow, the most recent auto-save becomes the current draft."

**Consequences:**
- Silent data loss when multiple users edit simultaneously
- Lost work when user has workflow open in multiple tabs
- No warning before overwriting someone else's changes
- User confusion about why their changes disappeared
- Trust erosion in the platform
- Support burden from lost work complaints

**Prevention:**
1. **Implement optimistic locking:**
   ```typescript
   interface WorkflowVersion {
     id: string;
     version: number; // Incremented on every save
     updatedAt: string;
     updatedBy: string;
   }

   // On save, check if version matches
   const saveWorkflow = async (workflow: Workflow) => {
     const response = await api.put(`/workflows/${workflow.id}`, {
       ...workflow,
       expectedVersion: workflow.version, // Server validates this
     });

     if (response.status === 409) {
       // Conflict detected - show resolution UI
       showConflictDialog(response.data.currentVersion);
     }
   };
   ```

2. **Detect concurrent editing:**
   - Poll for version changes every 10-30 seconds
   - Show warning banner: "This workflow was modified by [user] 2 minutes ago"
   - Disable editing with option to reload or force overwrite
   - Store local changes separately in case of conflict

3. **Auto-save strategy:**
   - Debounce saves (5-10 seconds after last change)
   - Show saving indicator and last-saved timestamp
   - Keep local draft separate from published version
   - Provide manual "Save" button for explicit control

4. **Draft vs. published separation:**
   - Auto-saves go to draft version only
   - Explicit "Publish" action with conflict check
   - Show diff between draft and published
   - Allow discarding draft and reverting to published

5. **Multi-tab detection:**
   ```typescript
   // Detect if workflow is open in another tab
   useEffect(() => {
     const channel = new BroadcastChannel(`workflow-${workflowId}`);
     channel.postMessage({ type: 'OPEN', tabId });

     channel.onmessage = (event) => {
       if (event.data.type === 'OPEN' && event.data.tabId !== tabId) {
         showWarning('Workflow is open in another tab');
       }
     };
   }, [workflowId]);
   ```

**Detection:**
- User reports lost changes without clear cause
- Workflow state differs from user's expectations
- No indication of concurrent editing
- Auto-save happens silently without confirmation
- No version history or recovery mechanism

**Phase impact:** Foundation (Phase 1) - Must design draft management and version strategy before first save implementation.

**Sources:**
- [HighLevel Workflow Auto-Save](https://help.gohighlevel.com/support/solutions/articles/155000006654-workflows-auto-save)
- [n8n Lost Workflow Report](https://community.n8n.io/t/lost-a-whole-workflow-does-it-not-auto-save/220677)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or significant rework.

---

### Pitfall 6: Inadequate Undo/Redo Implementation

**What goes wrong:**
Undo/redo is added late as an afterthought. Implementation only works for simple operations (add/delete node) but fails for complex scenarios (multi-node moves, configuration changes, bulk operations). History is lost on page refresh. Multi-user edits break history.

**Why it happens:**
Undo/redo seems simple ("just store state snapshots") but becomes complex with large workflows. Memory overhead grows quickly. Session-based history is easier than persistent history. Complex composite operations (drag multiple nodes + auto-reroute edges) are hard to capture as single undo units.

**Consequences:**
- Users can't recover from mistakes
- Undo only works for some operations (inconsistent UX)
- Memory leaks from unbounded history
- History lost on refresh (frustrating for long editing sessions)
- Can't undo configuration changes made in modals/drawers
- Performance degrades with large history

**Prevention:**
1. **Design history architecture upfront:**
   ```typescript
   interface HistoryState {
     past: WorkflowSnapshot[];
     present: WorkflowSnapshot;
     future: WorkflowSnapshot[];
   }

   interface WorkflowSnapshot {
     nodes: Node[];
     edges: Edge[];
     metadata: {
       timestamp: number;
       operation: string; // "add-node", "move-nodes", etc.
       description: string; // User-facing description
     };
   }
   ```

2. **Implement proper state snapshotting:**
   - Capture complete workflow state (nodes + edges + configuration)
   - Group related operations into single undo unit (multi-select drag = 1 undo)
   - Use structural sharing to minimize memory (only store diffs)
   - Implement maxHistory limit (50-100 operations)

3. **Handle special cases:**
   - Configuration changes in modals must be part of history
   - Bulk operations (delete 10 nodes) = single undo unit
   - Auto-layout operations undoable as one action
   - Save/publish operations create history checkpoint (can't undo across saves)

4. **Persist history strategically:**
   - Session history in memory for performance
   - Checkpoint history to localStorage on interval
   - Restore history on page load (if same session)
   - Clear history older than 30 days

5. **Prevent common issues:**
   - Limit history size to prevent memory leaks
   - Clear future history on new action after undo
   - Don't add duplicate consecutive states to history
   - Debounce rapid changes (typing in config) to avoid history spam

**Detection:**
- Users ask "how do I undo that?"
- Undo/redo buttons disabled or non-functional
- Memory usage grows continuously during long sessions
- History lost unexpectedly
- Some operations can't be undone (inconsistent behavior)

**Phase impact:** Foundation (Phase 1) - Design history architecture with initial state management. Implement incrementally but architecture must support it.

**Sources:**
- [HighLevel Undo/Redo Features](https://help.gohighlevel.com/support/solutions/articles/155000006655-workflows-undo-redo-change-history)
- [Memento Pattern for Undo/Redo](https://maxim-gorin.medium.com/memento-pattern-lets-you-undo-your-mistakes-without-leaking-internals-661d8e0b807c)

---

### Pitfall 7: Poor Node Configuration UX

**What goes wrong:**
Node configuration UI is poorly designed: modal dialogs cover the canvas (lose context), panels are cramped (poor form UX), configuration changes require closing/reopening panels (tedious workflow), no validation until save (frustrating errors), no indication of unconfigured nodes on canvas.

**Why it happens:**
Configuration UI is designed independently from canvas UX. Modal-first approach is simpler to implement than coordinated drawer/canvas interaction. Teams don't test full workflow configuration scenarios end-to-end during development.

**Consequences:**
- Users lose context when configuring nodes (can't see workflow structure)
- Tedious back-and-forth between canvas and configuration UI
- Errors discovered late (after closing configuration panel)
- Difficult to see which nodes need configuration
- Poor mobile/tablet experience
- Increased time to configure workflows

**Prevention:**
1. **Use drawers instead of modals:**
   - Right-side drawer keeps canvas visible (compressed but accessible)
   - User maintains workflow context during configuration
   - Can reference other nodes while configuring current node
   - Drawer can overlay or inline depending on viewport size

2. **Provide clear configuration state on canvas:**
   ```typescript
   // Visual indicators on nodes
   interface NodeConfigState {
     isConfigured: boolean;  // Has required fields
     hasWarnings: boolean;   // Has optional improvements
     hasErrors: boolean;     // Invalid configuration
   }

   // Node badge indicators:
   // ⚠️ Yellow badge = needs configuration
   // ❌ Red badge = configuration error
   // ✓ Green badge = fully configured
   ```

3. **Design drawer content for efficiency:**
   - Collapsible sections for advanced options
   - Most important settings at top (don't require scrolling)
   - Inline validation (show errors immediately)
   - Auto-save configuration changes (no manual "Apply" needed)
   - "Apply & Next" button to quickly configure multiple nodes

4. **Add nodrag class to form inputs:**
   ```typescript
   // ✅ Prevents accidental node dragging when interacting with forms
   <Input className="nodrag" />
   <Select className="nodrag">...</Select>
   <Textarea className="nodrag" />
   ```

5. **Context-aware configuration:**
   - Show available entity types/attributes based on workflow context
   - Auto-suggest compatible values from upstream nodes
   - Preview output data structure
   - Link to entity type definitions

**Detection:**
- Users complain configuration is tedious
- High time-to-configure-workflow metric
- Support requests about "how do I configure X"
- Users struggle to find where to configure nodes
- Frequent errors during workflow activation due to missing config

**Phase impact:**
- Foundation (Phase 1): Choose drawer vs modal architecture
- Node Configuration (Phase 2): Implement configuration UI for each node type
- Polish (Phase 3): Add inline validation, state indicators, keyboard shortcuts

**Sources:**
- [n8n Node UI Design](https://docs.n8n.io/integrations/creating-nodes/plan/node-ui-design/)
- [Drawer UX Best Practices](https://mobbin.com/glossary/drawer)

---

### Pitfall 8: Execution Flow vs. Data Flow Confusion

**What goes wrong:**
Workflow canvas doesn't distinguish between execution flow (which node runs next) and data flow (where data comes from). Single edge type represents both concepts, causing confusion when they diverge (e.g., parallel actions that share data from earlier node).

**Why it happens:**
Many workflow builders simplify by merging execution and data flow into single concept. This works for simple linear workflows but breaks down with parallel execution, data aggregation, or loops. Teams don't realize the distinction until users build complex workflows.

**Consequences:**
- Ambiguous workflow semantics (what does an edge mean?)
- Parallel execution is difficult or impossible to represent
- Data dependencies unclear (where does this node's input come from?)
- Users build workflows with unintended execution order
- Complex workflows become visual spaghetti
- Difficult to explain workflow behavior to non-technical users

**Prevention:**
1. **Decide on semantic model upfront:**
   - **Option A: Execution flow only** - Edges mean "run next", data always from immediate parent
   - **Option B: Data flow only** - Edges mean "data dependency", execution inferred from data deps
   - **Option C: Dual-edge system** - Explicit execution edges (solid) + data reference edges (dashed)

2. **For execution-first model:**
   - Edges represent execution order
   - Nodes access data from specific upstream nodes via explicit references
   - Configuration shows available data sources (any upstream node)
   - Parallel execution requires explicit split/join nodes

3. **For data-first model (recommended for complex scenarios):**
   - Edges represent data dependencies
   - Execution order inferred from dependency graph
   - Automatically detect parallel execution opportunities
   - Clear visual distinction when execution differs from visual layout

4. **Visual clarity:**
   ```typescript
   // Execution edges: solid line, directional arrow
   // Data reference edges: dashed line, different color
   // Conditional edges: labeled with condition
   const edgeTypes = {
     execution: ExecutionEdge,      // Solid, shows execution order
     dataRef: DataReferenceEdge,    // Dashed, shows data dependency
     conditional: ConditionalEdge,  // Labeled with condition
   };
   ```

5. **Provide execution preview:**
   - "Simulate" mode shows execution order with animated highlighting
   - Step-through debugger to verify execution flow
   - Execution log shows actual order during test runs

**Detection:**
- Users confused about workflow execution order
- Questions like "why did this node run before that node?"
- Difficulty representing parallel execution
- Workflows with unintended race conditions
- Can't explain how data flows through workflow

**Phase impact:**
- Foundation (Phase 1): Define semantic model (execution vs data flow)
- Node Types (Phase 2): Implement according to chosen model
- Testing (Phase 3): Add execution preview/simulation

**Sources:**
- [Workflow vs Process Builder Differences](https://www.cflowapps.com/workflow-vs-process-builder-ultimate-comparison-guide/)
- [Microsoft Agent Framework Workflow Edges](https://learn.microsoft.com/en-us/agent-framework/user-guide/workflows/core-concepts/edges)

---

### Pitfall 9: Missing Context Error Handling

**What goes wrong:**
Components try to access React Flow context outside `<ReactFlow>` or `<ReactFlowProvider>` boundaries, causing cryptic "Zustand Provider Context Error". Often happens with complex component hierarchies or when refactoring.

**Why it happens:**
React Flow hooks like `useReactFlow()`, `useNodes()`, `useEdges()` require context. Easy to accidentally use these hooks in components rendered outside the provider. Multiple versions of `@reactflow/core` in node_modules can also cause context issues.

**Consequences:**
- Application crashes with unclear error message
- Difficult to debug (error doesn't point to root cause)
- Wasted development time tracking down context boundary issues
- Breaks when refactoring component hierarchy
- Issues may only appear in production bundle, not development

**Prevention:**
1. **Explicit provider wrapping:**
   ```typescript
   // ✅ Wrap the entire workflow feature
   export const WorkflowEditorPage = () => {
     return (
       <ReactFlowProvider>
         <WorkflowCanvas />
         <WorkflowSidebar />
         <NodeConfigurationDrawer />
       </ReactFlowProvider>
     );
   };
   ```

2. **Check for context before using hooks:**
   ```typescript
   // For components that might be used outside React Flow
   import { useReactFlow } from '@xyflow/react';

   const MyComponent = () => {
     try {
       const { getNodes } = useReactFlow();
       // Use React Flow features
     } catch (error) {
       // Fallback for when used outside React Flow
       console.warn('Component used outside React Flow context');
       return <div>Not available</div>;
     }
   };
   ```

3. **Prevent version conflicts:**
   ```bash
   # Check for multiple versions
   npm ls @xyflow/react

   # If multiple versions found, consolidate:
   npm dedupe

   # Or add resolution in package.json
   "resolutions": {
     "@xyflow/react": "12.10.0"
   }
   ```

4. **Organize component hierarchy clearly:**
   - Keep all workflow-related components inside provider
   - Document which components require React Flow context
   - Use TypeScript to enforce context requirements
   - Create wrapper components for external integrations

**Detection:**
- Runtime error: "It seems like you've created a new nodeTypes..."
- Console error mentioning Zustand provider
- Components fail to access `useReactFlow()` hooks
- Errors appear only in certain routes or component combinations
- `npm ls @xyflow/react` shows multiple versions

**Phase impact:** Foundation (Phase 1) - Establish provider boundaries and version control from start.

**Sources:**
- [React Flow Common Errors](https://reactflow.dev/learn/troubleshooting/common-errors)

---

## Minor Pitfalls

Mistakes that cause annoyance but are relatively easy to fix.

---

### Pitfall 10: Missing Container Dimensions

**What goes wrong:**
React Flow canvas doesn't render or appears as a tiny box because parent container lacks explicit width/height styling.

**Why it happens:**
React Flow requires defined dimensions on its container. CSS defaults (height: auto) don't provide the necessary constraints.

**Consequences:**
- Canvas invisible or too small
- Layout issues in responsive designs
- Wasted debugging time

**Prevention:**
```typescript
// ✅ Explicit dimensions
<div style={{ width: '100%', height: '800px' }}>
  <ReactFlow />
</div>

// ✅ Or use CSS class
<div className="workflow-canvas-container">
  <ReactFlow />
</div>

// CSS:
.workflow-canvas-container {
  width: 100%;
  height: calc(100vh - 200px); /* Viewport height minus header/footer */
}
```

**Detection:** Canvas doesn't appear or is very small.

**Phase impact:** Foundation (Phase 1) - Trivial to fix during initial implementation.

**Sources:**
- [React Flow Common Errors](https://reactflow.dev/learn/troubleshooting/common-errors)

---

### Pitfall 11: Handle Position Not Updated

**What goes wrong:**
Edges connect to wrong positions after dynamically adding/removing handles or changing handle positions programmatically.

**Why it happens:**
React Flow caches handle positions. Must call `updateNodeInternals(nodeId)` after modifying handles.

**Consequences:**
- Edges connect to incorrect points on nodes
- Visual misalignment looks unprofessional
- Confusing for users

**Prevention:**
```typescript
import { useReactFlow } from '@xyflow/react';

const MyNode = ({ id, data }) => {
  const { updateNodeInternals } = useReactFlow();

  const addHandle = () => {
    // Modify handles
    setHandles([...handles, newHandle]);

    // ✅ Update internals after handle change
    updateNodeInternals(id);
  };

  return (
    <div>
      {handles.map(h => <Handle key={h.id} {...h} />)}
    </div>
  );
};
```

**Detection:** Edges connect to wrong positions after dynamic handle changes.

**Phase impact:** Node Types (Phase 2) - Relevant when implementing nodes with dynamic handles.

**Sources:**
- [React Flow Common Errors](https://reactflow.dev/learn/troubleshooting/common-errors)

---

### Pitfall 12: Accessibility Oversight

**What goes wrong:**
Workflow builder is keyboard-inaccessible and screen reader unfriendly. Users with disabilities can't navigate canvas, configure nodes, or understand workflow structure.

**Why it happens:**
Visual workflow builders are inherently challenging for accessibility. Teams focus on mouse/touch interaction. Accessibility is often an afterthought. WCAG compliance requires significant design effort upfront.

**Consequences:**
- Legal compliance issues (European Accessibility Act effective June 2025)
- Excludes users with disabilities
- Poor user experience for keyboard-only users
- Negative brand perception
- Potential lawsuits or regulatory penalties

**Prevention:**
1. **Keyboard navigation from day one:**
   - Tab through nodes in logical order
   - Arrow keys to navigate between nodes
   - Enter to open configuration
   - Delete to remove selected items
   - Escape to cancel operations
   - Space to select/deselect
   - Keyboard shortcuts: WSAD for panning, +/- for zoom

2. **Screen reader support:**
   - ARIA labels on all interactive elements
   - Announce node types and configuration state
   - Describe relationships between nodes
   - Provide text alternatives for visual connections
   - Test with NVDA, JAWS, VoiceOver

3. **Visual accessibility:**
   - High contrast mode support
   - Color isn't the only indicator (use icons + text)
   - Sufficient color contrast (WCAG AA minimum)
   - Scalable UI (supports 200% zoom without breaking)
   - Focus indicators clearly visible

4. **Alternative representations:**
   - Provide list view of workflow as alternative to canvas
   - Text-based workflow description for screen readers
   - Export workflow as accessible document format

**Detection:**
- Can't tab through canvas elements
- Screen readers don't announce workflow structure
- Keyboard shortcuts don't work
- Failed WCAG compliance audit
- User complaints about accessibility

**Phase impact:**
- Foundation (Phase 1): Design with keyboard navigation architecture
- Node Types (Phase 2): Add ARIA labels and keyboard handlers to each node
- Polish (Phase 3): Comprehensive accessibility testing and remediation

**Sources:**
- [Accessibility-First Workflow Builder](https://www.synergycodes.com/portfolio/accessibility-in-workflow-builder)
- [WCAG 2.1 Workflow Compliance](https://www.synergycodes.com/blog/accessibility-first-workflow-for-inclusive-data-visualization)

---

### Pitfall 13: Insufficient Testing Strategy

**What goes wrong:**
Workflow canvas has no automated tests. Changes break existing functionality. Visual regressions go unnoticed. Integration with entity services untested. Refactoring becomes risky.

**Why it happens:**
Testing node-based UIs is challenging. Unit tests don't cover visual layout. Integration tests require complex setup. Teams skip testing to ship faster.

**Consequences:**
- Regressions introduced frequently
- Fear of refactoring (might break something)
- Manual testing burden grows
- Visual bugs slip into production
- Integration issues discovered in production

**Prevention:**
1. **Layer testing approach:**
   ```typescript
   // Layer 1: Unit tests for logic
   describe('WorkflowValidation', () => {
     it('detects circular dependencies', () => {
       const workflow = createMockWorkflow();
       expect(hasCircularDependency(workflow)).toBe(true);
     });
   });

   // Layer 2: Component tests
   describe('TriggerNode', () => {
     it('renders configuration form', () => {
       render(<TriggerNode data={mockData} />);
       expect(screen.getByRole('button', { name: 'Configure' })).toBeInTheDocument();
     });
   });

   // Layer 3: Integration tests
   describe('WorkflowCanvas', () => {
     it('creates connection between nodes', async () => {
       const { user } = renderWorkflowCanvas();
       await user.dragFromTo(sourceHandle, targetHandle);
       expect(getEdges()).toHaveLength(1);
     });
   });
   ```

2. **Visual regression testing:**
   - Snapshot tests for node components
   - Percy or similar for canvas screenshots
   - Automated visual comparison in CI/CD
   - Test at multiple viewport sizes

3. **Test entity integration:**
   - Mock entity service responses
   - Test entity data loading in nodes
   - Verify entity type selection
   - Test attribute mapping configuration

4. **Performance testing:**
   - Benchmark with various workflow sizes (10, 50, 100, 200 nodes)
   - Monitor frame rate during interactions
   - Memory leak detection
   - Load time measurements

5. **E2E testing critical paths:**
   - Create workflow from scratch
   - Add and configure each node type
   - Connect nodes and validate
   - Save and reload workflow
   - Activate workflow

**Detection:**
- Frequent regressions in workflow features
- Refactoring is risky and time-consuming
- Visual bugs discovered by users
- Integration issues in production
- No confidence in changes

**Phase impact:**
- Foundation (Phase 1): Set up testing infrastructure and patterns
- Node Types (Phase 2): Add tests for each node type
- Continuous (all phases): Maintain test coverage

**Sources:**
- [Visual Regression Testing Best Practices](https://www.virtuosoqa.com/post/visual-regression-testing-101)
- [Canva UI Testing](https://www.browserstack.com/case-study/canva-utilizes-automated-visual-testing-for-confidence-in-every-product-update)

---

### Pitfall 14: Hidden Handle Visibility Issues

**What goes wrong:**
Using `display: none` to hide handles breaks edge connections. Edges either don't render or connect to wrong positions.

**Why it happens:**
React Flow calculates handle positions from DOM elements. `display: none` removes elements from layout, breaking position calculations.

**Consequences:**
- Broken edge connections
- Visual glitches
- Unpredictable behavior

**Prevention:**
```typescript
// ❌ WRONG
<Handle style={{ display: 'none' }} />

// ✅ CORRECT - Keeps element in layout
<Handle style={{ opacity: 0, pointerEvents: 'none' }} />

// ✅ Or use visibility
<Handle style={{ visibility: 'hidden' }} />
```

**Detection:** Edges fail to connect when handles are conditionally hidden.

**Phase impact:** Node Types (Phase 2) - Relevant when implementing nodes with conditional handles.

**Sources:**
- [React Flow Common Errors](https://reactflow.dev/learn/troubleshooting/common-errors)

---

## Phase-Specific Warnings

Pitfalls mapped to implementation phases.

| Phase | Primary Pitfalls | Mitigation Strategy |
|-------|-----------------|---------------------|
| **Foundation (Phase 1)** | #1 State Management, #2 nodeTypes recreation, #5 Auto-save conflicts, #9 Context errors | Architect state management with Zustand, define nodeTypes outside components, design draft/versioning strategy, establish provider boundaries |
| **Node Types (Phase 2)** | #3 Connection validation, #7 Configuration UX, #8 Execution vs data flow, #11 Handle updates | Implement comprehensive validation, use drawer UI pattern, choose semantic model, handle dynamic handles correctly |
| **Performance (Phase 3)** | #4 Performance at scale, #6 Undo/redo, #13 Testing | Memoize all components, implement proper history management, add performance benchmarks |
| **Polish (Phase 4)** | #12 Accessibility, #13 Testing, #7 Configuration UX refinement | Add keyboard navigation, screen reader support, visual regression tests, polish configuration flows |

---

## Quick Reference Checklist

Before launching workflow builder:

- [ ] State management uses Zustand, not just React Flow's internal state
- [ ] nodeTypes/edgeTypes defined outside components or memoized
- [ ] Comprehensive connection validation (types, cycles, cardinality)
- [ ] Performance tested with 100+ node workflows
- [ ] Auto-save includes conflict detection and resolution
- [ ] Undo/redo works for all operations
- [ ] Configuration uses drawer (not modal) pattern
- [ ] Execution flow semantics clearly defined and documented
- [ ] React Flow context boundaries properly established
- [ ] Container dimensions explicitly set
- [ ] Dynamic handle changes call `updateNodeInternals()`
- [ ] Keyboard navigation implemented
- [ ] Screen reader support added
- [ ] Automated test coverage for critical paths
- [ ] Visual regression testing in CI/CD

---

## Sources

### Official Documentation
- [React Flow - Common Errors](https://reactflow.dev/learn/troubleshooting/common-errors)
- [React Flow - Performance Guide](https://reactflow.dev/learn/advanced-use/performance)
- [React Flow - State Management](https://reactflow.dev/learn/advanced-use/state-management)
- [React Flow - Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes)
- [React Flow - Connection Validation](https://reactflow.dev/examples/interaction/validation)
- [React Flow - Cycle Prevention](https://reactflow.dev/examples/interaction/prevent-cycles)

### Best Practices
- [n8n Node UI Design Guidelines](https://docs.n8n.io/integrations/creating-nodes/plan/node-ui-design/)
- [Drawer UX Best Practices - Mobbin](https://mobbin.com/glossary/drawer)
- [Accessibility-First Workflow Builder - Synergy Codes](https://www.synergycodes.com/portfolio/accessibility-in-workflow-builder)

### Community Experience
- [HighLevel Workflow Auto-Save Documentation](https://help.gohighlevel.com/support/solutions/articles/155000006654-workflows-auto-save)
- [HighLevel Undo/Redo Features](https://help.gohighlevel.com/support/solutions/articles/155000006655-workflows-undo-redo-change-history)
- [n8n Lost Workflow Report](https://community.n8n.io/t/lost-a-whole-workflow-does-it-not-auto-save/220677)
- [Performance Pitfalls in Visual Development - FlutterFlow](https://blog.flutterflow.io/performance-pitfalls-in-visual-development-and-how-to-avoid-them/)

### Technical Deep Dives
- [Memento Pattern for Undo/Redo](https://maxim-gorin.medium.com/memento-pattern-lets-you-undo-your-mistakes-without-leaking-internals-661d8e0b807c)
- [Circular Dependencies in NX Projects](https://medium.com/@McQuinTrix/how-to-tackle-circular-dependencies-in-your-nx-project-0c71b09e796a)
- [Visual Regression Testing Best Practices](https://www.virtuosoqa.com/post/visual-regression-testing-101)
- [Canva Visual Testing Case Study](https://www.browserstack.com/case-study/canva-utilizes-automated-visual-testing-for-confidence-in-every-product-update)

### Workflow Architecture
- [Workflow vs Process Builder - Cflow](https://www.cflowapps.com/workflow-vs-process-builder-ultimate-comparison-guide/)
- [Microsoft Agent Framework - Workflow Edges](https://learn.microsoft.com/en-us/agent-framework/user-guide/workflows/core-concepts/edges)
