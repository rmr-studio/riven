'use client';

import { Skeleton } from '@/components/ui/skeleton';

export const ProfilePreview: React.FC = () => {
  return (
    <div className="flex w-80 flex-col gap-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
        Profile
      </p>
      <div className="bg-card flex flex-col gap-4 rounded-xl p-6 shadow-sm">
        {/* Avatar + name row */}
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {/* Bio lines */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  );
};
