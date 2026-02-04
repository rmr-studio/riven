import type { LucideIcon } from 'lucide-react';
import { GitBranch, Zap, Play } from 'lucide-react';
import { WorkflowStepNode, WorkflowNodeType } from '@/lib/types/workflow';
import { TriggerNode } from '../components/nodes/trigger-node';
import { ActionNode } from '../components/nodes/action-node';
import { ConditionNode } from '../components/nodes/condition-node';
import { NodeProps } from '@xyflow/react';

/**
 * Definition for a node type in the workflow editor
 * Used to populate node data when creating new nodes
 */
export interface NodeTypeDefinition {
  /** Unique type identifier (matches key in nodeTypeDefinitions) */
  type: string;
  /** Human-readable display label */
  label: string;
  /** Description of what this node type does */
  description: string;
  /** Category for grouping (trigger, action, condition) */
  category: WorkflowNodeType;
  /** Icon component to display */
  icon: LucideIcon;
}

/**
 * Category metadata for sidebar organization
 * Maps node categories to display labels and icons
 */
export const categoryMeta: Record<WorkflowNodeType, { label: string; icon: LucideIcon }> = {
  [WorkflowNodeType.Trigger]: { label: 'Triggers', icon: Zap },
  [WorkflowNodeType.Action]: { label: 'Actions', icon: Play },
  [WorkflowNodeType.ControlFlow]: { label: 'Conditions', icon: GitBranch },
  [WorkflowNodeType.Function]: { label: 'Actions', icon: Play },
  [WorkflowNodeType.Utility]: { label: 'Actions', icon: Play },
  [WorkflowNodeType.Parse]: { label: 'Actions', icon: Play },
};

/**
 * Groups node definitions by their category
 * Used by the node library sidebar for organized display
 */
export const getNodesByCategory = (): Record<WorkflowNodeType, NodeTypeDefinition[]> => {
  const grouped: Record<WorkflowNodeType, NodeTypeDefinition[]> = {
    [WorkflowNodeType.Trigger]: [],
    [WorkflowNodeType.Action]: [],
    [WorkflowNodeType.ControlFlow]: [],
    [WorkflowNodeType.Function]: [],
    [WorkflowNodeType.Utility]: [],
    [WorkflowNodeType.Parse]: [],
  };

  Object.values(nodeTypeDefinitions).forEach((def) => {
    grouped[def.category].push(def);
  });

  return grouped;
};

/**
 * Node type keys for React Flow's nodeTypes prop
 * Maps type keys to React components
 *
 * CRITICAL: This object must be defined at module level (outside any component)
 * to prevent React Flow from unmounting/remounting nodes on re-renders.
 */
export const nodeTypes: Record<
  WorkflowNodeType,
  React.ComponentType<NodeProps<WorkflowStepNode>>
> = {
  [WorkflowNodeType.Trigger]: TriggerNode,
  [WorkflowNodeType.Action]: ActionNode,
  [WorkflowNodeType.ControlFlow]: ConditionNode,
  [WorkflowNodeType.Function]: ActionNode,
  [WorkflowNodeType.Utility]: ActionNode,
  [WorkflowNodeType.Parse]: ActionNode,
};
