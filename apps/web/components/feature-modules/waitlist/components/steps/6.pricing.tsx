import { OkButton } from '@/components/feature-modules/waitlist/components/ok-button';
import { OptionPill } from '@/components/feature-modules/waitlist/components/option-pill';
import { motion } from 'motion/react';

export const PRICING_STEP_CONFIG = {
  title: 'What would you expect to pay monthly for a platform like this?',
  instruction: 'Choose 1',
  options: [
    { key: 'A', label: 'Under $50/mo' },
    { key: 'B', label: '$50 - $150/mo' },
    { key: 'C', label: '$150 - $300/mo' },
    { key: 'D', label: '$300+/mo' },
  ],
};

export function PricingStep({
  selectedPrice,
  onSelect,
  onNext,
  error,
}: {
  selectedPrice: string;
  onSelect: (label: string) => void;
  onNext: () => void;
  error?: string;
}) {
  return (
    <div className="py-8">
      <div className="flex items-start gap-3">
        <h3 className="text-xl leading-snug font-medium md:text-2xl">
          {PRICING_STEP_CONFIG.title}
          <span className="text-destructive">*</span>
        </h3>
      </div>
      <p className="mt-6 ml-10 text-sm text-muted-foreground">{PRICING_STEP_CONFIG.instruction}</p>
      <div className="mt-4 ml-10 space-y-2.5">
        {PRICING_STEP_CONFIG.options.map((option, i) => (
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
              selected={selectedPrice === option.label}
              onClick={() => onSelect(option.label)}
            />
          </motion.div>
        ))}
      </div>
      {error && <p className="mt-3 ml-10 text-xs text-destructive">{error}</p>}
      <div className="mt-6 ml-10 flex items-center justify-end">
        <OkButton onClick={onNext} disabled={!selectedPrice} />
      </div>
    </div>
  );
}
