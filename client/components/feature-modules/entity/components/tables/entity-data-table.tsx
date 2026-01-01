"use client";

import { Button } from "@/components/ui/button";
import {
    ColumnOrderingConfig,
    ColumnResizingConfig,
    DataTable,
    DataTableProvider,
} from "@/components/ui/data-table";
import { DEFAULT_COLUMN_WIDTH } from "@/components/ui/data-table/data-table";
import { Form } from "@/components/ui/form";
import { SchemaUUID } from "@/lib/interfaces/common.interface";
import { ClassNameProps } from "@/lib/interfaces/interface";
import { EntityPropertyType } from "@/lib/types/types";
import { debounce } from "@/lib/util/debounce.util";
import { Row } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { FC, useCallback, useMemo, useRef } from "react";
import { useConfigFormState } from "../../context/configuration-provider";
import { useEntityDraft } from "../../context/entity-provider";
import { useSaveEntityMutation } from "../../hooks/mutation/instance/use-save-entity-mutation";
import {
    Entity,
    EntityAttributePrimitivePayload,
    EntityAttributeRelationPayloadReference,
    EntityAttributeRequest,
    EntityRelationshipDefinition,
    EntityType,
    isRelationshipPayload,
    SaveEntityRequest,
    SaveEntityResponse,
} from "../../interface/entity.interface";
import { EntityTypeHeader } from "../ui/entity-type-header";
import { EntityTypeSaveButton } from "../ui/entity-type-save-button";
import { EntityDraftRow } from "./entity-draft-row";
import { handleColumnOrderChange } from "./entity-table-order-handler";
import { handleColumnResize } from "./entity-table-resize-handler";
import {
    applyColumnOrdering,
    EntityRow,
    generateColumnsFromEntityType,
    generateFiltersFromEntityType,
    generateSearchConfigFromEntityType,
    isDraftRow,
    transformEntitiesToRows,
} from "./entity-table-utils";

export interface Props extends ClassNameProps {
    entityType: EntityType;
    entities: Entity[];
    loadingEntities?: boolean;
    organisationId: string;
}

