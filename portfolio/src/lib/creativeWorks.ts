export interface CreativeWork {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: "visual" | "interactive" | "generative" | "experimental";
  tags: string[];
  color: string;
  connections: string[]; // IDs of related works (for thread system)
  href?: string; // Link to the experience
  gridArea?: string; // For custom grid placement
  bgColor: string; // Dark background tint for scroll sections
  particleColor: string; // WebGL particle accent color
}

export const creativeWorks: CreativeWork[] = [
  {
    id: "neural-dreams",
    title: "Neural Dreams",
    subtitle: "Where machines learn to feel",
    description:
      "Generative visualizations born from neural networks. Patterns that emerge from the space between logic and intuition.",
    category: "generative",
    tags: ["ML", "Generative", "Visual"],
    color: "#FB7185",
    connections: ["voice-intimacy", "living-typography"],
    bgColor: "#1a0a1e",
    particleColor: "#FB7185",
  },
  {
    id: "voice-intimacy",
    title: "Voice & Intimacy",
    subtitle: "Speaking to be understood",
    description:
      "Explorations in voice interfaces. The vulnerability of speaking aloud. The connection formed through listening.",
    category: "interactive",
    tags: ["Voice", "AI", "Connection"],
    color: "#F472B6",
    connections: ["neural-dreams", "pulse-visualizer"],
    bgColor: "#1a0f1e",
    particleColor: "#F472B6",
  },
  {
    id: "living-typography",
    title: "Living Typography",
    subtitle: "Words that breathe",
    description:
      "Text that moves with intention. Letters that feel weight, gravity, emotion. Typography as a living thing.",
    category: "experimental",
    tags: ["Typography", "Animation", "Expression"],
    color: "#FBBF24",
    connections: ["neural-dreams", "digital-gardens"],
    bgColor: "#1a1408",
    particleColor: "#FBBF24",
  },
  {
    id: "pulse-visualizer",
    title: "The Pulse",
    subtitle: "Rhythms made visible",
    description:
      "Audio-reactive experiences. Music translated into motion. The heartbeat of sound given form.",
    category: "visual",
    tags: ["Audio", "Reactive", "Rhythm"],
    color: "#9D174D",
    connections: ["voice-intimacy"],
    bgColor: "#1a0515",
    particleColor: "#9D174D",
  },
  {
    id: "digital-gardens",
    title: "Digital Gardens",
    subtitle: "Spaces that grow",
    description:
      "Interactive environments that evolve. Ecosystems of ideas. Places to wander and discover.",
    category: "interactive",
    tags: ["Generative", "Exploration", "Growth"],
    color: "#FB923C",
    connections: ["living-typography", "three-worlds"],
    bgColor: "#1a1008",
    particleColor: "#FB923C",
  },
  {
    id: "three-worlds",
    title: "Three Worlds",
    subtitle: "Dimensions of play",
    description:
      "3D sandboxes and spatial experiments. Worlds built for curiosity. Environments that invite presence.",
    category: "experimental",
    tags: ["3D", "WebGL", "Immersive"],
    color: "#E879F9",
    connections: ["digital-gardens"],
    bgColor: "#150a1e",
    particleColor: "#E879F9",
  },
];

// Love theme palette
export const loveTheme = {
  colors: {
    deepRose: "#9D174D",
    warmBlush: "#FB7185",
    softGold: "#FBBF24",
    cream: "#FEF3E7",
    warmBlack: "#1C1917",
    roseGlow: "rgba(251, 113, 133, 0.15)",
    goldGlow: "rgba(251, 191, 36, 0.1)",
  },
  heartbeat: {
    duration: 1.2, // seconds
    scale: [1, 1.02, 1],
    opacity: [0.6, 1, 0.6],
  },
};
