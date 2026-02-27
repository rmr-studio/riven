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
          avif: [
            { src: 'images/hero/city-skyline-hero-640w.avif', width: 640 },
            { src: 'images/hero/city-skyline-hero-1280w.avif', width: 1280 },
            { src: 'images/hero/city-skyline-hero-1920w.avif', width: 1920 },
            { src: 'images/hero/city-skyline-hero-3840w.avif', width: 3840 },
          ],
          webp: [
            { src: 'images/hero/city-skyline-hero-640w.webp', width: 640 },
            { src: 'images/hero/city-skyline-hero-1280w.webp', width: 1280 },
            { src: 'images/hero/city-skyline-hero-1920w.webp', width: 1920 },
            { src: 'images/hero/city-skyline-hero-3840w.webp', width: 3840 },
          ],
        }}
        className="h-[50svh] opacity-40 md:h-[70svh] md:opacity-70"
        alt="City skyline"
        priority
      />
    </Section>
  );
}
