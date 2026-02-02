"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  type NodeTypes,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EntityNode } from "@/components/ui/data-model/entity-node";
import { AddObjectNode } from "@/components/ui/data-model/add-object-node";
import { FadedNode } from "@/components/ui/data-model/faded-node";
import { DataModelTable } from "@/components/ui/data-model/data-model-table";

// Tab configuration - expanded for more business types
const tabs = [
  { id: "saas", label: "SaaS" },
  { id: "agency", label: "Agencies" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "recruiting", label: "Recruiting" },
  { id: "realestate", label: "Real Estate" },
  { id: "consulting", label: "Consulting" },
  { id: "investors", label: "Investors" },
  { id: "healthcare", label: "Healthcare" },
] as const;

type TabId = (typeof tabs)[number]["id"];

// Main edge style (primary relationships)
const mainEdgeStyle = {
  stroke: "var(--color-muted-foreground)",
  strokeWidth: 1.5,
  opacity: 0.4,
};

// Faded edge style (secondary to main connections)
const fadedEdgeStyle = {
  stroke: "var(--color-muted-foreground)",
  strokeWidth: 1,
  opacity: 0.15,
};

// Very faded edge style (inter-secondary connections)
const interSecondaryEdgeStyle = {
  stroke: "var(--color-muted-foreground)",
  strokeWidth: 0.75,
  opacity: 0.08,
};

// Polymorphic edge style (connects to multiple models)
const polymorphicEdgeStyle = {
  stroke: "var(--color-muted-foreground)",
  strokeWidth: 0.75,
  opacity: 0.1,
  strokeDasharray: "3,3",
};

// Helper to create faded background nodes
const createFadedNode = (
  id: string,
  title: string,
  icon: string,
  x: number,
  y: number
): Node => ({
  id,
  type: "fadedNode",
  position: { x, y },
  data: { title, icon },
});

// Helper to create main entity nodes
const createEntityNode = (
  id: string,
  title: string,
  icon: string,
  badge: string,
  attributes: Array<{ name: string; icon: string }>,
  moreCount: number,
  x: number,
  y: number
): Node => ({
  id,
  type: "entityNode",
  position: { x, y },
  data: { title, icon, badge, attributes, moreCount },
});

