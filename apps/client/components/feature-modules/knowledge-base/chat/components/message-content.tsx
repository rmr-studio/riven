'use client';

import { InlineEntityPill } from '@/components/feature-modules/knowledge-base/chat/components/inline-entity-pill';
import { parseInlineCitations } from '@/components/feature-modules/knowledge-base/chat/util/parse-inline-citations';
import { CitationRef } from '@/lib/types';
import { useMemo } from 'react';

interface MessageContentProps {
  content: string;
  citations: CitationRef[];
}

export const MessageContent = ({ content, citations }: MessageContentProps) => {
  const citationById = useMemo(() => {
    const map = new Map<string, CitationRef>();
    for (const c of citations) map.set(c.entityId, c);
    return map;
  }, [citations]);

  const segments = useMemo(() => parseInlineCitations(content), [content]);

  return (
    <p className="whitespace-pre-wrap break-words leading-relaxed tracking-tight text-foreground">
      {segments.map((seg, idx) =>
        seg.kind === 'text' ? (
          <span key={idx}>{seg.content}</span>
        ) : (
          <InlineEntityPill
            key={idx}
            entityId={seg.entityId}
            label={seg.label}
            citation={citationById.get(seg.entityId)}
          />
        ),
      )}
    </p>
  );
};
