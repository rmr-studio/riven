import { FORM_COPY } from '@/components/feature-modules/waitlist/config/form-copy';
import { INPUT_CLASS, INPUT_ERROR_CLASS } from '@/components/feature-modules/waitlist/config/steps';
import { EnterHint } from '@/components/feature-modules/waitlist/components/enter-hint';
import { OkButton } from '@/components/feature-modules/waitlist/components/ok-button';
import { StepBadge } from '@/components/feature-modules/waitlist/components/step-badge';
import { cn } from '@/lib/utils';
import type { WaitlistMultiStepFormData } from '@/lib/validations';
import type { UseFormReturn } from 'react-hook-form';

export function PricingStep({
  form,
  onNext,
  isPending,
}: {
  form: UseFormReturn<WaitlistMultiStepFormData>;
  onNext: () => void;
  isPending: boolean;
}) {
  const { register, formState } = form;

  return (
    <div className="py-8">
      <div className="flex items-start gap-3">
        <StepBadge number={FORM_COPY.pricing.stepNumber} />
        <h3 className="text-xl leading-snug font-medium md:text-2xl">
          {FORM_COPY.pricing.title}
          {FORM_COPY.pricing.required && <span className="text-destructive">*</span>}
        </h3>
      </div>
      <div className="mt-8 ml-10 max-w-md">
        <input
          {...register('monthlyPrice')}
          placeholder={FORM_COPY.pricing.placeholder}
          autoFocus
          className={cn(INPUT_CLASS, formState.errors.monthlyPrice && INPUT_ERROR_CLASS)}
        />
        {formState.errors.monthlyPrice && (
          <p className="mt-1.5 text-xs text-destructive">
            {formState.errors.monthlyPrice.message}
          </p>
        )}
      </div>
      <div className="mt-8 ml-10 flex items-center">
        <OkButton onClick={onNext} loading={isPending} />
        <EnterHint />
      </div>
    </div>
  );
}
