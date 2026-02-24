import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

export function OptionPill({
  letterKey,
  label,
  selected,
  onClick,
}: {
  letterKey: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left backdrop-blur-md transition-all duration-200',
        selected
          ? 'border-foreground/25 bg-foreground/10'
          : 'border-foreground/10 bg-foreground/[0.03] hover:border-foreground/15 hover:bg-foreground/[0.07]',
      )}
      whileTap={{ scale: 0.98 }}
    >
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold transition-colors',
          selected
            ? 'bg-foreground/20 text-foreground'
            : 'bg-foreground/8 text-muted-foreground group-hover:bg-foreground/12',
        )}
      >
        {letterKey}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {selected && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
          <Check className="h-3.5 w-3.5 text-foreground/60" />
        </motion.span>
      )}
    </motion.button>
  );
}
