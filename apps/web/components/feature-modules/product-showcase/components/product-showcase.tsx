'use client';

import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';

import { DesktopShowcase } from './desktop-showcase';
import { MobileShowcase } from './mobile-showcase';

export function ProductShowcaseGraphic({ className }: { className?: string }) {
  const [activeScenario, setActiveScenario] = useState(0);
  const handleScenarioChange = useCallback((i: number) => {
    setActiveScenario(i);
  }, []);

  return (
    <div className={cn('relative z-30 w-full', className)}>
      {/* Desktop: wide horizontal overlap layout */}
      <div className="hidden px-12 lg:block">
        <DesktopShowcase activeScenario={activeScenario} onScenarioChange={handleScenarioChange} />
      </div>

      {/* Mobile: vertical stacked layout */}
      <div className="block translate-x-8 translate-y-8 scale-120 overflow-hidden px-4 sm:translate-x-24 sm:scale-110 md:translate-y-0 lg:hidden">
        <MobileShowcase activeScenario={activeScenario} onScenarioChange={handleScenarioChange} />
      </div>
    </div>
  );
}
