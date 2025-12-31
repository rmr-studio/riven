import { useAuth } from "@/components/provider/auth-context";
import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import {
    SaveEntityRequest,
    SaveEntityResponse,
    Entity,
} from "../../../interface/entity.interface";
import { EntityService } from "../../../service/entity.service";

export interface UpdateEntityRequest {
    entityId: string;
    payload: SaveEntityRequest;
}

export function useUpdateEntityMutation(
    organisationId: string,
    entityTypeId: string,
    options?: UseMutationOptions<SaveEntityResponse, Error, UpdateEntityRequest>
) {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const submissionToastRef = useRef<string | number | undefined>(undefined);

    return useMutation({
        mutationFn: (request: UpdateEntityRequest) =>
            EntityService.updateEntity(
                session,
                organisationId,
                entityTypeId,
                request.entityId,
                request.payload
            ),
        onMutate: (data) => {
            options?.onMutate?.(data);
            submissionToastRef.current = toast.loading("Updating entity...");
        },
        onError: (error: Error, variables: UpdateEntityRequest, context: unknown) => {
            options?.onError?.(error, variables, context);
            toast.dismiss(submissionToastRef.current);
            submissionToastRef.current = undefined;
            toast.error(`Failed to update entity: ${error.message}`);
        },
        onSuccess: (
            response: SaveEntityResponse,
            variables: UpdateEntityRequest,
            context: unknown
        ) => {
            // Handle schema validation or impact confirmation errors
            toast.dismiss(submissionToastRef.current);
            submissionToastRef.current = undefined;

            if (response.errors) {
                return response;
            }

            if (response.entity) {
                options?.onSuccess?.(response, variables, context);

                toast.success("Entity updated successfully!");

                // Update the entity in the cache
                queryClient.setQueryData<Entity[]>(
                    ["entities", organisationId, entityTypeId],
                    (old) => {
                        if (!old) return old;
                        return old.map((entity) =>
                            entity.id === response.entity!.id ? response.entity! : entity
                        );
                    }
                );

                return response;
            }
        },
    });
}
