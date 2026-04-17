'use client';

import { CitationRef } from '@/lib/types';
import { memo, useMemo } from 'react';

interface ChatCitationsProps {
  citations: CitationRef[];
}

export const ChatCitations = memo(({ citations }: ChatCitationsProps) => {
  const unique = useMemo(() => dedupe(citations), [citations]);
  if (unique.length === 0) return null;

  return (
    <div className="mt-5 flex flex-col gap-3">
      <span className="font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Sources · {unique.length}
      </span>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {unique.map((c) => (
          <li key={`${c.entityType}-${c.entityId}`}>
            <article className="flex flex-col gap-1 rounded-sm border border-border bg-card px-3 py-2 shadow-sm transition-colors hover:border-foreground/40">
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {c.entityType}
              </span>
              <span className="truncate text-sm font-medium text-heading">
                {c.label}
              </span>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
});

ChatCitations.displayName = 'ChatCitations';

function dedupe(citations: CitationRef[]): CitationRef[] {
  const seen = new Set<string>();
  const out: CitationRef[] = [];
  for (const c of citations) {
    const key = `${c.entityType}::${c.entityId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
