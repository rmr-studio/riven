'use client';

import { CtaButton } from '@/components/ui/cta-button';
import { scrollToSection } from '@/lib/scroll';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export const HeroCopy = () => {
  return (
    <div className="relative z-10 flex h-[calc(100svh-6rem)] w-full flex-col justify-between px-6 sm:px-10 lg:px-16">
      {/* Top-left headline */}
      <motion.div
        className="pt-4 sm:pt-8"
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight text-heading sm:text-7xl md:text-8xl">
          Your tools can only
          <br />
          <span className="italic">look at one piece.</span>
        </h1>
      </motion.div>

      {/* Bottom section: copy left, headline + CTAs right */}
      <motion.div
        className="flex flex-col gap-8 pb-8 sm:pb-12"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Bottom-right: second headline + CTAs */}
        <div className="flex flex-col md:items-end">
          <h2 className="mb-4 font-serif text-[3rem] leading-[0.85] tracking-tight text-heading sm:text-7xl md:text-right md:text-8xl lg:text-9xl">
            Riven sees
            <br />
            <span className="italic">the biggest picture.</span>
          </h2>
          {/* Bottom-left: description */}
          <div className="mt-2 leading-tight font-bold tracking-tighter text-primary/90 italic md:text-xl lg:pb-1">
            AI powered data platform enabling cross-domain intelligence for scaling consumer-facing
            businesses.
          </div>

          {/* CTA buttons */}
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center lg:gap-4">
            <Link
              href="/#waitlist"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('waitlist');
              }}
            >
              <CtaButton>Join the waitlist</CtaButton>
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
        </div>
      </motion.div>
    </div>
  );
};
