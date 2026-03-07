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
  flower: string; // Botanical name for floral theme
}

export const creativeWorks: CreativeWork[] = [
  {
    id: "sakura-dreams",
    title: "Sakura Dreams",
    subtitle: "Transient beauty in bloom",
    description:
      "A cherry blossom tree, swaying in the wind. Petals drift like memories — beautiful, fleeting, and endlessly renewed.",
    category: "visual",
    tags: ["Sakura", "Simulation", "Canvas"],
    color: "#F9A8D4",
    connections: ["neural-dreams", "digital-gardens"],
    href: "/creative/sakura/",
    bgColor: "#1a0f1e",
    particleColor: "#F9A8D4",
    flower: "Yoshino Cherry",
  },
  {
    id: "neural-dreams",
    title: "Neural Dreams",
    subtitle: "Where machines learn to feel",
    description:
      "Generative visualizations born from neural networks. Patterns that emerge from the space between logic and intuition.",
    category: "generative",
    tags: ["ML", "Generative", "Visual"],
    color: "#C4B5FD",
    connections: ["voice-intimacy", "living-typography"],
    bgColor: "#1a0a1e",
    particleColor: "#C4B5FD",
    flower: "Wisteria",
  },
  {
    id: "voice-intimacy",
    title: "Voice & Intimacy",
    subtitle: "Speaking to be understood",
    description:
      "Explorations in voice interfaces. The vulnerability of speaking aloud. The connection formed through listening.",
    category: "interactive",
    tags: ["Voice", "AI", "Connection"],
    color: "#F9A8D4",
    connections: ["neural-dreams", "pulse-visualizer"],
    bgColor: "#1a0f1e",
    particleColor: "#F9A8D4",
    flower: "Night Jasmine",
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
    href: "/creative/type-race/",
    bgColor: "#1a1408",
    particleColor: "#FBBF24",
    flower: "Sunflower",
  },
  {
    id: "pulse-visualizer",
    title: "The Pulse",
    subtitle: "Rhythms made visible",
    description:
      "Audio-reactive experiences. Music translated into motion. The heartbeat of sound given form.",
    category: "visual",
    tags: ["Audio", "Reactive", "Rhythm"],
    color: "#FB7185",
    connections: ["voice-intimacy"],
    bgColor: "#1a0515",
    particleColor: "#FB7185",
    flower: "Dahlia",
  },
  {
    id: "digital-gardens",
    title: "Digital Gardens",
    subtitle: "Spaces that grow",
    description:
      "Interactive environments that evolve. Ecosystems of ideas. Places to wander and discover.",
    category: "interactive",
    tags: ["Generative", "Exploration", "Growth"],
    color: "#FDBA74",
    connections: ["living-typography", "three-worlds"],
    href: "/creative/flowers/",
    bgColor: "#1a1008",
    particleColor: "#FDBA74",
    flower: "Cherry Blossom",
  },
  {
    id: "celestial-glider",
    title: "Celestial Glider",
    subtitle: "Drift through the unknown",
    description:
      "Guide a glowing spirit bird through procedurally generated skies. Floating islands, light orbs, and a sky that shifts from dawn to midnight.",
    category: "interactive",
    tags: ["3D", "WebGL", "Procedural"],
    color: "#7DD3FC",
    connections: ["three-worlds"],
    href: "/creative/fly/",
    bgColor: "#0a1220",
    particleColor: "#7DD3FC",
    flower: "Moonflower",
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
    connections: ["digital-gardens", "celestial-glider"],
    bgColor: "#150a1e",
    particleColor: "#E879F9",
    flower: "Lotus",
  },
];

// Love & garden theme palette
export const loveTheme = {
  colors: {
    deepRose: "#9D174D",
    warmBlush: "#FB7185",
    softGold: "#FBBF24",
    cream: "#FEF3E7",
    warmBlack: "#1C1917",
    roseGlow: "rgba(251, 113, 133, 0.15)",
    goldGlow: "rgba(251, 191, 36, 0.1)",
    blossom: "#F9A8D4",
    lavender: "#C4B5FD",
    sage: "#86EFAC",
    peach: "#FDBA74",
  },
  bloom: {
    duration: 2, // seconds — slow, like a flower opening
    scale: [1, 1.03, 1],
    opacity: [0.5, 1, 0.5],
  },
};
