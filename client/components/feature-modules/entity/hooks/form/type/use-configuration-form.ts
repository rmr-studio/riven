import { SchemaUUID } from "@/lib/interfaces/common.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { isUUID } from "validator";
import { z } from "zod";
import { EntityTypeOrderingKey, type EntityType } from "../../../interface/entity.interface";
import { useSaveEntityTypeConfiguration } from "../../mutation/type/use-save-configuration-mutation";
import { baseEntityTypeFormSchema } from "./use-new-type-form";

// Zod schema for entity type form
const entityTypeFormSchema = z
    .object({
        identifierKey: z.string().min(1, "Identifier key is required").refine(isUUID),
        order: z.inf,
    })
    .extend(baseEntityTypeFormSchema.shape);

export type EntityTypeFormValues = z.infer<typeof entityTypeFormSchema>;

export interface UseEntityTypeFormReturn {
    unsavedChanges: boolean;
    form: UseFormReturn<EntityTypeFormValues>;
    handleSubmit: (
        values: EntityTypeFormValues,

        order: EntityTypeOrderingKey[]
    ) => Promise<void>;
}

export function useEntityTypeForm(
    organisationId: string,
    entityType: EntityType
): UseEntityTypeFormReturn {
    const form = useForm<EntityTypeFormValues>({
        resolver: zodResolver(entityTypeFormSchema),
        defaultValues: {
            key: entityType.key,
            singularName: entityType.name.singular,
            pluralName: entityType.name.plural,
            identifierKey: entityType.identifierKey,
            description: entityType.description ?? "",
            type: entityType.type,
            icon: entityType.icon.icon,
            iconColour: entityType.icon.colour,
        },
    });

    const handleSubmit = async (values: EntityTypeFormValues): Promise<void> => {
        // Validation: Identifier key must reference a unique attribute
        if (!entityType.schema.properties) return;

        const identifierAttribute = Object.entries(entityType.schema.properties).find(
            ([key, attr]: [string, SchemaUUID]) => key === values.identifierKey
        );

        if (!identifierAttribute) {
            form.setError("identifierKey", {
                type: "manual",
                message: "The identifier key must reference an existing attribute",
            });
            return;
        }

        const [, attrSchema] = identifierAttribute;

        if (!attrSchema.unique || !attrSchema.required) {
            form.setError("identifierKey", {
                type: "manual",
                message: "The identifier key must reference a mandatory unique attribute",
            });
            return;
        }

        // Clear any previous errors
        form.clearErrors();

        const updatedType: EntityType = {
            ...entityType,
            key: values.key,
            name: {
                singular: values.singularName,
                plural: values.pluralName,
            },
            icon: {
                icon: values.icon,
                colour: values.iconColour,
            },
            identifierKey: values.identifierKey,
            description: values.description,
            type: values.type,
        };

        await updateType(updatedType);
    };

    const { mutateAsync: updateType } = useSaveEntityTypeConfiguration(organisationId);

    return {
        form,
        handleSubmit,
    };
}
