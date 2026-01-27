# Stack Research: Visual Workflow Builder

**Domain:** Visual workflow builder for business automation
**Researched:** 2026-01-19
**Confidence:** HIGH

## Executive Summary

Building a visual workflow builder on the existing Riven stack requires minimal new dependencies. The project already has the core foundation (XYFlow 12.10.0, Zustand, React Hook Form + Zod, TanStack Query). Key additions needed: undo/redo via Zundo, auto-layout via Dagre, optional persistence helpers, and React Flow UI components. This research focuses exclusively on workflow-specific stack needs, not general React/Next.js patterns (already established).

**Philosophy:** Leverage existing stack, add only what's essential for workflow-specific concerns.

## Recommended Stack

### Existing Foundation (Already Installed)

| Technology | Version | Purpose | Integration Notes |
|------------|---------|---------|-------------------|
| @xyflow/react | 12.10.0 | Visual workflow canvas core | Already installed, provides node-based UI, drag-and-drop, zoom/pan, connections |
| Zustand | 5.0.8 | Workflow canvas state | Already installed, recommended by React Flow for state management |
| React Hook Form + Zod | 7.58.1 + 3.25.67 | Node configuration forms | Already installed, perfect for node property panels |
| TanStack Query | 5.81.2 | API state & caching | Already installed, handles workflow persistence/loading |
| shadcn/ui + Tailwind | 4.x | Component primitives | Already installed, React Flow UI builds on this |

**Confidence: HIGH** - These are already proven in the codebase and specifically recommended by React Flow documentation.

### Core Workflow Additions

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| zundo | 2.3.0+ | Undo/redo for workflow canvas | Official middleware for Zustand temporal state, <700 bytes, supports both Zustand 4 and 5 |
| @dagrejs/dagre | 1.1.8 | Auto-layout for workflow nodes | React Flow's top recommendation for tree layouts, simple API, minimal configuration |

**Confidence: HIGH** - zundo is the standard solution for undo/redo in Zustand apps (React Flow examples use it). Dagre is explicitly recommended by React Flow docs over elkjs for most use cases.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| immer | 11.1.3 | Immutable state updates | Zustand already uses internally, may need explicit import for complex nested updates |
| use-immer | 0.11.0 | Immer + React hooks | If you prefer `useImmer` hook over Zustand for local component state |
| dexie | 4.2.1 | IndexedDB abstraction | For offline-first or client-side workflow drafts (optional) |
| dexie-react-hooks | 4.2.0 | Dexie + React integration | If using Dexie, provides `useLiveQuery()` hook |
| idb-keyval | 6.2.2 | Simple IndexedDB key-value | Lighter alternative to Dexie for simple persistence (300 bytes) |

**Confidence: MEDIUM-HIGH**
- Immer: HIGH confidence (already used by Zustand internally, stable, 2025 best practice)
- Dexie/idb-keyval: MEDIUM confidence (only needed if offline-first required, TanStack Query + backend persistence may suffice)

### React Flow UI Components (Optional)

| Component Set | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| React Flow UI | Latest (shadcn-based) | Pre-built workflow nodes | For rapid prototyping, can copy source and customize |

**Installation:** Via shadcn CLI, not npm package. Provides BaseNode, LabeledHandle, Panel components built on shadcn/ui primitives.

**Confidence: MEDIUM** - New in 2025 (updated for React 19 + Tailwind 4). Provides starting templates but requires customization for domain-specific workflow nodes. Source code approach (like shadcn) means no version lock-in.

**Note:** Since Riven already uses shadcn/ui extensively, React Flow UI components integrate seamlessly.

## Installation

```bash
# Core workflow additions (required)
npm install zundo @dagrejs/dagre

# Optional: Enhanced immutability (if needed beyond Zustand)
npm install immer use-immer

# Optional: Offline persistence (choose one if needed)
npm install dexie dexie-react-hooks  # Full-featured
npm install idb-keyval               # Lightweight alternative

# Optional: React Flow UI components (via shadcn CLI)
# Follow: https://reactflow.dev/ui
# Requires shadcn already configured (which Riven has)
```

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| elkjs | Overly complex (Java ported to JS), difficult to debug, React Flow docs warn against it | @dagrejs/dagre for 95% of use cases |
| d3-hierarchy | Requires all nodes same size, doesn't support dynamic sizing | @dagrejs/dagre or d3-force |
| Redux for workflow state | Overkill, Zustand already in stack and preferred by React Flow | Zustand (already installed) |
| use-undoable | Compatibility issues with React Flow v10+, not actively maintained (last update 2 years ago) | zundo (Zustand temporal middleware) |
| Original dagre package | Unmaintained for 6 years | @dagrejs/dagre (actively maintained fork) |
| React Flow Pro subscription | Not needed unless you want 1:1 support or advanced examples | Open source alternatives (zundo for undo/redo) |
| XState for workflow UI state | Overkill for canvas state management, increases complexity | Zustand (save XState for backend execution engine if needed) |

