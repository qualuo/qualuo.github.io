"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { demos, Demo, DemoCategory, DEMO_CATEGORIES } from "@/lib/demos";
import { WaveDivider } from "@/components/animations/WaveDivider";
import { Navbar } from "@/components/layout/Navbar";

const StarsBackground = dynamic(
  () => import("@/components/animations/StarsBackground").then(m => ({ default: m.StarsBackground })),
  { ssr: false }
);

/* ── Glow colors (RGB per demo) ──────────────────────────────── */

const DEMO_GLOW: Record<string, string> = {
  "local-llm-chat": "20,184,166",
  "voice-chat": "167,139,250",
  "document-rag": "244,63,94",
  "music-generation": "236,72,153",
  "ml-playground": "139,92,246",
  "type-experiments": "148,163,184",
  "particle-playground": "167,139,250",
  "3d-sandbox": "245,158,11",
  "neural-forward-pass": "217,70,239",
  "million-points": "249,115,22",
};

/* ── Drawn Icons (stroke-based, white on gradient) ───────────── */

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const DEMO_ICONS: Record<string, React.ReactNode> = {
  "local-llm-chat": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M12 5v13" />
    </svg>
  ),
  "voice-chat": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  "document-rag": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <circle cx="11.5" cy="14.5" r="2.5" />
      <path d="M13.3 16.3 15 18" />
    </svg>
  ),
  "music-generation": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  "ml-playground": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <circle cx="4" cy="8" r="1.5" />
      <circle cx="4" cy="16" r="1.5" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
      <circle cx="20" cy="8" r="1.5" />
      <circle cx="20" cy="16" r="1.5" />
      <path d="M5.5 8l5 -2.5" /><path d="M5.5 8l5 4" /><path d="M5.5 8l5 11" />
      <path d="M5.5 16l5 -10.5" /><path d="M5.5 16l5 -3.5" /><path d="M5.5 16l5 3.5" />
      <path d="M13.5 5l5 3.5" /><path d="M13.5 5l5 11.5" />
      <path d="M13.5 12l5 -3.5" /><path d="M13.5 12l5 4.5" />
      <path d="M13.5 19l5 -10.5" /><path d="M13.5 19l5 -2.5" />
    </svg>
  ),
  "type-experiments": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  "particle-playground": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <path d="M12 3a14.05 14.05 0 0 0 0 18" />
      <path d="M12 3a14.05 14.05 0 0 1 0 18" />
      <path d="M3 12h18" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  "3d-sandbox": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),
  "shader-gallery": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <path d="M12 3 2 21h20Z" />
      <path d="m1 13 6-1" />
      <path d="m16.5 10 6.5-4" />
      <path d="m16.5 13 6.5 0" />
      <path d="m16.5 16 6.5 4" />
    </svg>
  ),
  "audio-visualizer": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <path d="M2 10v3" />
      <path d="M6 6v11" />
      <path d="M10 3v18" />
      <path d="M14 8v7" />
      <path d="M18 5v13" />
      <path d="M22 10v3" />
    </svg>
  ),
  "generative-art": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <path d="M12 3v5" />
      <path d="m9 10 3-2 3 2" />
      <path d="M12 22c4.2 0 7-1.667 7-5-4.2 0-7-1.667-7-5-4.2 0-7-1.667-7-5" />
      <path d="M12 22c-4.2 0-7-1.667-7-5 4.2 0 7-1.667 7-5 4.2 0 7-1.667 7-5" />
    </svg>
  ),
  "neural-forward-pass": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <circle cx="4" cy="6" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="4" cy="18" r="1.5" />
      <circle cx="12" cy="8" r="1.5" />
      <circle cx="12" cy="16" r="1.5" />
      <circle cx="20" cy="12" r="1.5" />
      <path d="M5.5 6l5 2" /><path d="M5.5 6l5 10" />
      <path d="M5.5 12l5 -4" /><path d="M5.5 12l5 4" />
      <path d="M5.5 18l5 -10" /><path d="M5.5 18l5 -2" />
      <path d="M13.5 8l5 4" /><path d="M13.5 16l5 -4" />
    </svg>
  ),
  "million-points": (
    <svg className="w-8 h-8" viewBox="0 0 24 24" {...S}>
      <circle cx="4" cy="4" r="0.8" /><circle cx="8" cy="3" r="0.6" />
      <circle cx="12" cy="5" r="1" /><circle cx="16" cy="3" r="0.7" />
      <circle cx="20" cy="5" r="0.5" /><circle cx="3" cy="9" r="0.7" />
      <circle cx="7" cy="8" r="0.9" /><circle cx="11" cy="10" r="0.6" />
      <circle cx="15" cy="8" r="0.8" /><circle cx="19" cy="9" r="0.6" />
      <circle cx="5" cy="14" r="0.8" /><circle cx="9" cy="13" r="0.5" />
      <circle cx="13" cy="15" r="0.7" /><circle cx="17" cy="13" r="0.9" />
      <circle cx="21" cy="14" r="0.6" /><circle cx="4" cy="19" r="0.6" />
      <circle cx="8" cy="18" r="0.7" /><circle cx="12" cy="20" r="0.8" />
      <circle cx="16" cy="18" r="0.5" /><circle cx="20" cy="20" r="0.7" />
    </svg>
  ),
};

