import React from "react";

export const BorderWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative mt-48 ">
      {/* Border frame + tails — centered behind content */}
      <div className="pointer-events-none absolute inset-0 z-0 flex justify-center">
        <div className="relative w-full">
          {/* Top tail — fades in from transparent */}
          <div className="absolute left-1/5 -top-82 h-82 w-[60px] bg-gradient-to-b from-transparent via-primary/20 to-primary/80" />

          {/* Border rectangle */}
          <div className="absolute inset-0 border-[60px] rounded-md border-primary/50 shadow" />

          {/* Bottom tail — fades out to transparent */}
          <div className="absolute left-1/2 -bottom-[140px] h-[140px] w-[60px] -translate-x-1/2 bg-gradient-to-b from-foreground/80 to-transparent" />
        </div>
      </div>

      {/* Content — rendered on top */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
};
