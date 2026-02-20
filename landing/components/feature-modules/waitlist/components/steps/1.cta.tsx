import { Button } from '@/components/ui/button';
import { FORM_COPY } from '@/components/feature-modules/waitlist/config/form-copy';
import { ArrowRight } from 'lucide-react';

export function CtaStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="py-16 text-center md:py-24">
      <h2 className="text-4xl leading-[1.1] font-semibold tracking-tight md:text-5xl lg:text-6xl">
        {FORM_COPY.cta.headline}
      </h2>
      <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
        {FORM_COPY.cta.description}
      </p>
      <Button size="lg" onClick={onStart} className="mt-10 gap-2 px-8 text-base">
        {FORM_COPY.cta.buttonText}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
