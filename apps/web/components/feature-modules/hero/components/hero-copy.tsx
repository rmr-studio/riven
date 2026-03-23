'use client';

import { CtaButton } from '@/components/ui/cta-button';
import { scrollToSection } from '@/lib/scroll';
import { ChevronDown } from 'lucide-react';

import { motion } from 'motion/react';
import Link from 'next/link';

export const HeroCopy = () => {
  return (
    <>
      <div className="relative z-20 mt-[clamp(1.5rem,6svh,6rem)] flex h-[calc(100svh-6rem)] flex-col items-center pb-4 sm:pb-6 md:items-start md:justify-start md:pt-8 md:pb-0">
        <motion.div
          className="md:mt-0"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-center font-sans text-[clamp(1.75rem,8vw,2.75rem)] leading-[1.05] font-bold tracking-tighter text-heading sm:text-5xl sm:leading-[1] md:text-start md:text-[5rem] md:leading-[0.95] lg:text-[5.75rem] 2xl:text-[6.75rem]">
            Get more customers.
            <br />
            <span className="text-heading/90">Know what </span>
            <span className="font-serif text-[clamp(2.75rem,14vw,4.5rem)] leading-[1.1] font-normal italic sm:text-[3.5rem] md:text-[5rem] lg:text-[5.75rem] 2xl:text-[6.75rem]">
              keeps them paying.
            </span>
          </h1>
        </motion.div>

        <motion.h2
          className="mt-3 mb-1 max-w-md px-4 text-center font-serif text-[clamp(1.15rem,4.5vw,1.5rem)] leading-snug font-normal tracking-tight text-heading/85 italic sm:mt-4 sm:mb-3 sm:max-w-lg sm:px-0 sm:text-2xl md:max-w-2xl md:text-left md:text-3xl lg:text-4xl lg:leading-snug xl:max-w-none"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="font-semibold">Finally. </span> A customer lifecycle intelligence
          platform.
          <br className="block xl:hidden" />{' '}
          <span className="font-semibold">Built for your entire team.</span>
        </motion.h2>

        <motion.section
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-auto w-full grow flex-col items-center pt-[3%] sm:pt-0 md:items-start"
        >
          <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center md:mb-0 md:items-start md:justify-start lg:gap-5">
            <Link
              href="/#waitlist"
              className="w-auto"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('waitlist');
              }}
            >
              <CtaButton className="mx-auto w-full justify-center" size="xl">
                <div className="flex flex-col items-center gap-0.5 md:items-start">
                  Join the waitlist
                </div>
              </CtaButton>
            </Link>
            <Link
              href="/#features"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('features');
              }}
              className="mt-1 flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 font-mono text-sm tracking-wide text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground sm:mt-0 md:gap-2 md:text-sm"
            >
              Learn More
              <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
          </div>
        </motion.section>
      </div>
    </>
  );
};
