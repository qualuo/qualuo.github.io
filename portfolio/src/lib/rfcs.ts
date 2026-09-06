export interface Rfc {
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  tags: string[];
  status: "live" | "coming-soon";
  date: string;
}

export interface EnrichedRfc extends Rfc {
  description: string;
  sectionCount: number;
}

export function rfcLabel(rfc: Rfc): string {
  return `RFC-${String(rfc.number).padStart(3, "0")}`;
}

export const rfcs: Rfc[] = [
  {
    slug: "custom-solutions-azure",
    number: 1,
    title: "Custom Solutions in Azure",
    subtitle: "A Well-Architected Proposal for Swedish Public Sector",
    icon: "cloud-cog",
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
    tags: ["Azure", "Well-Architected", "Swedish Public Sector", "Compliance"],
    status: "live",
    date: "2026-02-11",
  },
  {
    slug: "global-multi-cloud-governance",
    number: 2,
    title: "Global Multi-Cloud Governance",
    subtitle: "A Reference Architecture for Azure, AWS, and GCP",
    icon: "globe-lock",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    tags: ["Multi-Cloud", "Azure", "AWS", "GCP", "Compliance", "Global"],
    status: "live",
    date: "2026-02-12",
  },
  {
    slug: "agentic-workforce",
    number: 3,
    title: "The Agentic Workforce",
    subtitle: "One Container, One Role, One Prompt",
    icon: "brain-circuit",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    tags: ["AI Agents", "Containers", "Agentic Workforce", "Cost Optimization"],
    status: "live",
    date: "2026-02-12",
  },
  {
    slug: "ai-governance",
    number: 4,
    title: "AI Governance & Trust Architecture",
    subtitle: "Governance Through Infrastructure, Not Policy Documents",
    icon: "shield-check",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    tags: ["AI Governance", "Trust Architecture", "Compliance", "Audit"],
    status: "live",
    date: "2026-02-14",
  },
  {
    slug: "choosing-the-model",
    number: 5,
    title: "Choosing the Model",
    subtitle: "A Decision Procedure for Picking the Right AI Approach",
    icon: "route",
    gradient: "from-rose-500 via-fuchsia-500 to-indigo-500",
    tags: ["Model Selection", "Decision Framework", "Cost Optimization", "Document Processing"],
    status: "live",
    date: "2026-09-06",
  },
];

export function getRfcBySlug(slug: string): Rfc | undefined {
  return rfcs.find((rfc) => rfc.slug === slug);
}
