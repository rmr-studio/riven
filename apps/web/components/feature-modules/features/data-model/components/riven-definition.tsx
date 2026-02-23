'use client';

import { Section } from '@/components/ui/section';
import { motion } from 'motion/react';

export function RivenDefinition() {
  return (
    <Section>
      <div className="relative container mx-auto px-4 md:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Dictionary Definition Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="rounded-xl border border-border bg-card/50 p-6 shadow-sm backdrop-blur-sm md:p-10">
              {/* Word */}
              <h2 className="mb-3 font-serif text-4xl font-normal tracking-tight text-heading md:mb-4 md:text-6xl">
                riven
              </h2>
              {/* Part of speech */}
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs md:mb-3 md:text-sm">
                <span className="text-muted-foreground italic">adjective</span>
                <span className="whitespace-nowrap text-muted-foreground/50">[ after verb ]</span>
                <span className="text-muted-foreground/30">&middot;</span>
                <span className="text-muted-foreground/60">literary</span>
              </div>
              {/* Pronunciation */}
              <div className="mb-5 flex items-center gap-3 text-xs text-muted-foreground md:mb-6 md:gap-4 md:text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium tracking-wide text-foreground/70 uppercase">
                    UK
                  </span>
                  <span className="font-mono">/ˈrɪv.ən/</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium tracking-wide text-foreground/70 uppercase">
                    US
                  </span>
                  <span className="font-mono">/ˈrɪv.ən/</span>
                </div>
              </div>
              {/* Gold divider */}
              <div className="mb-2 h-px w-full bg-edit/60" />
              {/* Definition */}
              <div className="text-sm font-normal text-content italic md:text-lg">
                : split apart
              </div>
              <div className="text-sm font-normal text-content md:text-lg">
                : divided into pieces or factions
              </div>
            </div>
          </motion.div>

          {/* Pain Copy */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="space-y-6"
          >
            <div className="font-mono text-xl leading-[0.9] tracking-tighter text-heading md:text-3xl">
              <div className="text-center md:text-start">
                Your operations are <span className="italic">riven. </span>
              </div>
              <div className="my-4 text-center font-serif text-4xl font-semibold italic md:text-start md:text-5xl">
                Scattered.{' '}
              </div>
              <div className="text-center font-mono text-xl leading-[0.95] text-content md:text-start">
                16 tabs, 6 dashboards, and a spreadsheet holding it all together.
              </div>
            </div>
            <p className="max-w-lg text-center font-mono text-base leading-tight text-muted-foreground md:text-start md:text-lg">
              Every tool owns a fragment. None of them talk. You end up as the integration
              layer&thinsp;&mdash;&thinsp;copying, pasting, and context-switching until the picture
              blurs.
            </p>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
