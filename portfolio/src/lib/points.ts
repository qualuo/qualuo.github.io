export interface Point {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
  tags: string[];
  status: "live" | "coming-soon";
  sectionCount?: number;
  format?: "slides" | "paper" | "whiteboard";
}

export const points: Point[] = [
  {
    slug: "ai-architecture",
    title: "AI Architecture",
    subtitle: "Designing Intelligent Systems That Scale",
    description:
      "From model selection to agent orchestration — how to architect AI systems that are reliable, governable, and production-ready without drowning in hype.",
    icon: "cpu",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    tags: ["LLMs", "RAG", "Agents", "MLOps", "AI Governance"],
    status: "live",
    sectionCount: 10,
    format: "paper",
  },
  {
    slug: "system-landscape-map",
    title: "System Landscape Map",
    subtitle: "An Interactive Municipal IT Whiteboard",
    description:
      "An interactive whiteboard mapping the current system landscape against a rationalized target architecture — making the gap visceral and the path obvious.",
    icon: "map",
    gradient: "from-indigo-500 via-blue-500 to-cyan-500",
    tags: ["IT Strategy", "System Rationalization", "Interactive"],
    status: "live",
    sectionCount: 5,
    format: "whiteboard",
  },
  {
    slug: "system-landscape",
    title: "System Landscape",
    subtitle: "Optimizing the Technology Ecosystem",
    description:
      "A strategic guide for enterprise leaders on rationalizing the system landscape — why single platforms fail, how to build composable architectures, and what to settle on versus keep fluid.",
    icon: "shuffle",
    gradient: "from-teal-500 via-emerald-500 to-cyan-500",
    tags: ["IT Strategy", "Architecture", "Integration", "Composability"],
    status: "live",
    sectionCount: 10,
    format: "slides",
  },
  {
    slug: "togaf",
    title: "TOGAF",
    subtitle: "Enterprise Architecture Framework",
    description:
      "A visual presentation on The Open Group Architecture Framework — what it is, why it matters, the ADM cycle, putting it into practice, and bridging TOGAF with Agile.",
    icon: "landmark",
    gradient: "from-amber-500 via-yellow-500 to-orange-500",
    tags: ["Enterprise Architecture", "ADM", "Governance", "TOGAF 10"],
    status: "live",
    sectionCount: 7,
    format: "slides",
  },
  {
    slug: "api-strategy",
    title: "API Strategy",
    subtitle: "Designing APIs as Products",
    description:
      "Why treating APIs as internal products — not plumbing — accelerates delivery, reduces coupling, and turns your platform into a competitive advantage.",
    icon: "code",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    tags: ["API Design", "Developer Experience", "Platform Engineering"],
    status: "coming-soon",
    format: "paper",
  },
  {
    slug: "data-mesh",
    title: "Data Mesh",
    subtitle: "Decentralized Data Ownership at Scale",
    description:
      "Moving beyond the data lake monolith — how domain-oriented data products, federated governance, and self-serve infrastructure change the economics of data.",
    icon: "network",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    tags: ["Data Strategy", "Domain Ownership", "Data Products"],
    status: "coming-soon",
    format: "paper",
  },
  {
    slug: "cloud-migration",
    title: "Cloud Migration",
    subtitle: "Patterns Beyond Lift-and-Shift",
    description:
      "The six R's are a starting point, not a strategy. A decision framework for when to rehost, re-platform, re-architect — and when to simply retire.",
    icon: "cloud",
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
    tags: ["Cloud Native", "Migration Patterns", "Infrastructure"],
    status: "coming-soon",
    format: "slides",
  },
];

export function getPointBySlug(slug: string): Point | undefined {
  return points.find((p) => p.slug === slug);
}
