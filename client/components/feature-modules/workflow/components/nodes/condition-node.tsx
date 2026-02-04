'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseWorkflowNode } from './base-workflow-node';
import { WorkflowStepNode } from '@/lib/types/workflow/custom';

/**
 * Condition node component
 * Decision points that branch workflow flow
 *
 * Note: Currently delegates to BaseWorkflowNode.
 * Future: May add multiple output handles for true/false branches.
 */
export const ConditionNode = memo(function ConditionNode(props: NodeProps<WorkflowStepNode>) {
  return <BaseWorkflowNode {...props} />;
});

ConditionNode.displayName = 'ConditionNode';
