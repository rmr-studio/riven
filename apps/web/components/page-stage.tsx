import React from 'react';

export function PageStage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="paper relative mx-auto w-full bg-background lg:max-w-[min(95dvw,var(--breakpoint-3xl))] lg:border-x lg:border-x-foreground/20 lg:shadow">
        {children}
      </div>
    </>
  );
}
