import { Hero } from "@/components/feature-modules/hero/components/hero";
import { PainPoints } from "@/components/sections/pain-points";
import { Features } from "@/components/sections/features";
import { FinalCTA } from "@/components/sections/final-cta";
import { Footer } from "@/components/footer";
import { FeaturesCarousel } from "@/components/sections/features-carousel";
import { DataModelShowcase } from "@/components/sections/data-model-showcase";
import { Navbar } from "@/components/navbar";
import { BGPattern } from "@/components/ui/background/grids";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <Hero />
      <PainPoints />
      <Features />
      <FeaturesCarousel />
      <DataModelShowcase />
      <FinalCTA />
      <Footer />
    </main>
  );
}
