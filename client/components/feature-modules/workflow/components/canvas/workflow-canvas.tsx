"use client";

import { useCallback } from "react";
import { ReactFlow, ReactFlowProvider, useReactFlow, type NodeMouseHandler } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { WorkflowNodeMetadata } from "@/lib/types/workflow";
import {
    useWorkflowNodes,
    useWorkflowEdges,
    useOnNodesChange,
    useOnEdgesChange,
    useAddNode,
    useSelectNode,
    useNodeConfig,
} from "../../context/workflow-canvas-provider";
import { CanvasBackground } from "../ui/canvas-background";
import { CanvasControls } from "../ui/canvas-controls";
import { CanvasMinimap } from "../ui/canvas-minimap";
import { CanvasEmptyState } from "./empty-state";
import { nodeTypes } from "../../config/node-types.config";
import { createWorkflowNode } from "../../util/node-factory.util";
import { WorkflowSidebar } from "../sidebar/workflow-sidebar";

/**
 * Props for WorkflowCanvasInner component
 */
interface WorkflowCanvasInnerProps {
    workspaceId: string;
}

/**
 * Inner canvas component that uses React Flow hooks
 *
 * Must be wrapped in ReactFlowProvider to access useReactFlow hooks
 * in child components.
 */
const WorkflowCanvasInner = ({ workspaceId }: WorkflowCanvasInnerProps) => {
    const nodes = useWorkflowNodes();
    const edges = useWorkflowEdges();
    const onNodesChange = useOnNodesChange();
    const onEdgesChange = useOnEdgesChange();
    const { screenToFlowPosition } = useReactFlow();
    const addNode = useAddNode();
    const selectNode = useSelectNode();
    const nodeConfig = useNodeConfig();

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const nodeTypeKey = event.dataTransfer.getData("application/reactflow");
            const metadataJson = event.dataTransfer.getData("application/reactflow-metadata");

            if (!nodeTypeKey || !metadataJson) return;

            let metadata: WorkflowNodeMetadata;
            try {
                metadata = JSON.parse(metadataJson);
            } catch {
                // Fallback to looking up from store if parse fails
                if (!nodeConfig?.[nodeTypeKey]) return;
                metadata = nodeConfig[nodeTypeKey];
            }

            // Use clientX/clientY for correct position calculation
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = createWorkflowNode(nodeTypeKey, metadata, position);
            addNode(newNode);
        },
        [screenToFlowPosition, addNode, nodeConfig]
    );

    const handleClickToAdd = useCallback(
        (nodeTypeKey: string, metadata: WorkflowNodeMetadata) => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const staggerOffset = nodes.length * 20;

            const position = screenToFlowPosition({
                x: viewportWidth / 2 + staggerOffset,
                y: viewportHeight / 2 + staggerOffset,
            });

            const newNode = createWorkflowNode(nodeTypeKey, metadata, position);
            addNode(newNode);
        },
        [nodes.length, screenToFlowPosition, addNode]
    );

    // Handle node click - select node and open drawer
    const onNodeClick: NodeMouseHandler = useCallback(
        (_event, node) => {
            selectNode(node.id);
        },
        [selectNode]
    );

    // Handle pane (background) click - deselect and close drawer
    const onPaneClick = useCallback(() => {
        selectNode(null);
    }, [selectNode]);

    return (
        <div className="flex h-full w-full">
            <div className="flex-1 h-full relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    minZoom={0.5}
                    maxZoom={1.5}
                    fitView
                    panOnDrag={true}
                    zoomOnScroll={true}
                    zoomOnPinch={true}
                    selectNodesOnDrag={false}
                    proOptions={{ hideAttribution: true }}
                >
                    <CanvasBackground />
                    <CanvasMinimap />
                    <CanvasControls />
                    {nodes.length === 0 && <CanvasEmptyState />}
                </ReactFlow>
            </div>
            <WorkflowSidebar workspaceId={workspaceId} onClickAdd={handleClickToAdd} />
        </div>
    );
};

/**
 * Props for WorkflowCanvas component
 */
interface WorkflowCanvasProps {
    workspaceId: string;
}

/**
 * Main workflow canvas component
 *
 * Provides the visual editing surface for workflow nodes and edges.
 * Features:
 * - Dot grid background for visual structure
 * - Pan by dragging the background
 * - Zoom with mouse wheel (50%-150% range)
 * - Minimap in bottom-right showing node positions
 * - Controls in bottom-left with zoom +/- and fit view
 * - Empty state when no nodes exist
 * - Unified sidebar with animated transitions between node library and config drawer
 *
 * All state is managed through Zustand store via context hooks,
 * enabling external control of the canvas state.
 *
 * @example
 * <WorkflowCanvasProvider workspaceId="ws-123">
 *   <WorkflowCanvas workspaceId="ws-123" />
 * </WorkflowCanvasProvider>
 */
export const WorkflowCanvas = ({ workspaceId }: WorkflowCanvasProps) => {
    return (
        <div className="h-full w-full">
            <ReactFlowProvider>
                <WorkflowCanvasInner workspaceId={workspaceId} />
            </ReactFlowProvider>
        </div>
    );
};