**Confidence: HIGH** - These recommendations are based on React Flow official docs, active maintenance status, and 2025 community consensus.

## Architecture Patterns

### State Management Strategy

**Canvas State (Zustand + Zundo):**
```typescript
// Feature module: components/feature-modules/workflow/stores/canvas.store.ts
import { create } from 'zustand';
import { temporal } from 'zundo';

export const useWorkflowCanvas = create<WorkflowCanvasState>()(
  temporal(
    (set, get) => ({
      nodes: [],
      edges: [],
      addNode: (node) => set((state) => ({
        nodes: [...state.nodes, node]
      })),
      // ...
    }),
    {
      limit: 50, // Keep last 50 states for undo/redo
      equality: (a, b) => a === b,
    }
  )
);

// Access undo/redo
const { undo, redo, clear } = useWorkflowCanvas.temporal.getState();
```

**Node Configuration (React Hook Form + Zod):**
```typescript
// Already established pattern in Riven
const form = useForm<NodeConfigFormValues>({
  resolver: zodResolver(nodeConfigSchema),
  defaultValues: nodeData,
  mode: 'onBlur',
});
```

**Server State (TanStack Query):**
```typescript
// Already established pattern in Riven
export function useSaveWorkflowMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workflow) => WorkflowService.save(session, workspaceId, workflow),
    onSuccess: (data) => {
      queryClient.setQueryData(['workflow', workspaceId, data.id], data);
    },
  });
}
```

### Connection Validation Pattern

**React Flow's `isValidConnection` API:**
```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  isValidConnection={(connection: Connection) => {
    // Example: Prevent cycles
    const source = nodes.find(n => n.id === connection.source);
    const target = nodes.find(n => n.id === connection.target);

    // Custom validation logic
    return validateConnectionByType(source, target);
  }}
/>
```

### Persistence Strategy

**Option 1: Server-first (Recommended for Riven):**
- Use existing TanStack Query + backend API
- Auto-save drafts via debounced mutations
- No additional libraries needed
- Leverages existing EntityTypeService pattern

**Option 2: Offline-first (If needed):**
- Use Dexie for local IndexedDB storage
- Sync with backend when online
- Requires additional complexity
- Only add if offline editing is required

**Recommendation:** Start with Option 1. Riven already has robust server state management. Only add offline support if explicitly required.

### Layout Strategy

**Auto-layout with Dagre:**
```typescript
import dagre from '@dagrejs/dagre';

const useAutoLayout = (nodes: Node[], edges: Edge[]) => {
  return useMemo(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB' }); // Top to bottom

    nodes.forEach(node => {
      dagreGraph.setNode(node.id, { width: node.width, height: node.height });
    });

    edges.forEach(edge => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map(node => ({
      ...node,
      position: dagreGraph.node(node.id),
    }));
  }, [nodes, edges]);
};
```

## Integration with Existing Riven Patterns

### Feature Module Structure

```
components/feature-modules/workflow/
├── components/
│   ├── canvas/              # React Flow wrapper
│   ├── nodes/               # Custom node types
│   ├── panels/              # Configuration panels (use existing drawer patterns)
│   ├── forms/               # Node config forms (React Hook Form + Zod)
│   └── ui/                  # Workflow-specific UI components
├── config/
│   ├── node-types.config.ts # Node type registry
│   └── validation.config.ts # Connection validation rules
├── hooks/
│   ├── mutation/            # TanStack mutations (useSaveWorkflowMutation)
│   ├── query/               # TanStack queries (useWorkflowQuery)
│   └── use-auto-layout.ts   # Dagre integration
├── interface/
│   └── workflow.interface.ts # OpenAPI type re-exports
├── service/
│   └── workflow.service.ts  # API client (static class pattern)
├── stores/
│   └── canvas.store.ts      # Zustand + Zundo for canvas state
└── util/
    ├── connection-validator.util.ts
    └── layout.util.ts
```

**This matches Riven's existing feature module pattern exactly.**

### Entity Integration Pattern

Workflow nodes need to reference entity types from existing EntityTypeService:

```typescript
// Leverage existing pattern
const { data: entityTypes } = useEntityTypeQuery(workspaceId);

// In workflow node configuration
const nodeConfigSchema = z.object({
  entityTypeKey: z.enum(entityTypes.map(t => t.key)),
  // ... other config
});
```

