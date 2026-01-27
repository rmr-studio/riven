// Type guards for entity discriminated unions

import type {
  EntityAttributePayload,
  EntityAttributeRelationPayload,
  EntityRelationshipDefinition,
} from './models';
import type { EntityAttributeDefinition } from './custom';
import { EntityPropertyType } from '../models/EntityPropertyType';

export const isRelationshipDefinition = (
  attribute: EntityRelationshipDefinition | EntityAttributeDefinition,
): attribute is EntityRelationshipDefinition => {
  return !('schema' in attribute);
};

export const isAttributeDefinition = (
  attribute: EntityRelationshipDefinition | EntityAttributeDefinition,
): attribute is EntityAttributeDefinition => {
  return 'schema' in attribute;
};

export const isRelationshipPayload = (
  payload: EntityAttributePayload,
): payload is EntityAttributeRelationPayload => {
  return payload.type === EntityPropertyType.Relationship;
};
