import { Section } from '@/components/ui/section';
import { SectionDivider } from '@/components/ui/section-divider';
import { CrossDomainCarousel } from './cross-domain-carousel';

export function CrossDomainIntelligence() {
  return (
    <Section id="cross-domain-intelligence" size={24}>
      <div className="content-container">
        <div className="space-y-10 md:space-y-14">
          <SectionDivider name="Cross-Domain Intelligence" />

          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl -tracking-[0.02em] leading-[1.2] text-primary md:text-4xl lg:text-5xl">
              <span className="font-sans font-semibold">Insights that</span>{' '}
              <span className="font-serif font-normal italic">no single tool could see.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-content/65 md:text-base">
              Riven connects the dots across every data source you use — surfacing patterns, risks,
              and opportunities that only emerge when your entire business is understood as one
              system.
            </p>
          </div>
        </div>

        <div className="mt-10 md:mt-14">
          <CrossDomainCarousel />
        </div>
      </div>
    </Section>
  );
}
