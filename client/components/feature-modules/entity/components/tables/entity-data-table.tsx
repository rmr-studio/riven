"use client";

import { Button } from "@/components/ui/button";
import { ColumnOrderingConfig, ColumnResizingConfig, DataTable } from "@/components/ui/data-table";
import { Form } from "@/components/ui/form";
import { ClassNameProps } from "@/lib/interfaces/interface";
import { debounce } from "@/lib/util/debounce.util";
import { Row } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { FC, useCallback, useMemo, useRef } from "react";
import { useConfigFormState } from "../../context/configuration-provider";
import { useEntityDraft } from "../../context/entity-provider";
import { Entity, EntityType } from "../../interface/entity.interface";
import { EntityTypeHeader } from "../ui/entity-type-header";
import { EntityTypeSaveButton } from "../ui/entity-type-save-button";
import { EntityDraftRow } from "./entity-draft-row";
import { handleColumnOrderChange } from "./entity-table-order-handler";
import { handleColumnResize } from "./entity-table-resize-handler";
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
    const { form, handleSubmit } = useConfigFormState();

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
        return applyColumnOrdering(generatedColumns, entityType.columns);
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
                return <EntityDraftRow key="_draft" entityType={entityType} row={row} />;
            }
            return null; // Use default rendering
        },
        [entityType]
    );

    // Create debounced resize handler (stable across re-renders)
    const debouncedResizeHandler = useRef(
        debounce((entityType: EntityType, columnSizing: Record<string, number>) => {
            handleColumnResize(entityType, columnSizing);
        }, 500) // Wait 500ms after user stops dragging before persisting
    ).current;

    // Column resizing configuration
    const columnResizingConfig: ColumnResizingConfig = useMemo(
        () => ({
            enabled: true,
            columnResizeMode: "onChange", // Live resizing during drag
            defaultColumnSize: 150,
            onColumnWidthsChange: (columnSizing) =>
                debouncedResizeHandler(entityType, columnSizing),
        }),
        [entityType, debouncedResizeHandler]
    );

    // Column ordering configuration
    const columnOrderingConfig: ColumnOrderingConfig = useMemo(
        () => ({
            enabled: true,
            onColumnOrderChange: (columnOrder) => handleColumnOrderChange(entityType, columnOrder),
        }),
        [entityType]
    );

    return (
        <Form {...form}>
            <div className="space-y-4">
                {/* Draft mode controls */}
                <div>
                    <div className="flex justify-between">
                        <EntityTypeHeader>
                            <span className="text-sm text-muted-foreground">
                                Manage your entities and their data
                            </span>
                        </EntityTypeHeader>
                        <div className="flex gap-2">
                            <EntityTypeSaveButton onSubmit={handleSubmit} />

                            <Button
                                onClick={enterDraftMode}
                                variant="outline"
                                size="sm"
                                disabled={isDraftMode}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add New
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Data table with custom row rendering for draft */}
                <DataTable
                    columns={columns}
                    data={rowData}
                    // enableSorting={!isDraftMode}
                    // enableDragDrop={enableDragDrop}
                    // onReorder={handleReorder}
                    getRowId={(row) => row._entityId}
                    search={{
                        enabled: enableSearch && searchableColumns.length > 0,
                        searchableColumns,
                        placeholder: "Search entities...",
                        disabled: isDraftMode,
                    }}
                    filter={{
                        enabled: filters.length > 0,
                        filters,
                        disabled: isDraftMode,
                    }}
                    columnResizing={columnResizingConfig}
                    columnOrdering={columnOrderingConfig}
                    emptyMessage={emptyMessage}
                    className={className}
                    customRowRenderer={customRowRenderer}
                    addingNewEntry={isDraftMode}
                />
            </div>
        </Form>
    );
};
