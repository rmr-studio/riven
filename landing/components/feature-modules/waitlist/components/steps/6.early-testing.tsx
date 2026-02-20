import { FORM_COPY } from '@/components/feature-modules/waitlist/config/form-copy';
import { EnterHint } from '@/components/feature-modules/waitlist/components/enter-hint';
import { OkButton } from '@/components/feature-modules/waitlist/components/ok-button';
import { OptionPill } from '@/components/feature-modules/waitlist/components/option-pill';
import { StepBadge } from '@/components/feature-modules/waitlist/components/step-badge';
import { motion } from 'motion/react';

export function EarlyTestingStep({
  selectedEarlyTesting,
  onSelect,
  onSubmit,
  isPending,
  error,
}: {
  selectedEarlyTesting: string;
  onSelect: (label: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  error?: string;
}) {
  return (
    <div className="py-8">
      <div className="flex items-start gap-3">
        <StepBadge number={FORM_COPY.earlyTesting.stepNumber} />
        <div>
          <h3 className="text-xl leading-snug font-medium md:text-2xl">
            {FORM_COPY.earlyTesting.title}
            {FORM_COPY.earlyTesting.required && <span className="text-destructive">*</span>}
          </h3>
          {FORM_COPY.earlyTesting.subtitle && (
            <p className="mt-1 text-lg text-muted-foreground md:text-xl">
              {FORM_COPY.earlyTesting.subtitle}
            </p>
          )}
        </div>
      </div>
      <p className="mt-6 ml-10 text-sm text-muted-foreground">
        {FORM_COPY.earlyTesting.instruction}
      </p>
      <div className="mt-4 ml-10 space-y-2.5">
        {FORM_COPY.earlyTesting.options.map((option, i) => (
          <motion.div
            key={option.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.08 + i * 0.04,
              duration: 0.25,
            }}
          >
            <OptionPill
              letterKey={option.key}
              label={option.label}
              selected={selectedEarlyTesting === option.label}
              onClick={() => onSelect(option.label)}
            />
          </motion.div>
        ))}
      </div>
      {error && (
        <p className="mt-3 ml-10 text-xs text-destructive">{error}</p>
      )}
      <div className="mt-6 ml-10 flex items-center">
        <OkButton onClick={onSubmit} disabled={!selectedEarlyTesting} loading={isPending} />
        <EnterHint />
      </div>
    </div>
  );
}
