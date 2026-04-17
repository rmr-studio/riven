export interface InlineTextSegment {
  kind: 'text';
  content: string;
}

export interface InlineEntitySegment {
  kind: 'entity';
  entityId: string;
  label: string;
}

export type InlineSegment = InlineTextSegment | InlineEntitySegment;

const ENTITY_LINK = /\[([^\]\n]{1,120})\]\(entity:([0-9a-fA-F-]{36})\)/g;

/**
 * Split a message body into a flat list of text/entity segments based on the
 * inline citation format `[label](entity:<uuid>)` emitted by the backend.
 */
export function parseInlineCitations(text: string): InlineSegment[] {
  if (!text) return [];

  const segments: InlineSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(ENTITY_LINK)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ kind: 'text', content: text.slice(cursor, start) });
    }
    segments.push({ kind: 'entity', label: match[1], entityId: match[2] });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ kind: 'text', content: text.slice(cursor) });
  }

  return segments;
}
