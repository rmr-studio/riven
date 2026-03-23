'use client';

import { ShaderContainer } from '@/components/ui/shader-container';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ACTION_CONTENT } from '../config/accordion-content';
import { AnimateOnMountContext } from './animate-context';

const AUTO_ADVANCE_MS = 200000;
const INTERACTION_PAUSE_MS = 3000;

export const DailyActionAccordion = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line react-hooks/purity
  const startRef = useRef(Date.now());

  // Auto-advance timer (desktop only, controlled by CSS visibility)
  useEffect(() => {
    if (paused) return;

    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;

      if (elapsed >= AUTO_ADVANCE_MS) {
        setActiveIndex((prev) => (prev + 1) % ACTION_CONTENT.length);
        startRef.current = Date.now();
      }
    }, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex, paused]);

  const handleItemClick = useCallback((index: number) => {
    setActiveIndex(index);
    setPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => setPaused(false), INTERACTION_PAUSE_MS);
  }, []);

  return (
    <div className="w-full">
      {/* Desktop: item list left, visual right */}

      <div className="hidden lg:flex">
        {/* Left: Item selector list */}
        <div className="flex">
          <div className="z-20 flex flex-col px-8 py-10 lg:w-5/12 lg:px-12 lg:py-16">
            <div className="flex items-center gap-2.5">
              <h3 className="font-serif text-xl font-semibold tracking-tight text-background sm:text-3xl dark:text-foreground">
                Powerful alone. Unstoppable together.
              </h3>
            </div>

            <p className="mt-4 max-w-lg text-base leading-tight tracking-tight text-primary-foreground/50 md:max-w-md md:text-lg dark:text-content">
              Riven explores and surfaces patterns trends and insights hidden deep in your data.
              From channel performance to cohort health to churn risks. Answer critical questions at
              a glance with the most powerful, connected dashboard you've ever seen.
            </p>
          </div>

          {ACTION_CONTENT.map((item, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleItemClick(index)}
                className="flex cursor-pointer items-start gap-4 border-b border-white/10 py-5 text-left last:border-b-0"
              >
                {/* Indicator dot */}
                <div className="flex h-7 w-4 shrink-0 items-center justify-center">
                  <div
                    className={cn(
                      'rounded-full transition-all duration-300',
                      isActive ? 'h-3 w-3 bg-primary' : 'h-2 w-2 bg-content/20',
                    )}
                  />
                </div>

                {/* Text content */}
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      'text-lg font-semibold transition-colors duration-300',
                      isActive ? 'text-heading' : 'text-content/40',
                    )}
                  >
                    {item.title}
                  </div>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden text-sm leading-relaxed text-content"
                      >
                        <span className="block pt-2">{item.description}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Visual panel */}
        <ShaderContainer className="mt-0 w-full">
          <div className="relative my-4 flex items-end justify-center">
            <div
              className="relative h-180 w-full overflow-hidden rounded-xl"
              style={{
                maskImage:
                  'linear-gradient(to right, transparent, black 10%, black 75%, transparent), linear-gradient(to bottom, black 0%, black 95%, transparent)',
                maskComposite: 'intersect',
                WebkitMaskImage:
                  'linear-gradient(to right, transparent, black 10%, black 75%, transparent), linear-gradient(to bottom, black 0%, black 95%, transparent)',
                WebkitMaskComposite: 'source-in',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex h-full items-center pt-4"
                >
                  {ACTION_CONTENT[activeIndex]?.content}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </ShaderContainer>
      </div>

      {/* Mobile: all items fully expanded in scroll */}
      <div className="flex flex-col gap-16 lg:hidden">
        {ACTION_CONTENT.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Title */}
            <div className="mx-auto max-w-7xl text-center text-2xl font-medium text-heading">
              {item.title}
            </div>

            {/* Description */}
            <p className="mx-auto mt-3 max-w-7xl text-center text-sm leading-relaxed text-content">
              {item.description}
            </p>

            {/* Visual — animate-on-mount bypasses unreliable IntersectionObserver
                for SVG elements inside overflow-hidden containers on mobile */}
            <div
              className="relative mx-auto mt-6 min-h-[400px] w-full max-w-2xl overflow-hidden rounded-lg sm:min-h-[500px]"
              style={{
                maskImage:
                  'linear-gradient(to right, black 85%, transparent), linear-gradient(to bottom, black 30%, transparent 120%)',
                maskComposite: 'intersect',
                WebkitMaskImage:
                  'linear-gradient(to right, black 85%, transparent), linear-gradient(to bottom, black 30%, transparent 120%)',
                WebkitMaskComposite: 'source-in',
              }}
            >
              <AnimateOnMountContext.Provider value={true}>
                {item.content}
              </AnimateOnMountContext.Provider>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
