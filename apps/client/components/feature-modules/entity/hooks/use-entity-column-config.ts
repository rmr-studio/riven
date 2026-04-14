import {
  ColumnConfiguration,
  EntityType,
  UpdateEntityTypeConfigurationRequest,
} from '@/lib/types/entity';
import { useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EntityTypeFormValues } from '@/components/feature-modules/entity/context/configuration-provider';
import { useSaveEntityTypeConfiguration } from '@/components/feature-modules/entity/hooks/mutation/type/use-save-configuration-mutation';

export function useEntityColumnConfig(
  form: UseFormReturn<EntityTypeFormValues>,
  entityType: EntityType,
  workspaceId: string,
) {
  const { mutate: persistConfig } = useSaveEntityTypeConfiguration(
    workspaceId,
    undefined,
    { silent: true },
  );

  const persist = useCallback(
    (columnConfiguration: ColumnConfiguration) => {
      const request: UpdateEntityTypeConfigurationRequest = {
        id: entityType.id,
        name: entityType.name,
        icon: entityType.icon,
        semanticGroup: entityType.semanticGroup,
        columnConfiguration,
      };
      persistConfig(request);
    },
    [entityType.id, entityType.name, entityType.icon, entityType.semanticGroup, persistConfig],
  );

  const handleColumnResize = useCallback(
    (columnSizing: Record<string, number>) => {
      const current = form.getValues('columnConfiguration');
      const updatedOverrides = { ...current.overrides };
      Object.entries(columnSizing).forEach(([key, width]) => {
        updatedOverrides[key] = { ...updatedOverrides[key], width };
      });
      const next = { ...current, overrides: updatedOverrides };
      form.setValue('columnConfiguration.overrides', updatedOverrides, { shouldDirty: true });
      persist(next);
    },
    [form, persist],
  );

  const handleHideColumn = useCallback(
    (columnId: string) => {
      const current = form.getValues('columnConfiguration');
      const updatedOverrides = {
        ...current.overrides,
        [columnId]: { ...current.overrides[columnId], visible: false },
      };
      form.setValue('columnConfiguration.overrides', updatedOverrides, { shouldDirty: true });
      persist({ ...current, overrides: updatedOverrides });
    },
    [form, persist],
  );

  const handleToggleVisibility = useCallback(
    (columnId: string) => {
      if (columnId === entityType.identifierKey) return;
      const current = form.getValues('columnConfiguration');
      const currentVisible = current.overrides[columnId]?.visible !== false;
      const updatedOverrides = {
        ...current.overrides,
        [columnId]: { ...current.overrides[columnId], visible: !currentVisible },
      };
      form.setValue('columnConfiguration.overrides', updatedOverrides, { shouldDirty: true });
      persist({ ...current, overrides: updatedOverrides });
    },
    [form, entityType.identifierKey, persist],
  );

  const handleReorder = useCallback(
    (newOrder: string[]) => {
      const current = form.getValues('columnConfiguration');
      form.setValue('columnConfiguration.order', newOrder, { shouldDirty: true });
      persist({ ...current, order: newOrder });
    },
    [form, persist],
  );

  const handleShowAll = useCallback(() => {
    const current = form.getValues('columnConfiguration');
    const updatedOverrides = { ...current.overrides };
    Object.keys(updatedOverrides).forEach((key) => {
      updatedOverrides[key] = { ...updatedOverrides[key], visible: true };
    });
    form.setValue('columnConfiguration.overrides', updatedOverrides, { shouldDirty: true });
    persist({ ...current, overrides: updatedOverrides });
  }, [form, persist]);

  const handleHideAll = useCallback(() => {
    const current = form.getValues('columnConfiguration');
    const updatedOverrides = { ...current.overrides };
    // Iterate over all entity type columns (not just existing overrides)
    // to ensure columns without prior overrides also get hidden
    const allColumnKeys = entityType.columns?.map((col) => col.key) ?? Object.keys(updatedOverrides);
    allColumnKeys.forEach((key) => {
      if (key === entityType.identifierKey) return;
      updatedOverrides[key] = { ...updatedOverrides[key], visible: false };
    });
    form.setValue('columnConfiguration.overrides', updatedOverrides, { shouldDirty: true });
    persist({ ...current, overrides: updatedOverrides });
  }, [form, entityType.identifierKey, entityType.columns, persist]);

  return {
    handleColumnResize,
    handleHideColumn,
    handleToggleVisibility,
    handleReorder,
    handleShowAll,
    handleHideAll,
  };
}
