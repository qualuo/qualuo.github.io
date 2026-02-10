"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ScrollEssay } from "./shared/essay/ScrollEssay";
import { EssaySection } from "./shared/essay/EssaySection";
import { StickyDiagram } from "./shared/essay/StickyDiagram";
import { Callout } from "./shared/essay/Callout";
import { BeforeAfter } from "./shared/essay/BeforeAfter";
import { InteractiveWidget } from "./shared/essay/InteractiveWidget";
import { TypewriterText } from "./shared/TypewriterText";
import { DiagramCard } from "./shared/DiagramCard";
import { DrawSvg } from "./shared/DrawSvg";
import { AnimatedCounter } from "./shared/essay/AnimatedCounter";
import { RAGPipelineDiagram } from "./diagrams/RAGPipelineDiagram";
import { ProductionStackDiagram } from "./diagrams/ProductionStackDiagram";
import { AgentOrchestrationDiagram } from "./diagrams/AgentOrchestrationDiagram";
import { ModelSelectionWidget } from "./diagrams/ModelSelectionWidget";
import { HypeRealitySpectrum } from "./diagrams/HypeRealitySpectrum";

// ──────────────────────────────────────────────
// Icons (stroke-based, currentColor)
// ──────────────────────────────────────────────

const ICONS = {
  target: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  maximize: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
  alertTriangle: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  sparkles: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
      <path d="M19 1l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5z" />
    </svg>
  ),
  bot: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  ),
  scale: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  ),
  barChart: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  lockKeyhole: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="16" r="1" />
      <rect x="3" y="10" width="18" height="12" rx="2" />
      <path d="M7 10V7a5 5 0 0110 0v3" />
    </svg>
  ),
  clipboardCheck: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  ),
  fileText: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  gitBranch: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 01-9 9" />
    </svg>
  ),
  activity: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  dollarSign: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  zap: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

// ──────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────

const aiAntiPatterns = [
  { title: "Fine-Tune First", desc: "Jumping to fine-tuning before exhausting prompt engineering and retrieval. Fine-tuning is expensive, hard to maintain, and rarely the bottleneck.", icon: ICONS.target },
  { title: "Model Maximalism", desc: "Defaulting to the largest model for every task. 90% of use cases don\u2019t need frontier-class reasoning \u2014 and you pay 30x for the 10% improvement.", icon: ICONS.maximize },
  { title: "Prompt-and-Pray", desc: "No evaluation harness, no regression tests, no observability. If you can\u2019t measure it, you can\u2019t improve it \u2014 and you can\u2019t trust it.", icon: ICONS.alertTriangle },
  { title: "RAG-as-a-Silver-Bullet", desc: "Throwing documents into a vector database and expecting accurate answers. Retrieval quality is only as good as your chunking, indexing, and re-ranking.", icon: ICONS.sparkles },
  { title: "Agent Sprawl", desc: "Autonomous agents calling other agents with no guardrails. One hallucinated tool call cascades into real-world consequences.", icon: ICONS.bot },
  { title: "Governance Afterthought", desc: "Shipping AI to production and worrying about safety, bias, and compliance later. Regulators won\u2019t wait for your next sprint.", icon: ICONS.scale },
];

const governancePillars = [
  { pillar: "Evaluation", desc: "Systematic measurement of model quality, accuracy, and regression detection before and after deployment.", icon: ICONS.barChart, color: "#A78BFA" },
  { pillar: "Guardrails", desc: "Input/output filtering, content policy enforcement, PII detection, and prompt injection defense at the application boundary.", icon: ICONS.shield, color: "#8B5CF6" },
  { pillar: "Observability", desc: "End-to-end tracing of every LLM call \u2014 inputs, outputs, latency, cost, and token usage. You can\u2019t govern what you can\u2019t see.", icon: ICONS.search, color: "#7C3AED" },
  { pillar: "Access Control", desc: "Who can use which models, with what data, for what purpose. Role-based access, data classification, and audit trails.", icon: ICONS.lockKeyhole, color: "#6D28D9" },
];

const GRADIENT = "from-violet-400 via-purple-400 to-fuchsia-400";

