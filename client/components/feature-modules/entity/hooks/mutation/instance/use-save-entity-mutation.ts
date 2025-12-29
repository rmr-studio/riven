import { useAuth } from "@/components/provider/auth-context";
import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import { Entity, SaveEntityRequest } from "../../../interface/entity.interface";
import { EntityService } from "../../../service/entity.service";

export function useSaveEntityMutation(
    organisationId: string,
    entityTypeKey: string,
    options?: UseMutationOptions<Entity, Error, SaveEntityRequest>
) {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const submissionToastRef = useRef<string | number | undefined>(undefined);

    return useMutation({
        mutationFn: (payload: SaveEntityRequest) =>
            EntityService.saveEntity(session, organisationId, entityTypeKey, payload),
        onMutate: (data) => {
            options?.onMutate?.(data);
            submissionToastRef.current = toast.loading("Creating entity...");
        },
        onError: (error: Error, variables: SaveEntityRequest, context: unknown) => {
            options?.onError?.(error, variables, context);
            toast.dismiss(submissionToastRef.current);
            submissionToastRef.current = undefined;
            toast.error(`Failed to create entity: ${error.message}`);
        },
        onSuccess: (entity: Entity, variables: SaveEntityRequest, context: unknown) => {
            options?.onSuccess?.(entity, variables, context);
            toast.dismiss(submissionToastRef.current);
            submissionToastRef.current = undefined;
            toast.success("Entity created successfully!");

            // Invalidate the entities list query to refetch
            queryClient.invalidateQueries({
                queryKey: ["entities", organisationId, entityTypeKey],
            });

            return entity;
        },
    });
}
