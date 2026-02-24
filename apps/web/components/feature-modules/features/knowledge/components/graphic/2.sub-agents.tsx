'use client';

import { WindowControls } from '@/components/ui/window-controls';
import { useContainerScale } from '@/hooks/use-container-scale';
import { TIMELINE_GRADIENT } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { BasketIcon, IntercomIcon, RadarIcon, ScalesIcon, StripeIcon, TableShieldIcon } from './icons';

// ── Main Component ──────────────────────────────────────────────────────

const INTERNAL_WIDTH = 380;

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
          <div className="relative space-y-2.5 p-4">
            {/* ── Window Controls ── */}
            <WindowControls size={5} />

            {/* ── Collapsed Agent Rows ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 py-1.5">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="flex-shrink-0 text-muted-foreground/60">
                  <path d="M3 2L5.5 4L3 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <ScalesIcon />
                <span className="text-[9px] font-semibold -tracking-[0.05em] text-foreground">
                  Cost-to-revenue ratio monitor
                </span>
              </div>
              <div className="border-b border-border/40" />
              <div className="flex items-center gap-2 py-1.5">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="flex-shrink-0 text-muted-foreground/60">
                  <path d="M3 2L5.5 4L3 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <RadarIcon />
                <span className="text-[9px] font-semibold -tracking-[0.05em] text-foreground">
                  Deal momentum tracker
                </span>
              </div>
              <div className="border-b border-border/40" />
              <div className="flex items-center gap-2 py-1.5">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="flex-shrink-0 text-muted-foreground/60">
                  <path d="M3 2L5.5 4L3 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <TableShieldIcon />
                <span className="text-[9px] font-semibold -tracking-[0.05em] text-foreground">
                  Revenue leakage detector
                </span>
              </div>
            </motion.div>

            {/* ── Expanded Agent Header ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-1 rounded-lg bg-muted/30 px-2.5 py-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center gap-2">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="flex-shrink-0 text-muted-foreground/60">
                  <path d="M2 3L4 5.5L6 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <BasketIcon />
                <span className="text-[10px] font-semibold -tracking-[0.05em] text-foreground">
                  Post-Purchase Dropout Monitor
                </span>
              </div>
              <p className="text-[7px] -tracking-[0.05em] text-muted-foreground">
                Customers inactive for 14+ days after first purchase
              </p>
              <p className="text-[8px] -tracking-[0.05em] text-foreground">
                <span className="font-semibold">3 </span>
                <span className="font-medium text-muted-foreground">customers matched in the</span>
                <span className="font-semibold"> last 7 days</span>
              </p>
            </motion.div>

            {/* ── Entity Row ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex items-center gap-1.5"
            >
              <span className="text-[9px] font-semibold -tracking-[0.05em] text-foreground">
                Meridian Labs
              </span>
              <span className="rounded-xs border border-border bg-card px-1 py-px text-[6px] font-medium -tracking-[0.05em] text-muted-foreground">
                Enterprise
              </span>
              <span className="rounded-xs border border-border bg-card px-1 py-px text-[6px] font-medium -tracking-[0.05em] text-muted-foreground">
                $32k MRR
              </span>
            </motion.div>

            {/* ── Timeline ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="relative pl-2.5"
            >
              {/* Timeline glow */}
              <div
                className="absolute left-[2px] top-0 bottom-0 w-[3px] opacity-60"
                style={{
                  background:
                    TIMELINE_GRADIENT,
                  filter: 'blur(4px)',
                }}
              />
              {/* Timeline line */}
              <div
                className="absolute left-[3px] top-0 bottom-0 w-[1.5px]"
                style={{
                  background:
                    TIMELINE_GRADIENT,
                }}
              />

              <div className="space-y-2 pl-3">
                {/* Day 1 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[6px] font-semibold -tracking-[0.05em] text-muted-foreground">
                    Day 1
                  </span>
                  <span className="text-[7px] -tracking-[0.05em] text-foreground">
                    First purchase
                  </span>
                  <div className="flex items-center gap-1 rounded-xs border border-border px-1.5 py-0.5">
                    <StripeIcon size={8} />
                    <span className="text-[6px] font-semibold -tracking-[0.05em] text-foreground">
                      Stripe Purchase
                    </span>
                    <span className="text-[6px] -tracking-[0.05em] text-muted-foreground">
                      $720
                    </span>
                  </div>
                </div>

                {/* Day 3 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[6px] font-semibold -tracking-[0.05em] text-muted-foreground">
                    Day 3
                  </span>
                  <span className="text-[7px] -tracking-[0.05em] text-foreground">
                    Support ticket raised
                  </span>
                  <div className="flex items-center gap-1 rounded-xs border border-border px-1.5 py-0.5">
                    <IntercomIcon size={8} />
                    <span className="text-[6px] font-semibold -tracking-[0.05em] text-foreground">
                      Support Ticket
                    </span>
                    <span className="text-[6px] -tracking-[0.05em] text-muted-foreground">
                      OAuth token refresh failing
                    </span>
                  </div>
                </div>

                {/* Day 7 (clipped) */}
                <div className="overflow-hidden h-[8px]">
                  <span className="text-[6px] font-semibold -tracking-[0.05em] text-muted-foreground">
                    Day 7
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
