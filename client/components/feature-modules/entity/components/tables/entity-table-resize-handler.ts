import { EntityType } from "../../interface/entity.interface";

/**
 * Interface for column sizing data
 * Maps column IDs to their pixel widths
 *
 * Example:
 * {
 *   "name": 200,
 *   "email": 250,
 *   "status": 120
 * }
 */
export interface ColumnSizing {
    [columnId: string]: number;
}

/**
 * Handler for column resize events in entity data tables
 *
 * NOTE: This function is called via a debounced wrapper (500ms) from the component,
 * so it will only execute 500ms after the user stops dragging. This prevents
 * excessive persistence calls during active resizing.
 *
 * The columnSizing object contains the new widths for all resized columns.
 *
 * @param entityType - The entity type being displayed
 * @param columnSizing - Object mapping column IDs to their new pixel widths
 *
 * @example
 * handleColumnResize(entityType, {
 *   "name": 200,
 *   "email": 250,
 *   "status": 120
 * });
 *
 * Implementation suggestions:
 * 1. Store column widths in localStorage for persistence across sessions
 * 2. Store in Zustand store for in-memory state management
 * 3. Send to backend API to save user preferences server-side
 * 4. Update entity type configuration if column widths are part of the schema
 *
 * Storage key pattern suggestion:
 * - localStorage: `entity-column-widths-${organisationId}-${entityType.key}`
 * - Backend: Include in user preferences or entity type metadata
 */
export function handleColumnResize(
    entityType: EntityType,
    columnSizing: Record<string, number>
): void {
    // TODO: Implement column resize persistence logic
    console.log("Column resize event (debounced):", {
        entityTypeKey: entityType.key,
        entityTypeName: entityType.name,
        columnSizing,
        timestamp: new Date().toISOString(),
    });

    // Example implementations (uncomment and modify as needed):

    // 1. Save to localStorage
    // const storageKey = `entity-column-widths-${entityType.key}`;
    // localStorage.setItem(storageKey, JSON.stringify(columnSizing));

    // 2. Save to Zustand store (requires store setup)
    // useEntityStore.getState().setColumnWidths(entityType.key, columnSizing);

    // 3. API call to save preferences (no additional debouncing needed - already debounced)
    // EntityPreferencesService.saveColumnWidths(entityType.key, columnSizing);

    // 4. Update entity type configuration (if column widths are part of schema)
    // EntityTypeService.updateColumnConfiguration(entityType.id, columnSizing);
}

/**
 * Helper function to load saved column widths for an entity type
 *
 * @param entityType - The entity type to load widths for
 * @returns The saved column widths, or null if none exist
 *
 * @example
 * const savedWidths = loadColumnWidths(entityType);
 * if (savedWidths) {
 *   // Apply saved widths to table configuration
 * }
 */
export function loadColumnWidths(entityType: EntityType): Record<string, number> | null {
    // TODO: Implement loading logic that matches your persistence strategy

    // Example: Load from localStorage
    // const storageKey = `entity-column-widths-${entityType.key}`;
    // const saved = localStorage.getItem(storageKey);
    // return saved ? JSON.parse(saved) : null;

    return null;
}

/**
 * Helper function to clear saved column widths (reset to defaults)
 *
 * @param entityType - The entity type to clear widths for
 *
 * @example
 * clearColumnWidths(entityType);
 */
export function clearColumnWidths(entityType: EntityType): void {
    // TODO: Implement clearing logic

    // Example: Clear from localStorage
    // const storageKey = `entity-column-widths-${entityType.key}`;
    // localStorage.removeItem(storageKey);

    console.log("Clearing column widths for:", entityType.key);
}
