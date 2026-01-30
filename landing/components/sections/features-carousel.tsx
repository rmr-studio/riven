"use client";

import {
  BentoCarousel,
  BentoSlide,
  BentoCard,
} from "@/components/ui/bento-carousel";
import { Database, Users, Zap, BarChart3, Lock, Workflow } from "lucide-react";

function FeatureVisual({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="flex-1 flex items-end justify-center">
      <div className="w-full h-full min-h-[120px] rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-border/50 flex items-center justify-center">
        <Icon className="w-12 h-12 text-primary/60" />
      </div>
    </div>
  );
}

export function FeaturesCarousel() {
  const mobileCards = [
    <BentoCard
      key="relationships"
      title="Instant visibility into all your relationships"
      description="Real-time global database of every contact & company your business interacts with."
    >
      <FeatureVisual icon={Users} />
    </BentoCard>,
    <BentoCard
      key="workflows"
      title="Custom workflows"
      description="Build automation that fits your exact process. No compromises, no workarounds."
    >
      <FeatureVisual icon={Workflow} />
    </BentoCard>,
    <BentoCard
      key="intel"
      title="Powerful relationship intel"
      description="See all your team's conversations with a contact or company and create enriched timelines."
    >
      <FeatureVisual icon={Database} />
    </BentoCard>,
    <BentoCard
      key="tech-stack"
      title="Dream tech stack"
      description="Pull in data from best-in-class SaaS tools through our API and Zapier integration."
    >
      <FeatureVisual icon={Zap} />
    </BentoCard>,
    <BentoCard
      key="analytics"
      title="Advanced analytics"
      description="Get insights that matter with customizable dashboards and real-time reporting. Track every metric that moves your business forward."
    >
      <FeatureVisual icon={BarChart3} />
    </BentoCard>,
    <BentoCard
      key="security"
      title="Enterprise security"
      description="Bank-level encryption, SOC 2 compliance, and granular access controls."
    >
      <FeatureVisual icon={Lock} />
    </BentoCard>,
    <BentoCard
      key="automation"
      title="Smart automation"
      description="Let AI handle the repetitive tasks while you focus on building relationships."
    >
      <FeatureVisual icon={Workflow} />
    </BentoCard>,
  ];

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to{" "}
            <span className="text-primary">close more deals</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            A CRM that adapts to your workflow, not the other way around.
          </p>
        </div>

        <BentoCarousel mobileCards={mobileCards}>
          {/* Slide 1: Main features */}
          <BentoSlide
            gridAreas={`
              "feature feature standard1"
              "standard2 standard3 standard1"
            `}
            gridCols="1fr 1fr 1fr"
            gridRows="1fr 1fr"
          >
            <BentoCard
              area="feature"
              title="Instant visibility into all your relationships"
              description="Real-time global database of every contact & company your business interacts with."
            >
              <FeatureVisual icon={Users} />
            </BentoCard>
            <BentoCard
              area="standard1"
              title="Custom workflows"
              description="Build automation that fits your exact process. No compromises, no workarounds."
            >
              <FeatureVisual icon={Workflow} />
            </BentoCard>
            <BentoCard
              area="standard2"
              title="Powerful relationship intel"
              description="See all your team's conversations with a contact or company and create enriched timelines."
            >
              <FeatureVisual icon={Database} />
            </BentoCard>
            <BentoCard
              area="standard3"
              title="Dream tech stack"
              description="Pull in data from best-in-class SaaS tools through our API and Zapier integration."
            >
              <FeatureVisual icon={Zap} />
            </BentoCard>
          </BentoSlide>

          {/* Slide 2: More features */}
          <BentoSlide
            gridAreas={`
              "analytics analytics security"
              "analytics analytics automation"
            `}
            gridCols="1fr 1fr 1fr"
            gridRows="1fr 1fr"
          >
            <BentoCard
              area="analytics"
              title="Advanced analytics"
              description="Get insights that matter with customizable dashboards and real-time reporting. Track every metric that moves your business forward."
            >
              <FeatureVisual icon={BarChart3} />
            </BentoCard>
            <BentoCard
              area="security"
              title="Enterprise security"
              description="Bank-level encryption, SOC 2 compliance, and granular access controls."
            >
              <FeatureVisual icon={Lock} />
            </BentoCard>
            <BentoCard
              area="automation"
              title="Smart automation"
              description="Let AI handle the repetitive tasks while you focus on building relationships."
            >
              <FeatureVisual icon={Workflow} />
            </BentoCard>
          </BentoSlide>
        </BentoCarousel>
      </div>
    </section>
  );
}
