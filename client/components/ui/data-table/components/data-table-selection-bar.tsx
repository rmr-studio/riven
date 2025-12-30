"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataTableStore, useDataTableActions } from "../data-table-provider";
import { cn } from "@/lib/util/utils";
import type { SelectionActionProps } from "../data-table.types";

interface DataTableSelectionBarProps<TData> {
    actionComponent?: React.ComponentType<SelectionActionProps<TData>>;
}

export function DataTableSelectionBar<TData>({
    actionComponent: CustomActionComponent,
}: DataTableSelectionBarProps<TData>) {
    const selectedCount = useDataTableStore<TData, number>((state) => state.getSelectedCount());
    const hasSelections = useDataTableStore<TData, boolean>((state) => state.hasSelections());
    const selectedRows = useDataTableStore<TData, TData[]>((state) => state.getSelectedRows());
    const { clearSelection } = useDataTableActions<TData>();

    // Don't render if no selections
    if (!hasSelections) {
        return null;
    }

    return (
        <div
            className={cn(
                "bg-primary text-primary-foreground absolute -top-4 left-0 p-2",
                "border-b shadow-lg rounded-t-md z-10"
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{selectedCount} selected</span>
                    {CustomActionComponent && (
                        <CustomActionComponent
                            selectedRows={selectedRows}
                            clearSelection={clearSelection}
                        />
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10"
                >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                </Button>
            </div>
        </div>
    );
}
