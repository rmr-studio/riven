'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BentoCard, BentoCarousel, Slide } from '@/components/ui/bento-carousel';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { FADE_EDGE_MASK } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { InterconnectionDiagram } from './carousel/graphic/1.interconnections';
import { IntegrationsDiagram } from './carousel/graphic/2.integrations';
import { IdentityMatchingDiagram } from './carousel/graphic/3.identity-matching';
import { IntegrationGraphDiagram } from './carousel/graphic/4.integrations';
import { DataCleanlinessGraphic } from './carousel/graphic/5.data-cleanliness';
import { QueryBuilderGraphic } from './carousel/graphic/6.query-builder';
import { AnimateOnMountContext } from './carousel/graphic/animate-context';

const ACCORDION_ITEMS = [
  {
    key: 'cross-domain',
    title: 'Cross domain business intelligence',
    description:
      'Link entities, create associations and generate power insights and pattern recognition capabilities',
  },
  {
    key: 'identity-matching',
    title: 'New data finds its place automatically',
    description:
      'Automatic entity resolution and identity matching means your data model stays up to date without manual intervention. New data finds its place seamlessly, so you can focus on insights, not maintenance.',
  },
  {
    key: 'integrations',
    title: 'Integrations that feel natural',
    description:
      'Treat your tools like first class citizens, not just data sources. Integrate them directly into your models',
  },
  {
    key: 'views',
    title: 'Views that answer your questions.',
    description:
      'Filter, sort, and save custom views across your entire data model. Ask your data a question and pin the answer',
  },
  {
    key: 'tools',
    title: 'Your tools, One platform',
    description:
      'Balancing 16 tabs to make a decision is overrated. Bring your tools together in one unified platform, and get the full picture without being the integration layer yourself.',
  },
  {
    key: 'cleanliness',
    title: 'Smart enough to do its own housekeeping',
    description:
      'Avoid the headaches of messy data and let your data model maintain itself. With built-in data quality monitoring and automatic cleansing, your data stays accurate and reliable without manual effort.',
  },
] as const;

const DEFAULT_MASK: React.CSSProperties = {
  maskImage: 'linear-gradient(to bottom, black 70%, transparent)',
  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent)',
};

const ACCORDION_GRAPHICS: Record<
  string,
  { content: React.ReactNode; containerClass: string; maskStyle?: React.CSSProperties }
> = {
  'cross-domain': {
    content: <InterconnectionDiagram className="absolute inset-0 h-full w-full px-4" />,
    containerClass: 'aspect-[4/3]',
  },
  'identity-matching': {
    content: <IdentityMatchingDiagram className="absolute inset-0 h-full w-full px-4" />,
    containerClass: 'aspect-[4/3]',
  },
  integrations: {
    content: <IntegrationsDiagram className="absolute inset-0 h-full w-full px-4" />,
    containerClass: 'aspect-[4/3]',
  },
  views: {
    content: <QueryBuilderGraphic className="origin-top-left scale-[0.65]" />,
    containerClass: 'min-h-[20rem] pl-4',
  },
  tools: {
    content: <IntegrationGraphDiagram className="absolute inset-0 h-full w-full" />,
    containerClass: 'aspect-[4/3]',
  },
  cleanliness: {
    content: <DataCleanlinessGraphic className="scale-80" />,
    containerClass: 'min-h-[28rem]',
    maskStyle: {
      maskImage: 'linear-gradient(to bottom, black 55%, rgba(0,0,0,0.4) 80%, transparent 100%)',
      WebkitMaskImage:
        'linear-gradient(to bottom, black 55%, rgba(0,0,0,0.4) 80%, transparent 100%)',
    },
  },
};

export const DataModelFeatureCarousel = () => {
  const isMobile = useIsMobile('lg');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
          className="relative"
          key="cross-domain"
          area="cross-domain"
          title="Cross domain business intelligence"
          description="Link entities, create associations and generate power insights and pattern recognition capabilities"
        >
          <div className="relative h-full w-full overflow-hidden max-md:mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <InterconnectionDiagram className="absolute inset-0 h-full w-full max-md:left-1/2 max-md:w-[280%] max-md:-translate-x-1/2 md:static md:h-full md:w-full" />
          </div>
        </BentoCard>,
        <BentoCard
          key="identity-matching"
          area="identity-matching"
          title="New data finds its place automatically"
          description="Automatic entity resolution and identity matching means your data model stays up to date without manual intervention. New data finds its place seamlessly, so you can focus on insights, not maintenance."
        >
          <div className="relative h-full w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <IdentityMatchingDiagram className="absolute inset-0 w-[110%] md:top-1/6 lg:w-[120%]" />
          </div>
        </BentoCard>,

        <BentoCard
          className="relative"
          key="integration"
          area="integration"
          title="Integrations that feel natural"
          description="Treat your tools like first class citizens, not just data sources. Integrate them directly into your models"
        >
          <div className="relative h-full w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <IntegrationsDiagram className="absolute inset-0 h-full w-full max-md:left-1/2 max-md:w-[250%] max-md:-translate-x-1/2 md:static md:h-full md:w-full" />
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
            style={FADE_EDGE_MASK}
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
            <IntegrationGraphDiagram className="absolute inset-0 h-full w-full max-md:left-1/2 max-md:w-[140%] max-md:-translate-x-1/2 md:translate-x-0" />
          </div>
        </BentoCard>,
        <BentoCard
          key="cleanliness"
          area="cleanliness"
          title="Keep your data clean without lifting a finger"
          description="Avoid the headaches of messy data and let your data model maintain itself. With built-in data quality monitoring and automatic cleansing, your data stays accurate and reliable without manual effort."
          className="max-h-140 overflow-hidden pb-0 lg:max-h-120"
        >
          <div className="relative h-full w-full overflow-hidden" style={FADE_EDGE_MASK}>
            <DataCleanlinessGraphic className="static inset-0 left-1/2 w-full origin-top-right scale-75 md:scale-90 lg:translate-x-1/3 lg:scale-100" />
          </div>
        </BentoCard>,
      ],
    },
  ];

  return (
    <section className="mx-4 sm:mx-12 md:mx-0">
      {/* Desktop: bento grid carousel — only mounted when not mobile to avoid SVG ID collisions */}
      {(!mounted || !isMobile) && (
        <div className={mounted ? undefined : 'hidden lg:block'}>
          <BentoCarousel slides={slides} />
        </div>
      )}

      {/* Mobile / Tablet: stacked accordion, all panels open */}
      {(!mounted || isMobile) && (
        <AnimateOnMountContext.Provider value={true}>
          <div className={cn('', !mounted && 'lg:hidden')}>
            <Accordion type="multiple" defaultValue={ACCORDION_ITEMS.map((item) => item.key)}>
              {ACCORDION_ITEMS.map((item) => {
                const graphic = ACCORDION_GRAPHICS[item.key];
                return (
                  <AccordionItem
                    key={item.key}
                    value={item.key}
                    className="border-b border-background/10 last:border-b-0"
                  >
                    <AccordionTrigger className="px-4 py-5 text-lg font-medium text-background/70 hover:text-background hover:no-underline data-[state=open]:text-background [&>svg]:text-background/40">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-4 px-4 text-sm leading-relaxed text-background/60">
                        {item.description}
                      </p>
                      <div
                        className={cn(
                          'relative w-full overflow-hidden rounded-xl',
                          graphic.containerClass,
                        )}
                        style={graphic.maskStyle ?? DEFAULT_MASK}
                      >
                        {graphic.content}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </AnimateOnMountContext.Provider>
      )}
    </section>
  );
};
