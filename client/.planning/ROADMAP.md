# Roadmap: Workflow Builder Foundation

## Overview

This roadmap delivers a visual workflow builder integrated into Riven's workspace platform. Starting with XYFlow canvas foundation and state management, it progresses through node library, node types with entity integration, connection handling, selection mechanics, and undo/redo. The result is a polished workflow building experience where users can compose automated workflows that treat their custom entity models as first-class citizens.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Canvas** - XYFlow integration with Zustand state management and basic canvas interactions
- [x] **Phase 2: Node Library** - Sidebar with draggable node types organized by category
- [x] **Phase 2.1: Node Library Population** - Populate node library with workflow node types (INSERTED)
- [x] **Phase 3: Node Types & Configuration** - Trigger, action, and condition nodes with entity-aware configuration
- [ ] **Phase 4: Connections** - Edge creation with validation and cycle prevention
- [ ] **Phase 5: Selection & Visual Feedback** - Multi-select, deletion, and visual status indicators
- [ ] **Phase 6: Undo/Redo** - Temporal state management with keyboard shortcuts

## Phase Details

### Phase 1: Foundation & Canvas
**Goal**: Users can interact with a responsive workflow canvas with basic navigation
**Depends on**: Nothing (first phase)
**Requirements**: CANVAS-03, CANVAS-04, CANVAS-07, CANVAS-08, STATE-01, STATE-03, STATE-04, VISUAL-03
**Success Criteria** (what must be TRUE):
  1. User can view an empty workflow canvas with appropriate empty state messaging
  2. User can pan the canvas by dragging the background
  3. User can zoom the canvas with mouse wheel
  4. User can see nodes render on the canvas when added programmatically
  5. Workflow state (nodes, positions) is managed in Zustand store, not just React Flow internal state
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Workflow module structure, Zustand store, and context provider
- [x] 01-02-PLAN.md — Canvas component with React Flow, background, minimap, and controls
- [x] 01-03-PLAN.md — Custom node components with type-specific styling
- [x] 01-04-PLAN.md — Page routes and end-to-end integration

### Phase 2: Node Library
**Goal**: Users can discover and add nodes to the canvas through the sidebar
**Depends on**: Phase 1
**Requirements**: LIBRARY-01, LIBRARY-02, LIBRARY-03, LIBRARY-04, CANVAS-01, CANVAS-02
**Success Criteria** (what must be TRUE):
  1. User sees a sidebar displaying available node types organized by category (Triggers, Actions, Conditions)
  2. User can drag a node from the sidebar onto the canvas to create an instance
  3. User can click a node in the sidebar to add it to the center of the canvas
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Node library sidebar with search, categories, and draggable items
- [x] 02-02-PLAN.md — Canvas drop handlers and sidebar integration

### Phase 2.1: Node Library Population (INSERTED)
**Goal**: Populate the node library with 11 comprehensive workflow node types aligned with backend configuration classes
**Depends on**: Phase 2
**Requirements**: None (extends existing LIBRARY requirements)
**Success Criteria** (what must be TRUE):
  1. User sees 4 trigger node types in sidebar (Entity Event, Schedule, Webhook, Function Call)
  2. User sees 6 action node types in sidebar (Create Entity, Update Entity, Delete Entity, Query Entities, Link Entities, HTTP Request)
  3. User sees 1 condition node type in sidebar (Condition)
  4. All 11 nodes can be dragged to canvas and click-added to canvas center
  5. Each node displays appropriate Lucide icon, label, and description
**Plans**: 1 plan

Plans:
- [x] 02.1-01-PLAN.md — Expand node type definitions and component registry to 11 types

