import React from "react";
import { WaitlistForm } from "@/components/waitlist-form";

export const HeroCopy = () => {
  return (
    <div className="flex-1 space-y-6">
      {/* Headline - HERO-01: 8 words or fewer, bold value prop */}
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
        The one workspace
      </h1>
      <span className="text-primary">that scales with you</span>

      {/* Subheadline - HERO-02: Who it's for + problem solved */}
      <p className="text-lg text-muted-foreground md:text-xl lg:text-2xl">
        Stop contorting your workflows to fit rigid tools. Riven adapts to how
        you actually work, not the other way around.
      </p>

      {/* Form - HERO-03 through HERO-07 */}
      <div className="mt-4">
        <WaitlistForm />
        <p className="mt-3 text-sm text-muted-foreground">
          Join the waitlist for early access. No spam, ever.
        </p>
      </div>
    </div>
  );
};
