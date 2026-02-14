import { BentoCard, BentoCarousel, Slide } from '@/components/ui/bento-carousel';
import { InterconnectionDiagram } from './carousel/graphic/1.interconnections';
import { IntegrationsDiagram } from './carousel/graphic/2.integrations';
import { IdentityMatchingDiagram } from './carousel/graphic/3.identity-matching';
import { IdentityMatchingDiagramSm } from './carousel/graphic/3.identity-matching-sm';
import { IntegrationGraphDiagram } from './carousel/graphic/4.integrations';

export const DataModelFeatureCarousel = () => {
  const slides: Slide[] = [
    {
      layout: {
        areas: `
          "cross-domain cross-domain identity-matching"
          "integration integration identity-matching"
        `,
        cols: '1fr 1fr 1.33fr',
        rows: '1fr 1fr',
      },
      lg: {
        areas: `
          "cross-domain cross-domain"
          "integration integration"
          "identity-matching identity-matching"
        `,
        cols: '1fr 1fr',
        rows: 'auto auto auto',
      },
      cards: [
        <BentoCard
          className="relative h-120"
          key="cross-domain"
          area="cross-domain"
          title="Cross domain business intelligence"
          description="Link entities, create associations and generate power insights and pattern recognition capabilities"
        >
          <div className="relative h-full w-full overflow-hidden max-md:mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <InterconnectionDiagram className="absolute inset-0 h-full w-full max-md:left-1/2 max-md:w-[170%] max-md:-translate-x-1/2 md:static md:h-full md:w-full" />
          </div>
        </BentoCard>,
        <BentoCard
          key="identity-matching"
          area="identity-matching"
          title="New data finds its place automatically"
          description="Automatic entity resolution and identity matching means your data model stays up to date without manual intervention. New data finds its place seamlessly, so you can focus on insights, not maintenance."
        >
          <div className="relative h-full w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <IdentityMatchingDiagramSm className="absolute inset-0 top-0 left-1/2 mx-auto h-full w-full -translate-x-1/2 md:static md:w-[80%] md:translate-x-0 lg:hidden" />
            <IdentityMatchingDiagram className="absolute inset-0 top-0 hidden h-full lg:block lg:w-[120%]" />
          </div>
        </BentoCard>,

        <BentoCard
          className="relative h-120"
          key="integration"
          area="integration"
          title="Integrations that feel natural"
          description="Treat your tools like first class citizens, not just data sources. Integrate them directly into your models"
        >
          <div className="relative h-full w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <IntegrationsDiagram className="absolute inset-0 h-full w-full max-md:left-1/2 max-md:w-[170%] max-md:-translate-x-1/2 md:static md:h-full md:w-full" />
          </div>
        </BentoCard>,
      ],
    },
    {
      layout: {
        areas: `
          "analytics  integration"
          "analytics  automation"
        `,
        cols: '1fr 1fr',
        rows: '1fr 1fr',
      },
      lg: {
        areas: `
          "analytics analytics"
          "integration automation"
        `,
        cols: '1fr 1fr',
        rows: '1.5fr 1fr',
      },
      cards: [
        <BentoCard
          key="analytics"
          area="analytics"
          title="Advanced analytics"
          description="Get insights that matter with customizable dashboards ad real-time reporting. Track every metric that moves your business forward."
        />,
        <BentoCard
          key="integration"
          area="integration"
          title="Your tools, One platform"
          description="Balancing 16 tabs to make a decision is overrated. Bring your tools together in one unified platform, and get the full picture without being the integration layer yourself."
        >
          <div className="relative h-full w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <IntegrationGraphDiagram className="static inset-0 h-full w-full -translate-x-1/6 max-md:left-1/2 max-md:w-[150%] md:absolute md:translate-x-0" />
          </div>
        </BentoCard>,
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
