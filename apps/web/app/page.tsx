import { CrossDomainIntelligence } from '@/components/feature-modules/cross-domain-intelligence/cross-domain-section';
import { Faq } from '@/components/feature-modules/faq/components/faq';
import { FeaturesOverview } from '@/components/feature-modules/features/components/feature-overview';
import { Hero } from '@/components/feature-modules/hero/components/hero';
import { OpenSource } from '@/components/feature-modules/open-source/components/open-source';
import { TimeSaved } from '@/components/feature-modules/time-saved/components/time-saved';
import { Waitlist } from '@/components/feature-modules/waitlist/components/waitlist';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      {/* <DataModel /> */}
      <FeaturesOverview />
      <CrossDomainIntelligence />
      <TimeSaved />
      <Faq />
      <OpenSource />
      <Waitlist />
    </main>
  );
}
