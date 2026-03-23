'use client';

import { ChurnRetrospective } from '@/components/feature-modules/churn-retrospective/churn-retro';
import { ConnectedEcosystem } from '@/components/feature-modules/connected-ecosystem/components/ecosystem-section';
import { FeaturesOverview } from '@/components/feature-modules/features/components/feature-overview';
import { DashboardShowcase } from '@/components/feature-modules/hero/components/dashboard/dashboard-showcase';
import { Hero } from '@/components/feature-modules/hero/components/hero';
import dynamic from 'next/dynamic';

const CrossDomainIntelligence = dynamic(() =>
  import('@/components/feature-modules/cross-domain-intelligence/cross-domain-section').then(
    (m) => m.CrossDomainIntelligence,
  ),
);
const TimeSaved = dynamic(() =>
  import('@/components/feature-modules/time-saved/components/time-saved').then((m) => m.TimeSaved),
);
const Faq = dynamic(() =>
  import('@/components/feature-modules/faq/components/faq').then((m) => m.Faq),
);

const Waitlist = dynamic(() =>
  import('@/components/feature-modules/waitlist/components/waitlist').then((m) => m.Waitlist),
);

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Hero />
      <DashboardShowcase />
      <ConnectedEcosystem />
      <TimeSaved />
      <CrossDomainIntelligence />
      <ChurnRetrospective />
      <FeaturesOverview />
      <Faq />
      <Waitlist />
    </main>
  );
}
