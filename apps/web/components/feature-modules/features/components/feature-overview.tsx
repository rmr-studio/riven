import { Section } from '@/components/ui/section';
import { VisualAccordionSection } from './feature-accordion';

export const FeaturesOverview = () => {
  return (
    <Section className="pb-0!" size={24}>
      <div className="content-container">
        <article id="features">
          <VisualAccordionSection />
        </article>
      </div>
    </Section>
  );
};
