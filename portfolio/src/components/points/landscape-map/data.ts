import type { Node, Edge } from "@xyflow/react";
import { t, resolveOutcome, type Locale } from "./translations";

// ──────────────────────────────────────────────
// Domain definitions — generic municipal departments
// ──────────────────────────────────────────────

export interface Domain {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const DOMAINS: Domain[] = [
  { id: "finance", label: "Finance & Administration", color: "#14b8a6", bgColor: "rgba(20,184,166,0.05)", borderColor: "rgba(20,184,166,0.25)" },
  { id: "hr", label: "Human Resources", color: "#a78bfa", bgColor: "rgba(167,139,250,0.05)", borderColor: "rgba(167,139,250,0.25)" },
  { id: "planning", label: "Planning & Development", color: "#f59e0b", bgColor: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.25)" },
  { id: "technical", label: "Public Works & Facilities", color: "#22d3ee", bgColor: "rgba(34,211,238,0.05)", borderColor: "rgba(34,211,238,0.25)" },
  { id: "education", label: "Education & Childcare", color: "#4ade80", bgColor: "rgba(74,222,128,0.05)", borderColor: "rgba(74,222,128,0.25)" },
  { id: "social", label: "Social Services & Care", color: "#f87171", bgColor: "rgba(248,113,113,0.05)", borderColor: "rgba(248,113,113,0.25)" },
  { id: "culture", label: "Culture & Recreation", color: "#fb923c", bgColor: "rgba(251,146,60,0.05)", borderColor: "rgba(251,146,60,0.25)" },
  { id: "it", label: "IT & Digital Services", color: "#818cf8", bgColor: "rgba(129,140,248,0.05)", borderColor: "rgba(129,140,248,0.25)" },
  { id: "environment", label: "Environment & Licensing", color: "#38bdf8", bgColor: "rgba(56,189,248,0.05)", borderColor: "rgba(56,189,248,0.25)" },
];

export function getDomain(id: string, locale: Locale = "en"): Domain {
  const domain = DOMAINS.find((d) => d.id === id)!;
  const tx = t(locale);
  return { ...domain, label: tx.domains[id] ?? domain.label };
}

// ──────────────────────────────────────────────
// System types
// ──────────────────────────────────────────────

export type HealthStatus = "healthy" | "warning" | "critical";
export type GoalAction = "keep" | "modernize" | "sunset" | "new" | "consolidate";

// ──────────────────────────────────────────────
// Maturity model — 5 levels of IT architecture evolution
// ──────────────────────────────────────────────

export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

export const MATURITY_LEVELS: { level: MaturityLevel; name: string; description: string }[] = [
  { level: 1, name: "Manual", description: "Paper forms, phone calls, physical archives — no enterprise systems" },
  { level: 2, name: "Fragmented", description: "Siloed systems, spreadsheet dependencies, no integration strategy" },
  { level: 3, name: "Connected", description: "Integration platform replaces spaghetti — custom apps retired, suites consolidated" },
  { level: 4, name: "Shared", description: "Inter-municipal governance — shared IT operations, pooled recruitment, regional consortia" },
  { level: 5, name: "Federated", description: "Open API standards let municipalities keep their own systems while sharing data seamlessly" },
];

// Which maturity level a system gets sunset at
// Level 3: municipal consolidation — retire spreadsheets and custom apps
// Level 4: inter-municipal cooperation — shared infrastructure and pooled services
// Level 5: federation — national API standards, local implementations
const SUNSET_AT_LEVEL: Record<string, number> = {
  // Level 3: spreadsheet junk + absorbed-into-suite consolidations
  "invoicing": 3, "purchasing": 3, "payroll": 3, "asset-register": 3,
  "detail-plans": 3, "fleet": 3, "special-transport": 3,
  "social-excel": 3, "activity-cards": 3, "env-monitoring": 3,
  // Level 4: shared infrastructure + naturally pooled services
  "backup": 4, "monitoring": 4, "recruiting": 4, "library": 4,
  // Level 5: national citizen portal supersedes municipal portals — domain systems stay local, federated
  "citizen-portal": 5, "citizen-requests": 5,
};

export interface SystemData {
  id: string;
  label: string;
  vendor: string;
  alternatives?: string[];
  domain: string;
  yearDeployed: number;
  annualCost: string;
  health: HealthStatus;
  integrationCount: number;
  painPoints?: string[];
  goalAction: GoalAction;
  goalNote?: string;
  isNew?: boolean;
  replaces?: string[];
}

// ──────────────────────────────────────────────
// System registry — ~60K-population municipality
// ──────────────────────────────────────────────

export const SYSTEMS: SystemData[] = [
  // ── Finance & Administration ──
  { id: "financial-system", label: "Financial System", vendor: "Unit4 / Agresso", alternatives: ["SAP S/4HANA", "Oracle Cloud", "Workday"], domain: "finance", yearDeployed: 2014, annualCost: "€280K", health: "warning", integrationCount: 11, painPoints: ["Aging version, upgrade overdue", "Heavy customizations block patches", "Vendor lock-in across 4 modules"], goalAction: "modernize", goalNote: "Upgrade to cloud financial suite — consolidate budgeting and invoice handling" },
  { id: "budget", label: "Budget & Forecasting", vendor: "Jedox", alternatives: ["Anaplan", "IBM Planning Analytics", "Board"], domain: "finance", yearDeployed: 2017, annualCost: "€65K", health: "healthy", integrationCount: 4, goalAction: "keep", goalNote: "Integrate via central integration layer" },
  { id: "invoicing", label: "Invoice Processing", vendor: "Basware", alternatives: ["Medius", "ReadSoft", "Kofax"], domain: "finance", yearDeployed: 2015, annualCost: "€48K", health: "healthy", integrationCount: 5, painPoints: ["Manual routing of paper invoices still common"], goalAction: "consolidate", goalNote: "Absorbed into cloud financial suite" },
  { id: "purchasing", label: "Purchasing & Procurement", vendor: "Unit4", alternatives: ["SAP Ariba", "Coupa", "Mercell"], domain: "finance", yearDeployed: 2016, annualCost: "€52K", health: "healthy", integrationCount: 4, goalAction: "consolidate", goalNote: "Absorbed into cloud financial suite" },
  { id: "asset-register", label: "Asset Register", vendor: "Excel / SharePoint", alternatives: ["IBM Maximo", "Ultimo", "IFS"], domain: "finance", yearDeployed: 2010, annualCost: "€5K", health: "critical", integrationCount: 1, painPoints: ["Spreadsheet — no audit trail", "No connection to financial system", "Manual inventory updates annually"], goalAction: "sunset", goalNote: "Migrated into financial system asset module" },

  // ── Human Resources ──
  { id: "hr-system", label: "Staff Administration", vendor: "SAP SuccessFactors", alternatives: ["Workday HCM", "Oracle HCM", "Visma"], domain: "hr", yearDeployed: 2013, annualCost: "€160K", health: "warning", integrationCount: 8, painPoints: ["Poor self-service for employees", "Disconnected from scheduling", "Complex customizations"], goalAction: "modernize", goalNote: "Cloud staff platform with self-service and mobile" },
  { id: "payroll", label: "Payroll Processing", vendor: "SAP", alternatives: ["ADP", "SD Worx", "Visma"], domain: "hr", yearDeployed: 2013, annualCost: "€98K", health: "healthy", integrationCount: 5, goalAction: "consolidate", goalNote: "Merged into cloud staff platform" },
  { id: "scheduling", label: "Staff Scheduling", vendor: "UKG / Kronos", alternatives: ["Quinyx", "Deputy", "Tamigo"], domain: "hr", yearDeployed: 2016, annualCost: "€72K", health: "warning", integrationCount: 6, painPoints: ["Separate from payroll — manual transfer of hours", "Care staff schedules managed in parallel spreadsheets"], goalAction: "modernize", goalNote: "Integrated scheduling in cloud staff platform" },
  { id: "recruiting", label: "Recruitment Portal", vendor: "SmartRecruiters", alternatives: ["Teamtailor", "Greenhouse", "Workday Recruiting"], domain: "hr", yearDeployed: 2019, annualCost: "€28K", health: "healthy", integrationCount: 2, goalAction: "keep" },
  { id: "pension", label: "Pension & Benefits", vendor: "Mercer", alternatives: ["WTW", "ADP", "Aon"], domain: "hr", yearDeployed: 2011, annualCost: "€18K", health: "healthy", integrationCount: 2, goalAction: "keep", goalNote: "Integrate via central integration layer" },

  // ── Planning & Development ──
  { id: "building-permits", label: "Building Permits", vendor: "Trimble Locus", alternatives: ["Formpipe", "CGI", "TietoEvry"], domain: "planning", yearDeployed: 2017, annualCost: "€110K", health: "healthy", integrationCount: 7, goalAction: "keep", goalNote: "Core system — add integration layer for citizen self-service" },
  { id: "gis", label: "Geographic Information", vendor: "Esri ArcGIS", alternatives: ["QGIS", "MapInfo", "Hexagon"], domain: "planning", yearDeployed: 2012, annualCost: "€180K", health: "warning", integrationCount: 10, painPoints: ["Proprietary formats limit data sharing", "Esri lock-in (€180K/yr)", "Every department needs map data but few have licenses"], goalAction: "keep", goalNote: "Strategic platform — publish open APIs via integration layer" },
  { id: "detail-plans", label: "Zoning & Land Use", vendor: "Custom .NET App", alternatives: ["Trimble Locus", "Formpipe", "Bentley"], domain: "planning", yearDeployed: 2008, annualCost: "€12K", health: "critical", integrationCount: 2, painPoints: ["Custom-built, original developer left", "No vendor support", "Runs on end-of-life server OS"], goalAction: "sunset", goalNote: "Replaced by permit system planning module" },
  { id: "address-register", label: "Address & Property Register", vendor: "TietoEvry", alternatives: ["CGI", "Trimble", "Digpro"], domain: "planning", yearDeployed: 2015, annualCost: "€35K", health: "healthy", integrationCount: 5, goalAction: "keep" },
  { id: "land-survey", label: "Land Surveying", vendor: "Trimble", alternatives: ["Leica", "Topcon", "Hexagon"], domain: "planning", yearDeployed: 2018, annualCost: "€28K", health: "healthy", integrationCount: 3, goalAction: "keep" },

  // ── Public Works & Facilities ──
  { id: "facility-mgmt", label: "Facility Management", vendor: "Planon", alternatives: ["Archibus", "IFS", "IBM Maximo"], domain: "technical", yearDeployed: 2016, annualCost: "€89K", health: "healthy", integrationCount: 6, goalAction: "modernize", goalNote: "Expand to absorb fleet tracking and road management" },
  { id: "work-orders", label: "Work Orders", vendor: "Planon", alternatives: ["IFS", "Ultimo", "Infracontrol"], domain: "technical", yearDeployed: 2016, annualCost: "€42K", health: "healthy", integrationCount: 4, goalAction: "keep", goalNote: "Part of facility management suite" },
  { id: "fleet", label: "Vehicle Fleet Tracking", vendor: "Excel / SharePoint", alternatives: ["Geotab", "Webfleet", "Masternaut"], domain: "technical", yearDeployed: 2009, annualCost: "€3K", health: "critical", integrationCount: 1, painPoints: ["Spreadsheet — unreliable data", "No fuel cost connection", "Duplicate data in financial system"], goalAction: "sunset", goalNote: "Absorbed into facility management platform" },
  { id: "road-mgmt", label: "Road & Street Register", vendor: "TietoEvry", alternatives: ["Trimble", "Infracontrol", "Bentley"], domain: "technical", yearDeployed: 2014, annualCost: "€38K", health: "warning", integrationCount: 3, painPoints: ["Aging version, no mobile support", "Manual sync with geographic information system"], goalAction: "modernize", goalNote: "Cloud version with mobile field tools" },
  { id: "water-sewage", label: "Water & Sewer Network", vendor: "Autodesk / Innovyze", alternatives: ["Bentley", "DHI MIKE", "Schneider Electric"], domain: "technical", yearDeployed: 2015, annualCost: "€52K", health: "healthy", integrationCount: 4, goalAction: "keep", goalNote: "Integrate via central integration layer" },

  // ── Education & Childcare ──
  { id: "school-admin", label: "School Administration", vendor: "Capita SIMS", alternatives: ["Visma InSchool", "Skolon", "itslearning"], domain: "education", yearDeployed: 2018, annualCost: "€140K", health: "healthy", integrationCount: 7, goalAction: "keep", goalNote: "Core system — integrate via central integration layer" },
  { id: "preschool-queue", label: "Childcare Enrollment", vendor: "Capita SIMS", alternatives: ["Tieto Lifecycle", "IST", "Edlevo"], domain: "education", yearDeployed: 2019, annualCost: "€38K", health: "healthy", integrationCount: 3, goalAction: "keep" },
  { id: "learning-platform", label: "Learning Platform", vendor: "Google Workspace", alternatives: ["Microsoft 365 Education", "Canvas", "itslearning"], domain: "education", yearDeployed: 2020, annualCost: "€62K", health: "healthy", integrationCount: 4, painPoints: ["Separate identity from municipal system", "Teachers manage two logins"], goalAction: "keep", goalNote: "Federate identity via central identity system" },
  { id: "school-meals", label: "School Meal Planning", vendor: "Mashie", alternatives: ["Matilda", "ISS Catering", "Sodexo Systems"], domain: "education", yearDeployed: 2017, annualCost: "€24K", health: "healthy", integrationCount: 2, goalAction: "keep" },
  { id: "special-transport", label: "School Transport", vendor: "Custom Access DB", alternatives: ["Trapeze", "Consat", "Hastus"], domain: "education", yearDeployed: 2007, annualCost: "€2K", health: "critical", integrationCount: 1, painPoints: ["Access database — personal data risk", "No audit trail", "Single point of failure", "One person knows how it works"], goalAction: "sunset", goalNote: "Replaced by school administration transport module" },

  // ── Social Services & Care ──
  { id: "social-casework", label: "Social Case Management", vendor: "Merative / Cúram", alternatives: ["CGI", "TietoEvry", "Netcompany"], domain: "social", yearDeployed: 2015, annualCost: "€220K", health: "warning", integrationCount: 8, painPoints: ["Complex, slow user interface", "Caseworkers spend more time documenting than helping", "Vendor lock-in"], goalAction: "modernize", goalNote: "Cloud case management with mobile and better usability" },
  { id: "elderly-care", label: "Elderly Care Planning", vendor: "TietoEvry / Lifecare", alternatives: ["CGI", "Visma", "Systematic"], domain: "social", yearDeployed: 2015, annualCost: "€110K", health: "warning", integrationCount: 5, painPoints: ["Scheduling disconnected from staff system", "Home care staff use paper route sheets"], goalAction: "modernize", goalNote: "Mobile-first care planning with real-time scheduling" },
  { id: "home-care-mobile", label: "Home Care Mobile App", vendor: "Assa Abloy / HID", alternatives: ["Doro", "AlayaCare", "Tunstall"], domain: "social", yearDeployed: 2019, annualCost: "€48K", health: "healthy", integrationCount: 3, goalAction: "keep", goalNote: "Integrate with modernized care planning" },
  { id: "disability-care", label: "Disability Services", vendor: "TietoEvry", alternatives: ["CGI", "Visma", "Systematic"], domain: "social", yearDeployed: 2015, annualCost: "€65K", health: "healthy", integrationCount: 3, goalAction: "keep" },
  { id: "social-excel", label: "Statistics & Reporting", vendor: "Excel", alternatives: ["Power BI", "Tableau", "Qlik"], domain: "social", yearDeployed: 2012, annualCost: "€2K", health: "critical", integrationCount: 1, painPoints: ["Manual data extraction from case system", "Error-prone quarterly reporting", "No traceability"], goalAction: "sunset", goalNote: "Replaced by automated reporting from data warehouse" },

  // ── Culture & Recreation ──
  { id: "facility-booking", label: "Facility Booking", vendor: "Dude Solutions", alternatives: ["Bookking", "BRP Systems", "MatrixBooking"], domain: "culture", yearDeployed: 2018, annualCost: "€42K", health: "healthy", integrationCount: 4, goalAction: "keep", goalNote: "Integrate with citizen self-service portal" },
  { id: "library", label: "Library System", vendor: "Ex Libris / Alma", alternatives: ["OCLC", "Koha", "SirsiDynix"], domain: "culture", yearDeployed: 2016, annualCost: "€58K", health: "healthy", integrationCount: 3, goalAction: "keep" },
  { id: "activity-cards", label: "Activity & Membership", vendor: "Custom PHP App", alternatives: ["BRP Systems", "Bookking", "Wondr"], domain: "culture", yearDeployed: 2011, annualCost: "€8K", health: "critical", integrationCount: 2, painPoints: ["Custom PHP — security vulnerabilities", "No responsive design", "Youth activity data with no backup strategy"], goalAction: "sunset", goalNote: "Replaced by facility booking membership module" },
  { id: "culture-school", label: "Music & Arts School", vendor: "Ackordion", alternatives: ["Speed Admin", "ClassManager", "iMiS"], domain: "culture", yearDeployed: 2020, annualCost: "€18K", health: "healthy", integrationCount: 2, goalAction: "keep" },

  // ── IT & Digital Services ──
  { id: "service-desk", label: "IT Service Desk", vendor: "TOPdesk", alternatives: ["ServiceNow", "Jira SM", "Freshservice"], domain: "it", yearDeployed: 2019, annualCost: "€65K", health: "healthy", integrationCount: 7, goalAction: "keep", goalNote: "IT service management — integrate with citizen request system" },
  { id: "identity", label: "Identity & Access", vendor: "Microsoft Entra", alternatives: ["Okta", "Ping Identity", "OneLogin"], domain: "it", yearDeployed: 2018, annualCost: "€98K", health: "healthy", integrationCount: 14, goalAction: "keep", goalNote: "Central identity layer — single sign-on for all systems" },
  { id: "m365", label: "Office & Email", vendor: "Microsoft 365", alternatives: ["Google Workspace", "Zoho Workplace"], domain: "it", yearDeployed: 2020, annualCost: "€240K", health: "healthy", integrationCount: 6, goalAction: "keep" },
  { id: "monitoring", label: "Infrastructure Monitoring", vendor: "PRTG", alternatives: ["Datadog", "Zabbix", "Nagios"], domain: "it", yearDeployed: 2017, annualCost: "€28K", health: "healthy", integrationCount: 4, goalAction: "keep" },
  { id: "backup", label: "Backup & Recovery", vendor: "Veeam", alternatives: ["Commvault", "Veritas", "Acronis"], domain: "it", yearDeployed: 2018, annualCost: "€42K", health: "healthy", integrationCount: 3, goalAction: "keep" },

  // ── Environment & Licensing ──
  { id: "env-cases", label: "Environmental Case Management", vendor: "Formpipe", alternatives: ["TietoEvry", "CGI", "OpenGov"], domain: "environment", yearDeployed: 2016, annualCost: "€48K", health: "healthy", integrationCount: 5, goalAction: "keep", goalNote: "Core system — integrate via central integration layer" },
  { id: "food-inspections", label: "Food Safety Inspections", vendor: "Formpipe", alternatives: ["SafetyCulture", "ComplianceQuest", "Wolters Kluwer"], domain: "environment", yearDeployed: 2016, annualCost: "€28K", health: "healthy", integrationCount: 3, goalAction: "keep" },
  { id: "env-monitoring", label: "Environmental Monitoring", vendor: "Excel / Access DB", alternatives: ["EQuIS", "KISTERS", "Envista"], domain: "environment", yearDeployed: 2009, annualCost: "€3K", health: "critical", integrationCount: 1, painPoints: ["Spreadsheet with 15 years of measurement data", "No structured database", "Risk of data loss"], goalAction: "sunset", goalNote: "Migrated to data warehouse with proper time-series storage" },
  { id: "alcohol-permits", label: "Business & Liquor Licenses", vendor: "Formpipe", alternatives: ["TietoEvry", "CGI", "OpenGov"], domain: "environment", yearDeployed: 2017, annualCost: "€18K", health: "healthy", integrationCount: 2, goalAction: "keep" },
];

// Goal-state new systems
// Integration Platform and Data Warehouse are represented by the integration layer node above the grid
export const NEW_SYSTEMS: SystemData[] = [
  { id: "citizen-portal", label: "Citizen Self-Service Portal", vendor: "Liferay", alternatives: ["OpenCities", "Drupal", "Decidim"], domain: "it", yearDeployed: 2027, annualCost: "€38K", health: "healthy", integrationCount: 0, goalAction: "new", isNew: true, goalNote: "Unified self-service for permits, bookings, school enrollment, and case status" },
  { id: "citizen-requests", label: "Citizen Request Tracking", vendor: "Open311 / CitySDK", alternatives: ["FixMyStreet", "Decidim", "Zammad"], domain: "it", yearDeployed: 2027, annualCost: "€28K", health: "healthy", integrationCount: 0, goalAction: "new", isNew: true, goalNote: "Issue reporting and feedback — replaces email-based citizen communication" },
];

// ──────────────────────────────────────────────
// External systems — national & regional tier
// ──────────────────────────────────────────────

export interface ExternalSystem {
  id: string;
  label: string;
  description: string;
  tier: "supranational" | "national" | "regional";
  connectedTo: string[];
  isGateway?: boolean;
}

export const SUPRANATIONAL_SYSTEMS: ExternalSystem[] = [
  { id: "supra-identity-wallet", label: "Digital Identity Wallet", description: "Cross-border citizen identity — launching 2026–2027", tier: "supranational", connectedTo: ["nat-eid"] },
  { id: "supra-once-only", label: "Once Only Technical System", description: "Cross-border data exchange so citizens don't re-submit documents", tier: "supranational", connectedTo: ["nat-population", "nat-tax"] },
  { id: "supra-single-gateway", label: "Single Digital Gateway", description: "Unified portal connecting national government service portals", tier: "supranational", connectedTo: ["nat-eid", "nat-population"] },
  { id: "supra-blockchain", label: "Document Verification Ledger", description: "Shared ledger for cross-border document and credential verification", tier: "supranational", connectedTo: ["nat-land", "nat-eid"] },
];

export const NATIONAL_SYSTEMS: ExternalSystem[] = [
  { id: "nat-population", label: "Population Register", description: "Civil registry — births, deaths, addresses, citizenship", tier: "national", connectedTo: ["hr-system", "social-casework", "school-admin", "identity"] },
  { id: "nat-tax", label: "Tax Authority", description: "Income reporting, employer declarations, VAT", tier: "national", connectedTo: ["financial-system", "payroll"] },
  { id: "nat-land", label: "National Land Registry", description: "Property ownership, cadastral data, deeds", tier: "national", connectedTo: ["gis", "building-permits", "address-register"] },
  { id: "nat-statistics", label: "Statistics Bureau", description: "Mandatory municipal reporting — demographics, economy, education", tier: "national", connectedTo: ["social-excel", "school-admin", "financial-system"] },
  { id: "nat-eid", label: "National Digital Identity", description: "Citizen authentication for government services", tier: "national", connectedTo: ["identity"] },
  { id: "nat-social-insurance", label: "Social Insurance", description: "Pensions, sickness benefits, parental leave", tier: "national", connectedTo: ["pension", "social-casework", "payroll"] },
  { id: "nat-digital-infra", label: "National Service Bus", description: "Government integration gateway — mandatory on-ramp for all national register access", tier: "national", connectedTo: ["identity"], isGateway: true },
];

export const REGIONAL_SYSTEMS: ExternalSystem[] = [
  { id: "reg-healthcare", label: "Regional Healthcare", description: "Hospital records, primary care, prescriptions", tier: "regional", connectedTo: ["social-casework", "elderly-care", "disability-care"] },
  { id: "reg-transit", label: "Public Transit Authority", description: "Routes, schedules, school transport coordination", tier: "regional", connectedTo: ["special-transport", "school-admin"] },
  { id: "reg-emergency", label: "Emergency Services", description: "Fire, rescue, dispatch coordination", tier: "regional", connectedTo: ["gis", "facility-mgmt", "road-mgmt"] },
  { id: "reg-env-agency", label: "Environmental Agency", description: "Permits, compliance monitoring, contaminated sites", tier: "regional", connectedTo: ["env-cases", "env-monitoring", "water-sewage"] },
  { id: "reg-shared-it", label: "Regional Services Hub", description: "Shared integration layer — data center, procurement, security operations", tier: "regional", connectedTo: ["backup", "monitoring", "identity"], isGateway: true },
];

// ──────────────────────────────────────────────
// Overlay filter types
// ──────────────────────────────────────────────

// Overlay types removed — toggle between as-is/goal is the core interaction

// ──────────────────────────────────────────────
// Node positions
// ──────────────────────────────────────────────

// Positive-Y layout: supranational y=0 (h=240), national y=270 (h=180),
// NSB y=470, regional y=540, hub/integration y=810, municipal y=980, grid y=1060
const COL_PITCH = 260;
const ROW_PITCH = 190;

const DOMAIN_ORIGINS: Record<string, { x: number; y: number }> = {
  finance:     { x: 0,    y: 1060 },
  hr:          { x: 880,  y: 1060 },
  planning:    { x: 1760, y: 1060 },
  technical:   { x: 0,    y: 1660 },
  education:   { x: 880,  y: 1660 },
  social:      { x: 1760, y: 1660 },
  culture:     { x: 0,    y: 2260 },
  it:          { x: 880,  y: 2260 },
  environment: { x: 1760, y: 2260 },
};

// 3-zone grid aligned to municipal columns: left(0-820), center(880-1700), right(1760-2580)
// Supranational flanks the center (regulations + title occupy center zone)
const SUPRANATIONAL_POSITIONS: Record<string, { x: number; y: number }> = {
  "supra-identity-wallet": { x: 100,  y: 90 },
  "supra-once-only":       { x: 440,  y: 90 },
  "supra-single-gateway":  { x: 1860, y: 90 },
  "supra-blockchain":      { x: 2200, y: 90 },
};

// 2 per zone — vertically aligned with supranational outer columns
const NATIONAL_POSITIONS: Record<string, { x: number; y: number }> = {
  "nat-population":       { x: 100,  y: 330 },
  "nat-tax":              { x: 440,  y: 330 },
  "nat-land":             { x: 980,  y: 330 },
  "nat-statistics":       { x: 1320, y: 330 },
  "nat-eid":              { x: 1860, y: 330 },
  "nat-social-insurance": { x: 2200, y: 330 },
  "nat-digital-infra":    { x: 1090, y: 470 },
};

const REGIONAL_POSITIONS: Record<string, { x: number; y: number }> = {
  "reg-healthcare": { x: 50,  y: 580 },
  "reg-transit":    { x: 300, y: 580 },
  "reg-emergency":  { x: 50,  y: 690 },
  "reg-env-agency": { x: 300, y: 690 },
  "reg-shared-it":  { x: 50,  y: 810 },
};

const DOMAIN_GROUP_SIZE: Record<string, { w: number; h: number }> = {
  finance:     { w: 820, h: 520 },
  hr:          { w: 820, h: 520 },
  planning:    { w: 820, h: 520 },
  technical:   { w: 820, h: 520 },
  education:   { w: 820, h: 520 },
  social:      { w: 820, h: 520 },
  culture:     { w: 820, h: 400 },
  it:          { w: 820, h: 640 },
  environment: { w: 820, h: 400 },
};

function asIsPos(domainId: string, col: number, row: number): { x: number; y: number } {
  const origin = DOMAIN_ORIGINS[domainId];
  const jitterX = ((col * 7 + row * 13) % 11) - 5;
  const jitterY = ((col * 11 + row * 7) % 9) - 4;
  return {
    x: origin.x + 40 + col * COL_PITCH + jitterX,
    y: origin.y + 60 + row * ROW_PITCH + jitterY,
  };
}

function goalPos(domainId: string, col: number, row: number): { x: number; y: number } {
  const origin = DOMAIN_ORIGINS[domainId];
  return {
    x: origin.x + 50 + col * COL_PITCH,
    y: origin.y + 60 + row * ROW_PITCH,
  };
}

// ──────────────────────────────────────────────
// Build React Flow nodes
// ──────────────────────────────────────────────

interface SystemPosition {
  asIs: { col: number; row: number };
  goal?: { col: number; row: number } | null;
}

const POSITIONS: Record<string, SystemPosition> = {
  // Finance
  "financial-system": { asIs: { col: 0, row: 0 }, goal: { col: 0, row: 0 } },
  budget:             { asIs: { col: 1, row: 0 }, goal: { col: 1, row: 0 } },
  invoicing:          { asIs: { col: 2, row: 0 }, goal: null },
  purchasing:         { asIs: { col: 0, row: 1 }, goal: null },
  "asset-register":   { asIs: { col: 1, row: 1 }, goal: null },
  // HR
  "hr-system":     { asIs: { col: 0, row: 0 }, goal: { col: 0, row: 0 } },
  payroll:         { asIs: { col: 1, row: 0 }, goal: null },
  scheduling:      { asIs: { col: 2, row: 0 }, goal: { col: 2, row: 0 } },
  recruiting:      { asIs: { col: 0, row: 1 }, goal: { col: 0, row: 1 } },
  pension:         { asIs: { col: 1, row: 1 }, goal: { col: 1, row: 1 } },
  // Planning
  "building-permits": { asIs: { col: 0, row: 0 }, goal: { col: 0, row: 0 } },
  gis:                { asIs: { col: 1, row: 0 }, goal: { col: 1, row: 0 } },
  "detail-plans":     { asIs: { col: 2, row: 0 }, goal: null },
  "address-register": { asIs: { col: 0, row: 1 }, goal: { col: 0, row: 1 } },
  "land-survey":      { asIs: { col: 1, row: 1 }, goal: { col: 1, row: 1 } },
  // Technical
  "facility-mgmt": { asIs: { col: 0, row: 0 }, goal: { col: 0, row: 0 } },
  "work-orders":   { asIs: { col: 1, row: 0 }, goal: { col: 1, row: 0 } },
  fleet:           { asIs: { col: 2, row: 0 }, goal: null },
  "road-mgmt":     { asIs: { col: 0, row: 1 }, goal: { col: 0, row: 1 } },
  "water-sewage":  { asIs: { col: 1, row: 1 }, goal: { col: 1, row: 1 } },
  // Education
  "school-admin":       { asIs: { col: 0, row: 0 }, goal: { col: 0, row: 0 } },
  "preschool-queue":    { asIs: { col: 1, row: 0 }, goal: { col: 1, row: 0 } },
  "learning-platform":  { asIs: { col: 2, row: 0 }, goal: { col: 2, row: 0 } },
  "school-meals":       { asIs: { col: 0, row: 1 }, goal: { col: 0, row: 1 } },
  "special-transport":  { asIs: { col: 1, row: 1 }, goal: null },
  // Social
  "social-casework":  { asIs: { col: 0, row: 0 }, goal: { col: 0, row: 0 } },
  "elderly-care":     { asIs: { col: 1, row: 0 }, goal: { col: 1, row: 0 } },
  "home-care-mobile": { asIs: { col: 2, row: 0 }, goal: { col: 2, row: 0 } },
  "disability-care":  { asIs: { col: 0, row: 1 }, goal: { col: 0, row: 1 } },
  "social-excel":     { asIs: { col: 1, row: 1 }, goal: null },
  // Culture
  "facility-booking": { asIs: { col: 0, row: 0 }, goal: { col: 0, row: 0 } },
  library:            { asIs: { col: 1, row: 0 }, goal: { col: 1, row: 0 } },
  "activity-cards":   { asIs: { col: 2, row: 0 }, goal: null },
  "culture-school":   { asIs: { col: 0, row: 1 }, goal: { col: 0, row: 1 } },
  // IT
  "service-desk": { asIs: { col: 0, row: 0 }, goal: { col: 0, row: 0 } },
  identity:       { asIs: { col: 1, row: 0 }, goal: { col: 1, row: 0 } },
  m365:           { asIs: { col: 2, row: 0 }, goal: { col: 2, row: 0 } },
  monitoring:     { asIs: { col: 0, row: 1 }, goal: { col: 0, row: 1 } },
  backup:         { asIs: { col: 1, row: 1 }, goal: { col: 1, row: 1 } },
  // Environment
  "env-cases":       { asIs: { col: 0, row: 0 }, goal: { col: 0, row: 0 } },
  "food-inspections": { asIs: { col: 1, row: 0 }, goal: { col: 1, row: 0 } },
  "env-monitoring":   { asIs: { col: 2, row: 0 }, goal: null },
  "alcohol-permits":  { asIs: { col: 0, row: 1 }, goal: { col: 0, row: 1 } },
  // New goal systems (in IT domain)
  "citizen-portal":       { asIs: { col: 0, row: 2 }, goal: { col: 0, row: 2 } },
  "citizen-requests":     { asIs: { col: 1, row: 2 }, goal: { col: 1, row: 2 } },
};

// ──────────────────────────────────────────────
// Outcome callouts — goal state only
// ──────────────────────────────────────────────

interface Outcome {
  id: string;
  label: string;
  before: string;
  after: string;
  position: { x: number; y: number };
}

const OUTCOME_POSITIONS: Record<string, { x: number; y: number }> = {
  "outcome-finance":     { x: 600,  y: 1470 },
  "outcome-planning":    { x: 2360, y: 1470 },
  "outcome-technical":   { x: 600,  y: 2070 },
  "outcome-education":   { x: 1480, y: 2070 },
  "outcome-social":      { x: 2360, y: 2070 },
  "outcome-culture":     { x: 600,  y: 2550 },
  "outcome-it":          { x: 1480, y: 2790 },
  "outcome-environment": { x: 2360, y: 2550 },
};

const OUTCOME_IDS = Object.keys(OUTCOME_POSITIONS);

function getOutcomes(level: MaturityLevel, locale: Locale): Outcome[] {
  const tx = t(locale);
  return OUTCOME_IDS.map((id) => ({
    id,
    ...resolveOutcome(tx.outcomes[id], level),
    position: OUTCOME_POSITIONS[id],
  }));
}

const INTEGRATION_LAYER_POS = { x: 690, y: 810 };

export function buildNodes(level: MaturityLevel, locale: Locale = "en"): Node[] {
  const isConnected = level >= 3;
  const state: "as-is" | "goal" = isConnected ? "goal" : "as-is";
  const nodes: Node[] = [];
  const tx = t(locale);

  // Tier banners
  nodes.push({
    id: "tier-supranational",
    type: "tierBanner",
    position: { x: -20, y: 0 },
    data: {
      label: tx.tiers.supranational.label,
      sublabel: tx.tiers.supranational.sublabel,
      color: "#e879f9",
      width: 2620,
      height: 240,
      tags: tx.governanceTags,
    },
    draggable: false,
    selectable: false,
  });
  nodes.push({
    id: "tier-national",
    type: "tierBanner",
    position: { x: -20, y: 270 },
    data: { label: tx.tiers.national.label, sublabel: tx.tiers.national.sublabel, color: "#f59e0b", width: 2620, height: 180 },
    draggable: false,
    selectable: false,
  });
  nodes.push({
    id: "tier-regional",
    type: "tierBanner",
    position: { x: -10, y: 540 },
    data: { label: tx.tiers.regional.label, sublabel: tx.tiers.regional.sublabel, color: "#a78bfa", width: 560 },
    draggable: false,
    selectable: false,
  });
  nodes.push({
    id: "tier-municipal",
    type: "tierBanner",
    position: { x: -20, y: 980 },
    data: { label: tx.tiers.municipal.label, sublabel: tx.tiers.municipal.sublabel, color: "#818cf8", width: 2620 },
    draggable: false,
    selectable: false,
  });

  // Supranational emerging systems
  for (const sys of SUPRANATIONAL_SYSTEMS) {
    const pos = SUPRANATIONAL_POSITIONS[sys.id];
    const extTx = tx.external[sys.id];
    nodes.push({
      id: sys.id,
      type: "externalSystem",
      position: pos,
      data: { label: extTx?.label ?? sys.label, description: extTx?.description ?? sys.description, tier: sys.tier, domainColor: "#e879f9", emerging: true, tierBadge: tx.badges.emerging, gatewayBadge: tx.badges.gateway },
    });
  }

  // National external systems
  for (const sys of NATIONAL_SYSTEMS) {
    const pos = NATIONAL_POSITIONS[sys.id];
    const extTx = tx.external[sys.id];
    nodes.push({
      id: sys.id,
      type: "externalSystem",
      position: pos,
      data: { label: extTx?.label ?? sys.label, description: extTx?.description ?? sys.description, tier: sys.tier, domainColor: "#f59e0b", isGateway: sys.isGateway, tierBadge: tx.badges.national, gatewayBadge: tx.badges.gateway },
    });
  }

  // Regional external systems
  for (const sys of REGIONAL_SYSTEMS) {
    const pos = REGIONAL_POSITIONS[sys.id];
    const extTx = tx.external[sys.id];
    nodes.push({
      id: sys.id,
      type: "externalSystem",
      position: pos,
      data: { label: extTx?.label ?? sys.label, description: extTx?.description ?? sys.description, tier: sys.tier, domainColor: "#a78bfa", isGateway: sys.isGateway, tierBadge: tx.badges.regional, gatewayBadge: tx.badges.gateway },
    });
  }

  // Municipal domain groups
  for (const domain of DOMAINS) {
    const origin = DOMAIN_ORIGINS[domain.id];
    const size = DOMAIN_GROUP_SIZE[domain.id];
    nodes.push({
      id: `group-${domain.id}`,
      type: "domainGroup",
      position: { x: origin.x - 20, y: origin.y - 30 },
      data: {
        label: tx.domains[domain.id] ?? domain.label,
        color: domain.color,
        bgColor: domain.bgColor,
        borderColor: domain.borderColor,
        width: size.w,
        height: size.h,
        hasOutcome: false,
      },
      draggable: false,
      selectable: false,
      style: { width: size.w, height: size.h },
    });
  }

  {
    const allSystems = isConnected ? [...SYSTEMS, ...NEW_SYSTEMS] : SYSTEMS;
    for (const sys of allSystems) {
      const pos = POSITIONS[sys.id];
      if (!pos) continue;
      if (!isConnected && sys.isNew) continue;

      const sunsetAt = SUNSET_AT_LEVEL[sys.id];
      const isSunset = isConnected && sunsetAt !== undefined && sunsetAt <= level;
      const isNew = isConnected && sys.isNew && !isSunset;

      const targetPos = isConnected && pos.goal
        ? goalPos(sys.domain, pos.goal.col, pos.goal.row)
        : asIsPos(sys.domain, pos.asIs.col, pos.asIs.row);

      const sysTx = tx.systems[sys.id];
      nodes.push({
        id: sys.id,
        type: "systemNode",
        position: targetPos,
        data: {
          ...sys,
          label: sysTx?.label ?? sys.label,
          painPoints: sysTx?.painPoints ?? sys.painPoints,
          goalNote: sysTx?.goalNote ?? sys.goalNote,
          isSunset,
          isNew,
          isManual: level === 1,
          isModernized: isConnected && !isSunset && sys.goalAction === "modernize",
          isFederated: level === 5 && !isSunset,
          state,
          domainColor: getDomain(sys.domain).color,
          badgeLabels: tx.badges,
        },
      });
    }
  }

  if (isConnected) {
    const ic = tx.integration.components;
    nodes.push({
      id: "integration-layer",
      type: "integrationLayer",
      position: INTEGRATION_LAYER_POS,
      data: {
        label: level === 5 ? tx.integration.federation : tx.integration.platform,
        components: level === 5 ? [
          { name: ic.federationGateway.name, icon: "⇌", description: ic.federationGateway.description, vendors: "Kong · MuleSoft · WSO2" },
          { name: ic.eventBus.name, icon: "⚡", description: ic.eventBus.description, vendors: "Apache Kafka · RabbitMQ · Azure Service Bus" },
          { name: ic.dataLake.name, icon: "◈", description: ic.dataLake.description, vendors: "Snowflake · Databricks · Google BigQuery" },
        ] : [
          { name: ic.apiGateway.name, icon: "⇌", description: ic.apiGateway.description, vendors: "Kong · Azure APIM · AWS API Gateway" },
          { name: ic.messageBroker.name, icon: "⚡", description: ic.messageBroker.description, vendors: "Apache Kafka · RabbitMQ · Azure Service Bus" },
          { name: ic.dataWarehouse.name, icon: "◈", description: ic.dataWarehouse.description, vendors: "Snowflake · Databricks · Google BigQuery" },
        ],
      },
    });

    for (const outcome of getOutcomes(level, locale)) {
      nodes.push({
        id: outcome.id,
        type: "outcomeNode",
        position: outcome.position,
        data: { label: outcome.label, before: outcome.before, after: outcome.after },
        draggable: false,
        selectable: false,
      });
    }
  }

  return nodes;
}

// ──────────────────────────────────────────────
// Edges
// ──────────────────────────────────────────────

interface EdgeDef {
  source: string;
  target: string;
}

// As-is edge with explicit handle routing
// crossDomain edges route bottom→top to avoid cutting through domain groups
interface AsIsEdgeDef {
  source: string;
  target: string;
  crossDomain?: boolean;
}

const AS_IS_EDGES: AsIsEdgeDef[] = [
  // Financial system hub — intra-domain
  { source: "financial-system", target: "invoicing" },
  { source: "financial-system", target: "purchasing" },
  { source: "financial-system", target: "asset-register" },
  { source: "financial-system", target: "budget" },
  // Financial system — cross-domain
  { source: "financial-system", target: "hr-system", crossDomain: true },
  { source: "financial-system", target: "payroll", crossDomain: true },
  { source: "financial-system", target: "facility-mgmt", crossDomain: true },
  { source: "financial-system", target: "school-admin", crossDomain: true },
  { source: "financial-system", target: "social-casework", crossDomain: true },
  { source: "financial-system", target: "service-desk", crossDomain: true },
  { source: "financial-system", target: "facility-booking", crossDomain: true },

  // Geographic information hub — intra-domain
  { source: "gis", target: "building-permits" },
  { source: "gis", target: "detail-plans" },
  { source: "gis", target: "address-register" },
  { source: "gis", target: "land-survey" },
  // Geographic information — cross-domain
  { source: "gis", target: "facility-mgmt", crossDomain: true },
  { source: "gis", target: "work-orders", crossDomain: true },
  { source: "gis", target: "road-mgmt", crossDomain: true },
  { source: "gis", target: "water-sewage", crossDomain: true },
  { source: "gis", target: "env-cases", crossDomain: true },
  { source: "gis", target: "school-admin", crossDomain: true },

  // Identity connects to everything — all cross-domain
  { source: "identity", target: "financial-system", crossDomain: true },
  { source: "identity", target: "hr-system", crossDomain: true },
  { source: "identity", target: "service-desk" },
  { source: "identity", target: "m365" },
  { source: "identity", target: "building-permits", crossDomain: true },
  { source: "identity", target: "gis", crossDomain: true },
  { source: "identity", target: "school-admin", crossDomain: true },
  { source: "identity", target: "social-casework", crossDomain: true },
  { source: "identity", target: "facility-mgmt", crossDomain: true },
  { source: "identity", target: "monitoring" },
  { source: "identity", target: "library", crossDomain: true },
  { source: "identity", target: "backup" },
  { source: "identity", target: "env-cases", crossDomain: true },
  { source: "identity", target: "facility-booking", crossDomain: true },

  // HR connections
  { source: "hr-system", target: "payroll" },
  { source: "hr-system", target: "scheduling" },
  { source: "hr-system", target: "recruiting" },
  { source: "hr-system", target: "pension" },
  { source: "payroll", target: "scheduling" },
  { source: "payroll", target: "pension" },
  { source: "payroll", target: "financial-system", crossDomain: true },

  // Planning connections
  { source: "building-permits", target: "detail-plans" },
  { source: "building-permits", target: "address-register" },
  { source: "building-permits", target: "land-survey" },

  // Technical connections
  { source: "facility-mgmt", target: "work-orders" },
  { source: "facility-mgmt", target: "fleet" },
  { source: "facility-mgmt", target: "road-mgmt" },
  { source: "work-orders", target: "fleet" },
  { source: "road-mgmt", target: "water-sewage" },

  // Education connections
  { source: "school-admin", target: "preschool-queue" },
  { source: "school-admin", target: "learning-platform" },
  { source: "school-admin", target: "school-meals" },
  { source: "school-admin", target: "special-transport" },

  // Social connections
  { source: "social-casework", target: "elderly-care" },
  { source: "social-casework", target: "disability-care" },
  { source: "social-casework", target: "social-excel" },
  { source: "elderly-care", target: "home-care-mobile" },
  { source: "elderly-care", target: "scheduling", crossDomain: true },

  // Culture connections
  { source: "facility-booking", target: "library" },
  { source: "facility-booking", target: "activity-cards" },
  { source: "facility-booking", target: "culture-school" },

  // IT connections
  { source: "service-desk", target: "monitoring" },
  { source: "service-desk", target: "m365" },
  { source: "service-desk", target: "backup" },
  { source: "monitoring", target: "backup" },

  // Environment connections
  { source: "env-cases", target: "food-inspections" },
  { source: "env-cases", target: "env-monitoring" },
  { source: "env-cases", target: "alcohol-permits" },

  // Cross-domain spaghetti
  { source: "social-casework", target: "school-admin", crossDomain: true },
  { source: "facility-mgmt", target: "school-admin", crossDomain: true },
  { source: "water-sewage", target: "gis", crossDomain: true },
  { source: "env-cases", target: "building-permits", crossDomain: true },
  { source: "library", target: "school-admin", crossDomain: true },
  { source: "activity-cards", target: "school-admin", crossDomain: true },
  { source: "scheduling", target: "elderly-care", crossDomain: true },
];

const GOAL_HUB_SYSTEMS = [
  "financial-system", "budget", "hr-system", "scheduling", "recruiting", "pension",
  "building-permits", "gis", "address-register", "land-survey",
  "facility-mgmt", "work-orders", "road-mgmt", "water-sewage",
  "school-admin", "preschool-queue", "learning-platform", "school-meals",
  "social-casework", "elderly-care", "home-care-mobile", "disability-care",
  "facility-booking", "library", "culture-school",
  "service-desk", "identity", "m365", "monitoring", "backup",
  "env-cases", "food-inspections", "alcohol-permits",
  "citizen-portal", "citizen-requests",
] as const;

// Route edges by domain column so they fan out cleanly from integration layer
const DOMAIN_COLUMN: Record<string, "left" | "center" | "right"> = {
  finance: "left", technical: "left", culture: "left",
  hr: "center", education: "center", it: "center",
  planning: "right", social: "right", environment: "right",
};

const ALL_SYSTEM_MAP = new Map(
  [...SYSTEMS, ...NEW_SYSTEMS].map((s) => [s.id, s])
);

const GOAL_DIRECT_EDGES: EdgeDef[] = [
  { source: "building-permits", target: "address-register" },
  { source: "facility-mgmt", target: "work-orders" },
  { source: "social-casework", target: "elderly-care" },
  { source: "social-casework", target: "disability-care" },
  { source: "elderly-care", target: "home-care-mobile" },
  { source: "school-admin", target: "preschool-queue" },
  { source: "service-desk", target: "monitoring" },
  { source: "env-cases", target: "food-inspections" },
  { source: "env-cases", target: "alcohol-permits" },
];

// Cross-tier edges — all tiers
function buildExternalEdges(): Edge[] {
  const edges: Edge[] = [];
  let idx = 0;

  const TIER_COLORS: Record<string, string> = {
    supranational: "rgba(232,121,249,0.10)",
    national: "rgba(245,158,11,0.15)",
    regional: "rgba(167,139,250,0.15)",
  };

  for (const sys of [...SUPRANATIONAL_SYSTEMS, ...NATIONAL_SYSTEMS, ...REGIONAL_SYSTEMS]) {
    const color = TIER_COLORS[sys.tier];
    for (const target of sys.connectedTo) {
      edges.push({
        id: `ext-${idx++}`,
        source: sys.id,
        sourceHandle: "bottom",
        target,
        targetHandle: "top",
        type: "smoothstep",
        style: { stroke: color, strokeWidth: 1, strokeDasharray: "6 4" },
      });
    }
  }

  return edges;
}

function isActiveAtLevel(sysId: string, level: MaturityLevel): boolean {
  const sunsetAt = SUNSET_AT_LEVEL[sysId];
  return sunsetAt === undefined || sunsetAt > level;
}

export function buildEdges(level: MaturityLevel): Edge[] {
  // Level 1 (Manual): no digital integrations
  if (level === 1) return [];

  // Level 2 (Fragmented): spaghetti point-to-point
  if (level === 2) {
    const externalEdges = buildExternalEdges();
    return [
      ...AS_IS_EDGES.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        sourceHandle: e.crossDomain ? "right" : undefined,
        target: e.target,
        targetHandle: e.crossDomain ? "left" : undefined,
        type: "default" as string,
        animated: false,
        style: {
          stroke: e.crossDomain ? "rgba(239,68,68,0.18)" : "rgba(148,163,184,0.2)",
          strokeWidth: e.crossDomain ? 1 : 1.5,
        },
      })),
      ...externalEdges,
    ];
  }

  const edges: Edge[] = [];
  let idx = 0;

  // Hub edges: integration layer radiates outward to active municipal systems
  // Force targetHandle="top" so edges always drop down into nodes from above
  for (const sysId of GOAL_HUB_SYSTEMS) {
    if (!isActiveAtLevel(sysId, level)) continue;
    const sys = ALL_SYSTEM_MAP.get(sysId);
    const col = sys ? DOMAIN_COLUMN[sys.domain] : "center";
    const sourceHandle = col === "left" ? "source-left" : col === "right" ? "source-right" : "source-bottom";

    edges.push({
      id: `ge-${idx++}`,
      source: "integration-layer",
      sourceHandle,
      target: sysId,
      targetHandle: "top",
      type: "smoothstep",
      animated: true,
      style: {
        stroke: "rgba(99,102,241,0.15)",
        strokeWidth: 1,
      },
    });
  }

  // Intra-domain direct edges — skip if either end is sunset
  for (const e of GOAL_DIRECT_EDGES) {
    if (!isActiveAtLevel(e.source, level) || !isActiveAtLevel(e.target, level)) continue;
    edges.push({
      id: `ge-${idx++}`,
      source: e.source,
      sourceHandle: "bottom",
      target: e.target,
      targetHandle: "top",
      type: "smoothstep",
      style: {
        stroke: "rgba(148,163,184,0.15)",
        strokeWidth: 1,
      },
    });
  }

  // ── Cross-tier gateway chain ──
  const goalExternalEdges: Edge[] = [];
  let extIdx = 0;

  // Supranational → national service bus (vertical down)
  for (const sys of SUPRANATIONAL_SYSTEMS) {
    goalExternalEdges.push({
      id: `gext-${extIdx++}`,
      source: sys.id,
      sourceHandle: "bottom",
      target: "nat-digital-infra",
      targetHandle: "top",
      type: "smoothstep",
      animated: true,
      style: { stroke: "rgba(232,121,249,0.15)", strokeWidth: 1.5 },
    });
  }

  // National systems → national service bus (vertical down)
  for (const sys of NATIONAL_SYSTEMS) {
    if (sys.id === "nat-digital-infra") continue;
    goalExternalEdges.push({
      id: `gext-${extIdx++}`,
      source: sys.id,
      sourceHandle: "bottom",
      target: "nat-digital-infra",
      targetHandle: "top",
      type: "smoothstep",
      animated: true,
      style: { stroke: "rgba(245,158,11,0.2)", strokeWidth: 1.5 },
    });
  }

  // National service bus → integration platform (vertical bridge)
  goalExternalEdges.push({
    id: `gext-${extIdx++}`,
    source: "nat-digital-infra",
    sourceHandle: "bottom",
    target: "integration-layer",
    targetHandle: "top",
    type: "smoothstep",
    animated: true,
    style: { stroke: "rgba(245,158,11,0.35)", strokeWidth: 2.5 },
  });

  // Regional systems → regional services hub (vertical down)
  for (const sys of REGIONAL_SYSTEMS) {
    if (sys.id === "reg-shared-it") continue;
    goalExternalEdges.push({
      id: `gext-${extIdx++}`,
      source: sys.id,
      sourceHandle: "bottom",
      target: "reg-shared-it",
      targetHandle: "top",
      type: "smoothstep",
      animated: true,
      style: { stroke: "rgba(167,139,250,0.2)", strokeWidth: 1.5 },
    });
  }

  // Regional services hub → integration platform (horizontal — peers)
  goalExternalEdges.push({
    id: `gext-${extIdx++}`,
    source: "reg-shared-it",
    sourceHandle: "right",
    target: "integration-layer",
    targetHandle: "left",
    type: "smoothstep",
    animated: true,
    style: { stroke: "rgba(167,139,250,0.35)", strokeWidth: 2.5 },
  });

  return [...edges, ...goalExternalEdges];
}

