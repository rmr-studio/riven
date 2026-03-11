'use client';

import {
  ONBOARD_STEPS,
  SECTION_WIDTH,
} from '@/components/feature-modules/onboarding/config/onboard-steps';
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

  // Three-phase camera animation on step change: zoom-out → pan → zoom-in
  useEffect(() => {
    if (!scope.current) return;

    const run = async () => {
      // Guard against rapid navigation — skip if already animating
      if (isAnimating.current) return;
      isAnimating.current = true;

      const targetX = -ONBOARD_STEPS[currentStep].cameraX;

      try {
        // Phase 1 — zoom out (200ms)
        setIsZoomedOut(true);
        await animate(scope.current, { scale: 0.85 }, { duration: 0.2, ease: 'easeOut' });

        // Phase 2 — pan to target section (200ms)
        await animate(
          scope.current,
          { x: targetX },
          { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        );

        // Phase 3 — zoom in (200ms)
        await animate(scope.current, { scale: 1 }, { duration: 0.2, ease: 'easeIn' });
        setIsZoomedOut(false);
      } catch {
        // Animation interrupted (e.g., component unmount) — restore state cleanly
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
      {/* Translateable canvas — scope ref drives Framer Motion transforms */}
      <div
        ref={scope}
        className="flex h-full items-center"
        style={{ width: ONBOARD_STEPS.length * SECTION_WIDTH }}
      >
        {ONBOARD_STEPS.map((step, index) => {
          const { PreviewComponent } = step;
          const isInactive = isZoomedOut && index !== currentStep;

          return (
            <div
              key={step.id}
              className="flex h-full shrink-0 items-center justify-center transition-opacity duration-200"
              style={{ width: SECTION_WIDTH }}
            >
              <div className={isInactive ? 'opacity-30' : 'opacity-100'}>
                <PreviewComponent />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
