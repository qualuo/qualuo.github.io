import type { MaturityLevel } from "./data";

export type Locale = "en" | "sv";

// Outcome text with optional level-variant overrides
export interface OutcomeStrings {
  label: string;
  labelL5?: string;
  before: string;
  beforeL5?: string;
  after: string;
  afterL4?: string;
  afterL5?: string;
}

export interface Translations {
  domains: Record<string, string>;
  maturity: Array<{ name: string; description: string }>;
  systems: Record<string, { label: string; painPoints?: string[]; goalNote?: string }>;
  external: Record<string, { label: string; description: string }>;
  tiers: Record<string, { label: string; sublabel: string }>;
  governanceTags: Array<{ label: string; info: string }>;
  integration: {
    platform: string;
    federation: string;
    components: {
      apiGateway: { name: string; description: string };
      messageBroker: { name: string; description: string };
      dataWarehouse: { name: string; description: string };
      federationGateway: { name: string; description: string };
      eventBus: { name: string; description: string };
      dataLake: { name: string; description: string };
    };
  };
  outcomes: Record<string, OutcomeStrings>;
  badges: {
    int: string;
    issue: string;
    issues: string;
    sunset: string;
    new: string;
    federated: string;
    modernized: string;
    gateway: string;
    emerging: string;
    national: string;
    regional: string;
    also: string;
  };
  stats: {
    systems: string;
    integrations: string;
    vendors: string;
    risks: string;
  };
  detail: {
    deployed: string;
    annualCost: string;
    health: string;
    integrations: string;
    painPoints: string;
    recommendation: string;
    systemAge: string;
    years: string;
  };
  health: Record<string, string>;
  actions: Record<string, string>;
}

// Resolve level-dependent outcome text
export function resolveOutcome(o: OutcomeStrings, level: MaturityLevel) {
  return {
    label: (level >= 5 && o.labelL5) ? o.labelL5 : o.label,
    before: (level >= 5 && o.beforeL5) ? o.beforeL5 : o.before,
    after: (level >= 5 && o.afterL5) ? o.afterL5 : (level >= 4 && o.afterL4) ? o.afterL4 : o.after,
  };
}

// ──────────────────────────────────────────────
// English
// ──────────────────────────────────────────────

