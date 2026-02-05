import type { LucideIcon } from 'lucide-react';
import { GitBranch, Zap, Play } from 'lucide-react';
import { WorkflowStepNode, WorkflowNodeType } from '@/lib/types/workflow';
import { TriggerNode } from '../components/nodes/trigger-node';
import { ActionNode } from '../components/nodes/action-node';
import { ConditionNode } from '../components/nodes/condition-node';
import { NodeProps } from '@xyflow/react';

/**
 * Category metadata for sidebar organization
 * Maps node categories to display labels and icons
 */
export const categoryMeta: Record<WorkflowNodeType, { label: string; icon: LucideIcon }> = {
  [WorkflowNodeType.Trigger]: { label: 'Triggers', icon: Zap },
  [WorkflowNodeType.Action]: { label: 'Actions', icon: Play },
  [WorkflowNodeType.ControlFlow]: { label: 'Conditions', icon: GitBranch },
  [WorkflowNodeType.Function]: { label: 'Functions', icon: Play },
  [WorkflowNodeType.Utility]: { label: 'Utilities', icon: Play },
  [WorkflowNodeType.Parse]: { label: 'Parsers', icon: Play },
};

/**
 * Order of categories to display in sidebar
 */
export const categoryOrder: WorkflowNodeType[] = [
  WorkflowNodeType.Trigger,
  WorkflowNodeType.Action,
  WorkflowNodeType.ControlFlow,
  WorkflowNodeType.Function,
  WorkflowNodeType.Utility,
  WorkflowNodeType.Parse,
];

/**
 * Node type keys for React Flow's nodeTypes prop
 * Maps category (WorkflowNodeType) to React components
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
