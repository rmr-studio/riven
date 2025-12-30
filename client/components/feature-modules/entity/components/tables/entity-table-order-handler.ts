import { EntityType } from "../../interface/entity.interface";

/**
 * Handler for column order changes in entity data tables
 *
 * This function is called when a user drags and drops a column header to reorder columns.
 * The columnOrder array contains the new order of column IDs.
 *
 * @param entityType - The entity type being displayed
 * @param columnOrder - Array of column IDs in their new order
 *
 * @example
 * handleColumnOrderChange(entityType, [
 *   "name",
 *   "status",
 *   "email",
 *   "createdAt"
 * ]);
 *
 * Implementation suggestions:
 * 1. Store column order in localStorage for persistence across sessions
 * 2. Store in Zustand store for in-memory state management
 * 3. Send to backend API to save user preferences server-side
 * 4. Update entity type configuration if column order is part of the schema
 * 5. Update the EntityType's `order` field (if it exists in the schema)
 *
 * Storage key pattern suggestion:
 * - localStorage: `entity-column-order-${organisationId}-${entityType.key}`
 * - Backend: Include in user preferences or entity type metadata
 *
 * Note: The columnOrder array represents the order of ALL visible columns.
 * You may need to filter out internal columns (like _entityId, _entity) before persisting.
 */
export function handleColumnOrderChange(
    entityType: EntityType,
    columnOrder: string[]
): void {
    // TODO: Implement column order persistence logic
    console.log("Column order changed:", {
        entityTypeKey: entityType.key,
        entityTypeName: entityType.name,
        columnOrder,
        timestamp: new Date().toISOString(),
    });

    // Example implementations (uncomment and modify as needed):

    // 1. Save to localStorage
    // const storageKey = `entity-column-order-${entityType.key}`;
    // localStorage.setItem(storageKey, JSON.stringify(columnOrder));

    // 2. Save to Zustand store (requires store setup)
    // useEntityStore.getState().setColumnOrder(entityType.key, columnOrder);

    // 3. API call to save preferences
    // EntityPreferencesService.saveColumnOrder(entityType.key, columnOrder);

    // 4. Update entity type's order field (if column order is part of the schema)
    // EntityTypeService.updateColumnOrder(entityType.id, columnOrder);

    // 5. Filter out internal columns before saving
    // const publicColumns = columnOrder.filter(id => !id.startsWith('_'));
    // localStorage.setItem(storageKey, JSON.stringify(publicColumns));
}

/**
 * Helper function to load saved column order for an entity type
 *
 * @param entityType - The entity type to load order for
 * @returns The saved column order, or null if none exists
 *
 * @example
 * const savedOrder = loadColumnOrder(entityType);
 * if (savedOrder) {
 *   // Apply saved order to table configuration
 * }
 */
export function loadColumnOrder(entityType: EntityType): string[] | null {
    // TODO: Implement loading logic that matches your persistence strategy

    // Example: Load from localStorage
    // const storageKey = `entity-column-order-${entityType.key}`;
    // const saved = localStorage.getItem(storageKey);
    // return saved ? JSON.parse(saved) : null;

    return null;
}

/**
 * Helper function to clear saved column order (reset to default)
 *
 * @param entityType - The entity type to clear order for
 *
 * @example
 * clearColumnOrder(entityType);
 */
export function clearColumnOrder(entityType: EntityType): void {
    // TODO: Implement clearing logic

    // Example: Clear from localStorage
    // const storageKey = `entity-column-order-${entityType.key}`;
    // localStorage.removeItem(storageKey);

    console.log("Clearing column order for:", entityType.key);
}

/**
 * Helper function to merge saved column order with current columns
 *
 * This is useful when you have saved order but the entity type schema has changed
 * (new columns added, old columns removed). This function ensures the order
 * includes all current columns while respecting the saved order for existing ones.
 *
 * @param savedOrder - The saved column order
 * @param currentColumns - Array of current column IDs
 * @returns Merged column order with all current columns
 *
 * @example
 * const saved = ["name", "email"];
 * const current = ["name", "email", "status", "createdAt"];
 * const merged = mergeColumnOrder(saved, current);
 * // Result: ["name", "email", "status", "createdAt"]
 */
export function mergeColumnOrder(
    savedOrder: string[],
    currentColumns: string[]
): string[] {
    // Start with saved order, filter out any columns that no longer exist
    const validSavedColumns = savedOrder.filter((id) => currentColumns.includes(id));

    // Add any new columns that aren't in the saved order (append to end)
    const newColumns = currentColumns.filter((id) => !savedOrder.includes(id));

    return [...validSavedColumns, ...newColumns];
}
