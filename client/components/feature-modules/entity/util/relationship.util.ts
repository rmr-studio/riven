import { EntityRelationshipCardinality } from "@/lib/types/types";
import { RelationshipLimit } from "../interface/entity.interface";

export const getInverseCardinality = (
    cardinality: EntityRelationshipCardinality
): EntityRelationshipCardinality => {
    switch (cardinality) {
        case EntityRelationshipCardinality.ONE_TO_ONE:
            return EntityRelationshipCardinality.ONE_TO_ONE;
        case EntityRelationshipCardinality.ONE_TO_MANY:
            return EntityRelationshipCardinality.MANY_TO_ONE;
        case EntityRelationshipCardinality.MANY_TO_ONE:
            return EntityRelationshipCardinality.ONE_TO_MANY;
        case EntityRelationshipCardinality.MANY_TO_MANY:
            return EntityRelationshipCardinality.MANY_TO_MANY;
    }
};

export const processCardinalityToLimits = (
    cardinality: EntityRelationshipCardinality
): { source: RelationshipLimit; target: RelationshipLimit } => {
    switch (cardinality) {
        case EntityRelationshipCardinality.ONE_TO_ONE:
            return { source: "singular", target: "singular" };
        case EntityRelationshipCardinality.ONE_TO_MANY:
            return { source: "singular", target: "many" };
        case EntityRelationshipCardinality.MANY_TO_ONE:
            return { source: "many", target: "singular" };
        case EntityRelationshipCardinality.MANY_TO_MANY:
            return { source: "many", target: "many" };
        default:
            return { source: "singular", target: "singular" };
    }
};

export const calculateCardinalityFromLimits = (
    source: RelationshipLimit,
    target: RelationshipLimit
): EntityRelationshipCardinality => {
    if (source === "singular" && target === "singular") {
        return EntityRelationshipCardinality.ONE_TO_ONE;
    } else if (source === "singular" && target === "many") {
        return EntityRelationshipCardinality.ONE_TO_MANY;
    } else if (source === "many" && target === "singular") {
        return EntityRelationshipCardinality.MANY_TO_ONE;
    } else {
        return EntityRelationshipCardinality.MANY_TO_MANY;
    }
};