const en: Translations = {
  domains: {
    finance: "Finance & Administration",
    hr: "Human Resources",
    planning: "Planning & Development",
    technical: "Public Works & Facilities",
    education: "Education & Childcare",
    social: "Social Services & Care",
    culture: "Culture & Recreation",
    it: "IT & Digital Services",
    environment: "Environment & Licensing",
  },
  maturity: [
    { name: "Manual", description: "Paper forms, phone calls, physical archives — no enterprise systems" },
    { name: "Fragmented", description: "Siloed systems, spreadsheet dependencies, no integration strategy" },
    { name: "Connected", description: "Integration platform replaces spaghetti — custom apps retired, suites consolidated" },
    { name: "Shared", description: "Inter-municipal governance — shared IT operations, pooled recruitment, regional consortia" },
    { name: "Federated", description: "Open API standards let municipalities keep their own systems while sharing data seamlessly" },
  ],
  systems: {
    "financial-system": { label: "Financial System", painPoints: ["Aging version, upgrade overdue", "Heavy customizations block patches", "Vendor lock-in across 4 modules"], goalNote: "Upgrade to cloud financial suite — consolidate budgeting and invoice handling" },
    "budget": { label: "Budget & Forecasting", goalNote: "Integrate via central integration layer" },
    "invoicing": { label: "Invoice Processing", painPoints: ["Manual routing of paper invoices still common"], goalNote: "Absorbed into cloud financial suite" },
    "purchasing": { label: "Purchasing & Procurement", goalNote: "Absorbed into cloud financial suite" },
    "asset-register": { label: "Asset Register", painPoints: ["Spreadsheet — no audit trail", "No connection to financial system", "Manual inventory updates annually"], goalNote: "Migrated into financial system asset module" },
    "hr-system": { label: "Staff Administration", painPoints: ["Poor self-service for employees", "Disconnected from scheduling", "Complex customizations"], goalNote: "Cloud staff platform with self-service and mobile" },
    "payroll": { label: "Payroll Processing", goalNote: "Merged into cloud staff platform" },
    "scheduling": { label: "Staff Scheduling", painPoints: ["Separate from payroll — manual transfer of hours", "Care staff schedules managed in parallel spreadsheets"], goalNote: "Integrated scheduling in cloud staff platform" },
    "recruiting": { label: "Recruitment Portal" },
    "pension": { label: "Pension & Benefits", goalNote: "Integrate via central integration layer" },
    "building-permits": { label: "Building Permits", goalNote: "Core system — add integration layer for citizen self-service" },
    "gis": { label: "Geographic Information", painPoints: ["Proprietary formats limit data sharing", "Esri lock-in (€180K/yr)", "Every department needs map data but few have licenses"], goalNote: "Strategic platform — publish open APIs via integration layer" },
    "detail-plans": { label: "Zoning & Land Use", painPoints: ["Custom-built, original developer left", "No vendor support", "Runs on end-of-life server OS"], goalNote: "Replaced by permit system planning module" },
    "address-register": { label: "Address & Property Register" },
    "land-survey": { label: "Land Surveying" },
    "facility-mgmt": { label: "Facility Management", goalNote: "Expand to absorb fleet tracking and road management" },
    "work-orders": { label: "Work Orders", goalNote: "Part of facility management suite" },
    "fleet": { label: "Vehicle Fleet Tracking", painPoints: ["Spreadsheet — unreliable data", "No fuel cost connection", "Duplicate data in financial system"], goalNote: "Absorbed into facility management platform" },
    "road-mgmt": { label: "Road & Street Register", painPoints: ["Aging version, no mobile support", "Manual sync with geographic information system"], goalNote: "Cloud version with mobile field tools" },
    "water-sewage": { label: "Water & Sewer Network", goalNote: "Integrate via central integration layer" },
    "school-admin": { label: "School Administration", goalNote: "Core system — integrate via central integration layer" },
    "preschool-queue": { label: "Childcare Enrollment" },
    "learning-platform": { label: "Learning Platform", painPoints: ["Separate identity from municipal system", "Teachers manage two logins"], goalNote: "Federate identity via central identity system" },
    "school-meals": { label: "School Meal Planning" },
    "special-transport": { label: "School Transport", painPoints: ["Access database — personal data risk", "No audit trail", "Single point of failure", "One person knows how it works"], goalNote: "Replaced by school administration transport module" },
    "social-casework": { label: "Social Case Management", painPoints: ["Complex, slow user interface", "Caseworkers spend more time documenting than helping", "Vendor lock-in"], goalNote: "Cloud case management with mobile and better usability" },
    "elderly-care": { label: "Elderly Care Planning", painPoints: ["Scheduling disconnected from staff system", "Home care staff use paper route sheets"], goalNote: "Mobile-first care planning with real-time scheduling" },
    "home-care-mobile": { label: "Home Care Mobile App", goalNote: "Integrate with modernized care planning" },
    "disability-care": { label: "Disability Services" },
    "social-excel": { label: "Statistics & Reporting", painPoints: ["Manual data extraction from case system", "Error-prone quarterly reporting", "No traceability"], goalNote: "Replaced by automated reporting from data warehouse" },
    "facility-booking": { label: "Facility Booking", goalNote: "Integrate with citizen self-service portal" },
    "library": { label: "Library System" },
    "activity-cards": { label: "Activity & Membership", painPoints: ["Custom PHP — security vulnerabilities", "No responsive design", "Youth activity data with no backup strategy"], goalNote: "Replaced by facility booking membership module" },
    "culture-school": { label: "Music & Arts School" },
    "service-desk": { label: "IT Service Desk", goalNote: "IT service management — integrate with citizen request system" },
    "identity": { label: "Identity & Access", goalNote: "Central identity layer — single sign-on for all systems" },
    "m365": { label: "Office & Email" },
    "monitoring": { label: "Infrastructure Monitoring" },
    "backup": { label: "Backup & Recovery" },
    "env-cases": { label: "Environmental Case Management", goalNote: "Core system — integrate via central integration layer" },
    "food-inspections": { label: "Food Safety Inspections" },
    "env-monitoring": { label: "Environmental Monitoring", painPoints: ["Spreadsheet with 15 years of measurement data", "No structured database", "Risk of data loss"], goalNote: "Migrated to data warehouse with proper time-series storage" },
    "alcohol-permits": { label: "Business & Liquor Licenses" },
    "citizen-portal": { label: "Citizen Self-Service Portal", goalNote: "Unified self-service for permits, bookings, school enrollment, and case status" },
    "citizen-requests": { label: "Citizen Request Tracking", goalNote: "Issue reporting and feedback — replaces email-based citizen communication" },
  },
  external: {
    "supra-identity-wallet": { label: "Digital Identity Wallet", description: "Cross-border citizen identity — launching 2026–2027" },
    "supra-once-only": { label: "Once Only Technical System", description: "Cross-border data exchange so citizens don't re-submit documents" },
    "supra-single-gateway": { label: "Single Digital Gateway", description: "Unified portal connecting national government service portals" },
    "supra-blockchain": { label: "Document Verification Ledger", description: "Shared ledger for cross-border document and credential verification" },
    "nat-population": { label: "Population Register", description: "Civil registry — births, deaths, addresses, citizenship" },
    "nat-tax": { label: "Tax Authority", description: "Income reporting, employer declarations, VAT" },
    "nat-land": { label: "National Land Registry", description: "Property ownership, cadastral data, deeds" },
    "nat-statistics": { label: "Statistics Bureau", description: "Mandatory municipal reporting — demographics, economy, education" },
    "nat-eid": { label: "National Digital Identity", description: "Citizen authentication for government services" },
    "nat-social-insurance": { label: "Social Insurance", description: "Pensions, sickness benefits, parental leave" },
    "nat-digital-infra": { label: "National Service Bus", description: "Government integration gateway — mandatory on-ramp for all national register access" },
    "reg-healthcare": { label: "Regional Healthcare", description: "Hospital records, primary care, prescriptions" },
    "reg-transit": { label: "Public Transit Authority", description: "Routes, schedules, school transport coordination" },
    "reg-emergency": { label: "Emergency Services", description: "Fire, rescue, dispatch coordination" },
    "reg-env-agency": { label: "Environmental Agency", description: "Permits, compliance monitoring, contaminated sites" },
    "reg-shared-it": { label: "Regional Services Hub", description: "Shared integration layer — data center, procurement, security operations" },
  },
  tiers: {
    supranational: { label: "Supranational", sublabel: "Governance frameworks that constrain all tiers below" },
    national: { label: "National", sublabel: "Central government systems the municipality must connect to" },
    regional: { label: "Regional Partners", sublabel: "Peer agencies — shared services, not hierarchy" },
    municipal: { label: "Municipal", sublabel: "Systems owned and operated by the municipality" },
  },
  governanceTags: [
    { label: "Data Protection", info: "Privacy rights, breach reporting, cross-border data transfers" },
    { label: "Digital Identity", info: "Mutual recognition of electronic identity across member states" },
    { label: "Open Data Directive", info: "Mandatory publishing of public datasets in machine-readable formats" },
    { label: "Cybersecurity Directive", info: "Baseline security requirements for critical infrastructure operators" },
    { label: "AI Act", info: "Risk-based classification and compliance rules for AI systems in government" },
    { label: "Environmental Reporting", info: "Air quality, water quality, emissions — mandatory reporting to international bodies" },
    { label: "Public Procurement Directives", info: "Transparency and fairness rules for government purchasing above thresholds" },
  ],
  integration: {
    platform: "Municipal Integration Platform",
    federation: "Municipal Federation Node",
    components: {
      apiGateway: { name: "API Gateway", description: "Routes, rate-limits, and authenticates all system-to-system traffic" },
      messageBroker: { name: "Message Broker", description: "Async event distribution — publishes changes so subscribing systems react in real time" },
      dataWarehouse: { name: "Data Warehouse", description: "Centralized analytics — replaces departmental Excel silos and manual reporting" },
      federationGateway: { name: "Federation Gateway", description: "Translates between local APIs and national standards — routes cross-municipal data requests" },
      eventBus: { name: "Event Bus", description: "Publishes domain events to national streams — subscribes to cross-municipal updates" },
      dataLake: { name: "Data Lake", description: "Local analytics + automated feeds to national statistics and open data portals" },
    },
  },
  outcomes: {
    "outcome-finance": { label: "IT maintenance waste", labelL5: "Vendor lock-in", before: "€400K/yr", beforeL5: "per-system", after: "reinvested", afterL4: "pooled regionally", afterL5: "zero (open APIs)" },
    "outcome-planning": { label: "Permit processing", before: "6 weeks", after: "6 days", afterL5: "cross-municipal" },
    "outcome-technical": { label: "Work order response", before: "5 days", after: "same day" },
    "outcome-education": { label: "Parent self-service", before: "0%", after: "85% digital", afterL5: "fully portable" },
    "outcome-social": { label: "Critical security risks", before: "6", after: "0" },
    "outcome-culture": { label: "Online booking", before: "30%", after: "90%", afterL5: "any municipality" },
    "outcome-it": { label: "Systems to maintain", labelL5: "Interoperable systems", before: "43", beforeL5: "0", after: "35", afterL4: "31", afterL5: "29" },
    "outcome-environment": { label: "Data loss risk", before: "High", after: "eliminated" },
  },
  badges: {
    int: "int",
    issue: "issue",
    issues: "issues",
    sunset: "sunset",
    new: "new",
    federated: "federated",
    modernized: "modernized",
    gateway: "gateway",
    emerging: "emerging",
    national: "national",
    regional: "regional",
    also: "Also",
  },
  stats: {
    systems: "Systems",
    integrations: "Integrations",
    vendors: "Vendors",
    risks: "Risks",
  },
  detail: {
    deployed: "Deployed",
    annualCost: "Annual Cost",
    health: "Health",
    integrations: "Integrations",
    painPoints: "Pain Points",
    recommendation: "Recommendation",
    systemAge: "System age",
    years: "years",
  },
  health: {
    healthy: "Healthy",
    warning: "Warning",
    critical: "Critical",
  },
  actions: {
    keep: "Keep",
    modernize: "Modernize",
    sunset: "Sunset",
    consolidate: "Consolidate",
    new: "New System",
  },
};

