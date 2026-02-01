import type { LucideIcon } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import {
    Database,
    Clock,
    Webhook,
    Code,
    Plus,
    Pencil,
    Trash2,
    Search,
    Link2,
    Send,
    GitBranch,
    Zap,
    Play,
} from "lucide-react";
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
    // Triggers
    trigger_entity_event: {
        type: "trigger_entity_event",
        label: "Entity Event",
        description: "Triggers when an entity is created, updated, or deleted",
        category: "trigger",
        icon: Database,
    },
    trigger_schedule: {
        type: "trigger_schedule",
        label: "Schedule",
        description: "Triggers on a recurring schedule or cron expression",
        category: "trigger",
        icon: Clock,
    },
    trigger_webhook: {
        type: "trigger_webhook",
        label: "Webhook",
        description: "Triggers when an HTTP request is received",
        category: "trigger",
        icon: Webhook,
    },
    trigger_function: {
        type: "trigger_function",
        label: "Function Call",
        description: "Triggers when called programmatically",
        category: "trigger",
        icon: Code,
    },

    // Actions - Entity Operations
    action_create_entity: {
        type: "action_create_entity",
        label: "Create Entity",
        description: "Creates a new entity instance",
        category: "action",
        icon: Plus,
    },
    action_update_entity: {
        type: "action_update_entity",
        label: "Update Entity",
        description: "Updates an existing entity instance",
        category: "action",
        icon: Pencil,
    },
    action_delete_entity: {
        type: "action_delete_entity",
        label: "Delete Entity",
        description: "Deletes an entity instance",
        category: "action",
        icon: Trash2,
    },
    action_query_entity: {
        type: "action_query_entity",
        label: "Query Entities",
        description: "Searches and retrieves entity instances",
        category: "action",
        icon: Search,
    },
    action_link_entity: {
        type: "action_link_entity",
        label: "Link Entities",
        description: "Creates a relationship between entities",
        category: "action",
        icon: Link2,
    },

    // Actions - External
    action_http_request: {
        type: "action_http_request",
        label: "HTTP Request",
        description: "Makes an HTTP request to an external URL",
        category: "action",
        icon: Send,
    },

    // Control Flow
    control_condition: {
        type: "control_condition",
        label: "Condition",
        description: "Branches workflow based on a condition",
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
    // Triggers - all use TriggerNode component
    trigger_entity_event: TriggerNode,
    trigger_schedule: TriggerNode,
    trigger_webhook: TriggerNode,
    trigger_function: TriggerNode,

    // Actions - all use ActionNode component
    action_create_entity: ActionNode,
    action_update_entity: ActionNode,
    action_delete_entity: ActionNode,
    action_query_entity: ActionNode,
    action_link_entity: ActionNode,
    action_http_request: ActionNode,

    // Control Flow - uses ConditionNode component
    control_condition: ConditionNode,
};
