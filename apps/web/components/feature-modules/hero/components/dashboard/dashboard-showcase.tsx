'use client';

import { BGPattern } from '@/components/ui/background/grids';
import { Section } from '@/components/ui/section';
import { useContainerScale } from '@/hooks/use-container-scale';
import { cdnImageLoader } from '@/lib/cdn-image-loader';
import Image from 'next/image';
import { MockDashboard } from './mock-dashboard';

// ── Feature highlight cards ────────────────────────────────────────

const FEATURES = [
  {
    title: 'Real-time insights',
    description: 'Surface churn risks and channel performance the moment patterns emerge',
  },
  {
    title: 'Cross-domain view',
    description: 'Unified lifecycle data from every connected tool in one glance',
  },
  {
    title: 'AI-powered briefs',
    description: 'Your morning brief learns what matters most to your business',
  },
];

// ── Scaled dashboard overlay ───────────────────────────────────────

const DESKTOP_WIDTH = 1920;
const DESKTOP_HEIGHT = 1260;

function DashboardOverlay() {
  const { containerRef, scale } = useContainerScale(DESKTOP_WIDTH);

  return (
    <div className="relative z-30" ref={containerRef}>
      <div
        className="origin-top-left"
        style={{
          width: DESKTOP_WIDTH,
          transform: `scale(${scale})`,
          height: DESKTOP_HEIGHT * scale,
        }}
      >
        <MockDashboard />
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────

export function DashboardShowcase() {
  return (
    <Section
      className="relative w-full overflow-hidden bg-foreground py-12! md:py-16! lg:px-12! lg:py-20!"
      navbarInverse
      fill="color-mix(in srgb, var(--background) 15%, transparent)"
      variant="dots"
      size={12}
      mask="none"
      gridClassName="bg-foreground"
    >
      {/* Atmospheric gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute h-[600px] w-[600px] rounded-full opacity-60 blur-[150px]"
          style={{
            background: 'oklch(0.18 0.06 240)',
            top: '10%',
            left: '15%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        <div
          className="absolute h-[500px] w-[500px] rounded-full opacity-25 blur-[130px]"
          style={{
            background: 'oklch(0.22 0.09 350)',
            bottom: '15%',
            right: '10%',
            transform: 'translate(50%, 50%)',
          }}
        />
        <div
          className="absolute h-[350px] w-[350px] rounded-full opacity-15 blur-[100px]"
          style={{
            background: 'oklch(0.22 0.09 350)',
            top: '55%',
            left: '50%',
          }}
        />
      </div>
      <div className="content-container relative">
        {/* ── Top: Heading + Feature Cards ─────────────────────────── */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          {/* Left: Label + heading */}
          <div className="max-w-xl">
            <h2 className="mt-4 text-3xl leading-tight -tracking-[0.02em] text-primary-foreground md:text-4xl lg:text-5xl">
              <span className="font-sans font-semibold">What channels produce </span>
              <span className="font-serif font-normal italic">customers who stay?</span>
            </h2>
          </div>

          {/* Right: 3 feature cards */}
          <div className="grid grid-cols-1 gap-px sm:grid-cols-3 lg:max-w-xl">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="border-l border-primary-foreground/10 px-5 py-1">
                <div className="mb-3 text-primary-foreground/40">{feature.icon}</div>
                <p className="text-sm font-semibold text-primary-foreground">{feature.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-primary-foreground/50">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom: Content Card ────────────────────────────────── */}
        <div className="relative z-10 mt-12 overflow-hidden rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 shadow-md md:mt-16 dark:border-primary-foreground/25 dark:bg-background/80 dark:shadow-xl dark:shadow-black/60">
          {/* Atmospheric gradient orbs */}
          <div
            className="pointer-events-none absolute inset-0 z-40 overflow-hidden opacity-60"
            aria-hidden="true"
          >
            <div
              className="absolute h-[600px] w-[600px] rounded-full opacity-40 blur-[150px]"
              style={{
                background: 'oklch(0.22 0.09 350)',
                top: '10%',
                left: '15%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div
              className="absolute h-[500px] w-[500px] rounded-full opacity-25 blur-[130px]"
              style={{
                background: 'oklch(0.18 0.06 240)',
                bottom: '15%',
                right: '10%',
                transform: 'translate(50%, 50%)',
              }}
            />
            <div
              className="absolute h-[350px] w-[350px] rounded-full opacity-15 blur-[100px]"
              style={{
                background: 'oklch(0.2 0.07 200)',
                top: '55%',
                left: '50%',
              }}
            />
          </div>
          <section className="absolute inset-0 z-0 -translate-x-8 scale-115 opacity-30 dark:opacity-50">
            <Image
              loader={cdnImageLoader}
              src={'images/city-streets-alt.webp'}
              alt="City Streets"
              fill
              fetchPriority={'high'}
              decoding={'async'}
              priority={true}
            />
          </section>
          {/* City street background image — absolute fill behind dashboard */}

          <div className="z-10 flex flex-col backdrop-blur-xs lg:flex-row">
            {/* Left: Copy + CTA */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, var(--inverse-card) 5%, transparent 50%), linear-gradient(to top, var(--inverse-card) 5%, transparent 40%), linear-gradient(to bottom, var(--inverse-card) 5%, transparent 40%)',
              }}
            />
            <BGPattern
              variant="grid"
              size={24}
              fill="color-mix(in srgb, var(--background) 15%, transparent)"
              mask="none"
              className="z-2"
              style={{
                maskImage:
                  'radial-gradient(ellipse at center, black 30%, transparent 75%), linear-gradient(to bottom, transparent 10%, black 30%)',
                maskComposite: 'intersect',
                WebkitMaskImage:
                  'radial-gradient(ellipse at center, black 30%, transparent 75%), linear-gradient(to bottom, transparent 10%, black 30%)',
                WebkitMaskComposite: 'source-in' as string,
              }}
            />
            <div className="z-20 flex flex-col px-8 py-10 lg:w-5/12 lg:px-12 lg:py-16">
              <div className="flex items-center gap-2.5">
                <h3 className="dark:tect-foreground text-primary-primary font-serif text-3xl font-semibold tracking-tight">
                  Keep powerful insights in sight
                </h3>
              </div>

              <p className="mt-4 max-w-md leading-relaxed text-primary-foreground/50 dark:text-content">
                Every morning, Riven explores and surfaces patterns trends and insights hidden deep
                in your data. From channel performance to cohort health to churn risks. Answer
                critical questions at a glance with the most powerful, connected dashboard you've
                ever seen.
              </p>
            </div>

            {/* Right: City image + Dashboard overlay */}
            <div className="z- relative lg:w-7/12">
              {/* Gradient overlays for blending */}

              {/* Dashboard — in flow so it drives the column height */}
              <div className="relative z-30 p-4 pt-8 md:p-8 md:pt-12">
                <DashboardOverlay />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
