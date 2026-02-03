import type { EdgeConfigurations } from "../types";
import {
  mainEdgeStyle,
  fadedEdgeStyle,
  interSecondaryEdgeStyle,
  polymorphicEdgeStyle,
} from "./edge-styles";

export const edgeConfigurations: EdgeConfigurations = {
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
