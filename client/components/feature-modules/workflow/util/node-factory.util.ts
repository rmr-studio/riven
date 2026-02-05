import type { Node } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { WorkflowNodeMetadata, WorkflowNodeData } from "@/lib/types/workflow";

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
 * @param nodeTypeKey - Full backend key (e.g., 'TRIGGER.ENTITY_EVENT')
 * @param metadata - Node metadata from backend containing display info and schema
 * @param position - The {x, y} position for the node on the canvas
 * @param partialData - Optional partial data to override defaults
 * @returns A properly typed Node<WorkflowNodeData> ready for the canvas
 *
 * @example
 * const node = createWorkflowNode('TRIGGER.ENTITY_EVENT', metadata, { x: 100, y: 200 });
 */
export const createWorkflowNode = (
    nodeTypeKey: string,
    metadata: WorkflowNodeMetadata,
    position: NodePosition,
    partialData?: PartialNodeData
): Node<WorkflowNodeData> => {
    const { label, description, icon, category } = metadata.metadata;

    const nodeData: WorkflowNodeData = {
        nodeTypeKey,
        label: partialData?.label ?? label,
        description: partialData?.description ?? description,
        type: category,
        icon: icon,
        configured: partialData?.configured ?? false,
    };

    return {
        id: uuidv4(),
        // Use category as React Flow node type for component lookup
        type: category,
        position,
        data: nodeData,
    };
};
