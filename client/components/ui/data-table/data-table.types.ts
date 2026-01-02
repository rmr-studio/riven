/**
 * Shared type definitions for DataTable components
 *
 * These types are extracted from the original DataTable to avoid duplication
 * and provide a single source of truth for all table-related interfaces.
 */

import { Cell } from "@tanstack/react-table";
import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

// ============================================================================
// Search Configuration
// ============================================================================

export interface SearchConfig<T> {
    enabled: boolean;
    /** Column IDs or nested paths (e.g., "name", "user.email") to search */
    searchableColumns: string[];
    placeholder?: string;
    debounceMs?: number;
    disabled?: boolean;
    onSearchChange?: (value: string) => void;
}

// ============================================================================
// Filter Configuration
// ============================================================================

export type FilterType =
    | "text"
    | "select"
    | "multi-select"
    | "date-range"
    | "number-range"
    | "boolean";

export interface FilterOption {
    label: string;
    value: string | number | boolean;
}

export interface ColumnFilter<T> {
    column: keyof T & string;
    type: FilterType;
    label: string;
    options?: FilterOption[];
    placeholder?: string;
}

export interface FilterConfig<T> {
    enabled: boolean;
    filters: ColumnFilter<T>[];
    disabled?: boolean;
    onFiltersChange?: (filters: Record<string, any>) => void;
}

// ============================================================================
// Column Edit Configuration (Render-Prop Pattern)
// ============================================================================

/**
 * Props passed to custom edit renderers
 */
export interface EditRenderProps<TData> {
    /** The TanStack Table cell being edited */
    cell: Cell<TData, unknown>;
    /** React Hook Form instance for the cell */
    form: UseFormReturn<{ value: unknown }>;
    /** Current value being edited (reactive) */
    value: unknown;
    /** Callback to trigger save (validates and commits) */
    onSave: () => Promise<void>;
    /** Callback to cancel editing */
    onCancel: () => void;
    /** Navigate to next editable cell */
    onFocusNext?: () => void;
    /** Navigate to previous editable cell */
    onFocusPrev?: () => void;
    /** Whether save operation is in progress */
    isSaving: boolean;
}

/**
 * Column-level edit configuration
 * Each column can provide its own render function for editing
 */
export interface ColumnEditConfig<TData, TValue = unknown> {
    /** Whether this column is editable */
    enabled: boolean;

    /**
     * Custom render function for edit mode
     * Receives cell context and form instance, returns JSX
     */
    render: (props: EditRenderProps<TData>) => ReactNode;

    /**
     * Optional Zod schema for validation
     * If not provided, no validation is performed
     */
    zodSchema?: z.ZodSchema<TValue>;

    /**
     * Transform value from cell format to edit format
     * Called when entering edit mode
     * @default identity function
     */
    parseValue?: (cellValue: unknown) => TValue;

    /**
     * Transform value from edit format to cell/storage format
     * Called when saving
     * @default identity function
     */
    formatValue?: (editValue: TValue) => unknown;

    /**
     * Custom equality check for value comparison
     * Used to determine if save is needed (skip if unchanged)
     * @default JSON.stringify comparison
     */
    isEqual?: (oldValue: TValue, newValue: TValue) => boolean;
}

// ============================================================================
// Row Actions Configuration
// ============================================================================

export interface RowAction<TData> {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (row: TData) => void;
    variant?: "default" | "destructive";
    disabled?: (row: TData) => boolean;
    separator?: boolean;
}

export interface RowActionsConfig<TData> {
    enabled: boolean;
    actions: RowAction<TData>[];
    menuLabel?: string;
}

// ============================================================================
// Column Configuration
// ============================================================================

export interface ColumnResizingConfig {
    enabled: boolean;
    columnResizeMode?: "onChange" | "onEnd";
    defaultColumnSize?: number;
    initialColumnSizing?: Record<string, number>;
    onColumnWidthsChange?: (columnSizing: Record<string, number>) => void;
}

export interface ColumnOrderingConfig {
    enabled: boolean;
    onColumnOrderChange?: (columnOrder: string[]) => void;
}

// ============================================================================
// Row Selection Configuration
// ============================================================================

export interface SelectionActionProps<TData> {
    selectedRows: TData[];
    clearSelection: () => void;
}

export interface RowSelectionConfig<TData> {
    enabled: boolean;
    onSelectionChange?: (selectedRows: TData[]) => void;
    actionComponent?: React.ComponentType<SelectionActionProps<TData>>;
    clearOnFilterChange?: boolean;
}

// ============================================================================
// Column Display Metadata
// ============================================================================

/**
 * Display metadata for column headers
 */
export interface ColumnDisplayMeta {
    required?: boolean;
    unique?: boolean;
    protected?: boolean;
}

// ============================================================================
// Type Guard for Editable Columns
// ============================================================================

/**
 * Check if column has edit configuration enabled
 */
export function isEditableColumn<TData, TValue>(
    meta: { edit?: ColumnEditConfig<TData, TValue>; displayMeta?: ColumnDisplayMeta } | undefined
): meta is { edit: ColumnEditConfig<TData, TValue>; displayMeta?: ColumnDisplayMeta } {
    return meta?.edit?.enabled === true && typeof meta.edit.render === "function";
}

// ============================================================================
// TanStack Table Module Augmentation
// ============================================================================

declare module "@tanstack/react-table" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData, TValue> {
        /** Column edit configuration (render-prop pattern) */
        edit?: ColumnEditConfig<TData, TValue>;
        /** Display metadata for headers */
        displayMeta?: ColumnDisplayMeta;
    }
}
