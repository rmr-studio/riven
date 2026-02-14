import { BentoCard, BentoCarousel, Slide } from '@/components/ui/bento-carousel';
import { InterconnectionDiagram } from './carousel/graphic/1.interconnections';

export const DataModelFeatureCarousel = () => {
  const slides: Slide[] = [
    {
      layout: {
        areas: `
          "feature feature standard1"
          "standard2 standard3 standard1"
        `,
        cols: '1fr 1fr 1fr',
        rows: '1fr 1fr',
      },
      lg: {
        areas: `
          "feature feature"
          "standard1 standard2"
          "standard1 standard3"
        `,
        cols: '1fr 1fr',
        rows: '1.5fr 1fr 1fr',
      },
      cards: [
        <BentoCard
          className="relative h-120"
          key="feature"
          area="feature"
          title="Cross domain business intelligence"
          description="Link entities, create associations and generate power insights and pattern recognition capabilities"
        >
          <div className="relative h-full w-full overflow-hidden max-md:mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <InterconnectionDiagram className="absolute inset-0 h-full w-full max-md:left-1/2 max-md:w-[170%] max-md:-translate-x-1/2 md:static md:h-full md:w-full" />
          </div>
        </BentoCard>,
        <BentoCard
          key="standard1"
          area="standard1"
          title="Custom workflows"
          description="Build automation that fits your exact process. No compromises, no workarounds."
        />,
        <BentoCard
          key="standard2"
          area="standard2"
          title="Powerful relationship intel"
          description="See all your team's conversations with a contact or company and create enriched timelines."
        />,
        <BentoCard
          key="standard3"
          area="standard3"
          title="Dream tech stack"
          description="Pull in data from best-in-class SaaS tools through our API and Zapier integration."
        />,
      ],
    },
    {
      layout: {
        areas: `
          "analytics analytics security"
          "analytics analytics automation"
        `,
        cols: '1fr 1fr 1fr',
        rows: '1fr 1fr',
      },
      md: {
        areas: `
          "analytics analytics"
          "security automation"
        `,
        cols: '1fr 1fr',
        rows: '1.5fr 1fr',
      },
      cards: [
        <BentoCard
          key="analytics"
          area="analytics"
          title="Advanced analytics"
          description="Get insights that matter with customizable dashboards and real-time reporting. Track every metric that moves your business forward."
        />,
        <BentoCard
          key="security"
          area="security"
          title="Enterprise security"
          description="Bank-level encryption, SOC 2 compliance, and granular access controls."
        />,
        <BentoCard
          key="automation"
          area="automation"
          title="Smart automation"
          description="Let AI handle the repetitive tasks while you focus on building relationships."
        />,
      ],
    },
  ];

  return (
    <section className="my-12">
      <BentoCarousel slides={slides} />
    </section>
  );
};
