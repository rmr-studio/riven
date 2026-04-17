import { parseInlineCitations } from '@/components/feature-modules/knowledge-base/chat/util/parse-inline-citations';

const UUID = '123e4567-e89b-12d3-a456-426614174000';
const UUID_2 = '223e4567-e89b-12d3-a456-426614174001';

describe('parseInlineCitations', () => {
  it('returns an empty array for empty input', () => {
    expect(parseInlineCitations('')).toEqual([]);
  });

  it('returns a single text segment when there are no citations', () => {
    expect(parseInlineCitations('Hello world')).toEqual([
      { kind: 'text', content: 'Hello world' },
    ]);
  });

  it('extracts a single inline citation surrounded by text', () => {
    const out = parseInlineCitations(`See [Acme Corp](entity:${UUID}) for details.`);
    expect(out).toEqual([
      { kind: 'text', content: 'See ' },
      { kind: 'entity', label: 'Acme Corp', entityId: UUID },
      { kind: 'text', content: ' for details.' },
    ]);
  });

  it('handles a citation at the start and end of text', () => {
    const out = parseInlineCitations(
      `[Acme](entity:${UUID}) and [Globex](entity:${UUID_2})`,
    );
    expect(out).toEqual([
      { kind: 'entity', label: 'Acme', entityId: UUID },
      { kind: 'text', content: ' and ' },
      { kind: 'entity', label: 'Globex', entityId: UUID_2 },
    ]);
  });

  it('preserves labels with spaces and punctuation', () => {
    const out = parseInlineCitations(`[O'Brien & Co.](entity:${UUID})`);
    expect(out).toEqual([
      { kind: 'entity', label: "O'Brien & Co.", entityId: UUID },
    ]);
  });

  it('ignores malformed patterns (non-uuid target)', () => {
    const text = `[Acme](entity:not-a-uuid) lives on.`;
    expect(parseInlineCitations(text)).toEqual([
      { kind: 'text', content: text },
    ]);
  });

  it('ignores patterns with the wrong protocol', () => {
    const text = `[Acme](https://example.com) should stay as text.`;
    expect(parseInlineCitations(text)).toEqual([
      { kind: 'text', content: text },
    ]);
  });

  it('does not match across newlines inside the label', () => {
    const text = `[Line\nbreak](entity:${UUID})`;
    expect(parseInlineCitations(text)).toEqual([
      { kind: 'text', content: text },
    ]);
  });

  it('caps label length at 120 chars', () => {
    const longLabel = 'a'.repeat(121);
    const text = `[${longLabel}](entity:${UUID})`;
    expect(parseInlineCitations(text)).toEqual([
      { kind: 'text', content: text },
    ]);
  });

  it('keeps duplicate citations as separate segments', () => {
    const text = `[Acme](entity:${UUID}) vs [Acme](entity:${UUID})`;
    const out = parseInlineCitations(text);
    expect(out.filter((s) => s.kind === 'entity')).toHaveLength(2);
  });
});
