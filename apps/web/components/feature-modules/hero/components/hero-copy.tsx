'use client';

import { CtaButton } from '@/components/ui/cta-button';
import { scrollToSection } from '@/lib/scroll';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export const HeroCopy = () => {
  return (
    <div className="relative z-10 flex h-[calc(100svh-6rem)] w-full flex-col justify-between px-6 pb-6 sm:px-10 md:items-end md:justify-end md:pb-24 lg:px-16">
      {/* Headings — grouped together */}
      <div className="mt-24 md:mt-0 md:contents">
        <motion.h2
          className="mb-4 flex flex-col overflow-hidden font-serif text-[2.5rem] leading-[0.85] tracking-tighter sm:text-7xl md:flex-row md:gap-4 md:text-right md:text-[5rem] lg:gap-8 lg:text-[5.75rem] xl:text-[7rem]"
          initial={{ height: 0, opacity: 0, filter: 'blur(12px)' }}
          animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-heading/90">Your Tools. </div>
          <div className="italic">All Connected.</div>
        </motion.h2>
        <motion.h2
          className="mb-4 flex flex-col overflow-hidden text-end font-serif text-[2.5rem] leading-[0.85] tracking-tighter sm:text-7xl md:flex-row md:gap-4 lg:gap-8 lg:text-[5.75rem] xl:text-[7rem]"
          initial={{ height: 0, opacity: 0, filter: 'blur(12px)' }}
          animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-heading/90">Your Business.</div>
          <div className="italic">One Platform.</div>
        </motion.h2>
      </div>

      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-4 flex flex-col items-end"
      >
        {/* Bottom-left: description */}
        <div className="mt-2 text-[0.95rem] leading-tight tracking-tighter text-primary/90 italic md:text-right md:text-xl lg:pb-1">
          Riven's AI powered data platform unifies your tools and enables true cross-domain
          intelligence. <br />
          <span className="font-bold">All in one collaborative workspace.</span>
        </div>
        <div className="mt-6 flex flex-col items-end gap-3 sm:mt-8 sm:flex-row sm:items-center md:mb-0 lg:gap-4">
          <Link
            href="/#waitlist"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('waitlist');
            }}
          >
            <CtaButton className="w-full">Join the waitlist</CtaButton>
          </Link>
          <Link
            href="/#features"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('features');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-1 font-mono text-sm tracking-wide text-muted-foreground transition-colors hover:text-foreground md:gap-2 md:px-5 md:text-sm"
          >
            Learn More
            <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
};
