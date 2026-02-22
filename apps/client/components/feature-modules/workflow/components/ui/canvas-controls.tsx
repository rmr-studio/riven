"use client";

import { Controls } from "@xyflow/react";

/**
 * Zoom and navigation controls for the workflow canvas
 *
 * Positioned in bottom-left corner with zoom +/-, fit view,
 * and lock toggle buttons. Styled to match shadcn/ui aesthetic.
 */
export const CanvasControls = () => {
    return (
        <Controls
            position="bottom-left"
            showInteractive={false}
            className="!bg-background !border-border !shadow-sm [&>button]:!bg-background [&>button]:!border-border [&>button]:!fill-foreground hover:[&>button]:!bg-muted"
        />
    );
};
