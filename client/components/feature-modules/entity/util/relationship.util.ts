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
            return { source: RelationshipLimit.SINGULAR, target: RelationshipLimit.SINGULAR };
        case EntityRelationshipCardinality.ONE_TO_MANY:
            return { source: RelationshipLimit.MANY, target: RelationshipLimit.SINGULAR };
        case EntityRelationshipCardinality.MANY_TO_ONE:
            return { source: RelationshipLimit.SINGULAR, target: RelationshipLimit.MANY };
        case EntityRelationshipCardinality.MANY_TO_MANY:
            return { source: RelationshipLimit.MANY, target: RelationshipLimit.MANY };
        default:
            return { source: RelationshipLimit.SINGULAR, target: RelationshipLimit.SINGULAR };
    }
};

export const calculateCardinalityFromLimits = (
    source: RelationshipLimit,
    target: RelationshipLimit
): EntityRelationshipCardinality => {
    if (source === RelationshipLimit.SINGULAR && target === RelationshipLimit.SINGULAR) {
        return EntityRelationshipCardinality.ONE_TO_ONE;
    } else if (source === RelationshipLimit.SINGULAR && target === RelationshipLimit.MANY) {
        return EntityRelationshipCardinality.MANY_TO_ONE;
    } else if (source === RelationshipLimit.MANY && target === RelationshipLimit.SINGULAR) {
        return EntityRelationshipCardinality.ONE_TO_MANY;
    } else {
        return EntityRelationshipCardinality.MANY_TO_MANY;
    }
};
