/**
 * Hook for creating toolbar actions for entity reference blocks
 *
 * This hook provides the "Select Entities" toolbar action for reference blocks,
 * allowing users to manage entity references from a unified modal dialog.
 *
 * Features:
 * - Shows all available entities with their current selection state
 * - Users can toggle entities on/off (add/remove references)
 * - Automatically invalidates hydration cache when selection changes
 * - Supports single and multi-select modes
 */

import { EntityType } from "@/lib/types/types";
import { useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState } from "react";
import { EntitySelectorModal } from "../components/modals/entity-selector-modal";
import { CustomToolbarAction } from "../components/panel/toolbar/panel-toolbar";
import { useBlockEnvironment } from "../context/block-environment-provider";
import { useTrackedEnvironment } from "../context/tracked-environment-provider";
import {
    EntityReferenceMetadata,
    isEntityReferenceMetadata,
    ReferenceItem,
} from "../interface/block.interface";

export interface UseReferenceBlockToolbarProps {
    blockId: string;
    readonly?: boolean;
    entityType: EntityType;
    currentItems?: ReferenceItem[]; // Currently selected items
    multiSelect?: boolean;
}

export interface UseReferenceBlockToolbarResult {
    customActions: CustomToolbarAction[];
    modal: React.ReactNode;
}

/**
 * Hook to create toolbar actions for entity reference blocks.
 *
 * Provides:
 * - "Select Entities" button in toolbar with count badge
 * - Entity selector modal showing all available entities
 * - Toggle interface - check/uncheck entities to add/remove references
 * - Auto-updates block metadata when selection changes
 * - Invalidates hydration cache to trigger re-fetch of entity data
 *
 * @example
 * const { customActions, modal } = UseEntityReferenceToolbar({
 *   blockId: "block-uuid",
 *   entityType: EntityType.CLIENT,
 *   currentItems: block.payload.items || [],
 *   multiSelect: true,
 * });
 *
 * return (
 *   <>
 *     <PanelWrapper customActions={customActions} {...otherProps}>
 *       {content}
 *     </PanelWrapper>
 *     {modal}
 *   </>
 * );
 */
export function UseEntityReferenceToolbar({
    blockId,
    entityType,
    currentItems = [],
    multiSelect = true,
    readonly = false,
}: UseReferenceBlockToolbarProps): UseReferenceBlockToolbarResult {
    const [entitySelectorOpen, setEntitySelectorOpen] = useState(false);
    const { getBlock, organisationId } = useBlockEnvironment();
    const { updateTrackedBlock } = useTrackedEnvironment();
    const queryClient = useQueryClient();

    if (readonly) {
        return {
            customActions: [],
            modal: null,
        };
    }

    // Handle entity selection
    const handleEntitySelect = (items: ReferenceItem[]) => {
        const block = getBlock(blockId);
        if (!block) return;

        const { payload } = block.block;
        if (payload.readonly) {
            return;
        }

        // Ensure block is an entity reference
        if (!isEntityReferenceMetadata(payload)) return;

        // Validate entity types if listType is set
        if (payload.listType) {
            const invalidItems = items.filter((item) => item.type !== payload.listType);
            if (invalidItems.length > 0) {
                console.error(
                    `Cannot add entities of type ${invalidItems[0].type} to a ${payload.listType} reference block`
                );
                return;
            }
        }

        // Update block metadata with new items
        const updatedPayload: EntityReferenceMetadata = {
            ...payload,
            items,
        };

        updateTrackedBlock(blockId, {
            ...block,
            block: {
                ...block.block,
                payload: updatedPayload,
            },
        });

        // Invalidate hydration cache to trigger re-fetch with new entities
        // Note: Invalidate at organisation level to catch the specific block
        queryClient.invalidateQueries({
            queryKey: ["block-hydration", organisationId],
            exact: false,
        });

        setEntitySelectorOpen(false);
    };

    // Create custom toolbar action
    const customActions: CustomToolbarAction[] = [
        {
            id: "select-entities",
            icon: <Users className="size-3.5" />,
            label: "Select entities",
            onClick: () => setEntitySelectorOpen(true),
            badge: currentItems.length > 0 ? currentItems.length : undefined,
        },
    ];

    // Create modal with all entities shown (allows toggling selection on/off)
    const modal = (
        <EntitySelectorModal
            open={entitySelectorOpen}
            onOpenChange={setEntitySelectorOpen}
            onSelect={handleEntitySelect}
            entityType={entityType}
            organisationId={organisationId}
            multiSelect={multiSelect}
            initialSelection={currentItems}
            showAllEntities={true}
        />
    );

    return {
        customActions,
        modal,
    };
}
