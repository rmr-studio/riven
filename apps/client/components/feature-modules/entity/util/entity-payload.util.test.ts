import {
  Entity,
  EntityPropertyType,
} from '@/lib/types/entity';
import { buildEntityUpdatePayload } from './entity-payload.util';

function createMockEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'entity-1',
    identifierKey: 'name',
    workspaceId: 'ws-1',
    entityTypeId: 'type-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    payload: {
      name: {
        payload: {
          type: EntityPropertyType.Attribute,
          value: 'Test Entity',
          schemaType: 'text',
        },
      },
      industry: {
        payload: {
          type: EntityPropertyType.Attribute,
          value: 'Finance',
          schemaType: 'select',
        },
      },
      employees: {
        payload: {
          type: EntityPropertyType.Relationship,
          relations: [
            { id: 'emp-1', label: 'Employee 1', key: 'employees', workspaceId: 'ws-1', sourceEntityId: 'entity-1', definitionId: 'rel-1', icon: { type: 'icon', colour: '#000' } },
          ],
        },
      },
    },
    ...overrides,
  } as Entity;
}

describe('buildEntityUpdatePayload', () => {
  it('preserves existing attribute payloads and applies the updated column', () => {
    const entity = createMockEntity();
    const result = buildEntityUpdatePayload(entity, 'industry', {
      payload: {
        type: EntityPropertyType.Attribute,
        value: 'Technology',
        schemaType: 'select',
      },
    });

    expect(result.id).toBe('entity-1');
    expect(result.payload.industry.payload).toEqual({
      type: EntityPropertyType.Attribute,
      value: 'Technology',
      schemaType: 'select',
    });
    expect(result.payload.name.payload).toEqual({
      type: EntityPropertyType.Attribute,
      value: 'Test Entity',
      schemaType: 'text',
    });
  });

  it('converts relationship payloads to ID arrays', () => {
    const entity = createMockEntity();
    const result = buildEntityUpdatePayload(entity, 'name', {
      payload: {
        type: EntityPropertyType.Attribute,
        value: 'Updated Name',
        schemaType: 'text',
      },
    });

    expect(result.payload.employees.payload).toEqual({
      type: EntityPropertyType.Relationship,
      relations: ['emp-1'],
    });
  });

  it('applies relationship update correctly', () => {
    const entity = createMockEntity();
    const result = buildEntityUpdatePayload(entity, 'employees', {
      payload: {
        type: EntityPropertyType.Relationship,
        relations: ['emp-1', 'emp-2'],
      },
    });

    expect(result.payload.employees.payload).toEqual({
      type: EntityPropertyType.Relationship,
      relations: ['emp-1', 'emp-2'],
    });
  });
});
