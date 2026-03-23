import { HeroBackground } from '@/components/feature-modules/hero/components/hero-background';
import { BGPattern } from '@/components/ui/background/grids';
import { HeroCopy } from './hero-copy';

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden py-16 pt-20! sm:h-[60dvh] md:h-[85dvh] md:px-12 md:py-24 lg:py-32">
      {/* Dot pattern — visible at top, fades out toward middle */}
      <BGPattern
        variant="dots"
        size={12}
        fill="color-mix(in srgb, var(--foreground) 40%, transparent)"
        mask="none"
        className="z-20"
        style={{
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%), linear-gradient(to bottom, black 0%, black 25%, transparent 55%)',
          maskComposite: 'intersect',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%), linear-gradient(to bottom, black 0%, black 25%, transparent 55%)',
          WebkitMaskComposite: 'source-in' as string,
        }}
      />
      {/* Grid pattern — invisible at top, fades in toward bottom */}
      <BGPattern
        variant="grid"
        size={24}
        fill="color-mix(in srgb, var(--foreground) 10%, transparent)"
        mask="none"
        className="z-20"
        style={{
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%), linear-gradient(to bottom, transparent 40%, black 65%)',
          maskComposite: 'intersect',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%), linear-gradient(to bottom, transparent 40%, black 65%)',
          WebkitMaskComposite: 'source-in' as string,
        }}
      />
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
        className="bottom-0 z-0 h-[24rem] opacity-60 md:h-[max(65svh,32rem)] md:translate-y-[20%] md:opacity-40 3xl:h-[60svh] lg:dark:opacity-30"
        alt="City skyline"
      />
    </section>
  );
}
