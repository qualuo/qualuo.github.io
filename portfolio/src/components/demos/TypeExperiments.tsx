"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useSpring } from "framer-motion";

type EffectType = "magnetic" | "glitch" | "wave" | "explode" | "scramble";

interface EffectConfig {
  name: string;
  description: string;
}

const EFFECTS: Record<EffectType, EffectConfig> = {
  magnetic: {
    name: "Magnetic",
    description: "Letters attracted to your cursor with spring physics",
  },
  glitch: {
    name: "Glitch",
    description: "Digital distortion with chromatic aberration",
  },
  wave: {
    name: "Wave",
    description: "Smooth sine wave animation through text",
  },
  explode: {
    name: "Explode",
    description: "Letters scatter apart and reassemble on hover",
  },
  scramble: {
    name: "Scramble",
    description: "Characters cycle through random letters",
  },
};

const SAMPLE_TEXTS = [
  "CREATIVE",
  "DYNAMIC",
  "KINETIC",
  "MOTION",
];

// Magnetic Text Effect
function MagneticText({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative flex justify-center items-center py-16"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex">
        {text.split("").map((char, i) => (
          <MagneticLetter
            key={i}
            char={char}
            mousePos={mousePos}
            isHovering={isHovering}
            containerRef={containerRef}
          />
        ))}
      </div>
    </div>
  );
}

function MagneticLetter({
  char,
  mousePos,
  isHovering,
  containerRef,
}: {
  char: string;
  mousePos: { x: number; y: number };
  isHovering: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const letterRef = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });
  const scale = useSpring(1, { stiffness: 300, damping: 20 });
  const rotate = useSpring(0, { stiffness: 200, damping: 20 });

  useEffect(() => {
    if (!letterRef.current || !containerRef.current || !isHovering) {
      x.set(0);
      y.set(0);
      scale.set(1);
      rotate.set(0);
      return;
    }

    const letterRect = letterRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const letterCenterX = letterRect.left - containerRect.left + letterRect.width / 2;
    const letterCenterY = letterRect.top - containerRect.top + letterRect.height / 2;

    const dx = mousePos.x - letterCenterX;
    const dy = mousePos.y - letterCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 200;

    if (distance < maxDistance) {
      const force = (maxDistance - distance) / maxDistance;
      x.set(dx * force * 0.4);
      y.set(dy * force * 0.4);
      scale.set(1 + force * 0.3);
      rotate.set(dx * force * 0.1);
    } else {
      x.set(0);
      y.set(0);
      scale.set(1);
      rotate.set(0);
    }
  }, [mousePos, isHovering, x, y, scale, rotate, containerRef]);

  return (
    <motion.span
      ref={letterRef}
      style={{ x, y, scale, rotate }}
      className="inline-block text-7xl md:text-9xl font-black text-white select-none"
    >
      {char}
    </motion.span>
  );
}

