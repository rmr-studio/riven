"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface HeroBackgroundProps {
  className?: string;
  fade?: boolean;
  glow?: boolean;
  image: {
    avif: string;
    webp: string;
  };
  alt?: string;
}

export function HeroBackground({
  className,
  image,
  fade,
  glow,
  alt = "Background image",
}: HeroBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldInvert = mounted && resolvedTheme !== "dark";

  const filterParts: string[] = [];
  if (shouldInvert) filterParts.push("invert(1)");
  if (glow) {
    filterParts.push(
      "drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))",
      "drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))",
      "drop-shadow(0 -4px 32px rgba(56, 189, 248, 0.2))",
    );
  }

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
            "object-cover object-bottom transition-opacity duration-700 ease-out",
            isLoaded ? "opacity-40" : "opacity-0",
          )}
          style={
            filterParts.length > 0
              ? { filter: filterParts.join(" ") }
              : undefined
          }
          onLoad={() => setIsLoaded(true)}
        />
      </picture>

      {/* Gradient fade upward to background */}

      <>
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />

        <div className="  absolute inset-0 bg-linear-to-t from-transparent via-transparent to-background" />
      </>
    </div>
  );
}
