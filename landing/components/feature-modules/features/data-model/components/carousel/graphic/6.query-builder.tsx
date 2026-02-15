'use client';

import { GlowBorder } from '@/components/ui/glow-border';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  DollarSign,
  File,
  HeartHandshake,
  Layers,
  ListFilter,
  PawPrint,
  SquareUser,
  UserPen,
} from 'lucide-react';
import { motion } from 'motion/react';

const planStyles = {
  Pro: 'bg-[#F9B7B7] border-[#E6A7A7]',
  Enterprise: 'bg-[#A0D0AC] border-[#93C19E]',
} as const;

const revenueStyles = {
  '10k - 20k': 'bg-[#EB9393] border-[#D48484]',
  '5k - 10k': 'bg-[#AEA7E0] border-[#A099CF]',
  '3k - 5k': 'bg-[#F882E8] border-[#DD6FCE]',
  '20k - 50k': 'bg-[#9ADA6A] border-[#82BA58]',
} as const;

interface AccountRow {
  name: string;
  plan: keyof typeof planStyles;
  revenue: keyof typeof revenueStyles;
  interactions: string[];
  more?: number;
}

const accounts: AccountRow[] = [
  {
    name: 'Scalegrid AI',
    plan: 'Enterprise',
    revenue: '5k - 10k',
    interactions: [
      'Billing charged twice on plan upgrade',
      'Q3 contract renewal',
      'Data export returning empty CSV',
    ],
    more: 5,
  },
  {
    name: 'Vaultstack',
    plan: 'Enterprise',
    revenue: '5k - 10k',
    interactions: ['Production integration dropping events'],
  },
  {
    name: 'ScaleGrid AI',
    plan: 'Pro',
    revenue: '3k - 5k',
    interactions: ['Account locked out', 'Add Xero as a native integration'],
    more: 2,
  },
  {
    name: 'Brightspark',
    plan: 'Pro',
    revenue: '10k - 20k',
    interactions: ['API rate limiting causing failed syncs'],
  },
  {
    name: 'Kinetic Cloud',
    plan: 'Enterprise',
    revenue: '5k - 10k',
    interactions: [
      'Webhook delivery failing silently',
      'Technical deep-dive: API integrations',
      'Request to change billing contact email',
    ],
  },
  {
    name: 'Apeture Digital',
    plan: 'Enterprise',
    revenue: '10k - 20k',
    interactions: ['Accidentally removed 1,200 entity records'],
  },
  {
    name: 'Meridian Labs',
    plan: 'Pro',
    revenue: '3k - 5k',
    interactions: ['Scheduled workflow automations stopped firing'],
  },
  {
    name: 'Datapulse',
    plan: 'Enterprise',
    revenue: '20k - 50k',
    interactions: [
      'Data sync from Stripe 6 hours behind',
      'Querying across tools is a game-changer',
      'Onboarding kickoff — DataPulse team',
    ],
  },
];

const FilterChip = ({
  icon: Icon,
  children,
  hasChevron,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  hasChevron?: boolean;
}) => (
  <div className="flex h-[22px] items-center gap-1 rounded border border-border bg-card px-1.5 shadow-sm">
    {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
    <span className="text-[11px] whitespace-nowrap text-muted-foreground">{children}</span>
    {hasChevron && <ChevronDown className="h-2 w-2 shrink-0 text-border" />}
  </div>
);

const Pill = ({
  children,
  colorClass,
  large,
}: {
  children: React.ReactNode;
  colorClass: string;
  large?: boolean;
}) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center rounded border font-medium whitespace-nowrap text-white',
      large ? 'px-1.5 py-0.5 text-[10px]' : 'px-1 py-px text-[8px]',
      colorClass,
    )}
  >
    {children}
  </span>
);

