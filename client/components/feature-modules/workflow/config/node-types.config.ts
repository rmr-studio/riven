import type { LucideIcon } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import { GitBranch, Play, Zap } from "lucide-react";
import type { WorkflowNode, WorkflowNodeType } from "../interface/workflow.interface";
import { TriggerNode } from "../components/nodes/trigger-node";
import { ActionNode } from "../components/nodes/action-node";
import { ConditionNode } from "../components/nodes/condition-node";

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
    trigger: { label: "Triggers", icon: Zap },
    action: { label: "Actions", icon: Play },
    condition: { label: "Conditions", icon: GitBranch },
};

/**
 * Groups node definitions by their category
 * Used by the node library sidebar for organized display
 */
export const getNodesByCategory = (): Record<WorkflowNodeType, NodeTypeDefinition[]> => {
    const grouped: Record<WorkflowNodeType, NodeTypeDefinition[]> = {
        trigger: [],
        action: [],
        condition: [],
    };

    Object.values(nodeTypeDefinitions).forEach((def) => {
        grouped[def.category].push(def);
    });

    return grouped;
};

/**
 * Registry of available node types
 * Add new node types here to make them available in the workflow editor
 */
export const nodeTypeDefinitions: Record<string, NodeTypeDefinition> = {
    trigger_entity: {
        type: "trigger_entity",
        label: "Entity Trigger",
        description: "Fires when an entity is created or updated",
        category: "trigger",
        icon: Zap,
    },
    action_placeholder: {
        type: "action_placeholder",
        label: "Action",
        description: "Performs an action (placeholder)",
        category: "action",
        icon: Play,
    },
    condition_if: {
        type: "condition_if",
        label: "Condition",
        description: "Branch based on a condition",
        category: "condition",
        icon: GitBranch,
    },
};

/**
 * Node type keys for React Flow's nodeTypes prop
 * Maps type keys to React components
 *
 * CRITICAL: This object must be defined at module level (outside any component)
 * to prevent React Flow from unmounting/remounting nodes on re-renders.
 */
export const nodeTypes: Record<string, React.ComponentType<NodeProps<WorkflowNode>>> = {
    trigger_entity: TriggerNode,
    action_placeholder: ActionNode,
    condition_if: ConditionNode,
};
