"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/util/utils";
import type { WorkflowNode } from "../../interface/workflow.interface";

/**
 * Type-specific styling for node variants
 * Includes border color and icon background colors
 */
const typeStyles = {
    trigger: {
        border: "border-l-4 border-l-amber-500",
        iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    },
    action: {
        border: "border-l-4 border-l-blue-500",
        iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    condition: {
        border: "border-l-4 border-l-purple-500",
        iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    },
};

/**
 * Base workflow node component
 * Provides consistent structure and styling across all node types
 */
export const BaseWorkflowNode = memo(function BaseWorkflowNode({
    data,
    selected,
}: NodeProps<WorkflowNode>) {
    const Icon = data.icon;
    const styles = typeStyles[data.type];

    return (
        <div
            className={cn(
                "bg-card rounded-lg shadow-sm border border-border",
                "min-w-[200px]",
                styles.border,
                selected && "ring-2 ring-primary ring-offset-2"
            )}
        >
            {/* Header section with icon and label */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <div className={cn("p-1.5 rounded", styles.iconBg)}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">{data.label}</span>
            </div>

            {/* Body section with description */}
            <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground">{data.description}</p>
            </div>

            {/* Target handle (input) at top */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-muted-foreground !border-2 !border-background !w-3 !h-3"
            />

            {/* Source handle (output) at bottom */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-muted-foreground !border-2 !border-background !w-3 !h-3"
            />
        </div>
    );
});

BaseWorkflowNode.displayName = "BaseWorkflowNode";
