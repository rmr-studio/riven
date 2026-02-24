import type { CSSProperties } from 'react';

export const FADE_EDGE_MASK: CSSProperties = {
  maskImage:
    'linear-gradient(to right, transparent, black 10%, black 80%, transparent), linear-gradient(to bottom, black 40%, transparent)',
  maskComposite: 'intersect',
  WebkitMaskImage:
    'linear-gradient(to right, transparent, black 10%, black 80%, transparent), linear-gradient(to bottom, black 40%, transparent)',
  WebkitMaskComposite: 'source-in' as string,
};

export const TIMELINE_GRADIENT =
  'linear-gradient(to bottom, transparent 0%, #38bdf8 10%, #8b5cf6 40%, #f43f5e 75%, transparent 100%)';
