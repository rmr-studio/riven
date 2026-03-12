'use client';

import { Button } from '@riven/ui/button';
import { FC } from 'react';
import { ONBOARD_STEPS } from '../config/onboard-steps';
import { useOnboardStore } from '../hooks/use-onboard-store';

export const OnboardNavControls: FC = () => {
  const currentStep = useOnboardStore((s) => s.currentStep);
  const goNext = useOnboardStore((s) => s.goNext);
  const goBack = useOnboardStore((s) => s.goBack);
  const skip = useOnboardStore((s) => s.skip);
  const setStepData = useOnboardStore((s) => s.setStepData);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARD_STEPS.length - 1;
  const isOptional = ONBOARD_STEPS[currentStep].optional;

  const handleNext = async () => {
    const { formTrigger, liveData } = useOnboardStore.getState();
    const step = ONBOARD_STEPS[currentStep];

    if (formTrigger) {
      const valid = await formTrigger();
      if (!valid) return;
      setStepData(step.id, liveData[step.id]);
    }

    goNext();
  };

  return (
    <div className="flex items-center">
      {!isFirstStep && (
        <Button variant="ghost" onClick={() => goBack()}>
          Back
        </Button>
      )}

      <div className="ml-auto flex items-center gap-3">
        {isOptional && (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            onClick={() => skip()}
          >
            Skip
          </button>
        )}

        <Button onClick={handleNext}>{isLastStep ? 'Complete' : 'Next'}</Button>
      </div>
    </div>
  );
};
