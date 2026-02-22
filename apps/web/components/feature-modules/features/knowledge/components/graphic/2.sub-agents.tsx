'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

// ── Tiny Icons ───────────────────────────────────────────────────────────

const ScalesIcon = () => (
  <svg width="13" height="13" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 text-muted-foreground">
    <path
      d="M9 6.5V15.5M14.5 8.5L17 15C16.28 15.54 15.4 15.83 14.5 15.83C13.6 15.83 12.72 15.54 12 15L14.5 8.5ZM14.5 8.5V7.67M1.5 7.67H2.33C4.66 7.67 6.95 7.1 9 6C11.05 7.1 13.34 7.67 15.67 7.67H16.5M3.5 8.5L6 15C5.28 15.54 4.4 15.83 3.5 15.83C2.6 15.83 1.72 15.54 1 15L3.5 8.5ZM3.5 8.5V7.67M5 15.5H13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RadarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 text-muted-foreground">
    <path
      d="M12 4.25C10.22 3.56 8.25 3.5 6.43 4.09C4.61 4.67 3.05 5.86 2 7.47C0.96 9.07 0.5 10.98 0.69 12.88C0.89 14.78 1.74 16.56 3.09 17.91C4.44 19.26 6.22 20.11 8.12 20.31C10.02 20.5 11.93 20.04 13.54 19C15.14 17.95 16.33 16.39 16.92 14.57C17.5 12.75 17.44 10.78 16.75 9M10.17 10.83L14.83 6.17M10.67 12C10.67 12.92 9.92 13.67 9 13.67C8.08 13.67 7.33 12.92 7.33 12C7.33 11.08 8.08 10.33 9 10.33C9.92 10.33 10.67 11.08 10.67 12Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0,-3)"
    />
  </svg>
);

const TableShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 text-muted-foreground">
    <path
      d="M9 5.5V6.55M12.33 0.5V5.05M16.5 5.6V2.17C16.5 1.73 16.32 1.3 16.01 0.99C15.7 0.68 15.28 0.5 14.83 0.5H3.17C2.72 0.5 2.3 0.68 1.99 0.99C1.68 1.3 1.5 1.73 1.5 2.17V13.83C1.5 14.28 1.68 14.7 1.99 15.01C2.3 15.32 2.72 15.5 3.17 15.5H7.96M1.5 10.5H7.33M1.5 5.5H11.62M5.67 10.5V15.5M5.67 0.5V5.5M17.33 12.58C17.33 14.67 15.88 15.71 14.14 16.31C14.05 16.34 13.95 16.34 13.86 16.31C12.13 15.71 10.67 14.67 10.67 12.58V9.67C10.67 9.56 10.71 9.45 10.79 9.37C10.87 9.3 10.97 9.25 11.08 9.25C11.92 9.25 12.96 8.75 13.68 8.12C13.77 8.04 13.88 8 14 8C14.12 8 14.23 8.04 14.32 8.12C15.05 8.75 16.08 9.25 16.92 9.25C17.03 9.25 17.13 9.29 17.21 9.37C17.29 9.45 17.33 9.56 17.33 9.67V12.58Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BasketIcon = () => (
  <svg width="13" height="13" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 text-muted-foreground">
    <path
      d="M11.5 6.17L10.67 13.67M14.83 6.17L11.5 0.33M0.67 6.17H17.33M2 6.17L3.25 12.33C3.33 12.72 3.54 13.06 3.84 13.3C4.15 13.55 4.53 13.68 4.92 13.67H13.08C13.47 13.68 13.85 13.55 14.16 13.3C14.46 13.06 14.67 12.72 14.75 12.33L16.17 6.17M2.75 9.92H15.25M3.17 6.17L6.5 0.33M6.5 6.17L7.33 13.67"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StripeIcon = ({ size = 8 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
    <circle cx="8" cy="8" r="8" fill="#635BFF" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.28 6.27C7.28 5.81 7.66 5.63 8.28 5.63C9.17 5.63 10.29 5.9 11.17 6.38V3.64C10.2 3.26 9.24 3.11 8.28 3.11C5.92 3.11 4.35 4.34 4.35 6.4C4.35 9.61 9.07 9.1 9.07 10.49C9.07 11.02 8.6 11.2 7.95 11.2C6.98 11.2 5.75 10.81 4.77 10.27V13.06C5.85 13.53 6.94 13.73 7.95 13.73C10.37 13.73 12.04 12.53 12.04 10.44C12.02 6.97 7.28 7.59 7.28 6.27Z"
      fill="white"
    />
  </svg>
);

const IntercomIcon = ({ size = 8 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <rect width="14" height="14" rx="2.5" fill="#42A5F5" />
    <rect x="6.25" y="3.25" width="1.5" height="7" rx="0.75" fill="white" />
    <rect x="3.75" y="3.75" width="1.5" height="6" rx="0.75" fill="white" />
    <rect x="8.75" y="3.75" width="1.5" height="6" rx="0.75" fill="white" />
    <rect x="1.5" y="4.75" width="1.5" height="4" rx="0.75" fill="white" />
    <rect x="11" y="4.75" width="1.5" height="4" rx="0.75" fill="white" />
    <path
      d="M3.5 11C5 12.5 9 12.5 10.5 11"
      stroke="white"
      strokeWidth="0.75"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// ── Main Component ──────────────────────────────────────────────────────

const INTERNAL_WIDTH = 380;

export const SubAgentsDiagram = ({ className }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / INTERNAL_WIDTH);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
            <div className="flex items-center gap-[4px]">
              <div className="h-[5px] w-[5px] rounded-full bg-[#F72F2F] shadow-[inset_0_0.5px_0.5px_rgba(0,0,0,0.25)]" />
              <div className="h-[5px] w-[5px] rounded-full bg-[#FFE72F] shadow-[inset_0_0.5px_0.5px_rgba(0,0,0,0.25)]" />
              <div className="h-[5px] w-[5px] rounded-full bg-[#56F659] shadow-[inset_0_0.5px_0.5px_rgba(0,0,0,0.25)]" />
            </div>

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
                    'linear-gradient(to bottom, transparent 0%, #38bdf8 10%, #8b5cf6 40%, #f43f5e 75%, transparent 100%)',
                  filter: 'blur(4px)',
                }}
              />
              {/* Timeline line */}
              <div
                className="absolute left-[3px] top-0 bottom-0 w-[1.5px]"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent 0%, #38bdf8 10%, #8b5cf6 40%, #f43f5e 75%, transparent 100%)',
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
