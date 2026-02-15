"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
  MotionValue,
} from "framer-motion";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";

import { SITE_CONFIG } from "@/lib/seo";

const ease = [0.25, 0.1, 0.25, 1] as const;

/* ------------------------------------------------------------------ */
/*  Horizontal marquee                                                */
/* ------------------------------------------------------------------ */

function Marquee({ children, speed = 30 }: { children: React.ReactNode; speed?: number }) {
  return (
    <div className="overflow-hidden py-10 select-none" aria-hidden>
      <motion.div
        className="flex whitespace-nowrap gap-12"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Marquee divider                                                   */
/* ------------------------------------------------------------------ */

function MarqueeDivider() {
  const items = [
    "Systems Architecture",
    "Creative Technology",
    "AI Pipelines",
    "Interactive Experiences",
    "Data Visualisation",
    "Enterprise Design",
  ];

  return (
    <div className="border-y border-white/6">
      <Marquee speed={40}>
        {items.map((item) => (
          <span key={item} className="text-sm uppercase tracking-[0.3em] text-slate-700 flex items-center gap-12">
            {item}
            <span className="h-1 w-1 rounded-full bg-slate-700" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Intro — scroll-driven word highlight                              */
/* ------------------------------------------------------------------ */

function ScrollRevealWords({ text, className = "", scrollOffset }: { text: string; className?: string; scrollOffset?: NonNullable<Parameters<typeof useScroll>[0]>["offset"] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: scrollOffset ?? ["start 0.9", "end 0.55"],
  });
  const words = text.split(" ");

  return (
    <p ref={ref} className={`text-2xl font-light leading-[1.7] md:text-3xl md:leading-[1.7] ${className}`}>
      {words.map((word, i) => (
        <ScrollWord key={i} word={word} index={i} total={words.length} progress={scrollYProgress} />
      ))}
    </p>
  );
}

function ScrollWord({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(progress, [start, end], [0.15, 1]);
  const y = useTransform(progress, [start, end], [6, 0]);
  const blur = useTransform(progress, [start, end], [3, 0]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  return (
    <motion.span
      style={{ opacity, y, filter }}
      className="inline-block mr-[0.3em]"
    >
      {word}
    </motion.span>
  );
}

function IntroEntrance({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <p className="text-2xl font-light leading-[1.7] md:text-3xl md:leading-[1.7]">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.4, ease, delay: 0.1 + i * 0.018 }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

function Intro() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-28 pb-12 md:pt-32 md:pb-16">
      <div className="grid md:grid-cols-[3fr_2fr] gap-12 md:gap-20 items-start">
        <div className="max-w-2xl">
          <IntroEntrance
            text="I spend my days somewhere between blueprints and pixels — designing systems that need to scale, and crafting interactive experiences that need to move people. I care about the invisible architecture as much as the first thing you see."
          />
        </div>

        {/* Right column: photo can be placed here */}
      </div>

      <div className="mt-10 md:mt-14 md:ml-auto md:max-w-xl md:pr-8">
        <ScrollRevealWords
          text="Before any line of code, I ask: does this need to exist? And if it does, can it be simpler? Most of my best work is the complexity you'll never notice."
          scrollOffset={["start 0.9", "end 0.55"]}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Two sides — slide in with parallax + draw lines                   */
/* ------------------------------------------------------------------ */

function TwoSides() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const leftY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const rightY = useTransform(scrollYProgress, [0, 1], [120, -40]);

  const leftRotate = useTransform(scrollYProgress, [0, 1], [-1.5, 0.5]);
  const rightRotate = useTransform(scrollYProgress, [0, 1], [1, -0.5]);

  return (
    <section ref={sectionRef} className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 overflow-hidden">
      {/* Diagonal accent line */}
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        <div className="absolute top-0 left-[46%] w-px h-[140%] bg-linear-to-b from-transparent via-white/5 to-transparent origin-top rotate-12" />
      </div>

      <div className="grid md:grid-cols-[5fr_7fr] gap-16 md:gap-20">
        {/* Architect — narrower left column */}
        <motion.div style={{ y: leftY, rotate: leftRotate }}>
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease }}
          >
            <motion.p
              className="text-sm tracking-[0.25em] uppercase text-sky-400/70 mb-6 overflow-hidden"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease, delay: 0.3 }}
            >
              <motion.span
                className="inline-block"
                initial={{ y: "100%" }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: 0.3 }}
              >
                The Architect
              </motion.span>
            </motion.p>
            <h2 className="text-3xl font-semibold leading-snug tracking-tight md:text-4xl">
              Enterprise platforms, AI&nbsp;pipelines, governance frameworks.
            </h2>
            <motion.p
              className="mt-6 text-base leading-relaxed text-slate-500 max-w-sm"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: 0.4 }}
            >
              I think in trade-offs and long-term bets. The systems I design are
              meant to outlast the teams that build them.
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Maker — wider right column, pushed down further */}
        <motion.div style={{ y: rightY, rotate: rightRotate }} className="md:mt-32 md:pl-12">
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease, delay: 0.1 }}
          >
            <motion.p
              className="text-sm tracking-[0.25em] uppercase text-purple-400/70 mb-6 overflow-hidden"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease, delay: 0.45 }}
            >
              <motion.span
                className="inline-block"
                initial={{ y: "100%" }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: 0.45 }}
              >
                The Maker
              </motion.span>
            </motion.p>
            <h2 className="text-3xl font-semibold leading-snug tracking-tight md:text-4xl lg:text-5xl">
              Interactive experiences, visualisations that&nbsp;explain.
            </h2>
            <motion.p
              className="mt-6 text-base leading-relaxed text-slate-500 max-w-md"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: 0.55 }}
            >
              I believe pixels should move people, not just render. If it
              doesn&rsquo;t spark something, it&rsquo;s not done.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Philosophy — scale + blur scroll reveal                           */
