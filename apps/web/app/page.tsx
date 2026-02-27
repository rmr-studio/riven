import { Hero } from '@/components/feature-modules/hero/components/hero';
import dynamic from 'next/dynamic';

const FeaturesOverview = dynamic(() =>
  import('@/components/feature-modules/features/components/feature-overview').then(
    (m) => m.FeaturesOverview,
  ),
);
const CrossDomainIntelligence = dynamic(() =>
  import('@/components/feature-modules/cross-domain-intelligence/cross-domain-section').then(
    (m) => m.CrossDomainIntelligence,
  ),
);
const TimeSaved = dynamic(() =>
  import('@/components/feature-modules/time-saved/components/time-saved').then(
    (m) => m.TimeSaved,
  ),
);
const Faq = dynamic(() =>
  import('@/components/feature-modules/faq/components/faq').then((m) => m.Faq),
);
const OpenSource = dynamic(() =>
  import('@/components/feature-modules/open-source/components/open-source').then(
    (m) => m.OpenSource,
  ),
);
const Waitlist = dynamic(() =>
  import('@/components/feature-modules/waitlist/components/waitlist').then((m) => m.Waitlist),
);

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <FeaturesOverview />
      <CrossDomainIntelligence />
      <TimeSaved />
      <Faq />
      <OpenSource />
      <Waitlist />
    </main>
  );
}
