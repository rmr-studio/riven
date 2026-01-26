import { EntityRelationshipCardinality, RelationshipLimit } from "@/lib/types/entity";

export const getInverseCardinality = (
    cardinality: EntityRelationshipCardinality
): EntityRelationshipCardinality => {
    switch (cardinality) {
        case EntityRelationshipCardinality.OneToOne:
            return EntityRelationshipCardinality.OneToOne;
        case EntityRelationshipCardinality.OneToMany:
            return EntityRelationshipCardinality.ManyToOne;
        case EntityRelationshipCardinality.ManyToOne:
            return EntityRelationshipCardinality.OneToMany;
        case EntityRelationshipCardinality.ManyToMany:
            return EntityRelationshipCardinality.ManyToMany;
    }
};

export const processCardinalityToLimits = (
    cardinality: EntityRelationshipCardinality
): { source: RelationshipLimit; target: RelationshipLimit } => {
    switch (cardinality) {
        case EntityRelationshipCardinality.OneToOne:
            return { source: RelationshipLimit.SINGULAR, target: RelationshipLimit.SINGULAR };
        case EntityRelationshipCardinality.OneToMany:
            return { source: RelationshipLimit.MANY, target: RelationshipLimit.SINGULAR };
        case EntityRelationshipCardinality.ManyToOne:
            return { source: RelationshipLimit.SINGULAR, target: RelationshipLimit.MANY };
        case EntityRelationshipCardinality.ManyToMany:
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
        return EntityRelationshipCardinality.OneToOne;
    } else if (source === RelationshipLimit.SINGULAR && target === RelationshipLimit.MANY) {
        return EntityRelationshipCardinality.ManyToOne;
    } else if (source === RelationshipLimit.MANY && target === RelationshipLimit.SINGULAR) {
        return EntityRelationshipCardinality.OneToMany;
    } else {
        return EntityRelationshipCardinality.ManyToMany;
    }
};
