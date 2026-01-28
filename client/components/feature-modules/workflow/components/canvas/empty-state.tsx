"use client";

import { Workflow } from "lucide-react";

/**
 * Empty state messaging for the workflow canvas
 *
 * Displayed when the canvas has no nodes. Provides visual guidance
 * for users to start building their workflow.
 *
 * Positioned absolutely in center of canvas with pointer-events-none
 * to avoid blocking canvas interactions (pan, zoom, drag-drop).
 */
export const CanvasEmptyState = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-muted p-4">
                    <Workflow className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold text-foreground">
                        Start building your workflow
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Drag nodes from the library or click to add
                    </p>
                </div>
            </div>
        </div>
    );
};
