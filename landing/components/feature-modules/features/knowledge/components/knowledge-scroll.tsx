'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { knowledgeScrollContent } from '../config/scroll-content';

export const KnowledgeScroll = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleValueChange = (value: string) => {
    if (value) {
      setActiveIndex(Number(value));
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-10">
      {/* Desktop: accordion left, visual right */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-12">
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
              className="border-b border-white/10 last:border-b-0"
            >
              <AccordionTrigger className="py-5 text-lg font-semibold text-primary/60 hover:no-underline data-[state=open]:text-primary">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-primary/50">
                {item.description}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Right: Visual panel */}
        <div className="relative flex items-center justify-center">
          <div className="relative h-[28rem] w-full overflow-hidden rounded-xl">
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
              className="border-b border-white/10 last:border-b-0"
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
                    <p className="text-sm leading-relaxed text-primary/80">
                      {item.description}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
