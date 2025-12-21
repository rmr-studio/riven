import { EntityPropertyType } from "@/lib/types/types";
import { fromKeyCase, toKeyCase } from "@/lib/util/utils";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    EntityType,
    EntityTypeOrderingKey,
    RelationshipFormData,
} from "../interface/entity.interface";

export interface UseRelationshipManagementReturn {
    relationships: RelationshipFormData[];
    handleRelationshipAdd: (data: RelationshipFormData) => void;
    handleRelationshipEdit: (data: RelationshipFormData) => void;
    handleRelationshipDelete: (key: string) => void;
    handleRelationshipsReorder: (reordered: RelationshipFormData[]) => void;
    editRelationship: (row: RelationshipFormData) => RelationshipFormData | undefined;
}

export function useRelationshipManagement(
    entityType?: EntityType,
    order: EntityTypeOrderingKey[] = [],
    onOrderChange?: (order: EntityTypeOrderingKey[]) => void
): UseRelationshipManagementReturn {
    const [relationships, setRelationships] = useState<RelationshipFormData[]>([]);

    // Initialize relationships from entity type on mount or when entityType changes
    useEffect(() => {
        if (entityType?.relationships) {
            const existingRels: RelationshipFormData[] = entityType.relationships.map((rel) => ({
                type: EntityPropertyType.RELATIONSHIP,
                key: rel.key,
                label: rel.name || fromKeyCase(rel.key),
                cardinality: rel.cardinality,
                entityTypeKeys: rel.entityTypeKeys || [],
                allowPolymorphic: rel.allowPolymorphic,
                bidirectional: rel.bidirectional,
                inverseName: rel.inverseName,
                required: rel.required,
                targetAttributeName: undefined, // This might need to be derived from somewhere
            }));
            setRelationships(existingRels);
        }
    }, [entityType]);

    // Sort relationships based on order array
    const sortedRelationships = useMemo(() => {
        if (order.length === 0) return relationships;

        return [...relationships].sort((a, b) => {
            const aOrderItem = order.find(
                (o) => o.key === a.key && o.type === EntityPropertyType.RELATIONSHIP
            );
            const bOrderItem = order.find(
                (o) => o.key === b.key && o.type === EntityPropertyType.RELATIONSHIP
            );
            const aIndex = aOrderItem ? order.indexOf(aOrderItem) : -1;
            const bIndex = bOrderItem ? order.indexOf(bOrderItem) : -1;

            // If both are in order array, sort by their position
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            // If only one is in order array, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            // If neither is in order array, maintain current order
            return 0;
        });
    }, [relationships, order]);

    const handleRelationshipAdd = (data: RelationshipFormData) => {
        // Check for duplicate keys
        if (
            relationships.find(
                (rel) => rel.key === data.key || toKeyCase(rel.label) === toKeyCase(data.label)
            )
        ) {
            toast.error("This relationship already exists.");
            return;
        }

        setRelationships((prev) => [...prev, data]);
        // Add to order array
        if (onOrderChange) {
            const newOrder: EntityTypeOrderingKey[] = [
                ...order,
                { key: data.key, type: EntityPropertyType.RELATIONSHIP },
            ];
            onOrderChange(newOrder);
        }
    };

    const handleRelationshipEdit = (data: RelationshipFormData) => {
        setRelationships((prev) => {
            const index = prev.findIndex((rel) => rel.key === data.key);
            if (index === -1) return prev;
            const updated = [...prev];
            updated[index] = data;
            return updated;
        });
    };

    const handleRelationshipDelete = (key: string) => {
        const relationship = relationships.find((rel) => toKeyCase(rel.key) === toKeyCase(key));
        if (relationship?.protected) {
            toast.error("This relationship is protected and cannot be deleted.");
            return;
        }
        setRelationships((prev) => prev.filter((rel) => toKeyCase(rel.key) !== toKeyCase(key)));
        // Remove from order array
        if (relationship && onOrderChange) {
            const newOrder = order.filter(
                (o) => !(o.key === relationship.key && o.type === EntityPropertyType.RELATIONSHIP)
            );
            onOrderChange(newOrder);
        }
    };

    const handleRelationshipsReorder = (reorderedRelationships: RelationshipFormData[]) => {
        if (!onOrderChange) return;

        // Get keys for reordered relationships
        const relationshipKeys: EntityTypeOrderingKey[] = reorderedRelationships.map((rel) => ({
            key: rel.key,
            type: EntityPropertyType.RELATIONSHIP,
        }));
        onOrderChange(relationshipKeys);
    };

    const editRelationship = (row: RelationshipFormData): RelationshipFormData | undefined => {
        return relationships.find((rel) => rel.key === row.key);
    };

    return {
        relationships: sortedRelationships,
        handleRelationshipAdd,
        handleRelationshipEdit,
        handleRelationshipDelete,
        handleRelationshipsReorder,
        editRelationship,
    };
}
