'use client';

import { Propless } from '@/lib/interfaces/interface';
import { FC } from 'react';

export const OnboardFormPanel: FC<Propless> = () => {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="shrink-0 p-8">
        <span className="text-xl font-bold">Riven</span>
      </div>

      {/* Step content area — placeholder until Plan 03 adds stepper and transitions */}
      <div className="flex flex-1 items-center justify-center px-8">
        <p className="text-muted-foreground text-sm">Step content</p>
      </div>

      {/* Navigation controls placeholder — Plan 03 */}
      <div className="shrink-0 p-8" />
    </div>
  );
};
