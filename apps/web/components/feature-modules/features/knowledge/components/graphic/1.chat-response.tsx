'use client';

import { WindowControls } from '@/components/ui/window-controls';
import { useContainerScale } from '@/hooks/use-container-scale';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { CalendarIcon, CommIcon, CompanyIcon, EntityIcon, GmailIcon, IntercomIcon, StripeIcon } from './icons';

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
  const { containerRef, scale } = useContainerScale(462);

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
            <WindowControls size={7} />

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
