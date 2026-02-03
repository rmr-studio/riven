import type { NodeConfigurations } from "../types";
import { createEntityNode, createFadedNode } from "../utils/node-helpers";

export const nodeConfigurations: NodeConfigurations = {
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
