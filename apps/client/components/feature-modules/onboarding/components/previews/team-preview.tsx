'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { WorkspaceRoles } from '@/lib/types/models/WorkspaceRoles';
import { cn } from '@/lib/util/utils';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useOnboardStore } from '../../hooks/use-onboard-store';
import { getPaletteColor } from '../../utils/avatar-helpers';
import { INVITE_SOFT_CAP } from '../forms/team-step-form';

interface TeamLiveData {
  invites: Array<{ email: string; role: WorkspaceRoles }>;
}

const fadeProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: 'easeInOut' as const },
};

const MIN_ROWS = 4;

export const TeamPreview: React.FC = () => {
  const liveTeam = useOnboardStore((s) => s.liveData['team'] as TeamLiveData | undefined);
  const invites = liveTeam?.invites ?? [];

  const totalRows = Math.min(Math.max(invites.length, MIN_ROWS), INVITE_SOFT_CAP);
  const skeletonCount = totalRows - invites.length;

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
        Team
      </p>
      <div className="bg-card flex flex-col gap-4 rounded-xl p-8 shadow-sm">
        {/* Live invite rows */}
        {invites.map((invite) => {
          const initial = invite.email[0]?.toUpperCase() ?? '?';
          const colorClass = getPaletteColor(invite.email);
          const isAdmin = invite.role === WorkspaceRoles.Admin;

          return (
            <AnimatePresence key={`invite-${invite.email}`} mode="wait">
              <motion.div {...fadeProps} className="flex items-center gap-4">
                {/* Initials circle */}
                <div
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white',
                    colorClass,
                  )}
                >
                  {initial}
                </div>

                {/* Email */}
                <span className="flex-1 truncate text-sm font-medium">{invite.email}</span>

                {/* Role badge */}
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs',
                    isAdmin
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </motion.div>
            </AnimatePresence>
          );
        })}

        {/* Skeleton rows for remaining slots */}
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <AnimatePresence key={`skeleton-${i}`} mode="wait">
            <motion.div {...fadeProps} className="flex items-center gap-4">
              <Skeleton className="size-11 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </motion.div>
          </AnimatePresence>
        ))}
      </div>
    </div>
  );
};
