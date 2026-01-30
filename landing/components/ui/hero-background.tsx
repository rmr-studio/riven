import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeroBackgroundProps {
  className?: string;
  lightImage: {
    avif: string;
    webp: string;
  };
  darkImage: {
    avif: string;
    webp: string;
  };
  alt?: string;
}

export function HeroBackground({
  className,
  lightImage,
  darkImage,
  alt = "Background image",
}: HeroBackgroundProps) {
  return (
    <div className={cn("absolute inset-0 -z-10", className)}>
      <picture className="">
        <source srcSet={darkImage.avif} type="image/avif" />
        <source srcSet={darkImage.webp} type="image/webp" />
        <Image
          src={darkImage.webp}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover invert dark:invert-0 opacity-70 dark:opacity-100 transition-all"
        />
      </picture>

      {/* Gradient fade to background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
