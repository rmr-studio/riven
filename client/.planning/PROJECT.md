# Workflow Builder Foundation

## What This Is

A visual workflow builder integrated into Riven's business workspace platform that enables users to create automated workflows using a drag-and-drop canvas. Workflows combine triggers, actions, and conditional logic with deep integration into the organization's dynamic entity models. This initial foundation focuses on the UI/UX layer - building a polished canvas interaction experience with entity-aware configuration, while backend execution capabilities are developed separately.

## Core Value

Enable business users to visually compose automated workflows that treat their custom entity models as first-class citizens, bridging the gap between entity data management and business process automation.

## Requirements

### Validated

- ✓ User authentication and session management via Supabase — existing
- ✓ Multi-tenant workspace organization with workspace-scoped resources — existing
- ✓ Dynamic entity type system with custom attributes and relationships — existing
- ✓ Entity type and field data accessible via EntityTypeService — existing
- ✓ Service layer pattern for API communication with typed responses — existing
- ✓ TanStack Query for server state management and caching — existing
- ✓ Zustand stores for client-side state management — existing
- ✓ React Hook Form with Zod validation for forms — existing
- ✓ Feature module architecture with standardized structure — existing

### Active

- [ ] Visual workflow canvas using XYFlow for node-based UI
- [ ] Sidebar with draggable workflow blocks (triggers, actions, conditions)
- [ ] Add nodes to canvas via drag-and-drop or click
- [ ] Delete nodes from canvas with keyboard shortcuts
- [ ] Move nodes around canvas with smooth interactions
- [ ] Connect nodes with edges representing execution flow and data flow
- [ ] Popover configuration menu appearing next to selected nodes
- [ ] Trigger block configuration: entity events, manual, webhook, schedule
- [ ] Action block configuration: placeholder UI for future action types
- [ ] Condition block configuration: data target selection and condition logic
- [ ] Entity type selection in node configuration (live from EntityTypeService API)
- [ ] Entity field selection in node configuration
- [ ] Previous block output reference in node configuration
- [ ] Loose validation on node connections (basic rules, generally permissive)
- [ ] Undo/redo functionality for workflow changes
- [ ] Node search/filter in sidebar
- [ ] Persist full workflow state (nodes, positions, connections, configurations, metadata)
- [ ] Workflow scoped per organization (workspace-scoped like other features)
- [ ] Visual polish: smooth animations, clear visual feedback, professional appearance

### Out of Scope

- Workflow execution engine — backend responsibility, separate repository
- Workflow list/management UI — deferred to next phase
- Multiple workflow support — single workflow canvas focus for foundation
- Workflow versioning or history — future enhancement
- Real action implementations — placeholders only, integration comes later
- Workflow testing/debugging tools — future enhancement
- Advanced canvas features (zoom, pan, minimap, auto-layout) — not essential for v1
- Collaboration features (real-time editing, comments) — future consideration
- Workflow templates or marketplace — future consideration
- Function blocks — deferred, focusing on triggers/actions/conditions only

## Context

This workflow builder extends Riven's existing entity-centric business platform. The platform already supports dynamic entity type definitions (similar to Airtable/Notion databases) with custom attributes, relationships, and bidirectional references. The entity system is mature and production-ready.

The workflow foundation is being built in parallel with backend workflow execution capabilities, which live in a separate repository. This frontend foundation focuses on creating a polished, intuitive workflow building experience that will integrate with the execution backend once both are ready.

Key technical environment:
- Next.js 15 App Router with workspace-scoped routing pattern
- XYFlow 12.10.0 already in dependencies for node-based diagrams
- Existing entity services provide live entity type and field data
- Feature module pattern for consistency with existing codebase

User context:
- Target users are business operators building automations for their operations
- Similar to n8n/Zapier but with native entity model integration
- Workflows should feel like natural extensions of entity management

## Constraints

- **Tech Stack**: Must use XYFlow 12.10.0 for canvas (already in dependencies) — ensures consistency with existing architecture
- **Architecture**: Must follow feature module pattern (`components/feature-modules/workflow/`) — maintains codebase consistency
- **Scope**: UI/UX foundation only, no execution logic — backend in separate repo
- **Entity Integration**: Must use existing EntityTypeService for live data — no mocking or duplication
- **Workspace Scoping**: Must respect multi-tenant isolation via workspaceId — security requirement
- **Visual Quality**: Must achieve visual polish before backend integration — foundation must feel production-ready

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use XYFlow for canvas | Already in dependencies, purpose-built for node-based UIs, well-maintained | — Pending |
| Popover configuration UI | User specified preference, keeps canvas uncluttered, allows contextual editing | — Pending |
| Live entity data from API | Ensures configuration UI works with real entity models, validates integration pattern | — Pending |
| Placeholder actions only | Backend execution in separate repo, focus frontend effort on interaction quality | — Pending |
| Single workflow canvas | Defer list/management to focus on core building experience first | — Pending |
| Undo/redo as essential | Critical for user confidence in visual editors, prevents destructive mistakes | — Pending |
| Loose connection validation | Enables rapid prototyping while providing basic guardrails | — Pending |

---
*Last updated: 2026-01-19 after initialization*
