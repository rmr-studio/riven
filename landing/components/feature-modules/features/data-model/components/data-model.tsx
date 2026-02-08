import React from "react";
import { RivenDefinition } from "./riven-definition";
import { DataModelShowcase } from "./data-model-showcase";
import { DataModelFeatureCarousel } from "./data-model-carousel";
import { SectionDivider } from "@/components/ui/section-divider";
import { BGPattern } from "@/components/ui/background/grids";

export const DataModel = () => {
  return (
    <section className="relative">
      <BGPattern
        variant="grid"
        mask="fade-edges"
        className="opacity-15"
        size={8}
      />

      <SectionDivider name="One Unified Data Ecosystem" />
      <RivenDefinition />
      <DataModelShowcase />

      <DataModelFeatureCarousel />
    </section>
  );
};
