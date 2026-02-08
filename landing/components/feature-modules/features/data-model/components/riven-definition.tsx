"use client";

import { motion } from "framer-motion";

export function RivenDefinition() {
  return (
    <section className="section">
      <div className="container relative mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          {/* Dictionary Definition Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 md:p-10 shadow-sm">
              {/* Word */}
              <h2 className="text-5xl md:text-6xl font-light tracking-tight text-foreground mb-4">
                riven
              </h2>
              {/* Part of speech */}
              <div className="flex items-center gap-2 text-sm mb-3">
                <span className="text-muted-foreground italic">adjective</span>
                <span className="text-muted-foreground/50">[ after verb ]</span>
                <span className="text-muted-foreground/30">&middot;</span>
                <span className="text-muted-foreground/60">literary</span>
              </div>
              {/* Pronunciation */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground/70 text-xs uppercase tracking-wide">
                    UK
                  </span>
                  <span className="font-mono">/ˈrɪv.ən/</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground/70 text-xs uppercase tracking-wide">
                    US
                  </span>
                  <span className="font-mono">/ˈrɪv.ən/</span>
                </div>
              </div>
              {/* Gold divider */}
              <div className="h-px w-full bg-edit/60 mb-2" />
              {/* Definition */}
              <div className="text-xl md:text-2xl font-medium text-foreground">
                : split apart
              </div>
              <div className="text-xl md:text-2xl font-medium text-foreground">
                : divided into pieces or factions
              </div>
            </div>
          </motion.div>

          {/* Pain Copy */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="space-y-6"
          >
            <div className="text-2xl md:text-3xl  font-semibold tracking-tight text-foreground leading-tight">
              <div>
                Your operations are <span className="italic ">riven. </span>
              </div>
              <div className="my-4 font-bold italic">Scattered. </div>
              <div>
                16 tabs, 6 dashboards, and a spreadsheet holding it all
                together.
              </div>
            </div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
              Every tool owns a fragment. None of them talk. You end up as the
              integration layer&thinsp;&mdash;&thinsp;copying, pasting, and
              context-switching until the picture blurs.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
