'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

// ── Tiny Brand Icons ────────────────────────────────────────────────────

const IntercomIcon = ({ size = 11 }: { size?: number }) => (
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

const StripeIcon = ({ size = 11 }: { size?: number }) => (
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

const CalendarIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <rect width="14" height="14" rx="2.5" fill="#4A642B" />
    <path
      d="M5.5 2.5V4.5M8.5 2.5V4.5M3.5 6.5H10.5M6 9H8M7 8V10M4.5 4H9.5C10.05 4 10.5 4.45 10.5 5V11C10.5 11.55 10.05 12 9.5 12H4.5C3.95 12 3.5 11.55 3.5 11V5C3.5 4.45 3.95 4 4.5 4Z"
      stroke="white"
      strokeWidth="0.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CompanyIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <rect width="14" height="14" rx="2.5" fill="#67207A" />
    <path
      d="M7 6H7.01M7 8H7.01M7 4H7.01M9 6H9.01M9 8H9.01M9 4H9.01M5 6H5.01M5 8H5.01M5 4H5.01M5.5 12V10.5C5.5 10.22 5.72 10 6 10H8C8.28 10 8.5 10.22 8.5 10.5V12M4 3H10C10.55 3 11 3.45 11 4V11C11 11.55 10.55 12 10 12H4C3.45 12 3 11.55 3 11V4C3 3.45 3.45 3 4 3Z"
      stroke="white"
      strokeWidth="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CommIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <rect width="14" height="14" rx="2.5" fill="#D09D50" />
    <path
      d="M8.75 4.5V9.5C8.75 9.78 8.81 10 9 10.17C9.19 10.33 9.42 10.39 9.65 10.36C9.88 10.33 10.07 10.23 10.2 10.06C10.33 9.89 10.39 9.68 10.36 9.47C10.33 9.27 10.22 9.09 10.05 8.97C9.88 8.85 9.68 8.8 9.47 8.8H4.53C4.32 8.8 4.12 8.85 3.95 8.97C3.78 9.09 3.67 9.27 3.64 9.47C3.61 9.68 3.67 9.89 3.8 10.06C3.93 10.23 4.12 10.33 4.35 10.36C4.58 10.39 4.81 10.33 5 10.17C5.19 10 5.25 9.78 5.25 9.5V4.5C5.25 4.22 5.19 4 5 3.83C4.81 3.67 4.58 3.61 4.35 3.64C4.12 3.67 3.93 3.77 3.8 3.94C3.67 4.11 3.61 4.32 3.64 4.53C3.67 4.73 3.78 4.91 3.95 5.03C4.12 5.15 4.32 5.2 4.53 5.2H9.47C9.68 5.2 9.88 5.15 10.05 5.03C10.22 4.91 10.33 4.73 10.36 4.53C10.39 4.32 10.33 4.11 10.2 3.94C10.07 3.77 9.88 3.67 9.65 3.64C9.42 3.61 9.19 3.67 9 3.83C8.81 4 8.75 4.22 8.75 4.5Z"
      stroke="white"
      strokeWidth="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GmailIcon = () => (
  <svg width={13} height={11} viewBox="0 0 16 14" fill="none" className="flex-shrink-0">
    <path
      d="M0.5 3.1C0.5 2.1 1.3 1 2.2 1C3.1 1 3.8 2.1 3.8 3.1V11.5H2.2C1.3 11.5 0.5 10.7 0.5 9.8V3.1Z"
      fill="#0094FF"
    />
    <path
      d="M12.2 3.1C12.2 2.1 13 1 13.8 1C14.7 1 15.5 2.1 15.5 3.1V9.8C15.5 10.7 14.7 11.5 13.8 11.5H12.2V3.1Z"
      fill="#03A400"
    />
    <path
      d="M13.8 1.3C14.4 0.8 15.2 0.9 15.7 1.5C16.2 2.1 16.1 3 15.5 3.5L12.5 6L12 3.3L13.8 1.3Z"
      fill="#FFE600"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.7 1.8C1.1 1.1 2 0.9 2.7 1.4L8 5.5L12 3.3L12.5 6L8.2 9.5L1 4.5C0.3 4 0.2 3 0.7 1.8Z"
      fill="#FF0909"
      fillOpacity="0.86"
    />
  </svg>
);

const EntityIcon = () => (
  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#A04242] flex items-center justify-center shadow-[inset_0_2px_3px_rgba(0,0,0,0.37)]">
    <svg width="11" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6.4 7.1L9.5 8.9C9.6 8.95 9.68 9.03 9.72 9.12C9.76 9.2 9.78 9.3 9.78 9.39C9.78 9.49 9.76 9.59 9.72 9.67C9.68 9.76 9.6 9.83 9.5 9.88L6.4 11.7C6.28 11.78 6.14 11.82 6 11.82C5.86 11.82 5.72 11.78 5.6 11.7L2.5 9.88C2.4 9.83 2.32 9.76 2.28 9.67C2.24 9.59 2.22 9.49 2.22 9.39C2.22 9.3 2.24 9.2 2.28 9.12C2.32 9.03 2.4 8.95 2.5 8.9L3.2 8.5M6.4 7.1C6.28 7.18 6.14 7.22 6 7.22C5.86 7.22 5.72 7.18 5.6 7.1L2.5 5.3C2.4 5.25 2.32 5.18 2.28 5.09C2.24 5.01 2.22 4.91 2.22 4.82C2.22 4.72 2.24 4.62 2.28 4.54C2.32 4.45 2.4 4.38 2.5 4.33L5.6 2.5C5.72 2.42 5.86 2.38 6 2.38C6.14 2.38 6.28 2.42 6.4 2.5L9.5 4.33C9.6 4.38 9.68 4.45 9.72 4.54C9.76 4.62 9.78 4.72 9.78 4.82C9.78 4.91 9.76 5.01 9.72 5.09C9.68 5.18 9.6 5.25 9.5 5.3L6.4 7.1Z"
        stroke="white"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

// ── Compact inline chip with glow ───────────────────────────────────────

function GlowChip({
  children,
  className,
  glowOpacity = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  glowOpacity?: number;
}) {
  return (
    <div className={cn('relative', className)}>
      <div
        className="absolute -inset-0.5 rounded-md"
        style={{
          background: 'linear-gradient(135deg, #38bdf8, #8b5cf6, #f43f5e)',
          filter: 'blur(4px)',
          opacity: glowOpacity,
        }}
      />
      <div className="relative inline-flex items-center gap-1 rounded-[3px] border border-border/60 bg-card px-[5px] py-[2px]">
        {children}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export const ChatResponseGraphic = ({ className }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 462);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        className="origin-top-left"
        style={{
          width: 462,
          fontFamily: 'var(--font-mono)',
          transform: `scale(${scale})`,
        }}
      >
        {/* ── Outer Card ── */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="space-y-3 p-4 pb-3">
            {/* ── Window Controls ── */}
            <div className="flex items-center gap-[6px]">
              <div className="h-[7px] w-[7px] rounded-full bg-[#F72F2F] shadow-[inset_0_1px_1px_rgba(0,0,0,0.25)]" />
              <div className="h-[7px] w-[7px] rounded-full bg-[#FFE72F] shadow-[inset_0_1px_1px_rgba(0,0,0,0.25)]" />
              <div className="h-[7px] w-[7px] rounded-full bg-[#56F659] shadow-[inset_0_1px_1px_rgba(0,0,0,0.25)]" />
            </div>

            {/* ── User Prompt ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="pt-1"
            >
              <p className="-tracking-[0.05em] text-[9px] leading-[1.4] text-foreground">
                Which high-value customers are showing signs of churn? Are we at risk of losing any
                important customers soon?
              </p>
            </motion.div>

            {/* ── AI Response ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="border-t border-border/60 pt-2.5"
            >
              <p className="-tracking-[0.05em] text-[8px] leading-[1.4] text-muted-foreground">
                I found <b className="text-foreground">3 accounts</b> likely to churn. All three
                show declining usage over the <b className="text-foreground">past 60 days</b>,
                correlating with increased support tickets in the{' '}
                <b className="text-foreground">same period</b>.
              </p>
            </motion.div>

            {/* ── Entity Card + Timeline ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="relative"
            >
              {/* Gradient edge line - glow */}
              <div
                className="absolute bottom-0 left-[18px] top-0 w-[5px] opacity-60"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent 0%, #38bdf8 5%, #8b5cf6 40%, #f43f5e 75%, transparent 100%)',
                  filter: 'blur(6px)',
                }}
              />
              {/* Gradient edge line - crisp */}
              <div
                className="absolute bottom-0 left-[19.5px] top-0 w-[1.5px]"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent 0%, #38bdf8 5%, #8b5cf6 40%, #f43f5e 75%, transparent 100%)',
                }}
              />

              <div className="space-y-2.5 pl-8">
                {/* Meridian Labs */}
                <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 shadow-sm">
                  <EntityIcon />
                  <span className="-tracking-[0.05em] text-[10px] font-semibold text-foreground">
                    Meridian Labs
                  </span>
                  <span className="rounded-[3px] border border-[#93C19E] bg-[#A0D0AC] px-1 py-px text-[7px] font-medium text-white">
                    $32,400 MRR
                  </span>
                  <span className="rounded-[3px] border border-[#93C19E] bg-[#A0D0AC] px-1 py-px text-[7px] font-medium text-white">
                    Enterprise
                  </span>
                </div>

                {/* ── Subscription Status ── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="space-y-1"
                >
                  <p className="-tracking-[0.05em] text-[7px] font-semibold text-muted-foreground">
                    Subscription Status
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <GlowChip glowOpacity={0.2}>
                      <CalendarIcon />
                      <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                        Subscription
                      </span>
                      <span className="-tracking-[0.05em] text-[5.5px] text-muted-foreground">
                        Enterprise
                      </span>
                    </GlowChip>
                    <GlowChip>
                      <StripeIcon />
                      <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                        Subscription Renewal
                      </span>
                      <span className="-tracking-[0.05em] text-[5.5px] text-muted-foreground">
                        17th July 2026
                      </span>
                    </GlowChip>
                  </div>
                  <p className="-tracking-[0.05em] text-[6px] leading-[1.35] text-foreground">
                    <b>Meridian Labs</b> has a subscription renewal in <b>12 days.</b> Statistics
                    have shown that usage has <b>dropped 34%</b> over the past <b>60 days.</b> This
                    has followed <b>3 support tickets raised</b> in the last <b>90 days</b>
                  </p>
                </motion.div>

                {/* ── Customer Support ── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="space-y-1"
                >
                  <p className="-tracking-[0.05em] text-[7px] font-semibold text-muted-foreground">
                    Customer Support
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      'OAuth token refresh failing',
                      'Webhook delivery failing',
                      'Data sync 6 hours behind',
                    ].map((desc) => (
                      <GlowChip key={desc}>
                        <IntercomIcon />
                        <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                          Support Ticket
                        </span>
                        <span className="-tracking-[0.05em] text-[5px] text-muted-foreground">
                          {desc}
                        </span>
                      </GlowChip>
                    ))}
                  </div>
                </motion.div>

                {/* ── Recommendation + Contact ── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                  className="space-y-1"
                >
                  <p className="-tracking-[0.05em] text-[6px] leading-[1.35] text-foreground">
                    Meridian labs has been a high value account for quite some time. It might be
                    worth reaching out to understand their frustrations and drop in usage.{' '}
                    <b>John Smith</b> has been the primary contact across <b>4 email threads</b> and{' '}
                    <b>2 of the 3 support tickets.</b> Here&apos;s their details to reach out
                    directly.
                  </p>
                  <GlowChip className="inline-flex">
                    <GmailIcon />
                    <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                      John Smith (PM)
                    </span>
                    <span className="-tracking-[0.05em] text-[5px] text-muted-foreground">
                      jrsmith@mlabs.com
                    </span>
                  </GlowChip>
                </motion.div>

                {/* ── Entities Referenced ── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="space-y-1"
                >
                  <p className="-tracking-[0.05em] text-[7px] font-semibold text-muted-foreground">
                    Entities Referenced
                  </p>
                  <div className="flex flex-wrap gap-0.5">
                    {[
                      { icon: <IntercomIcon size={7} />, label: 'Support Tickets' },
                      { icon: <CompanyIcon size={7} />, label: 'Companies' },
                      { icon: <StripeIcon size={7} />, label: 'Invoices' },
                      { icon: <CalendarIcon size={7} />, label: 'Subscriptions' },
                      { icon: <CommIcon size={7} />, label: 'Communications' },
                    ].map((entity) => (
                      <div
                        key={entity.label}
                        className="flex items-center gap-0.5 rounded-[2px] border border-border/50 bg-card px-1 py-px"
                      >
                        {entity.icon}
                        <span className="-tracking-[0.05em] text-[5px] font-semibold text-muted-foreground">
                          {entity.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
