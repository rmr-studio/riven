'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { WorkflowStepNode } from '@/lib/types/workflow';
import { BaseWorkflowNode } from './base-workflow-node';

/**
 * Action node component
 * Operations that perform work in the workflow
 */
export const ActionNode = memo(function ActionNode(props: NodeProps<WorkflowStepNode>) {
  return <BaseWorkflowNode {...props} />;
});

ActionNode.displayName = 'ActionNode';
