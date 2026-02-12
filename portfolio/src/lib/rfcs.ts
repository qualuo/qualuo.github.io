export interface Rfc {
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
  tags: string[];
  status: "live" | "coming-soon";
  date: string;
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
    description:
      "A proposal to adopt Azure Well-Architected principles for custom-built solutions in Swedish public sector organizations \u2014 covering tenant structure, data residency, compliance across municipal, regional, and state levels.",
    icon: "cloud-cog",
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
    tags: ["Azure", "Well-Architected", "Swedish Public Sector", "Compliance"],
    status: "live",
    date: "2026-02-11",
    sectionCount: 6,
  },
  {
    slug: "global-multi-cloud-governance",
    number: 2,
    title: "Global Multi-Cloud Governance",
    subtitle: "A Reference Architecture for Azure, AWS, and GCP",
    description:
      "A reference architecture for operating globally distributed infrastructure across Azure, AWS, and GCP \u2014 covering organizational structure, identity federation, networking, compliance, security operations, and FinOps.",
    icon: "globe-lock",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    tags: ["Multi-Cloud", "Azure", "AWS", "GCP", "Compliance", "Global"],
    status: "live",
    date: "2026-02-12",
    sectionCount: 8,
  },
];

export function getRfcBySlug(slug: string): Rfc | undefined {
  return rfcs.find((rfc) => rfc.slug === slug);
}
