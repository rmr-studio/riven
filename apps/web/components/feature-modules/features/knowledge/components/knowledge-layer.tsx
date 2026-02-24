import { Section } from '@/components/ui/section';
import { SectionDivider } from '@/components/ui/section-divider';
import { KnowledgeAccordion } from './knowledge-accordion';

export const KnowledgeLayer = () => {
  return (
    <Section>
      <h2 className="mx-auto mb-12 max-w-7xl px-6 text-center font-serif text-3xl leading-[1.1] font-normal tracking-tight md:px-0 md:text-4xl lg:text-5xl">
        <span className="text-primary">All unified within an AI powered knowledge base.</span>{' '}
        <span className="text-content">
          Providing you with reasoning and insights across your entire business, not just one corner
          of it.
        </span>
      </h2>

      <SectionDivider name="Unified Knowledge Layer" />

      <KnowledgeAccordion />
    </Section>
  );
};
