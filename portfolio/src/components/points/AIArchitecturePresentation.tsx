"use client";

import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { SlideDeck, Slide } from "./shared/SlideDeck";
import { PresentationSection } from "./shared/PresentationSection";
import { DiagramCard } from "./shared/DiagramCard";
import { InsightCallout } from "./shared/InsightCallout";
import { TypewriterText } from "./shared/TypewriterText";

// ──────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────

const aiAntiPatterns = [
  { title: "Fine-Tune First", desc: "Jumping to fine-tuning before exhausting prompt engineering and retrieval. Fine-tuning is expensive, hard to maintain, and rarely the bottleneck.", icon: "🎯" },
  { title: "Model Maximalism", desc: "Defaulting to the largest model for every task. 90% of use cases don't need frontier-class reasoning — and you pay 30x for the 10% improvement.", icon: "🐘" },
  { title: "Prompt-and-Pray", desc: "No evaluation harness, no regression tests, no observability. If you can't measure it, you can't improve it — and you can't trust it.", icon: "🙏" },
  { title: "RAG-as-a-Silver-Bullet", desc: "Throwing documents into a vector database and expecting accurate answers. Retrieval quality is only as good as your chunking, indexing, and re-ranking.", icon: "🔮" },
  { title: "Agent Sprawl", desc: "Autonomous agents calling other agents with no guardrails. One hallucinated tool call cascades into real-world consequences.", icon: "🤖" },
  { title: "Governance Afterthought", desc: "Shipping AI to production and worrying about safety, bias, and compliance later. Regulators won't wait for your next sprint.", icon: "⚖️" },
];

const aiStackLayers = [
  { label: "Application Layer", desc: "User-facing products — chat, copilots, search, automation", color: "#A78BFA", type: "build" as const, detail: "This is what users interact with. The UX should abstract away all AI complexity. Users shouldn't need to understand prompting — the application should handle that. The best AI products feel like magic, not a chatbot." },
  { label: "Orchestration Layer", desc: "Agents, chains, routing, tool use, memory management", color: "#8B5CF6", type: "build" as const, detail: "The brain of your AI system. This layer decides which model to call, what tools to invoke, how to decompose tasks, and when to ask for human input. Frameworks like LangGraph or custom orchestrators live here." },
  { label: "Retrieval Layer", desc: "Vector stores, knowledge graphs, re-ranking, hybrid search", color: "#7C3AED", type: "build" as const, detail: "RAG lives here. But good retrieval is more than a vector database — it's chunking strategy, metadata filtering, re-ranking models, hybrid search (BM25 + semantic), and knowing when retrieval isn't the right pattern at all." },
  { label: "Model Layer", desc: "Foundation models — proprietary APIs or self-hosted open-weight", color: "#6D28D9", type: "buy" as const, detail: "For most organizations, this is a buy decision. Proprietary API providers for convenience, open-weight models for control. The key decision: API vs. self-hosted. APIs are simpler; self-hosted gives you control, latency, and data sovereignty." },
  { label: "Infrastructure Layer", desc: "GPU compute, serving frameworks, model registries, caching", color: "#5B21B6", type: "buy" as const, detail: "Managed endpoints or self-hosted serving frameworks. GPU clusters or serverless inference. KV caching, prompt caching, and batching for cost optimization. Most teams should start with managed APIs and self-host only when economics or compliance demand it." },
  { label: "Evaluation & Observability", desc: "LLM-as-judge, regression suites, tracing, cost tracking", color: "#4C1D95", type: "build" as const, detail: "The most under-invested layer. Without eval, you're flying blind. LLM-as-judge for quality, deterministic tests for regressions, distributed tracing for debugging, and cost attribution per feature. If you skip this, nothing else matters." },
];

