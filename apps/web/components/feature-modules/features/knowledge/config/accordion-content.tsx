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
    content: <ChatResponseGraphic className="translate-x-8 scale-100" />,
  },
  {
    title: <div className="">New data finds its home automatically</div>,
    description:
      'Query your entire data ecosystem in natural language. No exports, no cross-referencing, no spreadsheets. Ask a question that spans customers, revenue, support, and product usage — and get an answer in seconds. The kind of answer that used to take a morning now takes a sentence.',
    content: <ChatResponseGraphic className="translate-x-8 scale-100" />,
  },
  {
    title: <div className="">Build your ecosystem in minutes</div>,
    description:
      'Query your entire data ecosystem in natural language. No exports, no cross-referencing, no spreadsheets. Ask a question that spans customers, revenue, support, and product usage — and get an answer in seconds. The kind of answer that used to take a morning now takes a sentence.',
    content: <ChatResponseGraphic className="translate-x-8 scale-100" />,
  },
  {
    title: <div className="">Understand your data. Ask anything.</div>,
    description:
      'Query your entire data ecosystem in natural language. No exports, no cross-referencing, no spreadsheets. Ask a question that spans customers, revenue, support, and product usage — and get an answer in seconds. The kind of answer that used to take a morning now takes a sentence.',
    content: <ChatResponseGraphic className="translate-x-8 scale-100" />,
  },
  {
    title: <div className="">Create agents that watch what you cannot.</div>,
    description:
      'Define what matters in your own words. Scope it to the entities you care about. Riven monitors continuously across every connected data source — interactions, support history, usage patterns, payment signals — and flags what matches before it becomes a problem you hear about from a customer.',
    content: <SubAgentsDiagram className="translate-x-8 scale-90 md:translate-y-0 md:scale-100" />,
  },
  {
    title: <div className="">Unveil patterns hiding in plain sight.</div>,
    description:
      "Riven doesn't wait for you to ask the right question. It continuously analyses across your connected data and surfaces correlations, risks, and trends that no single tool could see — because no single tool has ever had the full picture.",
    content: <PatternsDiagram className="translate-x-8 scale-80 md:scale-100" />,
  },
];
