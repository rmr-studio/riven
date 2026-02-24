import { Button } from '@/components/ui/button';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { ChevronRight } from 'lucide-react';

export function CtaButton({ children }: { children: React.ReactNode }) {
  return (
    <HoverBorderGradient className="overflow-hidden bg-background p-0" as="div">
      <Button
        size="sm"
        className="h-7 cursor-pointer items-center gap-1 border-0 bg-muted/50 px-2.5 py-0.5 font-mono text-xs tracking-wide text-muted-foreground outline-0 hover:bg-muted hover:text-foreground md:h-8 md:gap-1.5 md:px-3 md:text-xs"
      >
        {children}
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 md:h-4 md:w-4" />
      </Button>
    </HoverBorderGradient>
  );
}
