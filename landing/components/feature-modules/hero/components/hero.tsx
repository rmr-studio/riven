import { HeroBackground } from "@/components/feature-modules/hero/components/hero-background";
import { BGPattern } from "@/components/ui/background/grids";
import { Section } from "@/components/ui/section";
import { HeroCopy } from "./hero-copy";

export function Hero() {
  return (
    <Section
      className="h-screen pt-48!"
      fill="color-mix(in srgb, var(--primary) 10%, transparent)"
      gridClassName="z-20"
    >
      <HeroCopy />
      <HeroBackground
        image={{
          avif: "/images/city-skyline-hero-dark.avif",
          webp: "/images/city-skyline-hero-dark.webp",
        }}
        className="h-[70dvh]"
        alt="City skyline"
      />

      <HeroBackground
        image={{
          avif: "/images/city-skyline-foreground.avif",
          webp: "/images/city-skyline-foreground.webp",
        }}
        className="h-[70dvh] opacity-100 "
        alt="City skyline"
        glow
      />
    </Section>
  );
}
