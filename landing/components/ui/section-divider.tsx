import { cn } from '@/lib/utils';

interface SectionDividerProps {
  name: string;
  className?: string;
}

export function SectionDivider({ name, className }: SectionDividerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <div className="h-px w-full max-w-1/4 bg-primary/70" />
      <span className="shrink-0 rounded-full border border-primary/80 px-5 py-2 text-sm font-medium tracking-wider text-primary uppercase">
        {name}
      </span>
      <div className="h-px w-full max-w-1/4 bg-primary/70" />
    </div>
  );
}
