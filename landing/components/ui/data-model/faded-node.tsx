"use client";

import { memo } from "react";
import { Handle, Position, type Node } from "@xyflow/react";
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
  ScrollText,
  Users,
  MessageSquare,
  Bell,
  Folder,
  Settings,
  Activity,
  Zap,
  Mail,
  CheckSquare,
  Package,
  Truck,
  ShoppingCart,
  Clipboard,
  Database,
  Server,
  Cloud,
  GitBranch,
  FileCode,
  Bug,
  Lightbulb,
  Rocket,
  Award,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Extended icon mapping for faded nodes
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
  scroll: ScrollText,
  users: Users,
  message: MessageSquare,
  bell: Bell,
  folder: Folder,
  settings: Settings,
  activity: Activity,
  zap: Zap,
  mail: Mail,
  task: CheckSquare,
  package: Package,
  truck: Truck,
  cart: ShoppingCart,
  clipboard: Clipboard,
  database: Database,
  server: Server,
  cloud: Cloud,
  git: GitBranch,
  code: FileCode,
  bug: Bug,
  idea: Lightbulb,
  rocket: Rocket,
  award: Award,
  heart: Heart,
};

export interface FadedNodeData extends Record<string, unknown> {
  title: string;
  icon: string;
}

export type FadedNodeType = Node<FadedNodeData, "fadedNode">;

interface FadedNodeProps {
  data: FadedNodeData;
}

export const FadedNode = memo(function FadedNode({ data }: FadedNodeProps) {
  const IconComponent = iconMap[data.icon] || Circle;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1.5 !h-1.5 !bg-muted-foreground/20 !border-0"
      />
      <div className="bg-background/40 border border-border/30 rounded-lg px-3 py-2 min-w-[100px] opacity-50 hover:opacity-70 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-muted/30">
            <IconComponent className="w-3 h-3 text-muted-foreground/60" />
          </div>
          <span className="text-xs font-medium text-muted-foreground/70">{data.title}</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-1.5 !h-1.5 !bg-muted-foreground/20 !border-0"
      />
    </>
  );
});
