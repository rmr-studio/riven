import { BentoCard, BentoCarousel, Slide } from '@/components/ui/bento-carousel';
import { InterconnectionDiagram } from './carousel/graphic/1.interconnections';
import { IntegrationsDiagram } from './carousel/graphic/2.integrations';
import { IdentityMatchingDiagram } from './carousel/graphic/3.identity-matching';
import { IdentityMatchingDiagramSm } from './carousel/graphic/3.identity-matching-sm';
import { IntegrationGraphDiagram } from './carousel/graphic/4.integrations';
import { DataCleanlinessGraphic } from './carousel/graphic/5.data-cleanliness';
import { QueryBuilderGraphic } from './carousel/graphic/6.query-builder';

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
          "views  integration"
          "views  cleanliness"
        `,
        cols: '1fr 1fr',
        rows: '1fr 1fr',
      },
      lg: {
        areas: `
          "views views"
          "integration cleanliness"
        `,
        cols: '1fr 1fr',
        rows: '1.5fr 1fr',
      },
      cards: [
        <BentoCard
          key="views"
          area="views"
          title="Views that answer your questions."
          description="Filter, sort, and save custom views across your entire data model. Ask your data a question and pin the answer"
        >
          <div
            style={{
              maskImage:
                'linear-gradient(to right, transparent, black 10%, black 80%, transparent), linear-gradient(to bottom, black 40%, transparent)',
              maskComposite: 'intersect',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 10%, black 80%, transparent), linear-gradient(to bottom, black 40%, transparent)',
              WebkitMaskComposite: 'source-in',
            }}
            className="relative h-full w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
          >
            <QueryBuilderGraphic className="static inset-0 top-0 h-full w-full -translate-x-1/6 scale-70 max-md:left-1/2 max-md:w-[150%] md:absolute md:top-1/6 md:translate-x-4 md:scale-110 lg:top-1/3" />
          </div>
        </BentoCard>,
        <BentoCard
          key="integration"
          area="integration"
          title="Your tools, One platform"
          description="Balancing 16 tabs to make a decision is overrated. Bring your tools together in one unified platform, and get the full picture without being the integration layer yourself."
        >
          <div className="relative h-full w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <IntegrationGraphDiagram className="static inset-0 h-full w-full -translate-x-1/6 scale-75 max-md:left-1/2 max-md:w-[150%] sm:scale-100 md:absolute md:translate-x-0" />
          </div>
        </BentoCard>,
        <BentoCard
          key="cleanliness"
          area="cleanliness"
          title="Keep your data clean without lifting a finger"
          description="Avoid the headaches of messy data and let your data model maintain itself. With built-in data quality monitoring and automatic cleansing, your data stays accurate and reliable without manual effort."
          className="max-h-140 overflow-hidden pb-0 lg:max-h-120"
        >
          <div
            className="relative h-full w-full overflow-hidden"
            style={{
              maskImage:
                'linear-gradient(to right, transparent, black 10%, black 80%, transparent), linear-gradient(to bottom, black 40%, transparent)',
              maskComposite: 'intersect',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 10%, black 80%, transparent), linear-gradient(to bottom, black 40%, transparent)',
              WebkitMaskComposite: 'source-in',
            }}
          >
            <DataCleanlinessGraphic className="static inset-0 left-1/2 w-full origin-top-right scale-75 md:scale-90 lg:translate-x-1/3 lg:scale-100" />
          </div>
        </BentoCard>,
      ],
    },
  ];

  return (
    <section className="my-12">
      <div className="mx-auto mb-12 w-full text-center leading-tight tracking-tight">
        <h3 className="text-4xl leading-tight font-medium text-background/70">
          Interconnection has never been easier
        </h3>
        <h4 className="font-normal text-background/60">Your data, Your model, Your platform. </h4>
      </div>
      <BentoCarousel slides={slides} />
    </section>
  );
};
