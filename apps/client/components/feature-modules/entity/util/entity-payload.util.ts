import {
  Entity,
  EntityAttributeRequest,
  EntityPropertyType,
  isRelationshipPayload,
  SaveEntityRequest,
} from '@/lib/types/entity';

export function buildEntityUpdatePayload(
  entity: Entity,
  columnId: string,
  entry: EntityAttributeRequest,
): SaveEntityRequest {
  const payload: Record<string, EntityAttributeRequest> = {};

  Object.entries(entity.payload).forEach(([key, value]) => {
    if (isRelationshipPayload(value.payload)) {
      payload[key] = {
        payload: {
          type: EntityPropertyType.Relationship,
          relations: value.payload.relations.map((rel) => rel.id),
        },
      };
    } else {
      payload[key] = {
        payload: {
          type: EntityPropertyType.Attribute,
          value: value.payload.value,
          schemaType: value.payload.schemaType,
        },
      };
    }
  });

  payload[columnId] = entry;

  return {
    id: entity.id,
    payload,
  };
}
