import { useContainerScale } from '@/hooks/use-container-scale';
import { motion } from 'motion/react';

import { scenarios } from '../scenario-data';
import { FeatureTag } from '../ui-primitives';
import { MockActivityTimeline } from './mock-activity-timeline';
import { MockDataTable } from './mock-data-table';
import { MockKnowledgePanel } from './mock-knowledge-panel';
import { MockIconRail, MockSubPanel } from './mock-shell';

const MOBILE_WIDTH = 1100;
const MOBILE_CONTENT_HEIGHT = 1500;

export function MobileShowcase({
  activeScenario,
  onScenarioChange,
}: {
  activeScenario: number;
  onScenarioChange: (i: number) => void;
}) {
  const { containerRef, scale } = useContainerScale(MOBILE_WIDTH);
  const scenario = scenarios[activeScenario];

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="origin-top-left"
        style={{
          width: MOBILE_WIDTH,
          transform: `scale(${scale})`,
          height: MOBILE_CONTENT_HEIGHT * scale,
        }}
      >
        <div className="relative" style={{ width: MOBILE_WIDTH, height: MOBILE_CONTENT_HEIGHT }}>
          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="absolute -top-8 left-4"
          >
            <FeatureTag>Flexible Data Models</FeatureTag>
          </motion.div>

          {/* Main App Frame — back layer */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="absolute inset-x-0 top-0 flex overflow-hidden rounded-xl border border-border bg-card shadow-lg"
            style={{ height: 620 }}
          >
            <MockIconRail />
            <MockSubPanel
              activeEntity={scenario.entityName}
              onEntityClick={(name) => {
                const idx = scenarios.findIndex((s) => s.entityName === name);
                if (idx !== -1) onScenarioChange(idx);
              }}
            />
            <MockDataTable scenario={scenario} />
          </motion.div>

          {/* Knowledge Base — right side, overlapping */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute right-0 z-10"
            style={{ top: 380 }}
          >
            <div className="relative">
              <MockKnowledgePanel scenario={scenario} />
              <div className="absolute -bottom-4 left-4">
                <FeatureTag>AI knowledge base</FeatureTag>
              </div>
            </div>
          </motion.div>

          {/* Activity Timeline — bottom left, overlapping */}
          <motion.div className="absolute left-0 z-20" style={{ top: 600 }}>
            <div className="relative">
              <MockActivityTimeline scenario={scenario} />
              <div className="absolute right-4 -bottom-4">
                <FeatureTag>Cross-domain activity</FeatureTag>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
