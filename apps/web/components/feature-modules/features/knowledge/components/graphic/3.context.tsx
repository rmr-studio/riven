'use client';

import { useContainerScale } from '@/hooks/use-container-scale';
import { TIMELINE_GRADIENT } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { CalendarIcon, CompanyIcon, EntityIcon, GmailIcon, IntercomIcon, StripeIcon } from './icons';

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
                TIMELINE_GRADIENT,
              filter: 'blur(5px)',
            }}
          />
          {/* Timeline line */}
          <div
            className="absolute left-[15px] top-6 bottom-3 w-[1.5px]"
            style={{
              background:
                TIMELINE_GRADIENT,
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
                  <CalendarIcon />
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
