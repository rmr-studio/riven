import { OkButton } from '@/components/feature-modules/waitlist/components/ok-button';
import { Textarea } from '@/components/ui/textarea';
import type { WaitlistMultiStepFormData } from '@/lib/validations';
import type { UseFormReturn } from 'react-hook-form';

const STEP_CONFIG = {
  title: "What's your biggest operational headache right now?",
  placeholder: 'e.g. "I spend 2 hours a day switching between tools to find what I need..."',
};

export function OperationalHeadacheStep({
  form,
  onNext,
}: {
  form: UseFormReturn<WaitlistMultiStepFormData>;
  onNext: () => void;
}) {
  const { register } = form;

  return (
    <div className="py-8">
      <div className="flex items-start gap-3">
        <h3 className="text-xl leading-snug font-medium md:text-2xl">
          {STEP_CONFIG.title}
          <span className="ml-2 inline-block rounded-full bg-foreground/8 px-2.5 py-0.5 align-middle text-xs font-normal text-muted-foreground">
            Optional
          </span>
        </h3>
      </div>
      <div className="mt-8">
        <Textarea
          {...register('operationalHeadache')}
          placeholder={STEP_CONFIG.placeholder}
          rows={3}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onNext();
            }
          }}
          className="field-sizing-fixed h-24 resize-none overflow-y-auto"
        />
      </div>
      <div className="mt-8 flex items-center justify-end">
        <OkButton onClick={onNext} />
      </div>
    </div>
  );
}
