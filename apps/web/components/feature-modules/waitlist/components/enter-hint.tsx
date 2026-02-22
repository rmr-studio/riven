export function EnterHint() {
  return (
    <span className="ml-3 hidden items-center text-xs text-muted-foreground sm:inline-flex">
      press{' '}
      <kbd className="mx-1 rounded bg-foreground/8 px-1.5 py-0.5 font-mono text-[10px] font-medium">
        Enter &crarr;
      </kbd>
    </span>
  );
}
