'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { tabs, type TabId } from '../../types';
import { DataModelGraph } from './data-model-graph';

export const CANVAS_PADDING = 60;

// ── Main component ──────────────────────────────────────
export function DataModelShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>('saas');

  return (
    <>
      <section className="">
        <div className="relative mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="mx-auto mb-12 max-w-7xl text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
              <span className="font-bold text-background italic">
                A true focus on structural freedom.
              </span>{' '}
              <span className="text-background/80">
                Our data models and relationships adapt to how you work, not the other way around.
                Because your business is unique, so your platform should be too.
              </span>
            </h2>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 flex flex-wrap justify-center gap-2"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onMouseEnter={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                  activeTab === tab.id
                    ? 'border-border bg-background text-foreground shadow-sm'
                    : 'border-transparent bg-background/10 text-background backdrop-blur-2xl hover:bg-background/50 hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>
          <DataModelGraph tab={activeTab} />
        </div>
      </section>
    </>
  );
}
