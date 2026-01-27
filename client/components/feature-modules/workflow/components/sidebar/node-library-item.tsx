"use client";

import type { DragEvent } from "react";
import { cn } from "@/lib/util/utils";
import type { NodeTypeDefinition } from "../../config/node-types.config";

export interface NodeLibraryItemProps {
    /** Node type definition to display */
    definition: NodeTypeDefinition;
    /** Callback when item is clicked to add to canvas */
    onClickAdd?: (type: string) => void;
}

/** Color classes for each node category */
const categoryColors: Record<string, string> = {
    trigger: "border-l-amber-500",
    action: "border-l-blue-500",
    condition: "border-l-purple-500",
};

/** Background hover colors for each category */
const categoryHoverColors: Record<string, string> = {
    trigger: "hover:bg-amber-500/10",
    action: "hover:bg-blue-500/10",
    condition: "hover:bg-purple-500/10",
};

/**
 * Draggable node item for the library sidebar
 * Displays node icon, label, and description with category-colored accent
 */
export function NodeLibraryItem({ definition, onClickAdd }: NodeLibraryItemProps) {
    const Icon = definition.icon;

    const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData("application/reactflow", definition.type);
        event.dataTransfer.effectAllowed = "move";
    };

    const handleClick = () => {
        onClickAdd?.(definition.type);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={handleClick}
            className={cn(
                "flex items-start gap-3 rounded-md border border-l-4 bg-card p-3",
                "cursor-grab transition-colors",
                "active:cursor-grabbing",
                categoryColors[definition.category],
                categoryHoverColors[definition.category]
            )}
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-0.5 overflow-hidden">
                <span className="truncate text-sm font-medium">{definition.label}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                    {definition.description}
                </span>
            </div>
        </div>
    );
}
