"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { EntityPropertyType } from "@/lib/types/types";
import { Row } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useEntityDraft } from "../../context/entity-provider";
import { EntityType } from "../../interface/entity.interface";
import { EntityFieldCell } from "../forms/instance/entity-field-cell";
import { EntityRelationshipPicker } from "../forms/instance/entity-relationship-picker";
import { EntityRow } from "./entity-table-utils";

export interface EntityDraftRowProps {
    entityType: EntityType;
    row: Row<EntityRow>;
}

export const EntityDraftRow: FC<EntityDraftRowProps> = ({ entityType, row }) => {
    const { form, resetDraft, submitDraft } = useEntityDraft();
    // Check if form is valid
    const hasErrors = Object.keys(form.formState.errors).length > 0;

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async () => {
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
    }, [submitDraft]);

    const handleReset = useCallback(() => {
        resetDraft();
    }, [resetDraft]);

    // Keyboard event listeners for Enter (submit) and Escape (cancel)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Enter key: submit the draft
            if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                // Don't submit if there are errors or already submitting
                if (!hasErrors && !isSubmitting) {
                    event.preventDefault();
                    handleSubmit();
                }
            }

            // Escape key: cancel and reset the draft
            if (event.key === "Escape") {
                if (!isSubmitting) {
                    event.preventDefault();
                    handleReset();
                }
            }
        };

        // Add event listener
        window.addEventListener("keydown", handleKeyDown);

        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [hasErrors, isSubmitting, handleSubmit, handleReset]); // Re-attach listener when these dependencies change

    // Build a map of column IDs to their sizes from the row's cells
    const columnSizeMap = useMemo(() => {
        const map = new Map<string, number>();
        row.getVisibleCells().forEach((cell) => {
            map.set(cell.column.id, cell.column.getSize());
        });
        return map;
    }, [row]);

    // Build ordered cells based on entityType.columns
    const orderedCells = useMemo(() => {
        const columnCount = entityType.columns ? entityType.columns.length : 0;
        if (columnCount === 0) return [];
        if (!entityType.columns) return [];

        return entityType.columns.map((item, index) => {
            const { key: id, type } = item;
            const isFirstCell = index === 0;
            const isLastCell = index === columnCount - 1;

            // Create element with autoFocus on first cell
            const element =
                type === EntityPropertyType.ATTRIBUTE ? (
                    <EntityFieldCell
                        attributeId={id}
                        schema={entityType.schema.properties?.[id]}
                        autoFocus={isFirstCell}
                    />
                ) : type === EntityPropertyType.RELATIONSHIP ? (
                    <EntityRelationshipPicker
                        relationship={entityType.relationships?.find((r) => r.id === id)!}
                        autoFocus={isFirstCell}
                    />
                ) : null;

            if (!element) return null;

            const width = columnSizeMap.get(id);
            return (
                <TableCell
                    key={id}
                    className="border-l border-l-accent/40 first:border-l-transparent p-2 relative"
                    style={{
                        width: width ? `${width}px` : undefined,
                        maxWidth: width ? `${width}px` : undefined,
                    }}
                >
                    {element}
                    {/* Append action buttons to last cell */}
                    {isLastCell && (
                        <div className="flex gap-2 justify-end absolute top-2 right-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={handleSubmit}
                                disabled={isSubmitting || hasErrors}
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
                    )}
                </TableCell>
            );
        });
    }, [entityType, columnSizeMap, isSubmitting, hasErrors]);

    return (
        <>
            <TableRow className="bg-muted/30 border-dashed hover:bg-muted/40 relative">
                <TableCell>
                    <Checkbox disabled />
                </TableCell>
                
                    {/* Ordered cells (attributes and relationships) */}
                    {orderedCells}
            
                {/* Action buttons cell */}
            </TableRow>
        </>
    );
};
