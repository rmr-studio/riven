import { useAuth } from "@/components/provider/auth-context";
import { useMutation, UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import { EntityType, UpdateEntityTypeResponse } from "../../interface/entity.interface";
import { EntityTypeService } from "../../service/entity-type.service";

export function useUpdateEntityTypeMutation(
    organisationId: string,
    options?: UseMutationOptions<UpdateEntityTypeResponse, Error, EntityType>
) {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const submissionToastRef = useRef<string | number | undefined>(undefined);

    return useMutation({
        mutationFn: (type: EntityType) =>
            EntityTypeService.updateEntityType(session, organisationId, type),
        onMutate: (data) => {
            options?.onMutate?.(data);
            submissionToastRef.current = toast.loading("Updating entity type...");
        },
        onError: (error: Error, variables: EntityType, context: unknown) => {
            options?.onError?.(error, variables, context);
            toast.dismiss(submissionToastRef.current);
            submissionToastRef.current = undefined;
            toast.error(`Failed to update entity type: ${error.message}`);
        },
        onSuccess: (
            response: UpdateEntityTypeResponse,
            variables: EntityType,
            context: unknown
        ) => {
            options?.onSuccess?.(response, variables, context);
            toast.dismiss(submissionToastRef.current);
            toast.success(`Entity type updated successfully!`);

            // Update cache for all entity types that were updated
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

            // Stay on the same page after update
            return response;
        },
    });
}
