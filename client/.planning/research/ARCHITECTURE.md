# Architecture Patterns: Visual Workflow Builder

**Domain:** Visual Workflow Builder with Entity Model Integration
**Researched:** 2026-01-19
**Confidence:** HIGH

## Executive Summary

Visual workflow builders in React applications (2025) follow a **layered architecture** separating presentation (canvas), state management (graph structure), business logic (validation, execution), and persistence. Modern implementations use XYFlow for canvas rendering, Zustand or Redux for state management, and type-safe registries for extensible node types.

**Key architectural decision:** Workflow builders must separate **build-time concerns** (node placement, configuration, connection) from **runtime concerns** (execution, data flow). The foundation focuses exclusively on build-time composition.

**Integration with existing platform:** The workflow builder follows Riven's established feature module pattern, using static service classes for API calls, TanStack Query for server state, Zustand for complex client state, and workspace-scoped routing.

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Workflow Canvas (XYFlow)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Node Library │  │ Canvas View  │  │ Config Panel │         │
│  │  (Sidebar)   │  │   (Center)   │  │   (Drawer)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  State Management Layer                          │
│  ┌─────────────────────┐          ┌────────────────────────┐   │
│  │  Workflow Store     │◄────────►│  React Query Cache     │   │
│  │  (Zustand)          │          │  (Entity Types, etc)   │   │
│  │                     │          └────────────────────────┘   │
│  │ - nodes             │                                        │
│  │ - edges             │          ┌────────────────────────┐   │
│  │ - selectedNodeId    │◄────────►│  XYFlow Internal       │   │
│  │ - history           │          │  (viewport, selection) │   │
│  │ - isDirty           │          └────────────────────────┘   │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Node Type        │  │ Connection       │  │ Validation   │ │
│  │ Registry         │  │ Validator        │  │ Engine       │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ WorkflowService  │  │ EntityTypeService│  │ Persistence  │ │
│  │ (static class)   │  │ (existing)       │  │ (API calls)  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | State |
|-----------|---------------|-------------------|-------|
| **WorkflowCanvas** | XYFlow wrapper, manages viewport, renders nodes/edges | WorkflowStore, NodeLibrary, ConfigPanel | XYFlow internal (viewport, selection) |
| **NodeLibrary** | Searchable node type list, drag source | NodeTypeRegistry, WorkflowCanvas | Local search/filter state |
| **ConfigPanel** | Node configuration forms, entity type selection | WorkflowStore, EntityTypeService, ValidationEngine | React Hook Form state |
| **NodeRenderer** | Custom node components, visual representation | NodeTypeRegistry, WorkflowStore | None (pure render) |
| **WorkflowStore** | Graph structure (nodes, edges), undo/redo history | All components, persistence service | Zustand store |
| **NodeTypeRegistry** | Node type definitions, component mapping | NodeLibrary, NodeRenderer, ValidationEngine | Static registry (immutable) |
| **ConnectionValidator** | Type checking, cardinality validation, cycle detection | WorkflowStore, EntityTypeService | None (pure function) |
| **ValidationEngine** | Node configuration validation, error reporting | ConfigPanel, WorkflowStore, EntityTypeService | None (pure function) |
| **WorkflowService** | API calls for save/load/list workflows | WorkflowStore, TanStack Query | None (static class) |

## Data Flow

### 1. Node Creation Flow

```
User drags node from library
    ↓
NodeLibrary handles dragStart (node type metadata)
    ↓
WorkflowCanvas handles drop (position)
    ↓
WorkflowStore.addNode(type, position, defaultConfig)
    ↓
XYFlow re-renders with new node
    ↓
Node appears on canvas (unconfigured state)
```

### 2. Node Configuration Flow

```
User clicks node → WorkflowStore.setSelectedNodeId(id)
    ↓
ConfigPanel observes selectedNodeId change
    ↓
ConfigPanel loads node config from WorkflowStore
    ↓
ConfigPanel queries EntityTypeService for entity types (TanStack Query)
    ↓
User edits form → React Hook Form validates (Zod schema)
    ↓
User saves → WorkflowStore.updateNodeConfig(id, config)
    ↓
ValidationEngine validates config → WorkflowStore.setNodeStatus(id, status)
    ↓
Node re-renders with status indicator (green/yellow/red)
```

### 3. Connection Creation Flow

```
User drags from source handle to target handle (XYFlow)
    ↓
ConnectionValidator.isValidConnection(source, target) → XYFlow
    ↓
If valid: XYFlow calls onConnect callback
    ↓
WorkflowStore.addEdge(source, target, type)
    ↓
Edge persisted to store, rendered on canvas
    ↓
If invalid: Visual feedback (red highlight), no edge created
```

### 4. Persistence Flow

```
User clicks Save (or auto-save timer triggers)
    ↓
WorkflowStore serializes state (nodes, edges, metadata)
    ↓
WorkflowService.saveWorkflow(workspaceId, workflow)
    ↓
API returns saved workflow with ID
    ↓
TanStack Query updates cache
    ↓
WorkflowStore.setDirty(false)
    ↓
UI shows "Saved" indicator
```

### 5. Undo/Redo Flow

```
User performs action (add/delete/move/configure)
    ↓
WorkflowStore pushes current state to history stack
    ↓
WorkflowStore applies action (immutable update)
    ↓
User presses Ctrl+Z
    ↓
WorkflowStore.undo() → pops from past, pushes to future
    ↓
XYFlow receives new nodes/edges, re-renders
    ↓
User presses Ctrl+Shift+Z
    ↓
WorkflowStore.redo() → pops from future, pushes to past
```

## Architectural Patterns to Follow

### Pattern 1: Node Type Registry

**What:** Centralized registry mapping node type IDs to component metadata.

**Why:** Extensibility without modifying core logic. Add new node types by registering, not editing core files.

