import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

export function OkButton({
  onClick,
  disabled,
  loading,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          OK
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </>
      )}
    </button>
  );
}
