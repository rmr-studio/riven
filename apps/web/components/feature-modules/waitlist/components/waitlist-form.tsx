'use client';

import { CtaStep } from '@/components/feature-modules/waitlist/components/steps/1.cta';
import { ContactStep } from '@/components/feature-modules/waitlist/components/steps/2.contact';
import { BridgeStep } from '@/components/feature-modules/waitlist/components/steps/2b.bridge';
import { OperationalHeadacheStep } from '@/components/feature-modules/waitlist/components/steps/3.operational-headache';
import {
  IntegrationsStep,
  INTEGRATIONS_STEP_CONFIG,
} from '@/components/feature-modules/waitlist/components/steps/5.integrations';
import {
  PricingStep,
  PRICING_STEP_CONFIG,
} from '@/components/feature-modules/waitlist/components/steps/6.pricing';
import {
  InvolvementStep,
  INVOLVEMENT_STEP_CONFIG,
} from '@/components/feature-modules/waitlist/components/steps/7.involvement';
import { SuccessStep } from '@/components/feature-modules/waitlist/components/steps/8.success';
import {
  slideTransition,
  slideVariants,
} from '@/components/feature-modules/waitlist/config/animation';
import {
  Step,
  STEP_FIELDS,
  STEP_NAMES,
  TOTAL_FORM_STEPS,
} from '@/components/feature-modules/waitlist/config/steps';
import posthog from 'posthog-js';
import { useWaitlistJoinMutation, useWaitlistUpdateMutation } from '@/hooks/use-waitlist-mutation';
import { cn } from '@/lib/utils';
import { waitlistFormSchema, type WaitlistMultiStepFormData } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

const PRESET_INTEGRATION_LABELS = new Set(
  INTEGRATIONS_STEP_CONFIG.categories.flatMap((c) => c.options.map((o) => o.label)),
);