/* ── Card ────────────────────────────────────────────────────── */

function DemoCard({ demo }: { demo: Demo }) {
  const isComingSoon = demo.status === "coming-soon";
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowRgb = DEMO_GLOW[demo.slug] || "255,255,255";
  const glow = useMotionTemplate`radial-gradient(900px circle at ${mouseX}px ${mouseY}px, rgba(${glowRgb}, 0.09), transparent 50%)`;

  function onMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  return (
    <Link
      href={isComingSoon ? "#" : `/demos/${demo.slug}`}
      className={`group block relative h-full ${isComingSoon ? "cursor-default" : ""}`}
      onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={!isComingSoon ? onMove : undefined}
        className="relative h-full rounded-3xl overflow-hidden"
        whileHover={isComingSoon ? {} : { scale: 1.02, y: -8 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Cursor-following glow */}
        {!isComingSoon && (
          <motion.div
            className="absolute inset-0 z-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
            style={{ background: glow }}
          />
        )}

        {/* Gradient background with glow */}
        <div
          className={`absolute inset-0 bg-linear-to-br ${demo.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
        />

        {/* Animated border beam */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            padding: "1px",
            background:
              "conic-gradient(from var(--border-angle, 0deg), transparent 70%, rgba(255,255,255,0.15) 80%, transparent 90%)",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            animation: "border-rotate 3s linear infinite",
          }}
        />

        {/* Card content */}
        <div className="relative p-8 md:p-10 bg-white/3 border border-white/8 rounded-3xl backdrop-blur-sm h-full flex flex-col min-h-96">
          <div className="flex items-start justify-between mb-6">
            <motion.div
              className={`w-16 h-16 rounded-2xl bg-linear-to-br ${demo.gradient} flex items-center justify-center text-white shadow-lg`}
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              {DEMO_ICONS[demo.slug] || <span className="text-3xl">{demo.icon}</span>}
            </motion.div>

            {isComingSoon && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/5 text-slate-500 border border-white/10">
                Coming Soon
              </span>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
              {demo.title}
            </h3>
            <p
              className={`text-sm font-medium bg-linear-to-r ${demo.gradient} bg-clip-text text-transparent`}
            >
              {demo.subtitle}
            </p>
          </div>

          <p className="text-slate-400 leading-relaxed mb-6 grow">
            {demo.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {demo.tech.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-slate-400 border border-white/5"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="flex items-center text-sm font-medium mt-auto">
            {isComingSoon ? (
              <span className="text-slate-500">In Development</span>
            ) : (
              <motion.span
                className={`flex items-center gap-2 bg-linear-to-r ${demo.gradient} bg-clip-text text-transparent`}
              >
                Launch Demo
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ── Carousel arrow ──────────────────────────────────────────── */

function ArrowButton({
  direction,
  visible,
  onClick,
}: {
  direction: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/10 items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label={`Scroll ${direction}`}
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
          d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
}

/* ── Animation config ────────────────────────────────────────── */

const ease = [0.23, 1, 0.32, 1] as const;

/* ── Page ─────────────────────────────────────────────────────── */

export default function DemosPageClient() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const liveDemos = demos.filter((d) => d.status === "live");
  const liveCategories = (["ai-ml", "graphics"] as DemoCategory[]).filter(
    (cat) => liveDemos.some((d) => d.category === cat)
  );
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [progress, setProgress] = useState(0);

  const updateScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < maxScroll - 2);
    setProgress(maxScroll > 0 ? el.scrollLeft / maxScroll : 0);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return;
    updateScroll();
    el.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);

    // Track whether pointer is over the carousel
    let hovering = false;
    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; };
    wrapper.addEventListener("pointerenter", onEnter);
    wrapper.addEventListener("pointerleave", onLeave);

    const onWheel = (e: WheelEvent) => {
      if (!hovering) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const atLeft = el.scrollLeft <= 0;
      const atRight =
        el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
      const atEdge =
        (e.deltaY < 0 && atLeft) || (e.deltaY > 0 && atRight);

      if (atEdge) return;

      e.preventDefault();
      e.stopPropagation();
      el.scrollLeft += e.deltaY;
    };
    document.addEventListener("wheel", onWheel, { passive: false, capture: true });

    return () => {
      el.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      wrapper.removeEventListener("pointerenter", onEnter);
      wrapper.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, [updateScroll]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 20 : 400;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <main id="main-content" className="relative min-h-screen">
      <StarsBackground />

      <Navbar isSubpage />

      {/* Header — contained */}
      <section className="relative pt-32 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <motion.p
              className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease }}
            >
              Interactive Experiments
            </motion.p>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              {"Demo Laboratory".split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.12, ease }}
                >
                  <span className={i === 0 ? "text-white" : "bg-linear-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"}>
                    {word}
                  </span>
                  {i === 0 ? "\u00A0" : ""}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease }}
            >
              Interactive experiments pushing the boundaries of web technology
            </motion.p>
          </div>

          <WaveDivider className="mb-4" />
        </div>
      </section>

      {/* Carousel — native horizontal scroll, full bleed */}
      <section ref={wrapperRef} className="relative pb-8">
        <style>{`.carousel-track::-webkit-scrollbar{display:none}`}</style>

        <div className="relative">
          <div
            ref={scrollRef}
            className="carousel-track flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pt-4 -mt-4"
            style={{
              scrollbarWidth: "none",
              paddingLeft:
                "max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem))",
              scrollPaddingInlineStart:
                "max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem))",
              paddingRight: "1.5rem",
            }}
          >
            {liveCategories.flatMap((cat) => {
              const group = liveDemos.filter((d) => d.category === cat);
              return [
                <div
                  key={`label-${cat}`}
                  className="snap-start shrink-0 flex items-center pr-2"
                >
                  <span className="text-[11px] font-medium tracking-widest uppercase text-slate-500 [writing-mode:vertical-lr] rotate-180 whitespace-nowrap">
                    {DEMO_CATEGORIES[cat]}
                  </span>
                </div>,
                ...group.map((demo) => (
                  <div
                    key={demo.slug}
                    data-card
                    className="snap-start shrink-0 w-88"
                  >
                    <DemoCard demo={demo} />
                  </div>
                )),
              ];
            })}
          </div>

        </div>

        {/* Progress bar */}
        <div className="max-w-7xl mx-auto px-6 mt-8">
          <div className="h-0.5 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-linear-to-r from-blue-400 via-violet-400 to-purple-400 rounded-full"
              style={{ width: `${Math.max(5, progress * 100)}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="flex justify-center gap-3 mt-5">
          <ArrowButton
            direction="left"
            visible={canScrollLeft}
            onClick={() => scroll(-1)}
          />
          <ArrowButton
            direction="right"
            visible={canScrollRight}
            onClick={() => scroll(1)}
          />
        </div>
      </section>

      {/* Disclaimer — contained */}
      <section className="relative px-6 pb-24">
        <div className="max-w-7xl mx-auto mt-12 pt-8">
          <p className="text-center text-sm text-slate-500 max-w-2xl mx-auto">
            <span className="text-slate-400">Note:</span> AI demos run entirely
            in your browser using smaller, quantized models. While impressive
            for client-side processing, they may be slower and less capable than
            cloud-based alternatives.
          </p>
        </div>
      </section>
    </main>
  );
}
