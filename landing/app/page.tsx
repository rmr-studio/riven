import { DataModel } from '@/components/feature-modules/features/data-model/components/data-model';
import { RivenDefinition } from '@/components/feature-modules/features/data-model/components/riven-definition';
import { KnowledgeLayer } from '@/components/feature-modules/features/knowledge/components/knowledge-layer';
import { Hero } from '@/components/feature-modules/hero/components/hero';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { Section } from '@/components/ui/section';
import { SectionDivider } from '@/components/ui/section-divider';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <Hero />
      <SectionDivider name="One Unified Data Ecosystem" />
      <RivenDefinition />
      <Section
        gridClassName="bg-foreground "
        mask="none"
        fill="color-mix(in srgb, var(--background) 40%, transparent)"
        variant="dots"
        size={12}
        navbarInverse
      >
        <DataModel />
      </Section>

      <KnowledgeLayer />

      <Footer />
    </main>
  );
}
