'use client';

import { GlowBorder } from '@/components/ui/glow-border';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  Hash,
  Link,
  List,
  Mail,
  ToggleLeft,
  Type,
} from 'lucide-react';
import { motion } from 'motion/react';

const dropdownTypes = [
  { icon: CheckSquare, label: 'Checkbox', delay: 0.35 },
  { icon: Hash, label: 'Number', delay: 0.4 },
  { icon: Calendar, label: 'Date', delay: 0.45 },
  { icon: Link, label: 'URL', delay: 0.5 },
  { icon: Mail, label: 'Email', delay: 0.55 },
  { icon: ToggleLeft, label: 'Boolean', delay: 0.6 },
  { icon: List, label: 'Select', delay: 0.65 },
];

export const DataCleanlinessGraphic = ({ className }: { className?: string }) => {
  return (
    <GlowBorder className={cn('pointer-events-none absolute mt-2 w-full', className)}>
      <motion.div
        className="w-full rounded-2xl border border-border bg-card p-5 shadow-lg"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        {/* Title */}
        <p className="text-base font-semibold tracking-tight text-foreground">Create attribute</p>

        {/* Required / Unique checkboxes */}
        <div className="mt-4 flex items-center gap-5">
          <span className="flex items-center gap-2 text-sm text-foreground">
            <span className="flex h-4 w-4 items-center justify-center rounded border border-blue-500 bg-blue-500">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </span>
            Required
          </span>
          <span className="flex items-center gap-2 text-sm text-foreground">
            <span className="flex h-4 w-4 items-center justify-center rounded border border-border bg-background" />
            Unique
          </span>
        </div>

        {/* Default Value */}
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Default Value</p>
          <div className="mt-1.5 flex h-9 items-center rounded-lg border border-border bg-background px-3">
            <span className="text-sm text-muted-foreground">None</span>
          </div>
        </div>

        {/* Attribute Type */}
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">
            Attribute Type <span className="text-red-400">*</span>
          </p>

          {/* Selected value */}
          <motion.div
            className="mt-1.5 flex h-10 items-center justify-between rounded-lg border-2 border-blue-500 bg-background px-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="flex items-center gap-2.5">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Text</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>

          {/* Dropdown */}
          <motion.div
            className="mt-1.5 rounded-lg border border-border bg-card shadow-md"
            initial={{ opacity: 0, y: -4 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <div className="py-1">
              {dropdownTypes.map(({ icon: Icon, label, delay }) => (
                <motion.div
                  key={label}
                  className="flex items-center gap-2.5 px-3 py-2"
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25, delay }}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </GlowBorder>
  );
};
