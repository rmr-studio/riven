import { DailyActionAccordion } from '@/components/feature-modules/landing/actions/components/action-accordion';
import { ShowcaseCard, ShowcaseSection, type FeatureCard } from '@/components/ui/showcase-section';

const FEATURES: FeatureCard[] = [
  {
    title: 'One platform',
    description:
      'Keep your tools, ditch the tabs. Perform your most important actions in one place.',
  },
  {
    title: 'Real-time monitoring and results',
    description:
      'See the impact of your actions as it happens, and keep an eye on what matters most.',
  },
];

export const DailyActions = () => {
  return (
    <ShowcaseSection
      lazyRender
      heading={
        <h2 className="mt-4 font-sans text-3xl text-primary-foreground md:text-4xl lg:text-5xl">
          More Results. <span className="font-serif font-normal italic">Fewer Tabs</span>
        </h2>
      }
      features={FEATURES}
    >
      <ShowcaseCard>
        <DailyActionAccordion />
      </ShowcaseCard>
    </ShowcaseSection>
  );
};
