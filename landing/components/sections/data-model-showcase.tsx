"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  type NodeTypes,
  type EdgeTypes,
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
import { AnimatedEdge } from "@/components/ui/data-model/animated-edge";
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

// Node configurations for each tab - varied layouts and node counts
const nodeConfigurations: Record<TabId, Node[]> = {
  // SaaS: 5 main nodes in a branching tree structure
  saas: [
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
      50,
      240
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
      300,
      120
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
      550,
      120
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
      300,
      360
    ),
    createEntityNode(
      "team",
      "Team",
      "users",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Members", icon: "hash" },
        { name: "Plan seats", icon: "layers" },
      ],
      4,
      550,
      360
    ),
    // Faded ecosystem nodes
    createFadedNode("activity-log", "Activity Log", "scroll", -100, 100),
    createFadedNode("notifications", "Notifications", "bell", -100, 380),
    createFadedNode("api-keys", "API Keys", "code", 80, 480),
    createFadedNode("integrations", "Integrations", "zap", 300, 20),
    createFadedNode("webhooks", "Webhooks", "link", 520, 20),
    createFadedNode("invoices", "Invoices", "receipt", 750, 80),
    createFadedNode("payments", "Payments", "dollar", 780, 200),
    createFadedNode("support-tickets", "Support", "message", 780, 320),
    createFadedNode("feedback", "Feedback", "heart", 750, 440),
    createFadedNode("onboarding", "Onboarding", "rocket", 520, 480),
    createFadedNode("permissions", "Permissions", "shield", 300, 480),
  ],
  // Agency: Horizontal flow with 5 nodes - linear pipeline
  agency: [
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
      30,
      220
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
      230,
      220
    ),
    createEntityNode(
      "task",
      "Task",
      "task",
      "Custom",
      [
        { name: "Title", icon: "text" },
        { name: "Assignee", icon: "user" },
        { name: "Due date", icon: "calendar" },
      ],
      6,
      430,
      220
    ),
    createEntityNode(
      "deliverable",
      "Deliverable",
      "package",
      "Custom",
      [
        { name: "Type", icon: "tag" },
        { name: "Status", icon: "circle" },
        { name: "Version", icon: "hash" },
      ],
      4,
      630,
      220
    ),
    // Faded nodes - arranged for horizontal flow
    createFadedNode("proposals", "Proposals", "clipboard", -60, 100),
    createFadedNode("contracts", "Contracts", "file-text", -60, 340),
    createFadedNode("time-entries", "Time", "clock", 130, 80),
    createFadedNode("briefs", "Briefs", "scroll", 130, 360),
    createFadedNode("feedback", "Feedback", "message", 330, 80),
    createFadedNode("milestones", "Milestones", "flag", 330, 360),
    createFadedNode("assets", "Assets", "folder", 530, 80),
    createFadedNode("reviews", "Reviews", "star", 530, 360),
    createFadedNode("invoices", "Invoices", "receipt", 730, 100),
    createFadedNode("notes", "Notes", "text", 730, 340),
    createFadedNode("team-member", "Team", "users", 830, 220),
  ],
  // E-commerce: Central hub pattern with Customer in center
  ecommerce: [
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
      320,
      220
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
      80,
      120
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
      560,
      120
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
      80,
      340
    ),
    createEntityNode(
      "subscription",
      "Subscription",
      "credit-card",
      "Custom",
      [
        { name: "Plan", icon: "tag" },
        { name: "Next billing", icon: "calendar" },
        { name: "Status", icon: "circle" },
      ],
      5,
      560,
      340
    ),
    // Faded nodes - radial around center
    createFadedNode("reviews", "Reviews", "star", 320, 40),
    createFadedNode("wishlists", "Wishlists", "heart", 140, 40),
    createFadedNode("carts", "Carts", "cart", 500, 40),
    createFadedNode("categories", "Categories", "folder", -60, 180),
    createFadedNode("promotions", "Promotions", "tag", -60, 280),
    createFadedNode("returns", "Returns", "package", -60, 400),
    createFadedNode("inventory", "Inventory", "database", 700, 180),
    createFadedNode("suppliers", "Suppliers", "building", 700, 280),
    createFadedNode("warehouses", "Warehouses", "building", 700, 400),
    createFadedNode("addresses", "Addresses", "globe", 320, 440),
  ],
  // Recruiting: Vertical pipeline with 3 main + add object
  recruiting: [
    createEntityNode(
      "candidate",
      "Candidate",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Email", icon: "at-sign" },
        { name: "Source", icon: "link" },
      ],
      10,
      300,
      80
    ),
    createEntityNode(
      "application",
      "Application",
      "file-text",
      "Standard",
      [
        { name: "Job", icon: "briefcase" },
        { name: "Stage", icon: "flag" },
        { name: "Rating", icon: "star" },
      ],
      5,
      300,
      260
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
      300,
      440
    ),
    {
      id: "add-stage",
      type: "addObjectNode",
      position: { x: 550, y: 260 },
      data: {},
    },
    // Faded nodes - flanking the pipeline
    createFadedNode("resumes", "Resumes", "file-text", 80, 40),
    createFadedNode("skills", "Skills", "sparkles", 520, 40),
    createFadedNode("sources", "Sources", "link", 80, 140),
    createFadedNode("job", "Job Opening", "briefcase", 80, 260),
    createFadedNode("scorecards", "Scorecards", "clipboard", 80, 380),
    createFadedNode("offers", "Offers", "dollar", 520, 380),
    createFadedNode("departments", "Depts", "building", 520, 140),
    createFadedNode("hiring-managers", "Hiring Mgrs", "users", 80, 480),
    createFadedNode("feedback", "Feedback", "message", 520, 480),
    createFadedNode("notes", "Notes", "text", 720, 260),
  ],
  // Real Estate: Star pattern with Property in center
  realestate: [
    createEntityNode(
      "property",
      "Property",
      "building",
      "Standard",
      [
        { name: "Address", icon: "globe" },
        { name: "Price", icon: "dollar" },
        { name: "Bedrooms", icon: "hash" },
      ],
      15,
      320,
      220
    ),
    createEntityNode(
      "listing",
      "Listing",
      "tag",
      "Standard",
      [
        { name: "MLS #", icon: "hash" },
        { name: "Listed date", icon: "calendar" },
        { name: "Status", icon: "circle" },
      ],
      7,
      80,
      100
    ),
    createEntityNode(
      "agent",
      "Agent",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "License", icon: "shield" },
        { name: "Commission", icon: "percent" },
      ],
      5,
      560,
      100
    ),
    createEntityNode(
      "buyer",
      "Buyer",
      "contact",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Budget", icon: "dollar" },
        { name: "Pre-approved", icon: "circle" },
      ],
      6,
      80,
      360
    ),
    createEntityNode(
      "showing",
      "Showing",
      "calendar",
      "Custom",
      [
        { name: "Date", icon: "calendar" },
        { name: "Time", icon: "clock" },
        { name: "Feedback", icon: "message" },
      ],
      3,
      560,
      360
    ),
    // Faded nodes - around the star
    createFadedNode("photos", "Photos", "folder", 320, 40),
    createFadedNode("documents", "Documents", "file-text", -60, 180),
    createFadedNode("comps", "Comparables", "bar-chart", -60, 280),
    createFadedNode("offers", "Offers", "dollar", -60, 420),
    createFadedNode("neighborhoods", "Neighborhoods", "globe", 180, 440),
    createFadedNode("open-houses", "Open Houses", "calendar", 460, 440),
    createFadedNode("contracts", "Contracts", "file-text", 700, 180),
    createFadedNode("inspections", "Inspections", "clipboard", 700, 280),
    createFadedNode("closings", "Closings", "flag", 700, 420),
  ],
  // Consulting: Hierarchical tree - Client at top, branching down
  consulting: [
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
      300,
      60
    ),
    createEntityNode(
      "engagement",
      "Engagement",
      "briefcase",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Type", icon: "tag" },
        { name: "Duration", icon: "clock" },
      ],
      7,
      300,
      220
    ),
    createEntityNode(
      "workstream-a",
      "Strategy",
      "layers",
      "Custom",
      [
        { name: "Focus area", icon: "target" },
        { name: "Lead", icon: "user" },
        { name: "Status", icon: "circle" },
      ],
      5,
      100,
      380
    ),
    createEntityNode(
      "workstream-b",
      "Operations",
      "layers",
      "Custom",
      [
        { name: "Focus area", icon: "target" },
        { name: "Lead", icon: "user" },
        { name: "Status", icon: "circle" },
      ],
      5,
      500,
      380
    ),
    // Faded nodes
    createFadedNode("proposals", "Proposals", "file-text", 80, 20),
    createFadedNode("sows", "SOWs", "clipboard", 520, 20),
    createFadedNode("meetings", "Meetings", "calendar", 80, 140),
    createFadedNode("travel", "Travel", "globe", 520, 140),
    createFadedNode("deliverables", "Deliverables", "package", 80, 260),
    createFadedNode("findings", "Findings", "idea", 520, 260),
    createFadedNode("consultant", "Consultants", "users", -40, 320),
    createFadedNode("time-sheets", "Timesheets", "clock", -40, 440),
    createFadedNode("expenses", "Expenses", "receipt", 640, 320),
    createFadedNode("recommendations", "Recs", "sparkles", 640, 440),
    createFadedNode("skills", "Skills", "zap", 300, 500),
  ],
  // Investors: Triangle with Fund/Portfolio/Founder + Add for deal sourcing
  investors: [
    createEntityNode(
      "fund",
      "Fund",
      "landmark",
      "Custom",
      [
        { name: "Fund name", icon: "text" },
        { name: "AUM", icon: "dollar" },
        { name: "Vintage", icon: "calendar" },
      ],
      7,
      300,
      60
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
      100,
      280
    ),
    createEntityNode(
      "founder",
      "Founder",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "LinkedIn", icon: "link" },
        { name: "Track record", icon: "trending-up" },
      ],
      4,
      500,
      280
    ),
    {
      id: "add-deal",
      type: "addObjectNode",
      position: { x: 300, y: 420 },
      data: {},
    },
    // Faded nodes
    createFadedNode("lps", "LPs", "users", 80, 20),
    createFadedNode("commitments", "Commitments", "dollar", 520, 20),
    createFadedNode("deal-flow", "Deal Flow", "git", 80, 140),
    createFadedNode("term-sheets", "Term Sheets", "file-text", 520, 140),
    createFadedNode("round", "Rounds", "layers", -40, 220),
    createFadedNode("board-seats", "Board Seats", "users", -40, 340),
    createFadedNode("kpis", "KPIs", "bar-chart", 640, 220),
    createFadedNode("reports", "Reports", "clipboard", 640, 340),
    createFadedNode("meetings", "Meetings", "calendar", 140, 460),
    createFadedNode("exits", "Exits", "rocket", 460, 460),
    createFadedNode("pipeline", "Pipeline", "target", 300, 540),
  ],
  // Healthcare: 6 nodes in complex interconnected layout
  healthcare: [
    createEntityNode(
      "patient",
      "Patient",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "DOB", icon: "calendar" },
        { name: "MRN", icon: "hash" },
      ],
      12,
      50,
      180
    ),
    createEntityNode(
      "encounter",
      "Encounter",
      "calendar",
      "Standard",
      [
        { name: "Date", icon: "calendar" },
        { name: "Type", icon: "tag" },
        { name: "Chief complaint", icon: "text" },
      ],
      5,
      280,
      80
    ),
    createEntityNode(
      "provider",
      "Provider",
      "user",
      "Standard",
      [
        { name: "Name", icon: "text" },
        { name: "Specialty", icon: "tag" },
        { name: "NPI", icon: "hash" },
      ],
      6,
      520,
      80
    ),
    createEntityNode(
      "diagnosis",
      "Diagnosis",
      "activity",
      "Custom",
      [
        { name: "ICD-10", icon: "hash" },
        { name: "Description", icon: "text" },
        { name: "Severity", icon: "circle" },
      ],
      8,
      280,
      280
    ),
    createEntityNode(
      "treatment",
      "Treatment",
      "activity",
      "Custom",
      [
        { name: "Procedure", icon: "tag" },
        { name: "Status", icon: "circle" },
        { name: "Notes", icon: "text" },
      ],
      7,
      520,
      280
    ),
    createEntityNode(
      "prescription",
      "Prescription",
      "clipboard",
      "Custom",
      [
        { name: "Medication", icon: "text" },
        { name: "Dosage", icon: "hash" },
        { name: "Refills", icon: "hash" },
      ],
      5,
      400,
      440
    ),
    // Faded nodes
    createFadedNode("records", "Records", "file-text", -80, 80),
    createFadedNode("allergies", "Allergies", "bell", -80, 280),
    createFadedNode("vitals", "Vitals", "activity", -80, 380),
    createFadedNode("lab-results", "Lab Results", "activity", 140, 440),
    createFadedNode("insurance", "Insurance", "shield", 660, 440),
    createFadedNode("claims", "Claims", "dollar", 700, 180),
    createFadedNode("billing", "Billing", "receipt", 700, 320),
    createFadedNode("referrals", "Referrals", "link", 400, 0),
    createFadedNode("facilities", "Facilities", "building", 660, 0),
  ],
};