**When:** All node types defined in workflow system.

**Implementation:**

```typescript
// components/feature-modules/workflow/config/node-type-registry.ts

export interface NodeTypeMetadata {
    id: string; // e.g., "entity_trigger", "condition_if"
    category: "trigger" | "action" | "condition" | "logic";
    label: string;
    icon: React.ComponentType;
    description: string;
    component: React.ComponentType<NodeProps>; // Custom node renderer
    configComponent: React.ComponentType<NodeConfigProps>; // Config form
    defaultConfig: Record<string, unknown>;
    validation: ZodSchema;
    inputs: PortDefinition[];
    outputs: PortDefinition[];
}

export const nodeTypeRegistry: Record<string, NodeTypeMetadata> = {
    entity_trigger: {
        id: "entity_trigger",
        category: "trigger",
        label: "Entity Trigger",
        icon: ZapIcon,
        description: "Trigger workflow when entity is created/updated",
        component: EntityTriggerNode,
        configComponent: EntityTriggerConfig,
        defaultConfig: { entityTypeKey: null, event: "created" },
        validation: entityTriggerSchema,
        inputs: [],
        outputs: [{ id: "entity", type: "entity", label: "Entity" }],
    },
    // ... more node types
};
```

**Usage:**

```typescript
// Get node metadata
const metadata = nodeTypeRegistry[nodeType];

// Render node component
const NodeComponent = metadata.component;
return <NodeComponent data={nodeData} />;

// Render config form
const ConfigComponent = metadata.configComponent;
return <ConfigComponent nodeId={nodeId} config={config} />;
```

### Pattern 2: Zustand Store with History Management

**What:** Centralized workflow state with undo/redo via snapshot history.

**Why:** Complex state (nodes, edges, selection, history) requires centralized management. XYFlow recommends external state for advanced features.

**When:** All workflow mutations (except transient viewport/selection).

**Implementation:**

```typescript
// components/feature-modules/workflow/stores/workflow.store.ts

interface WorkflowState {
    // Graph structure
    nodes: Node[];
    edges: Edge[];

    // UI state
    selectedNodeId: string | null;
    isDirty: boolean;

    // History
    past: WorkflowSnapshot[];
    future: WorkflowSnapshot[];

    // Actions
    addNode: (type: string, position: XYPosition, config?: Record<string, unknown>) => void;
    updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
    deleteNode: (nodeId: string) => void;
    addEdge: (edge: Edge) => void;
    deleteEdge: (edgeId: string) => void;
    setSelectedNodeId: (nodeId: string | null) => void;
    undo: () => void;
    redo: () => void;
    saveSnapshot: () => void;
    serialize: () => WorkflowDefinition;
    deserialize: (definition: WorkflowDefinition) => void;
}

export const useWorkflowStore = create<WorkflowState>()(
    subscribeWithSelector((set, get) => ({
        nodes: [],
        edges: [],
        selectedNodeId: null,
        isDirty: false,
        past: [],
        future: [],

        addNode: (type, position, config) => {
            const metadata = nodeTypeRegistry[type];
            const newNode: Node = {
                id: generateId(),
                type,
                position,
                data: {
                    config: config ?? metadata.defaultConfig,
                    status: "unconfigured",
                },
            };

            set((state) => {
                saveSnapshot(state); // Save before mutation
                return {
                    nodes: [...state.nodes, newNode],
                    isDirty: true,
                    future: [], // Clear redo stack on new action
                };
            });
        },

        undo: () => {
            const { past, nodes, edges } = get();
            if (past.length === 0) return;

            const previous = past[past.length - 1];
            const newPast = past.slice(0, -1);

            set({
                nodes: previous.nodes,
                edges: previous.edges,
                past: newPast,
                future: [{ nodes, edges }, ...get().future],
                isDirty: true,
            });
        },

        // ... other actions
    }))
);
```

**Key decisions:**
- **Snapshot-based undo:** Store entire graph state, not granular actions. Simpler implementation, sufficient for workflow sizes (typically <50 nodes).
- **Limit history:** Store last 50 snapshots to prevent memory issues.
- **Clear redo on new action:** Standard undo/redo UX pattern.

### Pattern 3: Connection Validation Pipeline

**What:** Multi-stage validation for edge connections before creation.

**Why:** Prevent invalid workflows early. Type-safe connections between entity-aware nodes.

**When:** User attempts to create connection (XYFlow `isValidConnection` callback).

**Implementation:**

