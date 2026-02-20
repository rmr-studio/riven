'use client';

import { CtaStep } from '@/components/feature-modules/waitlist/components/steps/1.cta';
import { ContactStep } from '@/components/feature-modules/waitlist/components/steps/2.contact';
import { FeatureStep } from '@/components/feature-modules/waitlist/components/steps/3.feature';
import { IntegrationsStep } from '@/components/feature-modules/waitlist/components/steps/4.integrations';
import { PricingStep } from '@/components/feature-modules/waitlist/components/steps/5.pricing';
import { EarlyTestingStep } from '@/components/feature-modules/waitlist/components/steps/6.early-testing';
import { SuccessStep } from '@/components/feature-modules/waitlist/components/steps/7.success';
import {
  slideTransition,
  slideVariants,
} from '@/components/feature-modules/waitlist/config/animation';
import { FORM_COPY } from '@/components/feature-modules/waitlist/config/form-copy';
import {
  Step,
  STEP_FIELDS,
  TOTAL_FORM_STEPS,
} from '@/components/feature-modules/waitlist/config/steps';
import { useWaitlistMutation } from '@/hooks/use-waitlist-mutation';
import { cn } from '@/lib/utils';
import { waitlistFormSchema, type WaitlistMultiStepFormData } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

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
    currentStep >= Step.CONTACT && currentStep <= Step.EARLY_TESTING
      ? ((formStepIndex + 1) / TOTAL_FORM_STEPS) * 100
      : currentStep === Step.SUCCESS
        ? 100
        : 0;
  const showProgress = currentStep >= Step.CONTACT;

  // ── Render steps ──

  const renderStep = () => {
    switch (currentStep) {
      case Step.CTA:
        return <CtaStep onStart={goForward} />;
      case Step.CONTACT:
        return <ContactStep form={form} onNext={handleOk} />;
      case Step.FEATURE:
        return (
          <FeatureStep
            selectedFeature={selectedFeature}
            onSelect={selectFeature}
            onNext={handleOk}
            error={formState.errors.feature?.message}
          />
        );
      case Step.INTEGRATIONS:
        return (
          <IntegrationsStep
            selectedIntegrations={selectedIntegrations}
            onToggle={toggleIntegration}
            onNext={handleOk}
            error={formState.errors.integrations?.message}
          />
        );
      case Step.PRICE:
        return <PricingStep form={form} onNext={handleOk} isPending={isPending} />;
      case Step.EARLY_TESTING:
        return (
          <EarlyTestingStep
            selectedEarlyTesting={selectedEarlyTesting}
            onSelect={selectEarlyTesting}
            onSubmit={handleOk}
            isPending={isPending}
            error={formState.errors.earlyTesting?.message}
          />
        );
      case Step.SUCCESS:
        return <SuccessStep />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('mx-auto w-full max-w-5xl', className)}>
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
