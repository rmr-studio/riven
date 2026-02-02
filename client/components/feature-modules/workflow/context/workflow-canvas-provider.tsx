"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import {
    createWorkflowCanvasStore,
    type WorkflowCanvasState,
} from "../stores/workflow-canvas.store";
import { useNodeConfigSchemas as useNodeConfigSchemasQuery } from "../hooks/query/use-node-config-schemas";

/**
 * Type alias for the store API returned by the factory
 */
type WorkflowCanvasStoreApi = ReturnType<typeof createWorkflowCanvasStore>;

/**
 * Context for the workflow canvas store
 * Undefined when accessed outside provider
 */
const WorkflowCanvasContext = createContext<WorkflowCanvasStoreApi | undefined>(
    undefined
);

/**
 * Props for the WorkflowCanvasProvider component
 */
export interface WorkflowCanvasProviderProps {
    /** Child components that can access the workflow canvas store */
    children: ReactNode;
    /** Workspace ID for scoping the workflow */
    workspaceId: string;
    /** Optional workflow ID when editing an existing workflow */
    workflowId?: string;
}

/**
 * Provider component that creates and manages the workflow canvas store
 *
 * Wraps child components with access to the workflow canvas state.
 * The store is created once per provider instance and persists for
 * the lifetime of the provider.
 *
 * @example
 * <WorkflowCanvasProvider workspaceId="ws-123" workflowId="wf-456">
 *   <WorkflowEditor />
 * </WorkflowCanvasProvider>
 */
export const WorkflowCanvasProvider = ({
    children,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    workspaceId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    workflowId,
}: WorkflowCanvasProviderProps) => {
    // Store reference to prevent recreation on re-renders
    const storeRef = useRef<WorkflowCanvasStoreApi | null>(null);

    // Create store only once per provider instance
    if (!storeRef.current) {
        storeRef.current = createWorkflowCanvasStore();
    }

    // Fetch node config schemas and sync to store
    const { data: schemas, isLoading: schemasLoading } = useNodeConfigSchemasQuery();

    useEffect(() => {
        if (!storeRef.current) return;

        const store = storeRef.current.getState();
        store.setSchemasLoading(schemasLoading);

        if (schemas) {
            store.setNodeConfigSchemas(schemas);
        }
    }, [schemas, schemasLoading]);

    return (
        <WorkflowCanvasContext.Provider value={storeRef.current}>
            {children}
        </WorkflowCanvasContext.Provider>
    );
};

/**
 * Hook to access the workflow canvas store with a selector
 *
 * Uses selector pattern for optimal re-render performance.
 * Only components that use the selected state will re-render when
 * that specific part of state changes.
 *
 * @param selector - Function to select a slice of state
 * @returns The selected state slice
 * @throws Error if used outside of WorkflowCanvasProvider
 *
 * @example
 * // Select specific state
 * const nodes = useWorkflowCanvas((state) => state.nodes);
 *
 * // Select action
 * const addNode = useWorkflowCanvas((state) => state.addNode);
 *
 * // Select multiple items (use shallow comparison for optimal performance)
 * const { nodes, edges } = useWorkflowCanvas(
 *   (state) => ({ nodes: state.nodes, edges: state.edges }),
 *   shallow
 * );
 */
export const useWorkflowCanvas = <T,>(
    selector: (state: WorkflowCanvasState) => T
): T => {
    const context = useContext(WorkflowCanvasContext);

    if (!context) {
        throw new Error(
            "useWorkflowCanvas must be used within a WorkflowCanvasProvider. " +
                "Wrap your component tree with <WorkflowCanvasProvider>."
        );
    }

    return useStore(context, selector);
};

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to get all workflow nodes
 *
 * @returns Array of workflow nodes
 */
export const useWorkflowNodes = () => {
    return useWorkflowCanvas((state) => state.nodes);
};

/**
 * Hook to get all workflow edges
 *
 * @returns Array of workflow edges
 */
export const useWorkflowEdges = () => {
    return useWorkflowCanvas((state) => state.edges);
};

/**
 * Hook to get the addNode action
 *
 * @returns Function to add a node to the canvas
 */
export const useAddNode = () => {
    return useWorkflowCanvas((state) => state.addNode);
};

/**
 * Hook to get node change handler for React Flow
 *
 * @returns onNodesChange handler compatible with ReactFlow
 */
export const useOnNodesChange = () => {
    return useWorkflowCanvas((state) => state.onNodesChange);
};

/**
 * Hook to get edge change handler for React Flow
 *
 * @returns onEdgesChange handler compatible with ReactFlow
 */
export const useOnEdgesChange = () => {
    return useWorkflowCanvas((state) => state.onEdgesChange);
};

/**
 * Hook to get the clearCanvas action
 *
 * @returns Function to clear all nodes and edges
 */
export const useClearCanvas = () => {
    return useWorkflowCanvas((state) => state.clearCanvas);
};

/**
 * Get the currently selected node ID
 *
 * @returns Selected node ID, or null if no node is selected
 */
export const useSelectedNodeId = () => {
    return useWorkflowCanvas((state) => state.selectedNodeId);
};

/**
 * Get the selectNode action for selecting/deselecting nodes
 *
 * @returns Function to select a node (pass ID) or deselect (pass null)
 */
export const useSelectNode = () => {
    return useWorkflowCanvas((state) => state.selectNode);
};

/**
 * Get the updateNodeData action for updating node configuration
 *
 * @returns Function to merge data into existing node data
 */
export const useUpdateNodeData = () => {
    return useWorkflowCanvas((state) => state.updateNodeData);
};

/**
 * Get the full data for the currently selected node
 *
 * @returns The selected node, or undefined if no node is selected
 */
export const useSelectedNode = () => {
    const nodes = useWorkflowCanvas((state) => state.nodes);
    const selectedNodeId = useWorkflowCanvas((state) => state.selectedNodeId);
    return nodes.find((node) => node.id === selectedNodeId);
};

/**
 * Get node configuration schemas from the store
 *
 * @returns Record of node type identifiers to their config field definitions, or null if not loaded
 */
export const useNodeConfigSchemas = () => {
    return useWorkflowCanvas((state) => state.nodeConfigSchemas);
};

/**
 * Get schemas loading state
 *
 * @returns Whether schemas are currently loading
 */
export const useSchemasLoading = () => {
    return useWorkflowCanvas((state) => state.schemasLoading);
};
