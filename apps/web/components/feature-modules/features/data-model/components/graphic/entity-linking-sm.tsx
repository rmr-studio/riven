'use client';

import { WindowControls } from '@/components/ui/window-controls';
import { useContainerScale } from '@/hooks/use-container-scale';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

// ── Entity Icon ─────────────────────────────────────────────────────────

function EntityIcon({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[3px]"
      style={{ backgroundColor: color }}
    >
      {children}
    </div>
  );
}

function PersonSvg() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
      <path
        d="M5 2.5C5.83 2.5 6.5 3.17 6.5 4C6.5 4.83 5.83 5.5 5 5.5C4.17 5.5 3.5 4.83 3.5 4C3.5 3.17 4.17 2.5 5 2.5ZM5 6.25C6.66 6.25 8 6.92 8 7.75V8.25H2V7.75C2 6.92 3.34 6.25 5 6.25Z"
        fill="white"
      />
    </svg>
  );
}

// ── Connected Entity Card ───────────────────────────────────────────────

function ConnectedEntity({
  icon,
  name,
  count,
  connectionField,
  faded,
  delay,
}: {
  icon: React.ReactNode;
  name: string;
  count: string;
  connectionField?: string;
  faded?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      whileInView={{ opacity: faded ? 0.35 : 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2"
    >
      {connectionField && (
        <div className="mb-1 inline-flex self-start rounded-full bg-emerald-500/10 px-1.5 py-px">
          <span className="text-[5px] font-medium -tracking-[0.03em] text-emerald-600">
            via {connectionField}
          </span>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[7.5px] font-semibold -tracking-[0.03em] text-foreground">
          {name}
        </span>
      </div>
      <p className="mt-0.5 text-[6px] -tracking-[0.03em] text-muted-foreground">
        <span className="font-semibold text-foreground">{count}</span> entities
      </p>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

const INTERNAL_WIDTH = 320;

export const EntityLinkingDiagramSm = ({ className }: { className?: string }) => {
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
        <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="space-y-2.5 p-4">
            {/* ── Window Controls ── */}
            <WindowControls size={5} />

            {/* ── New Entity Header ── */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5">
                <EntityIcon color="#E8913A">
                  <PersonSvg />
                </EntityIcon>
                <span className="text-[9px] font-semibold -tracking-[0.04em] text-foreground">
                  HubSpot Contact
                </span>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-px text-[5.5px] font-semibold text-emerald-600">
                  NEW
                </span>
              </div>
              <p className="mt-1 text-[6px] -tracking-[0.03em] text-muted-foreground">
                New entity added — automatically linked
              </p>
            </motion.div>

            {/* ── Linked Entities ── */}
            <p className="text-[6px] font-semibold -tracking-[0.03em] text-muted-foreground">
              Linked Entities
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <ConnectedEntity
                icon={
                  <EntityIcon color="rgba(123,197,160,0.8)">
                    <PersonSvg />
                  </EntityIcon>
                }
                name="User"
                count="2,847"
                connectionField="email"
                delay={0.2}
              />
              <ConnectedEntity
                icon={
                  <EntityIcon color="rgba(197,137,208,0.8)">
                    <PersonSvg />
                  </EntityIcon>
                }
                name="Support Ticket"
                count="912"
                connectionField="username"
                delay={0.25}
              />
              <ConnectedEntity
                icon={
                  <EntityIcon color="#635BFF">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M5 3C6.1 3 7 3.9 7 5C7 6.1 6.1 7 5 7C3.9 7 3 6.1 3 5C3 3.9 3.9 3 5 3ZM3.75 4.75H6.25M5 3.5V6.5"
                        stroke="white"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </EntityIcon>
                }
                name="Invoice"
                count="1,204"
                connectionField="customer_id"
                delay={0.3}
              />
            </div>

            {/* ── Other Entities ── */}
            <div className="grid grid-cols-3 gap-1.5">
              <ConnectedEntity
                icon={
                  <EntityIcon color="rgba(123,197,195,0.8)">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M6.5 3.5C7.06 3.68 7.46 4.14 7.52 4.69C7.57 5.24 7.26 5.76 6.77 5.99L6.18 7.25C6.14 7.33 6.05 7.38 5.97 7.35C5.88 7.33 5.83 7.25 5.83 7.17V6H5.63C5.28 6 5 5.72 5 5.42V4.08C5 3.78 5.28 3.5 5.63 3.5H6.5ZM8.42 3.5C8.72 3.5 9 3.78 9 4.08V5.42C9 5.72 8.72 6 8.42 6H8V4.69C7.98 4.39 7.87 4.11 7.69 3.89C7.66 3.85 7.63 3.82 7.58 3.79V3.5H8.42Z"
                        fill="white"
                      />
                    </svg>
                  </EntityIcon>
                }
                name="Feedback"
                count="761"
                faded
                delay={0.35}
              />
              <ConnectedEntity
                icon={
                  <EntityIcon color="rgba(235,179,164,0.8)">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M3.5 5.5L4.5 3.5M4.5 5.5L5.5 3.5M5.5 5.5L6.5 3.5M4 4.5H6M5 6.5V7.5"
                        stroke="white"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </EntityIcon>
                }
                name="Acq. Channel"
                count="7"
                faded
                delay={0.4}
              />
              <ConnectedEntity
                icon={
                  <EntityIcon color="rgba(91,166,168,0.8)">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M5 3C6.1 3 7 3.9 7 5C7 6.1 6.1 7 5 7C3.9 7 3 6.1 3 5C3 3.9 3.9 3 5 3ZM5 4V5L5.75 5.75"
                        stroke="white"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </EntityIcon>
                }
                name="Event Log"
                count="3,421"
                faded
                delay={0.45}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