```typescript
// components/feature-modules/workflow/util/connection-validator.util.ts

export interface ValidationResult {
    valid: boolean;
    reason?: string;
}

export class ConnectionValidator {
    /**
     * Multi-stage validation pipeline
     */
    static validate(
        source: { nodeId: string; handleId: string },
        target: { nodeId: string; handleId: string },
        nodes: Node[],
        edges: Edge[],
        entityTypes: EntityType[]
    ): ValidationResult {
        // Stage 1: Basic validation
        const basicResult = this.validateBasic(source, target, nodes, edges);
        if (!basicResult.valid) return basicResult;

        // Stage 2: Type compatibility
        const typeResult = this.validateTypes(source, target, nodes);
        if (!typeResult.valid) return typeResult;

        // Stage 3: Cycle detection
        const cycleResult = this.detectCycles(source, target, edges);
        if (!cycleResult.valid) return cycleResult;

        // Stage 4: Entity schema validation
        const schemaResult = this.validateEntitySchema(source, target, nodes, entityTypes);
        if (!schemaResult.valid) return schemaResult;

        return { valid: true };
    }

    private static validateBasic(source, target, nodes, edges): ValidationResult {
        // Prevent self-connections
        if (source.nodeId === target.nodeId) {
            return { valid: false, reason: "Cannot connect node to itself" };
        }

        // Prevent duplicate connections
        const duplicate = edges.find(
            (e) => e.source === source.nodeId &&
                   e.target === target.nodeId &&
                   e.sourceHandle === source.handleId &&
                   e.targetHandle === target.handleId
        );
        if (duplicate) {
            return { valid: false, reason: "Connection already exists" };
        }

        return { valid: true };
    }

    private static validateTypes(source, target, nodes): ValidationResult {
        const sourceNode = nodes.find((n) => n.id === source.nodeId);
        const targetNode = nodes.find((n) => n.id === target.nodeId);

        const sourceMetadata = nodeTypeRegistry[sourceNode.type];
        const targetMetadata = nodeTypeRegistry[targetNode.type];

        const sourcePort = sourceMetadata.outputs.find((p) => p.id === source.handleId);
        const targetPort = targetMetadata.inputs.find((p) => p.id === target.handleId);

        // Type compatibility check
        if (sourcePort.type !== targetPort.type && targetPort.type !== "any") {
            return {
                valid: false,
                reason: `Type mismatch: ${sourcePort.type} → ${targetPort.type}`,
            };
        }

        return { valid: true };
    }

    private static detectCycles(source, target, edges): ValidationResult {
        // Build adjacency list
        const graph = new Map<string, string[]>();
        edges.forEach((e) => {
            if (!graph.has(e.source)) graph.set(e.source, []);
            graph.get(e.source).push(e.target);
        });

        // Add proposed edge
        if (!graph.has(source.nodeId)) graph.set(source.nodeId, []);
        graph.get(source.nodeId).push(target.nodeId);

        // DFS for cycle detection
        const visited = new Set<string>();
        const recStack = new Set<string>();

        const hasCycle = (node: string): boolean => {
            visited.add(node);
            recStack.add(node);

            const neighbors = graph.get(node) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (hasCycle(neighbor)) return true;
                } else if (recStack.has(neighbor)) {
                    return true; // Cycle detected
                }
            }

            recStack.delete(node);
            return false;
        };

        if (hasCycle(source.nodeId)) {
            return { valid: false, reason: "Would create cycle" };
        }

        return { valid: true };
    }

    private static validateEntitySchema(source, target, nodes, entityTypes): ValidationResult {
        const sourceNode = nodes.find((n) => n.id === source.nodeId);
        const targetNode = nodes.find((n) => n.id === target.nodeId);

        // Only validate if both nodes reference entity types
        const sourceEntityKey = sourceNode.data.config?.entityTypeKey;
        const targetEntityKey = targetNode.data.config?.entityTypeKey;

        if (!sourceEntityKey || !targetEntityKey) {
            return { valid: true }; // Skip if not entity-specific
        }

        // Validate entity type compatibility
        if (sourceEntityKey !== targetEntityKey) {
            const sourceType = entityTypes.find((t) => t.key === sourceEntityKey);
            const targetType = entityTypes.find((t) => t.key === targetEntityKey);

            // Check if relationship exists
            const hasRelationship = sourceType?.relationshipDefinitions?.some(
                (rel) => rel.targetKey === targetEntityKey
            );

            if (!hasRelationship) {
                return {
                    valid: false,
                    reason: `No relationship between ${sourceType?.name} and ${targetType?.name}`,
                };
            }
        }

        return { valid: true };
    }
}
```

**Usage in WorkflowCanvas:**

```typescript
<ReactFlow
    nodes={nodes}
    edges={edges}
    isValidConnection={(connection) => {
        const result = ConnectionValidator.validate(
            { nodeId: connection.source, handleId: connection.sourceHandle },
            { nodeId: connection.target, handleId: connection.targetHandle },
            nodes,
            edges,
            entityTypes
        );
        return result.valid;
    }}
    // ...
/>
```

### Pattern 4: Context Provider for Workflow Scope

**What:** React Context provides workflow-scoped dependencies (store, services, config).

**Why:** Avoid prop drilling. Components deep in tree access workflow store via hook.

**When:** Wrapping entire workflow feature module.

**Implementation:**

```typescript
// components/feature-modules/workflow/context/workflow-provider.tsx

interface WorkflowContextValue {
    workspaceId: string;
    workflowId: string | null; // null for new workflow
    store: WorkflowStore;
}

const WorkflowContext = createContext<WorkflowContextValue | undefined>(undefined);

export const WorkflowProvider = ({
    children,
    workspaceId,
    workflowId,
}: PropsWithChildren<{ workspaceId: string; workflowId: string | null }>) => {
    const storeRef = useRef<WorkflowStore | null>(null);

    // Create store once per workflow
    if (!storeRef.current) {
        storeRef.current = createWorkflowStore(workflowId);
    }

    // Load workflow if editing existing
    useEffect(() => {
        if (workflowId) {
            // Load from API via TanStack Query
            const workflow = queryClient.getQueryData(["workflow", workflowId]);
            if (workflow) {
                storeRef.current.deserialize(workflow);
            }
        }
    }, [workflowId]);

    return (
        <WorkflowContext.Provider value={{ workspaceId, workflowId, store: storeRef.current }}>
            {children}
        </WorkflowContext.Provider>
    );
};

export const useWorkflowContext = () => {
    const context = useContext(WorkflowContext);
    if (!context) throw new Error("useWorkflowContext must be used within WorkflowProvider");
    return context;
};

// Convenience hook for accessing store with selector
export const useWorkflow = <T,>(selector: (store: WorkflowStore) => T): T => {
    const { store } = useWorkflowContext();
    return useStore(store, selector);
};
```

### Pattern 5: Service Layer Integration

**What:** Static class methods for workflow persistence API calls.

**Why:** Consistent with existing platform patterns (EntityTypeService, BlockService).

**When:** All workflow CRUD operations.

**Implementation:**

