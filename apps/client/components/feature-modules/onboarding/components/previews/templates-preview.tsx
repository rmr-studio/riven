'use client';

import { Skeleton } from '@/components/ui/skeleton';

export const TemplatesPreview: React.FC = () => {
  return (
    <div className="flex w-80 flex-col gap-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
        Templates
      </p>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card flex flex-col gap-3 rounded-xl p-4 shadow-sm">
            <Skeleton className="size-8 rounded-md" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
