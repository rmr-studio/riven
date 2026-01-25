"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowNode } from "../../interface/workflow.interface";
import { BaseWorkflowNode } from "./base-workflow-node";

/**
 * Condition node component
 * Decision points that branch workflow flow
 *
 * Note: Currently delegates to BaseWorkflowNode.
 * Future: May add multiple output handles for true/false branches.
 */
export const ConditionNode = memo(function ConditionNode(props: NodeProps<WorkflowNode>) {
    return <BaseWorkflowNode {...props} />;
});

ConditionNode.displayName = "ConditionNode";
