export interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  skills: string[];
  highlights?: string[];
  position: [number, number, number]; // 3D position in galaxy
  color: string;
  size: number; // Node size based on significance
  connections: string[]; // IDs of connected experiences
}

export const experiences: Experience[] = [
  {
    id: "current",
    title: "Software Developer",
    company: "City of Greater Sudbury",
    period: "2022 - Present",
    description:
      "Designing and developing generative AI applications, enterprise automation frameworks, and comprehensive system integrations. Building intelligent systems that transform organizational workflows and drive digital transformation initiatives.",
    skills: ["Azure OpenAI", "Power Platform", "SQL Server", "TypeScript", "Azure", "LLMs"],
    highlights: [
      "Led generative AI implementation initiatives",
      "Architected enterprise automation framework",
      "Developed HR system integrations affecting 6,000+ employees",
      "Built compliance-first AI solutions for sensitive data",
    ],
    position: [0, 1, 0], // Center-top - the current star
    color: "#00D4FF",
    size: 1.4,
    connections: ["contractor"],
  },
  {
    id: "contractor",
    title: "Independent Software Developer",
    company: "Self-Employed",
    period: "2020 - 2022",
    description:
      "Developed custom software solutions for diverse clients across industries. Shipped mobile applications globally and created interactive 3D visualization tools for urban planning and real-time simulations.",
    skills: ["Unity", "C#", "Three.js", "TypeScript", "WebGL", "React"],
    highlights: [
      "Chess Simulator with 10,000+ users globally",
      "3D city planning visualization tools",
      "Custom business applications",
      "Mobile game development and publishing",
    ],
    position: [-3, 0, 1],
    color: "#A855F7",
    size: 1.2,
    connections: ["current", "bombardier"],
  },
  {
    id: "bombardier",
    title: "Software Developer",
    company: "Bombardier Transportation",
    period: "2018 - 2020",
    description:
      "Developed distributed control subsystems for safety-critical railway signalling infrastructure at a Fortune 500 company. Worked on systems that directly impact public safety and transportation reliability.",
    skills: ["C", "C#", "Linux", "Distributed Systems", "Safety-Critical", "RTOS"],
    highlights: [
      "Safety-critical railway signalling systems",
      "Fortune 500 transportation infrastructure",
      "Distributed control subsystems",
      "Real-time embedded systems development",
    ],
    position: [2.5, -1, -1],
    color: "#F97316",
    size: 1.2,
    connections: ["contractor", "education"],
  },
  {
    id: "education",
    title: "Computer Science",
    company: "Laurentian University",
    period: "2014 - 2018",
    description:
      "Bachelor of Science in Computer Science. Built strong foundations in algorithms, data structures, software engineering principles, and computational thinking that continue to inform my approach to complex problems.",
    skills: ["Algorithms", "Data Structures", "Software Engineering", "Mathematics", "Research"],
    highlights: [
      "Bachelor of Science degree",
      "Strong algorithmic foundations",
      "Software engineering principles",
      "Research methodology and technical writing",
    ],
    position: [0, -2.5, 0],
    color: "#10B981",
    size: 1.0,
    connections: ["bombardier"],
  },
];

// Category colors for the galaxy theme
export const galaxyTheme = {
  background: "#000000",
  nebula: {
    primary: "rgba(0, 212, 255, 0.03)",
    secondary: "rgba(168, 85, 247, 0.02)",
  },
  stars: {
    dim: "rgba(255, 255, 255, 0.3)",
    bright: "rgba(255, 255, 255, 0.8)",
  },
  connections: {
    default: "rgba(255, 255, 255, 0.15)",
    active: "rgba(255, 255, 255, 0.4)",
  },
};
