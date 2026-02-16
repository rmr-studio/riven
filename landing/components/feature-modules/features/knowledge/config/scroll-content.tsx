import { AutoLabelling } from '../components/diagrams/auto-labelling';
import { MorningBriefing } from '../components/diagrams/morning-briefing';
import { KnowledgeScrollItem } from '../types';

export const knowledgeScrollContent: KnowledgeScrollItem[] = [
  {
    title: (
      <div className="">
        Start every day knowing <span className="text-edit">what matters.</span>
      </div>
    ),
    description:
      "Riven serves you a morning briefing that summarises crucial messages and action items. Whether it's the urgent client request or time-sensitive approval, you'll see it in order of what needs your attention first.",
    content: <MorningBriefing />,
  },
  {
    title: (
      <>
        Conversations are auto-labelled according to{' '}
        <span className="text-emerald-400">topics.</span>
      </>
    ),
    description:
      'By learning the context of your conversations across different platforms, Riven automatically labels every message with a relevant topic. No need to manually organise.',
    content: <AutoLabelling />,
  },
];
