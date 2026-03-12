'use client';

import { Skeleton } from '@/components/ui/skeleton';

export const TeamPreview: React.FC = () => {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
        Team
      </p>
      <div className="bg-card flex flex-col gap-4 rounded-xl p-8 shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-11 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