```typescript
// components/feature-modules/workflow/service/workflow.service.ts

export interface WorkflowDefinition {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    nodes: Node[];
    edges: Edge[];
    metadata: {
        createdAt: string;
        updatedAt: string;
        createdBy: string;
    };
}

export class WorkflowService {
    static async getWorkflows(
        session: Session | null,
        workspaceId: string
    ): Promise<WorkflowDefinition[]> {
        validateSession(session);
        validateUuid(workspaceId);
        const url = api();

        const response = await fetch(
            `${url}/v1/workflows/workspace/${workspaceId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            }
        );

        if (response.ok) return await response.json();

        throw await handleError(
            response,
            (res) => `Failed to fetch workflows: ${res.status} ${res.statusText}`
        );
    }

    static async getWorkflowById(
        session: Session | null,
        workspaceId: string,
        workflowId: string
    ): Promise<WorkflowDefinition> {
        validateSession(session);
        validateUuid(workspaceId);
        validateUuid(workflowId);
        const url = api();

        const response = await fetch(
            `${url}/v1/workflows/workspace/${workspaceId}/${workflowId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            }
        );

        if (response.ok) return await response.json();

        throw await handleError(
            response,
            (res) => `Failed to fetch workflow: ${res.status} ${res.statusText}`
        );
    }

    static async saveWorkflow(
        session: Session | null,
        workspaceId: string,
        workflow: Partial<WorkflowDefinition>
    ): Promise<WorkflowDefinition> {
        validateSession(session);
        validateUuid(workspaceId);
        const url = api();

        const method = workflow.id ? "PUT" : "POST";
        const endpoint = workflow.id
            ? `${url}/v1/workflows/workspace/${workspaceId}/${workflow.id}`
            : `${url}/v1/workflows/workspace/${workspaceId}`;

        const response = await fetch(endpoint, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(workflow),
        });

        if (response.ok) return await response.json();

        throw await handleError(
            response,
            (res) => `Failed to save workflow: ${res.status} ${res.statusText}`
        );
    }

    static async deleteWorkflow(
        session: Session | null,
        workspaceId: string,
        workflowId: string
    ): Promise<void> {
        validateSession(session);
        validateUuid(workspaceId);
        validateUuid(workflowId);
        const url = api();

        const response = await fetch(
            `${url}/v1/workflows/workspace/${workspaceId}/${workflowId}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            }
        );

        if (response.ok) return;

        throw await handleError(
            response,
            (res) => `Failed to delete workflow: ${res.status} ${res.statusText}`
        );
    }
}
```

**TanStack Query hooks:**

```typescript
// components/feature-modules/workflow/hooks/query/use-workflows.ts

export function useWorkflows(workspaceId: string) {
    const { session } = useAuth();

    return useQuery({
        queryKey: ["workflows", workspaceId],
        queryFn: () => WorkflowService.getWorkflows(session, workspaceId),
        enabled: !!session && !!workspaceId,
    });
}

export function useWorkflow(workspaceId: string, workflowId: string) {
    const { session } = useAuth();

    return useQuery({
        queryKey: ["workflow", workspaceId, workflowId],
        queryFn: () => WorkflowService.getWorkflowById(session, workspaceId, workflowId),
        enabled: !!session && !!workspaceId && !!workflowId,
    });
}
```

**Mutation hooks:**

```typescript
// components/feature-modules/workflow/hooks/mutation/use-save-workflow.ts

export function useSaveWorkflow(workspaceId: string) {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const toastRef = useRef<string | number | undefined>(undefined);

    return useMutation({
        mutationFn: (workflow: Partial<WorkflowDefinition>) =>
            WorkflowService.saveWorkflow(session, workspaceId, workflow),
        onMutate: () => {
            toastRef.current = toast.loading("Saving workflow...");
        },
        onSuccess: (savedWorkflow) => {
            toast.success("Workflow saved successfully!", { id: toastRef.current });

            // Update cache
            queryClient.setQueryData(
                ["workflow", workspaceId, savedWorkflow.id],
                savedWorkflow
            );

            // Invalidate list
            queryClient.invalidateQueries({ queryKey: ["workflows", workspaceId] });
        },
        onError: (error) => {
            toast.error(`Failed to save: ${error.message}`, { id: toastRef.current });
        },
    });
}
```

## Architectural Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Transient UI State in Zustand

**What:** Storing XYFlow viewport (zoom, pan) or temporary selection in Zustand store.

**Why problematic:** XYFlow manages this internally. Duplicating in Zustand causes sync issues and unnecessary re-renders.

**Instead:** Let XYFlow manage viewport/selection. Use Zustand only for graph structure (nodes, edges) and workflow-specific state (isDirty, history).

**Example of what NOT to do:**

```typescript
// BAD: Duplicating XYFlow state
const useWorkflowStore = create((set) => ({
    zoom: 1,
    panX: 0,
    panY: 0,
    setZoom: (zoom) => set({ zoom }), // XYFlow already does this!
}));
```

**Correct approach:**

```typescript
// GOOD: Use XYFlow's internal state
const { setViewport, getViewport } = useReactFlow();

// Access viewport when needed
const viewport = getViewport();

