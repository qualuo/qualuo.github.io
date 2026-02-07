export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  tech: string[];
  impact?: string;
  media?: {
    type: "video" | "image";
    src: string;
  };
  links?: {
    live?: string;
    github?: string;
    report?: string;
  };
  visualConfig?: {
    type: "neural" | "grid" | "flow" | "city" | "chess" | "circuit";
    colors: {
      primary: string;
      secondary: string;
    };
  };
}

export const categoryThemes: Record<string, { primary: string; secondary: string; gradient: string }> = {
  "AI & Innovation": {
    primary: "#00D4FF",
    secondary: "#0066FF",
    gradient: "from-cyan-500/30 via-blue-600/20 to-transparent",
  },
  "Architecture": {
    primary: "#A855F7",
    secondary: "#6366F1",
    gradient: "from-purple-500/30 via-indigo-600/20 to-transparent",
  },
  "Data Engineering": {
    primary: "#10B981",
    secondary: "#06B6D4",
    gradient: "from-emerald-500/30 via-cyan-600/20 to-transparent",
  },
  "Web & Visualization": {
    primary: "#F59E0B",
    secondary: "#EF4444",
    gradient: "from-amber-500/30 via-orange-500/20 to-transparent",
  },
  "Game Development": {
    primary: "#EC4899",
    secondary: "#8B5CF6",
    gradient: "from-pink-500/30 via-violet-600/20 to-transparent",
  },
  "Critical Infrastructure": {
    primary: "#F97316",
    secondary: "#DC2626",
    gradient: "from-orange-500/30 via-red-600/20 to-transparent",
  },
};

export const projects: Project[] = [
  {
    id: "generative-ai-platform",
    title: "Generative AI Solutions",
    category: "AI & Innovation",
    description:
      "Designed and developed generative AI applications that augment human decision-making and automate complex knowledge work. Built intelligent systems that handle sensitive data while maintaining strict compliance and security standards.",
    tech: ["Azure OpenAI", "LLMs", "Power Platform", "Azure", "Compliance"],
    impact: "Transforming organizational workflows",
    visualConfig: {
      type: "neural",
      colors: { primary: "#00D4FF", secondary: "#0066FF" },
    },
  },
  {
    id: "automation-framework",
    title: "Enterprise Automation Framework",
    category: "Architecture",
    description:
      "Architected and implemented a robust, event-driven, and scalable automation framework. Built to handle complex business processes with reliability and extensibility at its core.",
    tech: ["Event-Driven Architecture", "Azure", "Power Platform", "SQL Server"],
    impact: "Foundation for organization-wide digital transformation",
    visualConfig: {
      type: "grid",
      colors: { primary: "#A855F7", secondary: "#6366F1" },
    },
  },
  {
    id: "hr-integrations",
    title: "HR System Integrations",
    category: "Data Engineering",
    description:
      "Developed comprehensive HR system integrations that streamline employee data management and automate critical HR processes across the organization.",
    tech: ["SQL Server", "SSIS", "ETL Pipelines", "Data Integration"],
    impact: "Affecting 6,000+ employees",
    visualConfig: {
      type: "flow",
      colors: { primary: "#10B981", secondary: "#06B6D4" },
    },
  },
  {
    id: "3d-city-planning",
    title: "3D City Planning Visualization",
    category: "Web & Visualization",
    description:
      "Developed an interactive 3D visualization tool for urban planning, enabling stakeholders to explore and evaluate city development proposals in an immersive digital environment.",
    tech: ["WebGL", "Cesium", "GIS Data"],
    impact: "Modernizing municipal planning processes",
    visualConfig: {
      type: "city",
      colors: { primary: "#F59E0B", secondary: "#EF4444" },
    },
  },
  {
    id: "chess-simulator",
    title: "Chess Simulator",
    category: "Game Development",
    description:
      "Created a chess sandbox game featuring full 3D physics interaction and AI powered by the world's strongest chess engine. Shipped globally on mobile platforms with 10,000+ users.",
    tech: ["Unity", "C#", "Chess AI", "3D Physics"],
    impact: "Could beat any human world champion",
    visualConfig: {
      type: "chess",
      colors: { primary: "#EC4899", secondary: "#8B5CF6" },
    },
  },
  {
    id: "railway-signalling",
    title: "Railway Signalling System",
    category: "Critical Infrastructure",
    description:
      "Developed distributed control subsystems for safety-critical railway signalling infrastructure.",
    tech: ["C", "C#", "Linux", "Distributed Systems", "Safety-Critical"],
    impact: "Fortune 500 transportation infrastructure",
    visualConfig: {
      type: "circuit",
      colors: { primary: "#F97316", secondary: "#DC2626" },
    },
  },
];