// Glitch Text Effect
function GlitchText({ text }: { text: string }) {
  const [glitch, setGlitch] = useState<{
    active: boolean;
    intensity: number;
    translateX: number;
    clips: number[];
    chars: string;
  }>({ active: false, intensity: 0, translateX: 0, clips: [0, 0, 0, 0], chars: text });

  const startGlitch = useCallback((intensity: number) => {
    setGlitch({
      active: true,
      intensity,
      translateX: (Math.random() - 0.5) * 4,
      clips: [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100],
      chars: text.split("").map(c =>
        Math.random() > 0.7 ? String.fromCharCode(33 + Math.floor(Math.random() * 94)) : c
      ).join(""),
    });
  }, [text]);

  const stopGlitch = useCallback(() => {
    setGlitch(prev => ({ ...prev, active: false }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        startGlitch(Math.random());
        setTimeout(stopGlitch, 100 + Math.random() * 200);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [startGlitch, stopGlitch]);

  return (
    <div
      className="relative flex justify-center items-center py-16 cursor-pointer"
      onMouseEnter={() => startGlitch(1)}
      onMouseLeave={stopGlitch}
    >
      <div className="relative">
        {/* Base text */}
        <span className="text-7xl md:text-9xl font-black text-white select-none">
          {text}
        </span>

        {/* Glitch layers */}
        {glitch.active && (
          <>
            <span
              className="absolute inset-0 text-7xl md:text-9xl font-black text-cyan-400 select-none mix-blend-screen"
              style={{
                transform: `translate(${glitch.intensity * 8}px, ${glitch.intensity * -2}px)`,
                clipPath: `polygon(0 ${20 + glitch.intensity * 30}%, 100% ${20 + glitch.intensity * 30}%, 100% ${40 + glitch.intensity * 20}%, 0 ${40 + glitch.intensity * 20}%)`,
              }}
            >
              {text}
            </span>
            <span
              className="absolute inset-0 text-7xl md:text-9xl font-black text-red-400 select-none mix-blend-screen"
              style={{
                transform: `translate(${glitch.intensity * -8}px, ${glitch.intensity * 2}px)`,
                clipPath: `polygon(0 ${60 + glitch.intensity * 10}%, 100% ${60 + glitch.intensity * 10}%, 100% ${80 + glitch.intensity * 10}%, 0 ${80 + glitch.intensity * 10}%)`,
              }}
            >
              {text}
            </span>
            <span
              className="absolute inset-0 text-7xl md:text-9xl font-black text-white select-none"
              style={{
                transform: `translate(${glitch.translateX}px, 0)`,
                clipPath: `polygon(0 ${glitch.clips[0]}%, 100% ${glitch.clips[1]}%, 100% ${glitch.clips[2]}%, 0 ${glitch.clips[3]}%)`,
                opacity: 0.8,
              }}
            >
              {glitch.chars}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Wave Text Effect
function WaveText({ text }: { text: string }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setTime(Date.now() / 1000);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative flex justify-center items-center py-16">
      <div className="flex">
        {text.split("").map((char, i) => {
          const offset = Math.sin(time * 3 + i * 0.5) * 20;
          const rotation = Math.sin(time * 2 + i * 0.3) * 10;
          const scale = 1 + Math.sin(time * 4 + i * 0.4) * 0.1;
          const hue = (time * 50 + i * 30) % 360;

          return (
            <span
              key={i}
              className="inline-block text-7xl md:text-9xl font-black select-none transition-none"
              style={{
                transform: `translateY(${offset}px) rotate(${rotation}deg) scale(${scale})`,
                color: `hsl(${hue}, 80%, 70%)`,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Explode Text Effect - Letters scatter and reassemble
function ExplodeText({ text }: { text: string }) {
  const [isExploded, setIsExploded] = useState(false);
  const [offsets] = useState(() =>
    text.split("").map(() => ({
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 300,
      rotate: (Math.random() - 0.5) * 720,
      scale: Math.random() * 0.5 + 0.5,
    }))
  );

  return (
    <div
      className="relative flex justify-center items-center py-16 cursor-pointer"
      onMouseEnter={() => setIsExploded(true)}
      onMouseLeave={() => setIsExploded(false)}
      onClick={() => setIsExploded(!isExploded)}
    >
      <div className="flex">
        {text.split("").map((char, i) => (
          <motion.span
            key={i}
            className="inline-block text-7xl md:text-9xl font-black select-none"
            animate={{
              x: isExploded ? offsets[i].x : 0,
              y: isExploded ? offsets[i].y : 0,
              rotate: isExploded ? offsets[i].rotate : 0,
              scale: isExploded ? offsets[i].scale : 1,
              opacity: isExploded ? 0.6 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: isExploded ? 100 : 200,
              damping: isExploded ? 10 : 20,
              delay: isExploded ? i * 0.02 : (text.length - i) * 0.02,
            }}
            style={{
              color: `hsl(${i * (360 / text.length)}, 70%, 70%)`,
            }}
          >
            {char}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// Scramble Text Effect
function ScrambleText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

  const scramble = useCallback(() => {
    if (isScrambling) return;
    setIsScrambling(true);

    let iteration = 0;
    const maxIterations = text.length;

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, i) => {
            if (i < iteration) return text[i];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      iteration += 1 / 3;

      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, 30);
  }, [text, isScrambling, chars]);

  useEffect(() => {
    const timeout = setTimeout(scramble, 0);
    const interval = setInterval(scramble, 3000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [scramble]);

  return (
    <div
      className="relative flex justify-center items-center py-16 cursor-pointer"
      onMouseEnter={scramble}
    >
      <span className="text-7xl md:text-9xl font-black text-white select-none font-mono tracking-wider">
        {displayText.split("").map((char, i) => (
          <span
            key={i}
            className={`inline-block transition-colors duration-100 ${
              char !== text[i] ? "text-emerald-400" : "text-white"
            }`}
          >
            {char}
          </span>
        ))}
      </span>
    </div>
  );
}

// Main Component
export function TypeExperiments() {
  const [activeEffect, setActiveEffect] = useState<EffectType>("magnetic");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [customText, setCustomText] = useState("");

  const displayText = customText || SAMPLE_TEXTS[currentTextIndex];

  const cycleText = () => {
    setCustomText("");
    setCurrentTextIndex((i) => (i + 1) % SAMPLE_TEXTS.length);
  };

  const renderEffect = () => {
    switch (activeEffect) {
      case "magnetic":
        return <MagneticText text={displayText} />;
      case "glitch":
        return <GlitchText text={displayText} />;
      case "wave":
        return <WaveText text={displayText} />;
      case "explode":
        return <ExplodeText text={displayText} />;
      case "scramble":
        return <ScrambleText text={displayText} />;
    }
  };

  return (
    <div className="relative w-full flex flex-col">
      {/* Effect Display */}
      <div
        className="relative bg-black rounded-2xl overflow-hidden border border-white/10"
        style={{ height: "50vh", minHeight: "350px" }}
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {renderEffect()}
        </div>

        {/* Effect label */}
        <div className="absolute top-4 left-4 text-xs text-white/50 font-mono">
          {EFFECTS[activeEffect].name} Effect
        </div>

        {/* Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/30">
          {activeEffect === "explode" ? "Hover or click to scatter" :
           activeEffect === "magnetic" ? "Hover near letters" :
           activeEffect === "glitch" ? "Hover to intensify" :
           activeEffect === "scramble" ? "Hover to trigger" :
           "Watch the animation"}
        </div>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-6 bg-white/3 border border-white/10 rounded-2xl"
      >
        {/* Effect Selector */}
        <div className="mb-6">
          <label className="block text-xs text-slate-500 uppercase tracking-wide mb-3">
            Effect Type
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EFFECTS) as EffectType[]).map((effect) => (
              <button
                key={effect}
                onClick={() => setActiveEffect(effect)}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  activeEffect === effect
                    ? "bg-white text-black font-medium"
                    : "bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {EFFECTS[effect].name}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {EFFECTS[activeEffect].description}
          </p>
        </div>

        {/* Text Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
              Custom Text
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value.toUpperCase().slice(0, 12))}
              placeholder={SAMPLE_TEXTS[currentTextIndex]}
              maxLength={12}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={cycleText}
              className="px-4 py-2 text-sm rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
            >
              Cycle Sample Text
            </button>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex flex-wrap gap-2">
            {["Canvas API", "Framer Motion", "React Hooks", "CSS Transforms", "RequestAnimationFrame"].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 text-xs rounded-full bg-white/5 text-slate-400 border border-white/10"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
