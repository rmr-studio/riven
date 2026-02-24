import { WaitlistForm } from '@/components/feature-modules/waitlist/components/waitlist-form';
import { Section } from '@/components/ui/section';

export const Waitlist = () => {
  return (
    <Section id="waitlist" className="flex min-h-[80dvh] items-center justify-center">
      <WaitlistForm className="relative z-10 px-4 sm:px-6" />
    </Section>
  );
};