export function WaitlistForm({ className }: { className?: string }) {
  const [currentStep, setCurrentStep] = useState<Step>(Step.CTA);
  const [direction, setDirection] = useState(1);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [completedSurvey, setCompletedSurvey] = useState(false);

  const joinMutation = useWaitlistJoinMutation();
  const updateMutation = useWaitlistUpdateMutation();

  const form = useForm<WaitlistMultiStepFormData>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues: {
      name: '',
      email: '',
      operationalHeadache: '',
      integrations: [],
      monthlyPrice: '',
      involvement: undefined as unknown as 'WAITLIST' | 'EARLY_TESTING' | 'CALL_EARLY_TESTING',
    },
    mode: 'onTouched',
  });

  const { trigger, setValue, watch, formState } = form;
  const selectedIntegrations = watch('integrations');
  const selectedPrice = watch('monthlyPrice');
  const selectedInvolvement = watch('involvement');

  // ── Navigation ──

  const goForward = useCallback(() => {
    posthog.capture('waitlist_step_completed', {
      from_step: STEP_NAMES[currentStep],
      to_step: STEP_NAMES[currentStep + 1],
    });
    setDirection(1);
    setCurrentStep((prev) => prev + 1);
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep <= Step.OPERATIONAL_HEADACHE) return;
    posthog.capture('waitlist_step_back', {
      from_step: STEP_NAMES[currentStep],
      to_step: STEP_NAMES[currentStep - 1],
    });
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  // ── Phase 1: Join ──

  const handleJoin = useCallback(async () => {
    const valid = await trigger(['name', 'email']);
    if (!valid) return;

    const { name, email } = form.getValues();
    joinMutation.mutate(
      { name, email },
      {
        onSuccess: () => {
          posthog.capture('waitlist_joined', { email });
          setDirection(1);
          setCurrentStep(Step.BRIDGE);
        },
        onError: (error: Error) => {
          if (error.message.includes('already on the waitlist')) {
            form.setError('email', { message: error.message });
          }
        },
      },
    );
  }, [trigger, form, joinMutation]);

  // ── Phase 2: Survey ──

  const handleSurveyNext = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep];
    if (fields) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    goForward();
  }, [currentStep, trigger, goForward]);

  const handleSurveySubmit = useCallback(async () => {
    const valid = await trigger(['involvement']);
    if (!valid) return;

    const { email, operationalHeadache, integrations, monthlyPrice, involvement } =
      form.getValues();

    updateMutation.mutate(
      { email, operationalHeadache, integrations, monthlyPrice, involvement },
      {
        onSuccess: () => {
          posthog.capture('waitlist_survey_submitted', {
            integrations,
            monthly_price: monthlyPrice,
            involvement,
          });
          setCompletedSurvey(true);
          setDirection(1);
          setCurrentStep(Step.SUCCESS);
        },
      },
    );
  }, [trigger, form, updateMutation]);

  const handleBridgeSkip = useCallback(() => {
    posthog.capture('waitlist_survey_skipped');
    setCompletedSurvey(false);
    setDirection(1);
    setCurrentStep(Step.SUCCESS);
  }, []);

  const handleOk = useCallback(async () => {
    if (currentStep === Step.SUCCESS) return;
    if (currentStep === Step.CTA) {
      goForward();
      return;
    }
    if (currentStep === Step.CONTACT) {
      handleJoin();
      return;
    }
    if (currentStep === Step.BRIDGE) {
      goForward();
      return;
    }
    if (currentStep === Step.INVOLVEMENT) {
      handleSurveySubmit();
    } else {
      handleSurveyNext();
    }
  }, [currentStep, handleJoin, goForward, handleSurveySubmit, handleSurveyNext]);

  // ── Selections ──

  const selectPrice = useCallback(
    (label: string) => {
      setValue('monthlyPrice', label, { shouldValidate: true });
    },
    [setValue],
  );

  const selectInvolvement = useCallback(
    (value: string) => {
      setValue('involvement', value as 'WAITLIST' | 'EARLY_TESTING' | 'CALL_EARLY_TESTING', {
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const toggleIntegration = useCallback(
    (label: string) => {
      const current = form.getValues('integrations');
      const max = INTEGRATIONS_STEP_CONFIG.maxSelections;
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

  const addCustomIntegration = useCallback(
    (label: string) => {
      const current = form.getValues('integrations');
      if (current.length < INTEGRATIONS_STEP_CONFIG.maxSelections && !current.includes(label)) {
        setValue('integrations', [...current, label], { shouldValidate: true });
      }
    },
    [form, setValue],
  );

  const removeCustomIntegration = useCallback(
    (label: string) => {
      const current = form.getValues('integrations');
      setValue(
        'integrations',
        current.filter((i) => i !== label),
        { shouldValidate: true },
      );
    },
    [form, setValue],
  );

  const toggleOtherInput = useCallback(() => {
    setShowOtherInput((prev) => {
      if (prev) {
        const current = form.getValues('integrations');
        const presetOnly = current.filter((i) => PRESET_INTEGRATION_LABELS.has(i));
        setValue('integrations', presetOnly, { shouldValidate: true });
      }
      return !prev;
    });
  }, [form, setValue]);

  // ── Keyboard shortcuts ──

  const isPending = joinMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPending) return;

      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'Enter') {
        if (isInput) return;
        e.preventDefault();
        handleOk();
        return;
      }

      if (isInput) return;

      const key = e.key.toUpperCase();
      if (currentStep === Step.PRICE) {
        const option = PRICING_STEP_CONFIG.options.find((o) => o.key === key);
        if (option) selectPrice(option.label);
      }
      if (currentStep === Step.INVOLVEMENT) {
        const option = INVOLVEMENT_STEP_CONFIG.options.find((o) => o.key === key);
        if (option) selectInvolvement(option.value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isPending, handleOk, selectPrice, selectInvolvement]);

  // ── Progress ──

  const surveyStepIndex = currentStep - Step.OPERATIONAL_HEADACHE;
  const showProgress = currentStep >= Step.OPERATIONAL_HEADACHE && currentStep <= Step.INVOLVEMENT;
  const progress = showProgress ? ((surveyStepIndex + 1) / TOTAL_FORM_STEPS) * 100 : 0;

  // ── Render steps ──

  const renderStep = () => {
    switch (currentStep) {
      case Step.CTA:
        return <CtaStep onStart={goForward} />;
      case Step.CONTACT:
        return (
          <ContactStep
            form={form}
            onJoin={handleJoin}
            isPending={joinMutation.isPending}
          />
        );
      case Step.BRIDGE:
        return <BridgeStep onContinue={goForward} onSkip={handleBridgeSkip} />;
      case Step.OPERATIONAL_HEADACHE:
        return <OperationalHeadacheStep form={form} onNext={handleOk} />;
      case Step.INTEGRATIONS:
        return (
          <IntegrationsStep
            selectedIntegrations={selectedIntegrations}
            onToggle={toggleIntegration}
            onAddCustom={addCustomIntegration}
            onRemoveCustom={removeCustomIntegration}
            showOtherInput={showOtherInput}
            onToggleOther={toggleOtherInput}
            onNext={handleOk}
            error={formState.errors.integrations?.message}
          />
        );
      case Step.PRICE:
        return (
          <PricingStep
            selectedPrice={selectedPrice}
            onSelect={selectPrice}
            onNext={handleOk}
            error={formState.errors.monthlyPrice?.message}
          />
        );
      case Step.INVOLVEMENT:
        return (
          <InvolvementStep
            selectedInvolvement={selectedInvolvement}
            onSelect={selectInvolvement}
            onSubmit={handleOk}
            isPending={updateMutation.isPending}
            error={formState.errors.involvement?.message}
          />
        );
      case Step.SUCCESS:
        return <SuccessStep completedSurvey={completedSurvey} />;
      default:
        return null;
    }
  };

  const showBackButton =
    currentStep >= Step.OPERATIONAL_HEADACHE && currentStep <= Step.INVOLVEMENT;

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
        {showBackButton && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={goBack}
            disabled={currentStep === Step.OPERATIONAL_HEADACHE}
            className={cn(
              'mb-4 inline-flex items-center gap-1 text-sm transition-colors',
              currentStep === Step.OPERATIONAL_HEADACHE
                ? 'cursor-not-allowed text-muted-foreground/40'
                : 'cursor-pointer text-muted-foreground hover:text-foreground',
            )}
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
