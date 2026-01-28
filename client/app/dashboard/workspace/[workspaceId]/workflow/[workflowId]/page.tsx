import { WorkflowEditor } from "@/components/feature-modules/workflow/components/workflow-editor";

interface WorkflowEditorPageProps {
    params: Promise<{
        workspaceId: string;
        workflowId: string;
    }>;
}

/**
 * Individual workflow editor page
 *
 * Renders the workflow editor component for visual workflow composition.
 * The workspaceId scopes the workflow to an organization, and workflowId
 * identifies the specific workflow being edited (or "new" for a new workflow).
 */
export default async function WorkflowEditorPage({
    params,
}: WorkflowEditorPageProps) {
    const { workspaceId, workflowId } = await params;

    return (
        <div className="h-full">
            <WorkflowEditor workspaceId={workspaceId} workflowId={workflowId} />
        </div>
    );
}
