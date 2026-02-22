import React from "react";

export const HeroProductPreview = () => {
  return (
    <div className="flex-1 relative md:max-w-md lg:max-w-lg">
      {/* Placeholder for product mockup/visual */}
      <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-border flex items-center justify-center backdrop-blur-sm">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            Product preview coming soon
          </p>
        </div>
      </div>

      {/* Decorative gradient blur */}
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-3xl" />
    </div>
  );
};
