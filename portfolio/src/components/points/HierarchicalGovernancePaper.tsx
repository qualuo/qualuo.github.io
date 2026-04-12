"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ScrollEssay } from "./shared/essay/ScrollEssay";
import { EssaySection } from "./shared/essay/EssaySection";
import { StickyDiagram } from "./shared/essay/StickyDiagram";
import { Callout } from "./shared/essay/Callout";
import { BeforeAfter } from "./shared/essay/BeforeAfter";
import { InteractiveWidget } from "./shared/essay/InteractiveWidget";
import { TypewriterText } from "./shared/TypewriterText";
import { DiagramCard } from "./shared/DiagramCard";
import { DrawSvg } from "./shared/DrawSvg";
import { InsightCallout } from "./shared/InsightCallout";
import { GovernancePyramidDiagram } from "./diagrams/GovernancePyramidDiagram";
import { GovernanceAuditDiagram } from "./diagrams/GovernanceAuditDiagram";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const GRADIENT = "from-amber-400 via-orange-400 to-red-400";

// ──────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────

const ICONS = {
  shield: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
  code: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  heart: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  store: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path d="M3 9l2.45-4.9A2 2 0 017.24 3h9.52a2 2 0 011.8 1.1L21 9" />
      <path d="M12 3v6" />
    </svg>
  ),
  book: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  sliders: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  wind: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 111.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1111 8H2" />
      <path d="M12.6 19.4A2 2 0 1014 16H2" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  bot: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M2 14h2" /><path d="M20 14h2" />
      <path d="M15 13v2" /><path d="M9 13v2" />
    </svg>
  ),
  swords: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" y1="14" x2="9" y2="18" />
      <line x1="7" y1="17" x2="4" y2="20" />
      <line x1="3" y1="19" x2="5" y2="21" />
    </svg>
  ),
};

// ──────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────

const DOMAINS = [
  {
    domain: "Military",
    icon: ICONS.swords,
    layers: [
      "Commander's intent",
      "Rules of engagement",
      "Standard operating procedures",
      "Tactical decisions in the field",
    ],
  },
  {
    domain: "Law",
    icon: ICONS.scale,
    layers: [
      "Constitutional rights",
      "Criminal statutes",
      "Precedent & regulation",
      "Judicial interpretation",
    ],
  },
  {
    domain: "Software",
    icon: ICONS.code,
    layers: [
      "Never lose user data",
      "CI gates, type systems",
      "Coding standards, linters",
      "Implementation & design",
    ],
  },
  {
    domain: "Parenting",
    icon: ICONS.heart,
    layers: [
      "Safety, kindness, honesty",
      "Car seats, locked cabinets",
      "Bedtime, homework first",
      "What to play, who to befriend",
    ],
  },
  {
    domain: "Franchises",
    icon: ICONS.store,
    layers: [
      "Brand promise, quality",
      "Food safety, financials",
      "Menu, decor, hours",
      "Local marketing, staffing",
    ],
  },
  {
    domain: "Religion",
    icon: ICONS.book,
    layers: [
      "Core tenets, commandments",
      "Canon law, dietary rules",
      "Liturgy, traditions",
      "Personal prayer, community",
    ],
  },
];

const LAYER_TAGS = [
  { label: "P", color: "239,68,68" },
  { label: "G", color: "249,115,22" },
  { label: "D", color: "96,165,250" },
  { label: "F", color: "34,197,94" },
];

const CLASSIFICATION_ITEMS = [
  { concern: "All code must be reviewed before merge", layer: 1, reason: "Automated in CI, hard block" },
  { concern: "We use TypeScript", layer: 2, reason: "Strong preference, overridable with justification" },
  { concern: "No deploys on Friday afternoon", layer: 2, reason: "Sensible default, override for hotfixes" },
  { concern: "User data encrypted at rest", layer: 0, reason: "Non-negotiable, zero tolerance" },
  { concern: "No single point of failure in prod", layer: 1, reason: "Automated redundancy checks" },
  { concern: "How to name variables", layer: 3, reason: "Judgment call, linter handles basics" },
  { concern: "No unauthorized access to PII", layer: 0, reason: "Constitutional, zero tolerance" },
  { concern: "Meetings start on time", layer: 2, reason: "Cultural norm, not enforced by system" },
];