// Node configurations for each tab
const nodeConfigurations: Record<TabId, Node[]> = {
  saas: [
    // Main nodes (center)
    createEntityNode(
      "company",
      "Company",
      "building",
      "Standard",
      [
        { name: "Company name", icon: "text" },
        { name: "MRR", icon: "dollar" },
        { name: "Plan tier", icon: "layers" },
      ],
      8,
      100,
      220
    ),
    createEntityNode(
      "subscription",
      "Subscription",
      "credit-card",
      "Custom",
      [
        { name: "Plan", icon: "tag" },
        { name: "Status", icon: "circle" },
        { name: "Renewal date", icon: "calendar" },
      ],
      5,
      370,
      140
    ),
    createEntityNode(
      "feature-usage",
      "Feature Usage",
      "bar-chart",
      "Custom",
      [
        { name: "Feature name", icon: "text" },
        { name: "Usage count", icon: "hash" },
        { name: "Last used", icon: "clock" },
      ],
      3,
      370,
      340
    ),
    createEntityNode(
      "user",
      "User",
      "user",
      "Standard",
      [
        { name: "Email", icon: "at-sign" },
        { name: "Role", icon: "shield" },
        { name: "Last active", icon: "clock" },
      ],
      6,
      640,
      240
    ),
    // Faded ecosystem nodes
    createFadedNode("activity-log", "Activity Log", "scroll", -80, 80),
    createFadedNode("notifications", "Notifications", "bell", -80, 360),
    createFadedNode("api-keys", "API Keys", "code", -60, 480),
    createFadedNode("integrations", "Integrations", "zap", 180, 20),
    createFadedNode("webhooks", "Webhooks", "link", 400, 20),
    createFadedNode("invoices", "Invoices", "receipt", 620, 60),
    createFadedNode("payments", "Payments", "dollar", 800, 120),
    createFadedNode("support-tickets", "Support Tickets", "message", 820, 280),
    createFadedNode("feedback", "Feedback", "heart", 820, 400),
    createFadedNode("onboarding", "Onboarding", "rocket", 640, 440),
    createFadedNode("team", "Teams", "users", 400, 480),
    createFadedNode("permissions", "Permissions", "shield", 180, 480),
  ],
  agency: [
    // Main nodes
    createEntityNode(
      "client",
      "Client",
      "building",
      "Standard",
      [
        { name: "Company", icon: "text" },
        { name: "Industry", icon: "tag" },
        { name: "Retainer", icon: "dollar" },
      ],
      7,
      100,
      200
    ),
    createEntityNode(
      "project",
      "Project",
      "briefcase",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Budget", icon: "dollar" },
        { name: "Deadline", icon: "calendar" },
      ],
      9,
      370,
      140
    ),
    createEntityNode(
      "deliverable",
      "Deliverable",
      "package",
      "Custom",
      [
        { name: "Type", icon: "tag" },
        { name: "Status", icon: "circle" },
        { name: "Due date", icon: "calendar" },
      ],
      4,
      370,
      340
    ),
    createEntityNode(
      "team-member",
      "Team Member",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Role", icon: "shield" },
        { name: "Capacity", icon: "bar-chart" },
      ],
      5,
      640,
      240
    ),
    // Faded nodes
    createFadedNode("time-entries", "Time Entries", "clock", -80, 80),
    createFadedNode("contracts", "Contracts", "file-text", -80, 340),
    createFadedNode("proposals", "Proposals", "clipboard", -60, 460),
    createFadedNode("briefs", "Briefs", "scroll", 180, 20),
    createFadedNode("feedback", "Client Feedback", "message", 400, 20),
    createFadedNode("assets", "Assets", "folder", 620, 60),
    createFadedNode("invoices", "Invoices", "receipt", 800, 140),
    createFadedNode("expenses", "Expenses", "dollar", 820, 300),
    createFadedNode("reviews", "Reviews", "star", 800, 420),
    createFadedNode("milestones", "Milestones", "flag", 620, 440),
    createFadedNode("tasks", "Tasks", "task", 400, 480),
    createFadedNode("notes", "Notes", "text", 180, 480),
  ],
  ecommerce: [
    // Main nodes
    createEntityNode(
      "customer",
      "Customer",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Email", icon: "at-sign" },
        { name: "Lifetime value", icon: "dollar" },
      ],
      8,
      100,
      200
    ),
    createEntityNode(
      "order",
      "Order",
      "cart",
      "Standard",
      [
        { name: "Order #", icon: "hash" },
        { name: "Total", icon: "dollar" },
        { name: "Status", icon: "circle" },
      ],
      6,
      370,
      140
    ),
    createEntityNode(
      "product",
      "Product",
      "package",
      "Standard",
      [
        { name: "SKU", icon: "hash" },
        { name: "Name", icon: "text" },
        { name: "Price", icon: "dollar" },
      ],
      12,
      370,
      340
    ),
    createEntityNode(
      "shipment",
      "Shipment",
      "truck",
      "Custom",
      [
        { name: "Tracking #", icon: "hash" },
        { name: "Carrier", icon: "text" },
        { name: "ETA", icon: "calendar" },
      ],
      4,
      640,
      240
    ),
    // Faded nodes
    createFadedNode("reviews", "Reviews", "star", -80, 80),
    createFadedNode("wishlists", "Wishlists", "heart", -80, 340),
    createFadedNode("carts", "Carts", "cart", -60, 460),
    createFadedNode("categories", "Categories", "folder", 180, 20),
    createFadedNode("promotions", "Promotions", "tag", 400, 20),
    createFadedNode("inventory", "Inventory", "database", 620, 60),
    createFadedNode("returns", "Returns", "package", 800, 140),
    createFadedNode("refunds", "Refunds", "dollar", 820, 300),
    createFadedNode("suppliers", "Suppliers", "building", 800, 420),
    createFadedNode("warehouses", "Warehouses", "building", 620, 440),
    createFadedNode("variants", "Variants", "layers", 400, 480),
    createFadedNode("addresses", "Addresses", "globe", 180, 480),
  ],
  recruiting: [
    // Main nodes
    createEntityNode(
      "candidate",
      "Candidate",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Email", icon: "at-sign" },
        { name: "Status", icon: "circle" },
      ],
      10,
      100,
      200
    ),
    createEntityNode(
      "job",
      "Job Opening",
      "briefcase",
      "Standard",
      [
        { name: "Title", icon: "text" },
        { name: "Department", icon: "building" },
        { name: "Location", icon: "globe" },
      ],
      8,
      370,
      140
    ),
    createEntityNode(
      "application",
      "Application",
      "file-text",
      "Standard",
      [
        { name: "Stage", icon: "flag" },
        { name: "Applied date", icon: "calendar" },
        { name: "Rating", icon: "star" },
      ],
      5,
      370,
      340
    ),
    createEntityNode(
      "interview",
      "Interview",
      "calendar",
      "Custom",
      [
        { name: "Type", icon: "tag" },
        { name: "Date", icon: "calendar" },
        { name: "Interviewer", icon: "user" },
      ],
      4,
      640,
      240
    ),
    // Faded nodes
    createFadedNode("resumes", "Resumes", "file-text", -80, 80),
    createFadedNode("skills", "Skills", "sparkles", -80, 340),
    createFadedNode("sources", "Sources", "link", -60, 460),
    createFadedNode("pipelines", "Pipelines", "git", 180, 20),
    createFadedNode("scorecards", "Scorecards", "clipboard", 400, 20),
    createFadedNode("offers", "Offers", "dollar", 620, 60),
    createFadedNode("departments", "Departments", "building", 800, 140),
    createFadedNode("hiring-managers", "Hiring Mgrs", "users", 820, 300),
    createFadedNode("feedback", "Feedback", "message", 800, 420),
    createFadedNode("assessments", "Assessments", "task", 620, 440),
    createFadedNode("referrals", "Referrals", "users", 400, 480),
    createFadedNode("notes", "Notes", "text", 180, 480),
  ],
  realestate: [
    // Main nodes
    createEntityNode(
      "property",
      "Property",
      "building",
      "Standard",
      [
        { name: "Address", icon: "globe" },
        { name: "Price", icon: "dollar" },
        { name: "Status", icon: "circle" },
      ],
      15,
      100,
      200
    ),
    createEntityNode(
      "listing",
      "Listing",
      "tag",
      "Standard",
      [
        { name: "MLS #", icon: "hash" },
        { name: "Listed date", icon: "calendar" },
        { name: "Days on market", icon: "clock" },
      ],
      7,
      370,
      140
    ),
    createEntityNode(
      "buyer",
      "Buyer",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Budget", icon: "dollar" },
        { name: "Pre-approved", icon: "circle" },
      ],
      6,
      370,
      340
    ),
    createEntityNode(
      "showing",
      "Showing",
      "calendar",
      "Custom",
      [
        { name: "Date", icon: "calendar" },
        { name: "Time", icon: "clock" },
        { name: "Agent", icon: "user" },
      ],
      3,
      640,
      240
    ),
    // Faded nodes
    createFadedNode("photos", "Photos", "folder", -80, 80),
    createFadedNode("documents", "Documents", "file-text", -80, 340),
    createFadedNode("comps", "Comparables", "bar-chart", -60, 460),
    createFadedNode("neighborhoods", "Neighborhoods", "globe", 180, 20),
    createFadedNode("open-houses", "Open Houses", "calendar", 400, 20),
    createFadedNode("offers", "Offers", "dollar", 620, 60),
    createFadedNode("contracts", "Contracts", "file-text", 800, 140),
    createFadedNode("inspections", "Inspections", "clipboard", 820, 300),
    createFadedNode("closings", "Closings", "flag", 800, 420),
    createFadedNode("commissions", "Commissions", "percent", 620, 440),
    createFadedNode("agents", "Agents", "users", 400, 480),
    createFadedNode("leads", "Leads", "target", 180, 480),
  ],
  consulting: [
    // Main nodes
    createEntityNode(
      "client",
      "Client",
      "building",
      "Standard",
      [
        { name: "Company", icon: "text" },
        { name: "Industry", icon: "tag" },
        { name: "Contract value", icon: "dollar" },
      ],
      9,
      100,
      200
    ),
    createEntityNode(
      "engagement",
      "Engagement",
      "briefcase",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Type", icon: "tag" },
        { name: "Start date", icon: "calendar" },
      ],
      7,
      370,
      140
    ),
    createEntityNode(
      "workstream",
      "Workstream",
      "layers",
      "Custom",
      [
        { name: "Name", icon: "text" },
        { name: "Lead", icon: "user" },
        { name: "Status", icon: "circle" },
      ],
      5,
      370,
      340
    ),
    createEntityNode(
      "consultant",
      "Consultant",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Level", icon: "shield" },
        { name: "Utilization", icon: "percent" },
      ],
      6,
      640,
      240
    ),
    // Faded nodes
    createFadedNode("proposals", "Proposals", "file-text", -80, 80),
    createFadedNode("sows", "SOWs", "clipboard", -80, 340),
    createFadedNode("references", "References", "star", -60, 460),
    createFadedNode("deliverables", "Deliverables", "package", 180, 20),
    createFadedNode("meetings", "Meetings", "calendar", 400, 20),
    createFadedNode("travel", "Travel", "globe", 620, 60),
    createFadedNode("expenses", "Expenses", "receipt", 800, 140),
    createFadedNode("time-sheets", "Time Sheets", "clock", 820, 300),
    createFadedNode("findings", "Findings", "idea", 800, 420),
    createFadedNode("recommendations", "Recommendations", "sparkles", 620, 440),
    createFadedNode("skills", "Skills", "zap", 400, 480),
    createFadedNode("certifications", "Certifications", "award", 180, 480),
  ],
  investors: [
    // Main nodes
    createEntityNode(
      "fund",
      "Fund",
      "landmark",
      "Custom",
      [
        { name: "Fund name", icon: "text" },
        { name: "AUM", icon: "dollar" },
        { name: "Stage focus", icon: "target" },
      ],
      7,
      100,
      200
    ),
    createEntityNode(
      "portfolio",
      "Portfolio Co.",
      "briefcase",
      "Standard",
      [
        { name: "Company", icon: "building" },
        { name: "Investment", icon: "dollar" },
        { name: "Ownership %", icon: "percent" },
      ],
      9,
      370,
      140
    ),
    createEntityNode(
      "round",
      "Round",
      "layers",
      "Custom",
      [
        { name: "Series", icon: "tag" },
        { name: "Valuation", icon: "dollar" },
        { name: "Close date", icon: "calendar" },
      ],
      5,
      370,
      340
    ),
    createEntityNode(
      "founder",
      "Founder",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "LinkedIn", icon: "link" },
        { name: "Previous exits", icon: "trending-up" },
      ],
      4,
      640,
      240
    ),
    // Faded nodes
    createFadedNode("lps", "LPs", "users", -80, 80),
    createFadedNode("commitments", "Commitments", "dollar", -80, 340),
    createFadedNode("distributions", "Distributions", "percent", -60, 460),
    createFadedNode("deal-flow", "Deal Flow", "git", 180, 20),
    createFadedNode("term-sheets", "Term Sheets", "file-text", 400, 20),
    createFadedNode("board-seats", "Board Seats", "users", 620, 60),
    createFadedNode("kpis", "KPIs", "bar-chart", 800, 140),
    createFadedNode("reports", "Reports", "clipboard", 820, 300),
    createFadedNode("meetings", "Meetings", "calendar", 800, 420),
    createFadedNode("exits", "Exits", "rocket", 620, 440),
    createFadedNode("co-investors", "Co-investors", "users", 400, 480),
    createFadedNode("pipeline", "Pipeline", "target", 180, 480),
  ],
  healthcare: [
    // Main nodes
    createEntityNode(
      "patient",
      "Patient",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "DOB", icon: "calendar" },
        { name: "Insurance", icon: "shield" },
      ],
      12,
      100,
      200
    ),
    createEntityNode(
      "appointment",
      "Appointment",
      "calendar",
      "Standard",
      [
        { name: "Date", icon: "calendar" },
        { name: "Provider", icon: "user" },
        { name: "Type", icon: "tag" },
      ],
      5,
      370,
      140
    ),
    createEntityNode(
      "treatment",
      "Treatment",
      "activity",
      "Custom",
      [
        { name: "Diagnosis", icon: "text" },
        { name: "Procedure", icon: "tag" },
        { name: "Status", icon: "circle" },
      ],
      8,
      370,
      340
    ),
    createEntityNode(
      "provider",
      "Provider",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Specialty", icon: "tag" },
        { name: "License", icon: "shield" },
      ],
      6,
      640,
      240
    ),
    // Faded nodes
    createFadedNode("records", "Medical Records", "file-text", -80, 80),
    createFadedNode("prescriptions", "Prescriptions", "clipboard", -80, 340),
    createFadedNode("allergies", "Allergies", "bell", -60, 460),
    createFadedNode("lab-results", "Lab Results", "activity", 180, 20),
    createFadedNode("referrals", "Referrals", "link", 400, 20),
    createFadedNode("insurance", "Insurance", "shield", 620, 60),
    createFadedNode("claims", "Claims", "dollar", 800, 140),
    createFadedNode("billing", "Billing", "receipt", 820, 300),
    createFadedNode("notes", "Clinical Notes", "text", 800, 420),
    createFadedNode("facilities", "Facilities", "building", 620, 440),
    createFadedNode("schedules", "Schedules", "calendar", 400, 480),
    createFadedNode("forms", "Forms", "clipboard", 180, 480),
  ],
};

