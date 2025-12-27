import { EntityTypeRelationshipType, EntityTypeRequestDefinition } from "@/lib/types/types";
import { uuid } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { isUUID } from "validator";
import { z } from "zod";
import {
    EntityRelationshipDefinition,
    EntityType,
    RelationshipLimit,
    SaveRelationshipDefinitionRequest,
    SaveTypeDefinitionRequest,
} from "../../../interface/entity.interface";
import {
    calculateCardinalityFromLimits,
    processCardinalityToLimits,
} from "../../../util/relationship.util";
import { useSaveDefinitionMutation } from "../../mutation/type/use-save-definition-mutation";

export const relationFormSchema = z
    .object({
        name: z.string().min(1, "Name is required"),
        entityTypeKeys: z.array(z.string()).optional(),
        allowPolymorphic: z.boolean(),
        bidirectional: z.boolean(),
        bidirectionalEntityTypeKeys: z.array(z.string()).optional(),
        inverseName: z.string().optional(),
        // Relationship Source Management
        relationshipType: z.nativeEnum(EntityTypeRelationshipType),
        sourceEntityTypeKey: z.string(), // Linking to the source entity type
        originRelationshipId: z.string().optional().nullable(), // Linking to the relationship WITHIN the source entity type (Provided this is a reference definition)
        // Relationship Cardinality
        sourceRelationsLimit: z.nativeEnum(RelationshipLimit),
        targetRelationsLimit: z.nativeEnum(RelationshipLimit),
    })
    .refine(
        (data) => {
            // either entityTypeKeys must have values or allowPolymorphic must be true
            return (
                (data.entityTypeKeys && data.entityTypeKeys.length > 0) ||
                data.allowPolymorphic === true
            );
        },
        {
            message: "Please select at least one entity type or allow all entity types",
            path: ["entityTypeKeys"], // Attach error to the entityTypeKeys field
        }
    )
    // Further Validation based on relationship type for bidirectional relationship referencing
    .refine(
        (data) => {
            if (data.relationshipType === EntityTypeRelationshipType.REFERENCE) {
                return !!data.originRelationshipId && isUUID(data.originRelationshipId);
            }
            return true;
        },
        {
            message:
                "Origin Relationship ID must be present on a Reference relationship, and must be a valid UUID",
            path: ["originRelationshipId"], // Attach error to the originRelationshipId field
        }
    );

export type RelationshipFormValues = z.infer<typeof relationFormSchema>;

export interface UseEntityRelationshipFormReturn {
    form: UseFormReturn<RelationshipFormValues>;
    handleSubmit: (values: RelationshipFormValues) => void;
    handleReset: () => void;
    mode: "create" | "edit";
}

export function useEntityTypeRelationshipForm(
    organisationId: string,
    type: EntityType,
    open: boolean,
    onSave: () => void,
    onCancel: () => void,
    relationship?: EntityRelationshipDefinition
): UseEntityRelationshipFormReturn {
    const form = useForm<RelationshipFormValues>({
        resolver: zodResolver(relationFormSchema),
        defaultValues: {
            name: relationship?.name || "",
            entityTypeKeys: relationship?.entityTypeKeys || [],
            allowPolymorphic: relationship?.allowPolymorphic || false,
            sourceRelationsLimit: relationship?.cardinality
                ? processCardinalityToLimits(relationship?.cardinality).source
                : RelationshipLimit.SINGULAR,
            targetRelationsLimit: relationship?.cardinality
                ? processCardinalityToLimits(relationship?.cardinality).target
                : RelationshipLimit.SINGULAR,
            bidirectional: relationship?.bidirectional || false,
            bidirectionalEntityTypeKeys: relationship?.bidirectionalEntityTypeKeys || [],
            inverseName: relationship?.inverseName || "",
            // By default. Treat all new relationships as Origin type. Form would update to Reference if needed (ie. Due to overlap prompting)
            relationshipType: relationship?.relationshipType || EntityTypeRelationshipType.ORIGIN,
            sourceEntityTypeKey: relationship?.sourceEntityTypeKey || type.key,
            originRelationshipId: relationship?.originRelationshipId || undefined,
        },
    });

    // When the dialogue is opened for editing, populate the form with existing attribute data, or blank for new attribute
    useEffect(() => {
        if (!open || !relationship) return;

        form.reset({
            name: relationship.name,
            entityTypeKeys: relationship.entityTypeKeys,
            allowPolymorphic: relationship.allowPolymorphic,
            sourceRelationsLimit: relationship.cardinality
                ? processCardinalityToLimits(relationship.cardinality).source
                : RelationshipLimit.SINGULAR,
            targetRelationsLimit: relationship.cardinality
                ? processCardinalityToLimits(relationship.cardinality).target
                : RelationshipLimit.SINGULAR,
            bidirectional: relationship.bidirectional,
            bidirectionalEntityTypeKeys: relationship.bidirectionalEntityTypeKeys || [],
            inverseName: relationship.inverseName || "",
            relationshipType: relationship.relationshipType,
            sourceEntityTypeKey: relationship.sourceEntityTypeKey,
            originRelationshipId: relationship.originRelationshipId || undefined,
        });
    }, [open, relationship]);

    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                form.reset();
            }, 500);
        }
    }, [open]);

    const { mutateAsync: saveDefinition } = useSaveDefinitionMutation(organisationId, {
        onSuccess: () => {
            onSave();
        },
    });

    const handleSubmit = useCallback(
        async (values: RelationshipFormValues) => {
            const id = relationship?.id ?? uuid();
            const definition: SaveRelationshipDefinitionRequest = {
                type: EntityTypeRequestDefinition.SAVE_RELATIONSHIP,
                id,
                key: type.key,
                relationship: {
                    id,
                    name: values.name,
                    required: false,
                    protected: false,
                    entityTypeKeys: values.entityTypeKeys,
                    allowPolymorphic: values.allowPolymorphic,
                    bidirectional: values.bidirectional,
                    bidirectionalEntityTypeKeys: values.bidirectionalEntityTypeKeys,
                    inverseName: values.inverseName,
                    relationshipType: values.relationshipType,
                    cardinality: calculateCardinalityFromLimits(
                        values.sourceRelationsLimit,
                        values.targetRelationsLimit
                    ),
                    sourceEntityTypeKey: values.sourceEntityTypeKey,
                    originRelationshipId: values.originRelationshipId || undefined,
                },
            };

            const request: SaveTypeDefinitionRequest = {
                index: undefined,
                definition,
            };

            await saveDefinition(request);
        },
        [relationship, type]
    );

    return {
        form,
        handleSubmit,
        handleReset: onCancel,
        mode: relationship ? "edit" : "create",
    };
}
