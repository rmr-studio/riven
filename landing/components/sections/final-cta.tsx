import { WaitlistForm } from "@/components/waitlist-form";

export function FinalCTA() {
  return (
    <section className="px-4 py-12 md:px-8 md:py-16 lg:px-12 lg:py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Ready to build a CRM that fits?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join the waitlist and be first to try Riven.
          </p>
          <div className="mt-8">
            <WaitlistForm className="max-w-md mx-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}
