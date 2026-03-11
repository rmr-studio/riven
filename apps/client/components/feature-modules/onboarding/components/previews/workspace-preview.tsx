'use client';

import { Skeleton } from '@/components/ui/skeleton';

export const WorkspacePreview: React.FC = () => {
  return (
    <div className="flex w-80 flex-col gap-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
        Workspace
      </p>
      <div className="bg-card flex flex-col gap-4 rounded-xl p-6 shadow-sm">
        {/* Header: logo + name */}
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        {/* Stat blocks */}
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
        </div>
      </div>
    </div>
  );
};
