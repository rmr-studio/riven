'use client';

import { Button } from '@/components/ui/button';
import { useWaitlistMutation } from '@/hooks/use-waitlist-mutation';
import { cn } from '@/lib/utils';
import { waitlistFormSchema, type WaitlistMultiStepFormData } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

// ============================================================
// FORM CONFIGURATION
// Edit all copy, options, and labels here for easy changes.
// ============================================================

const FORM_COPY = {
  cta: {
    headline: 'Shape the Future of Communication',
    description: "Join the waitlist and help us build the workspace you've always wanted.",
    buttonText: 'Join the Waitlist',
  },
  contact: {
    title: "Let's get to know you",
    nameLabel: 'Your name',
    namePlaceholder: 'Jane Doe',
    emailLabel: 'Your email',
    emailPlaceholder: 'jane@company.com',
  },
  features: {
    stepNumber: 1,
    title: 'Which Riven Feature will you find most useful?',
    instruction: 'Choose 1',
    required: true,
    options: [
      { key: 'A', label: 'Multi-Channel Inbox' },
      { key: 'B', label: 'Universal Search' },
      { key: 'C', label: 'Prioritised Messaging' },
      { key: 'D', label: 'Daily Briefing' },
    ],
  },
  integrations: {
    stepNumber: 2,
    title: 'Where do your most important conversations live?',
    subtitle: 'Select your top 3 conversation channels',
    instruction: 'Choose 3',
    required: true,
    maxSelections: 3,
    options: [
      { key: 'A', label: 'Gmail' },
      { key: 'B', label: 'Slack' },
      { key: 'C', label: 'LinkedIn' },
      { key: 'D', label: 'Teams' },
      { key: 'E', label: 'Outlook' },
      { key: 'F', label: 'WhatsApp' },
      { key: 'G', label: 'Instagram' },
      { key: 'H', label: 'iMessage' },
    ],
  },
  pricing: {
    stepNumber: 3,
    title: 'If Riven saves you hours each week, what monthly price feels most reasonable to you?',
    placeholder: 'Type your answer here...',
    required: true,
  },
  earlyTesting: {
    stepNumber: 4,
    title: 'Would you like to be part of our early testing batch?',
    subtitle: 'Get exclusive first access and help shape the product',
    instruction: 'Choose 1',
    required: true,
    options: [
      { key: 'A', label: 'Yes, sign me up!' },
      { key: 'B', label: 'No thanks, just the waitlist' },
    ],
  },
  success: {
    title: "You're on the list!",
    description: "Thanks for your input. We'll keep you updated as we build Riven.",
  },
};

// ============================================================
// STEP DEFINITIONS
// ============================================================

enum Step {
  CTA = 0,
  CONTACT = 1,
  FEATURE = 2,
  INTEGRATIONS = 3,
  PRICE = 4,
  EARLY_TESTING = 5,
  SUCCESS = 6,
}

const TOTAL_FORM_STEPS = 5;

const STEP_FIELDS: Partial<Record<Step, (keyof WaitlistMultiStepFormData)[]>> = {
  [Step.CONTACT]: ['name', 'email'],
  [Step.FEATURE]: ['feature'],
  [Step.INTEGRATIONS]: ['integrations'],
  [Step.PRICE]: ['monthlyPrice'],
  [Step.EARLY_TESTING]: ['earlyTesting'],
};

// ============================================================
// ANIMATION
// ============================================================

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

const slideTransition = {
  type: 'tween' as const,
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StepBadge({ number }: { number: number }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/15 text-xs font-bold text-foreground">
      {number}
    </span>
  );
}

function OptionPill({
  letterKey,
  label,
  selected,
  onClick,
}: {
  letterKey: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full max-w-md cursor-pointer items-center gap-3 rounded-full border px-4 py-3 text-left transition-all duration-200',
        selected
          ? 'border-foreground/25 bg-foreground/10'
          : 'border-foreground/10 bg-foreground/[0.03] hover:border-foreground/15 hover:bg-foreground/[0.07]',
      )}
      whileTap={{ scale: 0.98 }}
    >
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
          selected
            ? 'bg-foreground/20 text-foreground'
            : 'bg-foreground/8 text-muted-foreground group-hover:bg-foreground/12',
        )}
      >
        {letterKey}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {selected && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
          <Check className="h-3.5 w-3.5 text-foreground/60" />
        </motion.span>
      )}
    </motion.button>
  );
}

function OkButton({
  onClick,
  disabled,
  loading,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          OK
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </>
      )}
    </button>
  );
}

