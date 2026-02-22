import { Faq } from '@/components/feature-modules/faq/components/faq';
import { DataModel } from '@/components/feature-modules/features/data-model/components/data-model';
import { RivenDefinition } from '@/components/feature-modules/features/data-model/components/riven-definition';
import { KnowledgeLayer } from '@/components/feature-modules/features/knowledge/components/knowledge-layer';
import { Hero } from '@/components/feature-modules/hero/components/hero';
import { OpenSource } from '@/components/feature-modules/open-source/components/open-source';
import { Waitlist } from '@/components/feature-modules/waitlist/components/waitlist';
import { SectionDivider } from '@/components/ui/section-divider';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <SectionDivider name="One Unified Data Ecosystem" />
      <RivenDefinition />
      <DataModel />
      <KnowledgeLayer />
      <Faq />
      <OpenSource />
      <Waitlist />
    </main>
  );
}
