'use client';

import { Skeleton } from '@/components/ui/skeleton';

export const WorkspacePreview: React.FC = () => {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
        Workspace
      </p>
      <div className="bg-card flex flex-col gap-5 rounded-xl p-8 shadow-sm">
        {/* Header: logo + name */}
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2.5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        {/* Description */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        {/* Stat blocks */}
        <div className="flex gap-3">
          <Skeleton className="h-14 flex-1 rounded-lg" />
          <Skeleton className="h-14 flex-1 rounded-lg" />
          <Skeleton className="h-14 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
