"use client";

import { memo } from "react";
import { Handle, Position, type Node } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  User,
  Contact,
  Briefcase,
  Building,
  CreditCard,
  BarChart3,
  Target,
  FileText,
  Receipt,
  Landmark,
  Layers,
  Hash,
  Sparkles,
  Tag,
  Type,
  AtSign,
  Globe,
  Flag,
  DollarSign,
  Clock,
  Calendar,
  Circle,
  Link,
  Star,
  Shield,
  Phone,
  TrendingUp,
  Percent,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  contact: Contact,
  briefcase: Briefcase,
  building: Building,
  "credit-card": CreditCard,
  "bar-chart": BarChart3,
  target: Target,
  "file-text": FileText,
  receipt: Receipt,
  landmark: Landmark,
  layers: Layers,
  hash: Hash,
  sparkles: Sparkles,
  tag: Tag,
  text: Type,
  "at-sign": AtSign,
  globe: Globe,
  flag: Flag,
  dollar: DollarSign,
  clock: Clock,
  calendar: Calendar,
  circle: Circle,
  link: Link,
  star: Star,
  shield: Shield,
  phone: Phone,
  "trending-up": TrendingUp,
  percent: Percent,
};

// Icon colors based on type
const iconColors: Record<string, string> = {
  user: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  contact: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  briefcase: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  building: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  "credit-card": "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  "bar-chart": "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  target: "bg-red-500/15 text-red-600 dark:text-red-400",
  "file-text": "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  receipt: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  landmark: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  layers: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
};

interface Attribute {
  name: string;
  icon: string;
}

export interface EntityNodeData extends Record<string, unknown> {
  title: string;
  icon: string;
  badge: string;
  attributes: Attribute[];
  moreCount?: number;
  animationDelay?: number;
}

export type EntityNodeType = Node<EntityNodeData, "entityNode">;

interface EntityNodeProps {
  data: EntityNodeData;
}

export const EntityNode = memo(function EntityNode({ data }: EntityNodeProps) {
  const IconComponent = iconMap[data.icon] || User;
  const iconColorClass = iconColors[data.icon] || "bg-muted text-muted-foreground";
  const delay = data.animationDelay ?? 0;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-muted-foreground/30 !border-0"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="bg-background border border-border rounded-lg shadow-sm min-w-[180px] max-w-[200px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", iconColorClass)}>
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium text-foreground">{data.title}</span>
          </div>
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
            {data.badge}
          </span>
        </div>

        {/* Attributes */}
        <div className="px-3 py-2 space-y-1.5">
          {data.attributes.map((attr: Attribute, index: number) => {
            const AttrIcon = iconMap[attr.icon] || Hash;
            return (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <AttrIcon className="w-3 h-3 opacity-60" />
                <span>{attr.name}</span>
              </div>
            );
          })}
          {data.moreCount && data.moreCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60 pt-1">
              <Plus className="w-3 h-3" />
              <span>{data.moreCount} More Attributes</span>
            </div>
          )}
        </div>
      </motion.div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-muted-foreground/30 !border-0"
      />
    </>
  );
});
