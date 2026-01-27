"use client";

import { MiniMap } from "@xyflow/react";
import type {
    WorkflowNode,
    WorkflowNodeType,
} from "../../interface/workflow.interface";

/**
 * Color mapping for node types in the minimap
 */
const NODE_TYPE_COLORS: Record<WorkflowNodeType, string> = {
    trigger: "#f59e0b", // amber
    action: "#3b82f6", // blue
    condition: "#a855f7", // purple
};

/**
 * Default color for unknown node types
 */
const DEFAULT_NODE_COLOR = "#e5e7eb"; // gray

/**
 * Get the color for a node based on its type
 */
const getNodeColor = (node: WorkflowNode): string => {
    const nodeType = node.data?.type;

    if (nodeType && nodeType in NODE_TYPE_COLORS) {
        return NODE_TYPE_COLORS[nodeType];
    }

    return DEFAULT_NODE_COLOR;
};

/**
 * Minimap component for viewport overview
 *
 * Shows a small overview of the entire canvas in the bottom-right
 * corner, with nodes color-coded by their type (trigger, action, condition).
 */
export const CanvasMinimap = () => {
    return (
        <MiniMap
            position="bottom-right"
            nodeColor={getNodeColor}
            className="!bg-background !border-border !shadow-sm !w-40 !h-32"
            maskColor="var(--color-background)"
            style={{ opacity: 0.95 }}
        />
    );
};
