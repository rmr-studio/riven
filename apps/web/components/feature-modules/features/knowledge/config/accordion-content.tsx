import { IntegrationGraphDiagram } from '../../data-model/components/graphic/4.integrations';
import { TemplateCarouselGraphic } from '../../data-model/components/graphic/7.templates';
import { EntityLinkingDiagram } from '../../data-model/components/graphic/entity-linking';
import { ChatResponseGraphic } from '../components/graphic/1.chat-response';
import { SubAgentsDiagram } from '../components/graphic/2.sub-agents';
import { PatternsDiagram } from '../components/graphic/4.patterns';

export interface KnowledgeLayerSectionContent {
  title: React.ReactNode;
  description: string;
  content: React.ReactNode;
}

export const FEATURE_CONTENT: KnowledgeLayerSectionContent[] = [
  {
    title: <div className="">All your tools. Unified</div>,
    description:
      'Query your entire data ecosystem in natural language. No exports, no cross-referencing, no spreadsheets. Ask a question that spans customers, revenue, support, and product usage — and get an answer in seconds. The kind of answer that used to take a morning now takes a sentence.',
    content: <IntegrationGraphDiagram className="scale-80" />,
  },
  {
    title: <div className="">Understand your data. Ask anything.</div>,
    description:
      'Query your entire data ecosystem in natural language. No exports, no cross-referencing, no spreadsheets. Ask a question that spans customers, revenue, support, and product usage — and get an answer in seconds. The kind of answer that used to take a morning now takes a sentence.',
    content: (
      <ChatResponseGraphic className="mx-auto translate-x-8 translate-y-12 sm:translate-x-24 sm:scale-120 xl:translate-x-48 xl:scale-130" />
    ),
  },
  {
    title: <div className="">Create agents that watch what you cannot.</div>,
    description:
      'Define what matters in your own words. Scope it to the entities you care about. Riven monitors continuously across every connected data source — interactions, support history, usage patterns, payment signals — and flags what matches before it becomes a problem you hear about from a customer.',
    content: (
      <SubAgentsDiagram className="mx-auto translate-x-8 translate-y-12 scale-110 sm:translate-x-48 sm:scale-125 xl:translate-x-64 xl:scale-140" />
    ),
  },
  {
    title: <div className="">Unveil patterns hiding in plain sight.</div>,
    description:
      "Riven doesn't wait for you to ask the right question. It continuously analyses across your connected data and surfaces correlations, risks, and trends that no single tool could see — because no single tool has ever had the full picture.",
    content: (
      <div>
        <PatternsDiagram className="scalee-120 translate-x-12 translate-y-12 sm:translate-x-48 sm:scale-130 lg:scale-140 xl:translate-x-64 xl:scale-180" />
      </div>
    ),
  },
  {
    title: <div className="">New data finds its home automatically</div>,
    description:
      'Automatic entity resolution and identity matching means your data model stays up to data without manual Inverstion. New data synced is connected and linked to existing entities across your ecosystem.',
    content: (
      <>
        <EntityLinkingDiagram className="mx-auto translate-x-8 translate-y-12 sm:translate-x-48 sm:scale-130 xl:scale-130" />
      </>
    ),
  },
  {
    title: <div className="">Build your ecosystem in minutes</div>,
    description:
      'Start with a template built for your business type. Each one comes pre-loaded with entity types, attributes, and relationships — ready to connect your tools and start querying in minutes, not months.',
    content: (
      <TemplateCarouselGraphic className="translate-y-8 scale-110 sm:translate-x-16 md:translate-y-0 md:scale-100 lg:scale-120" />
    ),
  },
];
