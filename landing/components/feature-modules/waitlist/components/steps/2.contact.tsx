import { FORM_COPY } from '@/components/feature-modules/waitlist/config/form-copy';
import { INPUT_CLASS, INPUT_ERROR_CLASS } from '@/components/feature-modules/waitlist/config/steps';
import { EnterHint } from '@/components/feature-modules/waitlist/components/enter-hint';
import { OkButton } from '@/components/feature-modules/waitlist/components/ok-button';
import { cn } from '@/lib/utils';
import type { WaitlistMultiStepFormData } from '@/lib/validations';
import type { UseFormReturn } from 'react-hook-form';

export function ContactStep({
  form,
  onNext,
}: {
  form: UseFormReturn<WaitlistMultiStepFormData>;
  onNext: () => void;
}) {
  const { register, formState } = form;

  return (
    <div className="py-8">
      <h3 className="text-2xl font-medium md:text-3xl">{FORM_COPY.contact.title}</h3>
      <div className="mt-8 max-w-md space-y-6">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            {FORM_COPY.contact.nameLabel}
          </label>
          <input
            {...register('name')}
            placeholder={FORM_COPY.contact.namePlaceholder}
            autoFocus
            className={cn(INPUT_CLASS, formState.errors.name && INPUT_ERROR_CLASS)}
          />
          {formState.errors.name && (
            <p className="mt-1.5 text-xs text-destructive">{formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            {FORM_COPY.contact.emailLabel}
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder={FORM_COPY.contact.emailPlaceholder}
            className={cn(INPUT_CLASS, formState.errors.email && INPUT_ERROR_CLASS)}
          />
          {formState.errors.email && (
            <p className="mt-1.5 text-xs text-destructive">
              {formState.errors.email.message}
            </p>
          )}
        </div>
      </div>
      <div className="mt-8 flex items-center">
        <OkButton onClick={onNext} />
        <EnterHint />
      </div>
    </div>
  );
}
