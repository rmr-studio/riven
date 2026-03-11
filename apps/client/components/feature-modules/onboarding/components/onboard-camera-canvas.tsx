'use client';

import { ONBOARD_STEPS, SECTION_WIDTH } from '@/components/feature-modules/onboarding/config/onboard-steps';
import { useOnboardStore } from '@/components/feature-modules/onboarding/hooks/use-onboard-store';
import { Propless } from '@/lib/interfaces/interface';
import { useAnimate } from 'framer-motion';
import { FC, useEffect, useRef, useState } from 'react';

export const OnboardCameraCanvas: FC<Propless> = () => {
  const currentStep = useOnboardStore((s) => s.currentStep);
  const [scope, animate] = useAnimate();
  const isAnimating = useRef(false);
  const [isZoomedOut, setIsZoomedOut] = useState(false);

  // Initial mount: position immediately at step 0 without animation
  useEffect(() => {
    if (!scope.current) return;
    animate(scope.current, { x: 0, scale: 1 }, { duration: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scope.current) return;

    const run = async () => {
      if (isAnimating.current) return;
      isAnimating.current = true;

      const targetX = -ONBOARD_STEPS[currentStep].cameraX;

      try {
        // Phase 1 — zoom out
        setIsZoomedOut(true);
        await animate(scope.current, { scale: 0.85 }, { duration: 0.2, ease: 'easeOut' });

        // Phase 2 — pan
        await animate(
          scope.current,
          { x: targetX },
          { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        );

        // Phase 3 — zoom in
        await animate(scope.current, { scale: 1 }, { duration: 0.2, ease: 'easeIn' });
        setIsZoomedOut(false);
      } catch {
        // Animation interrupted — restore state cleanly
        setIsZoomedOut(false);
      } finally {
        isAnimating.current = false;
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  return (
    <div className="relative flex h-full w-full items-center overflow-hidden">
      <div
        ref={scope}
        className="flex h-full items-center"
        style={{ width: ONBOARD_STEPS.length * SECTION_WIDTH }}
      >
        {ONBOARD_STEPS.map((step, index) => {
          const { PreviewComponent } = step;
          return (
            <div
              key={step.id}
              className="flex h-full shrink-0 items-center justify-center transition-opacity duration-200"
              style={{ width: SECTION_WIDTH }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...({} as any)}
              data-opacity={isZoomedOut && index !== currentStep ? '30' : '100'}
            >
              <div
                className={
                  isZoomedOut && index !== currentStep ? 'opacity-30' : 'opacity-100'
                }
              >
                <PreviewComponent />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
