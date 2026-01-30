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
      {/* Light mode image */}
      <picture className="dark:hidden">
        <source srcSet={lightImage.avif} type="image/avif" />
        <source srcSet={lightImage.webp} type="image/webp" />
        <Image
          src={lightImage.webp}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </picture>
      {/* Dark mode image */}
      <picture className="hidden dark:block">
        <source srcSet={darkImage.avif} type="image/avif" />
        <source srcSet={darkImage.webp} type="image/webp" />
        <Image
          src={darkImage.webp}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </picture>
    </div>
  );
}
