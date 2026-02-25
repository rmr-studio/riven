'use client';

import { Section } from '@/components/ui/section';
import { SectionDivider } from '@/components/ui/section-divider';
import { motion } from 'motion/react';
import { DataModelFeatureCarousel } from './data-model-carousel';
import { DataModelShowcase } from './graph/data-model';

export const DataModel = () => {
  return (
    <>
      <Section
        id="features"
        className="flex flex-col space-y-16 shadow-xl shadow-primary dark:shadow-none"
        gridClassName="bg-foreground"
        mask="none"
        fill="color-mix(in srgb, var(--background) 15%, transparent)"
        variant="dots"
        size={12}
        navbarInverse
      >
        <SectionDivider inverse name="One Unified Data Ecosystem" />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
       
        </motion.div>
        <DataModelFeatureCarousel />
        <DataModelShowcase />
      </Section>
    </>
  );
};
