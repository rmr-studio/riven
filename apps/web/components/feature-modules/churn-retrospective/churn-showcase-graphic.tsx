'use client';

import { useContainerScale } from '@/hooks/use-container-scale';
import { motion } from 'motion/react';

import { MockChurnRetrospective } from './mock-churn-retrospective';

// ── Desktop ─────────────────────────────────────────────────────────

const DESKTOP_WIDTH = 1920;
const DESKTOP_HEIGHT = 1050;

export const ChurnShowcase = () => {
  const { containerRef, scale } = useContainerScale(DESKTOP_WIDTH);

  return (
    <div
      ref={containerRef}
      className="relative w-full translate-x-12 scale-120 px-0 md:translate-x-0 md:scale-100 md:px-12"
    >
      <div
        className="origin-top-left"
        style={{
          width: DESKTOP_WIDTH,
          transform: `scale(${scale})`,
          height: DESKTOP_HEIGHT * scale,
        }}
      >
        <div className="relative" style={{ height: DESKTOP_HEIGHT }}>
          {/* Frame */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="absolute inset-x-0 top-0"
          >
            <MockChurnRetrospective />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
