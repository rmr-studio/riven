"use client";

import React from "react";
import { BuilderProvider } from "./builder-provider";
import { BuilderWizard } from "./builder-wizard";
import { BlockTypeBuilderState } from "./types/builder.types";

interface BlockTypeBuilderProps {
	/**
	 * Initial state for the builder (optional)
	 * Useful for editing existing block types or loading drafts
	 */
	initialState?: Partial<BlockTypeBuilderState>;

	/**
	 * Callback when block type is successfully published
	 */
	onPublish?: (blockType: any) => void;

	/**
	 * Callback when user cancels the builder
	 */
	onCancel?: () => void;

	/**
	 * Optional className for styling
	 */
	className?: string;
}

/**
 * Root component for the Block Type Builder
 *
 * This component provides the complete block type creation experience through a 6-step wizard:
 * 1. Basic Info - Name, key, description
 * 2. Schema Designer - Define data structure (nested objects/arrays)
 * 3. Form Config - Map schema fields to form widgets
 * 4. Render Designer - Visual Gridstack-based layout editor
 * 5. Nesting Rules - Configure which block types can be children
 * 6. Preview & Save - Live preview and publish
 *
 * @example
 * ```tsx
 * <BlockTypeBuilder
 *   onPublish={(blockType) => {
 *     console.log('Published:', blockType);
 *     router.push('/block-types');
 *   }}
 *   onCancel={() => router.back()}
 * />
 * ```
 */
export const BlockTypeBuilder: React.FC<BlockTypeBuilderProps> = ({
	initialState,
	onPublish,
	onCancel,
	className,
}) => {
	return (
		<BuilderProvider initialState={initialState}>
			<div className={className}>
				<BuilderWizard />
			</div>
		</BuilderProvider>
	);
};

BlockTypeBuilder.displayName = "BlockTypeBuilder";

export default BlockTypeBuilder;
