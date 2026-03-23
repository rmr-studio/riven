import React from 'react';
import { BGPattern } from './ui/background/grids';

export function PageStage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BGPattern
        variant={'diagonal-stripes'}
        size={24}
        fill="color-mix(in srgb, var(--primary) 7.5%, transparent)"
      />
      <div className="paper relative mx-auto w-full bg-background lg:max-w-[min(92dvw,var(--breakpoint-3xl))] lg:border-x lg:border-x-foreground/20 lg:shadow">
        {children}
      </div>
    </>
  );
}
