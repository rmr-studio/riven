"use client";

import { useState } from "react";
import {PanelLeft } from "lucide-react";
import { cn } from "@/lib/util/utils";
import { Button } from "@/components/ui/button";
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
 * Includes search filtering, draggable node items, and collapse/expand functionality
 */
export function NodeLibrarySidebar({ onClickAdd, className }: NodeLibrarySidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { filteredNodes, hasResults } = useNodeLibrary(searchQuery);

    return (
        <aside
            className={cn(
                "relative flex flex-col border-l bg-background transition-all duration-300 ease-in-out",
                isCollapsed ? "w-10" : "w-96",
                className
            )}
        >
            {/* Collapse/Expand toggle button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                    "absolute top-3 z-10 h-8 w-8 rounded-full border bg-background shadow-sm hover:bg-accent -left-4"
                )}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
               <PanelLeft className="size-3.5 text-primary/90"/>
            </Button>

            {/* Sidebar content - hidden when collapsed */}
            <div
                className={cn(
                    "flex flex-1 flex-col overflow-hidden transition-opacity duration-200",
                    isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
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
            </div>
        </aside>
    );
}
