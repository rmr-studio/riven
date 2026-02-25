import { Faq } from '@/components/feature-modules/faq/components/faq';
import { DataModel } from '@/components/feature-modules/features/data-model/components/data-model';
import { KnowledgeLayer } from '@/components/feature-modules/features/knowledge/components/knowledge-layer';
import { Hero } from '@/components/feature-modules/hero/components/hero';
import { OpenSource } from '@/components/feature-modules/open-source/components/open-source';
import { TimeSaved } from '@/components/feature-modules/time-saved/components/time-saved';
import { Waitlist } from '@/components/feature-modules/waitlist/components/waitlist';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <DataModel />
      <KnowledgeLayer />
      <TimeSaved />
      <Faq />
      <OpenSource />
      <Waitlist />
    </main>
  );
}
