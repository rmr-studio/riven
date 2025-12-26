"use client";

import { FC, useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { EntityType } from "../../interface/entity.interface";
import { useEntityInstanceDraftStore } from "../../context/entity-instance-draft-provider";
import { useDraftForm } from "../../context/entity-instance-draft-provider";
import { EntityInstanceFieldCell } from "../forms/instance/entity-instance-field-cell";
import { EntityInstanceRelationshipPicker } from "../forms/instance/entity-instance-relationship-picker";

export interface EntityInstanceDraftRowProps {
    entityType: EntityType;
}

export const EntityInstanceDraftRow: FC<EntityInstanceDraftRowProps> = ({
    entityType,
}) => {
    const { submitDraft, resetDraft } = useEntityInstanceDraftStore((state) => ({
        submitDraft: state.submitDraft,
        resetDraft: state.resetDraft,
    }));

    const form = useDraftForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await submitDraft();
            toast.success("Entity created successfully!");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to create entity";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        resetDraft();
    };

    // Build cells for each attribute in order
    const attributeCells = Object.entries(entityType.schema.properties || {}).map(
        ([attributeId, schema]) => (
            <TableCell key={attributeId} className="border-dashed p-2">
                <EntityInstanceFieldCell
                    attributeId={attributeId}
                    schema={schema}
                    entityTypeKey={entityType.key}
                />
            </TableCell>
        )
    );

    // Build cells for relationships (if any)
    const relationshipCells =
        entityType.relationships?.map((relationship) => (
            <TableCell key={relationship.id} className="border-dashed p-2">
                <EntityInstanceRelationshipPicker relationship={relationship} />
            </TableCell>
        )) ?? [];

    // Check if form is valid
    const isValid = form.formState.isValid && !form.formState.isValidating;
    const hasErrors = Object.keys(form.formState.errors).length > 0;

    return (
        <TableRow className="bg-muted/30 border-dashed hover:bg-muted/40">
            {/* Empty cell for drag handle column (disabled for draft row) */}
            <TableCell className="w-8 border-dashed" />

            {/* Attribute cells */}
            {attributeCells}

            {/* Relationship cells */}
            {relationshipCells}

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
                            hasErrors
                                ? "Please fix validation errors"
                                : "Submit and create entity"
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
