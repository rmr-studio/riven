import { FORM_COPY } from '@/components/feature-modules/waitlist/config/form-copy';
import { EnterHint } from '@/components/feature-modules/waitlist/components/enter-hint';
import { OkButton } from '@/components/feature-modules/waitlist/components/ok-button';
import { OptionPill } from '@/components/feature-modules/waitlist/components/option-pill';
import { StepBadge } from '@/components/feature-modules/waitlist/components/step-badge';
import { motion } from 'motion/react';

export function FeatureStep({
  selectedFeature,
  onSelect,
  onNext,
  error,
}: {
  selectedFeature: string;
  onSelect: (label: string) => void;
  onNext: () => void;
  error?: string;
}) {
  return (
    <div className="py-8">
      <div className="flex items-start gap-3">
        <StepBadge number={FORM_COPY.features.stepNumber} />
        <h3 className="text-xl leading-snug font-medium md:text-2xl">
          {FORM_COPY.features.title}
          {FORM_COPY.features.required && <span className="text-destructive">*</span>}
        </h3>
      </div>
      <p className="mt-6 ml-10 text-sm text-muted-foreground">
        {FORM_COPY.features.instruction}
      </p>
      <div className="mt-4 ml-10 space-y-2.5">
        {FORM_COPY.features.options.map((option, i) => (
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
              selected={selectedFeature === option.label}
              onClick={() => onSelect(option.label)}
            />
          </motion.div>
        ))}
      </div>
      {error && (
        <p className="mt-3 ml-10 text-xs text-destructive">{error}</p>
      )}
      <div className="mt-6 ml-10 flex items-center">
        <OkButton onClick={onNext} disabled={!selectedFeature} />
        <EnterHint />
      </div>
    </div>
  );
}
