"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowNode } from "../../interface/workflow.interface";
import { BaseWorkflowNode } from "./base-workflow-node";

/**
 * Action node component
 * Operations that perform work in the workflow
 */
export const ActionNode = memo(function ActionNode(props: NodeProps<WorkflowNode>) {
    return <BaseWorkflowNode {...props} />;
});

ActionNode.displayName = "ActionNode";
