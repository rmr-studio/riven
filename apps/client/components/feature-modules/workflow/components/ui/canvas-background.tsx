"use client";

import { Background, BackgroundVariant } from "@xyflow/react";

/**
 * Dot grid background for the workflow canvas
 *
 * Renders a subtle dot pattern that provides visual structure
 * without overwhelming the node content.
 */
export const CanvasBackground = () => {
    return (
        <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--color-muted-foreground)"
            className="opacity-30"
        />
    );
};
