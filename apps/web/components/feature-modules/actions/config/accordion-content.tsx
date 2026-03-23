import { EntityLinkingDiagram } from '../components/diagrams/entity-linking';
import { ChatResponseGraphic } from '../components/diagrams/knowledge-chat';

export interface KnowledgeLayerSectionContent {
  title: React.ReactNode;
  description: string;
  content: React.ReactNode;
}

export const ACTION_CONTENT: KnowledgeLayerSectionContent[] = [
  {
    title: <div className="">Understand your data. Ask anything.</div>,
    description:
      'Query your entire data ecosystem in natural language. No exports, no cross-referencing, no spreadsheets. Ask a question that spans customers, revenue, support, and product usage — and get an answer in seconds. The kind of answer that used to take a morning now takes a sentence.',
    content: (
      <ChatResponseGraphic className="mx-auto translate-x-8 translate-y-12 sm:translate-x-24 sm:scale-120 xl:translate-x-48 xl:scale-130" />
    ),
  },

  {
    title: <div className="">New data finds its home automatically</div>,
    description:
      'Automatic entity resolution and identity matching means your data model stays up to data without manual Inverstion. New data synced is connected and linked to existing entities across your ecosystem.',
    content: (
      <>
        <EntityLinkingDiagram className="mx-auto translate-x-8 translate-y-12 sm:translate-x-48 sm:scale-130 xl:translate-x-64 xl:scale-160 3xl:translate-x-90" />
      </>
    ),
  },
];
