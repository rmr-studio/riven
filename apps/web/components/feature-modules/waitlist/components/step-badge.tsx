export function StepBadge({ number }: { number: number }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/15 text-xs font-bold text-foreground">
      {number}
    </span>
  );
}
