'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

// ── Tiny Brand Icons ────────────────────────────────────────────────────

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

const CompanyIcon = ({ size = 8 }: { size?: number }) => (
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 344);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
            <div className="flex items-center gap-[4px]">
              <div className="h-[5px] w-[5px] rounded-full bg-[#F72F2F] shadow-[inset_0_0.5px_0.5px_rgba(0,0,0,0.25)]" />
              <div className="h-[5px] w-[5px] rounded-full bg-[#FFE72F] shadow-[inset_0_0.5px_0.5px_rgba(0,0,0,0.25)]" />
              <div className="h-[5px] w-[5px] rounded-full bg-[#56F659] shadow-[inset_0_0.5px_0.5px_rgba(0,0,0,0.25)]" />
            </div>

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
                  { icon: <IntercomIcon />, label: 'Tickets' },
                  { icon: <CompanyIcon />, label: 'Companies' },
                  { icon: <StripeIcon />, label: 'Invoices' },
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
