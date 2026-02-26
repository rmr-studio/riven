'use client';

import { WindowControls } from '@/components/ui/window-controls';
import { useContainerScale } from '@/hooks/use-container-scale';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { CompanyIcon, IntercomIcon, StripeIcon } from './icons';

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
        className="text-[6.5px] font-semibold -tracking-[0.03em]"
        style={{ width: 40, textAlign: 'right', color: textColor }}
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
        className="text-[6.5px] font-semibold -tracking-[0.03em]"
        style={{ width: 22, color: textColor }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

const INTERNAL_WIDTH = 480;

export const PatternsDiagram = ({ className }: { className?: string }) => {
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
        <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="space-y-3 p-5">
            {/* ── Window Controls ── */}
            <WindowControls size={6} />

            {/* ── Header ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-1.5"
            >
              <h3 className="text-[12px] font-semibold -tracking-[0.04em] text-foreground">
                New Insight Detected
              </h3>
              <p className="text-[7px] -tracking-[0.03em] text-muted-foreground">
                Pattern identified across 47 accounts
              </p>
              <p className="max-w-[90%] text-[7px] leading-[1.5] -tracking-[0.03em] text-muted-foreground">
                Customers acquired through <b className="text-foreground">paid search</b> generate{' '}
                <b style={{ color: '#C25550' }}>3.2x</b> more support tickets in their first{' '}
                <b className="text-foreground">60 days</b> than{' '}
                <b style={{ color: '#5BA6A8' }}>organic</b> customers. This group also shows a{' '}
                <b style={{ color: '#C25550' }}>22% higher</b> churn rate at the{' '}
                <b className="text-foreground">90-day</b> mark.
              </p>
            </motion.div>

            {/* ── 2-Column Chart Grid ── */}
            <div className="grid grid-cols-2 gap-2">
              {/* ── Support Tickets Card ── */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-col rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5"
              >
                <p className="text-[7px] font-semibold -tracking-[0.03em] text-muted-foreground">
                  Avg. Support Tickets (First 60 Days)
                </p>
                <div className="mt-2 space-y-1.5">
                  <BarRow
                    label="Paid"
                    value="5.2"
                    percent="100%"
                    fillColor="#C25550"
                    textColor="#9D3838"
                    delay={0.25}
                  />
                  <BarRow
                    label="Organic"
                    value="1.6"
                    percent="31%"
                    fillColor="#5BA6A8"
                    textColor="#377C7E"
                    delay={0.3}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <SourceChip icon={<IntercomIcon size={7} />} label="312 tickets" />
                  <SourceChip icon={<CompanyIcon size={7} />} label="47 companies" />
                </div>
              </motion.div>

              {/* ── Churn Rate Card ── */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-col rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5"
              >
                <p className="text-[7px] font-semibold -tracking-[0.03em] text-muted-foreground">
                  90-Day Churn Rate
                </p>
                <div className="mt-2 space-y-1.5">
                  <BarRow
                    label="Paid"
                    value="30%"
                    percent="100%"
                    fillColor="#C25550"
                    textColor="#9D3838"
                    delay={0.35}
                  />
                  <BarRow
                    label="Organic"
                    value="8%"
                    percent="27%"
                    fillColor="#5BA6A8"
                    textColor="#377C7E"
                    delay={0.4}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <SourceChip icon={<CompanyIcon size={7} />} label="47 companies" />
                  <SourceChip icon={<StripeIcon size={7} />} label="38 subscriptions" />
                </div>
              </motion.div>
            </div>

            {/* ── Entities Referenced ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="flex items-center gap-1.5 pt-0.5"
            >
              <span className="text-[6px] font-medium -tracking-[0.03em] text-muted-foreground/60">
                Sources:
              </span>
              <SourceChip icon={<IntercomIcon size={7} />} label="Support Tickets" />
              <SourceChip icon={<CompanyIcon size={7} />} label="Companies" />
              <SourceChip icon={<StripeIcon size={7} />} label="Subscriptions" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
