import { UseMutationOptions } from "@tanstack/react-query";
import {
    DeleteTypeDefinitionRequest,
    EntityTypeImpactResponse,
} from "../../../interface/entity.interface";

export function useDeleteDefinitionMutation(
    organisationId: string,
    options?: UseMutationOptions<EntityTypeImpactResponse, Error, DeleteTypeDefinitionRequest>
) {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    return useMutation({
        mutationFn: (definition: DeleteTypeDefinitionRequest) =>
            EntityTypeService.deleteEntityTypeDefinition(session, organisationId, definition),
        onMutate: (data) => {
            options?.onMutate?.(data);
            submissionToastRef.current = toast.loading("Saving entity type definition...");
        },
        onError: (error: Error, variables: SaveTypeDefinitionRequest, context: unknown) => {
            options?.onError?.(error, variables, context);
            toast.dismiss(submissionToastRef.current);
            submissionToastRef.current = undefined;
            toast.error(`Failed to save entity type definition: ${error.message}`);
        },
        onSuccess: (
            response: EntityTypeImpactResponse,
            variables: SaveTypeDefinitionRequest,
            context: unknown
        ) => {
            options?.onSuccess?.(response, variables, context);
            toast.dismiss(submissionToastRef.current);
            submissionToastRef.current = undefined;
            toast.success(`Entity type definition saved successfully!`);

            if (response.updatedEntityTypes) {
                Object.entries(response.updatedEntityTypes).forEach(([key, entityType]) => {
                    // Update individual entity type query cache
                    queryClient.setQueryData(["entityType", key, organisationId], entityType);
                });

                // Update the entity types list in cache
                queryClient.setQueryData<EntityType[]>(
                    ["entityTypes", organisationId],
                    (oldData) => {
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
                    }
                );
            }

            return response;
        },
    });
}