**No additional libraries needed - uses existing EntityTypeService and TanStack Query.**

## Alternatives Considered

| Category | Recommended | Alternative | When Alternative Makes Sense |
|----------|-------------|-------------|------------------------------|
| Canvas Core | @xyflow/react 12.10.0 | reaflow, react-diagrams | Never (already installed, industry standard) |
| Undo/Redo | zundo | use-undoable, use-undo | Never (zundo is official Zustand middleware) |
| Auto-layout | @dagrejs/dagre | elkjs, d3-hierarchy | elkjs: Only if need complex edge routing (rare) |
| Persistence | TanStack Query + backend | Dexie + IndexedDB | Only if offline-first explicitly required |
| State | Zustand + temporal | XState, Redux | XState: Only for backend execution engine, not UI state |
| Validation | Zod (already in stack) | ajv, yup | Never (already using Zod throughout Riven) |

## Version Compatibility Matrix

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| zundo | 2.3.0+ | Zustand 4.2.0+ or 5.x | Already compatible with Riven's Zustand 5.0.8 |
| @dagrejs/dagre | 1.1.8 | @xyflow/react 12.x | No direct dependency, pure layout algorithm |
| dexie | 4.2.1 | React 19 | If needed, compatible with Riven's React 19 |
| immer | 11.1.3 | React 19, Zustand 5 | Zustand already uses internally |
| React Flow UI | Latest | React 19, Tailwind 4, shadcn/ui | Updated October 2025 for React 19 + Tailwind 4 |

**All recommended packages are compatible with Riven's current stack.**

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Core additions (zundo, dagre) | HIGH | Official React Flow recommendations, verified with current docs |
| State management pattern | HIGH | Zustand already in stack, temporal middleware is standard |
| Form integration | HIGH | React Hook Form + Zod already used throughout Riven |
| Persistence strategy | HIGH | TanStack Query already handles this pattern in Riven |
| Optional libraries (Dexie, etc.) | MEDIUM | Only needed if offline-first required, not verified for this use case |
| React Flow UI components | MEDIUM | New in 2025, not battle-tested yet, but safe (source code approach) |
| Layout algorithm choice | HIGH | React Flow docs explicitly recommend dagre over alternatives |

## Verification Sources

**High Confidence (Official Documentation):**
- [React Flow - Building a Flow](https://reactflow.dev/learn/concepts/building-a-flow) - State management recommendations
- [React Flow - Layouting](https://reactflow.dev/learn/layouting/layouting) - Layout library comparison
- [React Flow - Undo/Redo Example](https://reactflow.dev/examples/interaction/undo-redo) - Snapshot-based approach
- [React Flow - Connection Validation](https://reactflow.dev/examples/interaction/validation) - isValidConnection API
- [React Flow - IsValidConnection Type](https://reactflow.dev/api-reference/types/is-valid-connection) - Type definition
- [Zustand Third-party Libraries](https://zustand.docs.pmnd.rs/integrations/third-party-libraries) - Zundo temporal middleware
- [GitHub - charkour/zundo](https://github.com/charkour/zundo) - Official Zundo repository, v2.3.0+ compatible with Zustand 5

**Medium Confidence (Community & Recent Updates):**
- [React Flow UI - Introduction](https://xyflow.com/blog/react-flow-components) - React Flow UI announcement
- [React Flow UI Updates](https://reactflow.dev/whats-new/2025-10-28) - React 19 + Tailwind 4 compatibility
- [Node-Based Workflow Builder (React Summit 2025)](https://gitnation.com/contents/build-and-customize-a-node-based-workflow-builder-with-react) - Community patterns
- [Immer Documentation](https://immerjs.github.io/immer/) - Current best practices

**Package Versions (Verified NPM):**
- [@dagrejs/dagre v1.1.8](https://www.npmjs.com/package/@dagrejs/dagre) - Active maintenance (2 months ago)
- [zundo v2.3.0+](https://www.npmjs.com/package/zundo) - Zustand 5 compatibility confirmed
- [use-immer v0.11.0](https://www.npmjs.com/package/use-immer) - Last update 1 year ago
- [immer v11.1.3](https://www.npmjs.com/package/immer) - Active (18 days ago)
- [dexie v4.2.1](https://www.npmjs.com/package/dexie) - Active (3 months ago)
- [idb-keyval v6.2.2](https://www.npmjs.com/package/idb-keyval) - Stable (8 months ago)

---
*Stack research for: Visual Workflow Builder*
*Researched: 2026-01-19*
*Next Steps: See SUMMARY.md for roadmap implications*
