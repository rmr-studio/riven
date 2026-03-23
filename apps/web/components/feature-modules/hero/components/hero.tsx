'use client';

import { BGPattern } from '@/components/ui/background/grids';
import { ShaderContainer } from '@/components/ui/shader-container';
import { ProductShowcaseGraphic } from '../../product-showcase/components/product-showcase';
import { HeroCopy } from './hero-copy';

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden py-16 pt-20! md:py-24 lg:px-12 lg:py-32">
      {/* Dot pattern — visible at top, fades out toward middle */}
      <BGPattern
        variant="dots"
        size={12}
        fill="color-mix(in srgb, var(--foreground) 40%, transparent)"
        mask="none"
        className="z-20"
        style={{
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%), linear-gradient(to bottom, black 0%, black 40%, transparent 65%)',
          maskComposite: 'intersect',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%), linear-gradient(to bottom, black 0%, black 40%, transparent 65%)',
          WebkitMaskComposite: 'source-in' as string,
        }}
      />

      <HeroCopy />

      <ShaderContainer className="z-50 mt-10 ml-4 rounded-lg rounded-r-none px-8 py-16 sm:ml-8 lg:ml-0 lg:rounded-r-lg">
        <ProductShowcaseGraphic />
      </ShaderContainer>
    </section>
  );
}
