'use client';

import { Section } from '@/components/ui/section';
import { motion } from 'motion/react';

export function PainPoint() {
  return (
    <Section>
      <div className="relative container mx-auto px-4 md:px-8">
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
          className="space-y-6 md:mx-32"
        >
          <div className="text-xl leading-[0.9] text-heading md:text-3xl">
            <div className="text-left font-serif text-3xl leading-[0.95] text-content md:text-5xl">
              16 tabs, 6 dashboards, and a spreadsheet holding it all together.
            </div>
            <p className="text-rightfont-mono max-w-2xl text-base leading-tight text-muted-foreground md:text-left md:text-lg">
              Every tool owns a fragment. None of them talk. You end up as the integration
              layer&thinsp;&mdash;&thinsp;copying, pasting, and context-switching until the picture
              blurs. This is your data, and it should work for you, not the other way around.
            </p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
