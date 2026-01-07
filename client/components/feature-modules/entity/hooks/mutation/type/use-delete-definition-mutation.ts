import { useAuth } from "@/components/provider/auth-context";
import { useMutation, UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    DeleteTypeDefinitionRequest,
    EntityType,
    EntityTypeImpactResponse,
} from "../../../interface/entity.interface";
import { EntityTypeService } from "../../../service/entity-type.service";

export function useDeleteDefinitionMutation(
    workspaceId: string,
    options?: UseMutationOptions<EntityTypeImpactResponse, Error, DeleteTypeDefinitionRequest>
) {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    return useMutation({
        mutationFn: (definition: DeleteTypeDefinitionRequest) =>
            EntityTypeService.removeEntityTypeDefinition(session, workspaceId, definition),
        onMutate: (data) => {
            options?.onMutate?.(data);
        },
        onError: (error: Error, variables: DeleteTypeDefinitionRequest, context: unknown) => {
            options?.onError?.(error, variables, context);
            toast.error(`Failed to delete entity type definition: ${error.message}`);
        },
        onSuccess: (
            response: EntityTypeImpactResponse,
            variables: DeleteTypeDefinitionRequest,
            context: unknown
        ) => {
            options?.onSuccess?.(response, variables, context);

            if (response.updatedEntityTypes) {
                Object.entries(response.updatedEntityTypes).forEach(([key, entityType]) => {
                    // Update individual entity type query cache
                    queryClient.setQueryData(["entityType", key, workspaceId], entityType);
                });

                // Update the entity types list in cache
                queryClient.setQueryData<EntityType[]>(["entityTypes", workspaceId], (oldData) => {
                    if (!oldData) return Object.values(response.updatedEntityTypes!);

                    // Create a map of updated entity types for efficient lookup
                    const updatedTypesMap = new Map(
                        Object.entries(response.updatedEntityTypes!).map(([key, type]) => [
                            key,
                            type,
                        ])
                    );

                    // Replace all updated entity types in the list
                    return oldData.map((et) => updatedTypesMap.get(et.key) ?? et);
                });
            }

            return response;
        },
    });
}
