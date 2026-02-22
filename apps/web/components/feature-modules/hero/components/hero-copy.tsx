'use client';

import { Button } from '@/components/ui/button';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export const HeroCopy = () => {
  return (
    <div className="relative z-10 flex h-[calc(100dvh-6rem)] w-full flex-col justify-between px-6 sm:px-10 lg:px-16">
      {/* Top-left headline */}
      <motion.div
        className="pt-4 sm:pt-8"
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight text-heading sm:text-7xl md:text-8xl lg:text-9xl">
          Every tool
          <br />
          <span className="italic">shows you a slice.</span>
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
        <div className="flex flex-col items-end">
          <h2 className="mb-4 text-right font-serif text-[2.5rem] leading-[0.85] tracking-tight text-heading sm:text-7xl md:text-8xl lg:text-9xl">
            Riven connects
            <br />
            <span className="italic">your entire business.</span>
          </h2>
          {/* Bottom-left: description */}
          <div className="text-end text-xs leading-tight tracking-tighter text-muted-foreground italic sm:text-[0.935rem] lg:pb-1">
            <p>
              AI powered data platform enabling cross-domain intelligence for scaling
              consumer-facing businesses.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="mt-6 flex items-center gap-3 sm:mt-8 lg:gap-4">
            <Link
              href="/#contact"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                window.history.replaceState(null, '', '/#contact');
              }}
            >
              <HoverBorderGradient className="overflow-hidden bg-background p-0" as="div">
                <Button
                  size="sm"
                  className="h-7 cursor-pointer items-center gap-1 border-0 bg-muted/50 px-2.5 py-0.5 font-mono text-xs tracking-wide text-muted-foreground outline-0 hover:bg-muted hover:text-foreground md:h-8 md:gap-1.5 md:px-3 md:text-xs"
                >
                  Join the waitlist
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 md:h-4 md:w-4" />
                </Button>
              </HoverBorderGradient>
            </Link>
            <Link
              href="/#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                window.history.replaceState(null, '', '/#features');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 font-mono text-xs tracking-wide text-muted-foreground transition-colors hover:text-foreground md:gap-1.5 md:px-3 md:text-xs"
            >
              Learn More
              <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
