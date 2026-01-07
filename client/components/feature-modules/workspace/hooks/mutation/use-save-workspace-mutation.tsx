import { useAuth } from "@/components/provider/auth-context";
import { useMutation, UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import { SaveWorkspaceRequest, Workspace } from "../../interface/workspace.interface";
import { WorkspaceService } from "../../service/workspace.service";

interface SaveWorkspaceMutationProps {
    workspace: SaveWorkspaceRequest;
    avatar?: Blob | null;
}

export function useSaveWorkspaceMutation(
    options?: UseMutationOptions<Workspace, Error, SaveWorkspaceMutationProps>
) {
    const queryClient = useQueryClient();
    const { user, session } = useAuth();
    const submissionToastRef = useRef<string | number | undefined>(undefined);

    return useMutation({
        mutationFn: ({ workspace, avatar }: SaveWorkspaceMutationProps) =>
            WorkspaceService.saveWorkspace(session, workspace, avatar),
        onMutate: (data) => {
            const isUpdate = !!data.workspace.id;
            submissionToastRef.current = toast.loading(
                isUpdate ? "Updating Workspace..." : "Creating Workspace..."
            );

            // Invoke Callback
            options?.onMutate?.(data);
        },
        onSuccess: (
            response: Workspace,
            variables: SaveWorkspaceMutationProps,
            context: unknown
        ) => {
            toast.dismiss(submissionToastRef.current);
            toast.success("Workspace saved successfully");
            queryClient.invalidateQueries({
                queryKey: ["userProfile", user?.id],
            });

            // Invoke Callback
            options?.onSuccess?.(response, variables, context);
        },
        onError: (error: Error, variables: SaveWorkspaceMutationProps, context: unknown) => {
            toast.dismiss(submissionToastRef.current);
            toast.error(`Failed to create workspace: ${error.message}`);

            // Invoke Callback
            options?.onError?.(error, variables, context);
        },
    });
}
