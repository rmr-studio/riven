/**
 * Shared type definitions for DataTable components
 *
 * These types are extracted from the original DataTable to avoid duplication
 * and provide a single source of truth for all table-related interfaces.
 */

import { Row } from "@tanstack/react-table";
import { SchemaUUID } from "@/lib/interfaces/common.interface";
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
    column: keyof T extends string ? keyof T : never;
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
    persistCheckboxes?: boolean;
    clearOnFilterChange?: boolean;
}

// ============================================================================
// Inline Editing Configuration
// ============================================================================

export interface EditableColumnMeta<TValue = any> {
    /** Whether this column supports inline editing */
    editable?: boolean;
    /** Schema for widget selection and validation */
    fieldSchema: SchemaUUID;
    /** Optional Zod validation schema override */
    zodSchema?: z.ZodSchema<TValue>;
    /** Transform value from display format to edit format */
    parseValue?: (rawValue: any) => TValue;
    /** Transform value from edit format to display format */
    formatValue?: (editValue: TValue) => any;
}

// Extend TanStack Table ColumnMeta to include our editable properties
declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData, TValue> extends Partial<EditableColumnMeta<TValue>> {}
}
