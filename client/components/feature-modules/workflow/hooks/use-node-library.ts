"use client";

import { useMemo } from "react";
import {
    getNodesByCategory,
    type NodeTypeDefinition,
} from "../config/node-types.config";
import type { WorkflowNodeType } from "../interface/workflow.interface";

export interface UseNodeLibraryResult {
    /** Nodes grouped by category, filtered by search query */
    filteredNodes: Record<WorkflowNodeType, NodeTypeDefinition[]>;
    /** Whether any nodes match the current search query */
    hasResults: boolean;
}

/**
 * Hook for filtering and organizing node types for the library sidebar
 *
 * @param searchQuery - Search string to filter nodes by label or description
 * @returns Filtered nodes grouped by category and a hasResults flag
 */
export function useNodeLibrary(searchQuery: string): UseNodeLibraryResult {
    const allNodes = useMemo(() => getNodesByCategory(), []);

    const filteredNodes = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        if (!query) {
            return allNodes;
        }

        const filtered: Record<WorkflowNodeType, NodeTypeDefinition[]> = {
            trigger: [],
            action: [],
            condition: [],
        };

        (Object.keys(allNodes) as WorkflowNodeType[]).forEach((category) => {
            filtered[category] = allNodes[category].filter(
                (node) =>
                    node.label.toLowerCase().includes(query) ||
                    node.description.toLowerCase().includes(query)
            );
        });

        return filtered;
    }, [allNodes, searchQuery]);

    const hasResults = useMemo(() => {
        return Object.values(filteredNodes).some((nodes) => nodes.length > 0);
    }, [filteredNodes]);

    return { filteredNodes, hasResults };
}
