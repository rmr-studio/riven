import { cn } from '@/lib/utils';

interface SectionDividerProps {
  name: string;
  inverse?: boolean;
  className?: string;
}

export function SectionDivider({ name, inverse, className }: SectionDividerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <div
        className={cn(
          'h-px w-full max-w-1/4',
          inverse ? 'bg-primary-foreground/70' : 'bg-primary/70',
        )}
      />
      <span
        className={cn(
          'shrink-0 rounded-full border px-5 py-2 text-sm font-medium tracking-wider uppercase',
          inverse
            ? 'border-primary-foreground/80 text-primary-foreground'
            : 'border-primary/80 text-primary',
        )}
      >
        {name}
      </span>
      <div
        className={cn(
          'h-px w-full max-w-1/4',
          inverse ? 'bg-primary-foreground/70' : 'bg-primary/70',
        )}
      />
    </div>
  );
}
