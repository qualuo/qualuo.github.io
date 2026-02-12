"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Demo } from "@/lib/demos";
import { lazy, Suspense } from "react";

const StarsBackground = dynamic(
  () => import("@/components/animations/StarsBackground").then(m => ({ default: m.StarsBackground })),
  { ssr: false }
);

// Lazy load demo components for better initial page performance
const ParticlePlayground = lazy(() => import("@/components/demos/ParticlePlayground").then(m => ({ default: m.ParticlePlayground })));
const LocalLLMChat = lazy(() => import("@/components/demos/LocalLLMChat").then(m => ({ default: m.LocalLLMChat })));
const DocumentRAG = lazy(() => import("@/components/demos/DocumentRAG").then(m => ({ default: m.DocumentRAG })));
const TypeExperiments = lazy(() => import("@/components/demos/TypeExperiments").then(m => ({ default: m.TypeExperiments })));
const VoiceChat = lazy(() => import("@/components/demos/VoiceChat").then(m => ({ default: m.VoiceChat })));
const MusicGeneration = lazy(() => import("@/components/demos/MusicGeneration").then(m => ({ default: m.MusicGeneration })));
const TransformersPlayground = lazy(() => import("@/components/demos/TransformersPlayground").then(m => ({ default: m.TransformersPlayground })));
const ThreeDSandbox = lazy(() => import("@/components/demos/ThreeDSandbox").then(m => ({ default: m.ThreeDSandbox })));
const NeuralForwardPass = lazy(() => import("@/components/demos/NeuralForwardPass").then(m => ({ default: m.NeuralForwardPass })));
const MillionPointScatter = lazy(() => import("@/components/demos/MillionPointScatter").then(m => ({ default: m.MillionPointScatter })));

// Map of demo slugs to their components
const DEMO_COMPONENTS: Record<string, React.ComponentType> = {
  "particle-playground": ParticlePlayground,
  "local-llm-chat": LocalLLMChat,
  "document-rag": DocumentRAG,
  "type-experiments": TypeExperiments,
  "voice-chat": VoiceChat,
  "music-generation": MusicGeneration,
  "ml-playground": TransformersPlayground,
  "3d-sandbox": ThreeDSandbox,
  "neural-forward-pass": NeuralForwardPass,
  "million-points": MillionPointScatter,
};

function DemoPlaceholder({ demo }: { demo: Demo }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        className={`w-24 h-24 rounded-3xl bg-linear-to-br ${demo.gradient} flex items-center justify-center text-5xl shadow-2xl mb-8`}
      >
        {demo.icon}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-3xl md:text-4xl font-bold text-white mb-4"
      >
        {demo.title}
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-md"
      >
        <p className="text-slate-400 text-lg mb-6">{demo.description}</p>

        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-slate-400 text-sm font-medium">
            Currently in development
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap justify-center gap-2 mt-8"
      >
        {demo.tech.map((tech, index) => (
          <motion.span
            key={tech}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + index * 0.05 }}
            className="px-4 py-2 text-sm rounded-full bg-white/5 text-slate-400 border border-white/10"
          >
            {tech}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

interface DemoPageClientProps {
  demo: Demo | undefined;
}

export function DemoPageClient({ demo }: DemoPageClientProps) {
  if (!demo) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <StarsBackground />
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Demo Not Found</h1>
          <p className="text-slate-400 mb-8">
            The demo you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/demos"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Demos
          </Link>
        </div>
      </main>
    );
  }

  const DemoComponent = DEMO_COMPONENTS[demo.slug];
  const hasLiveDemo = !!DemoComponent;

  return (
    <main className="relative min-h-screen bg-black">
      {!hasLiveDemo && <StarsBackground />}

      {/* Navigation header */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed top-0 left-0 right-0 z-40 py-4 px-6 bg-black/50 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/demos"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            All Demos
          </Link>

          <div className="flex items-center gap-4">
            <div
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10`}
            >
              <span className="text-lg">{demo.icon}</span>
              <span className="text-sm font-medium text-white">
                {demo.title}
              </span>
            </div>

            <Link
              href="/#contact"
              className="px-4 py-2 text-sm bg-white text-black rounded-full hover:bg-gray-100 transition-colors font-medium"
            >
              Contact
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Demo content area */}
      <section className="relative pt-20 pb-8 px-6 min-h-screen flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6 pt-4"
          >
            <p
              className={`text-sm font-medium bg-linear-to-r ${demo.gradient} bg-clip-text text-transparent tracking-widest uppercase mb-2`}
            >
              {demo.subtitle}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {demo.title}
            </h1>
          </motion.div>

          {/* Demo container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {hasLiveDemo ? (
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              }>
                <DemoComponent />
              </Suspense>
            ) : (
              <div className="flex-1 rounded-3xl overflow-hidden bg-white/2 border border-white/8 backdrop-blur-sm flex items-center justify-center">
                <DemoPlaceholder demo={demo} />
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
