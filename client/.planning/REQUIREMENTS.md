# Requirements: Workflow Builder Foundation

**Defined:** 2026-01-19
**Core Value:** Enable business users to visually compose automated workflows that treat their custom entity models as first-class citizens

## v1 Requirements

Requirements for initial foundation. Each maps to roadmap phases.

### Canvas Interaction

- [ ] **CANVAS-01**: User can drag node from library onto canvas
- [ ] **CANVAS-02**: User can click node in library to add it to canvas
- [ ] **CANVAS-03**: User can select node on canvas by clicking it
- [ ] **CANVAS-04**: User can move selected node by dragging it
- [ ] **CANVAS-05**: User can delete selected node with Delete key
- [ ] **CANVAS-06**: User can multi-select nodes with Shift+click or drag marquee
- [ ] **CANVAS-07**: User can pan canvas by dragging background
- [ ] **CANVAS-08**: User can zoom canvas with mouse wheel or pinch gesture
- [ ] **CANVAS-09**: User can undo last change with Ctrl+Z
- [ ] **CANVAS-10**: User can redo last undone change with Ctrl+Shift+Z

### Node Library

- [ ] **LIBRARY-01**: User sees node library sidebar with available node types
- [ ] **LIBRARY-02**: User can drag node type from library onto canvas to create instance
- [ ] **LIBRARY-03**: User can click node type in library to add it to center of canvas
- [ ] **LIBRARY-04**: Node library organizes nodes by category (Triggers, Actions, Conditions)

### Node Configuration

- [ ] **CONFIG-01**: User can select node to open configuration drawer
- [ ] **CONFIG-02**: Configuration drawer displays node-specific configuration form
- [ ] **CONFIG-03**: User can configure trigger node with entity type selection
- [ ] **CONFIG-04**: User can configure trigger node with trigger type (entity event, manual, webhook, schedule)
- [ ] **CONFIG-05**: User can select specific entity fields in node configuration
- [ ] **CONFIG-06**: User can configure condition node with condition logic
- [ ] **CONFIG-07**: Configuration changes are reflected in node state immediately
- [ ] **CONFIG-08**: User can close configuration drawer to return to canvas

### Node Types

- [ ] **NODES-01**: Workflow builder supports Entity Trigger node type
- [ ] **NODES-02**: Workflow builder supports Manual Trigger node type
- [ ] **NODES-03**: Workflow builder supports Webhook Trigger node type
- [ ] **NODES-04**: Workflow builder supports Schedule Trigger node type
- [ ] **NODES-05**: Workflow builder supports Condition node type (if/then logic)
- [ ] **NODES-06**: Workflow builder supports Action node type (placeholder implementation)

### Connections

- [ ] **CONNECT-01**: User can drag from node output port to create connection
- [ ] **CONNECT-02**: Connection preview line follows mouse cursor while dragging
- [ ] **CONNECT-03**: User can drop connection on valid target node input port
- [ ] **CONNECT-04**: Connection renders as edge between connected nodes
- [ ] **CONNECT-05**: User can select connection by clicking it
- [ ] **CONNECT-06**: User can delete selected connection with Delete key
- [ ] **CONNECT-07**: System prevents connections that would create cycles in workflow graph
- [ ] **CONNECT-08**: System validates connection compatibility with loose rules (basic type checking)

### Visual Feedback

- [ ] **VISUAL-01**: Selected node displays visual highlight (border, shadow, or color change)
- [ ] **VISUAL-02**: Connection preview shows valid/invalid state while dragging (color or style)
- [ ] **VISUAL-03**: Canvas shows empty state when no nodes exist
- [ ] **VISUAL-04**: Node displays visual indicator when configuration is incomplete or invalid

### State Management

- [ ] **STATE-01**: Workflow state managed in external Zustand store (not just React Flow internal state)
- [ ] **STATE-02**: Undo/redo tracks complete workflow state snapshots
- [ ] **STATE-03**: Changes to workflow update store immediately (nodes, edges, positions, configurations)
- [ ] **STATE-04**: Workflow state includes all node positions, connections, and configurations

### Integration

- [ ] **INTEG-01**: Node configuration uses existing EntityTypeService to fetch entity types
- [ ] **INTEG-02**: Entity type selection displays organization's custom entity types
- [ ] **INTEG-03**: Entity field selection displays fields from selected entity type
- [ ] **INTEG-04**: Workflow builder is workspace-scoped (org-specific workflows)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Persistence

- **PERSIST-01**: User can save workflow to backend API
- **PERSIST-02**: User can load existing workflow from backend
- **PERSIST-03**: System shows dirty state indicator when workflow has unsaved changes
- **PERSIST-04**: System auto-saves workflow with debouncing after changes
- **PERSIST-05**: System implements optimistic locking to prevent concurrent edit conflicts

