"use client";

import { useState } from "react";
import { cn } from "@/lib/util/utils";
import { categoryMeta } from "../../config/node-types.config";
import type { WorkflowNodeType } from "../../interface/workflow.interface";
import { useNodeLibrary } from "../../hooks/use-node-library";
import { NodeLibrarySearch } from "./node-library-search";
import { NodeCategorySection } from "./node-category-section";

export interface NodeLibrarySidebarProps {
    /** Callback when a node is clicked to add to canvas */
    onClickAdd?: (type: string) => void;
    /** Optional additional className */
    className?: string;
}

/** Order of categories to display */
const categoryOrder: WorkflowNodeType[] = ["trigger", "action", "condition"];

/**
 * Sidebar component displaying available workflow nodes organized by category
 * Includes search filtering and draggable node items
 *
 * Collapse/expand functionality is managed by the parent WorkflowSidebar component
 */
export function NodeLibrarySidebar({ onClickAdd, className }: NodeLibrarySidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const { filteredNodes, hasResults } = useNodeLibrary(searchQuery);

    return (
        <aside
            className={cn(
                "flex h-full flex-col bg-background",
                className
            )}
        >
            <div className="border-b p-4 px-5">
                <h2 className="mb-3 text-sm font-semibold">Node Library</h2>
                <NodeLibrarySearch value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {hasResults ? (
                    <div className="flex flex-col gap-4">
                        {categoryOrder.map((category) => {
                            const meta = categoryMeta[category];
                            const nodes = filteredNodes[category];

                            return (
                                <NodeCategorySection
                                    key={category}
                                    category={category}
                                    label={meta.label}
                                    icon={meta.icon}
                                    nodes={nodes}
                                    onClickAdd={onClickAdd}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            No nodes match your search
                        </p>
                        <button
                            onClick={() => setSearchQuery("")}
                            className="mt-2 text-sm text-primary hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
