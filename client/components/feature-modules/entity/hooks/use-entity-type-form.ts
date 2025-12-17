import { useAuth } from "@/components/provider/auth-context";
import { DataType, EntityCategory, SchemaType } from "@/lib/types/types";
import { toKeyCase } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
    AttributeFormData,
    CreateEntityTypeRequest,
    EntityTypeOrderingKey,
    RelationshipFormData,
    type EntityType,
} from "../interface/entity.interface";
import { EntityTypeService } from "../service/entity-type.service";

// Zod schema for entity type form
const entityTypeFormSchema = z.object({
    key: z.string().min(1, "Key is required"),
    singularName: z.string().min(1, "Singular variant of the name is required"),
    pluralName: z.string().min(1, "Plural variant of the name is required"),
    identifierKey: z.string(),
    description: z.string().optional(),
    type: z.nativeEnum(EntityCategory),
    icon: z.string().optional(),
});

export type EntityTypeFormValues = z.infer<typeof entityTypeFormSchema>;

export interface UseEntityTypeFormReturn {
    form: UseFormReturn<EntityTypeFormValues>;
    keyManuallyEdited: boolean;
    setKeyManuallyEdited: (value: boolean) => void;
    handleSubmit: (
        values: EntityTypeFormValues,
        newAttributes: AttributeFormData[],
        newRelationships: RelationshipFormData[],
        order: EntityTypeOrderingKey[]
    ) => Promise<void>;
}

export function useEntityTypeForm(
    organisationId: string,
    entityType?: EntityType,
    mode: "create" | "edit" = "create"
): UseEntityTypeFormReturn {
    const router = useRouter();
    const form = useForm<EntityTypeFormValues>({
        resolver: zodResolver(entityTypeFormSchema),
        defaultValues: {
            key: entityType?.key ?? "",
            singularName: entityType?.name?.singular ?? "",
            pluralName: entityType?.name?.plural ?? "",
            identifierKey: entityType?.identifierKey ?? "name",
            description: entityType?.description ?? "",
            type: entityType?.type ?? EntityCategory.STANDARD,
            icon: "database",
        },
    });
    const { session } = useAuth();
    const queryClient = useQueryClient();
    // Ref to track pending submission toast
    const submissionToastRef = useRef<string | number | undefined>(undefined);
    const [keyManuallyEdited, setKeyManuallyEdited] = useState(mode === "edit");

    // Watch the pluralName field for dynamic title and key generation
    const pluralName = form.watch("pluralName");

    // Auto-generate key from pluralName in create mode
    useEffect(() => {
        if (mode === "create" && !keyManuallyEdited && pluralName) {
            const generatedKey = toKeyCase(pluralName);
            form.setValue("key", generatedKey, { shouldValidate: false });
        }
    }, [pluralName, mode, keyManuallyEdited, form]);

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
                (attr) => attr.key === values.identifierKey
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

        if (mode === "create") {
            const request: CreateEntityTypeRequest = {
                key: values.key,
                organisationId: organisationId,
                name: {
                    singular: values.singularName,
                    plural: values.pluralName,
                },
                identifier: values.identifierKey,
                description: values.description,
                type: values.type,
                schema: {
                    key: SchemaType.OBJECT,
                    properties: attributeSchema.reduce((acc, attr) => {
                        acc[attr.key] = {
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
                    type: DataType.OBJECT,
                    protected: true,
                    required: true,
                    unique: false,
                },
                relationships: relationships.map((rel) => ({
                    ...rel,
                    name: rel.label,
                })),
                order: order,
            };

            await publishType(request);
            return;
        }

        if (!entityType) {
            throw new Error("Entity type is required for edit mode");
        }

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
                    acc[attr.key] = {
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
            relationships: relationships.map((rel) => ({
                ...rel,
                name: rel.label,
            })),
            order: order,
        };

        await updateType(updatedType);
    };

    const { mutateAsync: publishType } = useMutation({
        mutationFn: (request: CreateEntityTypeRequest) =>
            EntityTypeService.publishEntityType(session, request),
        onMutate: () => {
            submissionToastRef.current = toast.loading("Creating entity type...");
        },
        onError: (error: Error) => {
            toast.dismiss(submissionToastRef.current);
            toast.error(
                `Failed to ${mode === "create" ? "create" : "update"} entity type: ${error.message}`
            );
            submissionToastRef.current = undefined;
        },
        onSuccess: (response: EntityType) => {
            toast.dismiss(submissionToastRef.current);
            toast.success(`Entity type ${mode === "create" ? "created" : "updated"} successfully!`);
            submissionToastRef.current = undefined;

            // Update the specific entity type in cache
            queryClient.setQueryData(["entityType", response.key, organisationId], response);

            // Update the entity types list in cache
            queryClient.setQueryData<EntityType[]>(["entityTypes", organisationId], (oldData) => {
                if (!oldData) return [response];

                // Add new entity type to the list
                return [...oldData, response];
            });

            router.push(`dashboard/organisation/${organisationId}/entity`);

            return response;
        },
    });

    const { mutateAsync: updateType } = useMutation({
        mutationFn: (type: EntityType) => EntityTypeService.updateEntityType(session, type),
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
            toast.success(`Entity type ${mode === "create" ? "created" : "updated"} successfully!`);
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
        keyManuallyEdited,
        setKeyManuallyEdited,
        handleSubmit,
    };
}
