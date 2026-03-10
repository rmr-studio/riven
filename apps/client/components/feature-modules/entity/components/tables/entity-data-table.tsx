'use client';

import { ColumnResizingConfig, DataTable, DataTableProvider } from '@/components/ui/data-table';
import { Form } from '@/components/ui/form';
import { SchemaUUID } from '@/lib/types/common';
import {
  Entity,
  EntityAttributePrimitivePayload,
  EntityAttributeRelationPayloadReference,
  EntityAttributeRequest,
  EntityLink,
  EntityPropertyType,
  EntityType,
  isRelationshipPayload,
  RelationshipDefinition,
  SaveEntityRequest,
  SaveEntityResponse,
} from '@/lib/types/entity';
import { debounce } from '@/lib/util/debounce.util';
import type { ClassNameProps } from '@riven/utils';
import { cn } from '@riven/utils';

import type { QueryFilter } from '@/lib/types/models/QueryFilter';
import { Button } from '@riven/ui/button';
import { Row } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { FC, useCallback, useMemo, useRef, useState } from 'react';
import { useConfigFormState } from '../../context/configuration-provider';
import { useEntityDraft } from '../../context/entity-provider';
import { useSaveEntityMutation } from '../../hooks/mutation/instance/use-save-entity-mutation';
import { EntityQueryBuilder } from '../query/entity-query-builder';
import { EntityTypeHeader } from '../ui/entity-type-header';
import { EntityDraftRow } from './entity-draft-row';
import EntityActionBar from './entity-table-action-bar';
import {
  applyColumnOrdering,
  EntityRow,
  generateColumnsFromEntityType,
  generateFiltersFromEntityType,
  generateSearchConfigFromEntityType,
  isDraftRow,
  transformEntitiesToRows,
} from './entity-table-utils';

export interface Props extends ClassNameProps {
  entityType: EntityType;
  entities: Entity[];
  loadingEntities?: boolean;
  workspaceId: string;
}