// ──────────────────────────────────────────────
// Hero with parallax
// ──────────────────────────────────────────────

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.3]);

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 overflow-hidden">
      {/* Background glow */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0) 70%)",
          scale: glowScale,
        }}
      />

      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative text-center max-w-2xl"
      >
        <motion.p
          className="text-violet-400/80 text-xs font-medium tracking-[0.3em] uppercase mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          An Interactive Paper
        </motion.p>

        <motion.h1
          className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-8 leading-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className={`bg-linear-to-r ${GRADIENT} bg-clip-text text-transparent`}>
            AI Architecture
          </span>
        </motion.h1>

        <motion.p
          className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-lg mx-auto font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          From model selection to agent orchestration &mdash; designing
          intelligent systems that actually work in production.
        </motion.p>

      </motion.div>

      <motion.div
        className="absolute bottom-10 text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ──────────────────────────────────────────────
// Section divider
// ──────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex justify-center py-10 lg:py-16">
      <div className={`h-px w-16 bg-linear-to-r ${GRADIENT} opacity-15`} />
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Paper
// ──────────────────────────────────────────────

export function AIArchitecturePaper() {
  return (
    <ScrollEssay gradient={GRADIENT}>
      <Hero />

      <Divider />

      {/* ═══════ Section 2: The Landscape ═══════ */}
      <EssaySection id="landscape" eyebrow="The Landscape" title="Separating Signal from Noise" gradient={GRADIENT}>
        <p className="text-slate-200/90 leading-relaxed text-lg mb-5">
          The AI landscape is a spectrum. On one end, capabilities that are genuinely
          production-ready &mdash; chatbots, search augmentation, code assistance,
          summarization. Organizations are extracting real value from these today, at scale.
        </p>
        <p className="text-slate-300 leading-[1.8] mb-8">
          On the other end, capabilities that dominate keynotes but remain experimental &mdash;
          fully autonomous agents, self-improving systems, and anything approaching general
          intelligence. Understanding where your use case sits on this spectrum is the first
          architectural decision you make.
        </p>

        <InteractiveWidget title="Hype vs. Reality Spectrum — 2026" hint="Hover to explore">
          <HypeRealitySpectrum />
        </InteractiveWidget>

        <Callout variant="insight">
          The companies winning with AI aren&apos;t chasing the frontier. They&apos;re
          systematically extracting value from the production-ready end of the spectrum
          while carefully experimenting at the edges.
        </Callout>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 3: Common Pitfalls ═══════ */}
      <EssaySection id="pitfalls" eyebrow="Common Pitfalls" title="Patterns Worth Avoiding" gradient={GRADIENT}>
        <p className="text-slate-200/90 leading-relaxed text-lg mb-8">
          Most AI setbacks aren&apos;t model problems &mdash; they&apos;re architecture problems.
          The same anti-patterns keep appearing across organizations. Recognizing them early
          saves months of rework.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {aiAntiPatterns.map((item, i) => (
            <DiagramCard key={item.title} delay={i * 0.05}>
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 text-slate-500"><DrawSvg>{item.icon}</DrawSvg></span>
                <div>
                  <h3 className="text-[13px] font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </DiagramCard>
          ))}
        </div>

        <Callout variant="warning">
          The single most common pattern: teams skip evaluation. Without an eval harness,
          every change is a gamble. You can&apos;t improve what you can&apos;t measure.
        </Callout>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 4: Model Selection ═══════ */}
      <div className="max-w-3xl mx-auto px-6 lg:px-10 mb-8">
        <p className={`text-xs font-semibold uppercase tracking-[0.25em] mb-4 bg-linear-to-r ${GRADIENT} bg-clip-text text-transparent`}>
          Model Strategy
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
          Right Model, Right Task
        </h2>
        <p className="text-slate-200/90 leading-relaxed text-lg">
          There is no &ldquo;best model.&rdquo; There is only the best model for a given task,
          latency budget, and cost envelope. Smart architectures route dynamically
          across tiers.
        </p>
      </div>

      <StickyDiagram
        diagram={({ progress, activeStep }) => (
          <ModelSelectionWidget progress={progress} activeStep={activeStep} />
        )}
        steps={[
          {
            id: "model-intro",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Not all tasks need the biggest model</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  A frontier model costs 10-30x more per token than a workhorse model &mdash; and
                  for classification, extraction, and simple Q&A, the quality difference is negligible.
                </p>
              </div>
            ),
          },
          {
            id: "model-frontier",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Frontier: complex reasoning</h3>
                <p className="text-slate-300 leading-relaxed text-base mb-3">
                  Reserve frontier models for multi-step analysis, complex code generation,
                  and agentic workflows that need to plan and recover from errors.
                </p>
                <p className="text-slate-400 leading-relaxed text-base">
                  This should be 5-10% of your production traffic.
                </p>
              </div>
            ),
          },
          {
            id: "model-workhorse",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Workhorse: the default tier</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Mid-tier models handle the majority of production workloads &mdash; summarization,
                  classification, chat, extraction. Best cost-quality ratio. This is where ~60%
                  of your traffic should land.
                </p>
              </div>
            ),
          },
          {
            id: "model-speed",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Speed: real-time responses</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Small, fast models for latency-sensitive paths &mdash; autocomplete, intent
                  classification, real-time filtering, streaming UIs. Sub-200ms response times
                  at a fraction of the cost. About 25% of production traffic.
                </p>
              </div>
            ),
          },
          {
            id: "model-specialized",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Specialized: domain fine-tuned</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Fine-tuned or domain-specific models for narrow, high-value tasks &mdash;
                  medical coding, legal extraction, financial sentiment. Only fine-tune when
                  prompt engineering and retrieval have been exhausted. ~5% of traffic.
                </p>
              </div>
            ),
          },
          {
            id: "model-routing",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Route dynamically</h3>
                <p className="text-slate-300 leading-relaxed text-base mb-3">
                  A small, fast model classifies the incoming request and sends it to the
                  appropriate tier. This alone can reduce LLM spend by{" "}
                  <span className="text-white font-semibold">
                    <AnimatedCounter value={60} suffix="–80%" />
                  </span>.
                </p>
              </div>
            ),
          },
        ]}
      />

      <Divider />

      {/* ═══════ Section 5: RAG Pipeline ═══════ */}
      <div className="max-w-3xl mx-auto px-6 lg:px-10 mb-8">
        <p className={`text-xs font-semibold uppercase tracking-[0.25em] mb-4 bg-linear-to-r ${GRADIENT} bg-clip-text text-transparent`}>
          Retrieval
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
          RAG Done Right
        </h2>
        <p className="text-slate-200/90 leading-relaxed text-lg">
          Retrieval-Augmented Generation is the most common production pattern &mdash;
          and the most commonly implemented poorly. Each step is an opportunity to
          improve or degrade answer quality.
        </p>
      </div>

      <StickyDiagram
        diagram={({ progress, activeStep }) => (
          <RAGPipelineDiagram progress={progress} activeStep={activeStep} />
        )}
        flipped
        steps={[
          {
            id: "rag-ingest",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">1. Ingest &amp; Chunk</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Documents are parsed, cleaned, and split into chunks. Chunk size and overlap
                  matter more than most teams realize. Too small and you lose context. Too large
                  and you dilute relevance.
                </p>
              </div>
            ),
          },
          {
            id: "rag-embed",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">2. Embed</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Each chunk is vectorized using an embedding model. Choose based on your
                  domain, not leaderboard benchmarks. A model fine-tuned on legal text beats
                  a general-purpose model for legal documents.
                </p>
              </div>
            ),
          },
          {
            id: "rag-index",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">3. Index &amp; Tag</h3>
                <p className="text-slate-300 leading-relaxed text-base mb-3">
                  Vectors stored alongside metadata &mdash; source, date, author, type.
                  Metadata filtering is your first line of precision.
                </p>
                <Callout variant="tip">
                  Before investing in better embeddings or re-ranking, try adding structured
                  metadata filters. Cheap and often transformative.
                </Callout>
              </div>
            ),
          },
          {
            id: "rag-retrieve",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">4. Retrieve</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Hybrid search &mdash; combining BM25 (keyword) with semantic (vector) &mdash;
                  consistently outperforms either approach alone. Pure vector search
                  misses exact keyword matches.
                </p>
              </div>
            ),
          },
          {
            id: "rag-rerank",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">5. Re-rank</h3>
                <p className="text-slate-300 leading-relaxed text-base mb-3">
                  A cross-encoder re-ranks retrieved chunks by relevance. Unlike embeddings
                  that encode separately, cross-encoders see query and document together.
                </p>
                <Callout variant="insight">
                  Adding a re-ranking step can double answer accuracy. The single
                  highest-leverage improvement to an existing RAG pipeline.
                </Callout>
              </div>
            ),
          },
          {
            id: "rag-generate",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">6. Generate</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Top chunks injected as context. The LLM synthesizes the answer. If the answer
                  is wrong here, the problem is almost always upstream. Most RAG failures
                  are retrieval failures.
                </p>
              </div>
            ),
          },
        ]}
      />

      <Divider />

      {/* ═══════ Section 6: Agent Patterns ═══════ */}
      <div className="max-w-3xl mx-auto px-6 lg:px-10 mb-8">
        <p className={`text-xs font-semibold uppercase tracking-[0.25em] mb-4 bg-linear-to-r ${GRADIENT} bg-clip-text text-transparent`}>
          Agents
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
          Agentic Architecture
        </h2>
        <p className="text-slate-200/90 leading-relaxed text-lg">
          Systems that reason, plan, and take actions. The pattern you choose
          determines your risk profile, debuggability, and scalability.
        </p>
      </div>

      <StickyDiagram
        diagram={({ progress, activeStep }) => (
          <AgentOrchestrationDiagram progress={progress} activeStep={activeStep} />
        )}
        steps={[
          {
            id: "agent-react",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">ReAct: Reason + Act</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  The model thinks, acts, observes, then thinks again. Simple, interpretable,
                  effective. Start here &mdash; most production agent use cases can be solved
                  with a well-designed ReAct loop and the right tools.
                </p>
              </div>
            ),
          },
          {
            id: "agent-multi",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Multi-Agent Orchestration</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Specialized agents collaborate &mdash; one plans, one researches, one executes,
                  one reviews. Unlocks parallel execution but introduces coordination
                  overhead. Only adopt when single-agent can&apos;t handle the complexity.
                </p>
              </div>
            ),
          },
          {
            id: "agent-human",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Human-in-the-Loop</h3>
                <p className="text-slate-300 leading-relaxed text-base mb-3">
                  Autonomous for low-risk, pauses for high-stakes. The right default
                  for production.
                </p>
                <Callout variant="warning">
                  Start with human-in-the-loop. Always. Earn autonomy through demonstrated
                  reliability &mdash; measured by your eval suite, not your intuition.
                </Callout>
              </div>
            ),
          },
        ]}
      />

      <Divider />

      {/* ═══════ Section 7: Production Architecture ═══════ */}
      <div className="max-w-3xl mx-auto px-6 lg:px-10 mb-8">
        <p className={`text-xs font-semibold uppercase tracking-[0.25em] mb-4 bg-linear-to-r ${GRADIENT} bg-clip-text text-transparent`}>
          The Stack
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
          Anatomy of a Production System
        </h2>
        <p className="text-slate-200/90 leading-relaxed text-lg">
          Six layers deep. The model is just one &mdash; and rarely the one that
          determines success. Build the layers that differentiate you. Buy the rest.
        </p>
      </div>

      <StickyDiagram
        diagram={({ progress, activeStep }) => (
          <ProductionStackDiagram progress={progress} activeStep={activeStep} />
        )}
        flipped
        steps={[
          {
            id: "stack-infra",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Infrastructure</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  GPU compute, serving, caching. Start with managed APIs. Self-host only when
                  economics or compliance demand it.
                </p>
              </div>
            ),
          },
          {
            id: "stack-model",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Model Layer</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Foundation models via API or self-hosted. This layer is commoditizing fast &mdash;
                  abstract behind a unified interface so you can swap providers as the market shifts.
                </p>
              </div>
            ),
          },
          {
            id: "stack-retrieval",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Retrieval Layer</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Where your domain knowledge lives and where you start to differentiate.
                  Chunking, metadata, re-ranking, hybrid search.
                </p>
              </div>
            ),
          },
          {
            id: "stack-orchestration",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Orchestration</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  The brain. Which model to call, what tools to invoke, how to decompose tasks.
                  Frameworks accelerate prototyping; production often outgrows them.
                </p>
              </div>
            ),
          },
          {
            id: "stack-application",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Application Layer</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  Chat, copilots, search, automation. The UX should abstract away all AI
                  complexity. The best AI products feel like magic, not a chatbot.
                </p>
              </div>
            ),
          },
          {
            id: "stack-eval",
            content: (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Eval &amp; Observability</h3>
                <p className="text-slate-300 leading-relaxed text-base mb-3">
                  The cross-cutting layer. LLM-as-judge, regression tests, distributed tracing,
                  cost attribution.
                </p>
                <Callout variant="warning">
                  The most under-invested layer. Teams spend months on prompts but won&apos;t
                  spend a week on eval. If you skip this, nothing else matters.
                </Callout>
              </div>
            ),
          },
        ]}
      />

      <div className="max-w-4xl mx-auto px-6 lg:px-10 mt-8">
        <p className="text-slate-300 leading-relaxed text-base mb-6 text-center">
          When these layers work together, the difference is dramatic:
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Manual side */}
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 text-center">Manual Workflow</p>
            <div className="space-y-2">
              {["Search 5 data sources manually", "Copy relevant data to spreadsheet", "Write analysis in document", "Review for errors", "Email to stakeholders"].map((step, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/5"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <span className="text-[11px] text-slate-400 font-mono w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm text-slate-300">{step}</span>
                </motion.div>
              ))}
              <p className="text-[11px] text-slate-400 text-center pt-2">~4 hours, error-prone</p>
            </div>
          </div>
          {/* Orchestrated side */}
          <div>
            <p className="text-xs font-medium text-violet-400/80 uppercase tracking-wider mb-3 text-center">Orchestrated Stack</p>
            <div className="space-y-2">
              {["Agent queries all sources in parallel", "Cross-references and ranks results", "Generates draft with citations", "Human reviews & approves", "Auto-distributes to stakeholders"].map((step, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/4 border border-violet-500/12"
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 + 0.15, duration: 0.4 }}
                >
                  <span className="text-[11px] text-violet-400/80 font-mono w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm text-slate-300">{step}</span>
                </motion.div>
              ))}
              <p className="text-[11px] text-violet-400/70 text-center pt-2">~15 minutes, auditable</p>
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* ═══════ Section 8: Governance ═══════ */}
      <EssaySection id="governance" eyebrow="Governance" title="AI You Can Trust" gradient={GRADIENT}>
        <p className="text-slate-200/90 leading-relaxed text-lg mb-6">
          Governance isn&apos;t a tax on innovation &mdash; it&apos;s the foundation that lets you
          move fast without breaking things. Four pillars, in place before your first
          production deployment.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {governancePillars.map((g, i) => (
            <DiagramCard key={g.pillar} delay={i * 0.06}>
              <div className="flex items-start gap-3">
                <motion.div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 border"
                  style={{ backgroundColor: `${g.color}10`, borderColor: `${g.color}20`, color: g.color }}
                  whileInView={{ scale: [1, 1.1, 1] }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                >
                  <DrawSvg>{g.icon}</DrawSvg>
                </motion.div>
                <div>
                  <h3 className="text-[13px] font-semibold text-white mb-1">{g.pillar}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{g.desc}</p>
                </div>
              </div>
            </DiagramCard>
          ))}
        </div>

        <Callout variant="note">
          The EU AI Act, NIST AI RMF, and sector-specific regulations are no longer
          theoretical. Without governance, compliance walls will block deployment entirely.
        </Callout>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 9: LLM-as-Judge ═══════ */}
      <EssaySection id="llm-as-judge" eyebrow="Evaluation" title="LLM-as-Judge" gradient={GRADIENT}>
        <p className="text-slate-200/90 leading-relaxed text-lg mb-5">
          The biggest bottleneck in production AI isn&apos;t the model &mdash; it&apos;s knowing
          whether the model is working. Human evaluation doesn&apos;t scale. Traditional metrics
          don&apos;t capture what matters. LLM-as-judge bridges the gap.
        </p>
        <p className="text-slate-300 leading-[1.8] mb-8">
          The idea is simple: use a strong LLM to evaluate outputs from your production LLM
          against a rubric you define. It&apos;s not replacing human judgment &mdash; it&apos;s
          making human-quality evaluation practical at scale.
        </p>

        <div className="space-y-3 mb-8">
          <DiagramCard delay={0}>
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-violet-400/70"><DrawSvg>{ICONS.clipboardCheck}</DrawSvg></span>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Define your rubric</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  What does &ldquo;good&rdquo; look like? Factual accuracy, tone, completeness,
                  safety &mdash; each dimension scored on a clear scale. The rubric is the contract
                  between your team and your AI.
                </p>
              </div>
            </div>
          </DiagramCard>
          <DiagramCard delay={0.06}>
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-violet-400/70"><DrawSvg>{ICONS.fileText}</DrawSvg></span>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Curate golden examples</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ten to fifty reference input-output pairs with human-verified scores. These anchor
                  the judge and catch calibration drift. Start small — even ten examples provide
                  signal most teams never have.
                </p>
              </div>
            </div>
          </DiagramCard>
          <DiagramCard delay={0.12}>
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-violet-400/70"><DrawSvg>{ICONS.gitBranch}</DrawSvg></span>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Run the judge in CI</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every prompt change, every model upgrade &mdash; the judge scores the full
                  test suite before it hits production. Regressions get caught at the PR,
                  not by your users.
                </p>
              </div>
            </div>
          </DiagramCard>
          <DiagramCard delay={0.18}>
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-violet-400/70"><DrawSvg>{ICONS.activity}</DrawSvg></span>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Monitor in production</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sample production traffic, run async evaluation, flag quality drops. The judge
                  becomes your always-on QA engineer &mdash; catching degradation before it
                  compounds.
                </p>
              </div>
            </div>
          </DiagramCard>
        </div>

        <Callout variant="insight">
          LLM-as-judge correlates 85-95% with human reviewers when the rubric is clear.
          The teams that ship confidently aren&apos;t the ones with better models &mdash;
          they&apos;re the ones that know exactly how their models are performing, every day.
        </Callout>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 10: Build vs Buy ═══════ */}
      <EssaySection id="build-vs-buy" eyebrow="Strategy" title="Build vs. Buy" gradient={GRADIENT}>
        <p className="text-slate-200/90 leading-relaxed text-lg mb-6">
          Not every layer deserves custom engineering. The decision is about where
          your competitive advantage lies.
        </p>

        <BeforeAfter
          beforeLabel="Build When..."
          afterLabel="Buy When..."
          before={
            <div className="space-y-2">
              {[
                "The capability is your core differentiator",
                "You need full control over the data pipeline",
                "Existing tools can't meet your requirements",
                "You can maintain it long-term",
                "Regulation demands self-hosted infrastructure",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/2 border border-white/4">
                  <span className="text-violet-400/80 mt-0.5 shrink-0 text-xs">+</span>
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          }
          after={
            <div className="space-y-2">
              {[
                "The capability is commodity infrastructure",
                "Time-to-market matters more than customization",
                "The vendor ecosystem is mature",
                "Energy is better spent on application logic",
                "Switching costs are manageable",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/2 border border-white/4">
                  <span className="text-emerald-400/80 mt-0.5 shrink-0 text-xs">+</span>
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          }
        />

        <Callout variant="insight">
          Build the layers that touch your domain. Buy the layers that don&apos;t. The
          exception is evaluation &mdash; always build that in-house.
        </Callout>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 10: Closing ═══════ */}
      <div className="pb-32">
        <EssaySection id="closing" eyebrow="What Now" title="Monday Morning" gradient={GRADIENT}>
          <div className="space-y-3 mb-16">
            <DiagramCard delay={0}>
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 text-violet-400/70"><DrawSvg>{ICONS.checkCircle}</DrawSvg></span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <span className="text-white font-medium">Build an eval suite</span> for your
                  highest-value use case. Ten golden examples, an LLM-as-judge scorer, a CI
                  pipeline. This puts you ahead of 90% of teams.
                </p>
              </div>
            </DiagramCard>
            <DiagramCard delay={0.06}>
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 text-violet-400/70"><DrawSvg>{ICONS.dollarSign}</DrawSvg></span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <span className="text-white font-medium">Audit your model spend.</span> Classify
                  every LLM call by tier and route accordingly. Most organizations overspend 3-5x.
                </p>
              </div>
            </DiagramCard>
            <DiagramCard delay={0.12}>
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 text-violet-400/70"><DrawSvg>{ICONS.zap}</DrawSvg></span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <span className="text-white font-medium">Add guardrails and tracing</span> to
                  every production endpoint this week. If a call isn&apos;t traced, it
                  doesn&apos;t exist.
                </p>
              </div>
            </DiagramCard>
          </div>

          <div className="text-center">
            <TypewriterText
              text="The organizations that win with AI won't be the ones with the best models — they'll be the ones with the best architecture around their models."
              className="text-slate-400 text-base md:text-lg tracking-wide italic leading-relaxed"
              speed={30}
            />
          </div>
        </EssaySection>
      </div>
    </ScrollEssay>
  );
}
