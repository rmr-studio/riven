import { WorkflowNodeType } from '@/lib/types';
import type { Node, Edge } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';

/**
 * Base data payload for workflow nodes
 * Contains display and configuration information
 */
export interface WorkflowNodeDataBase {
  /** Display label shown on the node */
  label: string;
  /** Description of what the node does */
  description: string;
  /** Node category (trigger, action, condition) */
  type: WorkflowNodeType;
  /** Icon component to display */
  icon: LucideIcon;
  /** Whether the node has been configured by the user */
  configured: boolean;
  /** Node-specific configuration values from form */
  config?: Record<string, unknown>;
}

/**
 * Workflow node data type allowing additional custom properties
 * Uses Record intersection for React Flow compatibility
 */
export type WorkflowNodeData = WorkflowNodeDataBase & Record<string, unknown>;

/**
 * Type alias for workflow nodes with proper data typing
 */
export type WorkflowNode = Node<WorkflowNodeData>;

/**
 * Type alias for workflow edges
 */
export type WorkflowEdge = Edge;
