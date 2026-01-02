"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Cell } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDataTableStore } from "../../data-table-provider";
import { isEditableColumn } from "../../data-table.types";

export interface EditableCellProps<TData, TValue> {
    cell: Cell<TData, TValue>;
    onSave: (value: unknown) => Promise<void>;
    onCancel: () => void;
    onFocusNext?: () => void;
    onFocusPrev?: () => void;
}

interface FormValues {
    value: unknown;
}

/**
 * EditableCell - Thin wrapper component
 *
 * Manages form state and keyboard navigation, delegates rendering
 * to the column's custom edit.render function.
 */
export function EditableCell<TData, TValue>({
    cell,
    onSave,
    onCancel,
    onFocusNext,
    onFocusPrev,
}: EditableCellProps<TData, TValue>) {
    const meta = cell.column.columnDef.meta;

    // Guard: Column must have edit config
    if (!isEditableColumn(meta)) {
        return <div className="text-sm text-destructive">Column not editable</div>;
    }

    const editConfig = meta.edit;
    const initialValue = cell.getValue();
    const parsedValue = editConfig.parseValue?.(initialValue) ?? initialValue;

    // Create per-cell form instance
    const form = useForm<FormValues>({
        resolver: editConfig.zodSchema ? zodResolver(editConfig.zodSchema) : undefined,
        defaultValues: { value: parsedValue },
        mode: "onChange",
    });

    const isSaving = useDataTableStore<TData, boolean>((state) => state.isSaving);
    const registerCommitCallback = useDataTableStore<TData, (callback: (() => void) | null) => void>(
        (state) => state.registerCommitCallback
    );

    const handleSaveRef = useRef<() => void>(() => {});

    // Validation + save (only if value changed)
    const handleSave = async () => {
        const newValue = form.getValues("value");
        const formattedValue = editConfig.formatValue?.(newValue) ?? newValue;
        const initialFormatted = editConfig.formatValue?.(parsedValue) ?? parsedValue;

        // Use custom equality or default JSON comparison
        const hasChanged = editConfig.isEqual
            ? !editConfig.isEqual(initialFormatted, formattedValue)
            : JSON.stringify(initialFormatted) !== JSON.stringify(formattedValue);

        if (!hasChanged) {
            onCancel();
            return;
        }

        // Validate if schema provided
        if (editConfig.zodSchema) {
            const isValid = await form.trigger("value");
            if (!isValid) return;
        }

        await onSave(formattedValue);
    };

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
                cell,
                form,
                value: form.watch("value"),
                onSave: handleSave,
                onCancel,
                onFocusNext,
                onFocusPrev,
                isSaving,
            })}

            {/* Saving overlay */}
            {isSaving && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
}
