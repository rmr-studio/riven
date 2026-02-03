import { cn } from "@/lib/utils";

interface SectionDividerProps {
  name: string;
  className?: string;
}

export function SectionDivider({ name, className }: SectionDividerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <div className="h-px w-full max-w-[200px] bg-border" />
      <span className="shrink-0 rounded-full border border-border px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {name}
      </span>
      <div className="h-px w-full max-w-[200px] bg-border" />
    </div>
  );
}
