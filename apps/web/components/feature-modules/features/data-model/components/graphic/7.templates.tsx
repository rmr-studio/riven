'use client';

import { GlowBorder } from '@/components/ui/glow-border';
import { useContainerScale } from '@/hooks/use-container-scale';
import { cn } from '@/lib/utils';
import {
  Building2,
  Calendar,
  DollarSign,
  Layers,
  Mail,
  ShieldCheck,
  Tag,
  Type,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ComponentType } from 'react';
import { inViewProps, useAnimateOnMount } from './animate-context';

// ── Source Icons ─────────────────────────────────────────────────────────

const StripeSourceIcon = () => (
  <div className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] bg-[#635BFF]">
    <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.28 6.27C7.28 5.81 7.66 5.63 8.28 5.63C9.17 5.63 10.29 5.9 11.17 6.38V3.64C10.2 3.26 9.24 3.11 8.28 3.11C5.92 3.11 4.35 4.34 4.35 6.4C4.35 9.61 9.07 9.1 9.07 10.49C9.07 11.02 8.6 11.2 7.95 11.2C6.98 11.2 5.75 10.81 4.77 10.27V13.06C5.85 13.53 6.94 13.73 7.95 13.73C10.37 13.73 12.04 12.53 12.04 10.44C12.02 6.97 7.28 7.59 7.28 6.27Z"
        fill="white"
      />
    </svg>
  </div>
);

const PosthogSourceIcon = () => (
  <div className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] bg-[#1D4AFF]">
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
      <path d="M2 2L12 7L2 12V2Z" fill="#F9BD2B" />
      <path d="M12 7L22 12L12 17V7Z" fill="white" />
      <path d="M2 12L12 17L2 22V12Z" fill="white" />
    </svg>
  </div>
);

const HubSpotSourceIcon = () => (
  <div className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] bg-[#FF7A59]">
    <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
      <circle cx="11" cy="6.5" r="2.5" stroke="white" strokeWidth="1.2" fill="none" />
      <circle cx="5" cy="11" r="1.5" fill="white" />
      <path d="M6.5 11L8.5 8.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
      <path d="M11 4V2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  </div>
);