// ──────────────────────────────────────────────
// Swedish — targeting municipal (kommun) audience
// ──────────────────────────────────────────────

const sv: Translations = {
  domains: {
    finance: "Ekonomi & administration",
    hr: "Personal & HR",
    planning: "Samhällsplanering",
    technical: "Teknik & fastighet",
    education: "Utbildning & barnomsorg",
    social: "Socialtjänst & omsorg",
    culture: "Kultur & fritid",
    it: "IT & digitalisering",
    environment: "Miljö & tillstånd",
  },
  maturity: [
    { name: "Manuellt", description: "Pappersblanketter, telefonsamtal, fysiska arkiv — inga verksamhetssystem" },
    { name: "Fragmenterat", description: "Isolerade system, kalkylbladsberoenden, ingen integrationsstrategi" },
    { name: "Anslutet", description: "Integrationsplattform ersätter spagettikopplingar — egenutvecklat avvecklas, sviter konsolideras" },
    { name: "Delat", description: "Mellankommunal styrning — gemensam IT-drift, samordnad rekrytering, regionala konsortier" },
    { name: "Federerat", description: "Öppna API-standarder låter kommuner behålla sina system och dela data sömlöst" },
  ],
  systems: {
    "financial-system": { label: "Ekonomisystem", painPoints: ["Föråldrad version, uppgradering försenad", "Tunga anpassningar blockerar uppdateringar", "Leverantörsinlåsning över 4 moduler"], goalNote: "Uppgradera till molnbaserad ekonomisvit — konsolidera budget och fakturahantering" },
    "budget": { label: "Budget & prognos", goalNote: "Integrera via central integrationsplattform" },
    "invoicing": { label: "Fakturahantering", painPoints: ["Manuell hantering av pappersfakturor fortfarande vanligt"], goalNote: "Absorberas i molnbaserad ekonomisvit" },
    "purchasing": { label: "Inköp & upphandling", goalNote: "Absorberas i molnbaserad ekonomisvit" },
    "asset-register": { label: "Anläggningsregister", painPoints: ["Kalkylblad — ingen spårbarhet", "Ingen koppling till ekonomisystemet", "Manuell inventering årligen"], goalNote: "Migreras till ekonomisystemets anläggningsmodul" },
    "hr-system": { label: "Personaladministration", painPoints: ["Bristfällig självservice för anställda", "Frikopplat från schemaläggning", "Komplexa anpassningar"], goalNote: "Molnbaserad personalplattform med självservice och mobilt stöd" },
    "payroll": { label: "Lönehantering", goalNote: "Sammanslaget med molnbaserad personalplattform" },
    "scheduling": { label: "Schemaläggning", painPoints: ["Separerat från lönesystem — manuell överföring av timmar", "Omsorgspersonalens scheman hanteras i parallella kalkylblad"], goalNote: "Integrerad schemaläggning i molnbaserad personalplattform" },
    "recruiting": { label: "Rekryteringsportal" },
    "pension": { label: "Pension & förmåner", goalNote: "Integrera via central integrationsplattform" },
    "building-permits": { label: "Bygglov", goalNote: "Kärnsystem — anslut medborgartjänst via integrationsplattform" },
    "gis": { label: "Geografiskt informationssystem", painPoints: ["Proprietära format begränsar datadelning", "Esri-inlåsning (€180K/år)", "Alla förvaltningar behöver kartdata men få har licenser"], goalNote: "Strategisk plattform — publicera öppna API:er via integrationsplattform" },
    "detail-plans": { label: "Detaljplan & markanvändning", painPoints: ["Egenutvecklat, ursprunglig utvecklare slutade", "Inget leverantörsstöd", "Körs på operativsystem som nått end-of-life"], goalNote: "Ersätts av bygglovssystemets planeringsmodul" },
    "address-register": { label: "Adress- & fastighetsregister" },
    "land-survey": { label: "Lantmäteri" },
    "facility-mgmt": { label: "Fastighetsförvaltning", goalNote: "Expandera för att inkludera fordonshantering och vägunderhåll" },
    "work-orders": { label: "Arbetsorder", goalNote: "Del av fastighetsförvaltningssviten" },
    "fleet": { label: "Fordonshantering", painPoints: ["Kalkylblad — opålitlig data", "Ingen koppling till bränslekostnader", "Dubblettdata i ekonomisystemet"], goalNote: "Absorberas i fastighetsförvaltningsplattform" },
    "road-mgmt": { label: "Väg- & gatuförteckning", painPoints: ["Föråldrad version, inget mobilstöd", "Manuell synkronisering med GIS"], goalNote: "Molnversion med mobila fältverktyg" },
    "water-sewage": { label: "VA-ledningsnät", goalNote: "Integrera via central integrationsplattform" },
    "school-admin": { label: "Skoladministration", goalNote: "Kärnsystem — integrera via central integrationsplattform" },
    "preschool-queue": { label: "Förskoleplacering" },
    "learning-platform": { label: "Lärplattform", painPoints: ["Separat identitet från kommunens system", "Lärare hanterar dubbla inloggningar"], goalNote: "Federera identitet via centralt identitetssystem" },
    "school-meals": { label: "Skolmåltidsplanering" },
    "special-transport": { label: "Skolskjuts", painPoints: ["Access-databas — risk för personuppgifter", "Ingen spårbarhet", "Enskild felpunkt", "En person vet hur det fungerar"], goalNote: "Ersätts av skoladministrationens transportmodul" },
    "social-casework": { label: "Social ärendehantering", painPoints: ["Komplext, långsamt användargränssnitt", "Handläggare ägnar mer tid åt dokumentation än hjälp", "Leverantörsinlåsning"], goalNote: "Molnbaserad ärendehantering med mobilt stöd och bättre användbarhet" },
    "elderly-care": { label: "Äldreomsorgsplanering", painPoints: ["Schemaläggning frikopplad från personalsystem", "Hemtjänstpersonal använder pappersruttlistor"], goalNote: "Mobil-först omsorgsplanering med realtidsschemaläggning" },
    "home-care-mobile": { label: "Hemtjänstapp", goalNote: "Integrera med moderniserad omsorgsplanering" },
    "disability-care": { label: "Funktionsstöd" },
    "social-excel": { label: "Statistik & rapportering", painPoints: ["Manuell dataextraktion från ärendesystem", "Felbenägen kvartalsrapportering", "Ingen spårbarhet"], goalNote: "Ersätts av automatiserad rapportering från datalager" },
    "facility-booking": { label: "Lokalbokning", goalNote: "Integrera med självserviceportal" },
    "library": { label: "Bibliotekssystem" },
    "activity-cards": { label: "Aktiviteter & medlemskap", painPoints: ["Egenutvecklad PHP — säkerhetsluckor", "Ingen responsiv design", "Ungdomsaktivitetsdata utan backup-strategi"], goalNote: "Ersätts av lokalbokningens medlemsmodul" },
    "culture-school": { label: "Kulturskola" },
    "service-desk": { label: "IT-servicedesk", goalNote: "IT-tjänstehantering — integrera med felanmälningssystem" },
    "identity": { label: "Identitet & behörighet", goalNote: "Centralt identitetslager — enkel inloggning till alla system" },
    "m365": { label: "Kontor & e-post" },
    "monitoring": { label: "Infrastrukturövervakning" },
    "backup": { label: "Säkerhetskopiering" },
    "env-cases": { label: "Miljöärendehantering", goalNote: "Kärnsystem — integrera via central integrationsplattform" },
    "food-inspections": { label: "Livsmedelstillsyn" },
    "env-monitoring": { label: "Miljöövervakning", painPoints: ["Kalkylblad med 15 års mätdata", "Ingen strukturerad databas", "Risk för dataförlust"], goalNote: "Migreras till datalager med korrekt tidserielagring" },
    "alcohol-permits": { label: "Serveringstillstånd" },
    "citizen-portal": { label: "Självserviceportal", goalNote: "Enhetlig självservice för bygglov, bokning, förskola och ärendestatus" },
    "citizen-requests": { label: "Felanmälan & synpunkter", goalNote: "Felanmälan och synpunkter — ersätter e-postbaserad medborgarkommunikation" },
  },
  external: {
    "supra-identity-wallet": { label: "Digital identitetsplånbok", description: "Gränsöverskridande medborgaridentitet — lansering 2026–2027" },
    "supra-once-only": { label: "En-gång-principen", description: "Gränsöverskridande datautbyte — medborgare slipper skicka in dokument flera gånger" },
    "supra-single-gateway": { label: "Gemensam digital ingång", description: "Gemensam portal som kopplar samman nationella myndighetstjänster" },
    "supra-blockchain": { label: "Verifieringskedja", description: "Delad kedja för gränsöverskridande dokument- och legitimationsverifiering" },
    "nat-population": { label: "Folkbokföring", description: "Civilregister — födelser, dödsfall, adresser, medborgarskap" },
    "nat-tax": { label: "Skatteverket", description: "Inkomstrapportering, arbetsgivardeklarationer, moms" },
    "nat-land": { label: "Lantmäteriet", description: "Fastighetsägande, fastighetsdata, lagfarter" },
    "nat-statistics": { label: "Statistiska centralbyrån", description: "Obligatorisk kommunal rapportering — demografi, ekonomi, utbildning" },
    "nat-eid": { label: "E-legitimation", description: "Medborgarautentisering för offentliga tjänster" },
    "nat-social-insurance": { label: "Försäkringskassan", description: "Pensioner, sjukersättning, föräldraledighet" },
    "nat-digital-infra": { label: "Nationell tjänsteplattform", description: "Statlig integrationsplattform — obligatorisk anslutningspunkt för alla nationella register" },
    "reg-healthcare": { label: "Regional sjukvård", description: "Sjukhusjournal, primärvård, recept" },
    "reg-transit": { label: "Kollektivtrafikmyndighet", description: "Linjer, tidtabeller, samordning av skolskjuts" },
    "reg-emergency": { label: "Räddningstjänst", description: "Brand, räddning, larmsamordning" },
    "reg-env-agency": { label: "Länsstyrelsen (miljö)", description: "Tillstånd, tillsynsuppföljning, förorenade områden" },
    "reg-shared-it": { label: "Regional IT-samverkan", description: "Gemensam integrationsplattform — datacenter, upphandling, säkerhetsoperationer" },
  },
  tiers: {
    supranational: { label: "Övernationellt", sublabel: "Styrningsramverk som styr alla nivåer nedan" },
    national: { label: "Nationellt", sublabel: "Statliga system som kommunen måste ansluta till" },
    regional: { label: "Regionala partners", sublabel: "Samverkansaktörer — delade tjänster, inte hierarki" },
    municipal: { label: "Kommunalt", sublabel: "System som ägs och drivs av kommunen" },
  },
  governanceTags: [
    { label: "Dataskydd", info: "Integritetsskydd, incidentrapportering, gränsöverskridande dataöverföringar" },
    { label: "Digital identitet", info: "Ömsesidigt erkännande av elektronisk identitet mellan medlemsstater" },
    { label: "Öppna data-direktivet", info: "Obligatorisk publicering av offentliga dataset i maskinläsbara format" },
    { label: "Cybersäkerhetsdirektivet", info: "Grundläggande säkerhetskrav för operatörer av samhällskritisk infrastruktur" },
    { label: "AI-förordningen", info: "Riskbaserad klassificering och regelefterlevnad för AI-system i offentlig sektor" },
    { label: "Miljörapportering", info: "Luftkvalitet, vattenkvalitet, utsläpp — obligatorisk rapportering till internationella organ" },
    { label: "Upphandlingsdirektiven", info: "Transparens- och rättvisekrav för offentlig upphandling över tröskelvärden" },
  ],
  integration: {
    platform: "Kommunal integrationsplattform",
    federation: "Kommunal federationsnod",
    components: {
      apiGateway: { name: "API-gateway", description: "Dirigerar, hastighetsbegränsar och autentiserar all system-till-system-trafik" },
      messageBroker: { name: "Meddelandehanterare", description: "Asynkron händelsedistribution — publicerar ändringar så system reagerar i realtid" },
      dataWarehouse: { name: "Datalager", description: "Central analys — ersätter förvaltningarnas Excel-silos och manuell rapportering" },
      federationGateway: { name: "Federationsgateway", description: "Översätter mellan lokala API:er och nationella standarder — dirigerar mellankommunala dataförfrågningar" },
      eventBus: { name: "Händelsebuss", description: "Publicerar domänhändelser till nationella strömmar — prenumererar på mellankommunala uppdateringar" },
      dataLake: { name: "Datasjö", description: "Lokal analys + automatiserade flöden till nationell statistik och öppna dataportaler" },
    },
  },
  outcomes: {
    "outcome-finance": { label: "IT-underhållskostnad", labelL5: "Leverantörsinlåsning", before: "€400K/år", beforeL5: "per system", after: "återinvesteras", afterL4: "samordnas regionalt", afterL5: "noll (öppna API:er)" },
    "outcome-planning": { label: "Handläggningstid bygglov", before: "6 veckor", after: "6 dagar", afterL5: "kommunövergripande" },
    "outcome-technical": { label: "Arbetsordersvar", before: "5 dagar", after: "samma dag" },
    "outcome-education": { label: "Självservice föräldrar", before: "0%", after: "85% digitalt", afterL5: "fullt portabelt" },
    "outcome-social": { label: "Kritiska säkerhetsrisker", before: "6", after: "0" },
    "outcome-culture": { label: "Onlinebokning", before: "30%", after: "90%", afterL5: "valfri kommun" },
    "outcome-it": { label: "System att underhålla", labelL5: "Interoperabla system", before: "43", beforeL5: "0", after: "35", afterL4: "31", afterL5: "29" },
    "outcome-environment": { label: "Risk för dataförlust", before: "Hög", after: "eliminerad" },
  },
  badges: {
    int: "int",
    issue: "problem",
    issues: "problem",
    sunset: "avvecklas",
    new: "ny",
    federated: "federerat",
    modernized: "moderniserat",
    gateway: "gateway",
    emerging: "kommande",
    national: "nationellt",
    regional: "regionalt",
    also: "Alt.",
  },
  stats: {
    systems: "System",
    integrations: "Integrationer",
    vendors: "Leverantörer",
    risks: "Risker",
  },
  detail: {
    deployed: "Driftsatt",
    annualCost: "Årskostnad",
    health: "Status",
    integrations: "Integrationer",
    painPoints: "Smärtpunkter",
    recommendation: "Rekommendation",
    systemAge: "Systemålder",
    years: "år",
  },
  health: {
    healthy: "Frisk",
    warning: "Varning",
    critical: "Kritisk",
  },
  actions: {
    keep: "Behåll",
    modernize: "Modernisera",
    sunset: "Avveckla",
    consolidate: "Konsolidera",
    new: "Nytt system",
  },
};

const translations: Record<Locale, Translations> = { en, sv };

export function t(locale: Locale): Translations {
  return translations[locale];
}
