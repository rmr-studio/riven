import { Section } from '@/components/ui/section';
import { SectionDivider } from '@/components/ui/section-divider';
import { ShaderContainer } from '@/components/ui/shader-container';
import { ChurnShowcase } from './churn-showcase-graphic';

export const ChurnRetrospective = () => {
  return (
    <Section id="churn-retrospectives" size={24}>
      <div className="clamp">
        <div className="space-y-10 md:space-y-14">
          <SectionDivider>Churn Retrospectives</SectionDivider>

          <div className="mx-w-4xl px-4 sm:px-8 xl:max-w-6xl">
            <h2 className="text-3xl leading-[1.2] -tracking-[0.02em] text-primary md:text-4xl lg:text-5xl">
              <span className="font-sans font-semibold">Every problem leaves a trace.</span>{' '}
              <span className="font-serif font-normal italic">Find the trail.</span>
            </h2>

            <p className="mt-4 max-w-4xl text-sm leading-relaxed text-content/80 md:text-base">
              Uncover the hidden patterns and root causes behind every churn. Riven automatically
              surfaces the key moments, behaviors, and trends that lead to their departure. Stitched
              together from every tool you&apos;ve connected. Understand why customers are leaving,
              and identify the most impactful actions to keep them around.
            </p>
          </div>
        </div>

        <ShaderContainer>
          <ChurnShowcase />
        </ShaderContainer>
      </div>
    </Section>
  );
};
