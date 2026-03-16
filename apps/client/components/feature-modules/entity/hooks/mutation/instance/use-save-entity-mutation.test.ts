import { InfiniteData } from '@tanstack/react-query';
import { EntityQueryResponse, Entity } from '@/lib/types/entity';
import { updateEntityInPages } from './entity-cache.utils';

function makeEntity(id: string, name?: string): Entity {
  return { id, payload: {}, identifierKey: 'name', createdAt: new Date().toISOString(), ...(name ? { name } : {}) } as any;
}

function makePages(...pages: Entity[][]): InfiniteData<EntityQueryResponse> {
  return {
    pages: pages.map((entities, i) => ({
      entities,
      hasNextPage: i < pages.length - 1,
      limit: 50,
      offset: i * 50,
    })),
    pageParams: pages.map((_, i) => i * 50),
  };
}

describe('Save mutation cache updates', () => {
  it('updates an existing entity in the correct page', () => {
    const e1 = makeEntity('e1');
    const e2 = makeEntity('e2');
    const e3 = makeEntity('e3');
    const data = makePages([e1, e2], [e3]);

    const updated = { ...e2, payload: { name: { value: 'updated' } } } as any;
    const result = updateEntityInPages(data, 'e2', updated);

    expect(result!.pages[0].entities[1]).toEqual(updated);
    expect(result!.pages[0].entities[0]).toBe(e1);
    expect(result!.pages[1].entities[0]).toBe(e3);
  });

  it('does not modify pages when entity is not found (new entity)', () => {
    const data = makePages([makeEntity('e1')]);
    const result = updateEntityInPages(data, 'new-entity', makeEntity('new-entity'));

    expect(result!.pages[0].entities).toHaveLength(1);
    expect(result!.pages[0].entities[0].id).toBe('e1');
  });

  it('handles empty pages gracefully', () => {
    const data = makePages([]);
    const result = updateEntityInPages(data, 'e1', makeEntity('e1'));

    expect(result!.pages[0].entities).toHaveLength(0);
  });
});