### Phase 3: Node Types & Configuration
**Goal**: Users can configure workflow nodes with entity-aware settings
**Depends on**: Phase 2
**Requirements**: NODES-01, NODES-02, NODES-03, NODES-04, NODES-05, NODES-06, CONFIG-01, CONFIG-02, CONFIG-03, CONFIG-04, CONFIG-05, CONFIG-06, CONFIG-07, CONFIG-08, INTEG-01, INTEG-02, INTEG-03, INTEG-04
**Success Criteria** (what must be TRUE):
  1. User can select a node to open configuration drawer showing node-specific form
  2. User can configure entity trigger with entity type selection (live data from API)
  3. User can configure trigger type (entity event, manual, webhook, schedule)
  4. User can select entity fields within node configuration
  5. User can configure condition node with condition logic
  6. Configuration changes reflect in node state immediately
  7. Workflow builder displays organization's custom entity types from EntityTypeService
**Plans**: 6 plans

Plans:
- [x] 03-01-PLAN.md — Store extension with selection state and node data update
- [x] 03-02-PLAN.md — Config schema service and TanStack Query hook
- [x] 03-03-PLAN.md — Widget registry with basic widgets (string, number, boolean, enum, duration)
- [x] 03-04-PLAN.md — Entity-aware widgets (entity type selector, entity fields multi-select)
- [x] 03-05-PLAN.md — Dynamic form renderer with Zod schema builder
- [x] 03-06-PLAN.md — Configuration drawer with ResizablePanelGroup layout

### Phase 4: Connections
**Goal**: Users can connect nodes to define workflow execution flow
**Depends on**: Phase 3
**Requirements**: CONNECT-01, CONNECT-02, CONNECT-03, CONNECT-04, CONNECT-05, CONNECT-06, CONNECT-07, CONNECT-08, VISUAL-02
**Success Criteria** (what must be TRUE):
  1. User can drag from a node output port to create a connection
  2. Connection preview follows cursor and shows valid/invalid state visually
  3. User can complete connection by dropping on valid input port
  4. Connections render as edges between nodes
  5. User can select and delete connections
  6. System prevents connections that would create cycles
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Selection & Visual Feedback
**Goal**: Users can efficiently select, multi-select, and delete workflow elements with clear visual feedback
**Depends on**: Phase 4
**Requirements**: CANVAS-05, CANVAS-06, VISUAL-01, VISUAL-04
**Success Criteria** (what must be TRUE):
  1. User can delete selected node(s) with Delete key
  2. User can multi-select nodes with Shift+click or drag marquee
  3. Selected nodes display clear visual highlight (border, shadow, or color)
  4. Nodes display visual indicator when configuration is incomplete or invalid
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Undo/Redo
**Goal**: Users can confidently experiment knowing changes are reversible
**Depends on**: Phase 5
**Requirements**: CANVAS-09, CANVAS-10, STATE-02
**Success Criteria** (what must be TRUE):
  1. User can undo last change with Ctrl+Z
  2. User can redo last undone change with Ctrl+Shift+Z
  3. Undo/redo tracks complete workflow state (nodes, edges, positions, configurations)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 2.1 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Canvas | 4/4 | ✓ Complete | 2026-01-25 |
| 2. Node Library | 2/2 | ✓ Complete | 2026-01-26 |
| 2.1. Node Library Population | 1/1 | ✓ Complete | 2026-01-28 |
| 3. Node Types & Configuration | 6/6 | ✓ Complete | 2026-02-01 |
| 4. Connections | 0/? | Not started | - |
| 5. Selection & Visual Feedback | 0/? | Not started | - |
| 6. Undo/Redo | 0/? | Not started | - |

---
*Roadmap created: 2026-01-20*
*Phase 1 planned: 2026-01-25*
*Phase 1 completed: 2026-01-25*
*Phase 2 planned: 2026-01-25*
*Phase 2 completed: 2026-01-26*
*Phase 2.1 planned: 2026-01-28*
*Phase 2.1 completed: 2026-01-28*
*Phase 3 planned: 2026-02-01*
*Phase 3 completed: 2026-02-01*
*Milestone: v0.1 (Workflow Builder Foundation Pre-release)*
