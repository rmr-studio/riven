import { OkButton } from '@/components/feature-modules/waitlist/components/ok-button';
import { OptionPill } from '@/components/feature-modules/waitlist/components/option-pill';
import { motion } from 'motion/react';

interface Option {
  key: string;
  label: string;
  value?: string;
}

interface OptionSelectionStepProps {
  title: string;
  subtitle?: string;
  instruction: string;
  options: readonly Option[];
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string;
}

export function OptionSelectionStep({
  title,
  subtitle,
  instruction,
  options,
  selectedValue,
  onSelect,
  onSubmit,
  submitLabel,
  isSubmitting,
  error,
}: OptionSelectionStepProps) {
  return (
    <div className="py-8">
      <div className="flex items-start gap-3">
        <div>
          <h3 className="text-xl leading-snug font-medium md:text-2xl">
            {title}
            <span className="text-destructive">*</span>
          </h3>
          {subtitle && (
            <p className="mt-1 text-lg text-muted-foreground md:text-xl">{subtitle}</p>
          )}
        </div>
      </div>
      <p className="mt-6 ml-10 text-sm text-muted-foreground">{instruction}</p>
      <div className="mt-4 ml-10 space-y-2.5">
        {options.map((option, i) => (
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
              selected={selectedValue === (option.value ?? option.label)}
              onClick={() => onSelect(option.value ?? option.label)}
            />
          </motion.div>
        ))}
      </div>
      {error && <p className="mt-3 ml-10 text-xs text-destructive">{error}</p>}
      <div className="mt-6 ml-10 flex items-center justify-end">
        <OkButton
          onClick={onSubmit}
          disabled={!selectedValue}
          loading={isSubmitting}
          label={submitLabel}
        />
      </div>
    </div>
  );
}