// Edge configurations for each tab - updated to match new node structures
const edgeConfigurations: Record<TabId, Edge[]> = {
  // SaaS: Branching tree from Company
  saas: [
    // Main edges - branching from company
    { id: "e1", source: "company", target: "subscription", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "company", target: "feature-usage", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "subscription", target: "user", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "subscription", target: "team", type: "smoothstep", style: mainEdgeStyle },
    { id: "e5", source: "feature-usage", target: "team", type: "smoothstep", style: mainEdgeStyle },
    // Secondary edges
    { id: "f1", source: "activity-log", target: "company", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "notifications", target: "company", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "integrations", target: "subscription", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "webhooks", target: "subscription", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "user", target: "invoices", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "user", target: "payments", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "user", target: "support-tickets", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "team", target: "feedback", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "team", target: "onboarding", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "feature-usage", target: "permissions", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "company", target: "api-keys", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "activity-log", target: "notifications", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "integrations", target: "webhooks", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "invoices", target: "payments", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "support-tickets", target: "feedback", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "onboarding", target: "permissions", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic
    { id: "p1", source: "activity-log", target: "user", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "notifications", target: "user", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "activity-log", target: "team", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  // Agency: Horizontal pipeline flow
  agency: [
    // Main edges - linear flow
    { id: "e1", source: "client", target: "project", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "project", target: "task", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "task", target: "deliverable", type: "smoothstep", style: mainEdgeStyle },
    // Secondary edges
    { id: "f1", source: "proposals", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "contracts", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "time-entries", target: "project", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "briefs", target: "project", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "feedback", target: "task", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "milestones", target: "task", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "assets", target: "deliverable", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "reviews", target: "deliverable", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "deliverable", target: "invoices", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "deliverable", target: "notes", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "deliverable", target: "team-member", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "proposals", target: "contracts", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "time-entries", target: "briefs", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "feedback", target: "milestones", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "assets", target: "reviews", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "invoices", target: "notes", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic - notes to multiple
    { id: "p1", source: "notes", target: "client", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "notes", target: "project", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "time-entries", target: "task", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  // E-commerce: Hub pattern with Customer in center
  ecommerce: [
    // Main edges - radiating from customer
    { id: "e1", source: "order", target: "customer", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "product", target: "customer", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "shipment", target: "customer", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "subscription", target: "customer", type: "smoothstep", style: mainEdgeStyle },
    { id: "e5", source: "order", target: "shipment", type: "smoothstep", style: mainEdgeStyle },
    { id: "e6", source: "product", target: "subscription", type: "smoothstep", style: mainEdgeStyle },
    // Secondary edges
    { id: "f1", source: "reviews", target: "customer", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "wishlists", target: "order", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "carts", target: "order", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "categories", target: "order", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "promotions", target: "order", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "inventory", target: "product", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "suppliers", target: "product", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "warehouses", target: "product", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "returns", target: "shipment", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "customer", target: "addresses", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "wishlists", target: "carts", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "categories", target: "promotions", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "inventory", target: "suppliers", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "suppliers", target: "warehouses", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic - reviews to multiple
    { id: "p1", source: "reviews", target: "product", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "reviews", target: "order", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "addresses", target: "shipment", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  // Recruiting: Vertical pipeline
  recruiting: [
    // Main edges - vertical flow
    { id: "e1", source: "candidate", target: "application", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "application", target: "interview", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "application", target: "add-stage", type: "smoothstep", style: mainEdgeStyle },
    // Secondary edges
    { id: "f1", source: "resumes", target: "candidate", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "skills", target: "candidate", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "sources", target: "candidate", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "job", target: "application", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "scorecards", target: "application", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "departments", target: "application", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "hiring-managers", target: "interview", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "interview", target: "offers", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "interview", target: "feedback", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "add-stage", target: "notes", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "resumes", target: "skills", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "sources", target: "job", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "scorecards", target: "departments", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "offers", target: "feedback", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic
    { id: "p1", source: "notes", target: "candidate", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "notes", target: "application", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "notes", target: "interview", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  // Real Estate: Star pattern with Property in center
  realestate: [
    // Main edges - star from property
    { id: "e1", source: "listing", target: "property", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "agent", target: "property", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "buyer", target: "property", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "showing", target: "property", type: "smoothstep", style: mainEdgeStyle },
    { id: "e5", source: "listing", target: "agent", type: "smoothstep", style: mainEdgeStyle },
    { id: "e6", source: "buyer", target: "showing", type: "smoothstep", style: mainEdgeStyle },
    // Secondary edges
    { id: "f1", source: "photos", target: "property", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "documents", target: "property", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "comps", target: "property", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "offers", target: "buyer", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "neighborhoods", target: "listing", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "open-houses", target: "listing", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "showing", target: "contracts", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "showing", target: "inspections", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "showing", target: "closings", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "documents", target: "comps", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "neighborhoods", target: "open-houses", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "contracts", target: "inspections", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "inspections", target: "closings", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic
    { id: "p1", source: "documents", target: "listing", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "documents", target: "buyer", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "photos", target: "listing", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  // Consulting: Hierarchical tree
  consulting: [
    // Main edges - tree structure
    { id: "e1", source: "client", target: "engagement", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "engagement", target: "workstream-a", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "engagement", target: "workstream-b", type: "smoothstep", style: mainEdgeStyle },
    // Secondary edges
    { id: "f1", source: "proposals", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "sows", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "meetings", target: "client", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "travel", target: "engagement", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "deliverables", target: "engagement", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "findings", target: "engagement", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "consultant", target: "workstream-a", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "time-sheets", target: "workstream-a", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "expenses", target: "workstream-b", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "recommendations", target: "workstream-b", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "workstream-a", target: "skills", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f12", source: "workstream-b", target: "skills", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "proposals", target: "sows", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "deliverables", target: "findings", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "consultant", target: "time-sheets", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "expenses", target: "recommendations", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic
    { id: "p1", source: "meetings", target: "engagement", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "time-sheets", target: "workstream-b", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "consultant", target: "workstream-b", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  // Investors: Triangle with add object
  investors: [
    // Main edges - triangle
    { id: "e1", source: "fund", target: "portfolio", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "fund", target: "founder", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "portfolio", target: "founder", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "portfolio", target: "add-deal", type: "smoothstep", style: mainEdgeStyle },
    { id: "e5", source: "founder", target: "add-deal", type: "smoothstep", style: mainEdgeStyle },
    // Secondary edges
    { id: "f1", source: "lps", target: "fund", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "commitments", target: "fund", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "deal-flow", target: "fund", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "term-sheets", target: "fund", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "round", target: "portfolio", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "board-seats", target: "portfolio", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "founder", target: "kpis", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "founder", target: "reports", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "add-deal", target: "meetings", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f10", source: "add-deal", target: "exits", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f11", source: "add-deal", target: "pipeline", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "lps", target: "commitments", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "deal-flow", target: "term-sheets", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "round", target: "board-seats", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "kpis", target: "reports", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s5", source: "meetings", target: "exits", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic
    { id: "p1", source: "reports", target: "portfolio", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "meetings", target: "portfolio", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "pipeline", target: "fund", type: "smoothstep", style: polymorphicEdgeStyle },
  ],
  // Healthcare: Complex interconnected 6-node layout
  healthcare: [
    // Main edges - complex web
    { id: "e1", source: "patient", target: "encounter", type: "smoothstep", style: mainEdgeStyle },
    { id: "e2", source: "patient", target: "diagnosis", type: "smoothstep", style: mainEdgeStyle },
    { id: "e3", source: "encounter", target: "provider", type: "smoothstep", style: mainEdgeStyle },
    { id: "e4", source: "encounter", target: "diagnosis", type: "smoothstep", style: mainEdgeStyle },
    { id: "e5", source: "diagnosis", target: "treatment", type: "smoothstep", style: mainEdgeStyle },
    { id: "e6", source: "treatment", target: "provider", type: "smoothstep", style: mainEdgeStyle },
    { id: "e7", source: "treatment", target: "prescription", type: "smoothstep", style: mainEdgeStyle },
    { id: "e8", source: "diagnosis", target: "prescription", type: "smoothstep", style: mainEdgeStyle },
    // Secondary edges
    { id: "f1", source: "records", target: "patient", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f2", source: "allergies", target: "patient", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f3", source: "vitals", target: "patient", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f4", source: "referrals", target: "encounter", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f5", source: "facilities", target: "provider", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f6", source: "provider", target: "claims", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f7", source: "provider", target: "billing", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f8", source: "prescription", target: "lab-results", type: "smoothstep", style: fadedEdgeStyle },
    { id: "f9", source: "prescription", target: "insurance", type: "smoothstep", style: fadedEdgeStyle },
    // Inter-secondary
    { id: "s1", source: "records", target: "allergies", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s2", source: "allergies", target: "vitals", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s3", source: "claims", target: "billing", type: "smoothstep", style: interSecondaryEdgeStyle },
    { id: "s4", source: "lab-results", target: "insurance", type: "smoothstep", style: interSecondaryEdgeStyle },
    // Polymorphic
    { id: "p1", source: "records", target: "encounter", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p2", source: "records", target: "diagnosis", type: "smoothstep", style: polymorphicEdgeStyle },
    { id: "p3", source: "insurance", target: "patient", type: "smoothstep", style: polymorphicEdgeStyle },
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

const edgeTypes: EdgeTypes = {
  animatedEdge: AnimatedEdge,
} as EdgeTypes;

// Helper to add staggered animation delays to nodes
function addAnimationDelays(nodes: Node[]): Node[] {
  // Separate main nodes (entityNode, addObjectNode) from faded nodes
  const mainNodes = nodes.filter(n => n.type === "entityNode" || n.type === "addObjectNode");
  const fadedNodes = nodes.filter(n => n.type === "fadedNode");

  // Add delays: main nodes first (0-0.4s), then faded nodes (0.3-0.8s)
  const animatedMainNodes = mainNodes.map((node, index) => ({
    ...node,
    data: {
      ...node.data,
      animationDelay: index * 0.08,
    },
  }));

  const animatedFadedNodes = fadedNodes.map((node, index) => ({
    ...node,
    data: {
      ...node.data,
      animationDelay: 0.25 + index * 0.04,
    },
  }));

  return [...animatedMainNodes, ...animatedFadedNodes];
}

// Helper to add animation delays to edges based on connected nodes
function addEdgeAnimationDelays(edges: Edge[], animatedNodes: Node[]): Edge[] {
  // Create a map of node id to animation delay
  const nodeDelayMap = new Map<string, number>();
  animatedNodes.forEach(node => {
    const delay = (node.data as { animationDelay?: number }).animationDelay ?? 0;
    nodeDelayMap.set(node.id, delay);
  });

  return edges.map(edge => {
    const sourceDelay = nodeDelayMap.get(edge.source) ?? 0;
    const targetDelay = nodeDelayMap.get(edge.target) ?? 0;
    // Edge appears after both connected nodes have appeared (use the later delay)
    // Add a small offset so the edge starts drawing as the later node finishes appearing
    const edgeDelay = Math.max(sourceDelay, targetDelay) + 0.15;

    return {
      ...edge,
      type: "animatedEdge",
      data: {
        ...edge.data,
        animationDelay: edgeDelay,
      },
    };
  });
}

export function DataModelShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>("saas");
  const [animationKey, setAnimationKey] = useState(0);
  const initialNodes = addAnimationDelays(nodeConfigurations["saas"]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    addEdgeAnimationDelays(edgeConfigurations["saas"], initialNodes)
  );

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      if (tabId === activeTab) return;
      setActiveTab(tabId);
      // Add animation delays and increment key to force re-mount
      const animatedNodes = addAnimationDelays(nodeConfigurations[tabId]);
      setNodes(animatedNodes);
      setEdges(addEdgeAnimationDelays(edgeConfigurations[tabId], animatedNodes));
      setAnimationKey(prev => prev + 1);
    },
    [activeTab, setNodes, setEdges]
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
              key={animationKey}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
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