// Update viewport
setViewport({ x: 0, y: 0, zoom: 1 });
```

### Anti-Pattern 2: Node Components with Side Effects

**What:** Node components that fetch data, update global state, or trigger actions during render.

**Why problematic:** XYFlow re-renders nodes frequently (on drag, zoom). Side effects cause performance issues and unexpected behavior.

**Instead:** Keep node components pure. Move side effects to event handlers or separate effects with proper dependencies.

**Example of what NOT to do:**

```typescript
// BAD: Side effect in render
const EntityTriggerNode = ({ data }) => {
    const entityTypes = useEntityTypes(workspaceId); // API call on every render!

    useEffect(() => {
        // Runs on every re-render
        updateNodeStatus(data.id, validateConfig(data.config));
    });

    return <div>{/* ... */}</div>;
};
```

**Correct approach:**

```typescript
// GOOD: Pure component, side effects in config panel
const EntityTriggerNode = ({ data }) => {
    const { config, status } = data;

    return (
        <div className={cn("node", statusClasses[status])}>
            <div className="node-header">
                <ZapIcon />
                <span>Entity Trigger</span>
            </div>
            <div className="node-body">
                {config.entityTypeKey ? (
                    <span>{config.entityTypeKey}</span>
                ) : (
                    <span className="text-muted">Not configured</span>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} id="entity" />
        </div>
    );
};

// Side effects in config panel
const EntityTriggerConfig = ({ nodeId, config }) => {
    const { data: entityTypes } = useEntityTypes(workspaceId); // Cached by TanStack Query
    const updateNodeConfig = useWorkflow((s) => s.updateNodeConfig);

    useEffect(() => {
        // Validation runs only when config changes
        const status = validateEntityTriggerConfig(config, entityTypes);
        updateNodeConfig(nodeId, { ...config, status });
    }, [config, entityTypes, nodeId, updateNodeConfig]);

    return <Form>{/* ... */}</Form>;
};
```

### Anti-Pattern 3: Deep Node Data Nesting

**What:** Storing complex nested objects in node `data` prop.

**Why problematic:** Immutable updates become verbose. Comparing node data for changes requires deep equality checks. Harder to reason about state shape.

**Instead:** Keep node data flat. Use IDs to reference complex objects stored elsewhere (EntityTypeService cache, separate Zustand slice).

**Example of what NOT to do:**

```typescript
// BAD: Complex nested structure
const node = {
    id: "node-1",
    type: "entity_trigger",
    data: {
        config: {
            entityType: {
                id: "...",
                name: "Client",
                attributes: [/* ... */],
                relationships: [/* ... */],
            },
            selectedFields: [/* ... */],
            conditions: [/* ... */],
        },
    },
};

// Updating becomes painful
const updatedNode = {
    ...node,
    data: {
        ...node.data,
        config: {
            ...node.data.config,
            entityType: {
                ...node.data.config.entityType,
                name: "Customer", // Just to update this!
            },
        },
    },
};
```

**Correct approach:**

```typescript
// GOOD: Flat structure with IDs
const node = {
    id: "node-1",
    type: "entity_trigger",
    data: {
        config: {
            entityTypeKey: "client", // Just the ID
            event: "created",
            status: "valid",
        },
    },
};

// Updating is simple
const updatedNode = {
    ...node,
    data: {
        ...node.data,
        config: {
            ...node.data.config,
            event: "updated",
        },
    },
};

// Fetch full entity type from cache when needed
const EntityTriggerConfig = ({ nodeId, config }) => {
    const { data: entityType } = useEntityType(workspaceId, config.entityTypeKey);
    // ...
};
```

### Anti-Pattern 4: Synchronous Validation Blocking UI

**What:** Running expensive validation synchronously on every config change, blocking input.

**Why problematic:** Entity schema validation may require relationship graph traversal. Blocking UI makes forms feel sluggish.

**Instead:** Debounce validation. Show loading state during validation. Use optimistic UI updates.

**Example of what NOT to do:**

```typescript
// BAD: Synchronous validation blocks UI
const EntityTriggerConfig = ({ nodeId, config }) => {
    const form = useForm({
        defaultValues: config,
        resolver: zodResolver(schema),
    });

    const onFieldChange = (field, value) => {
        form.setValue(field, value);

        // Blocks UI while validating
        const errors = validateEntityTriggerConfig(form.getValues());
        form.setError(errors);
    };

    return <Form>{/* ... */}</Form>;
};
```

**Correct approach:**

```typescript
// GOOD: Debounced async validation
const EntityTriggerConfig = ({ nodeId, config }) => {
    const form = useForm({
        defaultValues: config,
        resolver: zodResolver(schema),
        mode: "onBlur", // Validate on blur, not on change
    });

    // Debounced validation
    const validateConfig = useDebouncedCallback(
        async (values) => {
            const result = await validateEntityTriggerConfig(values, entityTypes);
            updateNodeStatus(nodeId, result.status);
        },
        300 // 300ms debounce
    );

    useEffect(() => {
        const subscription = form.watch((values) => {
            validateConfig(values); // Async, debounced
        });
        return () => subscription.unsubscribe();
    }, [form, validateConfig]);

    return <Form>{/* ... */}</Form>;
};
```

### Anti-Pattern 5: Circular Dependencies Between Nodes and Store

**What:** Node components importing store, store importing node components.

**Why problematic:** Causes module circular dependency warnings. Hard to reason about initialization order.

**Instead:** Keep node components pure (no store imports). Pass data via props. Use registry pattern for component lookup.

**Example of what NOT to do:**

```typescript
// BAD: Node component imports store
// components/nodes/entity-trigger-node.tsx
import { useWorkflowStore } from "../stores/workflow.store";

export const EntityTriggerNode = ({ data }) => {
    const updateConfig = useWorkflowStore((s) => s.updateNodeConfig); // Circular!
    // ...
};

// components/stores/workflow.store.ts
import { EntityTriggerNode } from "../nodes/entity-trigger-node";

export const useWorkflowStore = create(() => ({
    nodeComponents: {
        entity_trigger: EntityTriggerNode, // Circular!
    },
}));
```

**Correct approach:**

```typescript
// GOOD: Pure node components, registry for lookup
// components/nodes/entity-trigger-node.tsx
export const EntityTriggerNode = ({ data }) => {
    // No store imports! Just render based on props
    return <div>{/* ... */}</div>;
};

// config/node-type-registry.ts
import { EntityTriggerNode } from "../nodes/entity-trigger-node";

export const nodeTypeRegistry = {
    entity_trigger: {
        component: EntityTriggerNode,
        // ...
    },
};

// components/workflow-canvas.tsx
const NodeRenderer = ({ type, data }) => {
    const metadata = nodeTypeRegistry[type];
    const Component = metadata.component;
    return <Component data={data} />;
};
```

## Integration Points with Existing Architecture

### 1. Entity Type System

**Integration:** Workflow builder consumes existing EntityTypeService and TanStack Query hooks.

**Pattern:**

```typescript
// Use existing hooks
const { data: entityTypes } = useEntityTypes(workspaceId);
const { data: entityType } = useEntityType(workspaceId, entityTypeKey);

// Node configuration forms use entity types
const EntityTriggerConfig = ({ config }) => {
    const { data: entityTypes } = useEntityTypes(workspaceId);

    return (
        <Select
            value={config.entityTypeKey}
            onChange={(value) => updateConfig({ entityTypeKey: value })}
        >
            {entityTypes?.map((type) => (
                <SelectItem key={type.key} value={type.key}>
                    {type.name}
                </SelectItem>
            ))}
        </Select>
    );
};
```

**Benefits:**
- Reuse existing API layer
- Leverage TanStack Query caching (entity types cached across app)
- Type-safe entity selection

### 2. Workspace Scoping

**Integration:** Follow existing `/dashboard/organisation/[workspaceId]/...` routing pattern.

**Pattern:**

```typescript
// app/dashboard/organisation/[workspaceId]/workflows/page.tsx
export default function WorkflowsListPage({ params }) {
    const { workspaceId } = params;
    const { data: workflows } = useWorkflows(workspaceId);

    return <WorkflowsList workflows={workflows} />;
}

// app/dashboard/organisation/[workspaceId]/workflows/[workflowId]/page.tsx
export default function WorkflowEditorPage({ params }) {
    const { workspaceId, workflowId } = params;

    return (
        <WorkflowProvider workspaceId={workspaceId} workflowId={workflowId}>
            <WorkflowEditor />
        </WorkflowProvider>
    );
}
```

**Benefits:**
- Consistent with existing platform routing
- Multi-tenant isolation enforced by route structure
- Server-side workspace validation via middleware

### 3. Form Management Patterns

**Integration:** Use React Hook Form + Zod for node configuration forms, same as entity forms.

**Pattern:**

```typescript
// Similar to entity attribute forms
const EntityTriggerConfig = ({ nodeId, config }) => {
    const form = useForm<EntityTriggerConfigValues>({
        resolver: zodResolver(entityTriggerConfigSchema),
        defaultValues: config,
    });

    const onSubmit = (values: EntityTriggerConfigValues) => {
        updateNodeConfig(nodeId, values);
        closeConfigPanel();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="entityTypeKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Entity Type</FormLabel>
                            <Select {...field}>
                                {/* ... */}
                            </Select>
                        </FormItem>
                    )}
                />
                {/* ... */}
            </form>
        </Form>
    );
};
```

**Benefits:**
- Reuse form validation patterns
- Consistent UX with entity configuration
- Type-safe form values

### 4. Drawer-Based Configuration Panel

**Integration:** Use shadcn Drawer component for node configuration, similar to entity detail views.

**Pattern:**

```typescript
// Similar to entity drawer pattern
const WorkflowEditor = () => {
    const selectedNodeId = useWorkflow((s) => s.selectedNodeId);
    const setSelectedNodeId = useWorkflow((s) => s.setSelectedNodeId);

    return (
        <>
            <WorkflowCanvas />

            <Drawer
                open={selectedNodeId !== null}
                onOpenChange={(open) => !open && setSelectedNodeId(null)}
            >
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Configure Node</DrawerTitle>
                    </DrawerHeader>
                    <NodeConfigPanel nodeId={selectedNodeId} />
                </DrawerContent>
            </Drawer>
        </>
    );
};
```

**Benefits:**
- Consistent with existing platform UX
- Mobile-friendly (drawer slides up on mobile)
- Non-blocking (canvas still visible)

### 5. Feature Module Structure

**Integration:** Follow existing feature module pattern.

**Structure:**

```
components/feature-modules/workflow/
├── components/
│   ├── workflow-canvas.tsx
│   ├── node-library.tsx
│   ├── node-config-panel.tsx
│   ├── nodes/
│   │   ├── entity-trigger-node.tsx
│   │   ├── condition-node.tsx
│   │   └── action-node.tsx
│   └── config/
│       ├── entity-trigger-config.tsx
│       └── condition-config.tsx
├── config/
│   ├── node-type-registry.ts
│   └── workflow.config.ts
├── context/
│   └── workflow-provider.tsx
├── hooks/
│   ├── query/
│   │   ├── use-workflows.ts
│   │   └── use-workflow.ts
│   └── mutation/
│       ├── use-save-workflow.ts
│       └── use-delete-workflow.ts
├── interface/
│   └── workflow.interface.ts (re-exports OpenAPI types)
├── service/
│   └── workflow.service.ts (static class)
├── stores/
│   └── workflow.store.ts (Zustand)
└── util/
    ├── connection-validator.util.ts
    └── workflow-serializer.util.ts
