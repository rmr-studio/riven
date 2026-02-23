'use client';

import { useMemo } from 'react';
import { WorkflowNodeType, WorkflowNodeMetadata } from '@/lib/types/workflow';
import { useNodeConfig } from '../context/workflow-canvas-provider';

/**
 * Library item representing a node type with its backend key
 */
export interface NodeLibraryItem {
  /** Full backend key (e.g., TRIGGER.ENTITY_EVENT) for node creation */
  key: string;
  /** Node metadata from backend */
  metadata: WorkflowNodeMetadata;
}

export interface UseNodeLibraryResult {
  /** Nodes grouped by category, filtered by search query */
  filteredNodes: Record<WorkflowNodeType, NodeLibraryItem[]>;
  /** Whether any nodes match the current search query */
  hasResults: boolean;
}

/**
 * Groups node metadata by category
 */
function groupNodesByCategory(
  nodeConfig: Record<string, WorkflowNodeMetadata> | null,
): Record<WorkflowNodeType, NodeLibraryItem[]> {
  const grouped: Record<WorkflowNodeType, NodeLibraryItem[]> = {
    [WorkflowNodeType.Trigger]: [],
    [WorkflowNodeType.Action]: [],
    [WorkflowNodeType.ControlFlow]: [],
    [WorkflowNodeType.Function]: [],
    [WorkflowNodeType.Utility]: [],
    [WorkflowNodeType.Parse]: [],
  };

  if (!nodeConfig) return grouped;

  Object.entries(nodeConfig).forEach(([key, metadata]) => {
    const category = metadata.metadata.category;
    if (category in grouped) {
      grouped[category].push({ key, metadata });
    }
  });

  return grouped;
}

/**
 * Hook for filtering and organizing node types for the library sidebar
 *
 * @param searchQuery - Search string to filter nodes by label or description
 * @returns Filtered nodes grouped by category and a hasResults flag
 */
export function useNodeLibrary(searchQuery: string): UseNodeLibraryResult {
  const nodeConfig = useNodeConfig();

  const allNodes = useMemo(() => groupNodesByCategory(nodeConfig), [nodeConfig]);

  const filteredNodes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return allNodes;
    }

    const filtered: Record<WorkflowNodeType, NodeLibraryItem[]> = {
      [WorkflowNodeType.Trigger]: [],
      [WorkflowNodeType.Action]: [],
      [WorkflowNodeType.ControlFlow]: [],
      [WorkflowNodeType.Function]: [],
      [WorkflowNodeType.Utility]: [],
      [WorkflowNodeType.Parse]: [],
    };

    (Object.keys(allNodes) as WorkflowNodeType[]).forEach((category) => {
      filtered[category] = allNodes[category].filter(
        (item) =>
          item.metadata.metadata.label.toLowerCase().includes(query) ||
          item.metadata.metadata.description.toLowerCase().includes(query),
      );
    });

    return filtered;
  }, [allNodes, searchQuery]);

  const hasResults = useMemo(() => {
    return Object.values(filteredNodes).some((nodes) => nodes.length > 0);
  }, [filteredNodes]);

  return { filteredNodes, hasResults };
}
