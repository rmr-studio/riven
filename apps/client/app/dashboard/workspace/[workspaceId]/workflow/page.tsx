import { redirect } from "next/navigation";

interface WorkflowPageProps {
    params: Promise<{
        workspaceId: string;
    }>;
}

/**
 * Workflow index/list page
 *
 * For Phase 1, redirects to a placeholder "new" workflow since
 * persistence is not yet implemented. Future phases will show
 * a workflow list with create/edit options.
 */
export default async function WorkflowPage({ params }: WorkflowPageProps) {
    const { workspaceId } = await params;

    // Redirect to a placeholder workflow for Phase 1
    redirect(`/dashboard/workspace/${workspaceId}/workflow/new`);
}
