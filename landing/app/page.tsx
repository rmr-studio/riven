import { Hero } from "@/components/sections/hero";
import { PainPoints } from "@/components/sections/pain-points";
import { Features } from "@/components/sections/features";
import { FinalCTA } from "@/components/sections/final-cta";
import { Footer } from "@/components/footer";
import { FeaturesCarousel } from "@/components/sections/features-carousel";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <PainPoints />
      <Features />
      <FeaturesCarousel />
      <FinalCTA />
      <Footer />
    </main>
  );
}
