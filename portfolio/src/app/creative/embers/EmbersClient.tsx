"use client";

// ─── Embers — Design Document ───────────────────────────────────────
//
// SCENE COMPOSITION
//   A coiled sword thrust downward into a pile of bones and ash.
//   Fire burns low at the base. Hundreds of cinders rise into a void.
//   The only light source in oppressive darkness. Sacred. Melancholic.
//
// THE COILED SWORD (drawCoiledSword)
//   A flat steel bar heated and physically twisted ~3.5 rotations.
//   Pommel at top → leather grip → straight cross-guard → twisted blade
//   buried in the ash. The twist is sold by oscillating apparent width
//   (cos of twist angle) and alternating bright/dark facets. The buried
//   portion glows with heat tempering. Fire reflects off edges from below.
//
// THE ASH MOUND
//   Smooth bezier silhouette with layered grey shading. Glow seams where
//   fire peeks through cracks. Bone fragments scattered on the surface.
//   Ground embers pulse across the ash — the earth itself is alive.
//
// CINDER PARTICLES (the hero system)
//   Up to 400 depth-layered particles rising from multiple sources:
//   60% fire center, 20% glow seams, 10% rune circle, 10% wider ash.
//   Each has: temperature-based color (white-hot → orange → red → dying),
//   depth-of-field bokeh, individual pulse rhythms, mouse parallax,
//   ghost trails, spiral drift that widens as they rise.
//   ~15% exhibit sword affinity (curve toward the blade briefly).
//   ~1.2% are "soul embers" — rare blue-white, brighter, longer-lived.
//
// RUNE CIRCLE
//   Faint perspective-correct ellipse on the ground with pulsing runic
//   marks. Cinders passing nearby brighten them with a warm halo.
//
// ATMOSPHERE
//   Crushing vignette. Tiny warm light pool. Light flicker system
//   (random brightness dips). Solemn breathing cycle. Film grain.
//   Low intimate flames. Thin backlit smoke. Grey ash flakes in wind.
//   Explosive sparks. Heat shimmer. Cinematic color wash.
//
// INTERACTION
//   Click → stoke surge (burst of cinders + flame flare)
//   Mouse → gentle wind influencing flames and cinder drift
//   Seed system → shareable URL-based scene variations
//
// ─────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────

interface Cinder {
  x: number; y: number;
  px: number; py: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  depth: number;
  phase: number;
  spiralAmp: number;
  spiralFreq: number;
  pulsePhase: number;
  temp: number; // 0=cool red, 1=white-hot
  isSoul: boolean; // rare blue-white "humanity" ember
  swordAffinity: number; // 0=none, >0 = drawn toward sword briefly
  hueShift: number; // per-ember color temperature offset
  turbSeed: number; // noise offset for organic movement
}

interface GroundEmber {
  x: number; y: number;
  size: number;
  phase: number;
  intensity: number;
  pulseSpeed: number;
}

interface FlameWisp {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  width: number; height: number;
  phase: number;
  freqs: number[];
  amps: number[];
  isCore: boolean;
}

interface FlameLayer {
  xOff: number;        // horizontal offset from fire center (normalized)
  yOff: number;        // vertical offset (normalized, negative = higher)
  radiusX: number;     // base horizontal radius (normalized)
  radiusY: number;     // base vertical radius (normalized)
  freqs: number[];     // oscillation frequencies [drift, sway, jitter]
  amps: number[];      // oscillation amplitudes
  phase: number;       // phase offset
  opacity: number;     // base opacity multiplier
  tier: "base" | "mid" | "wisp";
}

interface FlameHotspot {
  phase: number;
  freqX: number; freqY: number;
  ampX: number; ampY: number;
  radius: number;
  opacity: number;
}

interface SmokeTendril {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  size: number; maxSize: number;
  phase: number;
  turbFreq: number;
  opacity: number;
}

interface AshFlake {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  depth: number;
}

interface DustMote {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  size: number;
  phase: number;
  depth: number;
}

interface Spark {
  x: number; y: number;
  px: number; py: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
}

interface GlowSeam {
  x: number; y: number;
  width: number; height: number;
  angle: number;
  phase: number;
  intensity: number;
  pulseSpeed: number;
}

interface BoneFragment {
  x: number; y: number;
  length: number;
  angle: number;
  thickness: number;
}

interface SilhouetteData {
  // Pillars: xN = center offset in sw units from scene center, wN/hN in sw/vh units
  pillars: Array<{ xN: number; wN: number; hN: number; chips: number[] }>;
  // Arch spanning two pillar indices, null if no arch
  arch: { leftIdx: number; rightIdx: number; thickN: number } | null;
  // Distant tower behind the fire
  tower: { xN: number; wN: number; hN: number; merlons: number } | null;
}

interface MoundLayer {
  yOffset: number;
  points: { x: number; y: number }[];
  shade: number;
}

interface RuneMark {
  angle: number;
  symbol: number;
  size: number;
  phase: number;
  glow: number; // 0-1, boosted when cinders pass nearby, decays per frame
}

// ─── Constants ──────────────────────────────────────────────────────

const DEFAULT_SEED = 48271;
const TAU = Math.PI * 2;
const BREATH_PERIOD = 6; // seconds per breath cycle

const SEED_WORDS = [
  "rest", "ember", "vigil", "ash", "kindle",
  "coil", "flame", "dusk", "soul", "bonfire",
];

// ─── Utilities ──────────────────────────────────────────────────────

