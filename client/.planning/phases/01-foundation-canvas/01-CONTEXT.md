# Phase 1: Foundation & Canvas - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can interact with a responsive workflow canvas with basic navigation. This includes empty state messaging, panning, zooming, and nodes rendering correctly when added programmatically. Workflow state (nodes, positions) is managed in Zustand store. Node library sidebar, configuration, connections, and selection are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Node Rendering Basics
- Minimal card style — clean rectangles with subtle shadows, modern and lightweight
- Type indication uses BOTH color accent (colored left border or header bar per node type) AND icon badge
- Node body shows type label plus a brief description of what that node type does
- Connection ports (input/output circles) visible on nodes even though connections come in Phase 4

### Navigation Feel
- Dot grid background — subtle dots at regular intervals
- Minimap always visible — small overview in corner showing node positions and viewport
- Control panel with zoom +/-, fit view, and reset buttons
- Conservative zoom limits: 50%-150% — keeps content readable, prevents getting lost

### Claude's Discretion
- Exact colors for node type accents (triggers, actions, conditions)
- Dot grid spacing and opacity
- Control panel positioning and styling
- Empty state design (messaging, visual treatment)
- Pan/zoom sensitivity tuning

</decisions>

<specifics>
## Specific Ideas

No specific product references — open to standard XYFlow/React Flow patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-canvas*
*Context gathered: 2026-01-20*
