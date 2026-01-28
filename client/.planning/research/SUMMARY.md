# Project Research Summary

**Project:** Visual Workflow Builder with Entity Model Integration
**Domain:** Node-based workflow composition interface
**Researched:** 2026-01-19
**Confidence:** HIGH

## Executive Summary

Visual workflow builders in modern web applications follow a layered architecture separating canvas rendering (XYFlow), state management (Zustand), business logic (validation), and persistence. The research shows that the existing Riven stack already contains all core dependencies needed for workflow builder implementation - XYFlow 12.10.0, Zustand 5.0.8, React Hook Form + Zod, and TanStack Query. Only minimal additions are required: zundo for undo/redo and @dagrejs/dagre for auto-layout.

The recommended approach leverages Riven's established patterns: static service classes for API calls, TanStack Query for server state, Zustand for complex client state with temporal middleware for undo/redo, and workspace-scoped routing. The workflow builder should be implemented as a feature module following the same structure as existing entity and block systems. Critical differentiator: native entity type integration where workflows reference entity types as first-class concepts, not configuration strings.

Key risks center on state management anti-patterns (using only React Flow's internal state instead of external state management), inadequate connection validation (missing cycle detection and entity schema validation), performance degradation at scale (not memoizing components), and auto-save conflicts (no version control or conflict resolution). All are preventable with proper architecture from day one. The research identifies that foundation phase architecture decisions are critical - state management patterns and validation pipelines established in Phase 1 are difficult to refactor later.

## Key Findings

### Recommended Stack

The existing Riven stack provides the complete foundation for workflow builder implementation. XYFlow 12.10.0 is already installed for node-based UI, Zustand 5.0.8 for state management, React Hook Form + Zod for node configuration forms, TanStack Query for server state, and shadcn/ui for component primitives. This alignment means minimal new dependencies and maximum pattern reuse.

**Core additions (required):**
- **zundo 2.3.0+**: Temporal middleware for Zustand enabling undo/redo - official Zustand integration, <700 bytes, supports Zustand 5.x
- **@dagrejs/dagre 1.1.8**: Auto-layout algorithm for node positioning - React Flow's top recommendation, actively maintained fork

**Optional additions:**
- **immer 11.1.3**: Already used internally by Zustand, may need explicit import for complex nested state updates
- **dexie 4.2.1**: IndexedDB abstraction for offline-first workflows - only if offline editing explicitly required (TanStack Query + backend likely sufficient)
- **React Flow UI components**: Via shadcn CLI, provides BaseNode and Panel templates built on existing shadcn/ui - source code approach means no version lock-in

**Avoid:**
- elkjs (overly complex, React Flow docs warn against it)
- Redux (Zustand already in stack)
- use-undoable (compatibility issues with React Flow v10+)
- Original dagre package (unmaintained 6+ years)

### Expected Features

Research shows workflow builders have clear table stakes that users expect from day one, competitive differentiators that provide value, and anti-features that seem good but create problems.

**Must have (table stakes):**
- Drag-and-drop nodes from library to canvas - core interaction pattern since 2010s
- Visual connections with drag from output to input ports - users must see flow
- Node configuration panel (drawer pattern, not modal) - every node needs configurable properties
- Node type library with search/filter - organized by category
- Undo/redo for all canvas operations - users expect to revert mistakes
- Save/auto-save with draft state - workflows must persist
- Connection validation preventing invalid connections - type mismatches, cycles, cardinality
- Visual feedback for errors - color-coded status (green/yellow/red)
- Canvas navigation (pan, zoom, fit-to-view) - basic navigation
- Multi-select for group operations - efficiency feature

**Should have (competitive advantage):**
- Entity model first-class integration - entity types are native concepts, not strings (core differentiator)
- Real-time validation with entity schema - validate against live schema immediately
- Visual entity data flow - show entity data flowing with type annotations
- Workflow templates for entity patterns - pre-built patterns for common operations (add after foundation)

**Defer (v2+):**
- AI-generated workflow suggestions - growing trend but requires LLM integration
- Bi-directional relationship awareness - powerful but complex relationship graph traversal
- Real-time collaborative editing - complex conflict resolution, async collaboration sufficient initially
- Block-based action rendering - deep integration requiring execution runtime first
- Auto-layout (defer to v1.x, not required for foundation)
- Copy/paste nodes (defer to v1.x, enable pattern reuse)

### Architecture Approach

Workflow builders require layered architecture: presentation layer (XYFlow canvas), state management layer (Zustand store with nodes/edges/history), business logic layer (node type registry, connection validator, validation engine), and service layer (static class methods for API calls). This directly maps to Riven's established feature module pattern.

**Major components:**
1. **WorkflowCanvas** - XYFlow wrapper managing viewport and rendering nodes/edges
2. **NodeLibrary** - Searchable sidebar with drag-and-drop node types
3. **ConfigPanel** - Drawer-based configuration forms using React Hook Form + Zod
4. **WorkflowStore** - Zustand store with temporal middleware managing graph structure, undo/redo history, and UI state (selectedNodeId, isDirty)
5. **NodeTypeRegistry** - Static registry mapping node type IDs to components and metadata (extensibility without core modifications)
6. **ConnectionValidator** - Multi-stage validation pipeline (basic checks, type compatibility, cycle detection, entity schema validation)
7. **WorkflowService** - Static class with API methods following existing EntityTypeService pattern

**Key patterns:**
- **External state management from day one**: Never rely solely on React Flow's internal state - use Zustand for workflow definition, React Flow only for rendering
- **Node type registry**: Centralized mapping for extensibility - add node types by registering, not editing core files
- **Context provider pattern**: Workflow-scoped dependencies via React Context, avoid prop drilling
- **Connection validation pipeline**: Multi-stage validation composable and extensible
- **Snapshot-based undo/redo**: Store complete graph state (simpler than action-based, sufficient for workflows <50 nodes)

### Critical Pitfalls

Research identified 14 domain pitfalls with 5 categorized as critical (cause rewrites or severe issues).

1. **State Management Anti-Patterns** - Using only React Flow's internal state causes infinite re-render loops, performance degradation with 50+ nodes, difficulty implementing undo/redo, and testing impossibility. Prevention: Use Zustand from day one, separate workflow definition state from UI state, never pass functions through node data.

2. **nodeTypes/edgeTypes Re-creation** - Defining nodeTypes inside component render causes React Flow to rebuild canvas on every render, destroying performance. Prevention: Define nodeTypes outside component or use useMemo with empty dependencies.

3. **Inadequate Connection Validation** - Missing cycle detection, type mismatches, cardinality violations causes invalid workflows and runtime errors. Prevention: Implement comprehensive validation layers (basic type checking, cycle detection with DFS, cardinality constraints, data type compatibility, entity schema validation).

4. **Performance Degradation at Scale** - Canvas becomes unresponsive with 50+ nodes due to excessive re-renders and lack of memoization. Prevention: Memoize node components with React.memo, memoize event handlers with useCallback, never directly access nodes/edges in components (use selectors), optimize rendering for large graphs.

5. **Auto-Save Without Conflict Resolution** - Last-write-wins causes silent data loss when multiple users or tabs edit simultaneously. Prevention: Implement optimistic locking with version numbers, detect concurrent editing, debounce saves, separate draft from published version, detect multi-tab editing with BroadcastChannel.

## Implications for Roadmap

Based on research, workflow builder implementation should follow dependency-driven phases that align with architectural layers and avoid critical pitfalls. The research suggests 7 phases with clear validation criteria at each stage.

### Phase 1: Foundation & Canvas
**Rationale:** Must establish state management architecture and React Flow integration correctly from the start. State patterns defined here are difficult to refactor later (Pitfall #1). Foundation includes minimal Zustand store (just nodes/edges), WorkflowCanvas component with XYFlow, basic node type registry, and provider setup.

**Delivers:** Minimal workflow canvas where users can add nodes and see them render.

**Addresses:** Basic drag-and-drop nodes, visual connections (table stakes from FEATURES.md)

**Avoids:** Pitfall #1 (state management anti-patterns), Pitfall #2 (nodeTypes recreation), Pitfall #9 (context errors)

**Stack elements:** XYFlow 12.10.0, Zustand 5.0.8, WorkflowProvider context pattern

**Research flag:** Standard patterns (skip research-phase) - React Flow foundation is well-documented with extensive examples.

### Phase 2: Node Library & Configuration
**Rationale:** Users need to discover and configure node types. Configuration UX decisions made here affect all future node types. Drawer pattern (vs modal) must be established early (Pitfall #7). Builds on Phase 1 state management.

**Delivers:** Node library sidebar with drag-and-drop, node selection, configuration drawer, entity trigger configuration with entity type selector.

**Addresses:** Node type library, node configuration panel, entity type selection (table stakes + differentiator)

**Uses:** Existing useEntityTypes hook, React Hook Form + Zod patterns, shadcn Drawer component

**Implements:** NodeLibrary component, ConfigPanel component, first node config forms

**Avoids:** Pitfall #7 (poor configuration UX - use drawer not modal)

**Research flag:** Standard patterns (skip research-phase) - Drawer-based configuration follows established Riven patterns.

### Phase 3: Connections & Validation
**Rationale:** Connection validation complexity requires dedicated focus. Must implement multi-stage validation pipeline including cycle detection and entity schema validation (Pitfall #3). Depends on Phase 2 entity integration for schema validation.

**Delivers:** Visual connections with comprehensive validation. Users can connect compatible nodes, prevented from creating invalid connections (cycles, type mismatches).

**Addresses:** Connection management, connection validation (table stakes)

**Implements:** ConnectionValidator with multi-stage pipeline, visual feedback for validation errors, handle configuration

**Avoids:** Pitfall #3 (inadequate connection validation - implement cycle detection, type checking, entity schema validation)

**Research flag:** May need research-phase - Cycle detection algorithms and entity schema validation logic may need deeper dive if complex relationship patterns emerge.

### Phase 4: Persistence & Draft Management
**Rationale:** Persistence requires version control and conflict detection from the start (Pitfall #5). Must design draft vs published separation before first save. Depends on Phase 1-3 complete graph structure.

**Delivers:** Workflows save to backend and load from database with draft state and version tracking.

**Addresses:** Save/auto-save (table stakes)

**Implements:** WorkflowService (static class), save mutation hooks, serialization/deserialization, dirty tracking, draft management

**Avoids:** Pitfall #5 (auto-save without conflict resolution - implement optimistic locking, version numbers, concurrent editing detection)

**Stack elements:** TanStack Query mutations following existing patterns

**Research flag:** Standard patterns (skip research-phase) - Follows established Riven service layer and mutation patterns.

### Phase 5: Undo/Redo
**Rationale:** Undo/redo must be designed with proper history management from the start (Pitfall #6). Requires complete graph state serialization (from Phase 1-4). Temporal middleware integration.

**Delivers:** Users can undo/redo all workflow changes with keyboard shortcuts.

**Addresses:** Undo/redo (table stakes)

**Stack elements:** zundo 2.3.0+ (temporal middleware for Zustand)

**Implements:** History state in WorkflowStore (past/future arrays), snapshot creation before mutations, keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)

**Avoids:** Pitfall #6 (inadequate undo/redo - implement proper snapshotting, limit history size, handle composite operations)

**Research flag:** Standard patterns (skip research-phase) - Zundo integration is well-documented, snapshot pattern is straightforward.

### Phase 6: Node Type Expansion
**Rationale:** With foundation complete, can rapidly add node types using established registry pattern. Each node type follows same configuration and validation patterns from Phase 2-3.

**Delivers:** Workflow builder supports triggers, conditions, and actions enabling complete workflows.

**Implements:** Condition node (if/else logic), Action node (entity update with field mapping), expanded registry, validation per node type, specialized config forms

**Stack elements:** Node type registry pattern, existing entity integration hooks

**Research flag:** May need research-phase - Entity action field mapping and condition logic may need specific research if complex transformation patterns are required.

### Phase 7: Polish & Performance
**Rationale:** Performance optimization must happen before production (Pitfall #4). Load testing with realistic workflow sizes (100+ nodes) identifies bottlenecks. Polish features improve discoverability and efficiency.

**Delivers:** Production-ready workflow editor with professional UX and performance at scale.

**Addresses:** Node search/filter, canvas controls, multi-select, visual error indicators, auto-save (deferred features)

**Stack elements:** @dagrejs/dagre for auto-layout (if implemented)

**Implements:** Search in NodeLibrary, zoom controls, multi-select with marquee, color-coded node status, debounced auto-save, loading states, empty states

**Avoids:** Pitfall #4 (performance degradation - memoize components, profile with large workflows, optimize rendering), Pitfall #12 (accessibility - add keyboard navigation, screen reader support)

**Research flag:** Standard patterns (skip research-phase) - Performance optimization and polish follow established React patterns.

### Phase Ordering Rationale

- **Foundation must come first**: State management architecture cannot be refactored later without touching every component (Pitfall #1). React Flow provider boundaries and nodeTypes definition must be correct from start (Pitfall #2, #9).

- **Configuration before connections**: Node configuration establishes entity integration patterns that connection validation depends on. Schema validation requires entity types to be selectable in node configs.

- **Persistence requires complete graph**: Serialization needs all graph elements (nodes, edges, configuration) from Phases 1-3. Draft management and versioning must be designed before first save (Pitfall #5).

- **Undo/redo requires stable state**: History management needs complete, stable state shape from Phases 1-4. Adding undo/redo before persistence ensures history serialization is designed correctly.

- **Node type expansion after patterns established**: Registry pattern from Phase 1, configuration pattern from Phase 2, validation pattern from Phase 3 enable rapid node type addition with consistent behavior.

- **Polish and performance last**: Performance optimization requires complete feature set to identify bottlenecks. Load testing with realistic workflows needs all node types. Polish features (search, zoom controls, multi-select) are additive and don't affect core architecture.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (Connections & Validation)**: Cycle detection algorithms straightforward, but entity schema validation with complex relationship patterns may need specific research if bidirectional relationships and cardinality constraints create edge cases.
- **Phase 6 (Node Type Expansion)**: Entity action field mapping and condition logic - if workflows require complex data transformations or expression evaluation, may need research on expression parsing/evaluation libraries.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: React Flow integration is extensively documented with official guides, examples, and templates.
- **Phase 2 (Node Library & Configuration)**: Follows Riven's established drawer-based configuration pattern exactly (entity forms, block configuration).
- **Phase 4 (Persistence)**: Service layer pattern identical to EntityTypeService, TanStack Query mutations follow existing patterns precisely.
- **Phase 5 (Undo/Redo)**: Zundo temporal middleware integration is well-documented with clear examples, snapshot pattern is straightforward.
- **Phase 7 (Polish & Performance)**: React performance optimization follows standard patterns (memo, useCallback), XYFlow performance guide provides specific recommendations.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack contains all core dependencies (XYFlow, Zustand, React Hook Form, TanStack Query). Only additions are zundo and dagre, both with official recommendations. Version compatibility verified. |
| Features | HIGH | Comprehensive analysis of leading platforms (n8n, Zapier Canvas, HighLevel) with 2025 trends. Clear distinction between table stakes, differentiators, and anti-features from multiple sources. |
| Architecture | HIGH | Based on React Flow official documentation, production workflow builder examples, and established React patterns. Architectural decisions validated against Riven's existing patterns (feature modules, service layer, state management). |
| Pitfalls | HIGH | Critical pitfalls sourced from React Flow official troubleshooting docs, community reports (n8n, HighLevel), and production experience. Pitfall severity validated across multiple sources. |

**Overall confidence:** HIGH

Research is based on official documentation (React Flow, Zustand, Zod), production workflow builder implementations (n8n, Zapier, HighLevel), and established React/Next.js patterns. All recommended stack additions are explicitly mentioned in React Flow documentation. Architecture patterns align precisely with existing Riven codebase structure. Pitfalls are validated with multiple community reports and official troubleshooting guides.

### Gaps to Address

- **Entity schema validation complexity**: Research covers basic entity type validation, but complex scenarios with bidirectional relationships and cardinality constraints may reveal edge cases during Phase 3 implementation. Resolution: Design validation rules incrementally, add tests for relationship patterns as discovered.

- **Field mapping patterns**: Entity action nodes will require field-to-field mapping UI and validation. Research identifies this need but doesn't specify mapping patterns. Resolution: Review existing block system's entity reference patterns for inspiration, or defer complex mapping to Phase 6 research-phase if needed.

- **Performance at very large scale (200+ nodes)**: Research provides optimization patterns for 50-100 nodes, but 200+ node workflows may require additional techniques (virtualization, canvas-based rendering). Resolution: Load test during Phase 7, add optimizations if performance targets not met.

- **Offline editing requirements**: Research assumes online-first with TanStack Query + backend persistence. If offline editing is required, Dexie integration needs deeper investigation. Resolution: Clarify offline requirements during roadmap planning, add Dexie research-phase if confirmed necessary.

## Sources

### Primary (HIGH confidence)

**React Flow Official Documentation:**
- [Building a Flow](https://reactflow.dev/learn/concepts/building-a-flow) - Core concepts and state management
- [Layouting Guide](https://reactflow.dev/learn/layouting/layouting) - Layout library comparison
- [Common Errors](https://reactflow.dev/learn/troubleshooting/common-errors) - Critical pitfalls
- [Performance Guide](https://reactflow.dev/learn/advanced-use/performance) - Optimization patterns
- [State Management](https://reactflow.dev/learn/advanced-use/state-management) - External state integration
- [Connection Validation](https://reactflow.dev/examples/interaction/validation) - Validation API
- [Undo/Redo Example](https://reactflow.dev/examples/interaction/undo-redo) - Snapshot approach

**Stack Documentation:**
- [Zustand Third-party Libraries](https://zustand.docs.pmnd.rs/integrations/third-party-libraries) - Zundo middleware
- [Zundo Repository](https://github.com/charkour/zundo) - v2.3.0+ compatibility
- [Immer Documentation](https://immerjs.github.io/immer/) - Best practices

### Secondary (MEDIUM confidence)

**Workflow Platforms:**
- [n8n Review 2025](https://sider.ai/blog/ai-tools/n8n-review-2025-the-flexible-automation-platform-power-users-love)
- [Zapier Canvas Guide](https://zapier.com/blog/zapier-canvas-guide/)
- [Zapier Canvas Release](https://zapier.com/blog/zapier-canvas-open-beta-release/)
- [Zapier Collaboration](https://liveblocks.io/blog/how-zapier-added-collaborative-features-to-their-canvas-product-in-just-a-couple-of-weeks)

**Community Experience:**
- [HighLevel Auto-Save](https://help.gohighlevel.com/support/solutions/articles/155000006654-workflows-auto-save)
- [HighLevel Undo/Redo](https://help.gohighlevel.com/support/solutions/articles/155000006655-workflows-undo-redo-change-history)
- [n8n Lost Workflow](https://community.n8n.io/t/lost-a-whole-workflow-does-it-not-auto-save/220677)
- [Synergy Codes State Management](https://www.synergycodes.com/blog/state-management-in-react-flow)

**Best Practices:**
- [n8n Node UI Design](https://docs.n8n.io/integrations/creating-nodes/plan/node-ui-design/)
- [Modal vs Popover vs Drawer](https://uxpatterns.dev/pattern-guide/modal-vs-popover-guide)
- [Drag and Drop UI Tips](https://bricxlabs.com/blogs/drag-and-drop-ui)

### Tertiary (LOW confidence)

**Emerging Patterns:**
- [Node-based Workflow React Summit 2025](https://gitnation.com/contents/build-and-customize-a-node-based-workflow-builder-with-react)
- [AI Workflow Builder Template](https://vercel.com/templates/next.js/workflow-builder)
- [React Flow UI Updates](https://reactflow.dev/whats-new/2025-10-28)

---
*Research completed: 2026-01-19*
*Ready for roadmap: yes*
