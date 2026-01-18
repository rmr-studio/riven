import { WaitlistForm } from "@/components/waitlist-form";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center">
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Copy + Form */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            {/* Headline - HERO-01: 8 words or fewer, bold value prop */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Build a CRM that{" "}
              <span className="text-primary">fits your business</span>
            </h1>

            {/* Subheadline - HERO-02: Who it's for + problem solved */}
            <p className="text-lg text-muted-foreground sm:text-xl max-w-xl mx-auto lg:mx-0">
              Stop contorting your workflows to fit rigid tools. Riven adapts to
              how you actually work, not the other way around.
            </p>

            {/* Form - HERO-03 through HERO-07 */}
            <div className="mt-4">
              <WaitlistForm className="max-w-md mx-auto lg:mx-0" />
              <p className="mt-3 text-sm text-muted-foreground">
                Join the waitlist for early access. No spam, ever.
              </p>
            </div>
          </div>

          {/* Right: Product Visual - HERO-08 */}
          <div className="relative">
            {/* Placeholder for product mockup/visual */}
            <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-border flex items-center justify-center">
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
        </div>
      </div>
    </section>
  );
}