const TableRow = ({
  account,
  featured,
  delay,
}: {
  account: AccountRow;
  featured?: boolean;
  delay: number;
}) => (
  <motion.div
    className="flex border-b border-border last:border-b-0"
    initial={{ opacity: 0, x: -6 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.25, delay }}
  >
    {/* Checkbox + Account Name */}
    <div className="flex w-[120px] shrink-0 items-start gap-1 border-r border-border px-1.5 py-1.5">
      <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border border-border bg-card shadow-sm" />
      <span className="whitespace-nowrap text-[10px] font-bold tracking-tight text-foreground underline">
        {account.name}
      </span>
    </div>

    {/* Plan */}
    <div className="flex w-[80px] shrink-0 items-start border-r border-border px-1 py-1.5">
      <Pill colorClass={planStyles[account.plan]} large={featured}>
        {account.plan}
      </Pill>
    </div>

    {/* Revenue */}
    <div className="flex w-[70px] shrink-0 items-start border-r border-border px-1 py-1.5">
      <Pill colorClass={revenueStyles[account.revenue]} large={featured}>
        {account.revenue}
      </Pill>
    </div>

    {/* Interactions */}
    <div className="flex-1 space-y-px px-1.5 py-1.5">
      {account.interactions.map((text, j) => (
        <div key={j} className="flex items-start gap-1">
          <HeartHandshake className="mt-px h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="whitespace-nowrap text-[10px] leading-tight tracking-tight text-foreground underline">
            {text}
          </span>
        </div>
      ))}
      {account.more && (
        <span className="text-[8px] tracking-tight text-muted-foreground underline">
          + {account.more} more
        </span>
      )}
    </div>
  </motion.div>
);

export const QueryBuilderGraphic = ({ className }: { className?: string }) => {
  return (
    <div className={cn('pointer-events-none relative', className)}>
      {/* Query Builder - front, left */}
      <GlowBorder className="relative z-10 w-[480px]">
        <motion.div
          className="w-full rounded-2xl border border-border bg-card p-4 shadow-lg"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          {/* Type selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Type</span>
            <div className="flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1 shadow-sm">
              <SquareUser className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Account</span>
            </div>
          </div>

          {/* Filter area */}
          <div className="mt-3 rounded-lg bg-muted p-3">
            {/* Row 1: Plan is Pro or Enterprise */}
            <div className="flex items-center gap-1.5">
              <FilterChip icon={File} hasChevron>
                Plan
              </FilterChip>
              <FilterChip hasChevron>is</FilterChip>
              <FilterChip icon={Layers} hasChevron>
                Pro
              </FilterChip>
              <FilterChip>or</FilterChip>
              <FilterChip icon={Layers} hasChevron>
                Enterprise
              </FilterChip>
            </div>

            {/* Row 2: MRR > $3,000.00 */}
            <div className="mt-2 flex items-center gap-1.5">
              <FilterChip icon={DollarSign} hasChevron>
                MRR
              </FilterChip>
              <FilterChip hasChevron>&gt;</FilterChip>
              <FilterChip>$3,000.00</FilterChip>
            </div>

            {/* Row 3: Interactions → Support Tickets is Critical */}
            <div className="mt-2 flex items-center gap-1.5">
              <FilterChip icon={UserPen} hasChevron>
                Interactions
              </FilterChip>
              <FilterChip icon={HeartHandshake} hasChevron>
                Support Tickets
              </FilterChip>
              <FilterChip hasChevron>is</FilterChip>
              <FilterChip icon={PawPrint} hasChevron>
                Critical
              </FilterChip>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 rounded border border-border bg-card px-2 py-1 shadow-sm">
              <ListFilter className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Add Condition</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Remove All</span>
          </div>
        </motion.div>
      </GlowBorder>

      {/* Results Table - behind, right, overlapping */}
      <GlowBorder className="-mt-[140px] ml-[170px] w-[560px]">
        <motion.div
          className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {/* Table Header */}
          <div className="flex border-b border-border">
            <div className="w-[120px] shrink-0 border-r border-border px-1.5 py-1.5" />
            <div className="w-[80px] shrink-0 border-r border-border px-1 py-1.5" />
            <div className="w-[70px] shrink-0 border-r border-border px-1 py-1.5" />
            <div className="flex-1 px-1.5 py-1.5">
              <span className="text-[11px] font-bold tracking-tight text-foreground">
                Interactions
              </span>
            </div>
          </div>

          {/* Data Rows */}
          {accounts.map((account, i) => (
            <TableRow key={i} account={account} featured={i === 0} delay={0.2 + i * 0.05} />
          ))}
        </motion.div>
      </GlowBorder>
    </div>
  );
};
