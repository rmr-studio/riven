'use client';

import { Skeleton } from '@/components/ui/skeleton';

export const TeamPreview: React.FC = () => {
  return (
    <div className="flex w-80 flex-col gap-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
        Team
      </p>
      <div className="bg-card flex flex-col gap-3 rounded-xl p-6 shadow-sm">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
