'use client';

import { Skeleton } from '@/components/ui/skeleton';

export const ProfilePreview: React.FC = () => {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
        Profile
      </p>
      <div className="bg-card flex flex-col gap-5 rounded-xl p-8 shadow-sm">
        {/* Avatar + name row */}
        <div className="flex items-center gap-5">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex flex-1 flex-col gap-2.5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        {/* Bio lines */}
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        {/* Contact info */}
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      </div>
    </div>
  );
};