/* ------------------------------------------------------------------ */

function Philosophy() {
  const sentence1 = "The best technology feels human";
  const sentence2 = "— considered, purposeful, and a little unexpected.";

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.55"],
  });

  const containerScale = useTransform(scrollYProgress, [0, 0.2], [0.9, 1]);
  const containerOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const allWords = [...sentence1.split(" "), ...sentence2.split(" ")];

  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  return (
    <section className="py-20 md:py-32 overflow-hidden">
      <motion.div
        ref={ref}
        className="mx-auto max-w-6xl px-6"
        style={{ scale: containerScale, opacity: containerOpacity }}
      >
        {/* Ambient glow behind quote */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(96,165,250,0.015) 0%, transparent 70%)",
          }}
        />
        <blockquote
          className="text-[clamp(1.75rem,4.5vw,3.5rem)] font-light leading-[1.3] tracking-tight md:text-right"
          onMouseMove={(e) => { mouseX.set(e.clientX); mouseY.set(e.clientY); }}
          onMouseLeave={() => { mouseX.set(-1000); mouseY.set(-1000); }}
        >
          {allWords.map((word, i) => {
            const isSecondSentence = i >= sentence1.split(" ").length;
            return (
              <PhilosophyWord
                key={i}
                word={word}
                index={i}
                total={allWords.length}
                progress={scrollYProgress}
                dim={isSecondSentence}
                mouseX={mouseX}
                mouseY={mouseY}
              />
            );
          })}
        </blockquote>
      </motion.div>
    </section>
  );
}

