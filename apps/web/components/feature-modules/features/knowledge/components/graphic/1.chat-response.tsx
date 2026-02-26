'use client';

import { WindowControls } from '@/components/ui/window-controls';
import { useContainerScale } from '@/hooks/use-container-scale';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { CalendarIcon, CompanyIcon, IntercomIcon, StripeIcon } from './icons';

// ── Source Chip ──────────────────────────────────────────────────────────

function SourceChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-[3px] rounded-[3px] border border-border/50 bg-card px-1 py-px">
      {icon}
      <span className="text-[5.5px] font-medium -tracking-[0.03em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  change,
  sources,
  delay,
}: {
  label: string;
  value: string;
  change: string;
  sources: { icon: React.ReactNode; label: string }[];
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5"
    >
      <p className="text-[7px] -tracking-[0.03em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold -tracking-[0.04em] text-foreground">{value}</p>
      <p className="mt-0.5 text-[6.5px] -tracking-[0.03em] text-muted-foreground">{change}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {sources.map((source) => (
          <SourceChip key={source.label} icon={source.icon} label={source.label} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

const INTERNAL_WIDTH = 620;

export const ChatResponseGraphic = ({ className }: { className?: string }) => {
  const { containerRef, scale } = useContainerScale(INTERNAL_WIDTH);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        className="origin-top-left"
        style={{
          width: INTERNAL_WIDTH,
          fontFamily: 'var(--font-mono)',
          transform: `scale(${scale})`,
        }}
      >
        {/* ── Outer Card ── */}
        <div className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex-1 space-y-4 p-6 pb-4">
            {/* ── Window Controls ── */}
            <WindowControls size={6} />

            {/* ── User Prompt ── */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex justify-end"
            >
              <div className="rounded-sm rounded-br-sm bg-foreground/[0.05] px-2 py-1">
                <p className="text-[9px] leading-[1.5] -tracking-[0.03em] text-foreground">
                  Which high-value customers are showing signs of churn?
                </p>
              </div>
            </motion.div>

            {/* ── AI Title ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <h3 className="text-[12px] font-semibold -tracking-[0.04em] text-foreground">
                Churn Risk Analysis
              </h3>
            </motion.div>

            {/* ── Subtitle + Description ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-1.5"
            >
              <p className="text-[9px] font-semibold -tracking-[0.03em] text-foreground">
                At-Risk Accounts
              </p>
              <p className="max-w-[85%] text-[8px] leading-[1.5] -tracking-[0.03em] text-muted-foreground">
                3 enterprise accounts show declining engagement over the past 60 days. Revenue
                exposure is significant, with correlated increases in support activity.
              </p>
            </motion.div>

            {/* ── 2×2 Metric Grid ── */}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                label="Accounts at Risk"
                value="3"
                change="from 1 last quarter"
                sources={[
                  { icon: <CompanyIcon size={8} />, label: 'Companies' },
                  { icon: <CalendarIcon size={8} />, label: 'Subscriptions' },
                ]}
                delay={0.3}
              />
              <MetricCard
                label="Revenue Exposed"
                value="$84,200"
                change="MRR across flagged accounts"
                sources={[
                  { icon: <StripeIcon size={8} />, label: 'Invoices' },
                  { icon: <CalendarIcon size={8} />, label: 'Subscriptions' },
                ]}
                delay={0.35}
              />
              <MetricCard
                label="Avg. Usage Drop"
                value="-34%"
                change="over past 60 days"
                sources={[{ icon: <CompanyIcon size={8} />, label: 'Product Usage' }]}
                delay={0.4}
              />
              <MetricCard
                label="Open Tickets"
                value="7"
                change="across at-risk accounts"
                sources={[{ icon: <IntercomIcon size={8} />, label: 'Support Tickets' }]}
                delay={0.45}
              />
            </div>
          </div>

          {/* ── Chat Input Bar ── */}
          <div className="border-t border-border/40 px-5 py-3">
            <div className="mb-1.5 flex items-center rounded-lg border border-border/50 bg-card px-3 py-2">
              <span className="text-[8px] -tracking-[0.03em] text-muted-foreground/40">
                Who are the best contacts to reach out to? What’s their preferred channel?
              </span>
              <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-md bg-foreground/[0.07]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M5 8V2M5 2L2.5 4.5M5 2L7.5 4.5"
                    className="stroke-muted-foreground"
                    strokeOpacity="0.5"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {[
                // Plus icon
                <svg key="plus" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M5 2v6M2 5h6"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>,
                // Lightning icon
                <svg key="bolt" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M5.5 1L2.5 6H5L4.5 9L7.5 4H5L5.5 1Z"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>,
                // Globe icon
                <svg key="globe" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="0.8" />
                  <path
                    d="M1 5h8M5 1c1.5 1.5 1.5 6.5 0 8M5 1c-1.5 1.5-1.5 6.5 0 8"
                    stroke="currentColor"
                    strokeWidth="0.8"
                  />
                </svg>,
                // Refresh icon
                <svg key="refresh" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1.5 5a3.5 3.5 0 0 1 6.4-2M8.5 5a3.5 3.5 0 0 1-6.4 2"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 1.5L8 3l-1.5.5M3 8.5L2 7l1.5-.5"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>,
              ].map((icon, i) => (
                <div key={i} className="text-muted-foreground/30">
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