// ──────────────────────────────────────────────
// Stats
// ──────────────────────────────────────────────

export function getStats(level: MaturityLevel) {
  // Level 1 (Manual): no digital systems — risks are operational, not IT
  if (level === 1) {
    return {
      systems: SYSTEMS.length,
      integrations: 0,
      vendors: 0,
      criticalRisks: 0,
    };
  }

  // Level 2 (Fragmented): all legacy systems, spaghetti integrations
  if (level === 2) {
    return {
      systems: SYSTEMS.length,
      integrations: AS_IS_EDGES.length,
      vendors: new Set(SYSTEMS.map((s) => s.vendor.split("/")[0].split(" ")[0])).size,
      criticalRisks: SYSTEMS.filter((s) => s.health === "critical").length,
    };
  }

  // Level 3+ (Connected, Shared, Federated): goal-state with progressive consolidation
  const active = [
    ...SYSTEMS.filter((s) => isActiveAtLevel(s.id, level)),
    ...NEW_SYSTEMS.filter((s) => isActiveAtLevel(s.id, level)),
  ];
  const activeHub = GOAL_HUB_SYSTEMS.filter((id) => isActiveAtLevel(id, level));
  const activeDirectEdges = GOAL_DIRECT_EDGES.filter(
    (e) => isActiveAtLevel(e.source, level) && isActiveAtLevel(e.target, level),
  );

  return {
    systems: active.length,
    integrations: activeHub.length + activeDirectEdges.length,
    vendors: new Set(active.map((s) => s.vendor.split("/")[0].split(" ")[0])).size,
    criticalRisks: 0,
  };
}
