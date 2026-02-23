'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

// ── Tiny Brand Icons ────────────────────────────────────────────────────

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

const SubscriptionIcon = ({ size = 11 }: { size?: number }) => (
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

const LayersBadge = () => (
  <div className="absolute -bottom-px -right-px w-[6px] h-[6px] rounded-full bg-[#A04242] ring-[0.5px] ring-card shadow-[inset_0_1px_1px_rgba(0,0,0,0.37)]" />
);

// ── Compact inline entity chip ──────────────────────────────────────────

function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-[3px] border border-border/60 bg-card px-[5px] py-[2px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

const INTERNAL_WIDTH = 380;

export const ContextDiagram = ({ className }: { className?: string }) => {
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
        {/* ── Top Entity Card ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative z-10 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 shadow-md"
        >
          <EntityIcon />
          <span className="-tracking-[0.05em] text-[11px] font-semibold text-foreground">
            Meridian Labs
          </span>
          <span className="rounded-[3px] border border-[#93C19E] bg-[#A0D0AC] px-1 py-px text-[7px] font-medium text-white">
            $32,400 MRR
          </span>
          <span className="rounded-[3px] border border-[#93C19E] bg-[#A0D0AC] px-1 py-px text-[7px] font-medium text-white">
            Enterprise
          </span>
        </motion.div>

        {/* ── Background Panel ── */}
        <div className="relative -mt-2.5 ml-7 rounded-xl border border-border bg-card shadow-lg">
          {/* Timeline glow */}
          <div
            className="absolute left-[14px] top-6 bottom-3 w-[4px] opacity-60"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, #38bdf8 10%, #8b5cf6 40%, #f43f5e 75%, transparent 100%)',
              filter: 'blur(5px)',
            }}
          />
          {/* Timeline line */}
          <div
            className="absolute left-[15px] top-6 bottom-3 w-[1.5px]"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, #38bdf8 10%, #8b5cf6 40%, #f43f5e 75%, transparent 100%)',
            }}
          />

          <div className="space-y-2 p-3 pt-5 pl-8">
            {/* ── New Account Added ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-1"
            >
              <p className="-tracking-[0.05em] text-[7px] font-semibold text-muted-foreground">
                New Account Added
              </p>
              <div className="flex flex-wrap gap-1">
                <Chip>
                  <CompanyIcon />
                  <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                    Company
                  </span>
                  <span className="-tracking-[0.05em] text-[6px] text-muted-foreground">
                    Enterprise
                  </span>
                </Chip>
                <Chip>
                  <SubscriptionIcon />
                  <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                    Subscription
                  </span>
                  <span className="-tracking-[0.05em] text-[6px] text-muted-foreground">
                    Enterprise
                  </span>
                </Chip>
              </div>
            </motion.div>

            {/* ── Invoice Received ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Chip>
                <StripeIcon />
                <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                  Invoice Received
                </span>
                <span className="-tracking-[0.05em] text-[5px] text-muted-foreground">
                  18th Nov 2025 · accounts@mlabs.com
                </span>
              </Chip>
            </motion.div>

            {/* ── Support Ticket Received ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="space-y-1"
            >
              <p className="-tracking-[0.05em] text-[7px] font-semibold text-muted-foreground">
                Support Ticket Received
              </p>
              <Chip>
                <IntercomIcon />
                <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                  Support Ticket
                </span>
                <span className="-tracking-[0.05em] text-[5px] text-muted-foreground">
                  Data sync 6 hours behind · jrsmith@mlabs.com
                </span>
              </Chip>
            </motion.div>

            {/* ── Identity Resolved ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="space-y-0.5"
            >
              <p className="-tracking-[0.05em] text-[5.5px] text-muted-foreground text-right pr-2">
                <span className="font-semibold">Identity resolved – </span>
                matched on email domain
              </p>
              <div className="flex justify-end pr-2">
                <Chip>
                  <div className="relative">
                    <CompanyIcon size={10} />
                    <LayersBadge />
                  </div>
                  <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                    Company
                  </span>
                  <span className="-tracking-[0.05em] text-[6px] text-muted-foreground">
                    Meridian Labs
                  </span>
                </Chip>
              </div>
            </motion.div>

            {/* ── Email Thread Synced ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="space-y-1"
            >
              <div className="flex items-baseline gap-1.5">
                <p className="-tracking-[0.05em] text-[7px] font-semibold text-muted-foreground">
                  Email Thread Synced
                </p>
                <p className="-tracking-[0.05em] text-[5.5px] text-muted-foreground">
                  6 threads found
                </p>
              </div>
              <Chip>
                <GmailIcon />
                <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                  John Smith (PM)
                </span>
                <span className="-tracking-[0.05em] text-[5px] text-muted-foreground">
                  jrsmith@mlabs.com
                </span>
              </Chip>
            </motion.div>

            {/* ── Primary Contact Suggested ── */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="space-y-1"
            >
              <div className="text-right pr-1">
                <p className="-tracking-[0.05em] text-[5.5px] font-semibold text-muted-foreground">
                  Primary contact suggested
                </p>
                <p className="-tracking-[0.05em] text-[5px] text-muted-foreground">
                  identified across multiple data sources
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Chip>
                  <IntercomIcon />
                  <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                    Support Ticket
                  </span>
                  <span className="-tracking-[0.05em] text-[5px] text-muted-foreground">
                    jrsmith@mlabs.com
                  </span>
                </Chip>
                <Chip>
                  <div className="relative">
                    <CompanyIcon size={10} />
                    <LayersBadge />
                  </div>
                  <span className="-tracking-[0.05em] text-[7px] font-semibold text-foreground">
                    Company
                  </span>
                  <span className="-tracking-[0.05em] text-[6px] text-muted-foreground">
                    Meridian Labs
                  </span>
                </Chip>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
