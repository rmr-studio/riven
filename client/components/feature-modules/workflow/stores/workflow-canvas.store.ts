import {
    applyEdgeChanges,
    applyNodeChanges,
    type Edge,
    type EdgeChange,
    type Node,
    type NodeChange,
} from "@xyflow/react";
import { create, type StoreApi } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { WorkflowNodeConfigField } from "@/lib/types/models/WorkflowNodeConfigField";
import type { WorkflowNodeData } from "../interface/workflow.interface";

/**
 * State shape for workflow canvas store
 */
export interface WorkflowCanvasState {
    /** Array of workflow nodes */
    nodes: Node<WorkflowNodeData>[];
    /** Array of edges connecting nodes */
    edges: Edge[];
    /** ID of currently selected node, null if none selected */
    selectedNodeId: string | null;
    /** Node configuration schemas keyed by backend node type identifier */
    nodeConfigSchemas: Record<string, WorkflowNodeConfigField[]> | null;
    /** Whether schemas are currently loading */
    schemasLoading: boolean;

    /**
     * Handler for React Flow node changes (drag, select, remove, etc.)
     * Pass directly to ReactFlow's onNodesChange prop
     */
    onNodesChange: (changes: NodeChange<Node<WorkflowNodeData>>[]) => void;

    /**
     * Handler for React Flow edge changes (select, remove, etc.)
     * Pass directly to ReactFlow's onEdgesChange prop
     */
    onEdgesChange: (changes: EdgeChange<Edge>[]) => void;

    /**
     * Add a new node to the canvas
     */
    addNode: (node: Node<WorkflowNodeData>) => void;

    /**
     * Update the position of an existing node
     */
    updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;

    /**
     * Remove a node and its connected edges
     */
    removeNode: (nodeId: string) => void;

    /**
     * Add a new edge connecting two nodes
     */
    addEdge: (edge: Edge) => void;

    /**
     * Clear all nodes and edges from the canvas
     */
    clearCanvas: () => void;

    /**
     * Select a node or clear selection
     * Pass node ID to select, or null to deselect
     */
    selectNode: (nodeId: string | null) => void;

    /**
     * Update a node's data by merging new data into existing data
     * @param nodeId - ID of the node to update
     * @param data - Partial data to merge into existing node data
     */
    updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;

    /**
     * Set node configuration schemas
     * Called by the provider after fetching from backend
     */
    setNodeConfigSchemas: (schemas: Record<string, WorkflowNodeConfigField[]>) => void;

    /**
     * Set schemas loading state
     */
    setSchemasLoading: (loading: boolean) => void;
}

/**
 * Factory function to create a workflow canvas store instance
 * Following the pattern from entity configuration store
 *
 * @returns StoreApi for the workflow canvas state
 */
export const createWorkflowCanvasStore = (): StoreApi<WorkflowCanvasState> => {
    return create<WorkflowCanvasState>()(
        subscribeWithSelector((set, get) => ({
            // Initial state
            nodes: [],
            edges: [],
            selectedNodeId: null,
            nodeConfigSchemas: null,
            schemasLoading: true,

            onNodesChange: (changes) => {
                set({
                    nodes: applyNodeChanges(changes, get().nodes),
                });
            },

            onEdgesChange: (changes) => {
                set({
                    edges: applyEdgeChanges(changes, get().edges),
                });
            },

            addNode: (node) => {
                set({
                    nodes: [...get().nodes, node],
                });
            },

            updateNodePosition: (nodeId, position) => {
                set({
                    nodes: get().nodes.map((node) =>
                        node.id === nodeId ? { ...node, position } : node
                    ),
                });
            },

            removeNode: (nodeId) => {
                const { nodes, edges } = get();
                set({
                    nodes: nodes.filter((node) => node.id !== nodeId),
                    edges: edges.filter(
                        (edge) => edge.source !== nodeId && edge.target !== nodeId
                    ),
                });
            },

            addEdge: (edge) => {
                set({
                    edges: [...get().edges, edge],
                });
            },

            clearCanvas: () => {
                set({
                    nodes: [],
                    edges: [],
                    selectedNodeId: null,
                });
            },

            selectNode: (nodeId) => {
                set({ selectedNodeId: nodeId });
            },

            updateNodeData: (nodeId, newData) => {
                set({
                    nodes: get().nodes.map((node) =>
                        node.id === nodeId
                            ? { ...node, data: { ...node.data, ...newData } }
                            : node
                    ),
                });
            },

            setNodeConfigSchemas: (schemas) => {
                set({ nodeConfigSchemas: schemas, schemasLoading: false });
            },

            setSchemasLoading: (loading) => {
                set({ schemasLoading: loading });
            },
        }))
    );
};
