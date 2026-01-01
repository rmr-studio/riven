"use client";

import { Cell } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDataTableStore } from "../../data-table-provider";
import { CellEditorWidget } from "./cell-editor-widget";
import { SchemaUUID } from "@/lib/interfaces/common.interface";
import { SchemaType } from "@/lib/types/types";

interface EditableCellProps<TData, TValue> {
    cell: Cell<TData, TValue>;
    onSave: (value: any) => Promise<void>;
    onCancel: () => void;
    onFocusNext?: () => void;
    onFocusPrev?: () => void;
}

/**
 * Schema-aware value comparison that handles different widget types correctly
 */
function isValueEqual(value1: any, value2: any, schema: SchemaUUID): boolean {
    const schemaType = schema.key;

    // Normalize empty values (null, undefined, "", [])
    const normalizeEmpty = (val: any) => {
        if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
            return null;
        }
        return val;
    };

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
    if (schemaType === SchemaType.MULTI_SELECT && Array.isArray(normalized1) && Array.isArray(normalized2)) {
        if (normalized1.length !== normalized2.length) return false;
        const sorted1 = [...normalized1].sort();
        const sorted2 = [...normalized2].sort();
        return JSON.stringify(sorted1) === JSON.stringify(sorted2);
    }

    // For checkbox, ensure boolean comparison
    if (schemaType === SchemaType.CHECKBOX) {
        return Boolean(normalized1) === Boolean(normalized2);
    }

    // For numbers, handle string vs number comparison
    if (schemaType === SchemaType.NUMBER || schemaType === SchemaType.CURRENCY || schemaType === SchemaType.PERCENTAGE) {
        const num1 = typeof normalized1 === 'string' ? parseFloat(normalized1) : normalized1;
        const num2 = typeof normalized2 === 'string' ? parseFloat(normalized2) : normalized2;

        // Handle NaN cases
        if (isNaN(num1) && isNaN(num2)) return true;
        if (isNaN(num1) || isNaN(num2)) return false;

        return num1 === num2;
    }

    // For other types, use JSON.stringify comparison
    return JSON.stringify(normalized1) === JSON.stringify(normalized2);
}

/**
 * EditableCell component
 *
 * Renders an editable cell with form validation and keyboard shortcuts.
 * Creates a per-cell React Hook Form instance for validation.
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
        resolver: meta?.zodSchema ? zodResolver(meta.zodSchema) : undefined,
        defaultValues: { value: parsedValue },
        mode: 'onChange',
    });

    const isSaving = useDataTableStore<TData, boolean>((state) => state.isSaving);
    const registerCommitCallback = useDataTableStore<TData, (callback: (() => void) | null) => void>(
        (state) => state.registerCommitCallback
    );

    // Use ref to always have the latest save function without re-registering
    const handleSaveRef = useRef<() => void>(() => {});

    // Validation + save (only if value changed)
    const handleSave = async () => {
        const newValue = form.getValues('value');
        const formattedValue = meta?.formatValue?.(newValue) ?? newValue;

        // Check if value has changed using schema-aware comparison
        const initialFormatted = meta?.formatValue?.(parsedValue) ?? parsedValue;
        const hasChanged = !isValueEqual(formattedValue, initialFormatted, meta.fieldSchema);

        if (!hasChanged) {
            // No changes - just exit edit mode without saving
            onCancel();
            return;
        }

        // Value changed - validate and save
        const isValid = await form.trigger('value');
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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
        } else if (e.key === 'Tab') {
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

    if (!meta?.fieldSchema) {
        return <div className="text-sm text-destructive">No schema defined for editing</div>;
    }

    return (
        <div className="relative w-full" onKeyDown={handleKeyDown}>
            <CellEditorWidget
                form={form}
                fieldName="value"
                schema={meta.fieldSchema}
                autoFocus
                onBlur={handleSave}
            />

            {/* Saving indicator */}
            {isSaving && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
}
