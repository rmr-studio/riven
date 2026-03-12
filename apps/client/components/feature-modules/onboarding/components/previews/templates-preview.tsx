'use client';

import { Skeleton } from '@/components/ui/skeleton';

export const TemplatesPreview: React.FC = () => {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
        Templates
      </p>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card flex flex-col gap-4 rounded-xl p-5 shadow-sm">
            <Skeleton className="size-10 rounded-md" />
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <Skeleton className="h-3 w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
};
