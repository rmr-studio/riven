"use client";

import { FC, useCallback, useMemo } from "react";
import { useBlockEnvironment } from "../../../../context/block-environment-provider";
import { useTrackedEnvironment } from "../../../../context/tracked-environment-provider";
import { useBlockHydration } from "../../../../hooks/use-block-hydration";
import {
    EntityReferenceMetadata,
    isEntityReferenceMetadata,
    ReferenceItem,
} from "../../../../interface/block.interface";
import { PanelWrapper } from "../../../panel/panel-wrapper";
import { EntityReferenceItem } from "./reference-item";

interface EntityReferenceListProps {
    blockId: string;
    items: ReferenceItem[];
}

/**
 * Renders multiple entity references in a list format.
 * Follows the ContentBlockList pattern with ListPanel + EntityReferenceItem.
 *
 * Used when an entity reference block contains 2 or more entities.
 */
export const EntityReferenceList: FC<EntityReferenceListProps> = ({ blockId, items }) => {
    const { getBlock } = useBlockEnvironment();
    const { updateTrackedBlock } = useTrackedEnvironment();
    const { data: hydrationResult, isLoading, error } = useBlockHydration(blockId);

    // Handle entity removal
    const handleRemoveEntity = useCallback(
        (entityId: string) => {
            const block = getBlock(blockId);
            if (!block) return;

            const { payload } = block.block;
            if (!isEntityReferenceMetadata(payload)) return;

            // Remove entity from items
            const updatedItems = payload.items?.filter((item) => item.id !== entityId) || [];

            // Update block metadata
            const updatedPayload: EntityReferenceMetadata = {
                ...payload,
                items: updatedItems,
            };

            updateTrackedBlock(blockId, {
                ...block,
                block: {
                    ...block.block,
                    payload: updatedPayload,
                },
            });
        },
        [blockId, getBlock, updateTrackedBlock]
    );

    const references = hydrationResult?.references || [];

    return (
        <div className="space-y-3">
            {items.map((item) => {
                const reference = references.find((ref) => ref.entityId === item.id);
                const onRemove = () => {
                    handleRemoveEntity(item.id);
                };
                // Quick actions for this entity
                const quickActions = useMemo(
                    () => [
                        {
                            id: "remove",
                            label: "Remove entity",
                            shortcut: "⌘⌫",
                            onSelect: onRemove,
                        },
                    ],
                    [onRemove]
                );

                return (
                    <PanelWrapper
                        key={item.id}
                        id={item.id}
                        quickActions={quickActions}
                        allowEdit={false}
                        allowInsert={false}
                        onDelete={onRemove}
                    >
                        <EntityReferenceItem
                            id={item.id}
                            item={item}
                            reference={reference}
                            isLoading={isLoading}
                            error={error}
                            variant="list"
                            onRemove={() => handleRemoveEntity(item.id)}
                        />
                    </PanelWrapper>
                );
            })}
        </div>
    );
};
