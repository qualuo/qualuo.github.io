"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Passages ───────────────────────────────────────────────────────

const PASSAGES = [
  {
    title: "Cherry Blossoms",
    text: "The cherry blossoms drift like pink snow, each petal a fleeting whisper of spring. Beneath the ancient trees, time slows to the rhythm of falling petals.",
  },
  {
    title: "Morning Garden",
    text: "Dew clings to spider silk strung between sunflowers. The garden wakes slowly, stretching golden faces toward the first light of dawn.",
  },
  {
    title: "Wildflower Field",
    text: "A thousand wildflowers paint the meadow in strokes of violet and gold. The wind moves through them like a gentle hand across piano keys.",
  },
  {
    title: "Night Jasmine",
    text: "When darkness falls, the jasmine opens its white stars. Its perfume travels on the night air, finding those who wander beneath the moon.",
  },
  {
    title: "The Lotus",
    text: "Rising from muddy waters, the lotus blooms without stain. It teaches the oldest lesson: beauty grows from struggle, light from darkness.",
  },
  {
    title: "Autumn Leaves",
    text: "The maple releases its leaves like love letters to the earth. Each one spirals downward, a small flame surrendering to the season.",
  },
  {
    title: "Wisteria Rain",
    text: "Purple wisteria cascades from the wooden pergola, its clusters heavy with fragrance. Bees hum their approval as petals pool on the stone path below.",
  },
  {
    title: "Desert Bloom",
    text: "After years of patience, the desert erupts in color overnight. Cacti flowers open at dawn, brilliant and brief, proof that waiting is never wasted.",
  },
];

// ─── Types ──────────────────────────────────────────────────────────

interface CharState {
  char: string;
  status: "pending" | "correct" | "incorrect" | "current";
  typed?: string; // what the user actually pressed (for errors)
}

// ─── Component ──────────────────────────────────────────────────────

function pickRandom() {
  return Math.floor(Math.random() * PASSAGES.length);
}

