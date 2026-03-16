import { InfiniteData } from '@tanstack/react-query';
import { EntityQueryResponse, Entity } from '@/lib/types/entity';
import { removeEntitiesFromPages, replaceEntitiesInPages } from './entity-cache.utils';

function makeEntity(id: string): Entity {
  return { id, payload: {}, identifierKey: 'name', createdAt: new Date().toISOString() } as any;
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

describe('Delete mutation cache updates', () => {
  it('removes a single entity from the correct page', () => {
    const data = makePages([makeEntity('e1'), makeEntity('e2')], [makeEntity('e3')]);
    const result = removeEntitiesFromPages(data, new Set(['e2']));

    expect(result!.pages[0].entities).toHaveLength(1);
    expect(result!.pages[0].entities[0].id).toBe('e1');
    expect(result!.pages[1].entities).toHaveLength(1);
  });

  it('removes entities across multiple pages', () => {
    const data = makePages([makeEntity('e1'), makeEntity('e2')], [makeEntity('e3')]);
    const result = removeEntitiesFromPages(data, new Set(['e1', 'e3']));

    expect(result!.pages[0].entities).toHaveLength(1);
    expect(result!.pages[0].entities[0].id).toBe('e2');
    expect(result!.pages[1].entities).toHaveLength(0);
  });

  it('handles removing non-existent IDs gracefully', () => {
    const data = makePages([makeEntity('e1')]);
    const result = removeEntitiesFromPages(data, new Set(['missing']));

    expect(result!.pages[0].entities).toHaveLength(1);
  });

  it('replaces impacted entities after deletion', () => {
    const data = makePages([makeEntity('e1'), makeEntity('e2')]);
    const updated = { ...makeEntity('e2'), payload: { status: 'orphaned' } } as any;
    const result = replaceEntitiesInPages(data, new Map([['e2', updated]]));

    expect(result!.pages[0].entities[1]).toEqual(updated);
    expect(result!.pages[0].entities[0].id).toBe('e1');
  });
});