// Edge configurations for each tab
const edgeConfigurations: Record<TabId, Edge[]> = {
  saas: [
    // Main edges
    { id: "e1", source: "company", target: "subscription", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "company", target: "feature-usage", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "subscription", target: "user", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "feature-usage", target: "user", type: "smoothstep", style: mainEdgeStyle },
    // Secondary to main edges
    { id: "f1", source: "activity-log", target: "company", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "notifications", target: "company", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "api-keys", target: "company", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "integrations", target: "subscription", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "webhooks", target: "subscription", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "invoices", target: "user", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "payments", target: "user", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "user", target: "support-tickets", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "user", target: "feedback", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "feature-usage", target: "onboarding", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "feature-usage", target: "team", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f12", source: "company", target: "permissions", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary edges
    { id: "s1", source: "activity-log", target: "notifications", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "integrations", target: "webhooks", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "invoices", target: "payments", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "support-tickets", target: "feedback", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "team", target: "permissions", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s6", source: "onboarding", target: "team", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic: Activity Log connects to multiple models
    { id: "p1", source: "activity-log", target: "subscription", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "activity-log", target: "user", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "notifications", target: "user", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  agency: [
    { id: "e1", source: "client", target: "project", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "client", target: "deliverable", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "project", target: "team-member", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "deliverable", target: "team-member", type: "smoothstep", style: mainEdgeStyle },
    // Secondary to main
    { id: "f1", source: "time-entries", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "contracts", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "proposals", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "briefs", target: "project", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "feedback", target: "project", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "assets", target: "team-member", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "team-member", target: "invoices", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "team-member", target: "expenses", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "team-member", target: "reviews", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "deliverable", target: "milestones", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "deliverable", target: "tasks", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f12", source: "client", target: "notes", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "time-entries", target: "contracts", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "contracts", target: "proposals", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "invoices", target: "expenses", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "milestones", target: "tasks", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "briefs", target: "feedback", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic: Notes connects to multiple
    { id: "p1", source: "notes", target: "project", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "notes", target: "deliverable", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "notes", target: "team-member", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p4", source: "time-entries", target: "project", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  ecommerce: [
    { id: "e1", source: "customer", target: "order", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "customer", target: "product", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "order", target: "shipment", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "product", target: "shipment", type: "smoothstep", style: mainEdgeStyle },
    // Secondary to main
    { id: "f1", source: "reviews", target: "customer", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "wishlists", target: "customer", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "carts", target: "customer", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "categories", target: "order", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "promotions", target: "order", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "inventory", target: "shipment", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "shipment", target: "returns", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "shipment", target: "refunds", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "shipment", target: "suppliers", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "product", target: "warehouses", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "product", target: "variants", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f12", source: "customer", target: "addresses", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "wishlists", target: "carts", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "categories", target: "promotions", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "returns", target: "refunds", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "suppliers", target: "warehouses", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "warehouses", target: "inventory", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic: Reviews connects to products too
    { id: "p1", source: "reviews", target: "product", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "reviews", target: "order", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "addresses", target: "order", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  recruiting: [
    { id: "e1", source: "candidate", target: "job", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "candidate", target: "application", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "job", target: "interview", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "application", target: "interview", type: "smoothstep", style: mainEdgeStyle },
    // Secondary to main
    { id: "f1", source: "resumes", target: "candidate", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "skills", target: "candidate", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "sources", target: "candidate", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "pipelines", target: "job", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "scorecards", target: "job", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "offers", target: "interview", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "interview", target: "departments", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "interview", target: "hiring-managers", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "interview", target: "feedback", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "application", target: "assessments", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "application", target: "referrals", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f12", source: "candidate", target: "notes", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "resumes", target: "skills", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "pipelines", target: "scorecards", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "departments", target: "hiring-managers", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "assessments", target: "feedback", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "referrals", target: "sources", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic: Notes and Feedback connect to multiple
    { id: "p1", source: "notes", target: "application", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "notes", target: "interview", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "feedback", target: "candidate", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  realestate: [
    { id: "e1", source: "property", target: "listing", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "property", target: "buyer", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "listing", target: "showing", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "buyer", target: "showing", type: "smoothstep", style: mainEdgeStyle },
    // Secondary to main
    { id: "f1", source: "photos", target: "property", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "documents", target: "property", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "comps", target: "property", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "neighborhoods", target: "listing", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "open-houses", target: "listing", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "offers", target: "showing", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "showing", target: "contracts", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "showing", target: "inspections", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "showing", target: "closings", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "buyer", target: "commissions", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "buyer", target: "agents", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f12", source: "property", target: "leads", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "photos", target: "documents", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "contracts", target: "inspections", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "inspections", target: "closings", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "agents", target: "commissions", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "neighborhoods", target: "comps", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic: Documents connects to multiple
    { id: "p1", source: "documents", target: "listing", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "documents", target: "buyer", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "leads", target: "buyer", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  consulting: [
    { id: "e1", source: "client", target: "engagement", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "client", target: "workstream", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "engagement", target: "consultant", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "workstream", target: "consultant", type: "smoothstep", style: mainEdgeStyle },
    // Secondary to main
    { id: "f1", source: "proposals", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "sows", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "references", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "deliverables", target: "engagement", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "meetings", target: "engagement", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "travel", target: "consultant", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "consultant", target: "expenses", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "consultant", target: "time-sheets", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "consultant", target: "findings", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "workstream", target: "recommendations", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "workstream", target: "skills", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f12", source: "client", target: "certifications", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "proposals", target: "sows", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "expenses", target: "time-sheets", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "findings", target: "recommendations", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "deliverables", target: "meetings", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "skills", target: "certifications", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic: Time-sheets connects to multiple
    { id: "p1", source: "time-sheets", target: "engagement", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "time-sheets", target: "workstream", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "meetings", target: "client", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  investors: [
    { id: "e1", source: "fund", target: "portfolio", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "fund", target: "round", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "portfolio", target: "founder", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "round", target: "founder", type: "smoothstep", style: mainEdgeStyle },
    // Secondary to main
    { id: "f1", source: "lps", target: "fund", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "commitments", target: "fund", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "distributions", target: "fund", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "deal-flow", target: "portfolio", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "term-sheets", target: "portfolio", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "board-seats", target: "founder", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "founder", target: "kpis", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "founder", target: "reports", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "founder", target: "meetings", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "round", target: "exits", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "round", target: "co-investors", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f12", source: "fund", target: "pipeline", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "lps", target: "commitments", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "commitments", target: "distributions", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "deal-flow", target: "term-sheets", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "kpis", target: "reports", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "pipeline", target: "deal-flow", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s6", source: "co-investors", target: "term-sheets", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic: Reports and Meetings connect to multiple
    { id: "p1", source: "reports", target: "portfolio", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "meetings", target: "portfolio", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "meetings", target: "round", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  healthcare: [
    { id: "e1", source: "patient", target: "appointment", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "patient", target: "treatment", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "appointment", target: "provider", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "treatment", target: "provider", type: "smoothstep", style: mainEdgeStyle },
    // Secondary to main
    { id: "f1", source: "records", target: "patient", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "prescriptions", target: "patient", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "allergies", target: "patient", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "lab-results", target: "appointment", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "referrals", target: "appointment", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "insurance", target: "provider", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "provider", target: "claims", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "provider", target: "billing", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "provider", target: "notes", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "treatment", target: "facilities", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "treatment", target: "schedules", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f12", source: "patient", target: "forms", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "records", target: "prescriptions", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "prescriptions", target: "allergies", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "claims", target: "billing", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "facilities", target: "schedules", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "insurance", target: "claims", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic: Notes connects to multiple
    { id: "p1", source: "notes", target: "patient", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "notes", target: "appointment", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "notes", target: "treatment", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p4", source: "forms", target: "appointment", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
};

// Table data for each tab
const tableDataConfigurations: Record<
  TabId,
  {
    headers: string[];
    rows: Array<
      Record<
        string,
        | string
        | {
            text: string;
            variant: "default" | "success" | "warning" | "info" | "muted";
          }
      >
    >;
  }
> = {
  saas: {
    headers: ["Company", "MRR", "Plan", "Status"],
    rows: [
      { Company: "TechFlow Inc", MRR: "$12,500", Plan: { text: "Enterprise", variant: "success" }, Status: { text: "Active", variant: "success" } },
      { Company: "DataPulse", MRR: "$4,200", Plan: { text: "Pro", variant: "info" }, Status: { text: "Active", variant: "success" } },
      { Company: "CloudSync", MRR: "$8,750", Plan: { text: "Enterprise", variant: "success" }, Status: { text: "At Risk", variant: "warning" } },
      { Company: "StartupXYZ", MRR: "$950", Plan: { text: "Starter", variant: "muted" }, Status: { text: "Trial", variant: "info" } },
    ],
  },
  agency: {
    headers: ["Client", "Retainer", "Project", "Status"],
    rows: [
      { Client: "Acme Corp", Retainer: "$15,000/mo", Project: { text: "Brand Refresh", variant: "info" }, Status: { text: "Active", variant: "success" } },
      { Client: "TechStart", Retainer: "$8,500/mo", Project: { text: "Web Redesign", variant: "info" }, Status: { text: "In Review", variant: "warning" } },
      { Client: "GlobalFin", Retainer: "$25,000/mo", Project: { text: "Campaign Q4", variant: "success" }, Status: { text: "Active", variant: "success" } },
      { Client: "HealthPlus", Retainer: "$12,000/mo", Project: { text: "App Launch", variant: "info" }, Status: { text: "Planning", variant: "muted" } },
    ],
  },
  ecommerce: {
    headers: ["Customer", "Orders", "LTV", "Status"],
    rows: [
      { Customer: "Sarah Johnson", Orders: "47", LTV: "$2,340", Status: { text: "VIP", variant: "success" } },
      { Customer: "Mike Chen", Orders: "12", LTV: "$890", Status: { text: "Active", variant: "info" } },
      { Customer: "Emma Wilson", Orders: "28", LTV: "$1,567", Status: { text: "Loyal", variant: "success" } },
      { Customer: "James Brown", Orders: "3", LTV: "$156", Status: { text: "New", variant: "muted" } },
    ],
  },
  recruiting: {
    headers: ["Candidate", "Position", "Stage", "Rating"],
    rows: [
      { Candidate: "Alex Rivera", Position: "Sr. Engineer", Stage: { text: "Final Round", variant: "success" }, Rating: "4.8/5" },
      { Candidate: "Jordan Lee", Position: "Product Manager", Stage: { text: "Phone Screen", variant: "info" }, Rating: "4.2/5" },
      { Candidate: "Casey Morgan", Position: "Designer", Stage: { text: "Onsite", variant: "warning" }, Rating: "4.5/5" },
      { Candidate: "Taylor Kim", Position: "Data Analyst", Stage: { text: "Applied", variant: "muted" }, Rating: "—" },
    ],
  },
  realestate: {
    headers: ["Property", "Price", "Status", "Days"],
    rows: [
      { Property: "123 Oak Street", Price: "$485,000", Status: { text: "Under Contract", variant: "success" }, Days: "12" },
      { Property: "456 Maple Ave", Price: "$725,000", Status: { text: "Active", variant: "info" }, Days: "45" },
      { Property: "789 Pine Blvd", Price: "$1,250,000", Status: { text: "Pending", variant: "warning" }, Days: "8" },
      { Property: "321 Cedar Lane", Price: "$375,000", Status: { text: "New Listing", variant: "muted" }, Days: "2" },
    ],
  },
  consulting: {
    headers: ["Client", "Engagement", "Value", "Status"],
    rows: [
      { Client: "Fortune 500 Co", Engagement: "Digital Transform", Value: "$2.4M", Status: { text: "Active", variant: "success" } },
      { Client: "Tech Unicorn", Engagement: "Strategy Review", Value: "$850K", Status: { text: "Proposal", variant: "info" } },
      { Client: "Regional Bank", Engagement: "Risk Assessment", Value: "$1.2M", Status: { text: "Closing", variant: "warning" } },
      { Client: "Healthcare Sys", Engagement: "Ops Excellence", Value: "$3.1M", Status: { text: "Staffing", variant: "muted" } },
    ],
  },
  investors: {
    headers: ["Portfolio Co.", "Investment", "Series", "Ownership"],
    rows: [
      { "Portfolio Co.": "NeuralTech AI", Investment: "$5M", Series: { text: "Series A", variant: "info" }, Ownership: "12%" },
      { "Portfolio Co.": "GreenEnergy Co", Investment: "$15M", Series: { text: "Series B", variant: "success" }, Ownership: "8%" },
      { "Portfolio Co.": "HealthFirst", Investment: "$2.5M", Series: { text: "Seed", variant: "muted" }, Ownership: "18%" },
      { "Portfolio Co.": "FinanceFlow", Investment: "$25M", Series: { text: "Series C", variant: "warning" }, Ownership: "5%" },
    ],
  },
  healthcare: {
    headers: ["Patient", "Provider", "Next Appt", "Status"],
    rows: [
      { Patient: "John Smith", Provider: "Dr. Martinez", "Next Appt": "Jan 15, 2026", Status: { text: "Active", variant: "success" } },
      { Patient: "Mary Johnson", Provider: "Dr. Chen", "Next Appt": "Jan 18, 2026", Status: { text: "Follow-up", variant: "info" } },
      { Patient: "Robert Davis", Provider: "Dr. Patel", "Next Appt": "Jan 22, 2026", Status: { text: "New Patient", variant: "muted" } },
      { Patient: "Lisa Anderson", Provider: "Dr. Wilson", "Next Appt": "Feb 1, 2026", Status: { text: "Referral", variant: "warning" } },
    ],
  },
};

const nodeTypes: NodeTypes = {
  entityNode: EntityNode,
  addObjectNode: AddObjectNode,
  fadedNode: FadedNode,
} as NodeTypes;

export function DataModelShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>("saas");
  const [nodes, setNodes, onNodesChange] = useNodesState(nodeConfigurations["saas"]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgeConfigurations["saas"]);

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      setActiveTab(tabId);
      setNodes(nodeConfigurations[tabId]);
      setEdges(edgeConfigurations[tabId]);
    },
    [setNodes, setEdges]
  );

  const currentTableData = useMemo(
    () => tableDataConfigurations[activeTab],
    [activeTab]
  );

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />

      <div className="container relative mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
            <span className="text-foreground">
              A seismic shift in CRM flexibility.
            </span>{" "}
            <span className="text-muted-foreground">
              Our powerful data model adapts to how your business works, not the
              other way around. Your business model — perfectly reflected in
              your CRM.
            </span>
          </h2>

          <Button variant="outline" className="mt-6">
            Explore our data model
          </Button>
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
              onClick={() => handleTabChange(tab.id)}
              onMouseEnter={() => handleTabChange(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200",
                activeTab === tab.id
                  ? "bg-background border-border text-foreground shadow-sm"
                  : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Graph Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative bg-background/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden"
        >
          <div className="h-[500px] md:h-[550px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              preventScrolling={false}
            >
              <Background
                gap={20}
                size={1}
                color="var(--color-muted-foreground)"
                style={{ opacity: 0.15 }}
              />
            </ReactFlow>
          </div>

          {/* Table */}
          <div className="border-t border-border/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <DataModelTable
                  headers={currentTableData.headers}
                  rows={currentTableData.rows}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
