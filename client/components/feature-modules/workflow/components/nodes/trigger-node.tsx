'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkflowStepNode } from '@/lib/types/workflow';
import { BaseWorkflowNode } from './base-workflow-node';

/**
 * Trigger node component
 * Entry points that start workflow execution
 *
 * Note: Currently delegates to BaseWorkflowNode.
 * Future: May override to remove input handle (triggers start workflows).
 */
export const TriggerNode = memo(function TriggerNode(props: NodeProps<WorkflowStepNode>) {
  return <BaseWorkflowNode {...props} />;
});

TriggerNode.displayName = 'TriggerNode';
