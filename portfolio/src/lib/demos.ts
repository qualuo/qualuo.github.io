export interface Demo {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
  tech: string[];
  status: "live" | "coming-soon";
}

export const demos: Demo[] = [
  {
    slug: "local-llm-chat",
    title: "Local AI Chat",
    subtitle: "On-Device Intelligence",
    description: "Chat with an AI running entirely in your browser using WebGPU. No server, no data leaves your device.",
    icon: "🧠",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    tech: ["WebGPU", "WebLLM", "LLMs", "React"],
    status: "live",
  },
  {
    slug: "voice-chat",
    title: "Voice Chat",
    subtitle: "Speak & Listen",
    description: "Talk to an AI using your voice. Whisper transcribes your speech, an LLM responds, and TTS speaks the answer—all locally.",
    icon: "🎙️",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    tech: ["Whisper", "WebLLM", "Web Speech API", "WebGPU"],
    status: "live",
  },
  {
    slug: "document-rag",
    title: "Document Q&A",
    subtitle: "Private RAG",
    description: "Upload documents and ask questions. Uses embeddings and retrieval-augmented generation, all running locally.",
    icon: "📚",
    gradient: "from-orange-500 via-rose-500 to-pink-500",
    tech: ["RAG", "Embeddings", "WebGPU", "PDF.js"],
    status: "live",
  },
  {
    slug: "music-generation",
    title: "Music Generation",
    subtitle: "AI Composer",
    description: "Generate original music from text prompts. A small MusicGen model runs entirely in your browser via WebGPU.",
    icon: "🎵",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    tech: ["MusicGen", "Transformers.js", "WebGPU", "Web Audio"],
    status: "live",
  },
  {
    slug: "ml-playground",
    title: "ML Playground",
    subtitle: "AI Toolkit",
    description: "Try different machine learning tasks—sentiment analysis, named entity recognition, image classification, and more.",
    icon: "🤖",
    gradient: "from-indigo-500 via-purple-500 to-violet-500",
    tech: ["Transformers.js", "BERT", "ViT", "DETR"],
    status: "live",
  },
  {
    slug: "type-experiments",
    title: "Type Experiments",
    subtitle: "Kinetic Typography",
    description: "Dynamic text animations and interactive typography exploring the boundaries of web type.",
    icon: "◆",
    gradient: "from-slate-400 via-zinc-400 to-neutral-500",
    tech: ["Canvas API", "Framer Motion", "CSS Transforms"],
    status: "live",
  },
  {
    slug: "particle-playground",
    title: "Particle Playground",
    subtitle: "Interactive Physics",
    description: "Explore emergent behaviors with hundreds of particles responding to forces, attractors, and your cursor in real-time.",
    icon: "✦",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    tech: ["Canvas API", "Physics Simulation", "React"],
    status: "live",
  },
  {
    slug: "shader-gallery",
    title: "Shader Gallery",
    subtitle: "Visual Mathematics",
    description: "A curated collection of GLSL fragment shaders—from fluid simulations to procedural landscapes.",
    icon: "◈",
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    tech: ["GLSL", "Three.js", "WebGL2"],
    status: "coming-soon",
  },
  {
    slug: "audio-visualizer",
    title: "Audio Visualizer",
    subtitle: "Sound & Motion",
    description: "Transform any audio into mesmerizing visuals with real-time FFT analysis and generative graphics.",
    icon: "◉",
    gradient: "from-rose-500 via-pink-500 to-orange-500",
    tech: ["Web Audio API", "Canvas", "FFT"],
    status: "coming-soon",
  },
  {
    slug: "generative-art",
    title: "Generative Art Studio",
    subtitle: "Algorithmic Beauty",
    description: "Create unique artworks using algorithms—flow fields, noise patterns, and recursive geometries.",
    icon: "❖",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    tech: ["p5.js", "Perlin Noise", "SVG Export"],
    status: "coming-soon",
  },
  {
    slug: "3d-sandbox",
    title: "3D Sandbox",
    subtitle: "Spatial Computing",
    description: "Experiment with 3D primitives, lighting, and materials in an interactive WebGL environment.",
    icon: "◇",
    gradient: "from-amber-500 via-yellow-500 to-lime-500",
    tech: ["Three.js", "React Three Fiber", "HDRI"],
    status: "live",
  },
  {
    slug: "neural-forward-pass",
    title: "Neural Network",
    subtitle: "Interactive Training & Visualization",
    description: "Build, train, and visualize a neural network in real-time. Draw digits, watch backpropagation learn, and edit the architecture live.",
    icon: "🧬",
    gradient: "from-fuchsia-500 via-pink-500 to-rose-500",
    tech: ["Three.js", "Backpropagation", "SGD Training", "WebGL"],
    status: "live",
  },
  {
    slug: "million-points",
    title: "Million-Point Scatter",
    subtitle: "WebGPU at Scale",
    description: "Render 1,000,000+ synthetic stars at 60fps using WebGPU compute shaders. Explore the catalog interactively.",
    icon: "✨",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    tech: ["WebGPU", "WGSL Compute", "Star Catalog", "WebGL Fallback"],
    status: "live",
  },
];

export function getDemoBySlug(slug: string): Demo | undefined {
  return demos.find((demo) => demo.slug === slug);
}
