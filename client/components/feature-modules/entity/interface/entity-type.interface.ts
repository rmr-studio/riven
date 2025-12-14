import { SchemaOptions } from "@/lib/interfaces/common.interface";
import { components, DataFormat, DataType, EntityRelationshipCardinality } from "@/lib/types/types";

export interface RelationshipFormData {
    type: "relationship";
    name: string;
    key: string;
    cardinality: EntityRelationshipCardinality;
    minOccurs?: number;
    maxOccurs?: number;
    entityTypeKeys: string[];
    allowPolymorphic: boolean;
    bidirectional: boolean;
    inverseName?: string;
    required: boolean;
    targetAttributeName: string | undefined;
    protected?: boolean;
}

export interface AttributeFormData {
    type: "attribute";
    name: string;
    key: string;
    description?: string;
    dataType: DataType;
    dataFormat?: DataFormat;
    required: boolean;
    unique: boolean;
    options?: SchemaOptions;
    protected?: boolean;
}

export type CreateEntityTypeRequest = components['schemas']['CreateEntityTypeRequest']