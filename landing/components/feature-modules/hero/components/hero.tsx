import { WaitlistForm } from "@/components/waitlist-form";
import { HeroBackground } from "@/components/feature-modules/hero/components/hero-background";
import { HeroCopy } from "./hero-copy";
import { HeroProductPreview } from "./hero-product-preview";
import { BGPattern } from "@/components/ui/background/grids";

export function Hero() {
  return (
    <section className="relative h-screen flex items-center pt-20">
      <HeroBackground
        image={{
          avif: "/images/city-skyline-hero-dark.avif",
          webp: "/images/city-skyline-hero-dark.webp",
        }}
        className="h-[80dvh]"
        alt="City skyline"
      />
      <BGPattern
        variant="grid"
        mask="fade-edges"
        className="opacity-15"
        size={8}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:px-8 md:py-16 lg:px-12 lg:py-24">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12 lg:gap-16">
          <HeroCopy />
          <HeroProductPreview />
        </div>
      </div>
    </section>
  );
}
