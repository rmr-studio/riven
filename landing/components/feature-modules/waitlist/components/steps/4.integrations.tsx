import { FORM_COPY } from '@/components/feature-modules/waitlist/config/form-copy';
import { EnterHint } from '@/components/feature-modules/waitlist/components/enter-hint';
import { OkButton } from '@/components/feature-modules/waitlist/components/ok-button';
import { OptionPill } from '@/components/feature-modules/waitlist/components/option-pill';
import { StepBadge } from '@/components/feature-modules/waitlist/components/step-badge';
import { motion } from 'motion/react';

export function IntegrationsStep({
  selectedIntegrations,
  onToggle,
  onNext,
  error,
}: {
  selectedIntegrations: string[];
  onToggle: (label: string) => void;
  onNext: () => void;
  error?: string;
}) {
  return (
    <div className="py-8">
      <div className="flex items-start gap-3">
        <StepBadge number={FORM_COPY.integrations.stepNumber} />
        <h3 className="text-xl leading-snug font-medium md:text-2xl">
          {FORM_COPY.integrations.title}
          {FORM_COPY.integrations.subtitle && (
            <>
              <br />
              <span className="text-lg text-muted-foreground md:text-xl">
                {FORM_COPY.integrations.subtitle}
              </span>
            </>
          )}
          {FORM_COPY.integrations.required && (
            <span className="ml-1 text-destructive">*</span>
          )}
        </h3>
      </div>
      <p className="mt-6 ml-10 text-sm text-muted-foreground">
        {FORM_COPY.integrations.instruction}
      </p>
      <div className="mt-4 ml-10 space-y-2.5">
        {FORM_COPY.integrations.options.map((option, i) => (
          <motion.div
            key={option.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.08 + i * 0.03,
              duration: 0.25,
            }}
          >
            <OptionPill
              letterKey={option.key}
              label={option.label}
              selected={selectedIntegrations.includes(option.label)}
              onClick={() => onToggle(option.label)}
            />
          </motion.div>
        ))}
      </div>
      {error && (
        <p className="mt-3 ml-10 text-xs text-destructive">{error}</p>
      )}
      <div className="mt-6 ml-10 flex items-center">
        <OkButton onClick={onNext} disabled={selectedIntegrations.length === 0} />
        <EnterHint />
      </div>
    </div>
  );
}
