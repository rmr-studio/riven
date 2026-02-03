import { HeroBackground } from "@/components/feature-modules/hero/components/hero-background";
import { HeroCopy } from "./hero-copy";
import { HeroProductPreview } from "./hero-product-preview";
import { BGPattern } from "@/components/ui/background/grids";

export function Hero() {
  return (
    <section className="relative h-screen pt-48">
      <HeroCopy />
      <HeroBackground
        image={{
          avif: "/images/city-skyline-hero-dark.avif",
          webp: "/images/city-skyline-hero-dark.webp",
        }}
        className="h-[80dvh]"
        alt="City skyline"
        fade
      />
      <BGPattern
        variant="grid"
        mask="fade-edges"
        className="opacity-15"
        size={8}
      />
      <HeroBackground
        image={{
          avif: "/images/city-skyline-foreground.avif",
          webp: "/images/city-skyline-foreground.webp",
        }}
        className="h-[80dvh] opacity-30"
        alt="City skyline"
      />
    </section>
  );
}
