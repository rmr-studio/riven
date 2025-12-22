import { useAuth } from "@/components/provider/auth-context";
import { EntityCategory, IconColour, IconType } from "@/lib/types/types";
import { iconFormSchema } from "@/lib/util/form/common/icon.form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CreateEntityTypeRequest, EntityType } from "../../interface/entity.interface";
import { EntityTypeService } from "../../service/entity-type.service";

export const baseEntityTypeFormSchema = z
    .object({
        key: z.string().min(1, "Key is required"),
        singularName: z.string().min(1, "Singular variant of the name is required"),
        pluralName: z.string().min(1, "Plural variant of the name is required"),
        description: z.string().optional(),
        type: z.nativeEnum(EntityCategory),
    })
    .extend(iconFormSchema.shape);

export type NewEntityTypeFormValues = z.infer<typeof baseEntityTypeFormSchema>;
export interface UseEntityTypeFormReturn {
    form: UseFormReturn<NewEntityTypeFormValues>;
    keyManuallyEdited: boolean;
    setKeyManuallyEdited: (value: boolean) => void;
    handleSubmit: (values: NewEntityTypeFormValues) => Promise<void>;
}

export function useNewEntityTypeForm(organisationId: string): UseEntityTypeFormReturn {
    const { session } = useAuth();
    const queryClient = useQueryClient();
    // Ref to track pending submission toast
    const submissionToastRef = useRef<string | number | undefined>(undefined);
    const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
    const router = useRouter();

    const form = useForm<NewEntityTypeFormValues>({
        defaultValues: {
            key: "",
            singularName: "",
            pluralName: "",
            description: "",
            type: EntityCategory.STANDARD,
            icon: IconType.DATABASE,
            iconColour: IconColour.NEUTRAL,
        },
        resolver: zodResolver(baseEntityTypeFormSchema),
    });

    const handleSubmit = async (values: NewEntityTypeFormValues): Promise<void> => {
        // Create the entity type request with a default "name" attribute
        const request: CreateEntityTypeRequest = {
            key: values.key,
            name: {
                singular: values.singularName,
                plural: values.pluralName,
            },
            description: values.description,
            type: values.type,
            icon: {
                icon: values.icon,
                colour: values.iconColour,
            },
        };

        await publishType(request);
    };

    const { mutateAsync: publishType } = useMutation({
        mutationFn: (request: CreateEntityTypeRequest) =>
            EntityTypeService.publishEntityType(session, organisationId, request),
        onMutate: () => {
            submissionToastRef.current = toast.loading("Creating entity type...");
        },
        onError: (error: Error) => {
            toast.dismiss(submissionToastRef.current);
            toast.error(`Failed to create entity type: ${error.message}`);
            submissionToastRef.current = undefined;
        },
        onSuccess: (response: EntityType) => {
            toast.dismiss(submissionToastRef.current);
            toast.success(`Entity type created successfully!`);
            submissionToastRef.current = undefined;
            router.push(
                `/dashboard/organisation/${organisationId}/entity/${response.key}/settings?tab=attributes`
            );

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

    return {
        form,
        keyManuallyEdited,
        setKeyManuallyEdited,
        handleSubmit,
    };
}
