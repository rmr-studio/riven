"use client";

import { useEffect } from "react";
import {
    WorkflowCanvasProvider,
    useAddNode,
} from "../context/workflow-canvas-provider";
import { WorkflowCanvas } from "./canvas/workflow-canvas";
import { createWorkflowNode } from "../util/node-factory.util";

/**
 * Props for the WorkflowEditor component
 */
export interface WorkflowEditorProps {
    /** Workspace ID for scoping the workflow */
    workspaceId: string;
    /** Workflow ID being edited */
    workflowId: string;
}

/**
 * Props for WorkflowEditorInner component
 */
interface WorkflowEditorInnerProps {
    workspaceId: string;
}

/**
 * Inner editor component with access to canvas context
 *
 * Must be rendered inside WorkflowCanvasProvider to access hooks.
 * In development mode, exposes __addTestNode function to window for testing.
 */
const WorkflowEditorInner = ({ workspaceId }: WorkflowEditorInnerProps) => {
    const addNode = useAddNode();

    // Development helper: expose addNode for testing via browser console
    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            (window as unknown as Record<string, unknown>).__addTestNode = (
                type: string = "trigger_entity"
            ) => {
                const node = createWorkflowNode(type, {
                    x: 250 + Math.random() * 200,
                    y: 100 + Math.random() * 200,
                });
                addNode(node);
            };

            return () => {
                delete (window as unknown as Record<string, unknown>)
                    .__addTestNode;
            };
        }
    }, [addNode]);

    return <WorkflowCanvas workspaceId={workspaceId} />;
};

/**
 * Main workflow editor component
 *
 * Wraps the workflow canvas with the canvas provider for state management.
 * Provides a full-height editing surface for visual workflow composition.
 *
 * @example
 * <WorkflowEditor workspaceId="ws-123" workflowId="wf-456" />
 */
export const WorkflowEditor = ({
    workspaceId,
    workflowId,
}: WorkflowEditorProps) => {
    return (
        <WorkflowCanvasProvider workspaceId={workspaceId} workflowId={workflowId}>
            <div className="h-full w-full">
                <WorkflowEditorInner workspaceId={workspaceId} />
            </div>
        </WorkflowCanvasProvider>
    );
};
