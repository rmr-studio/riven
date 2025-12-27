"use client";

import { Button } from "@/components/ui/button";
import { ColumnFilter, DataTable, RowActionsConfig } from "@/components/ui/data-table";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { FC, useMemo } from "react";
import {
    EntityDraftProvider,
    useEntityDraftStore,
    useIsDraftMode,
} from "../../context/entity-provider";
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

export interface EntityDataTableProps {
    entityType: EntityType;
    entities: Entity[];
    loadingEntities?: boolean;
    // Feature toggles
    enableSearch?: boolean;
    enableFilters?: boolean;
    enableSorting?: boolean;
    enableDragDrop?: boolean;
    enableDraftMode?: boolean; // NEW: Enable draft mode

    // Customization
    includeRelationships?: boolean;
    customColumns?: ColumnDef<EntityRow>[];
    customFilters?: ColumnFilter<EntityRow>[];
    rowActions?: RowActionsConfig<EntityRow>;
    selectFilterThreshold?: number;

    // Callbacks
    onRowClick?: (entity: Entity) => void;
    onReorder?: (entities: Entity[]) => void;
    onEntityCreated?: (entity: Entity) => void; // NEW: Callback when entity is created

    // Display
    className?: string;
    emptyMessage?: string;
}

// Internal component with draft mode hooks
const EntityDataTableInternal: FC<EntityDataTableProps> = ({
    entityType,
    entities,
    loadingEntities,
    enableSearch = true,
    enableFilters = true,
    enableSorting = true,
    enableDragDrop = false,
    enableDraftMode = false,
    includeRelationships = false,
    customColumns,
    customFilters,
    rowActions,
    selectFilterThreshold = 10,
    onRowClick,
    onReorder,
    onEntityCreated,
    className,
    emptyMessage = "No entities found.",
}) => {
    const isDraftMode = enableDraftMode ? useIsDraftMode() : false;

    // Transform entities to row data
    const rowData = useMemo(() => {
        const rows = transformEntitiesToRows(entities);

        // Prepend draft row placeholder when in draft mode
        if (isDraftMode) {
            const draftRow: EntityRow = {
                _entityId: "_draft",
                _entity: null as any, // Special case for draft
            };
            return [draftRow, ...rows];
        }

        return rows;
    }, [entities, isDraftMode]);

    // Generate columns from entity type
    const columns = useMemo(() => {
        if (customColumns) {
            return customColumns;
        }

        const generatedColumns = generateColumnsFromEntityType(entityType);
        return applyColumnOrdering(generatedColumns, entityType.order);
    }, [entityType, customColumns]);

    // Generate filters from entity type and actual data
    const filters = useMemo(() => {
        if (customFilters) {
            return customFilters;
        }

        return generateFiltersFromEntityType(entityType, entities, selectFilterThreshold);
    }, [entityType, entities, customFilters, selectFilterThreshold]);

    // Generate search configuration
    const searchableColumns = useMemo(() => {
        return generateSearchConfigFromEntityType(entityType);
    }, [entityType]);

    // Handle row click to return full entity object
    const handleRowClick = (row: Row<EntityRow>) => {
        if (onRowClick) {
            onRowClick(row.original._entity);
        }
    };

    // Handle reorder to return entities array
    const handleReorder = (reorderedRows: EntityRow[]) => {
        if (onReorder) {
            const reorderedEntities = reorderedRows.map((row) => row._entity);
            onReorder(reorderedEntities);
        }
    };

    return (
        <div className="space-y-4">
            {/* Draft mode controls */}
            {enableDraftMode && <DraftModeControls />}

            {/* Data table with custom row rendering for draft */}
            <DataTable
                columns={columns}
                data={rowData}
                enableSorting={enableSorting}
                enableDragDrop={enableDragDrop}
                onReorder={handleReorder}
                getRowId={(row) => row._entityId}
                search={{
                    enabled: enableSearch && searchableColumns.length > 0,
                    searchableColumns,
                    placeholder: "Search entities...",
                }}
                filter={
                    enableFilters && filters.length > 0
                        ? {
                              enabled: true,
                              filters,
                          }
                        : undefined
                }
                rowActions={rowActions}
                onRowClick={onRowClick ? handleRowClick : undefined}
                emptyMessage={emptyMessage}
                className={className}
                customRowRender={
                    enableDraftMode
                        ? (row) => {
                              if (row.original._entityId === "_draft") {
                                  return <EntityDraftRow entityType={entityType} />;
                              }
                              return null; // Use default row rendering
                          }
                        : undefined
                }
            />
        </div>
    );
};

// Draft mode controls component
const DraftModeControls: FC = () => {
    const { isDraftMode, enterDraftMode } = useEntityDraftStore((state) => ({
        isDraftMode: state.isDraftMode,
        enterDraftMode: state.enterDraftMode,
    }));

    if (isDraftMode) return null;

    return (
        <div className="flex justify-end">
            <Button onClick={enterDraftMode} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add New
            </Button>
        </div>
    );
};

// Main export component with conditional provider
export const EntityDataTable: FC<EntityDataTableProps> = ({ ...props }) => {
    const { onEntityCreated, entityType } = props;
    const { organisationId } = useParams<{ organisationId: string }>();
    // If draft mode is enabled, wrap with provider
    if (props.enableDraftMode) {
        return (
            <EntityDraftProvider
                organisationId={organisationId}
                entityType={entityType}
                onEntityCreated={onEntityCreated}
            >
                <EntityDataTableInternal {...props} />
            </EntityDraftProvider>
        );
    }

    // Otherwise render directly
    return <EntityDataTableInternal {...props} />;
};

export default EntityDataTable;
