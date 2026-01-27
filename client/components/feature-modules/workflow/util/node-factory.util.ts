import type { Node } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { nodeTypeDefinitions } from "../config/node-types.config";
import type { WorkflowNodeData } from "../interface/workflow.interface";

/**
 * Position coordinates for placing nodes on the canvas
 */
export interface NodePosition {
    x: number;
    y: number;
}

/**
 * Optional overrides for node data when creating a node
 * Only allows overriding label, description, and configured status
 */
export interface PartialNodeData {
    label?: string;
    description?: string;
    configured?: boolean;
}

/**
 * Creates a new workflow node with proper typing and default values
 *
 * @param typeKey - The node type key from nodeTypeDefinitions (e.g., 'trigger_entity')
 * @param position - The {x, y} position for the node on the canvas
 * @param partialData - Optional partial data to override defaults
 * @returns A properly typed Node<WorkflowNodeData> ready for the canvas
 * @throws Error if typeKey is not found in nodeTypeDefinitions
 *
 * @example
 * const node = createWorkflowNode('trigger_entity', { x: 100, y: 200 });
 * const customNode = createWorkflowNode('action_placeholder', { x: 300, y: 200 }, {
 *   label: 'Send Email',
 *   description: 'Sends notification email',
 *   configured: true
 * });
 */
export const createWorkflowNode = (
    typeKey: string,
    position: NodePosition,
    partialData?: PartialNodeData
): Node<WorkflowNodeData> => {
    const definition = nodeTypeDefinitions[typeKey];

    if (!definition) {
        throw new Error(
            `Unknown node type: ${typeKey}. Available types: ${Object.keys(nodeTypeDefinitions).join(", ")}`
        );
    }

    const nodeData: WorkflowNodeData = {
        label: partialData?.label ?? definition.label,
        description: partialData?.description ?? definition.description,
        type: definition.category,
        icon: definition.icon,
        configured: partialData?.configured ?? false,
    };

    return {
        id: uuidv4(),
        type: typeKey,
        position,
        data: nodeData,
    };
};

/**
 * Type guard to check if a node type key is valid
 *
 * @param typeKey - The key to check
 * @returns true if the typeKey exists in nodeTypeDefinitions
 */
export const isValidNodeType = (typeKey: string): boolean => {
    return typeKey in nodeTypeDefinitions;
};

/**
 * Get all available node type keys
 *
 * @returns Array of valid node type keys
 */
export const getAvailableNodeTypes = (): string[] => {
    return Object.keys(nodeTypeDefinitions);
};
