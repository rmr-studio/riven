# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** Enable business users to visually compose automated workflows that treat their custom entity models as first-class citizens
**Current focus:** Phase 3 complete - Node Configuration

## Current Position

Phase: 3 of 6 (Node Types & Configuration)
Plan: 6/6 complete
Status: Phase complete
Last activity: 2026-02-01 - Completed 03-06-PLAN.md

Progress: [████████░░] 90%

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 4min
- Total execution time: 0.77 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-canvas | 4 | 21min | 5min |
| 02-node-library | 2 | 10min | 5min |
| 02.1-node-library-population | 1 | 1min | 1min |
| 03-node-types-configuration | 6 | 18min | 3min |

**Recent Trend:**
- Last 5 plans: 3min, 3min, 2min, 3min, 4min
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| Decision | Phase | Rationale |
|----------|-------|-----------|
| WorkflowNodeData uses base interface with Record intersection | 01-01 | React Flow compatibility while maintaining type safety |
| Store factory pattern for isolated instances | 01-01 | Following existing entity module conventions |
| Three initial node types (trigger, action, condition) | 01-01 | Minimal viable set for workflow foundations |
| CSS variables for dot color with opacity | 01-02 | Automatic dark mode theme compatibility |
| Minimap colors: amber/blue/purple for trigger/action/condition | 01-02 | Matches common workflow tool patterns |
| Inner component pattern for ReactFlowProvider | 01-02 | Proper hook scoping within provider boundary |
| Node type colors: amber=trigger, blue=action, purple=condition | 01-03 | Visual consistency with minimap colors |
| Thin wrapper pattern for node variants | 01-03 | Extension points for type-specific behavior |
| Inner component (WorkflowEditorInner) for hook access | 01-04 | Access hooks within provider boundary |
| Dev-mode __addTestNode for testing | 01-04 | Quick testing without UI during development |
| Category order: trigger > action > condition | 02-01 | Mirrors typical workflow execution flow |
| Node items use left border accent for category | 02-01 | Quick visual identification without icons |
| screenToFlowPosition with clientX/clientY | 02-02 | Accurate drop positioning requires client coordinates |
| Stagger offset = nodes.length * 20 | 02-02 | Visual separation for click-to-add nodes |
| Collapsible sidebar with chevron toggle | 02-02 | Preserves canvas space when sidebar not needed |
| Hierarchical type keys: trigger_entity_event not entity_trigger | 02.1-01 | Backend alignment for workflow persistence |
| Single component per category (TriggerNode, ActionNode, ConditionNode) | 02.1-01 | Type-specific rendering via data props |
| selectedNodeId cleared on clearCanvas | 03-01 | State consistency when clearing canvas |
| 30-minute staleTime for node config schemas | 03-02 | Schemas change rarely, reduce API calls |
| Partial<Record<...>> for widget registry | 03-03 | Allow incremental widget additions |
| Duration stored as string format (30m, 1h, 7d) | 03-03 | Simplicity over complex duration objects |
| Options prop as Record<string, string> | 03-03 | Key-value mapping for enum widget options |
| ICON_REGISTRY for dynamic icon rendering | 03-04 | Existing pattern for IconType to Lucide component |
| entityTypeKey as prop from parent form | 03-04 | Parent watches ENTITY_TYPE and passes to dependent widget |
| Form mode: onChange for immediate validation | 03-05 | Immediate feedback as user types |
| Entity type field watching via explicit key lookup | 03-05 | Find ENTITY_TYPE field in schema, watch its value |
| ResizablePanelGroup for canvas/drawer layout | 03-06 | Canvas shrinks to accommodate drawer (not overlay) |
| Escape key closes drawer globally | 03-06 | Document event listener ensures Escape works anywhere |
| configured flag derived from config presence | 03-06 | Set true when any config value is non-empty |

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 2.1 inserted after Phase 2: Node Library Population (INSERTED)

### Blockers/Concerns

None - Phase 3 complete. All 6 plans finished. Ready for Phase 4.

## Session Continuity

Last session: 2026-02-01
Stopped at: Completed 03-06-PLAN.md (Phase 3 complete)
Resume file: None
