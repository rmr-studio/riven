'use client';

import { WindowControls } from '@/components/ui/window-controls';
import { useContainerScale } from '@/hooks/use-container-scale';
import { TIMELINE_GRADIENT } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import {
  BasketIcon,
  CalendarIcon,
  CompanyIcon,
  IntercomIcon,
  RadarIcon,
  ScalesIcon,
  StripeIcon,
  TableShieldIcon,
} from './icons';

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

// ── Expand Arrow Icon ───────────────────────────────────────────────────

function ExpandIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="flex-shrink-0 text-muted-foreground/40"
    >
      <path
        d="M3.5 1.5H8.5V6.5"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 1.5L1.5 8.5"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Collapsed Agent Card ────────────────────────────────────────────────

function CollapsedAgent({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
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
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[8px] font-semibold -tracking-[0.03em] text-foreground">
            {title}
          </span>
        </div>
        <ExpandIcon />
      </div>
      <p className="mt-1.5 text-[6.5px] leading-[1.5] -tracking-[0.03em] text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

const INTERNAL_WIDTH = 480;

export const SubAgentsDiagram = ({ className }: { className?: string }) => {
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
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <h3 className="text-[11px] font-semibold -tracking-[0.04em] text-foreground">
                Active Agents
              </h3>
              <p className="mt-0.5 text-[7px] -tracking-[0.03em] text-muted-foreground">
                4 agents monitoring your data continuously
              </p>
            </motion.div>

            {/* ── Collapsed Agent Grid ── */}
            <div className="grid grid-cols-3 gap-2">
              <CollapsedAgent
                icon={<ScalesIcon />}
                title="Cost-to-revenue ratio"
                description="Flags accounts where cost of service exceeds revenue thresholds"
                delay={0.1}
              />
              <CollapsedAgent
                icon={<RadarIcon />}
                title="Deal momentum"
                description="Tracks deal velocity and flags stalling opportunities"
                delay={0.15}
              />
              <CollapsedAgent
                icon={<TableShieldIcon />}
                title="Revenue leakage"
                description="Detects billing gaps, failed charges, and missed renewals"
                delay={0.2}
              />
            </div>

            {/* ── Expanded Agent ── */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="rounded-lg border border-border/40 bg-muted/20"
            >
              {/* Agent Header */}
              <div className="space-y-1 px-4 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <BasketIcon />
                  <span className="text-[10px] font-semibold -tracking-[0.04em] text-foreground">
                    Post-Purchase Dropout Monitor
                  </span>
                </div>
                <p className="text-[7px] -tracking-[0.03em] text-muted-foreground">
                  Customers inactive for 14+ days after first purchase
                </p>
                <p className="text-[8px] -tracking-[0.03em] text-foreground">
                  <span className="font-semibold">3 </span>
                  <span className="text-muted-foreground">customers matched in the</span>
                  <span className="font-semibold"> last 7 days</span>
                </p>
              </div>

              {/* Divider */}
              <div className="mx-4 border-t border-border/30" />

              {/* Entity + Detail */}
              <div className="space-y-2.5 px-4 pt-2.5 pb-3">
                {/* Entity Row */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold -tracking-[0.03em] text-foreground">
                    Meridian Labs
                  </span>
                  <span className="rounded-[3px] border border-border/50 bg-card px-1 py-px text-[6px] font-medium -tracking-[0.03em] text-muted-foreground">
                    Enterprise
                  </span>
                  <span className="rounded-[3px] border border-border/50 bg-card px-1 py-px text-[6px] font-medium -tracking-[0.03em] text-muted-foreground">
                    $32k MRR
                  </span>
                </div>

                {/* Timeline */}
                <div className="relative pl-2.5">
                  {/* Timeline glow */}
                  <div
                    className="absolute top-0 bottom-0 left-[2px] w-[3px] opacity-60"
                    style={{ background: TIMELINE_GRADIENT, filter: 'blur(4px)' }}
                  />
                  {/* Timeline line */}
                  <div
                    className="absolute top-0 bottom-0 left-[3px] w-[1.5px]"
                    style={{ background: TIMELINE_GRADIENT }}
                  />

                  <div className="space-y-2 pl-3">
                    {/* Day 1 */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[6px] font-semibold -tracking-[0.03em] text-muted-foreground">
                        Day 1
                      </span>
                      <span className="text-[7px] -tracking-[0.03em] text-foreground">
                        First purchase
                      </span>
                      <SourceChip
                        icon={<StripeIcon size={8} />}
                        label="Stripe Purchase — $720"
                      />
                    </div>

                    {/* Day 3 */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[6px] font-semibold -tracking-[0.03em] text-muted-foreground">
                        Day 3
                      </span>
                      <span className="text-[7px] -tracking-[0.03em] text-foreground">
                        Support ticket raised
                      </span>
                      <SourceChip
                        icon={<IntercomIcon size={8} />}
                        label="OAuth token refresh failing"
                      />
                    </div>

                    {/* Day 14 */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[6px] font-semibold -tracking-[0.03em] text-muted-foreground">
                        Day 14
                      </span>
                      <span className="text-[7px] -tracking-[0.03em] text-foreground">
                        No activity since
                      </span>
                      <SourceChip
                        icon={<CompanyIcon size={8} />}
                        label="Last login 14 days ago"
                      />
                    </div>
                  </div>
                </div>

                {/* Sources used */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[6px] font-medium -tracking-[0.03em] text-muted-foreground/60">
                    Sources:
                  </span>
                  <SourceChip icon={<StripeIcon size={7} />} label="Invoices" />
                  <SourceChip icon={<IntercomIcon size={7} />} label="Support Tickets" />
                  <SourceChip icon={<CompanyIcon size={7} />} label="Usage Data" />
                  <SourceChip icon={<CalendarIcon size={7} />} label="Subscriptions" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
