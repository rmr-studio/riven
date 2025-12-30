"use client";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { EntityPropertyType } from "@/lib/types/types";
import { Row } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { FC, useMemo, useState } from "react";
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
        // Create maps for quick lookup
        const attributeCellsMap = new Map(
            Object.entries(entityType.schema.properties || {}).map(([attributeId, schema]) => {
                const width = columnSizeMap.get(attributeId);
                return [
                    attributeId,
                    <TableCell
                        key={attributeId}
                        className="border-l border-l-accent/40 first:border-l-transparent p-2"
                        style={{
                            width: width ? `${width}px` : undefined,
                            maxWidth: width ? `${width}px` : undefined,
                        }}
                    >
                        <EntityFieldCell attributeId={attributeId} schema={schema} />
                    </TableCell>,
                ];
            })
        );

        const relationshipCellsMap = new Map(
            (entityType.relationships || []).map((relationship) => {
                const width = columnSizeMap.get(relationship.id);
                return [
                    relationship.id,
                    <TableCell
                        key={relationship.id}
                        className="border-l border-l-accent/40 first:border-l-transparent p-2"
                        style={{
                            width: width ? `${width}px` : undefined,
                            maxWidth: width ? `${width}px` : undefined,
                        }}
                    >
                        <EntityRelationshipPicker relationship={relationship} />
                    </TableCell>,
                ];
            })
        );
        if (!entityType.columns) return [];
        return entityType.columns
            .map((attribute) => {
                const { type, key: id } = attribute;
                if (type === EntityPropertyType.ATTRIBUTE) {
                    return attributeCellsMap.get(attribute.key);
                } else if (type === EntityPropertyType.RELATIONSHIP) {
                    return relationshipCellsMap.get(attribute.key);
                }
            })
            .filter((cell) => !!cell);
    }, [entityType, columnSizeMap]);

    // Check if form is valid
    const hasErrors = Object.keys(form.formState.errors).length > 0;
    return (
        <>
            <TableRow className="bg-muted/30 border-dashed hover:bg-muted/40 relative">
                {/* Ordered cells (attributes and relationships) */}
                {orderedCells}

                {/* Action buttons */}
            </TableRow>
            <div className="w-24 border-dashed absolute bottom-3 right-2">
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
            </div>
        </>
    );
};
