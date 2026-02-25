import { Section } from '@/components/ui/section';
import { VisualAccordionSection } from './feature-accordion';

export const FeaturesOverview = () => {
  return (
    <Section id="features">
      <section className="mx-auto mb-12 flex max-w-7xl flex-col gap-8 px-6 text-center font-serif text-3xl leading-[1.1] font-normal tracking-tight text-content/65 md:px-0 md:text-4xl lg:text-5xl">
        <article>
          <span className="text-primary italic">A true focus on structural freedom.</span>{' '}
          <span className="text-content/65">
            Our data models and relationships adapt to how you work, not the other way around.
            Because your business is unique, so your platform should be too.
          </span>
        </article>
        <article>
          All unified within an <span className="text-primary">AI powered knowledge base. </span>
          Providing you with reasoning and insights across your entire business, not just one corner
          of it.
        </article>
      </section>

      <VisualAccordionSection />
    </Section>
  );
};
