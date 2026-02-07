"use client";

import { MiniMap } from "@xyflow/react";
import { WorkflowNodeType, WorkflowStepNode } from "@/lib/types/workflow";

/**
 * Color mapping for node types in the minimap
 */
const NODE_TYPE_COLORS: Record<WorkflowNodeType, string> = {
    [WorkflowNodeType.Trigger]: "#f59e0b", // amber
    [WorkflowNodeType.Action]: "#3b82f6", // blue
    [WorkflowNodeType.ControlFlow]: "#a855f7", // purple
    [WorkflowNodeType.Function]: "#22c55e", // green
    [WorkflowNodeType.Utility]: "#06b6d4", // cyan
    [WorkflowNodeType.Parse]: "#f97316", // orange
};

/**
 * Default color for unknown node types
 */
const DEFAULT_NODE_COLOR = "#e5e7eb"; // gray

/**
 * Get the color for a node based on its type
 */
const getNodeColor = (node: WorkflowStepNode): string => {
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