const AUDIT_ACTIONS = [
  {
    icon: ICONS.target,
    title: "List your principles",
    body: "Write down 3\u20135 operational physics. If you have more than seven, you have a wish list. If fewer than two, you have vibes.",
  },
  {
    icon: ICONS.shield,
    title: "Map your guardrails",
    body: "For each guardrail: is it automated? If a human has to remember, it is a suggestion, not a guardrail.",
  },
  {
    icon: ICONS.sliders,
    title: "Classify your defaults",
    body: "Can someone override this without a committee? If not, it is a guardrail pretending to be a default.",
  },
  {
    icon: ICONS.wind,
    title: "Measure your freedom",
    body: "What percent of daily decisions need no permission? Below 70% means your stack is inverted.",
  },
  {
    icon: ICONS.calendar,
    title: "Schedule the review",
    body: "Quarterly: for every guardrail and default, ask if it should migrate down. Governance that only grows eventually kills.",
  },
];

// ──────────────────────────────────────────────
// Hero
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
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0) 70%)",
          scale: glowScale,
        }}
      />

      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative text-center max-w-2xl"
      >
        <motion.p
          className="text-orange-400/80 text-xs font-medium tracking-[0.3em] uppercase mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          A Point of View
        </motion.p>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-8 leading-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className={`bg-linear-to-r ${GRADIENT} bg-clip-text text-transparent`}>
            Hierarchical
          </span>
          <br />
          <span className={`bg-linear-to-r ${GRADIENT} bg-clip-text text-transparent`}>
            Governance
          </span>
        </motion.h1>

        <motion.p
          className="text-slate-400 text-base sm:text-lg md:text-xl leading-relaxed max-w-lg mx-auto font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Every organization runs on this framework.
          <br className="hidden sm:block" />{" "}
          Most just never name it.
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
// Classification test (interactive widget)
// ──────────────────────────────────────────────

