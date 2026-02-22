import { OkButton } from '@/components/feature-modules/waitlist/components/ok-button';
import { OptionPill } from '@/components/feature-modules/waitlist/components/option-pill';
import { motion } from 'motion/react';

export const INVOLVEMENT_STEP_CONFIG = {
  title: 'Want to help shape what we build?',
  subtitle:
    'We are looking for a small group of founding users to provide feedback and help us build the right product. Join a 20-minute call with the founding team, share your needs and feedback, and get early access to the product as soon as it is ready.',
  instruction: 'Choose 1',
  options: [
    { key: 'A', value: 'WAITLIST' as const, label: 'Just the waitlist' },
    { key: 'B', value: 'EARLY_TESTING' as const, label: 'Early testing access' },
    {
      key: 'C',
      value: 'CALL_EARLY_TESTING' as const,
      label: 'Early access + a 20-min call with the team',
    },
  ],
};

export function InvolvementStep({
  selectedInvolvement,
  onSelect,
  onSubmit,
  isPending,
  error,
}: {
  selectedInvolvement: string | undefined;
  onSelect: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  error?: string;
}) {
  return (
    <div className="py-8">
      <div className="flex items-start gap-3">
        <div>
          <h3 className="text-xl leading-snug font-medium md:text-2xl">
            {INVOLVEMENT_STEP_CONFIG.title}
            <span className="text-destructive">*</span>
          </h3>
          <p className="mt-1 text-lg text-muted-foreground md:text-xl">
            {INVOLVEMENT_STEP_CONFIG.subtitle}
          </p>
        </div>
      </div>
      <p className="mt-6 ml-10 text-sm text-muted-foreground">
        {INVOLVEMENT_STEP_CONFIG.instruction}
      </p>
      <div className="mt-4 ml-10 space-y-2.5">
        {INVOLVEMENT_STEP_CONFIG.options.map((option, i) => (
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
              selected={selectedInvolvement === option.value}
              onClick={() => onSelect(option.value)}
            />
          </motion.div>
        ))}
      </div>
      {error && <p className="mt-3 ml-10 text-xs text-destructive">{error}</p>}
      <div className="mt-6 ml-10 flex items-center justify-end">
        <OkButton
          onClick={onSubmit}
          disabled={!selectedInvolvement}
          loading={isPending}
          label="Join the waitlist"
        />
      </div>
    </div>
  );
}
