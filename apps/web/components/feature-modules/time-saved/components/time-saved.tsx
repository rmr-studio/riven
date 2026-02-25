'use client';

import { Section } from '@/components/ui/section';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const items = [
  {
    label: 'Data scattered everywhere',
    metric: '16 tabs open',
    description:
      'Your business data lives across Stripe, your CRM, support tools, and analytics dashboards. Every question starts with opening another tab.',
  },
  {
    label: 'Cross-referencing tools',
    metric: '3–5 hours per week',
    description:
      'Exporting CSVs from Stripe, cross-checking in your CRM, matching support data in spreadsheets to answer basic questions.',
  },
  {
    label: 'Building internal reports',
    metric: '2–3 hours per week',
    description:
      'Pulling numbers from four dashboards, formatting them into something your team can actually read and act on.',
  },
  {
    label: 'The spreadsheet of truth',
    metric: '3 spreadsheets deep',
    description:
      'One master spreadsheet everyone\'s afraid to touch. The "single source of truth" that nobody trusts.',
  },
];

export function TimeSaved() {
  return (
    <Section
      id="time-saved"
      navbarInverse
      className="bg-[oklch(0.13_0.005_260)]"
      mask="none"
      fill="transparent"
    >
      {/* Atmospheric gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
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

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 text-center md:mb-20"
        >
          <h2 className="font-serif text-4xl leading-[1.1] tracking-tight text-white/95 md:text-5xl">
            Less stitching. More signal.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed tracking-normal text-white/45 md:text-lg">
            Riven eliminates the manual work caused by disconnected tools — so you can focus on
            growing your business, not reconciling it.
          </p>
        </motion.div>

        {/* Desktop grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:block"
        >
          <div className="overflow-hidden rounded-xl border border-white/[0.08]">
            <div className="grid grid-cols-3">
              {/* Row 1: first 3 items */}
              {items.slice(0, 3).map((item, i) => (
                <div
                  key={item.label}
                  className={cn(
                    'border-b border-white/[0.08] p-7 lg:p-8',
                    i > 0 && 'border-l border-white/[0.08]',
                  )}
                >
                  <p className="mb-2 text-[0.8rem] tracking-wide text-white/35">{item.label}</p>
                  <p className="mb-3 text-lg font-medium tracking-tight text-white/90 lg:text-xl">
                    {item.metric}
                  </p>
                  <p className="text-sm leading-relaxed tracking-normal text-white/35">
                    {item.description}
                  </p>
                </div>
              ))}

              {/* Row 2: last item + summary (col-span-2) */}
              <div className="flex flex-col justify-end p-7 lg:p-8">
                <p className="mb-2 text-[0.8rem] tracking-wide text-white/35">{items[3].label}</p>
                <p className="mb-3 text-lg font-medium tracking-tight text-white/90 lg:text-xl">
                  {items[3].metric}
                </p>
                <p className="text-sm leading-relaxed tracking-normal text-white/35">
                  {items[3].description}
                </p>
              </div>

              {/* Summary + compound stats (spans 2 columns) */}
              <div className="col-span-2 flex flex-col justify-between border-l border-white/[0.08] p-7 lg:flex-row lg:items-end lg:p-8">
                <div>
                  <p className="mb-2 text-[0.8rem] tracking-wide text-white/35">As things add up</p>
                  <p className="mb-3 text-lg font-medium tracking-tight text-white/90 lg:text-xl">
                    What disappears over time
                  </p>
                  <p className="text-sm leading-relaxed tracking-normal text-white/35">
                    Manual operational work caused by tools that don&apos;t talk to each other.
                  </p>
                </div>
                <div className="mt-6 shrink-0 space-y-0.5 font-serif font-light tracking-tight lg:mt-0 lg:pl-8 lg:text-right">
                  <p className="text-3xl text-white/75 lg:text-4xl xl:text-5xl">8–12 hours</p>
                  <p className="text-3xl text-white/75 lg:text-4xl xl:text-5xl">16 tabs</p>
                  <p className="text-3xl text-white/75 lg:text-4xl xl:text-5xl">3 spreadsheets</p>
                  <p className="text-3xl text-white/55 italic lg:text-4xl xl:text-5xl">
                    1 massive headache
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile layout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 md:hidden"
        >
          {items.map((item) => (
            <div key={item.label} className="border-l-2 border-white/[0.12] py-4 pl-5 pr-3">
              <p className="text-base font-medium tracking-tight text-white/90">{item.metric}</p>
              <p className="mt-1.5 text-sm leading-relaxed tracking-normal text-white/35">
                {item.description}
              </p>
            </div>
          ))}
          <div className="border-l-2 border-white/[0.12] py-4 pl-5 pr-3">
            <p className="text-base font-medium tracking-tight text-white/90">
              What disappears over time
            </p>
            <p className="mt-1.5 text-sm leading-relaxed tracking-normal text-white/35">
              Manual operational work caused by tools that don&apos;t talk to each other.
            </p>
            <div className="mt-4 space-y-0.5 font-serif font-light tracking-tight">
              <p className="text-2xl text-white/70">8–12 hours</p>
              <p className="text-2xl text-white/70">16 tabs</p>
              <p className="text-2xl text-white/70">3 spreadsheets</p>
              <p className="text-2xl text-white/55 italic">1 massive headache</p>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