function PhilosophyWord({
  word,
  index,
  total,
  progress,
  dim,
  mouseX,
  mouseY,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  dim: boolean;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const wordRef = useRef<HTMLSpanElement>(null);
  const start = 0.05 + (index / total) * 0.6;
  const end = start + 2.5 / total;
  const opacity = useTransform(progress, [start, end], [0.06, dim ? 0.4 : 1]);
  const scrollY = useTransform(progress, [start, end], [8, 0]);
  const blur = useTransform(progress, [start, end], [4, 0]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  const rawMX = useMotionValue(0);
  const rawMY = useMotionValue(0);
  const magnetX = useSpring(rawMX, { stiffness: 200, damping: 20 });
  const magnetY = useSpring(rawMY, { stiffness: 200, damping: 20 });

  useEffect(() => {
    const compute = () => {
      const mx = mouseX.get();
      const my = mouseY.get();
      if (!wordRef.current || mx < -500) {
        rawMX.set(0);
        rawMY.set(0);
        return;
      }
      const rect = wordRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = mx - cx;
      const dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 150;
      if (dist > maxDist || dist === 0) {
        rawMX.set(0);
        rawMY.set(0);
        return;
      }
      const strength = ((1 - dist / maxDist) ** 2) * 6;
      rawMX.set((dx / dist) * strength);
      rawMY.set((dy / dist) * strength);
    };
    const unsubX = mouseX.on("change", compute);
    const unsubY = mouseY.on("change", compute);
    return () => { unsubX(); unsubY(); };
  }, [mouseX, mouseY, rawMX, rawMY]);

  const y = useTransform([scrollY, magnetY], ([sy, my]: number[]) => sy + my);

  return (
    <motion.span
      ref={wordRef}
      style={{ opacity, y, filter, x: magnetX }}
      className={`inline-block mr-[0.3em] ${dim ? "text-slate-500" : "text-white"}`}
    >
      {word}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/*  Full-bleed visual break                                           */
/* ------------------------------------------------------------------ */

function VisualBreak() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 18° downward tilt so latitude lines curve visibly
    const TILT = 18 * Math.PI / 180;
    const sinT = Math.sin(TILT), cosT = Math.cos(TILT);
    const N = 90; // curve resolution

    function project(lat: number, lon: number, rot: number, R: number) {
      const cl = Math.cos(lat), sl = Math.sin(lat);
      const sn = Math.sin(lon + rot), cn = Math.cos(lon + rot);
      return {
        x: R * cl * sn,
        y: -(sl * cosT - cl * cn * sinT) * R,
        z: sl * sinT + cl * cn * cosT, // >0 = front-facing
      };
    }

    function sizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function render() {
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      const cx = w / 2, cy = h / 2;
      const R = Math.min(w, h) * 0.4;
      const rot = -(scrollYProgress.get() * Math.PI * 0.5 - Math.PI * 0.1);

      ctx!.clearRect(0, 0, w, h);

      // Outer circle (silhouette — always a circle in orthographic)
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx!.strokeStyle = "rgba(255,255,255,0.18)";
      ctx!.lineWidth = 0.5;
      ctx!.stroke();

      // Draw curve with back-face culling
      function drawCurve(pts: { x: number; y: number; z: number }[], color: string) {
        ctx!.strokeStyle = color;
        ctx!.lineWidth = 0.5;
        ctx!.beginPath();
        let pen = false;
        for (const p of pts) {
          if (p.z > 0) {
            if (!pen) { ctx!.moveTo(cx + p.x, cy + p.y); pen = true; }
            else ctx!.lineTo(cx + p.x, cy + p.y);
          } else pen = false;
        }
        ctx!.stroke();
      }

      // Meridians every 30°
      for (let d = 0; d < 360; d += 30) {
        const lon = d * Math.PI / 180;
        const pts = [];
        for (let i = 0; i <= N; i++)
          pts.push(project((i / N) * Math.PI - Math.PI / 2, lon, rot, R));
        drawCurve(pts, d % 90 === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.09)");
      }

      // Latitude circles
      for (const latDeg of [0, 30, -30, 60, -60]) {
        const lat = latDeg * Math.PI / 180;
        const pts = [];
        for (let i = 0; i <= N; i++)
          pts.push(project(lat, (i / N) * 2 * Math.PI, rot, R));
        drawCurve(pts, latDeg === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.09)");
      }

      // 60°N marker dot on prime meridian
      const dot = project(60 * Math.PI / 180, 0, rot, R);
      if (dot.z > 0) {
        ctx!.beginPath();
        ctx!.arc(cx + dot.x, cy + dot.y, 2.5, 0, 2 * Math.PI);
        ctx!.fillStyle = `rgba(255,255,255,${(0.38 + 0.5 * dot.z).toFixed(2)})`;
        ctx!.fill();
      }
    }

    sizeCanvas();
    render();

    const unsub = scrollYProgress.on("change", render);
    const ro = new ResizeObserver(() => { sizeCanvas(); render(); });
    ro.observe(canvas);

    return () => { unsub(); ro.disconnect(); };
  }, [scrollYProgress]);

  return (
    <section ref={sectionRef} className="relative h-[16vh] md:h-[22vh] overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-36 h-36 md:w-52 md:h-52" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Location + Connect                                                */
/* ------------------------------------------------------------------ */

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const duration = 1400;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

function LocationAndConnect() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const leftY = useTransform(scrollYProgress, [0, 1], [40, -60]);
  const rightY = useTransform(scrollYProgress, [0, 1], [80, -30]);
  const rightRotate = useTransform(scrollYProgress, [0, 1], [0.6, -0.4]);
  const coordDraw = useTransform(scrollYProgress, [0.15, 0.5], [0, 1]);

  const links = [
    { label: SITE_CONFIG.email, href: `mailto:${SITE_CONFIG.email}` },
    { label: "GitHub", href: SITE_CONFIG.github },
  ];

  return (
    <section ref={sectionRef} className="relative mx-auto max-w-7xl px-6 pt-20 pb-28 md:pt-28 md:pb-36 overflow-hidden">
      {/* Coordinate grid — CSS-positioned to flow with layout */}
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        {/* Horizontal latitude lines */}
        {["22%", "44%", "66%"].map((top) => (
          <motion.div
            key={top}
            className="absolute left-[15%] w-[40%] h-px bg-white/4"
            style={{ top, scaleX: coordDraw, transformOrigin: "left" }}
          />
        ))}
        {/* Vertical meridian */}
        <motion.div
          className="absolute left-[33%] top-[12%] w-px h-[64%] bg-white/5"
          style={{ scaleY: coordDraw, transformOrigin: "top" }}
        />
        {/* Crosshair — small SVG with proper proportions */}
        <motion.div
          className="absolute left-[33%] top-[27%] -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: coordDraw }}
        >
          <svg viewBox="0 0 60 60" className="w-11 h-11" fill="none">
            <circle cx="30" cy="30" r="11" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" />
            <circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.12)" />
            <line x1="8" y1="30" x2="17" y2="30" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" />
            <line x1="43" y1="30" x2="52" y2="30" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" />
            <line x1="30" y1="8" x2="30" y2="17" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" />
            <line x1="30" y1="43" x2="30" y2="52" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" />
          </svg>
        </motion.div>
        {/* Tick marks on middle latitude */}
        <div className="absolute left-[15%] top-[44%] w-[40%] flex justify-between -translate-y-1/2 px-[2%]">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="w-px h-1.5 bg-white/4"
              style={{ scaleY: coordDraw }}
            />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[5fr_6fr] gap-16 md:gap-20">
        {/* Based at 60°N — left */}
        <motion.div style={{ y: leftY }} className="md:pr-8">
          <motion.p
            className="text-sm tracking-[0.25em] uppercase text-slate-600 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            Based at
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotateX: -20 }}
            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 60, damping: 12 }}
          >
            <p className="text-8xl font-bold tracking-tighter md:text-9xl">
              <AnimatedNumber value={60} suffix="°N" />
            </p>
          </motion.div>
          <motion.p
            className="mt-4 text-lg text-slate-500"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease, delay: 0.3 }}
          >
            Sweden
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease, delay: 0.4 }}
          >
            <Link
              href="/colophon/"
              className="group mt-6 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors duration-300 hover:text-slate-300"
            >
              See the night sky from here
              <motion.span
                aria-hidden
                className="inline-block"
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                &rarr;
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Say hello — right, parallax + rotation */}
        <motion.div style={{ y: rightY, rotate: rightRotate }} className="md:mt-28 md:pl-12">
          <motion.p
            className="text-sm tracking-[0.25em] uppercase text-slate-600 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            Say hello
          </motion.p>

          <motion.p
            className="text-xl font-light leading-relaxed text-slate-400 md:text-2xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
          >
            I&rsquo;m always up for a conversation about architecture,
            creative tech, or whatever you&rsquo;re building.
          </motion.p>

          <div className="mt-10 flex flex-col gap-5">
            {links.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto") ? undefined : "_blank"}
                rel={link.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                className="text-lg text-slate-500 underline decoration-slate-700 underline-offset-4 transition-colors duration-300 hover:text-white hover:decoration-slate-400"
                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 14,
                  delay: 0.3 + i * 0.12,
                }}
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}


/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function AboutClient() {
  return (
    <main id="main-content" className="relative min-h-screen">
      <Navbar isSubpage hasStars={false} />
      <Intro />
      <MarqueeDivider />
      <TwoSides />
      <Philosophy />
      <VisualBreak />
      <LocationAndConnect />
    </main>
  );
}
