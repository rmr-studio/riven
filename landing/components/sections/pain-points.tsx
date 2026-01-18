"use client";

import { motion } from "framer-motion";

interface PainPoint {
  title: string;
  description: string;
}

const painPoints: PainPoint[] = [
  {
    title: "Forced into rigid pipelines",
    description:
      "Your deals don't follow a linear path, but your CRM forces them into one. Skip a stage? Loop back? Not allowed.",
  },
  {
    title: "One-size-fits-none data model",
    description:
      "You need to track relationships your CRM never imagined. Custom fields aren't enough when the model itself is wrong.",
  },
  {
    title: "Automation that fights you",
    description:
      "Setting up workflows feels like programming a VCR. And when something breaks, good luck debugging it.",
  },
  {
    title: "Built for enterprise, priced for enterprise",
    description:
      "You're paying for features designed for 10,000-person companies. You have a team of 5.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function PainPoints() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mx-auto max-w-3xl text-center mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Sound familiar?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="mt-4 text-lg text-muted-foreground"
          >
            Traditional CRMs force you to work their way. You deserve better.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="grid gap-8 md:grid-cols-2"
        >
          {painPoints.map((point) => (
            <motion.div
              key={point.title}
              variants={itemVariants}
              className="rounded-lg border border-border bg-background p-6"
            >
              <h3 className="text-lg font-semibold">{point.title}</h3>
              <p className="mt-2 text-muted-foreground">{point.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
