import { INPUT_CLASS, INPUT_ERROR_CLASS } from '@/components/feature-modules/waitlist/config/steps';
import { OkButton } from '@/components/feature-modules/waitlist/components/ok-button';
import { cn } from '@/lib/utils';
import type { WaitlistMultiStepFormData } from '@/lib/validations';
import { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';

const STEP_CONFIG = {
  title: "Let's get to know you",
  nameLabel: 'Your name',
  namePlaceholder: 'Jane Doe',
  emailLabel: 'Your email',
  emailPlaceholder: 'jane@company.com',
};

export function ContactStep({
  form,
  onJoin,
  isPending,
}: {
  form: UseFormReturn<WaitlistMultiStepFormData>;
  onJoin: () => void;
  isPending: boolean;
}) {
  const { register, formState } = form;
  const emailRef = useRef<HTMLInputElement | null>(null);
  const { ref: emailRegRef, ...emailRest } = register('email');

  return (
    <div className="py-8">
      <h3 className="text-center text-2xl font-medium md:text-3xl">{STEP_CONFIG.title}</h3>
      <div className="mx-auto mt-8 max-w-md space-y-6">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            {STEP_CONFIG.nameLabel}
          </label>
          <input
            {...register('name')}
            placeholder={STEP_CONFIG.namePlaceholder}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                emailRef.current?.focus();
              }
            }}
            className={cn(INPUT_CLASS, formState.errors.name && INPUT_ERROR_CLASS)}
          />
          {formState.errors.name && (
            <p className="mt-1.5 text-xs text-destructive">{formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            {STEP_CONFIG.emailLabel}
          </label>
          <input
            {...emailRest}
            ref={(el) => {
              emailRegRef(el);
              emailRef.current = el;
            }}
            type="email"
            placeholder={STEP_CONFIG.emailPlaceholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onJoin();
              }
            }}
            className={cn(INPUT_CLASS, formState.errors.email && INPUT_ERROR_CLASS)}
          />
          {formState.errors.email && (
            <p className="mt-1.5 text-xs text-destructive">
              {formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="mt-8 flex items-center justify-end">
          <OkButton onClick={onJoin} label="Join the Waitlist" loading={isPending} />
        </div>
      </div>
    </div>
  );
}
