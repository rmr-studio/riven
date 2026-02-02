"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeroBackgroundProps {
  className?: string;
  image: {
    avif: string;
    webp: string;
  };
  alt?: string;
}

export function HeroBackground({
  className,
  image,
  alt = "Background image",
}: HeroBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("absolute inset-x-0 bottom-0 -z-10", className)}>
      <picture>
        <source srcSet={image.avif} type="image/avif" />
        <source srcSet={image.webp} type="image/webp" />
        <Image
          src={image.webp}
          alt={alt}
          fill
          sizes="100vw"
          className={cn(
            "object-cover object-bottom invert dark:invert-0 transition-opacity duration-700 ease-out",
            isLoaded ? "opacity-80" : "opacity-0",
          )}
          onLoad={() => setIsLoaded(true)}
        />
      </picture>

      {/* Gradient fade upward to background */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
      <div className="absolute inset-0 bg-linear-to-t from-transparent via-background/50 to-background" />
    </div>
  );
}
