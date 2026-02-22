import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative pt-[216px] pb-16">
      <div className="mx-auto max-w-[1060px] px-4">
        <div className="flex flex-col items-center gap-12">
          {/* Hero Content */}
          <div className="flex max-w-[937px] flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-6">
              <h1 className="max-w-[748px] text-center font-serif text-5xl leading-tight font-normal text-[#37322f] md:text-[80px] md:leading-[96px]">
                Effortless custom contract billing by Brillance
              </h1>
              <p className="max-w-[506px] text-center text-lg leading-7 font-medium text-[#37322f]/80">
                Streamline your billing process with seamless automation for every custom contract,
                tailored by Brillance.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Button className="h-10 rounded-full bg-[#37322f] px-12 text-sm font-medium text-white shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] hover:bg-[#37322f]/90">
              Start for free
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
