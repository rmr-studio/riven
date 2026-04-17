import {
  CitationRefSchema,
  InsightsMessageSchema,
} from '@/components/feature-modules/knowledge-base/chat/schema/insights-message.schema';
import { InsightsMessageRole } from '@/lib/types';

describe('CitationRefSchema', () => {
  it('accepts a valid citation', () => {
    const parsed = CitationRefSchema.parse({
      entityId: 'ent-1',
      entityType: 'Customer',
      label: 'Acme Corp',
    });
    expect(parsed.entityId).toBe('ent-1');
  });

  it('rejects empty entityId', () => {
    expect(() =>
      CitationRefSchema.parse({ entityId: '', entityType: 'X', label: 'y' }),
    ).toThrow();
  });

  it('rejects missing entityType', () => {
    expect(() =>
      CitationRefSchema.parse({ entityId: 'ent-1', label: 'y' }),
    ).toThrow();
  });
});

describe('InsightsMessageSchema', () => {
  const base = {
    id: 'msg-1',
    sessionId: 'sess-1',
    role: InsightsMessageRole.Assistant,
    content: 'Hello',
    citations: [],
  };

  it('parses a minimal assistant message with no citations', () => {
    const parsed = InsightsMessageSchema.parse(base);
    expect(parsed.id).toBe('msg-1');
    expect(parsed.citations).toEqual([]);
  });

  it('parses a message with citations', () => {
    const parsed = InsightsMessageSchema.parse({
      ...base,
      citations: [{ entityId: 'ent-1', entityType: 'Customer', label: 'Acme' }],
    });
    expect(parsed.citations).toHaveLength(1);
  });

  it('parses a user message', () => {
    const parsed = InsightsMessageSchema.parse({
      ...base,
      role: InsightsMessageRole.User,
    });
    expect(parsed.role).toBe(InsightsMessageRole.User);
  });

  it('accepts nullable tokenUsage, createdAt, createdBy', () => {
    const parsed = InsightsMessageSchema.parse({
      ...base,
      tokenUsage: null,
      createdAt: null,
      createdBy: null,
    });
    expect(parsed.tokenUsage).toBeNull();
  });

  it('accepts string or Date for createdAt', () => {
    const d = new Date();
    expect(
      InsightsMessageSchema.parse({ ...base, createdAt: d }).createdAt,
    ).toEqual(d);
    expect(
      InsightsMessageSchema.parse({ ...base, createdAt: d.toISOString() })
        .createdAt,
    ).toBe(d.toISOString());
  });

  it('rejects message missing content', () => {
    const rest = { ...base };
    delete (rest as Partial<typeof base>).content;
    expect(() => InsightsMessageSchema.parse(rest)).toThrow();
  });

  it('rejects message missing id', () => {
    const rest = { ...base };
    delete (rest as Partial<typeof base>).id;
    expect(() => InsightsMessageSchema.parse(rest)).toThrow();
  });

  it('rejects unknown role', () => {
    expect(() =>
      InsightsMessageSchema.parse({ ...base, role: 'SYSTEM' }),
    ).toThrow();
  });

  it('rejects non-array citations', () => {
    expect(() =>
      InsightsMessageSchema.parse({ ...base, citations: 'nope' }),
    ).toThrow();
  });

  it('rejects malformed citation entries', () => {
    expect(() =>
      InsightsMessageSchema.parse({
        ...base,
        citations: [{ entityId: 'x' }],
      }),
    ).toThrow();
  });
});