```

**Benefits:**
- Predictable structure for maintainability
- Clear separation of concerns
- Easy to locate code

## State Management Strategy

### What Goes Where

| State Type | Storage | Rationale | Examples |
|------------|---------|-----------|----------|
| **Graph structure** | Zustand (WorkflowStore) | Complex, needs undo/redo, shared across components | `nodes`, `edges`, `history` |
| **Server data** | TanStack Query | Caching, refetching, optimistic updates | Entity types, saved workflows, workflow list |
| **XYFlow internals** | XYFlow | Managed by library, frequent updates | Viewport (zoom, pan), drag state, edge animation |
| **UI state (local)** | React useState | Component-specific, not shared | Search filter in node library, drawer open state |
| **UI state (global)** | Zustand (WorkflowStore) | Shared across components, infrequent updates | `selectedNodeId`, `isDirty`, config panel mode |
| **Form state** | React Hook Form | Temporary, validation-heavy | Node configuration forms |

### Zustand Store Slices

Split store into logical slices for organization:

```typescript
interface WorkflowStore {
    // Graph slice
    graph: {
        nodes: Node[];
        edges: Edge[];
        addNode: (node: Node) => void;
        updateNode: (id: string, updates: Partial<Node>) => void;
        deleteNode: (id: string) => void;
        addEdge: (edge: Edge) => void;
        deleteEdge: (id: string) => void;
    };

