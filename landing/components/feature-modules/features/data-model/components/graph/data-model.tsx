"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { tabs, type TabId } from "../../types";
import { DataModelGraph } from "./data-model-graph";

export const CANVAS_PADDING = 60;

// ── Main component ──────────────────────────────────────
export function DataModelShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>("saas");

  return (
    <>
      <section className="">
        <div className=" relative mx-auto ">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center "
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl max-w-7xl mx-auto mb-12 font-semibold tracking-tight ">
              <span className="text-background font-bold italic">
                A true focus on structural freedom.
              </span>{" "}
              <span className="text-background/80">
                Our data models and relationships adapt to how you work, not the
                other way around. Because your business is unique, so your
                platform should be too.
              </span>
            </h2>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onMouseEnter={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-background border-border text-foreground shadow-sm"
                    : "bg-background/10 border-transparent text-background hover:text-foreground hover:bg-background/50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>
          <DataModelGraph tab={activeTab} />
        </div>
      </section>
    </>
  );
}
