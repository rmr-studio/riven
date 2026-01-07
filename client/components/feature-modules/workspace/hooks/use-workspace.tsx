import { getWorkspace } from "@/components/feature-modules/workspace/service/workspace.service";
import { useAuth } from "@/components/provider/auth-context";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export const useWorkspace = () => {
    const { session, loading } = useAuth();
    // Extract workspace ID from URL params
    // Assuming the route is defined like: /dashboard/workspace/:workspaceId
    const { workspaceId } = useParams<{ workspaceId: string }>();

    // Use TanStack Query to fetch workspace data
    const query = useQuery({
        queryKey: ["workspace", workspaceId], // Unique key for caching
        queryFn: () => getWorkspace(session, { workspaceId }, true), // Fetch function with all associatedMetadata
        enabled: !!workspaceId && !!session?.user.id, // Only fetch if workspaceId exists and the user is authenticated
        retry: 1,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return { isLoadingAuth: loading, ...query };
};
