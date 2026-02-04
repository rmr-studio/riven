'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/util/utils';
import { WorkflowNodeType, WorkflowStepNode } from '@/lib/types/workflow';
import { IconCell } from '@/components/ui/icon/icon-cell';

/**
 * Type-specific styling for node variants
 * Includes border color and icon background colors
 */
const typeStyles: Record<WorkflowNodeType, { border: string; iconBg: string }> = {
  [WorkflowNodeType.Trigger]: {
    border: 'border-l-4 border-l-amber-500',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  },
  [WorkflowNodeType.Action]: {
    border: 'border-l-4 border-l-blue-500',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  [WorkflowNodeType.ControlFlow]: {
    border: 'border-l-4 border-l-purple-500',
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  },
  [WorkflowNodeType.Function]: {
    border: 'border-l-4 border-l-green-500',
    iconBg: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
  },
  [WorkflowNodeType.Parse]: {
    border: 'border-l-4 border-l-yellow-500',
    iconBg: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
  },
  [WorkflowNodeType.Utility]: {
    border: 'border-l-4 border-l-gray-500',
    iconBg: 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
  },
};

/**
 * Base workflow node component
 * Provides consistent structure and styling across all node types
 */
export const BaseWorkflowNode = memo(function BaseWorkflowNode({
  data,
  selected,
}: NodeProps<WorkflowStepNode>) {
  const { type, colour } = data.icon;
  const styles = typeStyles[data.type];

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card shadow-sm',
        'min-w-[200px]',
        styles.border,
        selected && 'ring-2 ring-primary ring-offset-2',
      )}
    >
      {/* Header section with icon and label */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className={cn('rounded p-1.5', styles.iconBg)}>
          <IconCell readonly type={type} colour={colour} />
        </div>
        <span className="text-sm font-medium">{data.label}</span>
      </div>

      {/* Body section with description */}
      <div className="px-3 py-2">
        <p className="text-xs text-muted-foreground">{data.description}</p>
      </div>

      {/* Target handle (input) at top */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
      />

      {/* Source handle (output) at bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
      />
    </div>
  );
});

BaseWorkflowNode.displayName = 'BaseWorkflowNode';
