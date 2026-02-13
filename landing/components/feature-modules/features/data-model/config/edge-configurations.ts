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
    // Main edges — branching from company
    {
      id: "e1",
      source: "company",
      target: "subscription",

      style: mainEdgeStyle,
    },
    {
      id: "e2",
      source: "company",
      target: "feature-usage",

      style: mainEdgeStyle,
    },
    {
      id: "e3",
      source: "subscription",
      target: "user",

      style: mainEdgeStyle,
    },
    {
      id: "e4",
      source: "subscription",
      target: "team",

      style: mainEdgeStyle,
    },
    {
      id: "e5",
      source: "feature-usage",
      target: "team",

      style: mainEdgeStyle,
    },
    // Secondary edges
    {
      id: "f1",
      source: "activity-log",
      target: "company",

      style: fadedEdgeStyle,
    },
    {
      id: "f2",
      source: "notifications",
      target: "company",

      style: fadedEdgeStyle,
    },
    {
      id: "f3",
      source: "integrations",
      target: "subscription",

      style: fadedEdgeStyle,
    },
    {
      id: "f4",
      source: "webhooks",
      target: "subscription",

      style: fadedEdgeStyle,
    },
    {
      id: "f5",
      source: "user",
      target: "invoices",

      style: fadedEdgeStyle,
    },
    {
      id: "f6",
      source: "user",
      target: "payments",

      style: fadedEdgeStyle,
    },
    {
      id: "f7",
      source: "user",
      target: "support-tickets",

      style: fadedEdgeStyle,
    },
    {
      id: "f8",
      source: "team",
      target: "feedback",

      style: fadedEdgeStyle,
    },
    {
      id: "f9",
      source: "team",
      target: "onboarding",

      style: fadedEdgeStyle,
    },
    {
      id: "f10",
      source: "feature-usage",
      target: "permissions",

      style: fadedEdgeStyle,
    },
    {
      id: "f11",
      source: "company",
      target: "api-keys",

      style: fadedEdgeStyle,
    },
    // Inter-secondary
    {
      id: "s1",
      source: "activity-log",
      target: "notifications",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s2",
      source: "integrations",
      target: "webhooks",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s3",
      source: "invoices",
      target: "payments",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s4",
      source: "support-tickets",
      target: "feedback",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s5",
      source: "onboarding",
      target: "permissions",

      style: interSecondaryEdgeStyle,
    },
    // Polymorphic
    {
      id: "p1",
      source: "activity-log",
      target: "user",

      style: polymorphicEdgeStyle,
    },
    {
      id: "p2",
      source: "notifications",
      target: "user",

      style: polymorphicEdgeStyle,
    },
    {
      id: "p3",
      source: "activity-log",
      target: "team",

      style: polymorphicEdgeStyle,
    },
  ],

  // Agency: Horizontal pipeline flow
  agency: [
    // Main edges — linear flow
    {
      id: "e1",
      source: "client",
      target: "project",

      style: mainEdgeStyle,
    },
    {
      id: "e2",
      source: "project",
      target: "task",

      style: mainEdgeStyle,
    },
    {
      id: "e3",
      source: "task",
      target: "deliverable",

      style: mainEdgeStyle,
    },
    // Secondary edges
    {
      id: "f1",
      source: "proposals",
      target: "client",

      style: fadedEdgeStyle,
    },
    {
      id: "f2",
      source: "contracts",
      target: "client",

      style: fadedEdgeStyle,
    },
    {
      id: "f3",
      source: "time-entries",
      target: "project",

      style: fadedEdgeStyle,
    },
    {
      id: "f4",
      source: "briefs",
      target: "project",

      style: fadedEdgeStyle,
    },
    {
      id: "f5",
      source: "feedback",
      target: "task",

      style: fadedEdgeStyle,
    },
    {
      id: "f6",
      source: "milestones",
      target: "task",

      style: fadedEdgeStyle,
    },
    {
      id: "f7",
      source: "assets",
      target: "deliverable",

      style: fadedEdgeStyle,
    },
    {
      id: "f8",
      source: "reviews",
      target: "deliverable",

      style: fadedEdgeStyle,
    },
    {
      id: "f9",
      source: "deliverable",
      target: "invoices",

      style: fadedEdgeStyle,
    },
    {
      id: "f10",
      source: "deliverable",
      target: "notes",

      style: fadedEdgeStyle,
    },
    {
      id: "f11",
      source: "deliverable",
      target: "team-member",

      style: fadedEdgeStyle,
    },
    // Inter-secondary
    {
      id: "s1",
      source: "proposals",
      target: "contracts",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s2",
      source: "time-entries",
      target: "briefs",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s3",
      source: "feedback",
      target: "milestones",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s4",
      source: "assets",
      target: "reviews",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s5",
      source: "invoices",
      target: "notes",

      style: interSecondaryEdgeStyle,
    },
    // Polymorphic
    {
      id: "p1",
      source: "notes",
      target: "client",

      style: polymorphicEdgeStyle,
    },
    {
      id: "p2",
      source: "notes",
      target: "project",

      style: polymorphicEdgeStyle,
    },
    {
      id: "p3",
      source: "time-entries",
      target: "task",

      style: polymorphicEdgeStyle,
    },
  ],

  // E-commerce: Hub pattern with Customer in center
  ecommerce: [
    // Main edges — radiating from customer
    {
      id: "e1",
      source: "order",
      target: "customer",

      style: mainEdgeStyle,
    },
    {
      id: "e2",
      source: "product",
      target: "customer",

      style: mainEdgeStyle,
    },
    {
      id: "e3",
      source: "shipment",
      target: "customer",

      style: mainEdgeStyle,
    },
    {
      id: "e4",
      source: "subscription",
      target: "customer",

      style: mainEdgeStyle,
    },
    {
      id: "e5",
      source: "order",
      target: "shipment",

      style: mainEdgeStyle,
    },
    {
      id: "e6",
      source: "product",
      target: "subscription",

      style: mainEdgeStyle,
    },
    // Secondary edges
    {
      id: "f1",
      source: "reviews",
      target: "customer",

      style: fadedEdgeStyle,
    },
    {
      id: "f2",
      source: "wishlists",
      target: "order",

      style: fadedEdgeStyle,
    },
    {
      id: "f3",
      source: "carts",
      target: "order",

      style: fadedEdgeStyle,
    },
    {
      id: "f4",
      source: "categories",
      target: "order",

      style: fadedEdgeStyle,
    },
    {
      id: "f5",
      source: "promotions",
      target: "order",

      style: fadedEdgeStyle,
    },
    {
      id: "f6",
      source: "inventory",
      target: "product",

      style: fadedEdgeStyle,
    },
    {
      id: "f7",
      source: "suppliers",
      target: "product",

      style: fadedEdgeStyle,
    },
    {
      id: "f8",
      source: "warehouses",
      target: "product",

      style: fadedEdgeStyle,
    },
    {
      id: "f9",
      source: "returns",
      target: "shipment",

      style: fadedEdgeStyle,
    },
    {
      id: "f10",
      source: "customer",
      target: "addresses",

      style: fadedEdgeStyle,
    },
    // Inter-secondary
    {
      id: "s1",
      source: "wishlists",
      target: "carts",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s2",
      source: "categories",
      target: "promotions",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s3",
      source: "inventory",
      target: "suppliers",

      style: interSecondaryEdgeStyle,
    },
    {
      id: "s4",
      source: "suppliers",
      target: "warehouses",

      style: interSecondaryEdgeStyle,
    },
    // Polymorphic
    {
      id: "p1",
      source: "reviews",
      target: "product",

      style: polymorphicEdgeStyle,
    },
    {
      id: "p2",
      source: "reviews",
      target: "order",

      style: polymorphicEdgeStyle,
    },
    {
      id: "p3",
      source: "addresses",
      target: "shipment",

      style: polymorphicEdgeStyle,
    },
  ],
};
