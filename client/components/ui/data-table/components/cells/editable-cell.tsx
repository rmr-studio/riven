"use client";

import { Cell } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { UseFormReturn, useFormState } from "react-hook-form";
import { useDataTableStore } from "../../data-table-provider";
import { ColumnEditConfig, isEditableColumn } from "../../data-table.types";

export interface EditableCellProps<TData, TCellValue> {
    cell: Cell<TData, TCellValue>;
    onSave: (value: TCellValue) => Promise<void>;
    onCancel: () => void;
    onFocusNext?: () => void;
    onFocusPrev?: () => void;
}

/**
 * EditableCell - Thin wrapper component
 *
 * Manages form state and keyboard navigation, delegates rendering
 * to the column's custom edit.render function.
 */
export function EditableCell<TData, TCellValue, TValue = TCellValue>({
    cell,
    onSave,
    onCancel,
    onFocusNext,
    onFocusPrev,
}: EditableCellProps<TData, TCellValue>) {
    const meta = cell.column.columnDef.meta;

    // Guard: Column must have edit config
    if (!isEditableColumn(meta)) {
        return <div className="text-sm text-destructive">Column not editable</div>;
    }

    const editConfig = meta.edit as unknown as ColumnEditConfig<TData, TCellValue, TValue>;
    const form = editConfig.createFormInstance(cell as any) as UseFormReturn<{ value: TValue }>;

    const isSaving = useDataTableStore<TData, boolean>((state) => state.isSaving);
    const registerCommitCallback = useDataTableStore<
        TData,
        (callback: (() => void) | null) => void
    >((state) => state.registerCommitCallback);

    const handleSaveRef = useRef<() => void>(() => {});

    const { errors, isValid } = useFormState({ control: form.control });

    /**
     * Validates the form and saves if the value has changed
     * Uses the parseValue/formatValue functions to transform between edit and cell formats
     * Uses the isEqual function to compare values for changes
     */
    const handleSave = useCallback(async () => {
        // Validate the form

        if (!isValid) {
            onCancel();
            return;
        }

        // Get the new value from the form
        const { value: newEditValue } = form.getValues();

        // Get the original cell value
        const originalCellValue: TCellValue = cell.getValue();

        // Parse the original cell value to edit format for comparison
        const parseValue = editConfig.parseValue ?? ((val: TCellValue) => val as unknown as TValue);
        const originalEditValue: TValue = parseValue(originalCellValue);

        // Check if the value has changed
        const isEqual =
            editConfig.isEqual ??
            ((a: TValue, b: TValue) => JSON.stringify(a) === JSON.stringify(b));
        const hasChanged = !isEqual(originalEditValue, newEditValue);

        // Only save if the value has changed
        if (!hasChanged) {
            onCancel(); // Close editor without saving
            return;
        }

        // Format the value back to cell format for saving
        const formatValue =
            editConfig.formatValue ?? ((val: TValue) => val as unknown as TCellValue);
        const newCellValue: TCellValue = formatValue(newEditValue);

        // TODO: Save the entity with the new value
        // This is where you would call the entity save API
        try {
            await onSave(newCellValue);
        } catch (error) {
            console.error("Failed to save cell value:", error);
            // Form stays open on error so user can retry
        }
    }, [onSave, onCancel, cell, editConfig, form, errors, isValid]);

    handleSaveRef.current = handleSave;

    // Register commit callback once on mount
    useEffect(() => {
        registerCommitCallback(() => handleSaveRef.current());
        return () => registerCommitCallback(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keyboard shortcuts wrapper
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
            await handleSave();
            e.shiftKey ? onFocusPrev?.() : onFocusNext?.();
        }
    };

    // Render: Delegate to column's custom render function
    return (
        <div className="relative w-full" onKeyDown={handleKeyDown}>
            {editConfig.render({
                cell: cell as any,
                form: form as any,
                value: form.watch("value" as any) as TValue,
                onSave: handleSave,
                onCancel,
                onFocusNext,
                onFocusPrev,
                isSaving,
            } as any)}

            {/* Saving overlay */}
            {isSaving && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
}
