import { useAuth } from "@/components/provider/auth-context";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { EntityInstanceService } from "../../../service/entity-instance.service";

interface ValidateUniqueParams {
    attributeId: string;
    value: any;
}

export function useValidateUniqueMutation(
    organisationId: string,
    entityTypeKey: string,
    options?: UseMutationOptions<boolean, Error, ValidateUniqueParams>
) {
    const { session } = useAuth();

    return useMutation({
        mutationFn: async ({ attributeId, value }: ValidateUniqueParams) => {
            // Skip validation for empty values
            if (value === null || value === undefined || value === "") {
                return true;
            }

            return await EntityInstanceService.checkUniqueValue(
                session,
                organisationId,
                entityTypeKey,
                attributeId,
                value
            );
        },
        onError: (error: Error, variables: ValidateUniqueParams, context: unknown) => {
            options?.onError?.(error, variables, context);
            // Silent error handling - validation will be retried on submit
            console.error("Unique validation error:", error);
        },
        onSuccess: (isUnique: boolean, variables: ValidateUniqueParams, context: unknown) => {
            options?.onSuccess?.(isUnique, variables, context);
        },
        // No toast notifications for this mutation - it's a background validation
        retry: 1, // Retry once on failure
    });
}
