import { useAuth } from "@/components/provider/auth-context";
import { useMutation, UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import { CreateEntityTypeRequest, EntityType } from "../../../interface/entity.interface";
import { EntityTypeService } from "../../../service/entity-type.service";

export function usePublishEntityTypeMutation(
    organisationId: string,
    options?: UseMutationOptions<EntityType, Error, CreateEntityTypeRequest>
) {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const submissionToastRef = useRef<string | number | undefined>(undefined);

    return useMutation({
        mutationFn: (request: CreateEntityTypeRequest) =>
            EntityTypeService.publishEntityType(session, organisationId, request),
        onMutate: (data) => {
            options?.onMutate?.(data);
            submissionToastRef.current = toast.loading("Creating entity type...");
        },
        onError: (error: Error, variables: CreateEntityTypeRequest, context: unknown) => {
            options?.onError?.(error, variables, context);
            toast.dismiss(submissionToastRef.current);
            submissionToastRef.current = undefined;
            toast.error(`Failed to create entity type: ${error.message}`);
        },
        onSuccess: (response: EntityType, variables: CreateEntityTypeRequest, context: unknown) => {
            options?.onSuccess?.(response, variables, context);
            toast.dismiss(submissionToastRef.current);
            submissionToastRef.current = undefined;
            toast.success(`Entity type created successfully!`);

            // Update the specific entity type in cache
            queryClient.setQueryData(["entityType", response.key, organisationId], response);

            // Update the entity types list in cache
            queryClient.setQueryData<EntityType[]>(["entityTypes", organisationId], (oldData) => {
                if (!oldData) return [response];

                // Add new entity type to the list
                return [...oldData, response];
            });

            return response;
        },
    });
}
