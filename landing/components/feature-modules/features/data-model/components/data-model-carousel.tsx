import { BentoCard, BentoCarousel, Slide } from '@/components/ui/bento-carousel';

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
      md: {
        areas: `
          "feature feature"
          "standard1 standard2"
          "standard3 standard3"
        `,
        cols: '1fr 1fr',
        rows: '1.5fr 1fr 1fr',
      },
      cards: [
        <BentoCard
          key="feature"
          area="feature"
          title="Instant visibility into all your relationships"
          description="Real-time global database of every contact & company your business interacts with."
        />,
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
