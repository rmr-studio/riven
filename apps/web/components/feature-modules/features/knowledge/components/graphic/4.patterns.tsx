'use client';

import { WindowControls } from '@/components/ui/window-controls';
import { useContainerScale } from '@/hooks/use-container-scale';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { CompanyIcon, IntercomIcon, StripeIcon } from './icons';

// ── Bar Row Component ───────────────────────────────────────────────────

function BarRow({
  label,
  value,
  percent,
  fillColor,
  textColor,
  delay,
}: {
  label: string;
  value: string;
  percent: string;
  fillColor: string;
  textColor: string;
  delay: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="text-[6px] font-semibold -tracking-[0.05em]"
        style={{ width: 38, textAlign: 'right', color: textColor }}
      >
        {label}
      </span>
      <div className="h-[6px] flex-1 rounded-full bg-border/50">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: fillColor }}
          initial={{ width: 0 }}
          whileInView={{ width: percent }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay, ease: 'easeOut' }}
        />
      </div>
      <span
        className="text-[6px] font-semibold -tracking-[0.05em]"
        style={{ width: 20, color: textColor }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export const PatternsDiagram = ({ className }: { className?: string }) => {
  const { containerRef, scale } = useContainerScale(344);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        className="origin-top-left"
        style={{
          width: 344,
          fontFamily: 'var(--font-mono)',
          transform: `scale(${scale})`,
        }}
      >
        {/* ── Outer Card ── */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="relative space-y-2.5 p-4">
            {/* ── Window Controls ── */}
            <WindowControls size={5} />

            {/* ── Header ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-1"
            >
              <p className="text-[12px] font-semibold -tracking-[0.05em] text-foreground">
                New Insight Detected
              </p>
              <p className="text-[7px] -tracking-[0.05em] text-muted-foreground">
                Pattern identified across 47 accounts
              </p>
              <p className="text-[6px] leading-[1.35] -tracking-[0.05em] text-foreground">
                Customers acquired through <b>paid search</b> generate{' '}
                <b style={{ color: '#C25550' }}>3.2x</b> more support tickets in their first{' '}
                <b>60 days</b> than <b style={{ color: '#5BA6A8' }}>organic</b> customers. This
                group also shows a <b style={{ color: '#C25550' }}>22% higher</b> churn rate at the{' '}
                <b>90-day</b> mark.
              </p>
            </motion.div>

            {/* ── Support Tickets Bars ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-1"
            >
              <p className="text-[7px] font-semibold -tracking-[0.05em] text-muted-foreground">
                Avg. Support Tickets (First 60 Days)
              </p>
              <div className="space-y-1">
                <BarRow
                  label="Paid"
                  value="5.2"
                  percent="100%"
                  fillColor="#C25550"
                  textColor="#9D3838"
                  delay={0.2}
                />
                <BarRow
                  label="Organic"
                  value="1.6"
                  percent="31%"
                  fillColor="#5BA6A8"
                  textColor="#377C7E"
                  delay={0.2}
                />
              </div>
              <div className="flex items-center gap-1 pt-0.5">
                <span className="text-[5px] -tracking-[0.05em] text-muted-foreground">from</span>
                <div className="flex items-center gap-0.5 rounded-xs border border-border bg-card px-1 py-px">
                  <IntercomIcon size={6} />
                  <span className="text-[5px] font-medium -tracking-[0.05em] text-muted-foreground">
                    312 tickets
                  </span>
                </div>
                <div className="flex items-center gap-0.5 rounded-xs border border-border bg-card px-1 py-px">
                  <CompanyIcon size={6} />
                  <span className="text-[5px] font-medium -tracking-[0.05em] text-muted-foreground">
                    47 companies
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Churn Rate Bars ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="space-y-1"
            >
              <p className="text-[7px] font-semibold -tracking-[0.05em] text-muted-foreground">
                90-Day Churn Rate
              </p>
              <div className="space-y-1">
                <BarRow
                  label="Paid"
                  value="30%"
                  percent="100%"
                  fillColor="#C25550"
                  textColor="#9D3838"
                  delay={0.3}
                />
                <BarRow
                  label="Organic"
                  value="8%"
                  percent="27%"
                  fillColor="#5BA6A8"
                  textColor="#377C7E"
                  delay={0.3}
                />
              </div>
              <div className="flex items-center gap-1 pt-0.5">
                <span className="text-[5px] -tracking-[0.05em] text-muted-foreground">from</span>
                <div className="flex items-center gap-0.5 rounded-xs border border-border bg-card px-1 py-px">
                  <CompanyIcon size={6} />
                  <span className="text-[5px] font-medium -tracking-[0.05em] text-muted-foreground">
                    47 companies
                  </span>
                </div>
                <div className="flex items-center gap-0.5 rounded-xs border border-border bg-card px-1 py-px">
                  <StripeIcon size={6} />
                  <span className="text-[5px] font-medium -tracking-[0.05em] text-muted-foreground">
                    38 subscriptions
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Entities Referenced ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="flex items-center gap-1.5">
                <p className="text-[7px] font-semibold -tracking-[0.05em] text-muted-foreground">
                  Entities Referenced
                </p>
                {[
                  { icon: <IntercomIcon size={8} />, label: 'Tickets' },
                  { icon: <CompanyIcon size={8} />, label: 'Companies' },
                  { icon: <StripeIcon size={8} />, label: 'Invoices' },
                ].map((entity) => (
                  <div
                    key={entity.label}
                    className="flex items-center gap-0.5 rounded-sm border border-border bg-card px-1 py-0.5 shadow-sm"
                  >
                    {entity.icon}
                    <span className="text-[6px] font-semibold -tracking-[0.05em] text-muted-foreground">
                      {entity.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
