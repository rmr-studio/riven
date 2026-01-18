import { WaitlistForm } from "@/components/waitlist-form";

export function FinalCTA() {
  return (
    <section className="py-20 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
