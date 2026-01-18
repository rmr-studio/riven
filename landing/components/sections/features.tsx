"use client";

import { motion } from "framer-motion";
import {
  Blocks,
  Workflow,
  GitBranch,
  LayoutTemplate,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  benefit: string;
}

const features: Feature[] = [
  {
    icon: Blocks,
    title: "Custom entity model",
    benefit:
      "Define your own objects and relationships. Contacts, deals, projects - whatever your business needs.",
  },
  {
    icon: Workflow,
    title: "Workflow automation",
    benefit:
      "Automate repetitive tasks without a PhD in automation. If-this-then-that, but actually useful.",
  },
  {
    icon: GitBranch,
    title: "Non-linear pipelines",
    benefit:
      "Deals branch, loop back, and skip stages. Your pipeline should reflect that.",
  },
  {
    icon: LayoutTemplate,
    title: "Templates",
    benefit:
      "Start with pre-built templates for common workflows. Customize everything from day one.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

export function Features() {
  return (
    <section className="px-4 py-12 md:px-8 md:py-16 lg:px-12 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="text-center mb-12 md:mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4"
          >
            Built for how you actually work
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Riven adapts to your business, not the other way around.
          </motion.p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-center text-center p-6"
            >
              {/* Icon container */}
              <div className="mb-4 rounded-lg bg-primary/10 p-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>

              {/* Benefit */}
              <p className="text-muted-foreground">{feature.benefit}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
