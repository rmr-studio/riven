"use client";

import { EntityRelationshipPicker } from "@/components/feature-modules/entity/components/forms/instance/entity-relationship-picker";
import { SchemaUUID } from "@/lib/interfaces/common.interface";
import { SchemaType } from "@/lib/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cell } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDataTableStore } from "../../data-table-provider";
import {
    isEditableAttributeColumn,
    isEditableRelationshipColumn,
    isSingleSelectRelationship,
} from "../../data-table.types";
import { CellEditorWidget } from "./cell-editor-widget";
import EditEntityRelationshipPicker from "@/components/feature-modules/entity/components/forms/instance/relationship/edit-entity-picker";

export interface EditableCellProps<TData, TValue> {
    cell: Cell<TData, TValue>;
    onSave: (value: any) => Promise<void>;
    onCancel: () => void;
    onFocusNext?: () => void;
    onFocusPrev?: () => void;
}

/**
 * Normalize empty values for comparison
 */
function normalizeEmpty(val: any): any {
    if (
        val === null ||
        val === undefined ||
        val === "" ||
        (Array.isArray(val) && val.length === 0)
    ) {
        return null;
    }
    return val;
}

/**
 * Compare arrays order-independently
 */
function arraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return JSON.stringify(sorted1) === JSON.stringify(sorted2);
}

/**
 * Schema-aware value comparison for attribute columns
 */
function isAttributeValueEqual(value1: any, value2: any, schema: SchemaUUID): boolean {
    const schemaType = schema.key;

    const normalized1 = normalizeEmpty(value1);
    const normalized2 = normalizeEmpty(value2);

    // Both are empty - no change
    if (normalized1 === null && normalized2 === null) {
        return true;
    }

    // One is empty, other is not - changed
    if (normalized1 === null || normalized2 === null) {
        return false;
    }

    // For multi-select, compare arrays (order-independent)
    if (
        schemaType === SchemaType.MULTI_SELECT &&
        Array.isArray(normalized1) &&
        Array.isArray(normalized2)
    ) {
        return arraysEqual(normalized1, normalized2);
    }

    // For checkbox, ensure boolean comparison
    if (schemaType === SchemaType.CHECKBOX) {
        return Boolean(normalized1) === Boolean(normalized2);
    }

    // For numbers, handle string vs number comparison
    if (
        schemaType === SchemaType.NUMBER ||
        schemaType === SchemaType.CURRENCY ||
        schemaType === SchemaType.PERCENTAGE
    ) {
        const num1 = typeof normalized1 === "string" ? parseFloat(normalized1) : normalized1;
        const num2 = typeof normalized2 === "string" ? parseFloat(normalized2) : normalized2;

        // Handle NaN cases
        if (isNaN(num1) && isNaN(num2)) return true;
        if (isNaN(num1) || isNaN(num2)) return false;

        return num1 === num2;
    }

    // For other types, use JSON.stringify comparison
    return JSON.stringify(normalized1) === JSON.stringify(normalized2);
}

/**
 * Relationship-aware value comparison
 */
function isRelationshipValueEqual(value1: any, value2: any, isSingleSelect: boolean): boolean {
    const normalized1 = normalizeEmpty(value1);
    const normalized2 = normalizeEmpty(value2);

    // Both are empty - no change
    if (normalized1 === null && normalized2 === null) {
        return true;
    }

    // One is empty, other is not - changed
    if (normalized1 === null || normalized2 === null) {
        return false;
    }

    // For single-select, simple string comparison
    if (isSingleSelect) {
        return normalized1 === normalized2;
    }

    // For multi-select, order-independent array comparison
    if (Array.isArray(normalized1) && Array.isArray(normalized2)) {
        return arraysEqual(normalized1, normalized2);
    }

    return normalized1 === normalized2;
}

/**
 * EditableCell component
 *
 * Renders an editable cell with form validation and keyboard shortcuts.
 * Supports both attribute columns (using schema-based widgets) and
 * relationship columns (using EntityRelationshipPicker).
 */
export function EditableCell<TData, TValue>({
    cell,
    onSave,
    onCancel,
    onFocusNext,
    onFocusPrev,
}: EditableCellProps<TData, TValue>) {
    const meta = cell.column.columnDef.meta;
    const initialValue = cell.getValue();
    const parsedValue = meta?.parseValue?.(initialValue) ?? initialValue;

    // Create per-cell form instance
    const form = useForm({
        resolver: meta?.zodSchema ? zodResolver(meta.zodSchema as any) : undefined,
        defaultValues: { value: parsedValue },
        mode: "onChange",
    });

    const isSaving = useDataTableStore<TData, boolean>((state) => state.isSaving);
    const registerCommitCallback = useDataTableStore<
        TData,
        (callback: (() => void) | null) => void
    >((state) => state.registerCommitCallback);

    // Use ref to always have the latest save function without re-registering
    const handleSaveRef = useRef<() => void>(() => {});

    // Validation + save (only if value changed)
    const handleSave = async () => {
        const newValue = form.getValues("value");
        const formattedValue = meta?.formatValue?.(newValue) ?? newValue;
        const initialFormatted = meta?.formatValue?.(parsedValue) ?? parsedValue;

        // Check if value has changed using type-aware comparison
        let hasChanged = true;

        if (isEditableAttributeColumn(meta)) {
            hasChanged = !isAttributeValueEqual(formattedValue, initialFormatted, meta.schema);
        } else if (isEditableRelationshipColumn(meta)) {
            const isSingleSelect = isSingleSelectRelationship(meta.relationship.cardinality);
            hasChanged = !isRelationshipValueEqual(
                formattedValue,
                initialFormatted,
                isSingleSelect
            );
        }

        if (!hasChanged) {
            // No changes - just exit edit mode without saving
            onCancel();
            return;
        }

        // Value changed - validate and save
        const isValid = await form.trigger("value");
        if (!isValid) return; // Stay in edit mode

        await onSave(formattedValue);
    };

    // Keep ref updated with latest handleSave
    handleSaveRef.current = handleSave;

    // Register the commit callback once on mount
    useEffect(() => {
        // Register a stable callback that delegates to the ref
        registerCommitCallback(() => handleSaveRef.current());
        return () => {
            registerCommitCallback(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only register once on mount

    // Keyboard shortcuts
    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
        } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
        } else if (e.key === "Tab") {
            e.preventDefault();
            e.stopPropagation();
            // Save and navigate to next/prev cell
            await handleSave();
            if (e.shiftKey) {
                onFocusPrev?.();
            } else {
                onFocusNext?.();
            }
        }
    };

    // Saving indicator overlay
    const SavingOverlay = () =>
        isSaving ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        ) : null;

    // Render relationship editor
    if (isEditableRelationshipColumn(meta)) {
        return (
            <div className="relative w-full" onKeyDown={handleKeyDown}>
                <EditEntityRelationshipPicker
                    relationship={meta.relationship}
                    form={form}
                    onBlur={handleSave}

                />
                <SavingOverlay />
            </div>
        );
    }

    // Render attribute editor
    if (isEditableAttributeColumn(meta)) {
        return (
            <div className="relative w-full" onKeyDown={handleKeyDown}>
                <CellEditorWidget
                    form={form}
                    fieldName="value"
                    schema={meta.schema}
                    autoFocus
                    onBlur={handleSave}
                />
                <SavingOverlay />
            </div>
        );
    }

    // Fallback for unknown column type
    return <div className="text-sm text-destructive">Unsupported column type for editing</div>;
}
