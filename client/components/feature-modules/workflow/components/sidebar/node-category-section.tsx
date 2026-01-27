"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/util/utils";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { NodeTypeDefinition } from "../../config/node-types.config";
import { NodeLibraryItem } from "./node-library-item";

export interface NodeCategorySectionProps {
    /** Category key (trigger, action, condition) */
    category: string;
    /** Display label for the category */
    label: string;
    /** Icon component for the category */
    icon: LucideIcon;
    /** Node definitions in this category */
    nodes: NodeTypeDefinition[];
    /** Callback when a node is clicked to add to canvas */
    onClickAdd?: (type: string) => void;
}

/**
 * Collapsible section for a category of nodes in the library sidebar
 * Shows category icon, label, count badge, and expandable list of nodes
 */
export function NodeCategorySection({
    category,
    label,
    icon: Icon,
    nodes,
    onClickAdd,
}: NodeCategorySectionProps) {
    const [isOpen, setIsOpen] = useState(true);

    if (nodes.length === 0) {
        return null;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {nodes.length}
                    </span>
                </div>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="flex flex-col gap-2 py-2">
                    {nodes.map((node) => (
                        <NodeLibraryItem
                            key={node.type}
                            definition={node}
                            onClickAdd={onClickAdd}
                        />
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