// Internal component with draft mode hooks
export const EntityDataTable: FC<Props> = ({
  entityType,
  entities,
  loadingEntities,
  className,
  workspaceId,
}) => {
  const { isDraftMode, enterDraftMode } = useEntityDraft();
  const { form, handleSubmit } = useConfigFormState();

  const handleConflict = (request: SaveEntityRequest, response: SaveEntityResponse) => {};

  // Update entity mutation for inline editing
  const { mutateAsync: saveEntity } = useSaveEntityMutation(
    workspaceId,
    entityType.id,
    undefined,
    handleConflict,
  );

  const handleColumnResize = (entityType: EntityType, columnSizing: Record<string, number>) => {
    // Update entity type columns sizing in form state
    const updatedColumns = entityType.columns.map((col) => {
      return {
        ...col,
        width: columnSizing[col.key] ?? col.width,
      };
    });
    form.setValue('columns', updatedColumns, {
      shouldDirty: true,
    });
  };

  // Transform entities to row data
  const rowData = useMemo(() => {
    // Sort entities by createdAt (oldest first) before transforming
    const sortedEntities = [...entities].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB; // Ascending order (oldest first)
    });

    const rows = transformEntitiesToRows(sortedEntities);

    // Append draft row placeholder when in draft mode (at bottom)
    if (isDraftMode) {
      const draftRow: EntityRow = {
        _entityId: '_draft',
        _isDraft: true,
      };
      return [...rows, draftRow];
    }

    return rows;
  }, [entities, isDraftMode]);

  // Generate columns from entity type with inline editing enabled
  const columns = useMemo(() => {
    const generatedColumns = generateColumnsFromEntityType(entityType, { enableEditing: true });
    console.log(generatedColumns);
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
    ? 'Loading entities...'
    : `No ${entityType.name.plural} found.`;

  // Search configuration — always show when searchable columns exist
  const searchConfig = useMemo(
    () => ({
      // enabled: searchableColumns.length > 0,
      enabled: true,
      searchableColumns,
      placeholder: `Search ${entityType.name.plural.toLowerCase()}...`,
      disabled: isDraftMode,
    }),
    [searchableColumns, isDraftMode, entityType.name.plural],
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
    [entityType],
  );

  // Create debounced resize handler (stable across re-renders)
  const debouncedResizeHandler = useRef(
    debounce((entityType: EntityType, columnSizing: Record<string, number>) => {
      handleColumnResize(entityType, columnSizing);
    }, 500), // Wait 500ms after user stops dragging before persisting
  ).current;

  // Column resizing configuration
  const columnResizingConfig: ColumnResizingConfig = useMemo(
    () => ({
      enabled: true,
      columnResizeMode: 'onChange' as const, // Live resizing during drag
    }),
    [],
  );

  // Row ID getter for inline editing
  const getRowId = useCallback((row: EntityRow, _index: number) => row._entityId, []);

  // Cell edit handler for inline editing
  const handleCellEdit = useCallback(
    async (row: EntityRow, columnId: string, newValue: any, _oldValue: any): Promise<boolean> => {
      // Don't allow editing draft rows
      if (isDraftRow(row)) return false;
      const entity = entities.find((e) => e.id === row._entityId);
      if (!entity) return false;

      // Determine if updated column is an attribute or relationship
      const attributeDef: SchemaUUID | undefined = entityType.schema.properties?.[columnId];
      const relationshipDef: RelationshipDefinition | undefined = entityType.relationships?.find(
        (rel) => rel.id === columnId,
      );

      // Prepare updated entity payload
      if (attributeDef) {
        const payloadEntry: EntityAttributePrimitivePayload = {
          type: EntityPropertyType.Attribute,
          value: newValue,
          schemaType: attributeDef.key,
        };

        return await updateEntity(entity, columnId, { payload: payloadEntry });
      }

      if (relationshipDef) {
        const relationship: EntityLink[] = newValue;
        const relationshipEntry: EntityAttributeRelationPayloadReference = {
          type: EntityPropertyType.Relationship,
          relations: relationship.map((rel) => rel.id),
        };

        return await updateEntity(entity, columnId, { payload: relationshipEntry });
      }

      return false;
    },
    [entities, entityType],
  );

  const updateEntity = async (
    entity: Entity,
    columnId: string,
    entry: EntityAttributeRequest,
  ): Promise<boolean> => {
    const payload: Map<string, EntityAttributeRequest> = new Map();
    Object.entries(entity.payload).forEach(([key, value]) => {
      if (isRelationshipPayload(value.payload)) {
        payload.set(key, {
          payload: {
            type: EntityPropertyType.Relationship,
            relations: value.payload.relations.map((rel) => rel.id),
          },
        });
      } else {
        payload.set(key, {
          payload: {
            type: EntityPropertyType.Attribute,
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

  // Query filter state (EntityQueryBuilder)
  const [_queryFilter, setQueryFilter] = useState<QueryFilter | undefined>();
  const handleQueryFilterChange = useCallback((filter: QueryFilter | undefined) => {
    setQueryFilter(filter);
    // TODO: integrate with server-side entity query when API hook is wired up
  }, []);

  // Toolbar right-side actions: filter + add
  const toolbarActions = useMemo(
    () => (
      <>
        <EntityQueryBuilder
          entityType={entityType}
          value={_queryFilter}
          onChange={handleQueryFilterChange}
        />
        <Button
          onClick={enterDraftMode}
          variant="outline"
          size="icon"
          className="size-9"
          disabled={isDraftMode}
        >
          <Plus className="size-4" />
          <span className="sr-only">Add new</span>
        </Button>
      </>
    ),
    [enterDraftMode, isDraftMode, entityType, _queryFilter, handleQueryFilterChange],
  );

  return (
    <Form {...form}>
      <div className="w-full min-w-0 space-y-4">
        <EntityTypeHeader>
          <div className="text-sm text-muted-foreground italic">
            Manage your entities and their data
          </div>
        </EntityTypeHeader>

        {/* Data table with toolbar: search | filter + add */}
        <DataTableProvider
          initialData={rowData}
          getRowId={getRowId}
          onCellEdit={handleCellEdit}
          onColumnWidthsChange={(columnSizing) => debouncedResizeHandler(entityType, columnSizing)}
        >
          <DataTable
            columns={columns}
            rowSelection={{
              enabled: true,
              clearOnFilterChange: true,
              actionComponent: ({ selectedRows, clearSelection }) => (
                <EntityActionBar
                  selectedRows={selectedRows}
                  clearSelection={clearSelection}
                  workspaceId={workspaceId}
                  entityTypeId={entityType.id}
                />
              ),
            }}
            enableDragDrop
            alwaysShowActionHandles={true}
            getRowId={(row) => row._entityId}
            search={searchConfig}
            filter={{
              enabled: filters.length > 0,
              filters,
              disabled: isDraftMode,
            }}
            toolbarActions={toolbarActions}
            columnResizing={columnResizingConfig}
            emptyMessage={emptyMessage}
            className={cn(className)}
            enableInlineEdit={true}
            customRowRenderer={customRowRenderer}
            addingNewEntry={isDraftMode}
          />
        </DataTableProvider>
      </div>
    </Form>
  );
};
