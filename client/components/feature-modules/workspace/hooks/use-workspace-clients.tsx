"use client";

import { fetchWorkspaceClients } from "@/components/feature-modules/client/service/client.service";
import { useAuth } from "@/components/provider/auth-context";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "./use-workspace";

export function useWorkspaceClients() {
    const { session, loading } = useAuth();

    // Fetch current workspaceId from parameters
    const { data: workspace } = useWorkspace();

    const query = useQuery({
        queryKey: ["workspace", workspace?.id, "clients"],
        queryFn: () => {
            if (!session?.user.id) {
                throw fromError({
                    message: "No active session found",
                    status: 401,
                    error: "NO_SESSION",
                });
            }

            if (!workspace?.id) {
                throw fromError({
                    message: "No workspace found",
                    status: 404,
                    error: "NO_WORKSPACE",
                });
            }

            return fetchWorkspaceClients(session, { workspaceId: workspace.id });
        },
        enabled: !!session?.user.id && !!workspace?.id, // Only fetch if user is authenticated and if a workspace is available
        retry: (count, error) => {
            // Retry once on failure, but not on network errors
            if (isResponseError(error)) return false;

            return count < 2;
        }, // Retry once on failure
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes,
    });

    return {
        ...query,
        isLoadingAuth: loading,
    };
}