### Advanced Interaction

- **ADVANCED-01**: User can copy selected nodes
- **ADVANCED-02**: User can paste copied nodes to create duplicates
- **ADVANCED-03**: User can search/filter node library by name or keyword
- **ADVANCED-04**: System provides auto-layout to organize nodes automatically
- **ADVANCED-05**: User can fit entire workflow into view with single action

### Workflow Management

- **MANAGE-01**: User can create new workflow
- **MANAGE-02**: User can view list of all workflows
- **MANAGE-03**: User can rename workflow
- **MANAGE-04**: User can delete workflow
- **MANAGE-05**: User can duplicate workflow to create copy

### Advanced Node Features

- **NODEADV-01**: Action nodes support real action implementations (not placeholders)
- **NODEADV-02**: Condition nodes support complex logic expressions
- **NODEADV-03**: Nodes can reference previous node outputs in data flow
- **NODEADV-04**: Function nodes for custom transformations

### Validation & Errors

- **VALID-01**: System validates entity type compatibility between connected nodes
- **VALID-02**: System validates cardinality constraints on connections
- **VALID-03**: System shows detailed validation error messages on nodes
- **VALID-04**: System prevents saving invalid workflows

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Workflow execution engine | Backend responsibility, separate repository. Foundation is build-time UI only. |
| Real-time collaborative editing | Complex conflict resolution, async collaboration sufficient for v1. Requires websocket infrastructure. |
| Workflow versioning | Deferred until workflows are being actively used in production. Version control adds complexity. |
| Workflow testing/debugging tools | Requires execution engine first. Can't test workflows that don't run yet. |
| AI-generated workflow suggestions | Growing trend but requires LLM integration. Defer until usage patterns are established. |
| Workflow templates marketplace | Requires template sharing infrastructure. Build after core patterns emerge. |
| Mobile app support | Web-first, canvas interaction poorly suited for mobile. Focus on desktop experience. |
| Block-based action rendering | Deep integration with existing block system. Requires execution runtime to validate approach. |
| Advanced canvas features (minimap, overview) | Not essential for foundation. Users requested pan/zoom which provides navigation. |
| Offline-first editing | TanStack Query + backend persistence assumed online. Offline adds IndexedDB complexity. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CANVAS-01 | Phase 2 | Pending |
| CANVAS-02 | Phase 2 | Pending |
| CANVAS-03 | Phase 1 | Pending |
| CANVAS-04 | Phase 1 | Pending |
| CANVAS-05 | Phase 5 | Pending |
| CANVAS-06 | Phase 5 | Pending |
| CANVAS-07 | Phase 1 | Pending |
| CANVAS-08 | Phase 1 | Pending |
| CANVAS-09 | Phase 6 | Pending |
| CANVAS-10 | Phase 6 | Pending |
| LIBRARY-01 | Phase 2 | Pending |
| LIBRARY-02 | Phase 2 | Pending |
| LIBRARY-03 | Phase 2 | Pending |
| LIBRARY-04 | Phase 2 | Pending |
| CONFIG-01 | Phase 3 | Pending |
| CONFIG-02 | Phase 3 | Pending |
| CONFIG-03 | Phase 3 | Pending |
| CONFIG-04 | Phase 3 | Pending |
| CONFIG-05 | Phase 3 | Pending |
| CONFIG-06 | Phase 3 | Pending |
| CONFIG-07 | Phase 3 | Pending |
| CONFIG-08 | Phase 3 | Pending |
| NODES-01 | Phase 3 | Pending |
| NODES-02 | Phase 3 | Pending |
| NODES-03 | Phase 3 | Pending |
| NODES-04 | Phase 3 | Pending |
| NODES-05 | Phase 3 | Pending |
| NODES-06 | Phase 3 | Pending |
| CONNECT-01 | Phase 4 | Pending |
| CONNECT-02 | Phase 4 | Pending |
| CONNECT-03 | Phase 4 | Pending |
| CONNECT-04 | Phase 4 | Pending |
| CONNECT-05 | Phase 4 | Pending |
| CONNECT-06 | Phase 4 | Pending |
| CONNECT-07 | Phase 4 | Pending |
| CONNECT-08 | Phase 4 | Pending |
| VISUAL-01 | Phase 5 | Pending |
| VISUAL-02 | Phase 4 | Pending |
| VISUAL-03 | Phase 1 | Pending |
| VISUAL-04 | Phase 5 | Pending |
| STATE-01 | Phase 1 | Pending |
| STATE-02 | Phase 6 | Pending |
| STATE-03 | Phase 1 | Pending |
| STATE-04 | Phase 1 | Pending |
| INTEG-01 | Phase 3 | Pending |
| INTEG-02 | Phase 3 | Pending |
| INTEG-03 | Phase 3 | Pending |
| INTEG-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-20 after roadmap creation*
