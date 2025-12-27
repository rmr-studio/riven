import { EntityCategory, IconColour, IconType } from "@/lib/types/types";
import { iconFormSchema } from "@/lib/util/form/common/icon.form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { CreateEntityTypeRequest, EntityType } from "../../../interface/entity.interface";
import { usePublishEntityTypeMutation } from "../../mutation/type/use-publish-type-mutation";

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

    const { mutateAsync: publishType } = usePublishEntityTypeMutation(organisationId, {
        onSuccess: (response: EntityType) => {
            router.push(
                `/dashboard/organisation/${organisationId}/entity/${response.key}/settings?tab=attributes`
            );
        },
    });

    return {
        form,
        keyManuallyEdited,
        setKeyManuallyEdited,
        handleSubmit,
    };
}
