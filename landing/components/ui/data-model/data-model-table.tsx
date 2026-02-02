"use client";

import { memo } from "react";
import {
  User,
  Hash,
  Tag,
  Sparkles,
  Building,
  DollarSign,
  CreditCard,
  Circle,
  Phone,
  Target,
  FileText,
  Briefcase,
  Layers,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for table headers
const headerIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User: User,
  "User ID": Hash,
  "User type": Tag,
  "Engagement score": Sparkles,
  Company: Building,
  MRR: DollarSign,
  Plan: CreditCard,
  Status: Circle,
  Contact: User,
  Phone: Phone,
  "Lead Status": Target,
  "Quote Amount": FileText,
  "Portfolio Co.": Briefcase,
  Investment: DollarSign,
  Series: Layers,
  Ownership: Percent,
};

// Badge variant styles
const badgeVariants = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  muted: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400",
};

type BadgeValue = {
  text: string;
  variant: keyof typeof badgeVariants;
};

interface DataModelTableProps {
  headers: string[];
  rows: Array<Record<string, string | BadgeValue>>;
}

function isBadgeValue(value: string | BadgeValue): value is BadgeValue {
  return typeof value === "object" && "text" in value && "variant" in value;
}

export const DataModelTable = memo(function DataModelTable({
  headers,
  rows,
}: DataModelTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="w-10 p-3">
              <div className="w-4 h-4 rounded border border-border" />
            </th>
            {headers.map((header) => {
              const IconComponent = headerIconMap[header];
              return (
                <th
                  key={header}
                  className="p-3 text-left font-medium text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent className="w-3.5 h-3.5 opacity-60" />}
                    <span>{header}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors"
            >
              <td className="w-10 p-3">
                <div className="w-4 h-4 rounded border border-border" />
              </td>
              {headers.map((header, colIndex) => {
                const value = row[header];
                const isFirstColumn = colIndex === 0;

                return (
                  <td key={header} className="p-3">
                    {isFirstColumn ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-medium text-foreground">
                          {typeof value === "string" ? value : value?.text}
                        </span>
                      </div>
                    ) : isBadgeValue(value) ? (
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded text-xs font-medium",
                          badgeVariants[value.variant]
                        )}
                      >
                        {value.text}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{value}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