// Internal component with draft mode hooks
export const EntityDataTable: FC<Props> = ({
    entityType,
    entities,
    loadingEntities,
    className,
    organisationId,
}) => {
    const { isDraftMode, enterDraftMode } = useEntityDraft();
    const { form, handleSubmit } = useConfigFormState();

    const handleConflict = (request: SaveEntityRequest, response: SaveEntityResponse) => {}

    // Update entity mutation for inline editing
    const { mutateAsync: saveEntity } = useSaveEntityMutation(organisationId, entityType.id, undefined, handleConflict);

    // Transform entities to row data
    const rowData = useMemo(() => {
        const rows = transformEntitiesToRows(entities);

        // Append draft row placeholder when in draft mode (at bottom)
        if (isDraftMode) {
            const draftRow: EntityRow = {
                _entityId: "_draft",
                _isDraft: true,
            };
            return [...rows, draftRow];
        }

        return rows;
    }, [entities, isDraftMode]);

    // Generate columns from entity type with inline editing enabled
    const columns = useMemo(() => {
        const generatedColumns = generateColumnsFromEntityType(entityType, { enableEditing: true });
        return applyColumnOrdering(generatedColumns, entityType.columns);
    }, [entityType]);

    // Generate filters from entity type and actual data
    const filters = useMemo(() => {
        return generateFiltersFromEntityType(entityType, entities);
    }, [entityType, entities]);

    // Generate search configuration
    const searchableColumns = useMemo<string[]>(() => {
        return generateSearchConfigFromEntityType(entityType);
    }, [entityType]);

    const emptyMessage = loadingEntities
        ? "Loading entities..."
        : `No ${entityType.name.plural} found.`;
    const enableSearch = entities.length > 10;

    // Search configuration
    const searchConfig = useMemo(
        () => ({
            enabled: enableSearch && searchableColumns.length > 0,
            searchableColumns: searchableColumns as any,
            placeholder: "Search entities...",
            disabled: isDraftMode,
        }),
        [enableSearch, searchableColumns, isDraftMode]
    );

    // Custom row renderer for draft mode
    const customRowRenderer = useCallback(
        (row: Row<EntityRow>) => {
            // Check if this is the draft row using type-safe guard
            if (isDraftRow(row.original)) {
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
            columnResizeMode: "onChange" as const, // Live resizing during drag
            defaultColumnSize: DEFAULT_COLUMN_WIDTH,
        }),
        []
    );

    // Column ordering configuration
    const columnOrderingConfig: ColumnOrderingConfig = useMemo(
        () => ({
            enabled: true,
        }),
        []
    );

    // Row ID getter for inline editing
    const getRowId = useCallback((row: EntityRow, _index: number) => row._entityId, []);

    // Cell edit handler for inline editing
    const handleCellEdit = useCallback(
        async (
            row: EntityRow,
            columnId: string,
            newValue: any,
            _oldValue: any
        ): Promise<boolean> => {
            // Don't allow editing draft rows
            if (isDraftRow(row)) return false;
            const entity = entities.find((e) => e.id === row._entityId);
            if (!entity) return false;

            // Determine if updated column is an attribute or relationship
            const attributeDef: SchemaUUID | undefined = entityType.schema.properties?.[columnId];
            const relationshipDef: EntityRelationshipDefinition | undefined =
                entityType.relationships?.find((rel) => rel.id === columnId);

            // Prepare updated entity payload
            if (attributeDef) {
                const payloadEntry: EntityAttributePrimitivePayload = {
                    type: EntityPropertyType.ATTRIBUTE,
                    value: newValue,
                    schemaType: attributeDef.key,
                };

                return await updateEntity(entity, columnId, { payload: payloadEntry });
            }

            if (relationshipDef) {
                const relationshipEntry: EntityAttributeRelationPayloadReference = {
                    type: EntityPropertyType.RELATIONSHIP,
                    relations: Array.isArray(newValue) ? newValue : [newValue],
                };

                return await updateEntity(entity, columnId, { payload: relationshipEntry });
            }

            return false;
        },
        [entities, entityType]
    );

    const updateEntity = async (
        entity: Entity,
        columnId: string,
        entry: EntityAttributeRequest
    ): Promise<boolean> => {
        const payload: Map<string, EntityAttributeRequest> = new Map();
        Object.entries(entity.payload).forEach(([key, value]) => {
            if (isRelationshipPayload(value.payload)) {
                payload.set(key, {
                    payload: {
                        type: EntityPropertyType.RELATIONSHIP,
                        relations: value.payload.relations.map((rel) => rel.id),
                    },
                });
            } else {
                payload.set(key, {
                    payload: {
                        type: EntityPropertyType.ATTRIBUTE,
                        value: value.payload.value,
                        schemaType: value.payload.schemaType,
                    },
                });
            }
        });

        const updatedEntity: SaveEntityRequest = {
            id: entity.id,
            payload: {
                ...Object.fromEntries(payload),
                [columnId]: entry,
            },
        };

        const response = await saveEntity(updatedEntity);
        return !response.errors && !!response.entity;
    };

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
                <DataTableProvider
                    initialData={rowData}
                    getRowId={getRowId}
                    onCellEdit={handleCellEdit}
                    onColumnWidthsChange={(columnSizing) =>
                        debouncedResizeHandler(entityType, columnSizing)
                    }
                    onColumnOrderChange={(columnOrder) =>
                        handleColumnOrderChange(entityType, columnOrder)
                    }
                >
                    <DataTable
                        columns={columns}
                        enableInlineEdit={!isDraftMode}
                        rowSelection={{
                            enabled: true,
                            persistCheckboxes: false,
                            clearOnFilterChange: true,
                            actionComponent: ({ selectedRows, clearSelection }) => (
                                <div className="flex gap-2">
                                    <Button>Delete {selectedRows.length}</Button>
                                    <Button>Export</Button>
                                </div>
                            ),
                        }}
                        getRowId={(row) => row._entityId}
                        search={searchConfig}
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
                </DataTableProvider>
            </div>
        </Form>
    );
};
