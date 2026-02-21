import { ChatResponseGraphic } from '../components/graphic/1.chat-response';
import { SubAgentsDiagram } from '../components/graphic/2.sub-agents';
import { ContextDiagram } from '../components/graphic/3.context';
import { PatternsDiagram } from '../components/graphic/4.patterns';

export interface KnowledgeLayerSectionContent {
  title: React.ReactNode;
  description: string;
  content: React.ReactNode;
}

export const knowledgeScrollContent: KnowledgeLayerSectionContent[] = [
  {
    title: <div className="">Ask anything about your business.</div>,
    description:
      'Query your entire data ecosystem in natural language. No exports, no cross-referencing, no spreadsheets. Ask a question that spans customers, revenue, support, and product usage — and get an answer in seconds. The kind of answer that used to take a morning now takes a sentence.',
    content: <ChatResponseGraphic className="translate-x-8 scale-100" />,
  },
  {
    title: <div className="">Agents that watch what you cannot.</div>,
    description:
      'Define what matters in your own words. Scope it to the entities you care about. Riven monitors continuously across every connected data source — interactions, support history, usage patterns, payment signals — and flags what matches before it becomes a problem you hear about from a customer.',
    content: (
      <SubAgentsDiagram className="translate-x-8 -translate-y-24 scale-80 md:translate-y-0 md:scale-100" />
    ),
  },
  {
    title: <div className="">Patterns hiding in plain sight.</div>,
    description:
      "Riven doesn't wait for you to ask the right question. It continuously analyses across your connected data and surfaces correlations, risks, and trends that no single tool could see — because no single tool has ever had the full picture.",
    content: <PatternsDiagram className="translate-x-8 scale-80 md:scale-100" />,
  },

  {
    title: <div className="">Context that compounds</div>,
    description:
      "Every entity, relationship, and interaction carries meaning that Riven understands. As your data grows, the knowledge layer doesn't just store more — it connects more. New data automatically enriches what came before. The longer you operate, the sharper the intelligence becomes.",
    content: (
      <ContextDiagram className="translate-x-8 scale-100" />
    ),
  },
];
