"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  /** Width of the logo in pixels (height auto-scales to maintain aspect ratio) */
  size?: number | string;
  /** Tailwind `text-*` class to control the primary (gold) color via currentColor */
  primaryClassName?: string;
  /** Tailwind `fill-*` class to control the secondary (background) color */
  secondaryClassName?: string;
}

const PRIMARY_PATHS = {
  topTriangle: "M58 0L83.9807 44.8576L32.0193 44.8576Z",
  bottomTriangle: "M59 124.81L33.0193 79.9525L84.9807 79.9525Z",
  leftUpperTriangle: "M27.5 23L51.3157 67.8576L3.6843 67.8576Z",
  rightUpperTriangle: "M87.5 23L111.3157 67.8576L63.6843 67.8576Z",
} as const;

const SECONDARY_PATHS = {
  leftLowerTriangle: "M27.5 115L3.6843 70.1424L51.3157 70.1424Z",
  rightLowerTriangle: "M87.5 114L63.6843 69.1424L111.3157 69.1424Z",
  horizontalBar: "M29 67.85H112V70.15H29V67.85Z",
} as const;

export function Logo({
  size = 32,
  className,
  primaryClassName = "text-[#D3C79B]",
  secondaryClassName = "fill-[#393838]",
  ...props
}: LogoProps) {
  const maskId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 122 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      className={cn(primaryClassName, className)}
      {...props}
    >
      <defs>
        {/* Mask that cuts out secondary shape areas from primary triangles */}
        <mask id={maskId}>
          <rect width="122" height="128" fill="white" />
          <path d={SECONDARY_PATHS.leftLowerTriangle} fill="black" />
          <path d={SECONDARY_PATHS.rightLowerTriangle} fill="black" />
          <ellipse cx="59" cy="65" rx="30" ry="30" fill="black" />
          <path d={SECONDARY_PATHS.horizontalBar} fill="black" />
        </mask>
      </defs>
      Primary shapes (gold triangles) — masked so secondary areas cut through
      <g fill="currentColor" mask={`url(#${maskId})`}>
        <path d={PRIMARY_PATHS.topTriangle} />
        <path d={PRIMARY_PATHS.bottomTriangle} />
        <path d={PRIMARY_PATHS.leftUpperTriangle} />
        <path d={PRIMARY_PATHS.rightUpperTriangle} />
      </g>
      {/* Secondary shapes (background-colored) */}
      <g className={secondaryClassName}>
        <path d={SECONDARY_PATHS.leftLowerTriangle} />
        <path d={SECONDARY_PATHS.rightLowerTriangle} />

        <path d={SECONDARY_PATHS.horizontalBar} />
      </g>
      {/* Gold outlines on secondary shapes */}
      <g style={{ fill: "none" }} stroke="currentColor" strokeWidth="2">
        <path d={SECONDARY_PATHS.leftLowerTriangle} />
        <path d={SECONDARY_PATHS.rightLowerTriangle} />
        <ellipse cx="59" cy="65" rx="30" ry="30" />
      </g>
      <g className={secondaryClassName}>
        <ellipse cx="59" cy="65" rx="30" ry="30" />
      </g>
    </svg>
  );
}
