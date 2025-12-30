import { useAuth } from "@/components/provider/auth-context";
import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import { SaveEntityRequest, SaveEntityResponse } from "../../../interface/entity.interface";
import { EntityService } from "../../../service/entity.service";

export function useSaveEntityMutation(
    organisationId: string,
    entityTypeId: string,
    options?: UseMutationOptions<SaveEntityResponse, Error, SaveEntityRequest>
) {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const submissionToastRef = useRef<string | number | undefined>(undefined);

    return useMutation({
        mutationFn: (payload: SaveEntityRequest) =>
            EntityService.saveEntity(session, organisationId, entityTypeId, payload),
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
        onSuccess: (
            response: SaveEntityResponse,
            variables: SaveEntityRequest,
            context: unknown
        ) => {
            // Handle schema validation or impact confirmation errors
            if (response.errors) {
                return response;
            }

            if (response.entity) {
                options?.onSuccess?.(response, variables, context);

                toast.dismiss(submissionToastRef.current);
                submissionToastRef.current = undefined;
                toast.success("Entity created successfully!");

                // Invalidate the entities list query to refetch
                queryClient.invalidateQueries({
                    queryKey: ["entities", organisationId, entityTypeId],
                });

                return response;
            }
        },
    });
}
