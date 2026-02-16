import { Section } from '@/components/ui/section';
import { DataModelFeatureCarousel } from './data-model-carousel';
import { DataModelShowcase } from './graph/data-model';

export const DataModel = () => {
  return (
    <Section
      id="features"
      className="shadow-xl shadow-primary dark:shadow-none"
      gridClassName="bg-foreground"
      mask="none"
      fill="color-mix(in srgb, var(--background) 40%, transparent)"
      variant="dots"
      size={12}
      navbarInverse
    >
      <DataModelShowcase />

      <DataModelFeatureCarousel />
    </Section>
  );
};
