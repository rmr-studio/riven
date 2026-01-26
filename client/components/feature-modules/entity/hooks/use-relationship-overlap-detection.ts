import {
    EntityType,
    OverlapDetectionResult,
} from "@/lib/types/entity";
import { useMemo } from "react";

/**
 * Hook to detect overlapping relationships when creating a new relationship.
 *
 * Detects two scenarios:
 * 1. Polymorphic overlap: Target entity has a polymorphic relationship that already accepts the source
 * 2. Multi-type overlap: Target entity has a multi-type relationship that includes the source
 *
 * @param sourceEntityKey - The key of the entity being edited
 * @param selectedTargetEntityKeys - The keys of the target entities selected
 * @param allowPolymorphic - Whether the new relationship being created is polymorphic
 * @param availableEntityTypes - All available entity types in the system
 * @returns Detection result with list of overlaps
 */
export function useRelationshipOverlapDetection(
    sourceEntityKey: string | undefined,
    selectedTargetEntityKeys: string[] | undefined,
    allowPolymorphic: boolean | undefined,
    availableEntityTypes: EntityType[] | undefined
): OverlapDetectionResult {
    return useMemo(() => {
        // Early returns for invalid state
        if (
            !sourceEntityKey ||
            !selectedTargetEntityKeys ||
            selectedTargetEntityKeys.length === 0 ||
            !availableEntityTypes
        ) {
            return { hasOverlaps: false, overlaps: [] };
        }

        const overlaps: RelationshipOverlap[] = [];

        // For each target entity selected
        selectedTargetEntityKeys.forEach((targetKey) => {
            const targetEntity = availableEntityTypes.find((et) => et.key === targetKey);
            if (!targetEntity?.relationships) return;

            // Check each existing relationship on the target entity
            targetEntity.relationships.forEach((existingRel) => {
                // SCENARIO 1: Polymorphic overlap
                // Target has polymorphic relationship that already accepts source
                if (existingRel.allowPolymorphic && existingRel.bidirectional) {
                    // Check if source is NOT in the bidirectional list
                    if (
                        !existingRel.bidirectionalEntityTypeKeys ||
                        !existingRel.bidirectionalEntityTypeKeys.includes(sourceEntityKey)
                    ) {
                        overlaps.push({
                            type: "polymorphic",
                            targetEntityKey: targetKey,
                            targetEntityName: targetEntity.name.singular,
                            existingRelationship: existingRel,
                            suggestedAction: {
                                type: "add-to-bidirectional",
                                details: {
                                    relationshipKey: existingRel.id,
                                    sourceEntityToAdd: sourceEntityKey,
                                },
                            },
                            description: `${targetEntity.name.singular} already has a polymorphic "${existingRel.name}" relationship that accepts all entity types. Consider adding ${sourceEntityKey} to its bidirectional list instead of creating a new relationship.`,
                        });
                    }
                }

                // SCENARIO 2: Multi-type overlap
                // Target has multi-type relationship that includes source
                if (
                    !existingRel.allowPolymorphic &&
                    existingRel.entityTypeKeys?.includes(sourceEntityKey) &&
                    existingRel.bidirectional
                ) {
                    // Check if source is NOT in the bidirectional list
                    if (
                        !existingRel.bidirectionalEntityTypeKeys ||
                        !existingRel.bidirectionalEntityTypeKeys.includes(sourceEntityKey)
                    ) {
                        overlaps.push({
                            type: "multi-type",
                            targetEntityKey: targetKey,
                            targetEntityName: targetEntity.name.singular,
                            existingRelationship: existingRel,
                            suggestedAction: {
                                type: "add-to-bidirectional",
                                details: {
                                    relationshipKey: existingRel.id,
                                    sourceEntityToAdd: sourceEntityKey,
                                },
                            },
                            description: `${targetEntity.name.singular} already has a "${existingRel.name}" relationship that includes ${sourceEntityKey}. Consider adding ${sourceEntityKey} to its bidirectional list instead of creating a new relationship.`,
                        });
                    }
                }
            });
        });

        return {
            hasOverlaps: overlaps.length > 0,
            overlaps,
        };
    }, [sourceEntityKey, selectedTargetEntityKeys, allowPolymorphic, availableEntityTypes]);
}
