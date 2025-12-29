"use client";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { EntityPropertyType } from "@/lib/types/types";
import { Check, X } from "lucide-react";
import { FC, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useEntityDraft } from "../../context/entity-provider";
import { EntityType } from "../../interface/entity.interface";
import { EntityFieldCell } from "../forms/instance/entity-field-cell";
import { EntityRelationshipPicker } from "../forms/instance/entity-relationship-picker";

export interface EntityDraftRowProps {
    entityType: EntityType;
}

export const EntityDraftRow: FC<EntityDraftRowProps> = ({ entityType }) => {
    const { form, resetDraft, submitDraft } = useEntityDraft();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await submitDraft();
            toast.success("Entity created successfully!");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create entity";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        resetDraft();
    };

    // Build ordered cells based on entityType.order
    const orderedCells = useMemo(() => {
        // Create maps for quick lookup
        const attributeCellsMap = new Map(
            Object.entries(entityType.schema.properties || {}).map(([attributeId, schema]) => [
                attributeId,
                <TableCell key={attributeId} className="border-dashed p-2">
                    <EntityFieldCell attributeId={attributeId} schema={schema} />
                </TableCell>,
            ])
        );

        const relationshipCellsMap = new Map(
            (entityType.relationships || []).map((relationship) => [
                relationship.id,
                <TableCell key={relationship.id} className="border-dashed p-2">
                    <EntityRelationshipPicker relationship={relationship} />
                </TableCell>,
            ])
        );
        if (!entityType.order) return [];
        return entityType.order
            .map((attribute) => {
                const { type, key: id } = attribute;
                if (type === EntityPropertyType.ATTRIBUTE) {
                    return attributeCellsMap.get(attribute.key);
                } else if (type === EntityPropertyType.RELATIONSHIP) {
                    return relationshipCellsMap.get(attribute.key);
                }
            })
            .filter((cell) => !!cell);
    }, [entityType]);

    // Check if form is valid
    const isValid = form.formState.isValid && !form.formState.isValidating;
    const hasErrors = Object.keys(form.formState.errors).length > 0;

    useEffect(() => {
        console.log("Form errors updated:", form.formState.errors);
    }, [form.formState.errors]);

    return (
        <TableRow className="bg-muted/30 border-dashed hover:bg-muted/40">
            {/* Ordered cells (attributes and relationships) */}
            {orderedCells}

            {/* Action buttons */}
            <TableCell className="w-24 border-dashed">
                <div className="flex gap-2 justify-end">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={handleSubmit}
                        disabled={isSubmitting || hasErrors}
                        title={
                            hasErrors ? "Please fix validation errors" : "Submit and create entity"
                        }
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleReset}
                        disabled={isSubmitting}
                        title="Cancel and discard draft"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};
