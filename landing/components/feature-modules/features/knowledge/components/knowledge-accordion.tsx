'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { knowledgeScrollContent } from '../config/accordion-content';

const AUTO_ADVANCE_MS = 10000;
const INTERACTION_PAUSE_MS = 3000;

export const KnowledgeAccordion = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(Date.now());

  // Auto-advance timer
  useEffect(() => {
    if (paused) return;

    startRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / AUTO_ADVANCE_MS, 1);
      setProgress(pct);

      if (pct >= 1) {
        setActiveIndex((prev) => (prev + 1) % knowledgeScrollContent.length);
        startRef.current = Date.now();
        setProgress(0);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex, paused]);

  const handleValueChange = (value: string) => {
    if (value) {
      setActiveIndex(Number(value));
      setPaused(true);
      setProgress(0);

      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = setTimeout(() => setPaused(false), INTERACTION_PAUSE_MS);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-10">
      {/* Desktop: accordion left, visual right */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
        {/* Left: Accordion */}
        <Accordion
          type="single"
          value={String(activeIndex)}
          onValueChange={handleValueChange}
          className="w-full"
        >
          {knowledgeScrollContent.map((item, index) => (
            <AccordionItem
              key={index}
              value={String(index)}
              className="relative border-b border-white/10 last:border-b-0"
            >
              <AccordionTrigger className="cursor-pointer py-5 text-lg font-semibold text-primary/60 hover:text-primary hover:no-underline data-[state=open]:text-primary">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-content">
                {item.description}
              </AccordionContent>
              {/* Progress bar for active item */}
              {activeIndex === index && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full">
                  <div
                    className="h-full bg-primary/30 transition-[width] duration-100 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              )}
            </AccordionItem>
          ))}
        </Accordion>

        {/* Right: Visual panel */}
        <div className="relative my-4 flex items-center justify-center">
          <div
            className="relative h-[40rem] w-full overflow-hidden rounded-xl"
            style={{
              maskImage:
                'linear-gradient(to right, transparent, black 10%, black 75%, transparent), linear-gradient(to bottom, black 60%, transparent)',
              maskComposite: 'intersect',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 10%, black 75%, transparent), linear-gradient(to bottom, black 60%, transparent)',
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
                className="absolute inset-0"
              >
                {knowledgeScrollContent[activeIndex]?.content}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile: full-width accordion with visual behind active content */}
      <div className="lg:hidden">
        <Accordion
          type="single"
          value={String(activeIndex)}
          onValueChange={handleValueChange}
          className="w-full"
        >
          {knowledgeScrollContent.map((item, index) => (
            <AccordionItem
              key={index}
              value={String(index)}
              className="relative border-b border-white/10 last:border-b-0"
            >
              <AccordionTrigger className="py-4 text-base font-semibold text-primary/60 hover:no-underline data-[state=open]:text-primary">
                {item.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="relative min-h-[16rem] overflow-hidden rounded-lg">
                  {/* Visual background */}
                  <div className="absolute inset-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="h-full w-full"
                      >
                        {item.content}
                      </motion.div>
                    </AnimatePresence>
                    {/* Darkening overlay for text readability */}
                    <div className="absolute inset-0 bg-black/60" />
                  </div>

                  {/* Text content on top */}
                  <div className="relative z-10 p-4">
                    <p className="text-sm leading-relaxed text-primary/80">{item.description}</p>
                  </div>
                </div>
              </AccordionContent>
              {/* Progress bar for active item */}
              {activeIndex === index && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full">
                  <div
                    className="h-full bg-primary/30 transition-[width] duration-100 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              )}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
