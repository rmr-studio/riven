/**
 * Shared type definitions for DataTable components
 *
 * These types are extracted from the original DataTable to avoid duplication
 * and provide a single source of truth for all table-related interfaces.
 */

import { EntityRelationshipDefinition } from "@/components/feature-modules/entity/interface/entity.interface";
import { SchemaUUID } from "@/lib/interfaces/common.interface";
import { EntityRelationshipCardinality } from "@/lib/types/types";
import { Cell } from "@tanstack/react-table";
import { ReactNode } from "react";
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

export interface EditConfig<TData> {
    enabled: boolean;
    /** Callback when a row is edited (returns true on success) */
    onRowEdit?: (row: TData, updatedValues: Partial<TData>) => Promise<boolean>;
    render: (cell: Cell<TData, unknown>, onBlur: (value: unknown) => void) => ReactNode | null;
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
// Inline Editing Configuration - Column Meta Types
// ============================================================================

/**
 * Discriminant values for column meta types
 */
export type ColumnMetaType = "readonly" | "attribute" | "relationship";

/**
 * Display metadata shared across column types
 */
export interface ColumnDisplayMeta {
    required?: boolean;
    unique?: boolean;
    protected?: boolean;
}

/**
 * Base properties shared across all column meta types
 */
interface BaseColumnMeta {
    /** Additional display metadata (e.g., for headers) */
    displayMeta?: ColumnDisplayMeta;
}

/**
 * Meta for non-editable columns (display-only)
 */
export interface ReadOnlyColumnMeta extends BaseColumnMeta {
    type: "readonly";
    editable: false;
}

/**
 * Meta for editable attribute columns (uses SchemaUUID)
 */
export interface EditableAttributeColumnMeta<TValue = any> extends BaseColumnMeta {
    type: "attribute";
    editable: true;
    /** Schema for widget selection and validation */
    schema: SchemaUUID;
    /** Optional Zod validation schema override */
    zodSchema?: z.ZodSchema<TValue>;
    /** Transform value from display format to edit format */
    parseValue?: (rawValue: any) => TValue;
    /** Transform value from edit format to display format */
    formatValue?: (editValue: TValue) => any;
}

/**
 * Meta for editable relationship columns (uses EntityRelationshipDefinition)
 */
export interface EditableRelationshipColumnMeta extends BaseColumnMeta {
    type: "relationship";
    editable: true;
    /** Full relationship definition for picker configuration */
    relationship: EntityRelationshipDefinition;
    /** Optional Zod validation schema override */
    zodSchema?: z.ZodSchema<string | string[] | null>;
    /** Transform value from display format to edit format */
    parseValue?: (rawValue: any) => string | string[] | null;
    /** Transform value from edit format to display format */
    formatValue?: (editValue: string | string[] | null) => any;
}

/**
 * Discriminated union of all column meta types
 */
export type DataTableColumnMeta<TValue = any> =
    | ReadOnlyColumnMeta
    | EditableAttributeColumnMeta<TValue>
    | EditableRelationshipColumnMeta;

// ============================================================================
// Type Guards for Column Meta
// ============================================================================

/**
 * Check if column meta represents an editable attribute column
 */
export function isEditableAttributeColumn(meta: unknown): meta is EditableAttributeColumnMeta {
    if (!meta || typeof meta !== "object") return false;
    const m = meta as Record<string, unknown>;
    return m.type === "attribute" && m.editable === true && "schema" in m;
}

/**
 * Check if column meta represents an editable relationship column
 */
export function isEditableRelationshipColumn(
    meta: unknown
): meta is EditableRelationshipColumnMeta {
    if (!meta || typeof meta !== "object") return false;
    const m = meta as Record<string, unknown>;
    return m.type === "relationship" && m.editable === true && "relationship" in m;
}

/**
 * Check if column meta represents any editable column (attribute or relationship)
 */
export function isEditableColumn(
    meta: unknown
): meta is EditableAttributeColumnMeta | EditableRelationshipColumnMeta {
    return isEditableAttributeColumn(meta) || isEditableRelationshipColumn(meta);
}

/**
 * Check if column meta represents a read-only column
 */
export function isReadOnlyColumn(meta: unknown): meta is ReadOnlyColumnMeta {
    if (!meta || typeof meta !== "object") return true; // No meta = read-only
    const m = meta as Record<string, unknown>;
    if (m.type === "readonly") return true;
    if (m.editable === false) return true;
    return !isEditableColumn(meta);
}

/**
 * Helper to determine if relationship is single-select based on cardinality
 */
export function isSingleSelectRelationship(cardinality: EntityRelationshipCardinality): boolean {
    return (
        cardinality === EntityRelationshipCardinality.ONE_TO_ONE ||
        cardinality === EntityRelationshipCardinality.MANY_TO_ONE
    );
}

// ============================================================================
// TanStack Table Module Augmentation
// ============================================================================

declare module "@tanstack/react-table" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData, TValue> {
        /** Column meta type discriminant */
        type?: ColumnMetaType;
        /** Whether this column supports inline editing */
        editable?: boolean;
        /** Schema for attribute columns (SchemaUUID) */
        schema?: SchemaUUID;
        /** Relationship definition for relationship columns */
        relationship?: EntityRelationshipDefinition;
        /** Optional Zod validation schema override */
        zodSchema?: z.ZodSchema<TValue>;
        /** Transform value from display format to edit format */
        parseValue?: (rawValue: any) => TValue;
        /** Transform value from edit format to display format */
        formatValue?: (editValue: TValue) => any;
        /** Display metadata for headers */
        displayMeta?: ColumnDisplayMeta;
    }
}