function seedToNumber(s: string): number {
  if (!s) return DEFAULT_SEED;
  const n = parseInt(s, 10);
  if (!isNaN(n) && n > 0 && String(n) === s.trim()) return n;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function noise(x: number, y: number, t: number): number {
  return Math.sin(x * 1.7 + t) * 0.5
    + Math.sin(y * 2.3 - t * 0.7) * 0.3
    + Math.sin((x + y) * 3.1 + t * 1.3) * 0.2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ─── Scene Generation ───────────────────────────────────────────────

function generateGlowSeams(seed: number): GlowSeam[] {
  const rng = seededRandom(seed);
  const seams: GlowSeam[] = [];
  const count = 12 + ((rng() * 8) | 0);
  for (let i = 0; i < count; i++) {
    const angle = rng() * TAU;
    const dist = rng() * 0.045;
    seams.push({
      x: 0.5 + Math.cos(angle) * dist,
      y: 0.72 + Math.sin(angle) * dist * 0.25 - rng() * 0.008,
      width: 0.004 + rng() * 0.012,
      height: 0.001 + rng() * 0.003,
      angle: rng() * Math.PI,
      phase: rng() * TAU,
      intensity: 0.3 + rng() * 0.7,
      pulseSpeed: 0.15 + rng() * 0.6,
    });
  }
  return seams;
}

function generateBoneFragments(seed: number): BoneFragment[] {
  const rng = seededRandom(seed);
  const bones: BoneFragment[] = [];
  const count = 5 + ((rng() * 4) | 0);
  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1;
    bones.push({
      x: 0.5 + side * (0.02 + rng() * 0.04),
      y: 0.725 + rng() * 0.015,
      length: 0.012 + rng() * 0.02,
      angle: side * (0.3 + rng() * 0.8) + (rng() - 0.5) * 0.2,
      thickness: 0.0015 + rng() * 0.002,
    });
  }
  return bones;
}

function generateFlameConfig(seed: number): { layers: FlameLayer[]; hotspots: FlameHotspot[] } {
  const rng = seededRandom(seed);
  const layers: FlameLayer[] = [];
  const hotspots: FlameHotspot[] = [];

  // Base glow bed — wide, warm, grounding the fire to the ash
  for (let i = 0; i < 3; i++) {
    layers.push({
      xOff: (rng() - 0.5) * 0.015,
      yOff: 0.001 + rng() * 0.003,
      radiusX: 0.028 + rng() * 0.018,
      radiusY: 0.012 + rng() * 0.008,
      freqs: [0.25 + rng() * 0.25, 0.7 + rng() * 0.4, 1.8 + rng() * 0.8],
      amps: [0.06 + rng() * 0.08, 0.03 + rng() * 0.04, 0.01 + rng() * 0.02],
      phase: rng() * TAU,
      opacity: 0.09 + rng() * 0.05,
      tier: "base",
    });
  }

  // Core tongues — upward-reaching, offset-gradient flames visible as individual licks
  for (let i = 0; i < 5 + ((rng() * 3) | 0); i++) {
    layers.push({
      xOff: (rng() - 0.5) * 0.025,
      yOff: -0.005 - rng() * 0.015,
      radiusX: 0.008 + rng() * 0.008,
      radiusY: 0.035 + rng() * 0.04,
      freqs: [0.4 + rng() * 0.5, 1.2 + rng() * 1.0, 3.0 + rng() * 2.0],
      amps: [0.18 + rng() * 0.25, 0.08 + rng() * 0.14, 0.03 + rng() * 0.06],
      phase: rng() * TAU,
      opacity: 0.06 + rng() * 0.05,
      tier: "mid",
    });
  }

  // Tall wisps — thin, slow dramatic sway, lick up around the sword
  for (let i = 0; i < 3 + ((rng() * 2) | 0); i++) {
    layers.push({
      xOff: (rng() - 0.5) * 0.018,
      yOff: -0.025 - rng() * 0.035,
      radiusX: 0.005 + rng() * 0.005,
      radiusY: 0.06 + rng() * 0.06,
      freqs: [0.15 + rng() * 0.2, 0.4 + rng() * 0.35, 0.9 + rng() * 0.5],
      amps: [0.22 + rng() * 0.3, 0.12 + rng() * 0.18, 0.05 + rng() * 0.08],
      phase: rng() * TAU,
      opacity: 0.035 + rng() * 0.03,
      tier: "wisp",
    });
  }

  // Flickering hotspots — quick-moving bright points in the flame body
  for (let i = 0; i < 5 + ((rng() * 4) | 0); i++) {
    hotspots.push({
      phase: rng() * TAU,
      freqX: 2.5 + rng() * 5.0,
      freqY: 2.0 + rng() * 4.0,
      ampX: 0.008 + rng() * 0.018,
      ampY: 0.004 + rng() * 0.016,
      radius: 0.003 + rng() * 0.007,
      opacity: 0.06 + rng() * 0.12,
    });
  }

  return { layers, hotspots };
}

function generateGroundEmbers(seed: number): GroundEmber[] {
  const rng = seededRandom(seed);
  const embers: GroundEmber[] = [];
  const count = 20 + ((rng() * 12) | 0);
  for (let i = 0; i < count; i++) {
    const angle = rng() * TAU;
    const dist = rng() * 0.07;
    embers.push({
      x: 0.5 + Math.cos(angle) * dist,
      y: 0.72 + Math.sin(angle) * dist * 0.25 - rng() * 0.005,
      size: 0.002 + rng() * 0.004,
      phase: rng() * TAU,
      intensity: 0.2 + rng() * 0.8,
      pulseSpeed: 0.1 + rng() * 0.5,
    });
  }
  return embers;
}

function generateRuneMarks(seed: number): RuneMark[] {
  const rng = seededRandom(seed);
  const marks: RuneMark[] = [];
  const count = 10 + ((rng() * 6) | 0);
  for (let i = 0; i < count; i++) {
    marks.push({
      angle: (i / count) * TAU + (rng() - 0.5) * 0.3,
      symbol: (rng() * 5) | 0,
      size: 0.003 + rng() * 0.004,
      phase: rng() * TAU,
      glow: 0,
    });
  }
  return marks;
}

function generateSilhouettes(seed: number): SilhouetteData {
  const rng = seededRandom(seed + 9900);
  const pillars: SilhouetteData["pillars"] = [];

  // Left side pillars: 2-3
  const leftCount = 2 + (rng() < 0.5 ? 1 : 0);
  const leftXs = [-0.47, -0.35, -0.26].slice(0, leftCount)
    .map(x => x + (rng() - 0.5) * 0.04);
  for (const xN of leftXs) {
    const chipCount = 3 + ((rng() * 3) | 0);
    const chips: number[] = [];
    for (let i = 0; i < chipCount; i++) chips.push(rng());
    pillars.push({ xN, wN: 0.016 + rng() * 0.014, hN: 0.28 + rng() * 0.32, chips });
  }

  // Right side pillars: 2-3
  const rightCount = 2 + (rng() < 0.5 ? 1 : 0);
  const rightXs = [0.26, 0.35, 0.47].slice(0, rightCount)
    .map(x => x + (rng() - 0.5) * 0.04);
  for (const xN of rightXs) {
    const chipCount = 3 + ((rng() * 3) | 0);
    const chips: number[] = [];
    for (let i = 0; i < chipCount; i++) chips.push(rng());
    pillars.push({ xN, wN: 0.016 + rng() * 0.014, hN: 0.28 + rng() * 0.32, chips });
  }

  // Optional arch: connect outermost left and right pillars
  const arch: SilhouetteData["arch"] = rng() < 0.55
    ? { leftIdx: 0, rightIdx: leftCount, thickN: 0.018 + rng() * 0.012 }
    : null;

  // Distant tower
  const tower: SilhouetteData["tower"] = rng() < 0.72
    ? {
        xN: (rng() - 0.5) * 0.12,
        wN: 0.04 + rng() * 0.03,
        hN: 0.52 + rng() * 0.28,
        merlons: 3 + ((rng() * 4) | 0),
      }
    : null;

  return { pillars, arch, tower };
}

function createGrainCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255;
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// ─── Sword Config ───────────────────────────────────────────────────

interface SwordConfig {
  lean: number;          // tilt angle
  twists: number;        // number of full blade rotations
  bladeWidthMul: number; // multiplier on blade max half-width
  taperRate: number;     // how fast the blade narrows (0.5–0.8)
  guardWidthMul: number; // multiplier on guard half-width
  qDroopMul: number;     // quillon droop multiplier
  qFlareMul: number;     // quillon flare multiplier
  pommelSides: number;   // polygon sides for pommel (4–8)
  pommelAspect: number;  // width/height ratio of pommel
  wrapCount: number;     // grip wrap line count
  hasFuller: boolean;    // whether the fuller is visible
  runeCount: number;     // 0–4 engravings
  runePositions: number[]; // t-values along blade
  runeTypes: number[];   // 0=diamond, 1=cross, 2=triangle, 3=circle
  forgeGrain: number;    // seed offset for forge texture noise
}

function generateSwordConfig(seed: number): SwordConfig {
  const rng = seededRandom(seed + 7777);
  const lean = -0.04 - rng() * 0.08;
  const twists = 2.5 + rng() * 2.0;
  const bladeWidthMul = 0.85 + rng() * 0.3;
  const taperRate = 0.5 + rng() * 0.3;
  const guardWidthMul = 0.8 + rng() * 0.4;
  const qDroopMul = 0.4 + rng() * 0.8;
  const qFlareMul = 0.3 + rng() * 0.7;
  const pommelSides = 4 + Math.floor(rng() * 5); // 4–8
  const pommelAspect = 0.7 + rng() * 0.6;
  const wrapCount = 6 + Math.floor(rng() * 5); // 6–10
  const hasFuller = rng() > 0.25;
  const runeCount = Math.floor(rng() * 4); // 0–3
  const runePositions: number[] = [];
  const runeTypes: number[] = [];
  for (let i = 0; i < runeCount; i++) {
    runePositions.push(0.08 + rng() * 0.45);
    runeTypes.push(Math.floor(rng() * 4));
  }
  // Sort rune positions so they don't overlap
  runePositions.sort((a, b) => a - b);
  const forgeGrain = rng() * 10000;
  return {
    lean, twists, bladeWidthMul, taperRate, guardWidthMul,
    qDroopMul, qFlareMul, pommelSides, pommelAspect,
    wrapCount, hasFuller, runeCount, runePositions, runeTypes, forgeGrain,
  };
}

// ─── Sword Drawing ──────────────────────────────────────────────────

function drawCoiledSword(
  ctx: CanvasRenderingContext2D,
  cx: number, ashY: number, vw: number, vh: number,
  time: number, intensity: number, breath: number,
  cfg: SwordConfig
) {
  const swordH = vh * 0.36;
  const bladeMaxW = vw * 0.011 * cfg.bladeWidthMul;
  const bladeMinW = vw * 0.0025;
  const guardHalfW = vw * 0.026 * cfg.guardWidthMul;

  // Layout top to bottom: pommel → grip → guard → twisted blade → tip (in ash)
  const pommelY = ashY - swordH;
  const pommelR = vw * 0.006;
  const gripTop = pommelY + pommelR * cfg.pommelAspect;
  const gripH = swordH * 0.18;
  const gripHalfW = vw * 0.005;
  const guardY = gripTop + gripH;
  const guardH = vh * 0.008;
  const bladeTop = guardY + guardH * 0.5;
  const tipY = ashY + vh * 0.03;
  const bladeLen = tipY - bladeTop;

  const sway = Math.sin(time * 0.22) * vw * 0.0004;

  ctx.save();
  ctx.translate(cx, ashY);
  ctx.rotate(cfg.lean);
  ctx.translate(-cx + sway, -ashY);

  const glowI = intensity * (0.3 + breath * 0.15);

  // ── 1. Fire aura around the blade ──
  ctx.globalCompositeOperation = "lighter";
  const aura = ctx.createLinearGradient(cx, pommelY, cx, tipY);
  aura.addColorStop(0, `rgba(200,90,25,${0.003 * glowI})`);
  aura.addColorStop(0.45, `rgba(230,110,35,${0.012 * glowI})`);
  aura.addColorStop(0.75, `rgba(255,130,45,${0.03 * glowI})`);
  aura.addColorStop(1, `rgba(220,70,15,${0.015 * glowI})`);
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.moveTo(cx - bladeMaxW * 4, pommelY);
  ctx.lineTo(cx + bladeMaxW * 4, pommelY);
  ctx.lineTo(cx + bladeMaxW * 5, tipY);
  ctx.lineTo(cx - bladeMaxW * 5, tipY);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // ── 2. Twisted blade — the coil ──
  // A flat bar of steel twisted ~3.5 full rotations along its axis.
  // When the flat face points at us: wide. When edge-on: narrow.
  // This creates the signature oscillating-width silhouette.
  const segments = 64;
  const twists = cfg.twists;

  const leftPts: { x: number; y: number }[] = [];
  const rightPts: { x: number; y: number }[] = [];
  const facets: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0=guard, 1=tip
    const y = bladeTop + t * bladeLen;
    const taper = 1 - t * cfg.taperRate;

    // The twist: cos gives us the apparent width as the flat bar rotates
    const twistAngle = t * twists * TAU;
    const apparent = Math.cos(twistAngle); // -1 to 1
    facets.push(apparent);
    // Map apparent width: when |cos|=1 we see the flat face (wide),
    // when cos=0 we see the edge (narrow)
    const halfW = bladeMinW + (bladeMaxW - bladeMinW) * Math.abs(apparent) * taper;

    // Slight lateral shift from the twist rotation
    const lateral = Math.sin(twistAngle) * bladeMaxW * 0.12 * taper;

    leftPts.push({ x: cx - halfW + lateral, y });
    rightPts.push({ x: cx + halfW + lateral, y });
  }

  // Helper: trace the blade silhouette path (used for fill and clipping)
  function traceBladePath() {
    ctx.beginPath();
    ctx.moveTo(rightPts[0].x, rightPts[0].y);
    for (let i = 1; i < rightPts.length; i++) {
      const prev = rightPts[i - 1], curr = rightPts[i];
      ctx.quadraticCurveTo((prev.x + curr.x) / 2, (prev.y + curr.y) / 2, curr.x, curr.y);
    }
    ctx.lineTo(cx, tipY + vh * 0.003);
    for (let i = leftPts.length - 1; i >= 0; i--) {
      const curr = leftPts[i], next = i > 0 ? leftPts[i - 1] : leftPts[0];
      ctx.quadraticCurveTo((curr.x + next.x) / 2, (curr.y + next.y) / 2, next.x, next.y);
    }
    ctx.closePath();
  }

  // Fill — dark tarnished steel, warming toward the buried end
  const bladeFill = ctx.createLinearGradient(cx, bladeTop, cx, tipY);
  bladeFill.addColorStop(0, "#1d1a15");
  bladeFill.addColorStop(0.5, "#1a1713");
  bladeFill.addColorStop(0.75, "#201810");
  bladeFill.addColorStop(0.9, "#2e1c0c");
  bladeFill.addColorStop(1, "#3d2008");
  ctx.fillStyle = bladeFill;

  traceBladePath();
  ctx.fill();

  // ── 2b. Fuller (blood groove) ──
  if (cfg.hasFuller) {
    ctx.save();
    traceBladePath();
    ctx.clip();
    ctx.lineWidth = Math.max(0.6, vw * 0.0008);
    for (let i = 0; i < segments; i++) {
      const facet = facets[i];
      if (facet < 0.2) continue;
      const t = i / segments;
      const taper = 1 - t * cfg.taperRate;
      const twistAngle = t * twists * TAU;
      const lateral = Math.sin(twistAngle) * bladeMaxW * 0.12 * taper;
      const y = bladeTop + t * bladeLen;
      const nextT = (i + 1) / segments;
      const nextY = bladeTop + nextT * bladeLen;
      const nextTaper = 1 - nextT * cfg.taperRate;
      const nextTwist = nextT * twists * TAU;
      const nextLat = Math.sin(nextTwist) * bladeMaxW * 0.12 * nextTaper;
      const alpha = (facet - 0.2) * 0.15 * taper;
      ctx.strokeStyle = `rgba(5,4,3,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(cx + lateral, y);
      ctx.lineTo(cx + nextLat, nextY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── 3. Twist shading — alternating light/dark facets ──
  // When cos > 0: flat face toward us (brighter). When cos < 0: away (darker).
  // This sells the 3D twisted-metal look.
  ctx.save();
  traceBladePath();
  ctx.clip();

  // Seeded noise for forge-scale texture
  const forgeNoise = (i: number) => Math.sin(i * 127.1 + cfg.forgeGrain) * 43758.5453 % 1;

  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const y = bladeTop + t * bladeLen;
    const nextY = bladeTop + ((i + 1) / segments) * bladeLen;
    const twistAngle = t * twists * TAU;
    const facet = Math.cos(twistAngle);
    const taper = 1 - t * cfg.taperRate;
    const heatTint = t * t; // quadratic — accelerates near the fire

    // Crawling specular band — firelight catches different facets over time
    const specPos = 0.5 + Math.sin(time * TAU / BREATH_PERIOD * 0.5) * 0.4;
    const specDist = Math.abs(t - specPos);
    const specular = Math.max(0, 1 - specDist * 4) * facet * taper * glowI;

    // Per-segment forge texture noise (±15 RGB)
    const noise = forgeNoise(i) * 30 - 15;

    if (facet > 0.05) {
      // Bright facet — flat face toward viewer, lit by fire from below
      const bright = facet * (0.09 + heatTint * 0.14) * taper + specular * 0.1;
      const r = Math.min(255, Math.max(0, Math.round(55 + heatTint * 120 + specular * 80 + noise)));
      const g = Math.min(255, Math.max(0, Math.round(45 + heatTint * 30 - heatTint * heatTint * 20 + specular * 50 + noise * 0.6)));
      const b = Math.min(255, Math.max(0, Math.round(35 - heatTint * 25 + specular * 30 + noise * 0.3)));
      ctx.fillStyle = `rgba(${r},${g},${b},${bright})`;
      ctx.fillRect(cx - bladeMaxW * 1.5, y, bladeMaxW * 3, nextY - y);
    } else if (facet < -0.05) {
      // Dark facet — facing away, deeper shadow
      const dark = Math.abs(facet) * 0.09 * taper;
      ctx.fillStyle = `rgba(2,1,0,${dark})`;
      ctx.fillRect(cx - bladeMaxW * 1.5, y, bladeMaxW * 3, nextY - y);
    }
  }

  // ── 3b. Blade engravings ──
  if (cfg.runeCount > 0) {
    const engraveAlpha = 0.08 + breath * 0.18 * glowI;
    const engraveGlow = breath * glowI;
    ctx.lineWidth = Math.max(0.7, vw * 0.001);
    ctx.lineCap = "round";

    for (let ri = 0; ri < cfg.runeCount; ri++) {
      const runeT = cfg.runePositions[ri];
      const runeType = cfg.runeTypes[ri];
      const runeY = bladeTop + runeT * bladeLen;
      const runeFacet = Math.cos(runeT * twists * TAU);
      if (runeFacet < 0.3) continue;
      const runeTaper = 1 - runeT * cfg.taperRate;
      const runeW = bladeMaxW * runeTaper * 0.4;
      const twistLat = Math.sin(runeT * twists * TAU) * bladeMaxW * 0.12 * runeTaper;
      const rx = cx + twistLat;

      const rDark = Math.round(20 + engraveGlow * 200);
      const gDark = Math.round(12 + engraveGlow * 90);
      const bDark = Math.round(8 + engraveGlow * 20);
      ctx.strokeStyle = `rgba(${rDark},${gDark},${bDark},${engraveAlpha * (runeFacet - 0.3) * 1.4})`;

      ctx.beginPath();
      if (runeType === 0) {
        // Diamond
        ctx.moveTo(rx, runeY - runeW * 1.2);
        ctx.lineTo(rx + runeW * 0.6, runeY);
        ctx.lineTo(rx, runeY + runeW * 1.2);
        ctx.lineTo(rx - runeW * 0.6, runeY);
        ctx.closePath();
      } else if (runeType === 1) {
        // Cross
        ctx.moveTo(rx - runeW * 0.5, runeY);
        ctx.lineTo(rx + runeW * 0.5, runeY);
        ctx.moveTo(rx, runeY - runeW * 0.8);
        ctx.lineTo(rx, runeY + runeW * 0.8);
      } else if (runeType === 2) {
        // Triangle
        ctx.moveTo(rx, runeY - runeW);
        ctx.lineTo(rx + runeW * 0.6, runeY + runeW * 0.6);
        ctx.lineTo(rx - runeW * 0.6, runeY + runeW * 0.6);
        ctx.closePath();
      } else {
        // Circle
        ctx.arc(rx, runeY, runeW * 0.6, 0, TAU);
      }
      ctx.stroke();
    }
    ctx.lineCap = "butt";
  }

  ctx.restore();

  // ── 4. Edge highlights — fire catching the lower blade edges ──
  // Rendered as soft fills instead of stroked lines to avoid harsh edges
  ctx.globalCompositeOperation = "lighter";

  const edgeStart = Math.floor(segments * 0.6);

  for (let i = edgeStart; i < segments; i++) {
    const t = i / segments;
    const nextT = (i + 1) / segments;
    const heatFade = (t - edgeStart / segments) / (1 - edgeStart / segments);
    const edgeAlpha = heatFade * heatFade * 0.012 * glowI;
    if (edgeAlpha < 0.001) continue;
    const y = bladeTop + t * bladeLen;
    const nextY = bladeTop + nextT * bladeLen;
    ctx.fillStyle = `rgba(200,100,40,${edgeAlpha})`;
    ctx.fillRect(cx - bladeMaxW * 1.2, y, bladeMaxW * 2.4, nextY - y);
  }

  // Heat glow where blade enters the ash — throbs with the breath cycle
  const heatTop = bladeTop + bladeLen * 0.72;
  const heatPulse = 1 + Math.sin(time * TAU / BREATH_PERIOD) * 0.18
    + Math.sin(time * 1.7) * 0.08;
  const heatI = glowI * heatPulse;
  const heatGlow = ctx.createLinearGradient(cx, heatTop, cx, tipY);
  heatGlow.addColorStop(0, "rgba(160,40,4,0)");
  heatGlow.addColorStop(0.35, `rgba(210,70,12,${0.025 * heatI})`);
  heatGlow.addColorStop(0.7, `rgba(245,95,18,${0.04 * heatI})`);
  heatGlow.addColorStop(1, `rgba(255,110,25,${0.025 * heatI})`);
  ctx.fillStyle = heatGlow;
  ctx.fillRect(cx - bladeMaxW * 1.8, heatTop, bladeMaxW * 3.6, tipY - heatTop);

  // ── 4b. Heat temper color bands on buried blade ──
  // Metallurgical progression: hottest at tip (white/straw) → gold → purple → blue → dark steel
  // Drawn in source-over to avoid additive blowout from "lighter" mode
  ctx.globalCompositeOperation = "source-over";
  ctx.save();
  traceBladePath();
  ctx.clip();
  const temperTop = bladeTop + bladeLen * 0.65;
  const temperH = tipY - temperTop;
  const temperBands: [number, string][] = [
    [0.00, `rgba(80,90,130,${0.06 * heatI})`],    // blue (coolest)
    [0.15, `rgba(100,60,120,${0.07 * heatI})`],    // purple
    [0.30, `rgba(90,55,90,${0.06 * heatI})`],      // brown-purple
    [0.45, `rgba(120,80,20,${0.08 * heatI})`],     // brown
    [0.60, `rgba(180,140,40,${0.09 * heatI})`],    // gold
    [0.75, `rgba(210,190,80,${0.10 * heatI})`],    // straw
    [0.90, `rgba(240,220,160,${0.11 * heatI})`],   // white-straw (hottest)
  ];
  for (let b = 0; b < temperBands.length; b++) {
    const [pos, color] = temperBands[b];
    const nextPos = b < temperBands.length - 1 ? temperBands[b + 1][0] : 1.0;
    const bandY = temperTop + pos * temperH;
    const bandH = (nextPos - pos) * temperH;
    ctx.fillStyle = color;
    ctx.fillRect(cx - bladeMaxW * 1.5, bandY, bladeMaxW * 3, bandH);
  }
  ctx.restore();

  // ── 4c. Molten drip at blade tip ──
  const dripPulse = 0.5 + Math.sin(time * TAU / BREATH_PERIOD * 1.2) * 0.4
    + Math.sin(time * 2.3) * 0.1;
  const dripI = glowI * dripPulse;
  ctx.globalCompositeOperation = "lighter";
  for (let d = 0; d < 2; d++) {
    const dx = cx + (d === 0 ? -bladeMinW * 0.6 : bladeMinW * 0.8);
    const dy = tipY - vh * 0.002 + d * vh * 0.004;
    const dr = vw * 0.0015 * (0.8 + d * 0.3);
    const dripGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr);
    dripGrad.addColorStop(0, `rgba(255,200,80,${0.15 * dripI})`);
    dripGrad.addColorStop(0.4, `rgba(255,130,30,${0.10 * dripI})`);
    dripGrad.addColorStop(1, `rgba(200,60,5,0)`);
    ctx.fillStyle = dripGrad;
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, TAU);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";

  // ── 5. Cross-guard — curved bar with flared quillons ──
  const guardFill = ctx.createLinearGradient(cx - guardHalfW, guardY, cx + guardHalfW, guardY);
  guardFill.addColorStop(0, "#0e0c09");
  guardFill.addColorStop(0.2, "#191613");
  guardFill.addColorStop(0.5, "#1c1916");
  guardFill.addColorStop(0.8, "#191613");
  guardFill.addColorStop(1, "#0e0c09");
  ctx.fillStyle = guardFill;

  // Shaped guard with bezier quillons that sweep downward and flare at tips
  const gThick = guardH * 0.45;
  const qFlare = guardH * 0.6 * cfg.qFlareMul;
  const qDroop = guardH * 0.7 * cfg.qDroopMul;
  ctx.beginPath();
  // Top edge — slight upward curve
  ctx.moveTo(cx - guardHalfW, guardY - gThick + qDroop * 0.5);
  ctx.bezierCurveTo(
    cx - guardHalfW * 0.5, guardY - gThick - guardH * 0.15,
    cx + guardHalfW * 0.5, guardY - gThick - guardH * 0.15,
    cx + guardHalfW, guardY - gThick + qDroop * 0.5
  );
  // Right quillon tip — flares outward and droops
  ctx.bezierCurveTo(
    cx + guardHalfW + qFlare * 0.3, guardY - gThick + qDroop * 0.6,
    cx + guardHalfW + qFlare * 0.2, guardY + gThick + qDroop * 0.4,
    cx + guardHalfW, guardY + gThick + qDroop * 0.5
  );
  // Bottom edge — slight downward curve
  ctx.bezierCurveTo(
    cx + guardHalfW * 0.5, guardY + gThick + guardH * 0.1,
    cx - guardHalfW * 0.5, guardY + gThick + guardH * 0.1,
    cx - guardHalfW, guardY + gThick + qDroop * 0.5
  );
  // Left quillon tip — mirrors right
  ctx.bezierCurveTo(
    cx - guardHalfW - qFlare * 0.2, guardY + gThick + qDroop * 0.4,
    cx - guardHalfW - qFlare * 0.3, guardY - gThick + qDroop * 0.6,
    cx - guardHalfW, guardY - gThick + qDroop * 0.5
  );
  ctx.closePath();
  ctx.fill();

  // Center boss — small raised circle where blade passes through guard
  const bossR = guardH * 0.4;
  const bossGrad = ctx.createRadialGradient(
    cx - bossR * 0.2, guardY - bossR * 0.15, bossR * 0.1,
    cx, guardY, bossR
  );
  bossGrad.addColorStop(0, "#252218");
  bossGrad.addColorStop(0.6, "#1a1714");
  bossGrad.addColorStop(1, "#12100d");
  ctx.fillStyle = bossGrad;
  ctx.beginPath();
  ctx.arc(cx, guardY, bossR, 0, TAU);
  ctx.fill();

  // Guard fire glow from below — soft radial falloff
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = glowI * 0.07;
  const guardGlowGrad = ctx.createRadialGradient(cx, guardY + guardH * 0.3, 0, cx, guardY + guardH * 0.3, guardHalfW * 1.3);
  guardGlowGrad.addColorStop(0, "rgba(255,140,55,1)");
  guardGlowGrad.addColorStop(0.3, "rgba(220,90,25,0.7)");
  guardGlowGrad.addColorStop(0.7, "rgba(150,45,6,0.25)");
  guardGlowGrad.addColorStop(1, "rgba(80,20,2,0)");
  ctx.fillStyle = guardGlowGrad;
  ctx.beginPath();
  ctx.arc(cx, guardY + guardH * 0.3, guardHalfW * 1.3, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  // ── 6. Grip — leather-wrapped ──
  ctx.fillStyle = "#100e0c";
  ctx.beginPath();
  ctx.roundRect(cx - gripHalfW, gripTop, gripHalfW * 2, gripH, gripHalfW * 0.3);
  ctx.fill();

  // Wrap lines
  ctx.strokeStyle = "rgba(6,5,3,0.5)";
  ctx.lineWidth = 0.7;
  const wrapCount = cfg.wrapCount;
  for (let w = 0; w < wrapCount; w++) {
    const wy = gripTop + (w + 0.35) * (gripH / wrapCount);
    ctx.beginPath();
    ctx.moveTo(cx - gripHalfW * 0.7, wy);
    ctx.lineTo(cx + gripHalfW * 0.7, wy + gripH / wrapCount * 0.35);
    ctx.stroke();
  }

  // Grip fire glow
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = glowI * 0.025;
  const gripGlow = ctx.createLinearGradient(cx, gripTop + gripH, cx, gripTop);
  gripGlow.addColorStop(0, "rgba(255,110,30,1)");
  gripGlow.addColorStop(0.5, "rgba(180,55,10,0.4)");
  gripGlow.addColorStop(1, "rgba(120,30,4,0)");
  ctx.fillStyle = gripGlow;
  ctx.fillRect(cx - gripHalfW * 2, gripTop, gripHalfW * 4, gripH);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  // ── 7. Pommel — faceted hexagonal/diamond form with inset ring ──
  const pommelGrad = ctx.createRadialGradient(
    cx - pommelR * 0.15, pommelY - pommelR * 0.1, pommelR * 0.1,
    cx, pommelY, pommelR
  );
  pommelGrad.addColorStop(0, "#201e18");
  pommelGrad.addColorStop(0.5, "#161412");
  pommelGrad.addColorStop(0.85, "#100e0c");
  pommelGrad.addColorStop(1, "#0c0a08");
  ctx.fillStyle = pommelGrad;

  // Faceted pommel — shape varies by seed
  const pWide = pommelR * (0.9 + cfg.pommelAspect * 0.5);
  const pTall = pommelR * (1.3 - cfg.pommelAspect * 0.5);
  const pSides = cfg.pommelSides;
  ctx.beginPath();
  for (let i = 0; i < pSides; i++) {
    const angle = (i / pSides) * TAU - TAU / (pSides * 2);
    const px = cx + Math.cos(angle) * pWide;
    const py = pommelY + Math.sin(angle) * pTall;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Inset ring — catches firelight differently
  ctx.strokeStyle = "#0a0908";
  ctx.lineWidth = Math.max(0.5, vw * 0.0006);
  ctx.beginPath();
  ctx.arc(cx, pommelY, pommelR * 0.55, 0, TAU);
  ctx.stroke();

  // Bright inner ring edge (fire-lit side)
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(140,70,25,${0.025 * glowI})`;
  ctx.lineWidth = Math.max(0.4, vw * 0.0004);
  ctx.beginPath();
  ctx.arc(cx, pommelY, pommelR * 0.55, Math.PI * 0.3, Math.PI * 0.9);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  // Pommel underlight from fire
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = glowI * 0.03;
  const pGlow = ctx.createRadialGradient(cx, pommelY + pommelR * 0.5, 0, cx, pommelY + pommelR * 0.5, pommelR * 1.5);
  pGlow.addColorStop(0, "rgba(255,120,35,1)");
  pGlow.addColorStop(0.6, "rgba(180,55,10,0.4)");
  pGlow.addColorStop(1, "rgba(120,30,4,0)");
  ctx.fillStyle = pGlow;
  ctx.beginPath();
  ctx.arc(cx, pommelY + pommelR * 0.5, pommelR * 1.5, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  // ── 8. Blade flames — soft glows along the blade edges ──
  ctx.globalCompositeOperation = "lighter";
  const bladeGlowCount = 7;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < bladeGlowCount; i++) {
      const ft = (i + 0.5) / bladeGlowCount;
      const srcIdx = Math.min(Math.floor(ft * segments), segments - 1);
      const pts = side < 0 ? leftPts : rightPts;
      const baseX = pts[srcIdx].x;
      const baseY = pts[srcIdx].y;

      const heatFactor = ft * ft;
      const phase = i * 2.7 + cfg.forgeGrain * 0.01;
      const osc = Math.sin(time * 3.5 + phase) * 0.3
        + Math.sin(time * 6.2 + phase * 1.3) * 0.2
        + Math.sin(time * 1.8 + phase * 0.7) * 0.15;

      const glowR = bladeMaxW * (1.5 + heatFactor * 3.5) * (0.6 + breath * 0.4) * glowI;
      if (glowR < bladeMaxW * 0.4) continue;

      const sway = Math.sin(time * 2.5 + phase * 1.5) * glowR * 0.15;
      const gx = baseX + side * bladeMaxW * 0.5 + sway;
      const gy = baseY - glowR * 0.2;

      const fAlpha = (0.02 + heatFactor * 0.04) * glowI * (0.7 + breath * 0.3);

      const fg = ctx.createRadialGradient(gx, gy, 0, gx, gy, glowR);
      fg.addColorStop(0, `rgba(220,140,60,${fAlpha * 0.6})`);
      fg.addColorStop(0.2, `rgba(200,90,25,${fAlpha * 0.3})`);
      fg.addColorStop(0.45, `rgba(160,50,8,${fAlpha * 0.12})`);
      fg.addColorStop(0.75, `rgba(100,20,2,${fAlpha * 0.02})`);
      fg.addColorStop(1, "rgba(50,6,0,0)");
      ctx.fillStyle = fg;
      ctx.fillRect(gx - glowR, gy - glowR, glowR * 2, glowR * 2);
    }
  }
  ctx.globalCompositeOperation = "source-over";

  ctx.restore();
}

// ─── Component ──────────────────────────────────────────────────────

export default function EmbersClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cindersRef = useRef<Cinder[]>([]);
  const flameTonguesRef = useRef<FlameWisp[]>([]);
  const smokesRef = useRef<SmokeTendril[]>([]);
  const ashFlakesRef = useRef<AshFlake[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const glowSeamsRef = useRef<GlowSeam[]>([]);
  const bonesRef = useRef<BoneFragment[]>([]);
  const flameConfigRef = useRef<ReturnType<typeof generateFlameConfig>>({ layers: [], hotspots: [] });
  const runeMarksRef = useRef<RuneMark[]>([]);
  const groundEmbersRef = useRef<GroundEmber[]>([]);
  const swordConfigRef = useRef<SwordConfig>(generateSwordConfig(DEFAULT_SEED));
  const silhouetteRef = useRef<SilhouetteData>(generateSilhouettes(DEFAULT_SEED));
  const grainRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const dustMotesRef = useRef<DustMote[]>([]);
  const stokeRef = useRef(0);
  const stokePulseRef = useRef(0);
  const shakeRef = useRef({ x: 0, y: 0, frames: 0 });
  const surgeRef = useRef(0);
  const nextSurgeRef = useRef(20 + Math.random() * 30);
  const swordGlowRef = useRef(0);
  const shockwaveRef = useRef(0); // 0–1, decays per frame
  const flickerRef = useRef(0);
  const frameRef = useRef<number>(0);
  const bgCanvasRef = useRef<OffscreenCanvas | HTMLCanvasElement | null>(null);
  const bgDirtyRef = useRef(true);
  const fireLifeRef = useRef(0.15);
  const warmthAccumRef = useRef(0);
  const sustainedRef = useRef(false);
  const clickCountRef = useRef(0);
  const activatedRef = useRef(false);
  const colorTempRef = useRef(0);           // 0 = breathing cold, 1 = activated hot
  const activationPulseRef = useRef(0);    // 1.0 on activate → decays to 0 over ~1.2s
  const deactivationPulseRef = useRef(0);  // 1.0 on deactivate → decays to 0 over ~0.8s
  const peakFireLifeRef = useRef(0.15);
  const [showHint, setShowHint] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [seed, setSeed] = useState(String(DEFAULT_SEED));

  useEffect(() => {
    const redirected = sessionStorage.getItem("embers-seed");
    if (redirected) { sessionStorage.removeItem("embers-seed"); setSeed(redirected); return; }
    const match = window.location.pathname.match(/\/creative\/embers\/([^/]+)/);
    if (match?.[1]) setSeed(decodeURIComponent(match[1]));
  }, []);

  useEffect(() => {
    const trimmed = seed.trim();
    const base = "/creative/embers/";
    const target = trimmed && trimmed !== String(DEFAULT_SEED)
      ? `${base}${encodeURIComponent(trimmed)}/`
      : base;
    if (window.location.pathname !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [seed]);

  useEffect(() => {
    const n = seedToNumber(seed);
    glowSeamsRef.current = generateGlowSeams(n);
    bonesRef.current = generateBoneFragments(n);
    flameConfigRef.current = generateFlameConfig(n);
    runeMarksRef.current = generateRuneMarks(n);
    groundEmbersRef.current = generateGroundEmbers(n);
    swordConfigRef.current = generateSwordConfig(n);
    silhouetteRef.current = generateSilhouettes(n);
    cindersRef.current.length = 0;
    flameTonguesRef.current.length = 0;
    smokesRef.current.length = 0;
    ashFlakesRef.current.length = 0;
    sparksRef.current.length = 0;
    dustMotesRef.current.length = 0;
    bgDirtyRef.current = true;
  }, [seed]);

  const stokeBurstRef = useRef(0);
  const handleClick = useCallback(() => {
    const wasActivated = activatedRef.current;
    activatedRef.current = !wasActivated;

    const vw = window.innerWidth, vh = window.innerHeight;
    const fcx = vw * 0.5, fcy = vh * 0.695;

    if (!wasActivated) {
      // ACTIVATE — fire catches, jump state then lerp to target
      activationPulseRef.current = 1.0;
      fireLifeRef.current = Math.min(fireLifeRef.current + 0.55, 1.0);
      colorTempRef.current = Math.min(colorTempRef.current + 0.5, 1.0);
      // Burst embers upward
      for (const c of cindersRef.current) {
        c.vy -= 0.25 + Math.random() * 0.45;
        c.vx += (Math.random() - 0.5) * 0.25;
      }
    } else {
      // DEACTIVATE — fire snuffed, scatter then fall
      deactivationPulseRef.current = 1.0;
      fireLifeRef.current = Math.max(fireLifeRef.current - 0.55, 0.0);
      colorTempRef.current = Math.max(colorTempRef.current - 0.5, 0.0);
      // Push embers outward and downward — fire collapses
      for (const c of cindersRef.current) {
        const dx = c.x - fcx, dy = c.y - fcy;
        const dist = Math.hypot(dx, dy) || 1;
        const push = 0.25 + Math.random() * 0.25;
        c.vx += (dx / dist) * push;
        c.vy += (dy / dist) * push * 0.5 + 0.15 + Math.random() * 0.2;
      }
    }

    clickCountRef.current += 1;
    if (clickCountRef.current === 1) {
      setShowControls(true);
      setShowHint(false);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let dpr = 1, vw = 0, vh = 0, isMobile = false, hidden = false;
    let lastTime = performance.now() / 1000;
    let maxCinders = 400, maxSparks = 50, maxSmokes = 30, maxAshFlakes = 60;

    // Bonfire center — slightly above vertical center for grounded feel
    const fireCX = 0.5, fireCY = 0.695;

    grainRef.current = createGrainCanvas(256, 256);

    function createOffscreen(w: number, h: number) {
      try { return new OffscreenCanvas(w, h); }
      catch { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
    }

    function renderBackground(target: OffscreenCanvas | HTMLCanvasElement) {
      const bgCtx = target.getContext("2d")! as CanvasRenderingContext2D;
      bgCtx.clearRect(0, 0, target.width, target.height);
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Absolute void — oppressive darkness
      const bgGrad = bgCtx.createLinearGradient(0, 0, 0, vh);
      bgGrad.addColorStop(0, "#010101");
      bgGrad.addColorStop(0.3, "#020201");
      bgGrad.addColorStop(0.6, "#030202");
      bgGrad.addColorStop(0.8, "#050403");
      bgGrad.addColorStop(1, "#060504");
      bgCtx.fillStyle = bgGrad;
      bgCtx.fillRect(0, 0, vw, vh);

      // Ground plane — barely suggested earth
      const groundY = vh * 0.76;
      const gGrad = bgCtx.createLinearGradient(0, groundY - vh * 0.01, 0, vh);
      gGrad.addColorStop(0, "rgba(6,5,3,0)");
      gGrad.addColorStop(0.1, "rgba(8,6,4,0.2)");
      gGrad.addColorStop(0.5, "rgba(6,5,3,0.35)");
      gGrad.addColorStop(1, "rgba(4,3,2,0.5)");
      bgCtx.fillStyle = gGrad;
      bgCtx.fillRect(0, groundY - vh * 0.01, vw, vh * 0.25);

      // Silhouetted stone architecture — drawn before vignette so edges fade naturally
      {
        const sil = silhouetteRef.current;
        const sw = Math.min(vw, vh * 1.4);
        const sOffX = (vw - sw) / 2;
        const groundY = vh * 0.76;

        // Helper: pillar top with broken chips
        function drawPillar(
          px: number, pw: number, ptop: number,
          chips: number[]
        ) {
          const halfW = pw / 2;
          // Jagged top — chips bite into the top edge
          bgCtx.beginPath();
          bgCtx.moveTo(px - halfW, groundY);
          bgCtx.lineTo(px - halfW, ptop);
          // Walk across the top with chips
          const chipW = pw / (chips.length + 1);
          for (let i = 0; i < chips.length; i++) {
            const cx = px - halfW + chipW * (i + 0.5 + (chips[i] - 0.5) * 0.6);
            const depth = chips[i] * pw * 0.35;
            bgCtx.lineTo(cx - chipW * 0.3, ptop);
            bgCtx.lineTo(cx, ptop + depth);
            bgCtx.lineTo(cx + chipW * 0.3, ptop);
          }
          bgCtx.lineTo(px + halfW, ptop);
          bgCtx.lineTo(px + halfW, groundY);
          bgCtx.closePath();
          bgCtx.fill();
        }

        // Distant tower — drawn first so pillars overlay it
        if (sil.tower) {
          const t = sil.tower;
          const tx = sOffX + sw * (0.5 + t.xN);
          const tw = sw * t.wN;
          const ttop = groundY - vh * t.hN;
          bgCtx.fillStyle = "rgba(5,4,3,0.55)";
          bgCtx.fillRect(tx - tw / 2, ttop, tw, groundY - ttop);
          // Battlements
          const bw = tw / (t.merlons * 2);
          bgCtx.fillStyle = "rgba(5,4,3,0.55)";
          for (let i = 0; i < t.merlons; i++) {
            bgCtx.fillRect(tx - tw / 2 + i * bw * 2, ttop - vh * 0.012, bw, vh * 0.012);
          }
        }

        // Arch — behind the pillars
        if (sil.arch && sil.pillars[sil.arch.leftIdx] && sil.pillars[sil.arch.rightIdx]) {
          const lp = sil.pillars[sil.arch.leftIdx];
          const rp = sil.pillars[sil.arch.rightIdx];
          const lx = sOffX + sw * (0.5 + lp.xN) + sw * lp.wN / 2;
          const rx = sOffX + sw * (0.5 + rp.xN) - sw * rp.wN / 2;
          const archTop = groundY - vh * Math.min(lp.hN, rp.hN) * 0.85;
          const thick = vh * sil.arch.thickN;
          bgCtx.fillStyle = "rgba(7,5,3,0.6)";
          // Lintel block
          bgCtx.fillRect(lx, archTop - thick, rx - lx, thick);
        }

        // Pillars
        bgCtx.fillStyle = "rgba(8,6,4,0.75)";
        for (const p of sil.pillars) {
          const px = sOffX + sw * (0.5 + p.xN);
          const pw = sw * p.wN;
          const ptop = groundY - vh * p.hN;
          drawPillar(px, pw, ptop, p.chips);
        }
      }

      // Crushing vignette — darkness presses inward
      const vigGrad = bgCtx.createRadialGradient(
        vw * 0.5, vh * 0.68, vh * 0.04,
        vw * 0.5, vh * 0.5, vh * 1.05
      );
      vigGrad.addColorStop(0, "rgba(0,0,0,0)");
      vigGrad.addColorStop(0.15, "rgba(0,0,0,0.02)");
      vigGrad.addColorStop(0.35, "rgba(0,0,0,0.15)");
      vigGrad.addColorStop(0.55, "rgba(0,0,0,0.45)");
      vigGrad.addColorStop(0.75, "rgba(0,0,0,0.72)");
      vigGrad.addColorStop(1, "rgba(0,0,0,0.92)");
      bgCtx.fillStyle = vigGrad;
      bgCtx.fillRect(0, 0, vw, vh);
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      vw = window.innerWidth; vh = window.innerHeight;
      canvas.width = vw * dpr; canvas.height = vh * dpr;
      canvas.style.width = `${vw}px`; canvas.style.height = `${vh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      isMobile = vw < 768;
      maxCinders = isMobile ? 200 : 400;
      maxSparks = isMobile ? 25 : 50;
      maxSmokes = isMobile ? 15 : 30;
      maxAshFlakes = isMobile ? 30 : 60;
      bgCanvasRef.current = createOffscreen(vw * dpr, vh * dpr);
      bgDirtyRef.current = true;
    };
    resize();
    window.addEventListener("resize", resize);

    const onVis = () => { hidden = document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (hidden) return;

      const nowSec = performance.now() / 1000;
      const dt = Math.min(nowSec - lastTime, 0.05);
      lastTime = nowSec;
      const time = nowSec;
      const fcx = fireCX * vw, fcy = fireCY * vh;
      const sw = Math.min(vw, vh * 1.4);
      const sOffX = (vw - sw) / 2;

      // Stoke decay
      const stoke = stokeRef.current;
      stokeRef.current *= 0.975;
      if (stokeRef.current < 0.005) stokeRef.current = 0;

      // Stoke bloom pulse decay
      const stokePulse = stokePulseRef.current;
      stokePulseRef.current *= 0.88;
      if (stokePulseRef.current < 0.005) stokePulseRef.current = 0;

      // Camera shake decay
      const shake = shakeRef.current;
      if (shake.frames > 0) {
        shake.x *= -0.7; shake.y *= -0.7;
        shake.frames--;
      } else {
        shake.x = 0; shake.y = 0;
      }

      // Light flicker — occasional random dips
      if (Math.random() < 0.008) flickerRef.current = 0.15 + Math.random() * 0.25;
      flickerRef.current *= 0.94;
      const flicker = flickerRef.current;

      // Fire life — activation is fast; deactivation is now also responsive
      const targetLife = activatedRef.current ? 0.95 : 0.08;
      const lerpRate = activatedRef.current ? 0.55 : 0.55;
      fireLifeRef.current += (targetLife - fireLifeRef.current) * Math.min(dt * lerpRate, 0.06);

      // Color temperature — qualitative feel, not just brightness
      const colorTempTarget = activatedRef.current ? 1.0 : 0.0;
      const colorTempRate = activatedRef.current ? 0.7 : 0.65;
      colorTempRef.current += (colorTempTarget - colorTempRef.current) * Math.min(dt * colorTempRate, 0.06);
      const colorTemp = colorTempRef.current;

      // Activation pulse — ignition ring, decays ~1.2s
      if (activationPulseRef.current > 0.005) {
        activationPulseRef.current *= Math.pow(0.018, dt);
      } else {
        activationPulseRef.current = 0;
      }
      // Deactivation pulse — snuff ring, decays ~0.8s
      if (deactivationPulseRef.current > 0.005) {
        deactivationPulseRef.current *= Math.pow(0.006, dt);
      } else {
        deactivationPulseRef.current = 0;
      }
      const fireLife = fireLifeRef.current;
      if (fireLife > peakFireLifeRef.current) peakFireLifeRef.current = fireLife;

      // Warmth accumulation — reward sustained presence
      if (fireLife > 0.7) {
        warmthAccumRef.current += dt;
        if (warmthAccumRef.current >= 10 && !sustainedRef.current) {
          sustainedRef.current = true;
        }
      }

      // Solemn breathing
      const breathRaw = Math.sin(time * TAU / BREATH_PERIOD);
      const breath = breathRaw * 0.5 + 0.5;

      // Global intensity — scaled by fireLife
      const baseI = (0.48 + breath * 0.20 + Math.sin(time * 1.1) * 0.015) * fireLife;
      // Autonomous fire surges — the fire breathes on its own
      nextSurgeRef.current -= dt;
      if (nextSurgeRef.current <= 0) {
        surgeRef.current = 0.3 + Math.random() * 0.25;
        fireLifeRef.current = Math.min(fireLifeRef.current + 0.06, 1.0);
        nextSurgeRef.current = 20 + Math.random() * 40;
      }
      surgeRef.current *= 0.993;

      swordGlowRef.current *= 0.97;

      const totalI = (baseI + stoke * 0.4 + surgeRef.current * 0.2) * (1 - flicker * 0.6);

      // Wind from mouse
      const windX = (mouseRef.current.x - 0.5) * 0.06;

      // ── 1. Background ──
      const bg = bgCanvasRef.current;
      if (bg && bgDirtyRef.current) { renderBackground(bg); bgDirtyRef.current = false; }
      if (bg) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(bg as CanvasImageSource, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.restore();
      }

      // Apply camera shake
      if (shake.x !== 0 || shake.y !== 0) ctx.translate(shake.x, shake.y);

      // ── 2. Ambient bloom — breathes with mode ──
      const bloomR = vh * (0.42 + colorTemp * 0.46);
      const bR1 = Math.round(200 + colorTemp * 55);  // 200 → 255
      const bG1 = Math.round(100 + colorTemp * 65);  // 100 → 165
      const bR2 = Math.round(180 + colorTemp * 40);
      const bG2 = Math.round(75 + colorTemp * 50);
      const bloomGrad = ctx.createRadialGradient(fcx, fcy - vh * 0.04, 0, fcx, fcy - vh * 0.04, bloomR);
      bloomGrad.addColorStop(0,    `rgba(${bR1},${bG1},35,${(0.08 + colorTemp * 0.06) * totalI})`);
      bloomGrad.addColorStop(0.06, `rgba(${bR2},${bG2},25,${(0.055 + colorTemp * 0.04) * totalI})`);
      bloomGrad.addColorStop(0.15, `rgba(140,50,15,${0.025 * totalI})`);
      bloomGrad.addColorStop(0.35, `rgba(80,25,5,${0.008 * totalI})`);
      bloomGrad.addColorStop(0.6,  `rgba(30,8,2,${0.003 * totalI})`);
      bloomGrad.addColorStop(1,    "rgba(5,1,0,0)");
      ctx.fillStyle = bloomGrad;
      ctx.fillRect(0, 0, vw, vh);

      // Hot white core — the true flame heart, only visible when activated
      if (colorTemp > 0.01) {
        const coreGrad = ctx.createRadialGradient(fcx, fcy - vh * 0.06, 0, fcx, fcy - vh * 0.04, sw * 0.055);
        coreGrad.addColorStop(0,   `rgba(255,252,210,${colorTemp * 0.38 * totalI})`);
        coreGrad.addColorStop(0.25,`rgba(255,210,110,${colorTemp * 0.18 * totalI})`);
        coreGrad.addColorStop(0.6, `rgba(255,140,40,${colorTemp * 0.06 * totalI})`);
        coreGrad.addColorStop(1,   "rgba(200,80,10,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = coreGrad;
        ctx.fillRect(fcx - sw * 0.08, fcy - vh * 0.14, sw * 0.16, vh * 0.12);
        ctx.globalCompositeOperation = "source-over";
      }

      // Activation ignition pulse — expanding elliptical heat ring
      if (activationPulseRef.current > 0.005) {
        const p = activationPulseRef.current;
        const progress = 1 - p;
        const ringRx = sw * (0.03 + progress * 0.30);
        const ringRy = ringRx * 0.28;
        const ringAlpha = p * p * 0.8;
        ctx.globalCompositeOperation = "lighter";
        // Outer glow halo
        ctx.strokeStyle = `rgba(255,140,30,${ringAlpha * 0.35})`;
        ctx.lineWidth = Math.max(2, sw * 0.016 * p);
        ctx.beginPath();
        ctx.ellipse(fcx, fcy + vh * 0.04, ringRx, ringRy, 0, 0, TAU);
        ctx.stroke();
        // Main ring
        ctx.strokeStyle = `rgba(255,200,80,${ringAlpha})`;
        ctx.lineWidth = Math.max(1, sw * 0.005 * p);
        ctx.beginPath();
        ctx.ellipse(fcx, fcy + vh * 0.04, ringRx, ringRy, 0, 0, TAU);
        ctx.stroke();
        // Bright inner edge
        ctx.strokeStyle = `rgba(255,248,200,${ringAlpha * 0.6})`;
        ctx.lineWidth = Math.max(0.5, sw * 0.002 * p);
        ctx.beginPath();
        ctx.ellipse(fcx, fcy + vh * 0.04, ringRx * 0.86, ringRy * 0.86, 0, 0, TAU);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      }

      // Stoke bloom pulse — additive flash on click
      if (stokePulse > 0.01) {
        const pulseGrad = ctx.createRadialGradient(fcx, fcy + vh * 0.02, 0, fcx, fcy + vh * 0.02, vh * 0.5);
        pulseGrad.addColorStop(0, `rgba(255,210,120,${0.30 * stokePulse})`);
        pulseGrad.addColorStop(0.08, `rgba(255,160,60,${0.18 * stokePulse})`);
        pulseGrad.addColorStop(0.2, `rgba(220,90,25,${0.08 * stokePulse})`);
        pulseGrad.addColorStop(0.45, `rgba(140,40,8,${0.025 * stokePulse})`);
        pulseGrad.addColorStop(1, "rgba(40,8,1,0)");
        ctx.fillStyle = pulseGrad;
        ctx.fillRect(0, 0, vw, vh);
      }

      // Shockwave ring — expands outward from fire on click
      const shockwaveVal = shockwaveRef.current;
      if (shockwaveVal > 0.01) {
        shockwaveRef.current *= 0.89;
        if (shockwaveRef.current < 0.01) shockwaveRef.current = 0;
        const swProgress = 1 - shockwaveVal;
        const swRadius = sw * 0.015 + swProgress * sw * 0.18;
        const swAlpha = shockwaveVal * shockwaveVal * 0.22;
        // Outer ring
        ctx.strokeStyle = `rgba(255,140,40,${swAlpha})`;
        ctx.lineWidth = Math.max(1.5, sw * 0.005 * shockwaveVal);
        ctx.beginPath();
        ctx.ellipse(fcx, fcy + vh * 0.04, swRadius, swRadius * 0.3, 0, 0, TAU);
        ctx.stroke();
        // Bright inner edge
        ctx.strokeStyle = `rgba(255,200,100,${swAlpha * 0.6})`;
        ctx.lineWidth = Math.max(0.8, sw * 0.002 * shockwaveVal);
        ctx.beginPath();
        ctx.ellipse(fcx, fcy + vh * 0.04, swRadius * 0.92, swRadius * 0.28, 0, 0, TAU);
        ctx.stroke();
        // Faint wide glow around the ring
        ctx.globalAlpha = swAlpha * 0.3;
        ctx.strokeStyle = `rgba(200,80,15,1)`;
        ctx.lineWidth = Math.max(3, sw * 0.012 * shockwaveVal);
        ctx.beginPath();
        ctx.ellipse(fcx, fcy + vh * 0.04, swRadius, swRadius * 0.3, 0, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Deactivation snuff pulse — darkness surges inward briefly then recedes
      if (deactivationPulseRef.current > 0.005) {
        const p = deactivationPulseRef.current;
        const progress = 1 - p;
        // Dark vignette that blooms outward from center as fire dies
        const snuffGrad = ctx.createRadialGradient(fcx, fcy, 0, fcx, fcy, sw * (0.05 + progress * 0.45));
        snuffGrad.addColorStop(0,   `rgba(0,0,0,0)`);
        snuffGrad.addColorStop(0.4, `rgba(0,0,0,${p * 0.18})`);
        snuffGrad.addColorStop(0.8, `rgba(0,0,0,${p * 0.45})`);
        snuffGrad.addColorStop(1,   `rgba(0,0,0,0)`);
        ctx.fillStyle = snuffGrad;
        ctx.fillRect(0, 0, vw, vh);
        // Cold ring — thin expanding circle, blue-grey tint
        const ringRx = sw * (0.06 + progress * 0.28);
        const ringRy = ringRx * 0.28;
        ctx.strokeStyle = `rgba(160,180,200,${p * p * 0.3})`;
        ctx.lineWidth = Math.max(1, sw * 0.004 * p);
        ctx.beginPath();
        ctx.ellipse(fcx, fcy + vh * 0.04, ringRx, ringRy, 0, 0, TAU);
        ctx.stroke();
      }

      // Ground light pool — floods the earth when activated
      const glPool = ctx.createRadialGradient(fcx, fcy + vh * 0.06, 0, fcx, fcy + vh * 0.06, sw * (0.20 + colorTemp * 0.20));
      glPool.addColorStop(0, `rgba(180,75,20,${0.035 * totalI})`);
      glPool.addColorStop(0.2, `rgba(120,40,8,${0.02 * totalI})`);
      glPool.addColorStop(0.5, `rgba(60,15,3,${0.008 * totalI})`);
      glPool.addColorStop(1, "rgba(10,3,0,0)");
      ctx.fillStyle = glPool;
      ctx.fillRect(0, fcy - vh * 0.02, vw, vh * 0.3);

      // ── 3. Rune circle — ancient markings on the ground ──
      const runeRadius = sw * 0.09;
      const runeY = fcy + vh * 0.065;
      const runeWarmth = sustainedRef.current ? 1.3 : 1;
      const runePulse = (0.5 + breath * 0.3 + Math.sin(time * 0.4) * 0.2) * runeWarmth;

      // Rune-cinder interaction: cinders passing near rune marks brighten them
      const runeMarks = runeMarksRef.current;
      for (const mark of runeMarks) {
        mark.glow *= 0.96; // decay toward 0
        const mx = fcx + Math.cos(mark.angle) * runeRadius * 0.92;
        const my = runeY + Math.sin(mark.angle) * runeRadius * 0.92 * 0.12;
        // Check nearby cinders (sample every 4th for perf)
        const cinderArr = cindersRef.current;
        for (let ci = 0; ci < cinderArr.length; ci += 4) {
          const c = cinderArr[ci];
          const dx = c.x - mx, dy = c.y - my;
          const dist2 = dx * dx + dy * dy;
          const thresh = sw * 0.04;
          if (dist2 < thresh * thresh) {
            const proximity = 1 - Math.sqrt(dist2) / thresh;
            mark.glow = Math.min(mark.glow + proximity * 0.15 * c.temp, 1);
          }
        }
      }

      ctx.save();
      const runeBoost = 1 + colorTemp * 6;
      ctx.globalAlpha = 0.003 * totalI * runePulse * runeBoost;
      ctx.strokeStyle = "rgba(200,110,35,1)";
      ctx.lineWidth = 0.8;
      // Perspective ellipse
      ctx.beginPath();
      ctx.ellipse(fcx, runeY, runeRadius, runeRadius * 0.12, 0, 0, TAU);
      ctx.stroke();
      // Inner ring
      ctx.beginPath();
      ctx.ellipse(fcx, runeY, runeRadius * 0.85, runeRadius * 0.85 * 0.12, 0, 0, TAU);
      ctx.stroke();

      // Rune marks — brightened by nearby cinders
      for (const mark of runeMarks) {
        const markPulse = 0.5 + Math.sin(time * 0.3 + mark.phase) * 0.5;
        const glowBoost = 1 + mark.glow * 12; // up to 13x brighter when fully lit
        ctx.globalAlpha = 0.003 * totalI * runePulse * markPulse * glowBoost * runeBoost;
        const rx = fcx + Math.cos(mark.angle) * runeRadius * 0.92;
        const ry = runeY + Math.sin(mark.angle) * runeRadius * 0.92 * 0.12;
        const sz = mark.size * sw;

        // Runic strokes — hue shifts warmer when glowing
        const gr = Math.round(130 + mark.glow * 70);
        const gb = Math.round(45 - mark.glow * 20);
        ctx.fillStyle = `rgba(220,${gr},${gb},1)`;
        ctx.strokeStyle = `rgba(220,${gr},${gb},1)`;
        const sym = mark.symbol;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.lineWidth = 0.5 + mark.glow * 0.8;
        if (sym === 0) { ctx.beginPath(); ctx.moveTo(-sz, -sz); ctx.lineTo(sz, sz); ctx.moveTo(sz, -sz); ctx.lineTo(-sz, sz); ctx.stroke(); }
        else if (sym === 1) { ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(0, sz); ctx.moveTo(-sz, 0); ctx.lineTo(sz, 0); ctx.stroke(); }
        else if (sym === 2) { ctx.beginPath(); ctx.arc(0, 0, sz * 0.6, 0, TAU); ctx.stroke(); }
        else if (sym === 3) { ctx.beginPath(); ctx.moveTo(-sz, sz); ctx.lineTo(0, -sz); ctx.lineTo(sz, sz); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(-sz, -sz); ctx.lineTo(-sz, sz); ctx.lineTo(sz, sz); ctx.stroke(); }

        // Radial glow halo when activated by cinders
        if (mark.glow > 0.05) {
          ctx.globalAlpha = mark.glow * 0.15 * totalI;
          const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 4);
          halo.addColorStop(0, `rgba(255,${gr},${gb},0.6)`);
          halo.addColorStop(0.4, `rgba(200,80,15,0.2)`);
          halo.addColorStop(1, "rgba(120,30,4,0)");
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.arc(0, 0, sz * 4, 0, TAU); ctx.fill();
        }

        ctx.restore();
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // ── 4. Ash mound — smooth, ancient, layered grey ──
      const moundW = sw * 0.075;
      const moundH = vh * 0.04;
      const moundBaseY = fcy + vh * 0.04;

      // Mound shadow/ground contact
      ctx.fillStyle = `rgba(3,2,1,${0.3 * totalI})`;
      ctx.beginPath();
      ctx.ellipse(fcx, moundBaseY + moundH * 0.15, moundW * 1.6, moundH * 0.4, 0, 0, TAU);
      ctx.fill();

      // Main ash mound shape
      const moundGrad = ctx.createRadialGradient(fcx, moundBaseY - moundH * 0.3, 0, fcx, moundBaseY, moundW);
      moundGrad.addColorStop(0, `rgba(45,40,35,${0.7 + totalI * 0.2})`);
      moundGrad.addColorStop(0.3, `rgba(35,30,25,${0.8 + totalI * 0.1})`);
      moundGrad.addColorStop(0.7, `rgba(22,18,14,0.85)`);
      moundGrad.addColorStop(1, `rgba(12,10,8,0.5)`);
      ctx.fillStyle = moundGrad;

      ctx.beginPath();
      ctx.moveTo(fcx - moundW * 1.4, moundBaseY);
      ctx.bezierCurveTo(
        fcx - moundW * 1.1, moundBaseY - moundH * 0.15,
        fcx - moundW * 0.5, moundBaseY - moundH * 0.85,
        fcx - moundW * 0.05, moundBaseY - moundH * 1.05
      );
      ctx.bezierCurveTo(
        fcx + moundW * 0.4, moundBaseY - moundH * 0.9,
        fcx + moundW * 1.0, moundBaseY - moundH * 0.2,
        fcx + moundW * 1.4, moundBaseY
      );
      ctx.closePath();
      ctx.fill();

      // Ash surface texture — faint lighter patches
      ctx.globalAlpha = 0.06;
      for (let i = 0; i < 5; i++) {
        const tx = fcx + (i - 2) * moundW * 0.35;
        const ty = moundBaseY - moundH * (0.4 + Math.sin(i * 1.7) * 0.25);
        const ts = moundW * (0.15 + Math.sin(i * 2.3) * 0.08);
        const tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, ts);
        tg.addColorStop(0, "rgba(70,65,55,1)");
        tg.addColorStop(1, "rgba(40,35,28,0)");
        ctx.fillStyle = tg;
        ctx.beginPath(); ctx.arc(tx, ty, ts, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── 5. Glow seams — fire visible through cracks in the ash ──
      ctx.globalCompositeOperation = "lighter";
      for (const seam of glowSeamsRef.current) {
        const sx = sOffX + seam.x * sw, sy = seam.y * vh;
        const pulse = seam.intensity * (0.3 + breath * 0.2
          + Math.sin(time * seam.pulseSpeed + seam.phase) * 0.25
          + Math.sin(time * seam.pulseSpeed * 2.3 + seam.phase * 1.7) * 0.15);
        const bright = pulse * totalI;

        const seamW = seam.width * sw;
        const sh = seam.height * vh;

        // Hot glow bleeding through
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, seamW * 2);
        sg.addColorStop(0, `rgba(255,130,25,${bright * 0.35})`);
        sg.addColorStop(0.25, `rgba(220,60,8,${bright * 0.2})`);
        sg.addColorStop(0.5, `rgba(150,25,2,${bright * 0.08})`);
        sg.addColorStop(1, "rgba(80,10,0,0)");
        ctx.fillStyle = sg;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(seam.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, seamW, sh, 0, 0, TAU);
        ctx.fill();
        ctx.restore();

      }

      // Mass inner glow — the hidden furnace beneath the ash
      const innerGlow = ctx.createRadialGradient(fcx, fcy + vh * 0.01, 0, fcx, fcy + vh * 0.01, sw * 0.06);
      innerGlow.addColorStop(0, `rgba(200,60,8,${0.12 * totalI})`);
      innerGlow.addColorStop(0.3, `rgba(150,30,3,${0.06 * totalI})`);
      innerGlow.addColorStop(0.7, `rgba(80,12,0,${0.02 * totalI})`);
      innerGlow.addColorStop(1, "rgba(30,4,0,0)");
      ctx.fillStyle = innerGlow;
      ctx.fillRect(fcx - sw * 0.08, fcy - vh * 0.01, sw * 0.16, vh * 0.05);

      ctx.globalCompositeOperation = "source-over";

      // ── 6. Bone fragments — scattered on the ash ──
      for (const bone of bonesRef.current) {
        const bx = sOffX + bone.x * sw, by = bone.y * vh;
        const endX = bx + Math.cos(bone.angle) * bone.length * sw;
        const endY = by - Math.sin(bone.angle) * bone.length * vh * 0.35;

        ctx.strokeStyle = `rgba(28,24,18,${0.6 + totalI * 0.15})`;
        ctx.lineWidth = bone.thickness * sw;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Fire reflection on upper surface
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(160,50,8,${(0.03 + colorTemp * 0.05) * totalI})`;
        ctx.lineWidth = bone.thickness * sw * 0.5;
        ctx.beginPath();
        ctx.moveTo(bx, by - 0.5);
        ctx.lineTo(endX, endY - 0.5);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      }

      // ── 7. Flames — layered volumetric glows ──
      ctx.globalCompositeOperation = "lighter";

      const { layers: flameLayers, hotspots: flameHotspots } = flameConfigRef.current;

      for (const layer of flameLayers) {
        const osc = Math.sin(time * layer.freqs[0] + layer.phase) * layer.amps[0]
          + Math.sin(time * layer.freqs[1] + layer.phase * 1.7) * layer.amps[1]
          + Math.sin(time * layer.freqs[2] + layer.phase * 2.3) * layer.amps[2];

        const stokeBoost = 1 + stoke * 0.6;
        const breathScale = 0.85 + breath * (0.3 + colorTemp * 0.18);

        // Animated position
        const swayX = osc * 0.015 + windX * 0.3
          + Math.sin(time * 0.7 + layer.phase * 2.1) * 0.004;
        const lx = fcx + (layer.xOff + swayX) * sw;
        const lyRaw = fcy + (layer.yOff + Math.sin(time * layer.freqs[0] * 0.7 + layer.phase * 3) * 0.005) * vh;
        // Non-base centers must stay close to mound so gradient base reaches the ash
        const ly = layer.tier === "base" ? lyRaw : Math.max(lyRaw, fcy + vh * 0.01);

        // Vertical reach — how far the gradient extends upward from its hot base
        const reach = layer.radiusY * vh * breathScale * stokeBoost * (1 + osc * 0.25);
        // Horizontal spread — how wide at the base
        const spread = layer.radiusX * sw * breathScale * stokeBoost * (1 + osc * 0.2);

        const layerAlpha = layer.opacity * totalI * (0.6 + osc * 0.4) * stokeBoost * (1 + colorTemp * 0.5);

        if (layer.tier === "base") {
          // Base: wide circular glow hugging the ash
          const r = Math.max(spread, reach);
          const fg = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
          fg.addColorStop(0, `rgba(200,210,240,${layerAlpha * 0.8})`);
          fg.addColorStop(0.1, `rgba(255,200,140,${layerAlpha * 0.6})`);
          fg.addColorStop(0.3, `rgba(240,130,40,${layerAlpha * 0.3})`);
          fg.addColorStop(0.55, `rgba(180,55,8,${layerAlpha * 0.1})`);
          fg.addColorStop(0.8, `rgba(100,18,2,${layerAlpha * 0.02})`);
          fg.addColorStop(1, "rgba(40,5,0,0)");
          ctx.fillStyle = fg;
          ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
        } else {
          // Mid tongues & wisps: offset gradient — hot point at base, fading upward
          // Inner circle sits at the flame's base, outer circle centered higher up
          const outerR = reach * 1.1;
          // Anchor hot base to mound bottom — flames always root at the ash bed
          const hotY = Math.max(ly + reach * 0.35, moundBaseY);
          const fadeY = ly - reach * 0.25;  // fade center higher
          const fg = ctx.createRadialGradient(
            lx + Math.sin(time * layer.freqs[1] + layer.phase) * spread * 0.3,
            hotY, spread * 0.3,
            lx, fadeY, outerR
          );

          if (layer.tier === "mid") {
            fg.addColorStop(0, `rgba(255,230,180,${layerAlpha * 0.7})`);
            fg.addColorStop(0.12, `rgba(255,170,60,${layerAlpha * 0.45})`);
            fg.addColorStop(0.3, `rgba(235,95,12,${layerAlpha * 0.2})`);
            fg.addColorStop(0.55, `rgba(170,40,4,${layerAlpha * 0.06})`);
            fg.addColorStop(0.8, `rgba(90,15,1,${layerAlpha * 0.01})`);
            fg.addColorStop(1, "rgba(30,3,0,0)");
          } else {
            fg.addColorStop(0, `rgba(255,200,130,${layerAlpha * 0.5})`);
            fg.addColorStop(0.1, `rgba(245,130,35,${layerAlpha * 0.25})`);
            fg.addColorStop(0.3, `rgba(200,55,6,${layerAlpha * 0.08})`);
            fg.addColorStop(0.6, `rgba(120,18,1,${layerAlpha * 0.015})`);
            fg.addColorStop(1, "rgba(30,3,0,0)");
          }

          ctx.fillStyle = fg;
          // Rect must cover both fadeY circle and hotY circle
          const rectTop = fadeY - outerR;
          const rectBot = Math.max(fadeY + outerR, hotY + spread * 0.5 + 2);
          ctx.fillRect(lx - outerR, rectTop, outerR * 2, rectBot - rectTop);
        }
      }

      // Flickering hotspots — bright pinpoints darting inside the flame body
      for (const hs of flameHotspots) {
        const hx = fcx + Math.sin(time * hs.freqX + hs.phase) * hs.ampX * sw
          + Math.cos(time * hs.freqX * 0.7 + hs.phase * 2.3) * hs.ampX * sw * 0.4;
        const hy = fcy + Math.sin(time * hs.freqY + hs.phase * 1.5) * hs.ampY * vh
          + Math.cos(time * hs.freqY * 0.6 + hs.phase * 1.8) * hs.ampY * vh * 0.3
          - vh * 0.01; // bias upward into the flame
        const hr = hs.radius * sw * (0.6 + Math.sin(time * hs.freqX * 1.3 + hs.phase) * 0.4);
        // Flicker on/off — not always visible
        const flick = Math.sin(time * hs.freqX * 2.1 + hs.phase * 3.7);
        if (flick < -0.2) continue;
        const hAlpha = hs.opacity * totalI * clamp01(flick + 0.2) * (1 + stoke * 0.5);

        const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        hg.addColorStop(0, `rgba(255,235,190,${hAlpha})`);
        hg.addColorStop(0.2, `rgba(255,170,70,${hAlpha * 0.5})`);
        hg.addColorStop(0.5, `rgba(210,75,10,${hAlpha * 0.12})`);
        hg.addColorStop(1, "rgba(80,10,0,0)");
        ctx.fillStyle = hg;
        ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
      }

      // White-hot core at fire's heart — pulses with breath
      const coreR = sw * (0.014 + breath * 0.004);
      const hc = ctx.createRadialGradient(fcx, fcy, 0, fcx, fcy, coreR);
      hc.addColorStop(0, `rgba(255,248,230,${0.16 * totalI})`);
      hc.addColorStop(0.2, `rgba(255,220,160,${0.10 * totalI})`);
      hc.addColorStop(0.5, `rgba(255,170,80,${0.04 * totalI})`);
      hc.addColorStop(1, "rgba(200,80,20,0)");
      ctx.fillStyle = hc;
      ctx.fillRect(fcx - coreR, fcy - coreR, coreR * 2, coreR * 2);

      ctx.globalCompositeOperation = "source-over";

      // ── 8. The Coiled Sword ──
      // Clip so the buried portion below the ash mound surface doesn't render
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, vw, moundBaseY - moundH * 0.15);
      ctx.clip();
      drawCoiledSword(ctx, fcx, fcy + vh * 0.02, sw, vh, time, totalI * (1 + swordGlowRef.current * 0.4), breath, swordConfigRef.current);
      ctx.restore();

      // ── 9. Smoke tendrils ──
      const smokes = smokesRef.current;
      if (smokes.length < maxSmokes && Math.random() < 0.07 + stoke * 0.12) {
        smokes.push({
          x: fcx + (Math.random() - 0.5) * sw * 0.03,
          y: fcy - vh * 0.08 - Math.random() * vh * 0.02,
          vx: (Math.random() - 0.5) * 0.04 + windX * 0.8,
          vy: -0.05 - Math.random() * 0.12 - stoke * 0.05,
          life: 1,
          size: 2 + Math.random() * 4,
          maxSize: 25 + Math.random() * 40,
          phase: Math.random() * TAU,
          turbFreq: 0.12 + Math.random() * 0.4,
          opacity: 0.1 + Math.random() * 0.15,
        });
      }

      for (let i = smokes.length - 1; i >= 0; i--) {
        const s = smokes[i];
        s.x += s.vx + noise(s.x * 0.003, s.y * 0.003, time * s.turbFreq) * 0.3 + windX * 0.4;
        s.y += s.vy;
        s.vy *= 0.9995;
        s.life -= 0.0007 + (1 - s.life) * 0.0002;
        s.size += (s.maxSize - s.size) * 0.002;

        if (s.life <= 0 || s.y < -150) { smokes[i] = smokes[smokes.length - 1]; smokes.pop(); continue; }

        const a = s.life * s.life * s.opacity;
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
        sg.addColorStop(0, `rgba(40,32,22,${a})`);
        sg.addColorStop(0.4, `rgba(30,24,16,${a * 0.4})`);
        sg.addColorStop(1, `rgba(18,14,10,0)`);
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, TAU); ctx.fill();

        // Backlit warmth from fire below
        const distToFire = Math.hypot(s.x - fcx, s.y - fcy);
        if (distToFire < vh * 0.2) {
          ctx.globalCompositeOperation = "lighter";
          const backlit = (1 - distToFire / (vh * 0.2)) * a * totalI * 0.1;
          const bsg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 0.6);
          bsg.addColorStop(0, `rgba(180,70,15,${backlit})`);
          bsg.addColorStop(1, `rgba(80,25,4,0)`);
          ctx.fillStyle = bsg;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 0.6, 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }
      }

      // ── 10a. Ground embers — the ash itself pulses with life ──
      ctx.globalCompositeOperation = "lighter";
      for (const ge of groundEmbersRef.current) {
        const gex = sOffX + ge.x * sw, gey = ge.y * vh;
        const gePulse = ge.intensity * (0.2 + breath * 0.25
          + Math.sin(time * ge.pulseSpeed + ge.phase) * 0.3
          + Math.sin(time * ge.pulseSpeed * 2.7 + ge.phase * 1.5) * 0.15);
        const geBright = gePulse * totalI * (sustainedRef.current ? 1.3 : 1);
        const geSize = ge.size * sw;

        const geGrad = ctx.createRadialGradient(gex, gey, 0, gex, gey, geSize);
        geGrad.addColorStop(0, `rgba(255,120,25,${geBright * 0.25})`);
        geGrad.addColorStop(0.3, `rgba(200,55,8,${geBright * 0.12})`);
        geGrad.addColorStop(0.7, `rgba(120,20,2,${geBright * 0.04})`);
        geGrad.addColorStop(1, "rgba(60,8,0,0)");
        ctx.fillStyle = geGrad;
        ctx.beginPath(); ctx.arc(gex, gey, geSize, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // ── 10b. CINDERS — the soul of the scene ──
      const cinders = cindersRef.current;
      // Sword position for attraction (approximate center of blade in world space)
      const swordCX = fcx + Math.sin(-0.08) * vh * 0.12;
      const swordBladeY = fcy - vh * 0.08;

      // Spawn cinders from multiple sources
      const fireSpawnScale = Math.max(0.08, fireLife * fireLife);
      const spawnBudget = (stoke > 0.1 ? 0.6 : 0.24) * (isMobile ? 0.55 : 1) * fireSpawnScale;
      const spawnCount = Math.min(3, maxCinders - cinders.length);

      for (let s = 0; s < spawnCount; s++) {
        if (Math.random() > spawnBudget) continue;

        // Choose spawn source: 60% fire center, 20% glow seams, 10% rune circle, 10% wider ash
        const source = Math.random();
        let sx: number, sy: number;

        if (source < 0.60) {
          // Fire center
          sx = fcx + (Math.random() - 0.5) * sw * 0.05;
          sy = fcy - Math.random() * vh * 0.008;
        } else if (source < 0.80) {
          // From a glow seam
          const seam = glowSeamsRef.current[((Math.random() * glowSeamsRef.current.length) | 0)];
          sx = sOffX + seam.x * sw + (Math.random() - 0.5) * sw * 0.01;
          sy = seam.y * vh;
        } else if (source < 0.90) {
          // From rune circle
          const runeAngle = Math.random() * TAU;
          const runeR = sw * 0.09;
          sx = fcx + Math.cos(runeAngle) * runeR;
          sy = (fcy + vh * 0.065) + Math.sin(runeAngle) * runeR * 0.12;
        } else {
          // Wider ash field
          sx = fcx + (Math.random() - 0.5) * sw * 0.14;
          sy = fcy + (Math.random() - 0.5) * vh * 0.02;
        }

        const ml = 5 + Math.random() * 12;
        const d = Math.random();
        const soulRate = sustainedRef.current ? 0.03 : 0.012;
        const isSoul = Math.random() < soulRate;

        cinders.push({
          x: sx, y: sy, px: sx, py: sy,
          vx: (Math.random() - 0.5) * (0.12 + colorTemp * 0.1) + windX * 0.3,
          vy: -0.10 - Math.random() * (0.28 + colorTemp * 0.28) - stoke * 0.4,
          life: ml, maxLife: ml,
          size: isSoul
            ? (1.0 + Math.random() * 1.5) * (0.6 + d * 0.5)
            : (0.4 + Math.random() * 2.0) * (0.5 + d * 0.6),
          depth: d,
          phase: Math.random() * TAU,
          spiralAmp: 0.05 + Math.random() * 0.35,
          spiralFreq: 0.18 + Math.random() * 0.7,
          pulsePhase: Math.random() * TAU,
          temp: isSoul ? 0.9 + Math.random() * 0.1 : 0.45 + Math.random() * 0.55,
          isSoul,
          swordAffinity: Math.random() < 0.22 ? 0.3 + Math.random() * 0.7 : 0,
          hueShift: (Math.random() - 0.5) * 0.15,
          turbSeed: Math.random() * 1000,
        });
      }

      // Parallax wind from mouse
      const pDx = (mouseRef.current.x - 0.5) * 0.04;

      // Murmuration — grid-based local velocity alignment
      const gridW = 8, gridH = 8;
      const cellW = vw / gridW, cellH = vh / gridH;
      const gridVx = new Float32Array(gridW * gridH);
      const gridVy = new Float32Array(gridW * gridH);
      const gridCount = new Float32Array(gridW * gridH);
      for (let ci = 0; ci < cinders.length; ci++) {
        const cc = cinders[ci];
        const gx = Math.min(gridW - 1, Math.max(0, (cc.x / cellW) | 0));
        const gy = Math.min(gridH - 1, Math.max(0, (cc.y / cellH) | 0));
        const idx = gy * gridW + gx;
        gridVx[idx] += cc.vx;
        gridVy[idx] += cc.vy;
        gridCount[idx]++;
      }
      for (let gi = 0; gi < gridW * gridH; gi++) {
        if (gridCount[gi] > 0) {
          gridVx[gi] /= gridCount[gi];
          gridVy[gi] /= gridCount[gi];
        }
      }

      // Cursor position in canvas space
      const cmx = mouseRef.current.x * vw, cmy = mouseRef.current.y * vh;

      for (let i = cinders.length - 1; i >= 0; i--) {
        const c = cinders[i];
        c.px = c.x; c.py = c.y;

        // Drift physics
        c.vy *= 0.9992;
        c.vx += pDx * (0.5 + c.depth * 0.5) * 0.003;
        c.vx += windX * 0.012;
        c.vx *= 0.998;

        // Flocking — align with nearby embers' average velocity
        const fgx = Math.min(gridW - 1, Math.max(0, (c.x / cellW) | 0));
        const fgy = Math.min(gridH - 1, Math.max(0, (c.y / cellH) | 0));
        const fidx = fgy * gridW + fgx;
        if (gridCount[fidx] > 2) {
          c.vx += (gridVx[fidx] - c.vx) * 0.008;
          c.vy += (gridVy[fidx] - c.vy) * 0.005;
        }

        // Cursor reactivity — repulsion with swirling wake
        const cdxM = c.x - cmx, cdyM = c.y - cmy;
        const cursorDist = Math.hypot(cdxM, cdyM);
        const cursorZone = vh * 0.08;
        if (cursorDist < cursorZone && cursorDist > 1) {
          const proximity = 1 - cursorDist / cursorZone;
          const force = proximity * proximity * 0.12;
          c.vx += (cdxM / cursorDist) * force;
          c.vy += (cdyM / cursorDist) * force;
          // Tangential swirl
          c.vx += (-cdyM / cursorDist) * force * 0.35;
          c.vy += (cdxM / cursorDist) * force * 0.35;
        }

        // Spiral drift — wider as they rise
        const lr = c.life / c.maxLife;
        const age = 1 - lr; // 0=fresh, 1=dying
        const widening = 1 + age * 1.5;
        const st = time * c.spiralFreq + c.phase;

        // Organic turbulence — noise displaces the path so no two embers move alike
        const turbX = noise(c.x * 0.005, c.y * 0.003, time * 0.8 + c.turbSeed) * 0.12;
        const turbY = noise(c.x * 0.003 + 100, c.y * 0.005, time * 0.6 + c.turbSeed) * 0.06;

        c.x += c.vx + Math.sin(st) * c.spiralAmp * widening + turbX;
        c.y += c.vy + Math.cos(st * 0.6) * c.spiralAmp * 0.08 + turbY;

        // Thermal updraft — embers near the fire accelerate upward
        const dxFire = c.x - fcx, dyFire = c.y - fcy;
        const distFire = Math.hypot(dxFire, dyFire);
        const updraftZone = vh * 0.12;
        if (distFire < updraftZone) {
          c.vy -= (1 - distFire / updraftZone) * 0.012;
        }

        // Dying embers lose buoyancy and widen their spiral
        if (lr < 0.15) {
          c.vy += 0.002;
          c.spiralAmp *= 1.002;
        }

        // Sword orbital — embers with affinity enter elliptical orbits around the blade
        if (c.swordAffinity > 0 && lr > 0.3) {
          const dxSword = swordCX - c.x;
          const dySword = swordBladeY - c.y;
          const distSword = Math.hypot(dxSword, dySword);
          const orbitZone = vh * 0.15;
          if (distSword < orbitZone && distSword > vh * 0.015) {
            const pull = c.swordAffinity * 0.001 / (distSword / (vh * 0.05));
            // Radial attraction
            c.vx += dxSword * pull;
            c.vy += dySword * pull * 0.3;
            // Tangential orbital velocity — elliptical orbit around the blade
            const tangentX = -dySword / distSword;
            const tangentY = dxSword / distSword;
            const orbitalSpeed = c.swordAffinity * 0.055 * (1 - distSword / orbitZone);
            c.vx += tangentX * orbitalSpeed;
            c.vy += tangentY * orbitalSpeed * 0.4;
          }
          c.swordAffinity *= 0.9995;
        }

        // Sword presence — nearby embers warm the blade
        const dxPresence = c.x - swordCX, dyPresence = c.y - swordBladeY;
        if (Math.hypot(dxPresence, dyPresence) < sw * 0.04) {
          swordGlowRef.current = Math.min(swordGlowRef.current + 0.015 * c.temp, 0.6);
        }

        // Cool down over time (souls cool slower)
        c.temp *= c.isSoul ? 0.99985 : 0.9997;

        // Life drain
        c.life -= 0.005 * (1 + age * 2.2);

        if (c.life <= 0 || c.y < -100 || c.x < -100 || c.x > vw + 100) {
          // Dying ember flash — 20% chance of a crackle pop on natural death
          if (c.life <= 0 && c.x > 0 && c.x < vw && c.y > 0 && c.y < vh && Math.random() < 0.2) {
            const flashR = c.size * (c.isSoul ? 5 : 3.5);
            const flashA = c.temp * 0.35;
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = flashA;
            const fc = c.isSoul ? "rgba(200,220,255," : "rgba(255,180,80,";
            const fg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, flashR);
            fg.addColorStop(0, fc + "1)");
            fg.addColorStop(0.4, fc + "0.4)");
            fg.addColorStop(1, fc + "0)");
            ctx.fillStyle = fg;
            ctx.beginPath(); ctx.arc(c.x, c.y, flashR, 0, TAU); ctx.fill();
            ctx.restore();
          }
          cinders[i] = cinders[cinders.length - 1]; cinders.pop();
        }
      }

      // Render cinders with depth-aware layering
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < cinders.length; i++) {
        const c = cinders[i];
        const lr = c.life / c.maxLife;

        // Pulsating brightness
        const thermal = clamp01(
          0.3 + breath * 0.08
          + Math.sin(time * 1.6 + c.pulsePhase) * 0.18
          + Math.sin(time * 4.2 + c.pulsePhase * 2.1) * 0.12
          + Math.sin(time * 7.5 + c.pulsePhase * 0.7) * 0.06
        );

        const alpha = lr * thermal * c.temp;
        const depthScale = 0.4 + c.depth * 0.7;
        const bokeh = 1.8 - c.depth;
        const sizePulse = 1 + Math.sin(time * 2.5 + c.pulsePhase * 1.7) * 0.18;
        const sz = c.size * (0.15 + lr * 0.85) * depthScale * sizePulse;

        // Color — souls are blue-white, normal embers follow heat gradient
        // colorTemp biases toward white-hot in activated
        let cr: number, cg: number, cb: number;
        if (c.isSoul) {
          const soulF = c.temp * lr;
          cr = Math.round(180 + soulF * 75);
          cg = Math.round(200 + soulF * 55);
          cb = 255;
        } else {
          const t = Math.min(1, c.temp * lr + colorTemp * 0.22);
          if (t > 0.7) {
            const f = (t - 0.7) / 0.3;
            cr = 255; cg = Math.round(200 + f * 45); cb = Math.round(130 + f * 90);
          } else if (t > 0.35) {
            const f = (t - 0.35) / 0.35;
            cr = 255; cg = Math.round(100 + f * 100); cb = Math.round(15 + f * 115);
          } else {
            const f = t / 0.35;
            cr = Math.round(120 + f * 135); cg = Math.round(15 + f * 85); cb = Math.round(2 + f * 13);
          }
        }

        // Per-ember hue variation — subtle warmth/coolness shifts
        cr = Math.min(255, Math.max(0, cr + Math.round(c.hueShift * 40)));
        cg = Math.min(255, Math.max(0, cg + Math.round(c.hueShift * 25)));

        // Ember shape — velocity-aligned ellipses with per-ember irregularity
        const dx = c.x - c.px, dy = c.y - c.py, dist = Math.hypot(dx, dy);
        const velAngle = Math.atan2(dy, dx);
        const tumble = time * 0.8 + c.phase * 2;
        const moveStrength = Math.min(dist * 2, 1);
        const emberAngle = velAngle * moveStrength + tumble * (1 - moveStrength);
        const stretch = 1.4 + moveStrength * 0.7;
        const irregX = 1 + Math.sin(c.phase * 3.7) * 0.15;
        const irregY = 1 + Math.cos(c.phase * 2.3) * 0.12;

        // Trail — stretches with velocity, brighter for hotter embers
        if (dist > 0.2 && sz > 0.15) {
          const trailStretch = Math.min(1 + dist * 0.25, 3);
          const trailX = c.x - dx * trailStretch;
          const trailY = c.y - dy * trailStretch;
          ctx.globalAlpha = alpha * (0.04 + c.temp * lr * 0.04) * depthScale;
          ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
          ctx.lineWidth = sz * 0.2;
          ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(trailX, trailY); ctx.lineTo(c.x, c.y); ctx.stroke();
        }

        // Bokeh outer glow — stays circular (it's a soft blur)
        ctx.globalAlpha = alpha * (c.isSoul ? 0.05 : 0.03) * depthScale * bokeh;
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.beginPath(); ctx.arc(c.x, c.y, sz * (c.isSoul ? 8 : 6) * bokeh, 0, TAU); ctx.fill();

        // Mid glow — elongated ember shape
        ctx.globalAlpha = alpha * (c.isSoul ? 0.18 : 0.12) * depthScale;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, sz * 2.2 * stretch * 0.7 * irregX, sz * 2.2 / stretch * 0.9 * irregY, emberAngle, 0, TAU);
        ctx.fill();

        // Core — irregular elongated fragment
        ctx.globalAlpha = Math.min(alpha * 0.85 * depthScale, 1);
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, sz * stretch * irregX, sz / stretch * irregY, emberAngle, 0, TAU);
        ctx.fill();

        // White-hot / soul-bright center
        const t2 = c.temp * lr;
        if (t2 > 0.4 && thermal > 0.4 && sz * depthScale > 0.5) {
          ctx.globalAlpha = alpha * (c.isSoul ? 0.5 : 0.3) * depthScale;
          ctx.fillStyle = c.isSoul ? "#E8F0FF" : "#FFF5E8";
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, sz * 0.3 * stretch * 0.7, sz * 0.18, emberAngle, 0, TAU);
          ctx.fill();
        }

        // Birth flash
        if (lr > 0.92) {
          const birthI = (lr - 0.92) / 0.08;
          ctx.globalAlpha = birthI * birthI * 0.35 * depthScale;
          ctx.fillStyle = c.isSoul ? "#C8DDFF" : "#FFF0C8";
          ctx.beginPath(); ctx.arc(c.x, c.y, sz * 2.5, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // ── 11. Sparks — brief, bright, explosive ──
      const sparks = sparksRef.current;
      // Sparks erupt from the flame tips, just above the mound peak
      const sparkOriginY = moundBaseY - moundH * 1.2;

      // Stoke burst — layered eruption on click
      if (stokeBurstRef.current > 0) {
        const burstCount = stokeBurstRef.current;
        stokeBurstRef.current = 0;

        // Disturb nearby cinders — blast them outward from the fire center
        for (const c of cindersRef.current) {
          const cdx = c.x - fcx, cdy = c.y - fcy;
          const cdist = Math.hypot(cdx, cdy);
          if (cdist < sw * 0.15 && cdist > 0) {
            const push = (1 - cdist / (sw * 0.15)) * 3.0;
            c.vx += (cdx / cdist) * push;
            c.vy += (cdy / cdist) * push - 1.2;
            c.life = Math.min(c.life + 0.1, c.maxLife); // re-ignite fading cinders
          }
        }

        // Fast hot sparks — sharp upward burst
        const hotCount = Math.ceil(burstCount * 0.45);
        for (let b = 0; b < hotCount; b++) {
          const a = -Math.PI * 0.35 - Math.random() * Math.PI * 0.3;
          const spd = 2.5 + Math.random() * 3.5;
          const ml = 0.08 + Math.random() * 0.18;
          const bsx = fcx + (Math.random() - 0.5) * sw * 0.015;
          const bsy = sparkOriginY - Math.random() * vh * 0.01;
          sparks.push({
            x: bsx, y: bsy, px: bsx, py: bsy,
            vx: Math.cos(a) * spd + (Math.random() - 0.5) * 2,
            vy: Math.sin(a) * spd,
            life: ml, maxLife: ml,
            size: 0.15 + Math.random() * 0.3,
          });
        }

        // Radial scatter — embers that fan out in all directions from the mound
        const scatterCount = Math.ceil(burstCount * 0.35);
        for (let b = 0; b < scatterCount; b++) {
          const a = Math.random() * TAU;
          const spd = 0.6 + Math.random() * 1.8;
          const ml = 0.15 + Math.random() * 0.35;
          const bsx = fcx + (Math.random() - 0.5) * sw * 0.02;
          const bsy = sparkOriginY + (Math.random() - 0.5) * vh * 0.006;
          sparks.push({
            x: bsx, y: bsy, px: bsx, py: bsy,
            vx: Math.cos(a) * spd + windX * 2,
            vy: Math.sin(a) * spd * 0.6 - 0.5,
            life: ml, maxLife: ml,
            size: 0.25 + Math.random() * 0.55,
          });
        }

        // Lazy floaters — drift upward slowly
        const floatCount = Math.max(2, Math.ceil(burstCount * 0.2));
        for (let b = 0; b < floatCount; b++) {
          const ml = 0.35 + Math.random() * 0.5;
          const bsx = fcx + (Math.random() - 0.5) * sw * 0.025;
          const bsy = sparkOriginY - Math.random() * vh * 0.008;
          sparks.push({
            x: bsx, y: bsy, px: bsx, py: bsy,
            vx: (Math.random() - 0.5) * 0.5 + windX * 3,
            vy: -0.25 - Math.random() * 0.4,
            life: ml, maxLife: ml,
            size: 0.4 + Math.random() * 0.7,
          });
        }
      }

      // Ambient sparks — rare at rest, frequent when activated
      if (sparks.length < maxSparks && Math.random() < 0.005 + colorTemp * 0.04 + stoke * 0.06) {
        const sx = fcx + (Math.random() - 0.5) * sw * 0.02;
        const sy = sparkOriginY + (Math.random() - 0.5) * vh * 0.006;
        const a = -Math.PI * 0.2 - Math.random() * Math.PI * 0.6;
        const spd = 1.0 + Math.random() * 2.5 + stoke * 2;
        const ml = 0.08 + Math.random() * 0.25;
        sparks.push({
          x: sx, y: sy, px: sx, py: sy,
          vx: Math.cos(a) * spd + (Math.random() - 0.5) * 1.0 + windX * 3,
          vy: Math.sin(a) * spd,
          life: ml, maxLife: ml,
          size: 0.15 + Math.random() * 0.5,
        });
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.px = sp.x; sp.py = sp.y;
        sp.vx *= 0.96; sp.vy *= 0.96;
        sp.vy += 0.015;
        sp.vx += windX * 0.02;
        sp.x += sp.vx; sp.y += sp.vy;
        sp.life -= 0.01;
        if (sp.life <= 0) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); continue; }

        const sa = sp.life / sp.maxLife;
        const heat = sa * sa;
        // Muted color palette — kept warm but not vivid under additive blending
        const cr = Math.round(180 + 50 * heat);
        const cg = Math.round(80 * heat + 30 * (1 - heat));
        const cb = Math.round(40 * heat * heat);

        // Motion streak — very subtle
        const dx = sp.x - sp.px, dy = sp.y - sp.py;
        const streakLen = Math.hypot(dx, dy);
        if (streakLen > 0.3) {
          ctx.globalAlpha = sa * 0.06;
          ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
          ctx.lineWidth = sp.size * 0.5;
          ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(sp.px, sp.py); ctx.lineTo(sp.x, sp.y); ctx.stroke();
        }

        // Warm halo
        ctx.globalAlpha = sa * 0.03;
        ctx.fillStyle = `rgb(${cr},${Math.round(cg * 0.5)},${Math.round(cb * 0.3)})`;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size * 3.5, 0, TAU); ctx.fill();

        // Core
        ctx.globalAlpha = sa * 0.35;
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, TAU); ctx.fill();

        // Bright center on very fresh sparks
        if (heat > 0.7) {
          ctx.globalAlpha = (heat - 0.7) * 1.5 * sa;
          ctx.fillStyle = "#FFF5E6";
          ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size * 0.3, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // ── 12. Ash flakes — grey specks drifting in the dark ──
      const ashes = ashFlakesRef.current;
      if (ashes.length < maxAshFlakes && Math.random() < 0.03) {
        const d = Math.random();
        const falling = Math.random() < 0.35;
        ashes.push({
          x: fcx + (Math.random() - 0.5) * sw * (falling ? 0.3 : 0.15),
          y: falling ? fcy - vh * (0.15 + Math.random() * 0.35) : fcy - Math.random() * vh * 0.08,
          vx: (Math.random() - 0.5) * 0.06 + windX * 0.5,
          vy: falling ? 0.008 + Math.random() * 0.018 : -0.02 - Math.random() * 0.05,
          life: 1,
          size: falling ? 0.15 + Math.random() * 0.35 : 0.2 + Math.random() * 0.6,
          rotation: Math.random() * TAU,
          rotSpeed: (Math.random() - 0.5) * 0.004,
          depth: d,
        });
      }

      for (let i = ashes.length - 1; i >= 0; i--) {
        const a = ashes[i];
        a.x += a.vx + Math.sin(time * 0.3 + i * 2.7) * 0.04 + windX * (0.3 + a.depth * 0.3);
        a.y += a.vy;
        a.rotation += a.rotSpeed;
        a.life -= 0.0006;
        if (a.life <= 0 || a.y < -70 || a.y > vh * 0.88) { ashes[i] = ashes[ashes.length - 1]; ashes.pop(); continue; }

        const depthA = 0.3 + a.depth * 0.5;
        ctx.globalAlpha = a.life * 0.08 * depthA;
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rotation);
        ctx.fillStyle = "#2E2820";
        ctx.fillRect(-a.size, -a.size * 0.15, a.size * 2, a.size * 0.3);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // ── 12b. Floating dust motes — warm specks drifting in the light pool ──
      const dustMotes = dustMotesRef.current;
      const maxDust = isMobile ? 10 : 20;
      if (dustMotes.length < maxDust && Math.random() < 0.06) {
        const d = Math.random();
        dustMotes.push({
          x: fcx + (Math.random() - 0.5) * sw * 0.18,
          y: fcy + (Math.random() - 0.4) * vh * 0.12,
          vx: (Math.random() - 0.5) * 0.015,
          vy: -0.008 - Math.random() * 0.015,
          life: 1,
          size: 0.3 + Math.random() * 0.5,
          phase: Math.random() * TAU,
          depth: d,
        });
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = dustMotes.length - 1; i >= 0; i--) {
        const dm = dustMotes[i];
        dm.x += dm.vx + Math.sin(time * 0.2 + dm.phase) * 0.03 + windX * 0.15;
        dm.y += dm.vy + Math.cos(time * 0.15 + dm.phase * 1.3) * 0.02;
        dm.life -= 0.0008;
        if (dm.life <= 0 || dm.y < fcy - vh * 0.15) {
          dustMotes[i] = dustMotes[dustMotes.length - 1]; dustMotes.pop(); continue;
        }
        const da = dm.life * 0.04 * totalI * (0.3 + dm.depth * 0.7);
        ctx.globalAlpha = da;
        ctx.fillStyle = "rgb(220,150,70)";
        ctx.beginPath(); ctx.arc(dm.x, dm.y, dm.size * (0.4 + dm.depth * 0.6), 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // ── 13. Heat shimmer — drifting distortion layers above the fire ──
      const shimmerLayers = isMobile ? 5 : 8;
      const shimmerSpread = 1 + stoke * 0.5;
      ctx.globalAlpha = 0.005 * totalI;
      for (let sy = 0; sy < shimmerLayers; sy++) {
        const drift = (time * 0.03 + sy * 0.4) % 1.0;
        const yy = fcy - vh * (0.06 + drift * 0.14);
        const w = Math.sin(time * 1.2 + sy * 2.5) * sw * 0.008 * shimmerSpread
          + windX * sw * 0.05;
        const layerFade = Math.sin(drift * Math.PI); // fade in and out as it drifts
        const sg = ctx.createRadialGradient(fcx + w, yy, 0, fcx + w, yy, sw * 0.032 * shimmerSpread);
        sg.addColorStop(0, "rgba(230,160,70,1)");
        sg.addColorStop(0.4, "rgba(200,100,30,0.3)");
        sg.addColorStop(1, "rgba(150,45,8,0)");
        ctx.fillStyle = sg;
        ctx.globalAlpha = 0.005 * totalI * layerFade;
        ctx.fillRect(fcx - sw * 0.05, yy - vh * 0.012, sw * 0.1, vh * 0.024);
      }
      ctx.globalAlpha = 1;

      // ── 14. Warm color wash — unifying tint ──
      ctx.globalAlpha = (0.002 + breath * 0.0015) * totalI;
      ctx.fillStyle = "rgba(190,50,8,1)";
      ctx.fillRect(0, 0, vw, vh);
      ctx.globalAlpha = 1;

      // Reset camera shake translation
      if (shake.x !== 0 || shake.y !== 0) ctx.translate(-shake.x, -shake.y);

      // ── 15. Film grain — cinematic texture ──
      const grain = grainRef.current;
      if (grain) {
        ctx.globalAlpha = 0.018;
        ctx.globalCompositeOperation = "overlay";
        const ox = (time * 42) % 256, oy = (time * 31) % 256;
        for (let gx = -256; gx < vw + 256; gx += 256) {
          for (let gy = -256; gy < vh + 256; gy += 256) {
            ctx.drawImage(grain, gx + ox, gy + oy);
          }
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div id="main-content" className="relative w-full h-screen overflow-hidden bg-[#010101] select-none touch-none">
      <canvas ref={canvasRef} className="absolute inset-0" onPointerMove={handlePointerMove} onClick={handleClick} />

      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
        <Link href="/creative/" className="flex items-center gap-2 text-amber-600/60 hover:text-amber-500/80 transition-colors text-sm w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Creative
        </Link>
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-amber-600/45 text-sm tracking-[0.35em] uppercase font-light">Embers</span>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
        <AnimatePresence>
          {showHint && (
            <motion.p
              className="text-amber-600/50 text-sm md:text-base tracking-wide pointer-events-none text-center italic font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 3, duration: 2.5 }}
            >
              Rest here. Touch the dark to kindle what remains.
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showControls && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1.5 }}
            >
              <input
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-24 bg-transparent text-amber-600/45 text-xs font-mono text-center border-none outline-none focus:text-amber-500/70 transition-colors"
              />
              <button
                onClick={() => setSeed(SEED_WORDS[((Math.random() * SEED_WORDS.length) | 0)])}
                className="text-amber-600/40 hover:text-amber-500/60 transition-colors p-1"
                aria-label="Random seed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M 19.5 12 A 7.5 7.5 0 1 1 13.5 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
