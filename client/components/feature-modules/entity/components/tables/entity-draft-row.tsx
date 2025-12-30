"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
    // Check if form is valid
    const hasErrors = Object.keys(form.formState.errors).length > 0;

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
        const columnCount = entityType.columns ? entityType.columns.length : 0;
        if (columnCount === 0) return [];

        // Create maps for quick lookup
        const attributeCellsMap = new Map(
            Object.entries(entityType.schema.properties || {}).map(([attributeId, schema]) => {
                return [attributeId, <EntityFieldCell attributeId={attributeId} schema={schema} />];
            })
        );

        const relationshipCellsMap = new Map(
            (entityType.relationships || []).map((relationship) => {
                return [relationship.id, <EntityRelationshipPicker relationship={relationship} />];
            })
        );
        if (!entityType.columns) return [];
        return (
            entityType.columns
                // .map((attribute) => {
                //     const { type, key: id } = attribute;
                //     if (type === EntityPropertyType.ATTRIBUTE) {
                //         return { id, cell: attributeCellsMap.get(attribute.key) };
                //     } else if (type === EntityPropertyType.RELATIONSHIP) {
                //         return { id, cell: relationshipCellsMap.get(attribute.key) };
                //     }
                // })
                .map((item, index) => {
                    const { key: id, type } = item;
                    const element =
                        type === EntityPropertyType.ATTRIBUTE
                            ? attributeCellsMap.get(id)
                            : relationshipCellsMap.get(id);

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
                            {/* Append action button to last cell */}
                            {index === columnCount - 1 && (
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
                })
        );
    }, [entityType, columnSizeMap]);

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
