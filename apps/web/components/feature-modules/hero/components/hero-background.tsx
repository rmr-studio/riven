'use client';

import { useMounted } from '@/hooks/use-mounted';
import { cdnImageLoader, getCdnUrl } from '@/lib/cdn-image-loader';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import Image from 'next/image';
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
  const [isLoaded, setIsLoaded] = useState(false);
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

  return (
    <div className={cn('absolute inset-x-0 bottom-1/6 z-0', className)}>
      <picture className="relative block h-full w-full">
        <source srcSet={buildSrcSet(image.avif)} type="image/avif" sizes="100vw" />
        <source srcSet={buildSrcSet(image.webp)} type="image/webp" sizes="100vw" />
        <Image
          loader={cdnImageLoader}
          src={image.webp[image.webp.length - 1].src}
          alt={alt}
          fill
          priority={priority}
          loading={lazy ? 'lazy' : undefined}
          sizes="100vw"
          className={cn(
            'object-cover object-bottom transition-opacity duration-700 ease-out',
            isLoaded ? 'opacity-100' : 'opacity-0',
          )}
          style={filterParts.length > 0 ? { filter: filterParts.join(' ') } : undefined}
          onLoad={() => setIsLoaded(true)}
        />
      </picture>

      {/* Gradient fade upward to background */}

      <>
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />

        <div className="absolute inset-0 bg-linear-to-t from-transparent via-transparent to-background" />
      </>
    </div>
  );
}