function EnterHint() {
  return (
    <span className="ml-3 hidden items-center text-xs text-muted-foreground sm:inline-flex">
      press{' '}
      <kbd className="mx-1 rounded bg-foreground/8 px-1.5 py-0.5 font-mono text-[10px] font-medium">
        Enter &crarr;
      </kbd>
    </span>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function WaitlistForm({ className }: { className?: string }) {
  const [currentStep, setCurrentStep] = useState<Step>(Step.CTA);
  const [direction, setDirection] = useState(1);
  const { mutate, isPending } = useWaitlistMutation();

  const form = useForm<WaitlistMultiStepFormData>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues: {
      name: '',
      email: '',
      feature: '',
      integrations: [],
      monthlyPrice: '',
      earlyTesting: '',
    },
    mode: 'onTouched',
  });

  const { trigger, setValue, watch, handleSubmit, formState } = form;
  const selectedFeature = watch('feature');
  const selectedIntegrations = watch('integrations');
  const selectedEarlyTesting = watch('earlyTesting');

  // ── Navigation ──

  const goForward = useCallback(() => {
    setDirection(1);
    setCurrentStep((prev) => prev + 1);
  }, []);

  const goBack = useCallback(() => {
    if (currentStep <= Step.CTA) return;
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const handleNext = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep];
    if (fields) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    goForward();
  }, [currentStep, trigger, goForward]);

  const onSubmit = useCallback(
    (data: WaitlistMultiStepFormData) => {
      mutate(data, {
        onSuccess: () => {
          setDirection(1);
          setCurrentStep(Step.SUCCESS);
        },
      });
    },
    [mutate],
  );

  const handleOk = useCallback(async () => {
    if (currentStep === Step.SUCCESS) return;
    if (currentStep === Step.CTA) {
      goForward();
      return;
    }
    if (currentStep === Step.EARLY_TESTING) {
      const valid = await trigger(['earlyTesting']);
      if (!valid) return;
      handleSubmit(onSubmit)();
    } else {
      handleNext();
    }
  }, [currentStep, trigger, handleSubmit, onSubmit, handleNext, goForward]);

  // ── Selections ──

  const selectFeature = useCallback(
    (label: string) => {
      setValue('feature', label, { shouldValidate: true });
    },
    [setValue],
  );

  const selectEarlyTesting = useCallback(
    (label: string) => {
      setValue('earlyTesting', label, { shouldValidate: true });
    },
    [setValue],
  );

  const toggleIntegration = useCallback(
    (label: string) => {
      const current = form.getValues('integrations');
      const max = FORM_COPY.integrations.maxSelections;
      if (current.includes(label)) {
        setValue(
          'integrations',
          current.filter((i) => i !== label),
          { shouldValidate: true },
        );
      } else if (current.length < max) {
        setValue('integrations', [...current, label], {
          shouldValidate: true,
        });
      }
    },
    [form, setValue],
  );

  // ── Keyboard shortcuts ──

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPending) return;

      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'Enter') {
        e.preventDefault();
        handleOk();
        return;
      }

      // Letter shortcuts only on selection steps, not when typing
      if (isInput) return;

      const key = e.key.toUpperCase();
      if (currentStep === Step.FEATURE) {
        const option = FORM_COPY.features.options.find((o) => o.key === key);
        if (option) selectFeature(option.label);
      }
      if (currentStep === Step.INTEGRATIONS) {
        const option = FORM_COPY.integrations.options.find((o) => o.key === key);
        if (option) toggleIntegration(option.label);
      }
      if (currentStep === Step.EARLY_TESTING) {
        const option = FORM_COPY.earlyTesting.options.find((o) => o.key === key);
        if (option) selectEarlyTesting(option.label);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isPending, handleOk, selectFeature, toggleIntegration, selectEarlyTesting]);

  // ── Progress ──

  const formStepIndex = currentStep - 1;
  const progress =
    currentStep >= Step.CONTACT && currentStep <= Step.PRICE
      ? ((formStepIndex + 1) / TOTAL_FORM_STEPS) * 100
      : currentStep === Step.SUCCESS
        ? 100
        : 0;
  const showProgress = currentStep >= Step.CONTACT;

  // ── Step input class ──

  const inputClass =
    'w-full bg-transparent border-0 border-b border-foreground/20 pb-2 text-lg placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/50 transition-colors';
  const inputErrorClass = 'border-destructive focus:border-destructive';

  // ============================================================
  // RENDER
  // ============================================================

  const renderStep = () => {
    switch (currentStep) {
      // ── CTA ──
      case Step.CTA:
        return (
          <div className="py-16 text-center md:py-24">
            <h2 className="text-4xl leading-[1.1] font-semibold tracking-tight md:text-5xl lg:text-6xl">
              {FORM_COPY.cta.headline}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
              {FORM_COPY.cta.description}
            </p>
            <Button size="lg" onClick={goForward} className="mt-10 gap-2 px-8 text-base">
              {FORM_COPY.cta.buttonText}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        );

      // ── CONTACT ──
      case Step.CONTACT:
        return (
          <div className="py-8">
            <h3 className="text-2xl font-medium md:text-3xl">{FORM_COPY.contact.title}</h3>
            <div className="mt-8 max-w-md space-y-6">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  {FORM_COPY.contact.nameLabel}
                </label>
                <input
                  {...form.register('name')}
                  placeholder={FORM_COPY.contact.namePlaceholder}
                  autoFocus
                  className={cn(inputClass, formState.errors.name && inputErrorClass)}
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
                  {...form.register('email')}
                  type="email"
                  placeholder={FORM_COPY.contact.emailPlaceholder}
                  className={cn(inputClass, formState.errors.email && inputErrorClass)}
                />
                {formState.errors.email && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-8 flex items-center">
              <OkButton onClick={handleOk} />
              <EnterHint />
            </div>
          </div>
        );

      // ── FEATURE SELECTION ──
      case Step.FEATURE:
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
                    onClick={() => selectFeature(option.label)}
                  />
                </motion.div>
              ))}
            </div>
            {formState.errors.feature && (
              <p className="mt-3 ml-10 text-xs text-destructive">
                {formState.errors.feature.message}
              </p>
            )}
            <div className="mt-6 ml-10 flex items-center">
              <OkButton onClick={handleOk} disabled={!selectedFeature} />
              <EnterHint />
            </div>
          </div>
        );

      // ── INTEGRATIONS ──
      case Step.INTEGRATIONS:
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
                    onClick={() => toggleIntegration(option.label)}
                  />
                </motion.div>
              ))}
            </div>
            {formState.errors.integrations && (
              <p className="mt-3 ml-10 text-xs text-destructive">
                {formState.errors.integrations.message}
              </p>
            )}
            <div className="mt-6 ml-10 flex items-center">
              <OkButton onClick={handleOk} disabled={selectedIntegrations.length === 0} />
              <EnterHint />
            </div>
          </div>
        );

      // ── PRICING ──
      case Step.PRICE:
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
                {...form.register('monthlyPrice')}
                placeholder={FORM_COPY.pricing.placeholder}
                autoFocus
                className={cn(inputClass, formState.errors.monthlyPrice && inputErrorClass)}
              />
              {formState.errors.monthlyPrice && (
                <p className="mt-1.5 text-xs text-destructive">
                  {formState.errors.monthlyPrice.message}
                </p>
              )}
            </div>
            <div className="mt-8 ml-10 flex items-center">
              <OkButton onClick={handleOk} loading={isPending} />
              <EnterHint />
            </div>
          </div>
        );

      // ── EARLY TESTING ──
      case Step.EARLY_TESTING:
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
                    onClick={() => selectEarlyTesting(option.label)}
                  />
                </motion.div>
              ))}
            </div>
            {formState.errors.earlyTesting && (
              <p className="mt-3 ml-10 text-xs text-destructive">
                {formState.errors.earlyTesting.message}
              </p>
            )}
            <div className="mt-6 ml-10 flex items-center">
              <OkButton onClick={handleOk} disabled={!selectedEarlyTesting} loading={isPending} />
              <EnterHint />
            </div>
          </div>
        );

      // ── SUCCESS ──
      case Step.SUCCESS:
        return (
          <div className="py-16 text-center md:py-24">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
            >
              <CheckCircle2 className="mx-auto h-14 w-14 text-teal-500" />
            </motion.div>
            <h3 className="mt-6 text-2xl font-semibold md:text-3xl">{FORM_COPY.success.title}</h3>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              {FORM_COPY.success.description}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('mx-auto w-full max-w-2xl', className)}>
      {/* Progress bar */}
      <AnimatePresence>
        {showProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-8 h-0.5 overflow-hidden rounded-full bg-foreground/8"
          >
            <motion.div
              className="h-full rounded-full bg-teal-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      <AnimatePresence>
        {currentStep > Step.CTA && currentStep < Step.SUCCESS && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={goBack}
            className="mb-4 inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </motion.button>
        )}
      </AnimatePresence>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTransition}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
