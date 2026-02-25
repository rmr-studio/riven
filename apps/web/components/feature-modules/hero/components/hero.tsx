import { HeroBackground } from '@/components/feature-modules/hero/components/hero-background';
import { Section } from '@/components/ui/section';
import { HeroCopy } from './hero-copy';

export function Hero() {
  return (
    <Section
      className="h-screen w-full py-0! pt-20!"
      size={24}
      fill="color-mix(in srgb, var(--primary) 5%, transparent)"
      gridClassName="z-20"
    >
      <HeroCopy />
      <HeroBackground
        image={{
          avif: 'images/city-skyline-hero.avif',
          webp: 'images/city-skyline-hero.webp',
        }}
        className="h-[70svh] opacity-40 md:opacity-70"
        alt="City skyline"
        preload
      />
    </Section>
  );
}
