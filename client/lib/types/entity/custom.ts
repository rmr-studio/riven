// Custom types specific to entity domain
import { EntityPropertyType } from '../models/EntityPropertyType';
import { SchemaUUID, SchemaType, DataType, Icon } from '../common';

import type { EntityRelationshipCardinality, EntityRelationshipDefinition } from './models';

export interface EntityTypeDefinition {
  id: string;
  type: EntityPropertyType;
  definition: EntityAttributeDefinition | EntityRelationshipDefinition;
}

export interface EntityAttributeDefinition {
  id: string;
  schema: SchemaUUID;
}

export interface EntityTypeAttributeRow {
  // Persistent Hash map lookup uuid - Cannot be changed after creation. Also unique identifier for relationships
  id: string;
  // Human readable display name
  label: string;
  type: EntityPropertyType;
  protected?: boolean;
  required: boolean;
  schemaType: SchemaType | 'RELATIONSHIP';
  additionalConstraints: string[];
  dataType?: DataType;
  unique?: boolean;
  // Relationship-specific fields (optional for attributes)
  cardinality?: EntityRelationshipCardinality;
  entityTypeKeys?: string[];
  allowPolymorphic?: boolean;
  bidirectional?: boolean;
}

export interface EntityRelationshipCandidate {
  icon: Icon;
  name: string;
  key: string;
  existingRelationship: EntityRelationshipDefinition;
}

export enum RelationshipLimit {
  SINGULAR,
  MANY,
}

/**
 * Props interface for relationship picker component
 * Used for selecting related entities in draft rows
 */
export interface RelationshipPickerProps {
  relationship: EntityRelationshipDefinition;
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  onBlur: () => void;
  errors?: string[];
  disabled?: boolean;
}

// Overlap detection types
export interface RelationshipOverlap {
  type: 'polymorphic' | 'multi-type';
  targetEntityKey: string;
  targetEntityName: string;
  existingRelationship: EntityRelationshipDefinition;
  suggestedAction: OverlapResolution;
  description: string;
}

export interface OverlapResolution {
  type: 'add-to-bidirectional' | 'create-new';
  details: {
    relationshipKey?: string;
    sourceEntityToAdd?: string;
    newRelationshipName?: string;
  };
}

export interface OverlapDetectionResult {
  hasOverlaps: boolean;
  overlaps: RelationshipOverlap[];
}