export default function TypeRaceClient() {
  const [passageIndex, setPassageIndex] = useState(pickRandom);
  const [charStates, setCharStates] = useState<CharState[]>(() =>
    PASSAGES[passageIndex].text.split("").map((char, i) => ({
      char,
      status: i === 0 ? ("current" as const) : ("pending" as const),
    }))
  );
  const [cursor, setCursor] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [finished, setFinished] = useState(false);
  const [blooms, setBlooms] = useState<{ id: number; x: number; color: string }[]>([]);
  const [showNewPB, setShowNewPB] = useState(false);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 0, ready: false });
  const bloomId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Analytics refs (don't trigger re-renders during typing)
  const wpmHistory = useRef<number[]>([]);
  const lastSampleTime = useRef(0);
  const charErrors = useRef<Map<string, { total: number; errors: number }>>(new Map());

  // Personal best (lazy-init from localStorage)
  const [personalBest, setPersonalBest] = useState(() => {
    try {
      const pb = typeof window !== "undefined" ? localStorage.getItem("typerace-pb") : null;
      return pb ? parseInt(pb, 10) : 0;
    } catch { return 0; }
  });

  const passage = PASSAGES[passageIndex];
  const text = passage.text;
  const started = startTime > 0;

  // Initialize chars for a passage
  const initChars = useCallback((t: string) => {
    setCharStates(
      t.split("").map((char, i) => ({
        char,
        status: i === 0 ? ("current" as const) : ("pending" as const),
      }))
    );
    setCursor(0);
    setErrors(0);
    setTotalKeystrokes(0);
    setElapsed(0);
    setStartTime(0);
    setFinished(false);
    setBlooms([]);
    setShowNewPB(false);
    setCaretPos((p) => ({ ...p, ready: false }));
    wpmHistory.current = [];
    lastSampleTime.current = 0;
    charErrors.current.clear();
  }, []);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, [passageIndex]);

  // Derived stats — net WPM: only correct keystrokes count
  const correctChars = totalKeystrokes - errors;
  const wpm = elapsed > 0 ? Math.round((correctChars / 5 / elapsed) * 60) : 0;
  const accuracy = totalKeystrokes > 0 ? Math.round(((totalKeystrokes - errors) / totalKeystrokes) * 100) : 100;
  const progress = text.length > 0 ? cursor / text.length : 0;

  // Timer — 10fps is enough (display shows 1 decimal), avoids 60fps re-renders
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => {
      setElapsed((performance.now() - startTime) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [started, finished, startTime]);

  // Track smooth caret position
  useEffect(() => {
    if (!textRef.current || finished) return;
    requestAnimationFrame(() => {
      const el = textRef.current?.querySelector(`[data-idx="${cursor}"]`) as HTMLElement | null;
      if (el) {
        setCaretPos({
          left: el.offsetLeft,
          top: el.offsetTop,
          height: el.offsetHeight,
          ready: true,
        });
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }, [cursor, finished, passageIndex, charStates.length]);

  // Spawn bloom flower at progress position
  const spawnBloom = useCallback((pct: number) => {
    const colors = ["#F9A8D4", "#C4B5FD", "#FDBA74", "#FB7185", "#FDE047"];
    const id = ++bloomId.current;
    setBlooms((b) => [...b.slice(-8), { id, x: pct * 100, color: colors[id % colors.length] }]);
    setTimeout(() => setBlooms((b) => b.filter((bl) => bl.id !== id)), 1200);
  }, []);

  // New passage (declared before handleKey to avoid TDZ)
  const nextPassage = useCallback(() => {
    let idx = pickRandom();
    while (idx === passageIndex && PASSAGES.length > 1) idx = pickRandom();
    setPassageIndex(idx);
    initChars(PASSAGES[idx].text);
  }, [passageIndex, initChars]);

  // Keystroke handler
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        nextPassage();
        return;
      }
      if (finished) {
        if (e.key === "Enter") nextPassage();
        return;
      }
      if (e.key.length !== 1 && e.key !== "Backspace") return;
      e.preventDefault();

      // Start timer on first real keystroke
      let actualStartTime = startTime;
      if (!started && e.key !== "Backspace") {
        actualStartTime = performance.now();
        setStartTime(actualStartTime);
      }

      if (e.key === "Backspace") {
        if (cursor > 0) {
          const newCursor = cursor - 1;
          setCharStates((prev) => {
            const next = [...prev];
            next[cursor] = { ...next[cursor], status: "pending" };
            next[newCursor] = { ...next[newCursor], status: "current" };
            return next;
          });
          setCursor(newCursor);
        }
        return;
      }

      setTotalKeystrokes((k) => k + 1);
      const expected = text[cursor];
      const isCorrect = e.key === expected;

      if (!isCorrect) setErrors((err) => err + 1);

      // Track character difficulty
      const entry = charErrors.current.get(expected) || { total: 0, errors: 0 };
      entry.total += 1;
      if (!isCorrect) entry.errors += 1;
      charErrors.current.set(expected, entry);

      if (isCorrect && (cursor + 1) % 15 === 0) {
        spawnBloom(cursor / text.length);
      }

      const newCursor = cursor + 1;

      setCharStates((prev) => {
        const next = [...prev];
        next[cursor] = {
          ...next[cursor],
          status: isCorrect ? "correct" : "incorrect",
          ...(isCorrect ? {} : { typed: e.key }),
        };
        if (newCursor < next.length) {
          next[newCursor] = { ...next[newCursor], status: "current" };
        }
        return next;
      });
      setCursor(newCursor);

      // Sample instantaneous WPM every 5 characters
      if (newCursor % 5 === 0 && actualStartTime > 0) {
        const now = performance.now();
        const segStart = lastSampleTime.current || actualStartTime;
        const segSec = (now - segStart) / 1000;
        if (segSec > 0) {
          // 5 chars in segSec seconds → WPM (assuming avg 5 chars/word)
          wpmHistory.current.push(Math.round((1 / segSec) * 60));
        }
        lastSampleTime.current = now;
      }

      if (newCursor >= text.length) {
        const finalElapsed = (performance.now() - (actualStartTime || performance.now())) / 1000;
        setElapsed(finalElapsed);
        setFinished(true);
        // Final segment WPM
        const segStart = lastSampleTime.current || actualStartTime;
        const segSec = (performance.now() - segStart) / 1000;
        if (segSec > 0) {
          const remaining = text.length % 5 || 5;
          wpmHistory.current.push(Math.round((remaining / 5 / segSec) * 60));
        }
        // Update personal best
        const finalCorrect = (totalKeystrokes + 1) - (errors + (isCorrect ? 0 : 1));
        const finalWpm = finalElapsed > 0 ? Math.round((finalCorrect / 5 / finalElapsed) * 60) : 0;
        if (finalWpm > 0 && finalWpm > personalBest) {
          setPersonalBest(finalWpm);
          setShowNewPB(true);
          try { localStorage.setItem("typerace-pb", String(finalWpm)); } catch { /* ignore */ }
        }
      }
    },
    [finished, started, cursor, text, startTime, spawnBloom, nextPassage, totalKeystrokes, errors, personalBest]
  );

  // Snapshot analytics into state when finished (avoids reading refs during render)
  const [wpmData, setWpmData] = useState<number[]>([]);
  const [difficultChars, setDifficultChars] = useState<{ char: string; errorRate: number; errors: number }[]>([]);
  useEffect(() => {
    if (!finished) return;
    setWpmData([...wpmHistory.current]);
    setDifficultChars(
      Array.from(charErrors.current.entries())
        .filter(([, v]) => v.errors > 0)
        .map(([char, v]) => ({ char, errorRate: v.errors / v.total, errors: v.errors }))
        .sort((a, b) => b.errors - a.errors)
        .slice(0, 5)
    );
  }, [finished]);

  // Sparkline path computation
  const sparkline = useMemo(() => {
    if (wpmData.length < 2) return null;
    const w = 200, h = 40, pad = 4;
    const max = Math.max(...wpmData);
    const min = Math.min(...wpmData);
    const range = max - min || 1;

    const points = wpmData.map((v, i) => ({
      x: pad + (i / (wpmData.length - 1)) * (w - pad * 2),
      y: pad + (1 - (v - min) / range) * (h - pad * 2),
    }));

    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L${(w - pad).toFixed(1)},${h} L${pad},${h} Z`;

    return { line, area, last: points[points.length - 1] };
  }, [wpmData]);

  // Rating based on WPM
  const rating =
    wpm >= 100 ? "Lightning" :
    wpm >= 70 ? "Swift" :
    wpm >= 50 ? "Steady" :
    wpm >= 30 ? "Growing" : "Budding";

  const ratingColor =
    wpm >= 100 ? "#FDE047" :
    wpm >= 70 ? "#4ADE80" :
    wpm >= 50 ? "#60A5FA" :
    wpm >= 30 ? "#C4B5FD" : "#F9A8D4";

  return (
    <div
      id="main-content"
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#060608] text-white overflow-hidden select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input for keyboard capture */}
      <input
        ref={inputRef}
        className="absolute opacity-0 w-0 h-0"
        onKeyDown={handleKey}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-label="Type here"
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4">
        <Link
          href="/creative/"
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Creative
        </Link>
        <span className="text-white/30 text-xs tracking-widest uppercase">Type Race</span>
        <div className="w-16" />
      </div>

      {/* Progress bar */}
      {started && (
        <div className="absolute top-14 left-0 right-0 z-10 px-6">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #F9A8D4, #C4B5FD, #FDBA74)" }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
          <div className="relative h-6 -mt-3">
            <AnimatePresence>
              {blooms.map((b) => (
                <motion.div
                  key={b.id}
                  className="absolute -top-1"
                  style={{ left: `${b.x}%` }}
                  initial={{ scale: 0, opacity: 1, y: 0 }}
                  animate={{ scale: [0, 1.5, 0], opacity: [1, 0.8, 0], y: -20 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    {[0, 72, 144, 216, 288].map((a) => (
                      <ellipse key={a} cx="8" cy="4" rx="2.5" ry="4" fill={b.color}
                        transform={`rotate(${a} 8 8)`} opacity="0.8" />
                    ))}
                    <circle cx="8" cy="8" r="2" fill="#FDE047" opacity="0.9" />
                  </svg>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Live stats */}
      {started && !finished && (
        <motion.div
          className="absolute top-20 left-0 right-0 z-10 flex justify-center gap-8 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-white/30">
            <span className="text-white/60 font-medium text-sm">{wpm}</span> WPM
          </div>
          <div className="text-white/30">
            <span className="text-white/60 font-medium text-sm">{accuracy}%</span> accuracy
          </div>
          <div className="text-white/30">
            <span className="text-white/60 font-medium text-sm">{elapsed.toFixed(1)}s</span>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen px-6 py-24">
        <AnimatePresence mode="wait">
          {!finished ? (
            <motion.div
              key={`typing-${passageIndex}`}
              className="max-w-2xl w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Passage title */}
              <p className="text-white/20 text-xs tracking-widest uppercase mb-6 text-center">
                {passage.title}
              </p>

              {/* Text display */}
              <div
                ref={textRef}
                className="relative text-xl md:text-2xl leading-loose font-mono cursor-text"
                onClick={() => inputRef.current?.focus()}
              >
                {/* Smooth sliding caret */}
                {!finished && caretPos.ready && (
                  <motion.div
                    className="absolute w-0.5 rounded-full pointer-events-none z-10"
                    style={{
                      backgroundColor: "#FBBF24",
                      boxShadow: "0 0 8px rgba(251, 191, 36, 0.4)",
                    }}
                    animate={{
                      left: caretPos.left,
                      top: caretPos.top + 3,
                      height: caretPos.height - 6,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
                  />
                )}

                {charStates.map((cs, i) => (
                  <span
                    key={i}
                    data-idx={i}
                    className={
                      cs.status === "correct"
                        ? "text-white/80"
                        : cs.status === "incorrect"
                        ? "text-red-400 underline decoration-red-500/40 bg-red-500/10 rounded-sm"
                        : "text-white/20"
                    }
                  >
                    {cs.status === "incorrect" && cs.typed ? (
                      <span className="relative">
                        <span className="absolute -top-3 left-0 text-[0.5em] text-red-400/70 leading-none">{cs.typed}</span>
                        {cs.char === " " ? "\u00A0" : cs.char}
                      </span>
                    ) : cs.char}
                  </span>
                ))}
              </div>

              {/* Hint before first keystroke */}
              {!started && (
                <motion.p
                  className="text-white/20 text-xs text-center mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Start typing · Esc to skip
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="finished"
              className="text-center max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Celebration flower */}
              <motion.svg
                className="w-24 h-24 mx-auto mb-6"
                viewBox="0 0 100 100" fill="none"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
                  <ellipse key={a} cx="50" cy="22" rx="8" ry="22" fill={ratingColor}
                    transform={`rotate(${a} 50 50)`} opacity="0.2" />
                ))}
                <circle cx="50" cy="50" r="12" fill={ratingColor} opacity="0.3" />
                <circle cx="50" cy="50" r="6" fill={ratingColor} opacity="0.5" />
              </motion.svg>

              <motion.p
                className="text-xs tracking-widest uppercase mb-2"
                style={{ color: ratingColor }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {rating}
              </motion.p>

              <motion.div
                className="text-6xl font-light mb-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <span style={{ color: ratingColor }}>{wpm}</span>
              </motion.div>
              <p className="text-white/30 text-sm mb-2">words per minute</p>
              {showNewPB ? (
                <motion.p
                  className="text-xs font-medium tracking-wide mb-6"
                  style={{ color: "#FDE047" }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35, type: "spring" }}
                >
                  New personal best!
                </motion.p>
              ) : personalBest > 0 ? (
                <p className="text-white/15 text-xs mb-6">Best: {personalBest} WPM</p>
              ) : (
                <div className="mb-6" />
              )}

              <motion.div
                className="grid grid-cols-3 gap-6 mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div>
                  <p className="text-2xl font-light text-white/80">{accuracy}%</p>
                  <p className="text-white/30 text-xs">Accuracy</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-white/80">{elapsed.toFixed(1)}s</p>
                  <p className="text-white/30 text-xs">Time</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-white/80">{errors}</p>
                  <p className="text-white/30 text-xs">Errors</p>
                </div>
              </motion.div>

              {/* WPM sparkline */}
              {sparkline && (
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-white/20 text-xs mb-2">Speed over time</p>
                  <svg width="200" height="40" viewBox="0 0 200 40" className="mx-auto">
                    <path d={sparkline.area} fill={`${ratingColor}15`} />
                    <path
                      d={sparkline.line}
                      fill="none"
                      stroke={ratingColor}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.6"
                    />
                    <circle
                      cx={sparkline.last.x}
                      cy={sparkline.last.y}
                      r="2.5"
                      fill={ratingColor}
                      opacity="0.8"
                    />
                  </svg>
                </motion.div>
              )}

              {/* Difficult characters */}
              {difficultChars.length > 0 && (
                <motion.div
                  className="mb-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-white/20 text-xs mb-3">Tricky characters</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {difficultChars.map(({ char, errors: errs, errorRate }) => (
                      <div
                        key={char}
                        className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5"
                      >
                        <span
                          className="font-mono text-base"
                          style={{ color: `rgba(248, 113, 113, ${0.4 + errorRate * 0.6})` }}
                        >
                          {char === " " ? "\u2423" : char}
                        </span>
                        <span className="text-white/20 text-[10px]">
                          {errs} miss{errs > 1 ? "es" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div
                className="flex items-center justify-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={nextPassage}
                  className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10
                    hover:border-white/20 transition-all text-white/80 hover:text-white tracking-wide"
                >
                  Next
                </button>
              </motion.div>

              <motion.p
                className="text-white/15 text-xs mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                or press Enter
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