function ClassificationTest() {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  return (
    <div className="space-y-2">
      {CLASSIFICATION_ITEMS.map((item, i) => {
        const isOpen = revealed.has(i);
        const tag = LAYER_TAGS[item.layer];
        return (
          <button
            type="button"
            key={item.concern}
            className="w-full text-left rounded-lg border border-white/6 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-3 sm:p-4 group"
            onClick={() => {
              setRevealed((prev) => {
                const next = new Set(prev);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                return next;
              });
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-200/90 leading-relaxed">{item.concern}</p>
              <motion.span
                className="shrink-0 text-[10px] font-bold rounded px-2 py-0.5"
                initial={false}
                animate={{
                  opacity: isOpen ? 1 : 0.3,
                  backgroundColor: isOpen ? `rgba(${tag.color}, 0.15)` : "rgba(255,255,255,0.04)",
                  color: isOpen ? `rgba(${tag.color}, 1)` : "rgba(255,255,255,0.3)",
                }}
                transition={{ duration: 0.3 }}
              >
                {isOpen
                  ? ["Principle", "Guardrail", "Default", "Freedom"][item.layer]
                  : "?"}
              </motion.span>
            </div>
            <motion.p
              className="text-xs text-slate-500 mt-1 overflow-hidden"
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            >
              {item.reason}
            </motion.p>
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Paper
// ──────────────────────────────────────────────

export function HierarchicalGovernancePaper() {
  return (
    <ScrollEssay gradient={GRADIENT}>
      <Hero />

      <Divider />

      {/* ═══════ Section 1: The Provocation ═══════ */}
      <EssaySection id="provocation" eyebrow="The Problem" title="You Don't Have a Rules Problem" gradient={GRADIENT}>
        <p className="text-slate-200/90 leading-relaxed text-lg mb-5">
          When something goes wrong, the instinct is to add a rule. A team makes a bad deployment? Add a
          change advisory board. An employee makes a poor judgment call? Write a new policy. A project goes over
          budget? Add another approval gate.
        </p>
        <p className="text-slate-300 leading-[1.8] mb-5">
          Each intervention is locally rational and collectively disastrous. Three years of &ldquo;learning
          from our mistakes&rdquo; produces an organization that cannot move. Not because the people changed,
          but because every failure left behind a new constraint and no one ever removes them.
        </p>
        <p className="text-slate-300 leading-[1.8] mb-8">
          The problem is never too few rules or too many. The problem is rules at the wrong layer. Governance
          is not a dial between strict and loose &mdash; it is a stack with four distinct layers, each with
          a fundamentally different purpose.
        </p>

        <Callout variant="insight">
          The sign of a well-governed system is not the absence of failure &mdash; it is the speed of recovery
          and the richness of adaptation. Bureaucracies optimize for preventing failure. High-performing
          systems optimize for enabling recovery.
        </Callout>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 2: The Four Layers (StickyDiagram) ═══════ */}
      <EssaySection id="framework-intro" eyebrow="The Framework" title="Four Layers of Governance" gradient={GRADIENT}>
        <p className="text-slate-300 leading-[1.8] mb-4">
          Every system of governance &mdash; whether named or not &mdash; operates across four layers. The
          framework applies to nations, companies, codebases, families, and AI agents. The question is never
          whether you have these layers. The question is whether you have calibrated them correctly.
        </p>
      </EssaySection>

      <StickyDiagram
        diagram={({ progress, activeStep, showAll }) => (
          <GovernancePyramidDiagram progress={progress} activeStep={activeStep} showAll={showAll} />
        )}
        steps={[
          {
            id: "stack-intro",
            label: "The Stack",
            content: (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Governance is a stack, not a switch</h3>
                <p className="text-slate-300 leading-[1.8]">
                  Every organization, team, and system has these four layers operating simultaneously. The difference
                  between bureaucracy and high performance is the ratio. Most organizations run it upside down &mdash;
                  thick guardrails and defaults, thin principles and freedom.
                </p>
              </div>
            ),
          },
          {
            id: "principles",
            label: "Principles",
            content: (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Principles: Physics, Not Rules</h3>
                <p className="text-slate-300 leading-[1.8] mb-4">
                  The 3&ndash;5 beliefs that are truly non-negotiable. Not aspirational values on a poster &mdash;
                  operational physics that constrain every decision. If you have more than seven, you don&apos;t
                  have principles &mdash; you have a wish list.
                </p>
                <Callout variant="tip">
                  Test: if a principle can be violated without someone getting fired or the system breaking,
                  it is not a principle. It is a preference wearing a costume.
                </Callout>
              </div>
            ),
          },
          {
            id: "guardrails",
            label: "Guardrails",
            content: (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Guardrails: Automated Hard Constraints</h3>
                <p className="text-slate-300 leading-[1.8] mb-4">
                  Constraints that prevent catastrophic outcomes. The key word is <em>automated</em>. A guardrail
                  you have to remember is not a guardrail &mdash; it is a suggestion. Database constraints,
                  circuit breakers, budget caps, compliance checks in CI. The best guardrails are invisible
                  until you hit them.
                </p>
                <Callout variant="note">
                  Guardrails should be boring. If your team regularly debates whether to bypass one, it is either
                  too aggressive or it is a default pretending to be a guardrail.
                </Callout>
              </div>
            ),
          },
          {
            id: "defaults",
            label: "Defaults",
            content: (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Defaults: Opinionated but Overridable</h3>
                <p className="text-slate-300 leading-[1.8]">
                  The right answer for 80% of cases. Coding standards, deployment processes, vendor preferences,
                  meeting cadences. Defaults reduce cognitive load enormously &mdash; you do not have to decide
                  everything from scratch. But the override mechanism is critical. A default without an escape
                  hatch is a guardrail. A guardrail without enforcement is a default.
                </p>
              </div>
            ),
          },
          {
            id: "freedom",
            label: "Freedom",
            content: (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Freedom: Judgment, Creativity, Adaptation</h3>
                <p className="text-slate-300 leading-[1.8] mb-4">
                  Everything not covered by the layers above. This should be the largest layer by far. Freedom
                  is where innovation happens, where people exercise judgment, where solutions emerge that no
                  one could have prescribed.
                </p>
                <Callout variant="insight">
                  The goal of governance is not to minimize freedom. It is to maximize the freedom you can safely grant.
                </Callout>
              </div>
            ),
          },
          {
            id: "shape",
            label: "The Shape",
            content: (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">The Shape Tells the Story</h3>
                <p className="text-slate-300 leading-[1.8]">
                  In a well-governed system, the stack looks like a wide-based triangle: few principles,
                  modest guardrails, sensible defaults, vast freedom. In a bureaucracy, it is an hourglass:
                  vague principles, massive guardrails, rigid defaults, minimal freedom. The audit is simple
                  &mdash; draw the shape of your organization&apos;s governance stack and see if it matches
                  what you intended.
                </p>
              </div>
            ),
          },
        ]}
      />

      <Divider />

      {/* ═══════ Section 3: Origin Story ═══════ */}
      <EssaySection id="origin" eyebrow="The Origin" title="It Started with a Race Condition" gradient={GRADIENT}>
        <p className="text-slate-200/90 leading-relaxed text-lg mb-5">
          Multiple AI agents writing to the same database. Two agents claim the same task. One silently overwrites
          the other. The instinct was binary: lock everything down (strict) or let agents figure it out (open).
        </p>
        <p className="text-slate-300 leading-[1.8] mb-5">
          Neither worked. The solution was layered. The <em>principle</em> was &ldquo;never corrupt user
          state.&rdquo; The <em>guardrail</em> was an atomic database operation &mdash; a single UPDATE with
          a WHERE clause that makes it physically impossible for two agents to claim the same task. The{" "}
          <em>default</em> was the single-writer pattern. The <em>freedom</em> was everything else &mdash;
          how agents decompose tasks, which tools they use, how they communicate.
        </p>

        <InsightCallout gradient="from-orange-400 to-amber-400">
          We did not need more rules or fewer rules. We needed the right rules at the right layer.
        </InsightCallout>

        <p className="text-slate-300 leading-[1.8] mt-6">
          This framework was not invented for this paper. It was discovered by trying to solve a real engineering
          problem and recognizing the pattern was universal.
        </p>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 4: Patterns Across Domains ═══════ */}
      <EssaySection id="domains" eyebrow="Universal Pattern" title="The Same Framework, Everywhere" gradient={GRADIENT} wide>
        <p className="text-slate-300 leading-[1.8] mb-8 max-w-3xl">
          The four layers manifest in every domain that coordinates human behavior at scale.
          The labels change. The structure never does.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {DOMAINS.map((d, i) => (
            <DiagramCard key={d.domain} delay={i * 0.05}>
              <div className="flex items-start gap-3">
                <div className="shrink-0 text-orange-400/70 mt-0.5">
                  <DrawSvg>{d.icon as React.ReactElement}</DrawSvg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/90 mb-2">{d.domain}</p>
                  <div className="space-y-1">
                    {d.layers.map((text, j) => (
                      <div key={text} className="flex items-start gap-2">
                        <span
                          className="shrink-0 text-[9px] font-bold rounded px-1.5 py-px mt-px"
                          style={{
                            backgroundColor: `rgba(${LAYER_TAGS[j].color}, 0.12)`,
                            color: `rgba(${LAYER_TAGS[j].color}, 0.8)`,
                          }}
                        >
                          {LAYER_TAGS[j].label}
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DiagramCard>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-8">
          <Callout variant="insight">
            The healthy pattern is always the same: strong, few principles. Automated, invisible guardrails.
            Sensible, overridable defaults. Vast freedom for adaptation. The dysfunctional pattern is also
            the same: vague principles, manual guardrails, rigid defaults, suppressed freedom.
          </Callout>
        </div>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 5: The Pathology ═══════ */}
      <EssaySection id="pathology" eyebrow="The Diagnosis" title="Where Organizations Go Wrong" gradient={GRADIENT}>
        <p className="text-slate-300 leading-[1.8] mb-8">
          Most organizations over-index on the middle two layers and under-invest in the outer two.
          You end up with bureaucracy that is slow <em>and</em> mediocre &mdash; the worst of both worlds.
        </p>

        <BeforeAfter
          beforeLabel="Bureaucratic"
          afterLabel="High-Performing"
          before={
            <div className="space-y-3">
              {[
                { tag: 0, text: "Vague aspirational values nobody references in decisions" },
                { tag: 1, text: "Massive manual approval chains \u2014 14 people must sign off" },
                { tag: 2, text: "Rigid processes that require a committee to override" },
                { tag: 3, text: "Nearly zero \u2014 every decision requires permission" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2">
                  <span className="shrink-0 text-[9px] font-bold rounded px-1.5 py-px mt-1"
                    style={{
                      backgroundColor: `rgba(${LAYER_TAGS[item.tag].color}, 0.12)`,
                      color: `rgba(${LAYER_TAGS[item.tag].color}, 0.7)`,
                    }}
                  >
                    {LAYER_TAGS[item.tag].label}
                  </span>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
                </div>
              ))}
              <p className="text-xs text-red-400/60 font-medium pt-2 border-t border-white/5">
                Result: slow AND mediocre
              </p>
            </div>
          }
          after={
            <div className="space-y-3">
              {[
                { tag: 0, text: "3\u20135 operational physics, known by everyone, referenced daily" },
                { tag: 1, text: "Automated and invisible \u2014 you hit them only when something is truly wrong" },
                { tag: 2, text: "Opinionated with a documented override path \u2014 5 minutes, not 5 meetings" },
                { tag: 3, text: "80%+ of decisions made by the person closest to the problem" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2">
                  <span className="shrink-0 text-[9px] font-bold rounded px-1.5 py-px mt-1"
                    style={{
                      backgroundColor: `rgba(${LAYER_TAGS[item.tag].color}, 0.12)`,
                      color: `rgba(${LAYER_TAGS[item.tag].color}, 0.7)`,
                    }}
                  >
                    {LAYER_TAGS[item.tag].label}
                  </span>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
                </div>
              ))}
              <p className="text-xs text-emerald-400/60 font-medium pt-2 border-t border-white/5">
                Result: fast AND excellent
              </p>
            </div>
          }
        />

        <div className="mt-8">
          <Callout variant="warning">
            The transition is not about removing governance. It is about moving governance <em>up</em> the
            stack &mdash; from manual checkpoints to automated guardrails, from rigid defaults to clear principles.
          </Callout>
        </div>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 6: Classification ═══════ */}
      <EssaySection id="calibration" eyebrow="The Hard Part" title="Knowing Which Layer" gradient={GRADIENT}>
        <p className="text-slate-300 leading-[1.8] mb-6">
          The most common failure is putting a concern at the wrong layer: treating a preference as a principle,
          treating a default as a guardrail, treating a principle as something overridable. Tap each item
          to reveal which layer it belongs to.
        </p>

        <InteractiveWidget title="Layer Classification" hint="Tap to reveal">
          <ClassificationTest />
        </InteractiveWidget>

        <div className="mt-6">
          <Callout variant="insight">
            Classification is context-dependent. &ldquo;No Friday deploys&rdquo; is a default at a startup
            and a guardrail at a bank. The framework does not give you the answer &mdash; it gives you the
            right question: at which layer should this concern live <em>for our context</em>?
          </Callout>
        </div>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 7: Governance Dynamics (StickyDiagram #2) ═══════ */}
      <EssaySection id="dynamics-intro" eyebrow="Dynamics" title="How Governance Evolves" gradient={GRADIENT}>
        <p className="text-slate-300 leading-[1.8] mb-4">
          Governance is not static. Concerns migrate between layers as organizations mature, as trust is
          established, and as context changes. Understanding the migration patterns is as important as
          understanding the layers themselves.
        </p>
      </EssaySection>

      <StickyDiagram
        flipped
        diagram={({ progress, activeStep, showAll }) => (
          <GovernanceAuditDiagram progress={progress} activeStep={activeStep} showAll={showAll} />
        )}
        steps={[
          {
            id: "trust-cycle",
            label: "Trust",
            content: (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">The Trust Cycle</h3>
                <p className="text-slate-300 leading-[1.8]">
                  As teams demonstrate competence and alignment with principles, governance migrates down
                  the stack. What was a guardrail becomes a default. What was a default becomes freedom.
                  This is how high-trust organizations are built &mdash; through demonstrated reliability,
                  not fiat.
                </p>
              </div>
            ),
          },
          {
            id: "incident-response",
            label: "Incidents",
            content: (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">The Incident Response</h3>
                <p className="text-slate-300 leading-[1.8] mb-4">
                  When something breaks, governance temporarily tightens. Freedoms become defaults, defaults
                  become guardrails. This is natural and necessary. The problem is never the tightening &mdash;
                  it is the failure to loosen afterward.
                </p>
                <Callout variant="warning">
                  Does your organization have a process for <em>removing</em> rules? If not, your governance
                  stack is a one-way ratchet.
                </Callout>
              </div>
            ),
          },
          {
            id: "ratchet-trap",
            label: "Ratchet",
            content: (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Death by a Thousand Policies</h3>
                <p className="text-slate-300 leading-[1.8]">
                  Each individual rule addition is sensible. The trend is catastrophic. Over three to five years,
                  the freedom layer shrinks to near-zero. Every decision requires approval. Every initiative
                  requires a committee. The people who could innovate leave. The people who remain optimize
                  for compliance, not outcomes.
                </p>
              </div>
            ),
          },
          {
            id: "healthy-equilibrium",
            label: "Equilibrium",
            content: (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Governance Reviews: The Missing Practice</h3>
                <p className="text-slate-300 leading-[1.8]">
                  The antidote is the governance review &mdash; a scheduled, recurring practice where the team
                  examines every guardrail and default and asks: should this migrate down? Should this default
                  become freedom? The best organizations do this quarterly. They treat governance as a living
                  system, not a monotonically growing rulebook.
                </p>
              </div>
            ),
          },
        ]}
      />

      <Divider />

      {/* ═══════ Section 8: AI Connection ═══════ */}
      <EssaySection id="ai-connection" eyebrow="Applied" title="Why This Matters for AI Systems" gradient={GRADIENT}>
        <p className="text-slate-200/90 leading-relaxed text-lg mb-5">
          AI agent orchestration is a governance problem at machine speed. When you run 50 agents concurrently,
          you need all four layers operating automatically.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          <DiagramCard delay={0}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 text-red-400/70 mt-0.5">
                <DrawSvg>{ICONS.bot as React.ReactElement}</DrawSvg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90 mb-1.5">Over-Constrained Agent</p>
                <ul className="space-y-1 text-xs text-slate-400">
                  <li>Every action needs human approval</li>
                  <li>Rigid task templates, no adaptation</li>
                  <li>10x slower than doing it yourself</li>
                  <li>Agents are expensive assistants</li>
                </ul>
              </div>
            </div>
          </DiagramCard>
          <DiagramCard delay={0.08}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 text-emerald-400/70 mt-0.5">
                <DrawSvg>{ICONS.bot as React.ReactElement}</DrawSvg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90 mb-1.5">Well-Governed Agent</p>
                <ul className="space-y-1 text-xs text-slate-400">
                  <li>Principles: never take irreversible actions</li>
                  <li>Guardrails: token budgets, output validation</li>
                  <li>Defaults: model selection, logging patterns</li>
                  <li>Freedom: task approach, tool choice, output format</li>
                </ul>
              </div>
            </div>
          </DiagramCard>
        </div>

        <Callout variant="insight">
          If your organization cannot articulate its principles, guardrails, defaults, and freedoms for
          <em> human</em> decision-making, it has no hope of doing it for autonomous agents.
        </Callout>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 9: The Audit ═══════ */}
      <EssaySection id="audit" eyebrow="Your Turn" title="Audit Your Own Organization" gradient={GRADIENT}>
        <p className="text-slate-300 leading-[1.8] mb-8">
          Five steps. Do them with your team, not to your team.
        </p>

        <div className="space-y-3">
          {AUDIT_ACTIONS.map((action, i) => (
            <DiagramCard key={action.title} delay={i * 0.06}>
              <div className="flex items-start gap-3">
                <div className="shrink-0 text-orange-400/70 mt-0.5">
                  <DrawSvg>{action.icon as React.ReactElement}</DrawSvg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/90 mb-1">
                    <span className="text-orange-400/50 font-mono mr-1.5">{i + 1}.</span>
                    {action.title}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">{action.body}</p>
                </div>
              </div>
            </DiagramCard>
          ))}
        </div>

        <div className="mt-8">
          <Callout variant="tip">
            The people closest to the work have the best intuition about which constraints protect them and
            which suffocate them. Their input is not optional.
          </Callout>
        </div>
      </EssaySection>

      <Divider />

      {/* ═══════ Section 10: Closing ═══════ */}
      <EssaySection id="closing" eyebrow="The Point" title="Governance Is Architecture" gradient={GRADIENT}>
        <p className="text-slate-300 leading-[1.8] mb-8">
          Governance is not bureaucracy. Governance is architecture &mdash; the deliberate design of constraints
          and freedoms that enable a system to achieve its purpose. The framework is simple: few principles,
          automated guardrails, opinionated defaults, vast freedom. The practice is hard: knowing which layer,
          when to tighten, when to loosen, and having the discipline to review regularly.
        </p>

        <div className="border-l-2 border-orange-400/20 pl-5 py-2">
          <TypewriterText
            text="The organizations that thrive will not be the ones with the fewest rules or the most rules — they will be the ones that put each rule at the right layer."
            className="text-lg sm:text-xl font-light text-slate-200/80 leading-relaxed italic"
            speed={25}
          />
        </div>
      </EssaySection>

      <div className="pb-32" />
    </ScrollEssay>
  );
}
