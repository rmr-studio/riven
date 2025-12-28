"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ClassNameProps } from "@/lib/interfaces/interface";
import { Row } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { FC, useCallback, useMemo } from "react";
import { useEntityDraft } from "../../context/entity-provider";
import { Entity, EntityType } from "../../interface/entity.interface";
import { EntityDraftRow } from "./entity-draft-row";
import {
    EntityRow,
    applyColumnOrdering,
    generateColumnsFromEntityType,
    generateFiltersFromEntityType,
    generateSearchConfigFromEntityType,
    transformEntitiesToRows,
} from "./entity-table-utils";

export interface Props extends ClassNameProps {
    entityType: EntityType;
    entities: Entity[];
    loadingEntities?: boolean;
}

// Internal component with draft mode hooks
export const EntityDataTable: FC<Props> = ({
    entityType,
    entities,
    loadingEntities,
    className,
}) => {
    const { isDraftMode, enterDraftMode } = useEntityDraft();

    // Transform entities to row data
    const rowData = useMemo(() => {
        const rows = transformEntitiesToRows(entities);

        // Append draft row placeholder when in draft mode (at bottom)
        if (isDraftMode) {
            const draftRow: EntityRow = {
                _entityId: "_draft",
                _entity: null as any, // Special case for draft
            };
            return [...rows, draftRow];
        }

        return rows;
    }, [entities, isDraftMode]);

    // Generate columns from entity type
    const columns = useMemo(() => {
        const generatedColumns = generateColumnsFromEntityType(entityType);
        return applyColumnOrdering(generatedColumns, entityType.order);
    }, [entityType]);

    // Generate filters from entity type and actual data
    const filters = useMemo(() => {
        return generateFiltersFromEntityType(entityType, entities);
    }, [entityType, entities]);

    // Generate search configuration
    const searchableColumns = useMemo(() => {
        return generateSearchConfigFromEntityType(entityType);
    }, [entityType]);

    const emptyMessage = loadingEntities
        ? "Loading entities..."
        : `No ${entityType.name.plural} found.`;
    const enableSearch = entities.length > 10;

    // Custom row renderer for draft mode
    const customRowRenderer = useCallback(
        (row: Row<EntityRow>) => {
            // Check if this is the draft row
            if (row.original._entityId === "_draft") {
                return <EntityDraftRow key="_draft" entityType={entityType} />;
            }
            return null; // Use default rendering
        },
        [entityType]
    );

    return (
        <div className="space-y-4">
            {/* Draft mode controls */}
            <div className="flex justify-end">
                <Button onClick={enterDraftMode} variant="outline" size="sm" disabled={isDraftMode}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                </Button>
            </div>

            {/* Data table with custom row rendering for draft */}
            <DataTable
                columns={columns}
                data={rowData}
                enableSorting={true}
                // enableDragDrop={enableDragDrop}
                // onReorder={handleReorder}
                getRowId={(row) => row._entityId}
                search={{
                    enabled: enableSearch && searchableColumns.length > 0,
                    searchableColumns,
                    placeholder: "Search entities...",
                }}
                filter={{
                    enabled: filters.length > 0,
                    filters,
                }}
                emptyMessage={emptyMessage}
                className={className}
                customRowRenderer={customRowRenderer}
                isDraftMode={isDraftMode}
            />
        </div>
    );
};
