import { fetchOrganisationClients } from "@/components/feature-modules/client/service/client.service";
import { useAuth } from "@/components/provider/auth-context";
import type { EntityType } from "@/lib/types/entity";
import { isResponseError } from "@/lib/util/error/error.util";
import { useQuery } from "@tanstack/react-query";

interface EntityOption {
    id: string;
    name: string;
    type: EntityType;
    secondaryInfo?: string;
    icon?: React.ReactNode;
}

interface UseEntitySelectorParams {
    entityType: string;
    workspaceId: string;
    excludeIds?: string[];
    enabled: boolean;
}

export const useEntitySelector = ({
    entityType,
    workspaceId,
    excludeIds = [],
    enabled,
}: UseEntitySelectorParams) => {
    const { session, loading } = useAuth();

    const query = useQuery({
        queryKey: ["entities", entityType, workspaceId, excludeIds],
        queryFn: async (): Promise<EntityOption[]> => {
            if (!session) {
                throw new Error("No session available");
            }

            try {
                switch (entityType) {
                    case "CLIENT": {
                        const clients = await fetchOrganisationClients(session, {
                            workspaceId,
                        });

                        // Handle empty response as valid empty array
                        if (!clients || clients.length === 0) {
                            return [];
                        }

                        const options: EntityOption[] = clients.map((client) => ({
                            id: client.id,
                            name: client.name || "Unnamed Client",
                            type: EntityType.CLIENT,
                            secondaryInfo: client.contact?.email || client.id,
                        }));

                        // Filter out excluded IDs
                        const filtered = options.filter((opt) => !excludeIds.includes(opt.id));

                        return filtered;
                    }

                    // TODO: Add other entity types here
                    // case "PROJECT": {
                    //     const projects = await fetchOrganisationProjects(session, {
                    //         workspaceId,
                    //     });
                    //
                    //     if (!projects || projects.length === 0) {
                    //         return [];
                    //     }
                    //
                    //     return projects.map(project => ({...})).filter(...);
                    // }

                    default:
                        throw new Error(`Unsupported entity type: ${entityType}`);
                }
            } catch (error) {
                // Re-throw ResponseErrors from your service layer
                if (isResponseError(error)) {
                    throw error;
                }

                // Wrap other errors
                throw new Error(
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred while fetching entities"
                );
            }
        },
        enabled: enabled && !!session && !!workspaceId,
        retry: (failureCount, error) => {
            // Don't retry on 4xx errors (client errors)
            if (isResponseError(error) && error.status >= 400 && error.status < 500) {
                return false;
            }
            // Retry once on 5xx errors or network errors
            return failureCount < 1;
        },
        staleTime: 5 * 60 * 1000,
        refetchOnMount: "always",
        // Prevent error from being thrown during render
        throwOnError: false,
    });

    return {
        isLoadingAuth: loading,
        ...query,
    };
};
