"use client";

import { motion, AnimatePresence, useTransform, type MotionValue } from "framer-motion";

interface AgentOrchestrationDiagramProps {
  progress: MotionValue<number>;
  activeStep: number;
}

const BASE = "196,181,253";
const ACCENT = "167,139,250";
const DEEP = "139,92,246";
const HUMAN = "251,191,36";
const GREEN = "34,197,94";

const TRANSITION = {
  initial: { opacity: 0, scale: 0.92, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.95, filter: "blur(4px)" },
  transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
};

/** Pulsing dot on a connection line */
function PulseDot({ cx, cy, color, delay = 0 }: { cx: number; cy: number; color: string; delay?: number }) {
  return (
    <motion.circle
      cx={cx} cy={cy} r={2}
      fill={`rgba(${color}, 0.8)`}
      animate={{
        r: [2, 4, 2],
        opacity: [0.8, 0.3, 0.8],
      }}
      transition={{ duration: 1.5, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

/** Traveling dot along a line */
function TravelDot({
  x1, y1, x2, y2, color, delay = 0, dur = 2,
}: {
  x1: number; y1: number; x2: number; y2: number; color: string; delay?: number; dur?: number;
}) {
  return (
    <motion.circle
      r={2}
      fill={`rgba(${color}, 0.6)`}
      animate={{
        cx: [x1, x2],
        cy: [y1, y2],
        opacity: [0, 0.8, 0.8, 0],
      }}
      transition={{ duration: dur, repeat: Infinity, delay, ease: "linear" }}
    />
  );
}

/** Step 0: ReAct with tool calls and memory */
function ReActLoop() {
  const tools = [
    { label: "Search", x: 340, y: 28 },
    { label: "Code", x: 340, y: 68 },
    { label: "API", x: 340, y: 108 },
  ];

  return (
    <g>
      {/* LLM brain — central */}
      <rect x={140} y={55} width={90} height={50} rx={14}
        fill={`rgba(${BASE}, 0.12)`} stroke={`rgba(${BASE}, 0.45)`} strokeWidth={1.5} />
      <text x={185} y={75} textAnchor="middle" fill={`rgba(${BASE}, 1)`}
        fontSize={10} fontWeight={700} fontFamily="system-ui, sans-serif" letterSpacing={1}>LLM</text>
      <text x={185} y={92} textAnchor="middle" fill={`rgba(${BASE}, 0.55)`}
        fontSize={8} fontFamily="system-ui, sans-serif">Reason</text>

      {/* Act node */}
      <rect x={260} y={55} width={60} height={50} rx={10}
        fill={`rgba(${ACCENT}, 0.08)`} stroke={`rgba(${ACCENT}, 0.35)`} strokeWidth={1} />
      <text x={290} y={84} textAnchor="middle" fill={`rgba(${ACCENT}, 1)`}
        fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">Act</text>

      {/* Tool call branches */}
      {tools.map((t) => (
        <g key={t.label}>
          <rect x={t.x} y={t.y} width={52} height={24} rx={6}
            fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
          <text x={t.x + 26} y={t.y + 16} textAnchor="middle"
            fill="rgba(255,255,255,0.65)" fontSize={9} fontWeight={500} fontFamily="system-ui, sans-serif">
            {t.label}
          </text>
          <line x1={320} y1={80} x2={t.x} y2={t.y + 12}
            stroke={`rgba(${ACCENT}, 0.15)`} strokeWidth={0.75} strokeDasharray="2 3" />
        </g>
      ))}

      {/* Observe node */}
      <rect x={200} y={135} width={80} height={38} rx={10}
        fill={`rgba(${DEEP}, 0.08)`} stroke={`rgba(${DEEP}, 0.35)`} strokeWidth={1} />
      <text x={240} y={159} textAnchor="middle" fill={`rgba(${DEEP}, 1)`}
        fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">Observe</text>

      {/* Memory sidebar */}
      <rect x={50} y={55} width={60} height={118} rx={10}
        fill={`rgba(${ACCENT}, 0.05)`} stroke={`rgba(${ACCENT}, 0.18)`} strokeWidth={0.75} />
      <text x={80} y={74} textAnchor="middle" fill={`rgba(${ACCENT}, 0.7)`}
        fontSize={8} fontWeight={600} fontFamily="system-ui, sans-serif" letterSpacing={0.5}>MEMORY</text>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={58} y={84 + i * 18} width={44} height={10} rx={3}
          fill={`rgba(${ACCENT}, ${0.12 - i * 0.025})`} />
      ))}

      {/* Arrows: LLM → Act */}
      <line x1={230} y1={80} x2={258} y2={80}
        stroke={`rgba(${BASE}, 0.35)`} strokeWidth={1.5} markerEnd="url(#agentArrow)" />
      {/* Act → Observe */}
      <line x1={290} y1={105} x2={260} y2={133}
        stroke={`rgba(${ACCENT}, 0.3)`} strokeWidth={1.5} markerEnd="url(#agentArrow)" />
      {/* Observe → LLM */}
      <path d="M 200 154 Q 140 154 140 107" fill="none"
        stroke={`rgba(${DEEP}, 0.3)`} strokeWidth={1.5} markerEnd="url(#agentArrow)" />
      {/* LLM ↔ Memory */}
      <line x1={140} y1={80} x2={112} y2={80}
        stroke={`rgba(${ACCENT}, 0.18)`} strokeWidth={1} strokeDasharray="3 3" />

      {/* Animated flow dots around the loop */}
      <TravelDot x1={230} y1={80} x2={258} y2={80} color={BASE} delay={0} dur={1.5} />
      <TravelDot x1={290} y1={105} x2={260} y2={133} color={ACCENT} delay={0.5} dur={1.5} />
      <TravelDot x1={200} y1={154} x2={140} y2={107} color={DEEP} delay={1} dur={1.5} />
      <PulseDot cx={185} cy={80} color={BASE} delay={0} />
      <PulseDot cx={290} cy={80} color={ACCENT} delay={0.5} />
      <PulseDot cx={240} cy={154} color={DEEP} delay={1} />

      <text x={230} y={200} textAnchor="middle" fill={`rgba(${BASE}, 0.4)`}
        fontSize={9} fontWeight={600} letterSpacing={2} fontFamily="system-ui, sans-serif">
        REACT + TOOL USE
      </text>
    </g>
  );
}

/** Step 1: Multi-agent — coordinator delegates to specialized agents */
function MultiAgent() {
  const agents = [
    { label: "Planner", role: "Breaks down tasks", x: 55, y: 90 },
    { label: "Researcher", role: "Gathers information", x: 175, y: 90 },
    { label: "Executor", role: "Takes action", x: 295, y: 90 },
  ];

  return (
    <g>
      {/* Coordinator */}
      <rect x={115} y={16} width={190} height={44} rx={14}
        fill={`rgba(${DEEP}, 0.14)`} stroke={`rgba(${DEEP}, 0.5)`} strokeWidth={1.5} />
      <text x={210} y={35} textAnchor="middle" fill={`rgba(${BASE}, 1)`}
        fontSize={13} fontWeight={700} fontFamily="system-ui, sans-serif">Coordinator</text>
      <text x={210} y={50} textAnchor="middle" fill={`rgba(${BASE}, 0.5)`}
        fontSize={8} fontFamily="system-ui, sans-serif">Assigns &amp; prioritizes</text>

      {/* Delegation arrows + agent cards */}
      {agents.map((a) => (
        <g key={a.label}>
          <line x1={210} y1={60} x2={a.x + 45} y2={a.y}
            stroke={`rgba(${DEEP}, 0.25)`} strokeWidth={1.2} markerEnd="url(#agentArrow)" />
          <rect x={a.x} y={a.y} width={90} height={50} rx={12}
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth={0.75} />
          <text x={a.x + 45} y={a.y + 22} textAnchor="middle"
            fill="rgba(255,255,255,0.9)" fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">
            {a.label}
          </text>
          <text x={a.x + 45} y={a.y + 38} textAnchor="middle"
            fill="rgba(255,255,255,0.4)" fontSize={8} fontFamily="system-ui, sans-serif">
            {a.role}
          </text>
        </g>
      ))}

      {/* Reviewer receives output */}
      <rect x={140} y={160} width={140} height={36} rx={10}
        fill={`rgba(${GREEN}, 0.06)`} stroke={`rgba(${GREEN}, 0.25)`} strokeWidth={0.75} />
      <text x={210} y={175} textAnchor="middle" fill={`rgba(${GREEN}, 0.85)`}
        fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">Reviewer</text>
      <text x={210} y={188} textAnchor="middle" fill={`rgba(${GREEN}, 0.45)`}
        fontSize={7} fontFamily="system-ui, sans-serif">Validates &amp; synthesizes</text>

      {/* Results flow to reviewer */}
      {agents.map((a) => (
        <line key={`r-${a.label}`} x1={a.x + 45} y1={a.y + 50} x2={210} y2={158}
          stroke={`rgba(${GREEN}, 0.15)`} strokeWidth={0.75} strokeDasharray="3 3" />
      ))}

      {/* Animated delegation + result dots */}
      {agents.map((a, i) => (
        <TravelDot key={`td-${a.label}`}
          x1={210} y1={60} x2={a.x + 45} y2={a.y}
          color={DEEP} delay={i * 0.4} dur={1.5} />
      ))}
      {agents.map((a, i) => (
        <TravelDot key={`tr-${a.label}`}
          x1={a.x + 45} y1={a.y + 50} x2={210} y2={158}
          color={GREEN} delay={i * 0.3 + 0.8} dur={1.8} />
      ))}
      <PulseDot cx={210} cy={38} color={DEEP} delay={0} />

      <text x={210} y={210} textAnchor="middle" fill={`rgba(${BASE}, 0.4)`}
        fontSize={9} fontWeight={600} letterSpacing={2} fontFamily="system-ui, sans-serif">
        MULTI-AGENT ORCHESTRATION
      </text>
    </g>
  );
}

/** Step 2: Human-in-the-loop with confidence routing */
function HumanInLoop() {
  return (
    <g>
      {/* Agent */}
      <rect x={30} y={72} width={80} height={44} rx={12}
        fill={`rgba(${ACCENT}, 0.1)`} stroke={`rgba(${ACCENT}, 0.4)`} strokeWidth={1} />
      <text x={70} y={99} textAnchor="middle" fill={`rgba(${BASE}, 1)`}
        fontSize={13} fontWeight={600} fontFamily="system-ui, sans-serif">Agent</text>

      {/* Arrow to confidence */}
      <line x1={110} y1={94} x2={143} y2={94}
        stroke={`rgba(${ACCENT}, 0.3)`} strokeWidth={1.5} markerEnd="url(#agentArrow)" />

      {/* Confidence scorer — diamond shape via rotated rect */}
      <g transform="translate(170, 94)">
        <rect x={-22} y={-22} width={44} height={44} rx={6}
          fill={`rgba(${ACCENT}, 0.08)`} stroke={`rgba(${ACCENT}, 0.35)`} strokeWidth={1}
          transform="rotate(45)" />
        <text x={0} y={-4} textAnchor="middle" fill={`rgba(${BASE}, 0.7)`}
          fontSize={7} fontWeight={700} fontFamily="system-ui, sans-serif">CONF</text>
        <text x={0} y={8} textAnchor="middle" fill={`rgba(${BASE}, 0.9)`}
          fontSize={9} fontWeight={600} fontFamily="system-ui, sans-serif">Score</text>
      </g>

      {/* High confidence path — auto approve (top) */}
      <line x1={200} y1={72} x2={268} y2={48}
        stroke={`rgba(${GREEN}, 0.3)`} strokeWidth={1.5} markerEnd="url(#agentArrow)" />
      <rect x={270} y={30} width={90} height={36} rx={10}
        fill={`rgba(${GREEN}, 0.06)`} stroke={`rgba(${GREEN}, 0.25)`} strokeWidth={1} />
      <text x={315} y={46} textAnchor="middle" fill={`rgba(${GREEN}, 0.9)`}
        fontSize={7} fontWeight={700} fontFamily="system-ui, sans-serif" letterSpacing={0.5}>AUTO-APPROVE</text>
      <text x={315} y={59} textAnchor="middle" fill={`rgba(${GREEN}, 0.6)`}
        fontSize={8} fontFamily="system-ui, sans-serif">&gt; 0.9 confidence</text>

      {/* Low confidence path — human review (bottom) */}
      <line x1={200} y1={116} x2={268} y2={140}
        stroke={`rgba(${HUMAN}, 0.3)`} strokeWidth={1.5} markerEnd="url(#agentArrow)" />
      <rect x={270} y={122} width={90} height={36} rx={10}
        fill={`rgba(${HUMAN}, 0.06)`} stroke={`rgba(${HUMAN}, 0.35)`} strokeWidth={1.5} />
      <text x={315} y={138} textAnchor="middle" fill={`rgba(${HUMAN}, 1)`}
        fontSize={7} fontWeight={700} fontFamily="system-ui, sans-serif" letterSpacing={0.5}>HUMAN REVIEW</text>
      <text x={315} y={151} textAnchor="middle" fill={`rgba(${HUMAN}, 0.6)`}
        fontSize={8} fontFamily="system-ui, sans-serif">&lt; 0.9 confidence</text>

      {/* Both paths merge to Execute */}
      <line x1={360} y1={48} x2={388} y2={80}
        stroke={`rgba(${GREEN}, 0.2)`} strokeWidth={1} markerEnd="url(#agentArrow)" />
      <line x1={360} y1={140} x2={388} y2={108}
        stroke={`rgba(${HUMAN}, 0.2)`} strokeWidth={1} markerEnd="url(#agentArrow)" />
      <rect x={390} y={72} width={60} height={44} rx={10}
        fill={`rgba(${DEEP}, 0.1)`} stroke={`rgba(${DEEP}, 0.4)`} strokeWidth={1} />
      <text x={420} y={99} textAnchor="middle" fill={`rgba(${BASE}, 1)`}
        fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">Execute</text>

      {/* Audit log */}
      <rect x={390} y={135} width={60} height={22} rx={6}
        fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
      <text x={420} y={149} textAnchor="middle" fill="rgba(255,255,255,0.35)"
        fontSize={7} fontWeight={600} fontFamily="system-ui, sans-serif">AUDIT LOG</text>
      <line x1={420} y1={116} x2={420} y2={133}
        stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} strokeDasharray="2 2" />

      {/* Confidence routing flow */}
      <TravelDot x1={110} y1={94} x2={143} y2={94} color={ACCENT} delay={0} dur={1.2} />
      <TravelDot x1={200} y1={72} x2={268} y2={48} color={GREEN} delay={0.6} dur={1.5} />
      <TravelDot x1={200} y1={116} x2={268} y2={140} color={HUMAN} delay={0.9} dur={1.5} />
      <PulseDot cx={170} cy={94} color={ACCENT} delay={0} />
      <PulseDot cx={315} cy={48} color={GREEN} delay={0.3} />
      <PulseDot cx={315} cy={140} color={HUMAN} delay={0.6} />

      <text x={245} y={195} textAnchor="middle" fill={`rgba(${BASE}, 0.4)`}
        fontSize={9} fontWeight={600} letterSpacing={2} fontFamily="system-ui, sans-serif">
        CONFIDENCE-GATED EXECUTION
      </text>
    </g>
  );
}

export function AgentOrchestrationDiagram({ progress, activeStep }: AgentOrchestrationDiagramProps) {
  const initialOpacity = useTransform(progress, [0, 0.06], [1, 1]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.svg
        viewBox="0 0 470 220"
        className="w-full h-full max-h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible", opacity: initialOpacity }}
      >
        <defs>
          <marker id="agentArrow" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill={`rgba(${ACCENT}, 0.5)`} />
          </marker>
        </defs>

        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.g key="react" {...TRANSITION}><ReActLoop /></motion.g>
          )}
          {activeStep === 1 && (
            <motion.g key="multi" {...TRANSITION}><MultiAgent /></motion.g>
          )}
          {activeStep === 2 && (
            <motion.g key="human" {...TRANSITION}><HumanInLoop /></motion.g>
          )}
        </AnimatePresence>
      </motion.svg>
    </div>
  );
}
