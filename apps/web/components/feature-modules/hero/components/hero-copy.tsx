'use client';

import { CtaButton } from '@/components/ui/cta-button';
import { scrollToSection } from '@/lib/scroll';
import { ArrowRight } from 'lucide-react';

import { motion } from 'motion/react';
import Link from 'next/link';

export const HeroCopy = () => {
  return (
    <>
      <div className="relative z-20 mt-10 items-center px-4 pb-4 sm:pb-6 md:px-8 md:pt-8 md:pb-0 lg:px-0">
        <motion.div
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-start font-sans text-[clamp(1.75rem,8vw,2.75rem)] leading-none font-semibold tracking-tighter text-heading sm:text-5xl md:text-[4rem] lg:text-[5rem]">
            Get more customers.
            <br />
            <span className="text-heading/90">Know what </span>
            <span className="font-serif font-normal italic">keeps them paying.</span>
          </h1>
        </motion.div>

        <motion.h2
          className="mt-3 text-start leading-tight font-normal tracking-tighter text-heading/85 sm:max-w-lg sm:px-0 sm:text-2xl md:max-w-5xl"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Finally. A customer lifecycle intelligence platform to elevate your strategy and drive
          growth with powerful, data-driven insights and actions.
          <br className="block md:hidden" />{' '}
          <span className="font-semibold">Built for your entire team.</span>
        </motion.h2>

        <motion.section
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-auto w-fit grow flex-col items-center sm:pt-0 md:items-start"
        >
          <Link
            href="/#waitlist"
            className="mt-8 w-auto"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('waitlist');
            }}
          >
            <CtaButton className="paper-lite mx-auto justify-center border bg-accent/40 text-primary md:w-64">
              <div className="font-sans text-lg tracking-tight">Join the waitlist</div>
              <ArrowRight className="size-4" />
            </CtaButton>
          </Link>
        </motion.section>
      </div>
    </>
  );
};
