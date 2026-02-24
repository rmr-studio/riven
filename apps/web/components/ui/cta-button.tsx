import { Button } from '@/components/ui/button';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { FC } from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'default';
}

const sizeStyles = {
  sm: 'h-7 gap-1 px-2.5 py-0.5 text-xs md:h-8 md:gap-1.5 md:px-3 md:text-xs',
  default: 'h-9 gap-1.5 px-4 py-1 text-sm md:h-10 md:gap-2 md:px-5 md:text-sm',
};

const iconSizes = {
  sm: 'h-3.5 w-3.5 md:h-4 md:w-4',
  default: 'h-4 w-4 md:h-5 md:w-5',
};

export const CtaButton: FC<Props> = ({ children, className, size = 'default' }) => {
  return (
    <HoverBorderGradient className="overflow-hidden bg-background p-0" as="div">
      <Button
        size="sm"
        className={cn(
          'cursor-pointer items-center border-0 bg-muted/50 font-mono tracking-wide text-muted-foreground outline-0 hover:bg-muted hover:text-foreground',
          sizeStyles[size],
          className,
        )}
      >
        {children}
        <ChevronRight className={cn('transition-transform group-hover:translate-x-0.5', iconSizes[size])} />
      </Button>
    </HoverBorderGradient>
  );
};
