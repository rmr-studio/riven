import type { Node, Edge } from "@xyflow/react";

export const tabs = [
  { id: "saas", label: "SaaS" },
  { id: "agency", label: "Agencies" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "recruiting", label: "Recruiting" },
  { id: "realestate", label: "Real Estate" },
  { id: "consulting", label: "Consulting" },
  { id: "investors", label: "Investors" },
  { id: "healthcare", label: "Healthcare" },
] as const;

export type TabId = (typeof tabs)[number]["id"];

export type NodeConfigurations = Record<TabId, Node[]>;
export type EdgeConfigurations = Record<TabId, Edge[]>;

export type TableCell =
  | string
  | {
      text: string;
      variant: "default" | "success" | "warning" | "info" | "muted";
    };

export type TableRow = Record<string, TableCell>;

export type TableData = {
  headers: string[];
  rows: TableRow[];
};

export type TableConfigurations = Record<TabId, TableData>;
