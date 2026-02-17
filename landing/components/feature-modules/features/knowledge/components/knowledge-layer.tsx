import { Section } from '@/components/ui/section';
import { SectionDivider } from '@/components/ui/section-divider';
import { KnowledgeAccordion } from './knowledge-accordion';

export const KnowledgeLayer = () => {
  return (
    <Section>
      <h2 className="mx-auto mb-12 max-w-7xl text-center text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
        <span className="font-bold text-primary italic">
          All unified together within an AI powered knowledge layer.
        </span>{' '}
        <span className="text-primary/80">
          Building itself through contextual understanding of your entire data ecosystem, providing
          you with reasoning and insights across your entire business, not just one corner of it.
        </span>
      </h2>

      <SectionDivider name="Unified Knowledge Layer" />

      <KnowledgeAccordion />
    </Section>
  );
};