    // UI slice
    ui: {
        selectedNodeId: string | null;
        isDirty: boolean;
        setSelectedNodeId: (id: string | null) => void;
        setDirty: (isDirty: boolean) => void;
    };

    // History slice
    history: {
        past: WorkflowSnapshot[];
        future: WorkflowSnapshot[];
        undo: () => void;
        redo: () => void;
        saveSnapshot: () => void;
        canUndo: boolean;
        canRedo: boolean;
    };

    // Persistence slice
    persistence: {
        save: () => Promise<void>;
        load: (workflowId: string) => Promise<void>;
        serialize: () => WorkflowDefinition;
        deserialize: (definition: WorkflowDefinition) => void;
    };
}
```

**Access pattern:**

```typescript
// Select specific slice
const nodes = useWorkflow((s) => s.graph.nodes);
const addNode = useWorkflow((s) => s.graph.addNode);

// Multiple selections (avoid re-renders)
const { selectedNodeId, setSelectedNodeId } = useWorkflow((s) => ({
    selectedNodeId: s.ui.selectedNodeId,
    setSelectedNodeId: s.ui.setSelectedNodeId,
}));
```

## Suggested Build Order

Build in dependency order to minimize rework:

### Phase 1: Foundation

**Goal:** Minimal workflow canvas with XYFlow rendering.

1. **WorkflowCanvas component** — XYFlow wrapper with basic configuration
2. **WorkflowStore (minimal)** — Just `nodes` and `edges` arrays with add/delete
3. **WorkflowProvider** — Context setup with store creation
4. **NodeTypeRegistry** — Single example node type (e.g., "trigger")
5. **Basic node component** — Render node with label, single handle
6. **WorkflowService** — Stub methods (no backend yet)
7. **Route setup** — `/workflows` list, `/workflows/new` editor pages

**Validation:** Can add nodes to canvas, see them render, drag to reposition.

### Phase 2: Node Library & Configuration

**Goal:** Users can select node types and configure them.

1. **NodeLibrary component** — Sidebar with node type list
2. **Drag-and-drop** — NodeLibrary → WorkflowCanvas integration
3. **Node selection** — Click node → highlight, store selectedNodeId
4. **ConfigPanel component** — Drawer with node config form
5. **Node config forms** — Entity trigger config with entity type selector
6. **Entity integration** — Use existing `useEntityTypes` hook
7. **WorkflowStore updates** — `updateNodeConfig`, `setSelectedNodeId`

**Validation:** Can drag nodes from library, configure entity trigger to select entity type.

### Phase 3: Connections & Validation

**Goal:** Users can connect nodes with validation.

1. **Handle configuration** — Add input/output handles to node types
2. **Connection creation** — XYFlow `onConnect` callback
3. **ConnectionValidator** — Basic validation (no self-loops, no duplicates)
4. **Visual feedback** — Red highlight on invalid connection attempt
5. **Edge storage** — WorkflowStore `addEdge`, `deleteEdge`
6. **Advanced validation** — Type checking, entity schema validation
7. **Cycle detection** — Prevent cycles in graph

**Validation:** Can connect compatible nodes, prevented from creating invalid connections.

### Phase 4: Persistence

**Goal:** Workflows save to backend and load from database.

1. **Serialization** — WorkflowStore `serialize()` method
2. **Deserialization** — WorkflowStore `deserialize()` method
3. **WorkflowService implementation** — Real API calls (requires backend)
4. **Save mutation** — `useSaveWorkflow` hook with TanStack Query
5. **Load workflow** — Fetch on mount, deserialize to store
6. **Dirty tracking** — WorkflowStore `isDirty` flag, update on mutations
7. **Save button** — UI with loading state, success/error toast

**Validation:** Can save workflow, reload page, workflow loads from server.

### Phase 5: Undo/Redo

**Goal:** Users can undo/redo changes.

1. **History state** — WorkflowStore `past`, `future` arrays
2. **Snapshot creation** — `saveSnapshot()` before mutations
3. **Undo/redo actions** — Pop from past/future, update graph
4. **Keyboard shortcuts** — Ctrl+Z, Ctrl+Shift+Z handlers
5. **UI indicators** — Disable undo/redo buttons when stacks empty
6. **History limits** — Cap at 50 snapshots to prevent memory issues

**Validation:** Can undo node additions/deletions/moves, redo after undo.

### Phase 6: Node Type Expansion

**Goal:** Add more node types (conditions, actions).

1. **Condition node** — If/else logic node with config
2. **Action node** — Entity update action with field mapping
3. **Node type registry expansion** — Add new types to registry
4. **Validation logic** — Port type checking per node type
5. **Config forms** — Specialized forms per node type

**Validation:** Can build workflow with triggers, conditions, actions.

### Phase 7: Polish

**Goal:** Production-ready UX.

1. **Node search/filter** — Search box in NodeLibrary
2. **Canvas controls** — Zoom in/out buttons, fit-to-view
3. **Multi-select** — Marquee selection, multi-delete
4. **Visual error indicators** — Color-coded node status (green/yellow/red)
5. **Auto-save** — Debounced save on isDirty change
6. **Loading states** — Skeletons while loading workflow
7. **Empty states** — "Drag node to start" prompt

**Validation:** Polished, professional workflow editor UX.

## Performance Considerations

### 1. Large Workflows (50+ nodes)

**Challenge:** XYFlow re-renders all nodes on viewport change.

**Mitigations:**
- **Memoize node components:** Use `React.memo()` on node components
- **Minimize node data:** Keep node `data` prop small (use IDs, not full objects)
- **Virtualization:** XYFlow supports viewport-based rendering (only visible nodes)
- **Limit connections:** Warn when workflow exceeds recommended size (30-50 nodes)

### 2. Frequent Store Updates

**Challenge:** Every node drag triggers store update, causing re-renders.

**Mitigations:**
- **Selector-based subscriptions:** Use Zustand selectors to subscribe to specific state
- **Debounce position updates:** Update store on drag end, not during drag
- **Let XYFlow manage positions:** Only sync to store on significant events (save, undo)

### 3. Connection Validation

**Challenge:** Type checking + entity schema validation on every connection attempt.

**Mitigations:**
- **Cache entity types:** TanStack Query caches entity types, avoid refetch
- **Memoize validation functions:** Use `useMemo` for validation results
- **Lazy validation:** Skip expensive checks until user attempts connection

### 4. History Management

**Challenge:** Storing 50 snapshots of large workflows consumes memory.

**Mitigations:**
- **Structural sharing:** Use immer for immutable updates (shares unchanged data)
- **Compress snapshots:** Store diffs instead of full snapshots (advanced)
- **Limit history:** Cap at 50 snapshots, drop oldest when exceeded

## Scalability Path

### Small Workflows (5-10 nodes)

**Current architecture sufficient.** All patterns scale to this size.

### Medium Workflows (10-30 nodes)

**Add optimizations:**
- Memoize node components
- Debounce validation
- Implement auto-layout for readability

### Large Workflows (30-50 nodes)

**Architectural enhancements:**
- Subflows (extract reusable sections into separate workflows)
- Minimap for navigation
- Search/jump-to-node
- Warn users approaching complexity limit

### Very Large Workflows (50+ nodes)

**Discourage via UX:**
- Show warning at 30 nodes: "Consider splitting into subflows"
- Block at 50 nodes: "Maximum workflow size reached"
- Guide users to modular workflow design

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Canvas library** | XYFlow 12.x | Industry standard, maintained, extensive features, TypeScript support |
| **State management** | Zustand | Lightweight, used internally by XYFlow, good TypeScript support, simple API |
| **Server state** | TanStack Query | Already used in platform, caching, optimistic updates |
| **Forms** | React Hook Form + Zod | Already used in platform, type-safe validation |
| **Undo/redo** | Snapshot-based | Simpler than action-based, sufficient for workflow sizes (<50 nodes) |
| **Validation** | Multi-stage pipeline | Composable, testable, extensible for new validation rules |
| **Persistence** | Service layer + mutations | Consistent with platform patterns, type-safe |
| **Component registry** | Static object | Simpler than DI container, compile-time type checking |
| **Config UI** | Drawer | Consistent with platform, non-blocking, mobile-friendly |

## Sources

**XYFlow/ReactFlow Architecture:**
- [Building a Flow - React Flow](https://reactflow.dev/learn/concepts/building-a-flow)
- [Workflow Editor - React Flow](https://reactflow.dev/ui/templates/workflow-editor)
- [Using a State Management Library - React Flow](https://reactflow.dev/learn/advanced-use/state-management)
- [Custom Nodes - React Flow](https://reactflow.dev/learn/customization/custom-nodes)

**State Management Patterns:**
- [Synergy Codes — State management in React Flow](https://www.synergycodes.com/blog/state-management-in-react-flow)
- [Modern React State Management in 2025](https://dev.to/joodi/modern-react-state-management-in-2025-a-practical-guide-2j8f)

**Undo/Redo Patterns:**
- [Undo and Redo - React Flow](https://reactflow.dev/examples/interaction/undo-redo)
- [Build a Reusable Undo/Redo State Manager in React](https://medium.com/@kom50/build-a-reusable-undo-redo-state-manager-in-react-with-persistence-support-ef91e7792d66)
- [use-undo-manager: React hook for undo/redo history management](https://github.com/pvvng/use-undo-manager)

**Validation & Connection Patterns:**
- [Node-Based Workflow System - InvokeAI](https://deepwiki.com/invoke-ai/InvokeAI/6-node-based-workflow-system)
- [Registry Pattern - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/registry-pattern/)
- [From If-Else Hell to Clean Architecture with Function Registry Pattern](https://techhub.iodigital.com/articles/function-registry-pattern-react)

**Persistence Patterns:**
- [Durable execution - LangGraph](https://docs.langchain.com/oss/python/langgraph/durable-execution)
- [Cloudflare Workflows: production-ready durable execution](https://blog.cloudflare.com/workflows-ga-production-ready-durable-execution/)
- [Database-Backed Workflow Orchestration - InfoQ](https://www.infoq.com/news/2025/11/database-backed-workflow/)

**Entity Integration Patterns:**
- [How to Build a Data Integration Workflow in 2025](https://airbyte.com/data-engineering-resources/data-integration-workflow)
- [Dynamic schema handling options](https://docs.informatica.com/integration-cloud/cloud-data-integration/current-version/tasks/mapping-tasks/schema-change-handling/dynamic-schema-handling-options.html)
- [Workflow Management Database Design](https://budibase.com/blog/data/workflow-management-database-design/)

---

*Architecture research for: Visual Workflow Builder with Entity Model Integration*
*Researched: 2026-01-19*
*Confidence: HIGH (based on XYFlow documentation, production workflow builder examples, and established React patterns)*
