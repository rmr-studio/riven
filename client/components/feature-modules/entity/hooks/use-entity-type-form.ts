import { useAuth } from "@/components/provider/auth-context";
import { EntityTypeRelationshipType } from "@/lib/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { isUUID } from "validator";
import { z } from "zod";
import {
    AttributeFormData,
    EntityTypeOrderingKey,
    RelationshipFormData,
    type EntityType,
} from "../interface/entity.interface";
import { EntityTypeService } from "../service/entity-type.service";
import { baseEntityTypeFormSchema } from "./use-new-entity-type-form";

// Zod schema for entity type form
const entityTypeFormSchema = z
    .object({
        identifierKey: z.string().refine(isUUID),
    })
    .extend(baseEntityTypeFormSchema.shape);

export type EntityTypeFormValues = z.infer<typeof entityTypeFormSchema>;

export interface UseEntityTypeFormReturn {
    form: UseFormReturn<EntityTypeFormValues>;
    handleSubmit: (
        values: EntityTypeFormValues,
        newAttributes: AttributeFormData[],
        newRelationships: RelationshipFormData[],
        order: EntityTypeOrderingKey[]
    ) => Promise<void>;
}

export function useEntityTypeForm(
    organisationId: string,
    entityType: EntityType
): UseEntityTypeFormReturn {
    const router = useRouter();
    const form = useForm<EntityTypeFormValues>({
        resolver: zodResolver(entityTypeFormSchema),
        defaultValues: {
            key: entityType.key,
            singularName: entityType.name.singular,
            pluralName: entityType.name.plural,
            identifierKey: entityType.identifierKey,
            description: entityType.description ?? "",
            type: entityType.type,
            icon: "database",
        },
    });
    const { session } = useAuth();
    const queryClient = useQueryClient();
    // Ref to track pending submission toast
    const submissionToastRef = useRef<string | number | undefined>(undefined);

    const handleSubmit = async (
        values: EntityTypeFormValues,
        attributeSchema: AttributeFormData[],
        relationships: RelationshipFormData[],
        order: EntityTypeOrderingKey[]
    ): Promise<void> => {
        // Validation: At least one unique attribute must exist
        const hasUniqueAttribute = attributeSchema.some((attr) => attr.unique);
        if (!hasUniqueAttribute) {
            form.setError("root", {
                type: "manual",
                message: "At least one attribute must be marked as unique",
            });
            return;
        }

        // Validation: Identifier key must reference a unique attribute
        if (values.identifierKey) {
            const identifierAttribute = attributeSchema.find(
                (attr) => attr.id === values.identifierKey
            );
            if (identifierAttribute && !identifierAttribute.unique) {
                form.setError("identifierKey", {
                    type: "manual",
                    message: "The identifier key must reference a unique attribute",
                });
                return;
            }
        }

        // Validation: Relationship type entities must have at least 2 relationships
        if (values.type === "RELATIONSHIP" && relationships.length < 2) {
            form.setError("root", {
                type: "manual",
                message:
                    "Entity types with 'Relationship' type must have at least 2 relationships defined",
            });
            return;
        }

        // Clear any previous errors
        form.clearErrors();

        const relationshipSourceKeys: Map<string, string> = new Map();
        entityType.relationships?.forEach((rel) => {
            relationshipSourceKeys.set(rel.id, rel.sourceEntityTypeKey);
        });

        const updatedType: EntityType = {
            ...entityType,
            key: values.key,
            name: {
                singular: values.singularName,
                plural: values.pluralName,
            },
            identifierKey: values.identifierKey,
            description: values.description,
            type: values.type,
            schema: {
                ...entityType.schema,
                properties: attributeSchema.reduce((acc, attr) => {
                    acc[attr.id] = {
                        label: attr.label,
                        key: attr.schemaKey,
                        type: attr.dataType,
                        format: attr.dataFormat,
                        required: attr.required,
                        unique: attr.unique,
                        protected: attr.protected,
                    };
                    return acc;
                }, {} as Record<string, any>),
            },

            // Remap source key
            relationships: relationships.map((rel) => ({
                id: rel.id,
                name: rel.label,
                sourceEntityTypeKey: relationshipSourceKeys.get(rel.id) || values.key,
                relationshipType: EntityTypeRelationshipType.REFERENCE,
                entityTypeKeys: rel.entityTypeKeys,
                allowPolymorphic: rel.allowPolymorphic,
                required: rel.required,
                cardinality: rel.cardinality,
                bidirectional: rel.bidirectional,
                bidirectionalEntityTypeKeys: rel.bidirectionalEntityTypeKeys,
                inverseName: rel.inverseName,
                protected: false,
            })),
            order: order,
        };

        await updateType(updatedType);
    };

    const { mutateAsync: updateType } = useMutation({
        mutationFn: (type: EntityType) =>
            EntityTypeService.updateEntityType(session, organisationId, type),
        onMutate: () => {
            submissionToastRef.current = toast.loading("Updating entity type...");
        },
        onError: (error: Error) => {
            toast.dismiss(submissionToastRef.current);
            toast.error(`Failed to update entity type: ${error.message}`);
            submissionToastRef.current = undefined;
        },
        onSuccess: (response: EntityType) => {
            toast.dismiss(submissionToastRef.current);
            toast.success(`Entity type updated successfully!`);
            submissionToastRef.current = undefined;

            // Update the specific entity type in cache
            queryClient.setQueryData(["entityType", response.key, organisationId], response);

            // Update the entity types list in cache
            queryClient.setQueryData<EntityType[]>(["entityTypes", organisationId], (oldData) => {
                if (!oldData) return [response];

                // Replace the updated entity type in the list
                return oldData.map((et) => (et.key === response.key ? response : et));
            });

            // Stay on the same page after update
            return response;
        },
    });

    return {
        form,
        handleSubmit,
    };
}