const modelTiers = [
  {
    tier: "Frontier",
    models: "Largest, most capable foundation models",
    color: "#A78BFA",
    useCase: "Complex reasoning, multi-step analysis, code generation, research",
    cost: "$$$",
    latency: "High",
    when: "When accuracy on hard tasks justifies cost. Strategy docs, complex code review, agentic workflows requiring planning.",
  },
  {
    tier: "Workhorse",
    models: "Mid-tier models optimized for cost and quality",
    color: "#8B5CF6",
    useCase: "Summarization, classification, structured extraction, chat",
    cost: "$$",
    latency: "Medium",
    when: "Default tier for most production traffic. Good enough for 80% of tasks at a fraction of frontier cost.",
  },
  {
    tier: "Speed",
    models: "Small, fast models for high-throughput tasks",
    color: "#7C3AED",
    useCase: "Routing, tagging, simple Q&A, real-time suggestions",
    cost: "$",
    latency: "Low",
    when: "High-throughput, latency-sensitive paths. Intent classification, guardrail checks, content filtering.",
  },
  {
    tier: "Specialized",
    models: "Fine-tuned models, embedding models, rerankers",
    color: "#6D28D9",
    useCase: "Domain-specific tasks, search, retrieval ranking",
    cost: "Varies",
    latency: "Varies",
    when: "When a general model consistently underperforms on your specific domain or task shape. Fine-tune only with good eval in place.",
  },
];

const ragComponents = [
  { step: "1", label: "Ingest", desc: "Documents are parsed, cleaned, and chunked. Chunk size and overlap matter more than most teams realize.", color: "#A78BFA" },
  { step: "2", label: "Embed", desc: "Chunks are converted to vectors using an embedding model. Choose the model based on your domain, not benchmarks.", color: "#8B5CF6" },
  { step: "3", label: "Index", desc: "Vectors stored in a vector database with metadata. Metadata filtering is your first line of precision — don't skip it.", color: "#7C3AED" },
  { step: "4", label: "Retrieve", desc: "Query is embedded and matched against the index. Hybrid search (BM25 + semantic) consistently outperforms pure vector search.", color: "#6D28D9" },
  { step: "5", label: "Re-rank", desc: "A cross-encoder or LLM re-ranks retrieved chunks by relevance. This single step can double your answer accuracy.", color: "#5B21B6" },
  { step: "6", label: "Generate", desc: "Top chunks are injected into the prompt as context. The LLM synthesizes the answer — cite your sources.", color: "#4C1D95" },
];

const agentPatterns = [
  {
    title: "ReAct (Reason + Act)",
    desc: "The model reasons about what to do, takes an action (tool call), observes the result, then reasons again. Simple, interpretable, and effective for single-agent tasks.",
    pros: ["Easy to debug", "Clear reasoning trace", "Well-understood pattern"],
    cons: ["Sequential — can be slow", "Single point of failure"],
  },
  {
    title: "Multi-Agent Orchestration",
    desc: "Specialized agents collaborate — one plans, one researches, one executes, one reviews. A supervisor routes tasks and aggregates results.",
    pros: ["Parallel execution", "Domain specialization", "Scalable complexity"],
    cons: ["Coordination overhead", "Harder to debug", "More failure modes"],
  },
  {
    title: "Human-in-the-Loop",
    desc: "The agent operates autonomously for low-risk actions but pauses for human approval on high-stakes decisions. The right default for production.",
    pros: ["Safety by design", "User trust", "Regulatory compliance"],
    cons: ["Increased latency", "Requires good UX for approvals"],
  },
];

const governancePillars = [
  { pillar: "Evaluation", desc: "Systematic measurement of model quality, accuracy, and regression detection before and after deployment.", icon: "📊", color: "#A78BFA" },
  { pillar: "Guardrails", desc: "Input/output filtering, content policy enforcement, PII detection, and prompt injection defense at the application boundary.", icon: "🛡️", color: "#8B5CF6" },
  { pillar: "Observability", desc: "End-to-end tracing of every LLM call — inputs, outputs, latency, cost, and token usage. You can't govern what you can't see.", icon: "🔍", color: "#7C3AED" },
  { pillar: "Access Control", desc: "Who can use which models, with what data, for what purpose. Role-based access, data classification, and audit trails.", icon: "🔐", color: "#6D28D9" },
];

const SLIDE_LABELS = ["", "Overview", "Pitfalls", "AI Stack", "Models", "RAG", "Agents", "Governance", "Summary", ""];

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

const GRADIENT = "from-violet-400 to-fuchsia-400";

function AIStackDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const connectorHeight = useTransform(scrollYProgress, [0, 0.5], ["0%", "100%"]);

  return (
    <div ref={ref} className="relative">
      <div className="absolute left-6 top-4 bottom-4 w-px hidden sm:block overflow-hidden">
        <motion.div
          className="w-full bg-linear-to-b from-violet-500/20 to-fuchsia-500/20"
          style={{ height: connectorHeight }}
        />
      </div>

      <div className="space-y-2">
        {aiStackLayers.map((layer, i) => (
          <div key={layer.label}>
            <motion.div
              className="flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 cursor-pointer relative"
              style={{
                borderColor: expandedLayer === i ? `${layer.color}40` : `${layer.color}20`,
                backgroundColor: expandedLayer === i ? `${layer.color}10` : `${layer.color}06`,
              }}
              initial={{ opacity: 0, x: layer.type === "build" ? -20 : 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => setExpandedLayer(expandedLayer === i ? null : i)}
            >
              <div
                className="shrink-0 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: layer.type === "build" ? `${layer.color}20` : "rgba(255,255,255,0.06)",
                  color: layer.type === "build" ? layer.color : "rgb(148,163,184)",
                }}
              >
                {layer.type}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-white">{layer.label}</h4>
                <p className="text-xs text-slate-400">{layer.desc}</p>
              </div>
              <svg className={`w-3 h-3 text-slate-600 transition-transform shrink-0 ${expandedLayer === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>

            <AnimatePresence>
              {expandedLayer === i && (
                <motion.div
                  className="px-4 py-3 ml-14"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs text-slate-400 leading-relaxed italic">{layer.detail}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelSelector() {
  const [active, setActive] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex gap-2 mb-6">
        {modelTiers.map((t, i) => (
          <motion.button
            key={t.tier}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium border transition-all duration-300 cursor-pointer"
            style={{
              borderColor: active === i ? `${t.color}60` : "rgba(255,255,255,0.08)",
              backgroundColor: active === i ? `${t.color}15` : "rgba(255,255,255,0.03)",
              color: active === i ? t.color : "rgb(148,163,184)",
            }}
            onClick={() => setActive(i)}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="block font-semibold text-sm mb-0.5" style={{ color: active === i ? t.color : "white" }}>
              {t.tier}
            </span>
            <span className="block text-[10px] opacity-70">{t.cost}</span>
          </motion.button>
        ))}
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 md:p-8 rounded-2xl bg-white/3 border border-white/8 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: modelTiers[active].color }}>
            {modelTiers[active].models}
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">{modelTiers[active].useCase}</p>

        <div className="mt-4 p-4 rounded-xl bg-white/3 border border-white/6">
          <p className="text-xs text-violet-400/70 uppercase tracking-widest font-semibold mb-2">When to use</p>
          <p className="text-sm text-slate-400 leading-relaxed">{modelTiers[active].when}</p>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Cost</span>
            <span className="text-xs font-semibold" style={{ color: modelTiers[active].color }}>{modelTiers[active].cost}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Latency</span>
            <span className="text-xs font-semibold" style={{ color: modelTiers[active].color }}>{modelTiers[active].latency}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RAGPipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="space-y-3">
      {ragComponents.map((step, i) => (
        <motion.div
          key={step.label}
          className="flex items-start gap-4 p-4 rounded-xl border backdrop-blur-sm"
          style={{
            borderColor: `${step.color}20`,
            backgroundColor: `${step.color}06`,
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: `${step.color}20`, color: step.color }}
          >
            {step.step}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">{step.label}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AgentPatterns() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const colors = ["#A78BFA", "#8B5CF6", "#7C3AED"];

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex gap-2 mb-6">
        {agentPatterns.map((p, i) => (
          <motion.button
            key={p.title}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium border transition-all duration-300 cursor-pointer"
            style={{
              borderColor: active === i ? `${colors[i]}60` : "rgba(255,255,255,0.08)",
              backgroundColor: active === i ? `${colors[i]}15` : "rgba(255,255,255,0.03)",
              color: active === i ? colors[i] : "rgb(148,163,184)",
            }}
            onClick={() => setActive(i)}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="block font-semibold text-[11px] leading-tight" style={{ color: active === i ? colors[i] : "white" }}>
              {p.title}
            </span>
          </motion.button>
        ))}
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 md:p-8 rounded-2xl bg-white/3 border border-white/8 backdrop-blur-sm"
      >
        <p className="text-sm text-slate-300 leading-relaxed mb-6">{agentPatterns[active].desc}</p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-emerald-400/70 uppercase tracking-widest font-semibold mb-3">Strengths</p>
            <ul className="space-y-2">
              {agentPatterns[active].pros.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs text-red-400/70 uppercase tracking-widest font-semibold mb-3">Trade-offs</p>
            <ul className="space-y-2">
              {agentPatterns[active].cons.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-red-400/70 mt-0.5 shrink-0">-</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Presentation
// ──────────────────────────────────────────────

export function AIArchitecturePresentation() {
  return (
    <SlideDeck slideCount={10} labels={SLIDE_LABELS} gradient="from-violet-400/60 via-purple-400/60 to-fuchsia-400/60">
      {/* Grain texture overlay */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-10 opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-ai">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-ai)" />
      </svg>

      {/* ═══════ Slide 0: HERO ═══════ */}
      <Slide index={0} variant="hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center"
        >
          <motion.p
            className="text-violet-400 text-sm font-medium tracking-widest uppercase mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Building Intelligent Systems
          </motion.p>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4">
            <span className="bg-linear-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI Architecture
            </span>
          </h1>

          <motion.p
            className="text-slate-500 text-lg md:text-xl tracking-wide max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            From model selection to agent orchestration — designing AI systems that actually work in production
          </motion.p>
        </motion.div>

        <motion.div
          className="absolute bottom-12 flex flex-col items-center gap-2 text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </Slide>

      {/* ═══════ Slide 1: Overview ═══════ */}
      <Slide index={1}>
        <PresentationSection eyebrow="Overview" title="Why AI Needs Architecture" gradient={GRADIENT}>
          <p className="text-xl text-slate-300 leading-relaxed font-light">
            Every organization is racing to ship AI. Most are building demos, not systems.
            AI architecture is the discipline of designing intelligent systems that are
            reliable, observable, governable, and cost-effective — not just impressive
            in a slide deck.
          </p>
          <InsightCallout gradient={GRADIENT}>
            The companies winning with AI aren&apos;t the ones with the best models.
            They&apos;re the ones with the best architecture around their models —
            evaluation, retrieval, guardrails, and orchestration.
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 2: Anti-patterns ═══════ */}
      <Slide index={2}>
        <PresentationSection eyebrow="Common Pitfalls" title="Patterns Worth Avoiding" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-8">
            Most AI setbacks aren&apos;t model problems — they&apos;re architecture problems.
            Recognizing these patterns early saves months of rework.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {aiAntiPatterns.map((item, i) => (
              <DiagramCard key={item.title} delay={i * 0.06}>
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </DiagramCard>
            ))}
          </div>
          <InsightCallout gradient={GRADIENT}>
            The single most common pattern: teams skip evaluation. Without an eval
            harness, every change is a gamble. You can&apos;t improve what you can&apos;t
            measure, and you can&apos;t trust what you haven&apos;t tested.
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 3: The AI Stack ═══════ */}
      <Slide index={3}>
        <PresentationSection eyebrow="The Stack" title="Anatomy of an AI System" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-4">
            A production AI system is six layers deep. The model is just one of them —
            and rarely the one that determines success or failure. Click any layer to explore.
          </p>
          <p className="text-slate-400 leading-relaxed mb-8">
            Build the layers that differentiate you. Buy the commodity infrastructure underneath.
          </p>
          <AIStackDiagram />
          <InsightCallout gradient={GRADIENT}>
            The evaluation and observability layer is the most under-invested layer in
            AI systems today. Teams will spend months fine-tuning prompts but won&apos;t
            spend a week building an eval suite. That ratio is backwards.
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 4: Model Selection ═══════ */}
      <Slide index={4}>
        <PresentationSection eyebrow="Model Strategy" title="Right Model, Right Task" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-8">
            There is no &quot;best model.&quot; There is only the best model for a given task,
            latency budget, and cost envelope. Smart architectures route dynamically
            across tiers — not everything needs frontier reasoning.
          </p>
          <ModelSelector />
          <InsightCallout gradient={GRADIENT}>
            The most cost-effective AI architectures use a routing layer — a small,
            fast model classifies the request and sends it to the appropriate tier.
            80% of traffic goes to the workhorse tier. Only 5-10% needs frontier.
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 5: RAG Architecture ═══════ */}
      <Slide index={5} variant="scrollable">
        <PresentationSection eyebrow="Retrieval" title="RAG Done Right" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-8">
            Retrieval-Augmented Generation is the most common production AI pattern —
            and the most commonly implemented poorly. Each step in the pipeline is
            an opportunity to improve or degrade answer quality.
          </p>
          <RAGPipeline />
          <InsightCallout gradient={GRADIENT}>
            Most RAG failures are retrieval failures, not generation failures. If the
            right context doesn&apos;t make it into the prompt, the best model in the world
            can&apos;t produce the right answer. Fix retrieval first.
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 6: Agent Patterns ═══════ */}
      <Slide index={6}>
        <PresentationSection eyebrow="Agents" title="Agentic Architecture Patterns" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-8">
            AI agents — systems that reason, plan, and take actions — are the next frontier.
            But autonomy without architecture is just chaos with a GPU. Choose the right
            pattern for your risk tolerance.
          </p>
          <AgentPatterns />
          <InsightCallout gradient={GRADIENT}>
            Start with human-in-the-loop. Always. Earn autonomy through demonstrated
            reliability — measured by your eval suite, not your intuition. The fastest
            way to kill an AI program is one bad autonomous action that hits production.
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 7: Governance ═══════ */}
      <Slide index={7}>
        <PresentationSection eyebrow="Governance" title="AI You Can Trust" gradient={GRADIENT}>
          <p className="text-slate-400 leading-relaxed mb-8">
            Governance isn&apos;t a tax on innovation — it&apos;s the foundation
            that lets you move fast without breaking things. These four pillars
            should be in place before your first production deployment.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {governancePillars.map((g, i) => (
              <DiagramCard key={g.pillar} delay={i * 0.08}>
                <div className="flex items-start gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border"
                    style={{ backgroundColor: `${g.color}15`, borderColor: `${g.color}30` }}
                    whileInView={{
                      scale: [1, 1.15, 1],
                    }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  >
                    {g.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">{g.pillar}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              </DiagramCard>
            ))}
          </div>
          <InsightCallout gradient={GRADIENT}>
            The EU AI Act, NIST AI RMF, and sector-specific regulations are no longer
            theoretical. Organizations without governance frameworks will face compliance
            walls that block deployment entirely — not just slow it down.
          </InsightCallout>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 8: Executive Summary ═══════ */}
      <Slide index={8}>
        <PresentationSection eyebrow="The Takeaway" title="For the Leadership Table" gradient={GRADIENT}>
          <div className="space-y-3">
            {[
              "AI is an architecture problem, not a model problem. The model is 10% of the system — retrieval, orchestration, evaluation, and guardrails are the other 90%.",
              "Route to the right model tier. Frontier reasoning for 5% of traffic, workhorse for 80%, speed tier for the rest. Your bill will thank you.",
              "Invest in evaluation before anything else. If you can't measure quality, you can't improve it, trust it, or govern it.",
              "Start agents with human-in-the-loop. Earn autonomy through demonstrated reliability, not ambition.",
              "Governance is a launch requirement, not a phase-two feature. Build it in from day one.",
            ].map((point, i) => (
              <DiagramCard key={i} delay={i * 0.06}>
                <p className="text-sm text-slate-300 leading-relaxed">{point}</p>
              </DiagramCard>
            ))}
          </div>
        </PresentationSection>
      </Slide>

      {/* ═══════ Slide 9: Closing ═══════ */}
      <Slide index={9}>
        <PresentationSection eyebrow="So What?" title="What to Do Monday Morning" gradient={GRADIENT}>
          <div className="space-y-3 mb-8">
            <DiagramCard delay={0}>
              <p className="text-sm text-slate-300 leading-relaxed">
                Build an eval suite for your highest-value AI use case. Ten golden
                examples, an LLM-as-judge scorer, and a CI pipeline that runs it
                on every prompt change. This alone puts you ahead of 90% of teams.
              </p>
            </DiagramCard>
            <DiagramCard delay={0.08}>
              <p className="text-sm text-slate-300 leading-relaxed">
                Audit your model spend. Classify every LLM call by tier and route
                accordingly. Most organizations are overspending 3-5x by sending
                simple tasks to frontier models.
              </p>
            </DiagramCard>
            <DiagramCard delay={0.16}>
              <p className="text-sm text-slate-300 leading-relaxed">
                Add guardrails and tracing to every production AI endpoint this week.
                Not next quarter. If an LLM call isn&apos;t traced, it doesn&apos;t
                exist — and you&apos;ll find out the hard way when something goes wrong.
              </p>
            </DiagramCard>
          </div>
          <TypewriterText
            text="The organizations that win with AI won't be the ones with the best models — they'll be the ones with the best architecture around their models."
            className="text-slate-600 text-sm tracking-wide italic text-center"
            speed={30}
          />
        </PresentationSection>
      </Slide>
    </SlideDeck>
  );
}
