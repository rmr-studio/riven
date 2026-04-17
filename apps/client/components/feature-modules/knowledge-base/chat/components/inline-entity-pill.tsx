'use client';

import { cn } from '@/lib/util/utils';
import { CitationRef } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@riven/ui';

interface InlineEntityPillProps {
  entityId: string;
  label: string;
  citation?: CitationRef;
  onSelect?: (entityId: string) => void;
}

export const InlineEntityPill = ({
  entityId,
  label,
  citation,
  onSelect,
}: InlineEntityPillProps) => {
  const typeLabel = citation?.entityType;
  const displayLabel = citation?.label || label;

  const pill = (
    <button
      type="button"
      onClick={onSelect ? () => onSelect(entityId) : undefined}
      className={cn(
        'mx-0.5 inline-flex items-baseline gap-1 rounded-sm border border-border bg-muted/60 px-1.5 py-px align-baseline text-[0.95em] font-medium text-heading transition-colors',
        'hover:border-foreground/40 hover:bg-muted',
        !onSelect && 'cursor-default',
      )}
    >
      {typeLabel && (
        <span className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          {typeLabel}
        </span>
      )}
      <span>{displayLabel}</span>
    </button>
  );

  if (!typeLabel) return pill;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{pill}</TooltipTrigger>
      <TooltipContent side="top">
        <span className="font-display text-[10px] uppercase tracking-widest">
          {typeLabel}
        </span>
        <span className="mx-1 text-muted-foreground">·</span>
        <span>{displayLabel}</span>
      </TooltipContent>
    </Tooltip>
  );
};
