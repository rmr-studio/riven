'use client';

import { useMounted } from '@/hooks/use-mounted';
import { getCdnUrl } from '@/lib/cdn-image-loader';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useState } from 'react';

interface ImageVariant {
  src: string;
  width: number;
}

interface HeroBackgroundProps {
  className?: string;
  fade?: boolean;
  glow?: boolean;
  image: {
    avif: ImageVariant[];
    webp: ImageVariant[];
  };
  alt?: string;
  priority?: boolean;
  lazy?: boolean;
}

function buildSrcSet(variants: ImageVariant[]): string {
  return variants.map((v) => `${getCdnUrl(v.src)} ${v.width}w`).join(', ');
}

export function HeroBackground({
  className,
  image,
  fade,
  glow,
  alt = 'Background image',
  priority,
  lazy,
}: HeroBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(priority ? true : false);
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const shouldInvert = mounted && resolvedTheme !== 'dark';

  const filterParts: string[] = [];
  if (shouldInvert) filterParts.push('invert(1)');
  if (glow) {
    filterParts.push(
      'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))',
      'drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))',
      'drop-shadow(0 -4px 32px rgba(56, 189, 248, 0.2))',
    );
  }

  // Build the fallback src from the smallest webp variant
  const fallbackSrc = getCdnUrl(image.webp[0].src);

  return (
    <>
      <div className={cn('absolute inset-x-0 z-0', className)}>
        <picture className="relative block h-full w-full">
          <source srcSet={buildSrcSet(image.avif)} type="image/avif" sizes="100vw" />
          <source srcSet={buildSrcSet(image.webp)} type="image/webp" sizes="100vw" />
          <img
            alt={alt}
            src={fallbackSrc}
            sizes="100vw"
            fetchPriority={priority ? 'high' : undefined}
            decoding={priority ? 'sync' : 'async'}
            loading={lazy ? 'lazy' : undefined}
            className={cn(
              'absolute inset-0 h-full w-full object-cover object-bottom 2xl:object-[center_35%]',
              priority
                ? 'opacity-100'
                : cn(
                    'transition-opacity duration-700 ease-out',
                    isLoaded ? 'opacity-100' : 'opacity-0',
                  ),
            )}
            style={filterParts.length > 0 ? { filter: filterParts.join(' ') } : undefined}
            onLoad={priority ? undefined : () => setIsLoaded(true)}
          />
        </picture>

        <>
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
          <div className="absolute inset-0 bg-linear-to-t from-transparent via-transparent to-background" />
        </>
      </div>
      {/* Horizontal colour wash — cool blue (left) → warm rose (right) */}

      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-0',
          isLoaded && 'animate-[fade-wash_0.8s_ease-out_0.6s_forwards]',
        )}
        aria-hidden="true"
        style={{
          background: 'linear-gradient(to right, oklch(0.6 0.15 250), oklch(0.6 0.15 15))',
          mixBlendMode: 'soft-light',
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
        }}
      />
    </>
  );
}
