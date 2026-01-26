import { useAuth } from "@/components/provider/auth-context";
import type { ApplicationEntityType, BlockEnvironment } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { LayoutService } from "../service/layout.service";

/**
 * Hook to load and manage block environment for an entity.
 *
 * Uses React Query for caching and state management.
 * Automatically handles authentication and loading states.
 *
 * @param entityId - UUID of the entity (client, organisation, etc.)
 * @param entityType - Type of entity (from ApplicationEntityType enum, e.g. 'ENTITY')
 * @returns Block environment data, loading state, error, and refetch function
 *
 * @example
 * const { environment, isLoading, error, refetch } = useEntityLayout(
 *   workspaceId,
 *   clientId,
 *   ApplicationEntityType.Entity
 * );
 */
export interface UseEntityLayoutResult {
    environment?: BlockEnvironment;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<unknown>;
}

export const useEntityLayout = (
    workspaceId: string | undefined,
    entityId: string | undefined,
    entityType: ApplicationEntityType
): UseEntityLayoutResult => {
    const { session, loading: authLoading } = useAuth();

    const query = useQuery<BlockEnvironment, Error>({
        queryKey: ["layout", workspaceId, entityType, entityId],
        queryFn: () => LayoutService.loadLayout(session, workspaceId, entityId, entityType),
        enabled: !!workspaceId && !!entityId && !!session && !authLoading,
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true,
    });

    return {
        environment: query.data,
        isLoading: query.isLoading || authLoading,
        error: query.error,
        refetch: query.refetch,
    };
};
