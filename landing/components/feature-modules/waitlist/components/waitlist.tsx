import { Section } from '@/components/ui/section';
import { WaitlistForm } from '@/components/feature-modules/waitlist/components/waitlist-form';

export const Waitlist = () => {
  return (
    <Section id="contact" className="min-h-[80dvh] flex items-center justify-center">
      <WaitlistForm className="relative z-10 px-4 sm:px-6" />
    </Section>
  );
};
