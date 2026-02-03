import type { TableConfigurations } from "../types";

export const tableConfigurations: TableConfigurations = {
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
