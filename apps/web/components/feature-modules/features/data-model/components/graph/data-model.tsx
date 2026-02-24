'use client';

import { Button } from '@/components/ui/button';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { tabs, type TabId } from '../../types';
import { DataModelGraph } from './data-model-graph';

export const CANVAS_PADDING = 60;

// ── Main component ──────────────────────────────────────
export function DataModelShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>('saas');
  const isTouchDevice = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') isTouchDevice.current = true;
  }, []);

  const handleMouseEnter = useCallback((id: TabId) => {
    if (!isTouchDevice.current) setActiveTab(id);
  }, []);

  return (
    <>
      <section className="">
        <div className="relative mx-auto">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="mx-auto mb-12 w-full px-3 md:text-center">
              <h3 className="text-3xl font-medium text-background/70 [word-spacing:-0.2em] md:text-4xl">
                Templates, at your fingertips.
              </h3>
              <h4 className="font-normal text-background/60 md:mt-0 md:px-0">
                Start in minutes with a proven data model fit for your business, then customize
                endlessly.
              </h4>
            </div>
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const button = (
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab(tab.id)}
                    onPointerDown={handlePointerDown}
                    onMouseEnter={() => handleMouseEnter(tab.id)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'border border-border bg-background text-foreground shadow-sm hover:bg-background'
                        : 'text-secondary hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </Button>
                );

                return isActive ? (
                  <div key={tab.id}>{button}</div>
                ) : (
                  <HoverBorderGradient
                    key={tab.id}
                    as="div"
                    className="overflow-hidden bg-primary p-0"
                    containerClassName="bg-transparent dark:bg-transparent"
                  >
                    {button}
                  </HoverBorderGradient>
                );
              })}
            </div>
          </motion.div>
          <DataModelGraph tab={activeTab} />
        </div>
      </section>
    </>
  );
}
