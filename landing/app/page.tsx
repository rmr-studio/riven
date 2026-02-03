import { Hero } from "@/components/feature-modules/hero/components/hero";
import { PainPoints } from "@/components/sections/pain-points";
import { Features } from "@/components/sections/features";
import { FinalCTA } from "@/components/sections/final-cta";
import { Footer } from "@/components/footer";
import { FeaturesCarousel } from "@/components/sections/features-carousel";
import { DataModelShowcase } from "@/components/feature-modules/features/data-model";
import { Navbar } from "@/components/navbar";
import { BGPattern } from "@/components/ui/background/grids";
import { DataModel } from "@/components/feature-modules/features/data-model/components/data-model";
import { Integrations } from "@/components/feature-modules/features/integrations/components/integrations";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <Hero />
      <DataModel />
      <Integrations />
      <PainPoints />
      <Features />
      <FeaturesCarousel />
      <FinalCTA />
      <Footer />
    </main>
  );
}