const EntitySourceIcon = () => (
  <div className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] bg-[#8B5CF6]/80">
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
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

// ── Data Types ──────────────────────────────────────────────────────────

interface Attribute {
  icon: ComponentType<{ className?: string }>;
  label: string;
}

interface Relationship {
  sourceIcon: ComponentType;
  label: string;
  source: string;
}

interface EntityType {
  name: string;
  iconBg: string;
  iconPath: React.ReactNode;
  attributeCount: number;
  relationshipCount: number;
  attributes: Attribute[];
  relationships: Relationship[];
}

// ── Template Data ───────────────────────────────────────────────────────

const ENTITIES: EntityType[] = [
  {
    name: 'Customers',
    iconBg: '#E8913A',
    iconPath: (
      <path
        d="M9 4.5C10.38 4.5 11.5 5.62 11.5 7C11.5 8.38 10.38 9.5 9 9.5C7.62 9.5 6.5 8.38 6.5 7C6.5 5.62 7.62 4.5 9 4.5ZM9 11C11.21 11 13 11.9 13 13V14H5V13C5 11.9 6.79 11 9 11Z"
        fill="white"
      />
    ),
    attributeCount: 4,
    relationshipCount: 3,
    attributes: [
      { icon: Type, label: 'Name' },
      { icon: Mail, label: 'Email' },
      { icon: Building2, label: 'Company' },
      { icon: DollarSign, label: 'MRR' },
    ],
    relationships: [
      { sourceIcon: StripeSourceIcon, label: 'Invoices', source: 'Stripe' },
      { sourceIcon: EntitySourceIcon, label: 'Acquisition Source', source: 'Channels' },
      { sourceIcon: PosthogSourceIcon, label: 'Usage', source: 'PostHog' },
    ],
  },
  {
    name: 'Deals',
    iconBg: '#22c55e',
    iconPath: (
      <path
        d="M5 8.5L8 11.5L13 5.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    attributeCount: 5,
    relationshipCount: 2,
    attributes: [
      { icon: Type, label: 'Deal Name' },
      { icon: Layers, label: 'Stage' },
      { icon: DollarSign, label: 'Value' },
      { icon: Calendar, label: 'Close Date' },
      { icon: User, label: 'Owner' },
    ],
    relationships: [
      { sourceIcon: EntitySourceIcon, label: 'Contact', source: 'Customers' },
      { sourceIcon: HubSpotSourceIcon, label: 'Activities', source: 'HubSpot' },
    ],
  },
  {
    name: 'Support Tickets',
    iconBg: '#C589D0',
    iconPath: (
      <path
        d="M9 4.5C11.21 4.5 13 6.29 13 8.5C13 10.71 11.21 12.5 9 12.5C6.79 12.5 5 10.71 5 8.5C5 6.29 6.79 4.5 9 4.5ZM9 6.5V8.5L10.5 10"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    attributeCount: 4,
    relationshipCount: 2,
    attributes: [
      { icon: Type, label: 'Title' },
      { icon: Tag, label: 'Priority' },
      { icon: ShieldCheck, label: 'Status' },
    ],
    relationships: [{ sourceIcon: EntitySourceIcon, label: 'Reporter', source: 'Customers' }],
  },
];

// ── Row types ───────────────────────────────────────────────────────────

type DisplayRow =
  | { kind: 'relationship'; rel: Relationship }
  | { kind: 'attribute'; attr: Attribute };

const MAX_VISIBLE_ROWS = 5;

function buildVisibleRows(entity: EntityType) {
  // Relationships first (external tools prioritised), then attributes
  const all: DisplayRow[] = [
    ...entity.relationships.map((rel) => ({ kind: 'relationship' as const, rel })),
    ...entity.attributes.map((attr) => ({ kind: 'attribute' as const, attr })),
  ];
  const visible = all.slice(0, MAX_VISIBLE_ROWS);
  const hiddenCount = all.length - visible.length;
  return { visible, hiddenCount };
}

// ── Entity Type Section ─────────────────────────────────────────────────

function EntityTypeSection({
  entity,
  delay,
  onMount,
}: {
  entity: EntityType;
  delay: number;
  onMount: boolean;
}) {
  const { visible, hiddenCount } = buildVisibleRows(entity);

  return (
    <motion.div
      className="border-b border-border/50 last:border-b-0"
      initial={{ opacity: 0, y: 4 }}
      {...inViewProps(onMount, { opacity: 1, y: 0 })}
      transition={{ duration: 0.35, delay }}
    >
      {/* Entity Header */}
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-2">
        <div
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[5px]"
          style={{ backgroundColor: entity.iconBg, opacity: 0.85 }}
        >
          <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
            {entity.iconPath}
          </svg>
        </div>
        <span className="text-[12px] font-semibold tracking-tight text-foreground">
          {entity.name}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[9px] text-muted-foreground">{entity.attributeCount} attr</span>
          <span className="text-[9px] text-muted-foreground">{entity.relationshipCount} rel</span>
        </div>
      </div>

      {/* Rows — relationships first, then attributes, with dividers */}
      <div className="px-8 pb-3">
        {visible.map((row, i) => (
          <motion.div
            key={row.kind === 'relationship' ? row.rel.label : row.attr.label}
            initial={{ opacity: 0, x: -4 }}
            {...inViewProps(onMount, { opacity: 1, x: 0 })}
            transition={{ duration: 0.2, delay: delay + 0.06 + i * 0.03 }}
          >
            {i > 0 && <div className="h-px bg-border/25" />}
            {row.kind === 'relationship' ? (
              <div className="flex items-center gap-2 py-[7px]">
                <row.rel.sourceIcon />
                <span className="text-[10px] font-medium text-foreground/80">{row.rel.label}</span>
                <span className="text-[8px] text-muted-foreground">from</span>
                <span className="text-[9px] font-medium text-muted-foreground">
                  {row.rel.source}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-[7px]">
                <row.attr.icon className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-[10px] text-foreground/80">{row.attr.label}</span>
              </div>
            )}
          </motion.div>
        ))}

        {/* +N more */}
        {hiddenCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            {...inViewProps(onMount, { opacity: 1 })}
            transition={{ duration: 0.2, delay: delay + 0.06 + visible.length * 0.03 }}
          >
            <div className="h-px bg-border/25" />
            <p className="py-[5px] pl-0.5 text-[8px] text-muted-foreground/50">
              +{hiddenCount} more
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ── Background Card ─────────────────────────────────────────────────────

interface BgCardConfig {
  title: string;
  entities: string[];
  top: number;
  left: number;
  rotate: number;
  opacity: number;
  delay: number;
  width: number;
}

const BG_CARDS: BgCardConfig[] = [
  // Left side
  {
    title: 'E-Commerce',
    entities: ['Products', 'Orders', 'Customers'],
    top: 6,
    left: -10,
    rotate: -3,
    opacity: 0.7,
    delay: 0.1,
    width: 130,
  },
  {
    title: 'Consulting',
    entities: ['Clients', 'Engagements'],
    top: 170,
    left: -20,
    rotate: 2,
    opacity: 0.9,
    delay: 0.2,
    width: 115,
  },
  {
    title: 'Real Estate',
    entities: ['Properties', 'Tenants', 'Leases'],
    top: 300,
    left: 0,
    rotate: -1.5,
    opacity: 0.9,
    delay: 0.25,
    width: 120,
  },
  // Right side
  {
    title: 'Agency',
    entities: ['Clients', 'Projects', 'Campaigns'],
    top: 10,
    left: 570,
    rotate: 2.5,
    opacity: 0.65,
    delay: 0.12,
    width: 125,
  },
  {
    title: 'Marketplace',
    entities: ['Vendors', 'Listings'],
    top: 180,
    left: 585,
    rotate: -2,
    opacity: 0.5,
    delay: 0.22,
    width: 110,
  },
  {
    title: 'Healthcare',
    entities: ['Patients', 'Appointments', 'Billing'],
    top: 310,
    left: 565,
    rotate: 1,
    opacity: 0.4,
    delay: 0.28,
    width: 120,
  },
];

function BackgroundCard({ config, onMount }: { config: BgCardConfig; onMount: boolean }) {
  return (
    <motion.div
      className="absolute rounded-lg border border-border/50 bg-card/70 p-2 shadow-sm"
      style={{
        top: config.top,
        left: config.left,
        width: config.width,
        transform: `rotate(${config.rotate}deg)`,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      {...inViewProps(onMount, { opacity: 1, scale: 1 })}
      transition={{ duration: 0.5, delay: config.delay }}
    >
      <p className="text-[7px] font-semibold tracking-tight text-foreground/60">{config.title}</p>
      <div className="mt-1 h-px w-full bg-border/30" />
      {config.entities.map((name) => (
        <div key={name} className="flex items-center gap-1 px-0.5 py-[3px]">
          <div className="h-1.5 w-1.5 rounded-[1px] bg-muted-foreground/20" />
          <span className="text-[5.5px] text-muted-foreground/50">{name}</span>
        </div>
      ))}
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

const INTERNAL_WIDTH = 700;

export const TemplateCarouselGraphic = ({ className }: { className?: string }) => {
  const { containerRef, scale } = useContainerScale(INTERNAL_WIDTH);
  const onMount = useAnimateOnMount();

  return (
    <div ref={containerRef} className={cn('pointer-events-none relative w-full', className)}>
      <div
        className="origin-top-left"
        style={{
          width: INTERNAL_WIDTH,
          fontFamily: 'var(--font-mono)',
          transform: `scale(${scale})`,
        }}
      >
        <div className="relative flex items-start justify-center overflow-hidden pt-2 pb-4">
          {/* Background template cards — scattered behind */}
          {BG_CARDS.map((config) => (
            <BackgroundCard key={config.title} config={config} onMount={onMount} />
          ))}

          {/* Left edge fade */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 left-0 z-20 w-24"
            style={{
              background: 'linear-gradient(to right, var(--color-background), transparent)',
            }}
          />
          {/* Right edge fade */}
          <div
            className="pointer-events-none absolute top-0 right-0 bottom-0 z-20 w-24"
            style={{
              background: 'linear-gradient(to left, var(--color-background), transparent)',
            }}
          />

          {/* Center card — focused, 4:3 aspect ratio */}
          <GlowBorder className="relative z-10 w-[500px]">
            <motion.div
              className="relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
              style={{ height: 375 }}
              initial={{ opacity: 0, y: 12 }}
              {...inViewProps(onMount, { opacity: 1, y: 0 })}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              {/* Template header */}
              <div className="border-b border-border/60 px-5 py-4">
                <p className="text-[14px] font-semibold tracking-tight text-foreground">
                  Scale-Up SaaS
                </p>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  3 entity types &middot; 13 attributes &middot; 7 relationships
                </p>
              </div>

              {/* Entity types */}
              <div className="relative">
                {ENTITIES.map((entity, i) => (
                  <EntityTypeSection
                    key={entity.name}
                    entity={entity}
                    delay={0.15 + i * 0.18}
                    onMount={onMount}
                  />
                ))}

                {/* Bottom fade — scrollable illusion */}
                <div
                  className="pointer-events-none absolute right-0 bottom-0 left-0 h-20"
                  style={{
                    background: 'linear-gradient(to bottom, transparent, var(--color-card) 90%)',
                  }}
                />
              </div>

              {/* Decorative scrollbar */}
              <motion.div
                className="absolute top-[60px] right-[6px] bottom-[8px] w-[4px] rounded-full bg-border/20"
                initial={{ opacity: 0 }}
                {...inViewProps(onMount, { opacity: 1 })}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                {/* Scroll thumb — positioned ~40% down to show partial scroll */}
                <motion.div
                  className="absolute top-0 left-0 w-full rounded-full bg-muted-foreground/25"
                  style={{ height: '35%' }}
                  initial={{ opacity: 0 }}
                  {...inViewProps(onMount, { opacity: 1 })}
                  transition={{ duration: 0.3, delay: 0.4 }}
                />
              </motion.div>
            </motion.div>
          </GlowBorder>
        </div>
      </div>
    </div>
  );
};
