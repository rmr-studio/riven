import { HeroBackground } from '@/components/feature-modules/hero/components/hero-background';
import { Section } from '@/components/ui/section';
import { HeroCopy } from './hero-copy';

export function Hero() {
  return (
    <Section
      className="h-screen py-0! pt-20!"
      fill="color-mix(in srgb, var(--primary) 10%, transparent)"
      gridClassName="z-20"
    >
      <HeroCopy />
      <HeroBackground
        image={{
          avif: 'images/city-skyline-hero.avif',
          webp: 'images/city-skyline-hero.webp',
        }}
        className="h-[70dvh]"
        alt="City skyline"
        preload
      />

      <HeroBackground
        image={{
          avif: 'images/hero-skyline-foreground-layer.avif',
          webp: 'images/hero-skyline-foreground-layer.webp',
        }}
        className="hidden h-[70dvh] opacity-30 md:block"
        alt="City skyline"
        lazy
      />
    </Section>
  );
}
