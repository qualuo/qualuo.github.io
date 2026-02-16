"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────

interface Branch {
  x0: number; y0: number;
  cx: number; cy: number; // quadratic bezier control point — organic curves
  x1: number; y1: number;
  thickness: number;
  depth: number;
  angle: number;
  length: number;
  children: Branch[];
  blossoms: Blossom[];
  swayPhase: number;
  swayAmp: number;
}

interface Blossom {
  ox: number; oy: number;
  size: number;
  petalOffsets: number[];
  phase: number;
  bloom: number;
  hue: number;
}

interface Petal {
  x: number; y: number;
  vx: number; vy: number;
  rotation: number;
  rotSpeed: number;
  tumble: number;
  tumbleSpeed: number;
  size: number;
  alpha: number;
  colorIdx: number;
  driftPhase: number;
}

interface GroundPetal {
  x: number; y: number;
  rotation: number;
  size: number;
  alpha: number;
  colorIdx: number;
}

// ─── Constants ──────────────────────────────────────────────────────

const GROUND_Y = 0.80;
const DEFAULT_SEED = 95785;
const TAU = Math.PI * 2;
const PETAL_COLORS = [
  "#E8829E", "#DC6B8A", "#F2A5C0", "#F8D0DE",
  "#E8829E", "#F2A5C0",
];

// Bark colors per depth (0–8) — warm charcoal tones
const BARK_COLORS: string[] = [];
for (let d = 0; d <= 8; d++) {
  const t = d / 8;
  const r = Math.round(50 + t * 45);
  const g = Math.round(42 + t * 38);
  const b = Math.round(40 + t * 32);
  BARK_COLORS.push(`rgb(${r},${g},${b})`);
}

// Convert any string to a positive integer seed
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

// Seeded PRNG
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Drawing Helpers ────────────────────────────────────────────────

// Unit-scale petal Path2D — reused for every petal draw, no path rebuild
// Lazy-init: Path2D is a browser API, unavailable during SSR module evaluation
let PETAL_PATH: Path2D | null = null;
function getPetalPath(): Path2D {
  if (!PETAL_PATH) {
    PETAL_PATH = new Path2D();
    PETAL_PATH.moveTo(0, 0);
    PETAL_PATH.bezierCurveTo(0.5, -0.2, 0.45, -0.7, 0.12, -1);
    PETAL_PATH.quadraticCurveTo(0, -0.82, -0.12, -1);
    PETAL_PATH.bezierCurveTo(-0.45, -0.7, -0.5, -0.2, 0, 0);
  }
  return PETAL_PATH;
}

function drawSakuraPetal(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  angle: number, size: number,
  color: string, alpha: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(size, size);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill(getPetalPath());
  ctx.restore();
}

function drawBlossom(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  blossom: Blossom,
  time: number,
  scale: number,
) {
  const breathing = 1 + Math.sin(time * 0.6 + blossom.phase) * 0.04;
  const s = blossom.size * scale * breathing * blossom.bloom;

  // Tiny or barely-bloomed blossoms — cheap circle (canopy cloud covers them)
  if (s < 3.5) {
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.5, 0, TAU);
    ctx.fillStyle = PETAL_COLORS[Math.abs(Math.round(blossom.hue)) % PETAL_COLORS.length];
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  // Luminous warmth — overlapping halos create volumetric glow in clusters
  if (blossom.bloom > 0.5) {
    ctx.globalAlpha = 0.03;
    ctx.beginPath();
    ctx.arc(x, y, s * 2.2, 0, TAU);
    ctx.fillStyle = "#F8D0DE";
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // 5 petals
  const sway = Math.sin(time * 0.3 + blossom.phase) * 0.02;
  for (let i = 0; i < 5; i++) {
    const angle = i * 1.2566370614 + blossom.petalOffsets[i] + sway;
    const colorIdx = Math.abs(Math.round(blossom.hue + i)) % PETAL_COLORS.length;
    drawSakuraPetal(ctx, x, y, angle, s, PETAL_COLORS[colorIdx], 0.75);
  }

  // Quiet center
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(x, y, s * 0.12, 0, TAU);
  ctx.fillStyle = "#C9A064";
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ─── Branch Drawing — smooth bezier-sampled outlines ────────────────

function drawBranch(
  ctx: CanvasRenderingContext2D,
  branch: Branch,
  vw: number, vh: number,
  time: number, wind: number, scale: number,
  parentSwayX: number, parentSwayY: number,
) {
  const sway = Math.sin(time * 0.8 + branch.swayPhase) * branch.swayAmp * wind;
  const d1 = branch.depth + 1;
  const swayX = parentSwayX + sway * d1 * 8;
  const swayY = parentSwayY + Math.abs(sway) * branch.depth * 2;

  const ax = branch.x0 * vw + parentSwayX;
  const ay = branch.y0 * vh + parentSwayY;
  const bx = branch.x1 * vw + swayX;
  const by = branch.y1 * vh + swayY;
  // Control point sways as average of start and end
  const acx = branch.cx * vw + (parentSwayX + swayX) * 0.5;
  const acy = branch.cy * vh + (parentSwayY + swayY) * 0.5;

  const thick = branch.thickness * scale;
  if (thick > 0.3) {
    // Sample count proportional to thickness for smoothness
    const N = thick > 6 ? 18 : thick > 3 ? 12 : thick > 1.5 ? 8 : 5;
    const w0 = thick * 0.5;
    const w1 = thick * 0.25;
    const leftPts: { x: number; y: number }[] = [];
    const rightPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const u = 1 - t;
      // Quadratic bezier position
      const px = u * u * ax + 2 * u * t * acx + t * t * bx;
      const py = u * u * ay + 2 * u * t * acy + t * t * by;
      // Tangent
      const tdx = 2 * u * (acx - ax) + 2 * t * (bx - acx);
      const tdy = 2 * u * (acy - ay) + 2 * t * (by - acy);
      const tlen = Math.hypot(tdx, tdy);
      if (tlen < 0.01) continue;
      const nx = -tdy / tlen;
      const ny = tdx / tlen;
      // Organic taper with subtle midpoint swell
      const w = w0 + (w1 - w0) * t + Math.sin(t * Math.PI) * thick * 0.04;
      leftPts.push({ x: px + nx * w, y: py + ny * w });
      rightPts.push({ x: px - nx * w, y: py - ny * w });
    }

    if (leftPts.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(leftPts[0].x, leftPts[0].y);
      // Smooth left outline — quadratic curves through midpoints
      for (let i = 1; i < leftPts.length - 1; i++) {
        const mx = (leftPts[i].x + leftPts[i + 1].x) * 0.5;
        const my = (leftPts[i].y + leftPts[i + 1].y) * 0.5;
        ctx.quadraticCurveTo(leftPts[i].x, leftPts[i].y, mx, my);
      }
      ctx.lineTo(leftPts[leftPts.length - 1].x, leftPts[leftPts.length - 1].y);
      // Tip
      ctx.lineTo(rightPts[rightPts.length - 1].x, rightPts[rightPts.length - 1].y);
      // Smooth right outline (reversed)
      for (let i = rightPts.length - 2; i > 0; i--) {
        const mx = (rightPts[i].x + rightPts[i - 1].x) * 0.5;
        const my = (rightPts[i].y + rightPts[i - 1].y) * 0.5;
        ctx.quadraticCurveTo(rightPts[i].x, rightPts[i].y, mx, my);
      }
      ctx.lineTo(rightPts[0].x, rightPts[0].y);
      ctx.closePath();
      ctx.fillStyle = BARK_COLORS[Math.min(branch.depth, 8)];
      ctx.fill();
    }
  }

  for (const blossom of branch.blossoms) {
    drawBlossom(ctx, bx + blossom.ox * scale, by + blossom.oy * scale, blossom, time, scale);
  }

  for (const child of branch.children) {
    drawBranch(ctx, child, vw, vh, time, wind, scale, swayX, swayY);
  }
}

// ─── Canopy Cloud — soft pink mass behind individual blossoms ─────
// Real sakura canopies look like a continuous pink cloud. This pass
// draws large, low-alpha circles at every blossom cluster. Overlap
// accumulates into a dense, volumetric mass — cheap and effective.

function drawCanopyCloud(
  ctx: CanvasRenderingContext2D,
  branch: Branch,
  vw: number, vh: number,
  time: number, wind: number, scale: number,
  parentSwayX: number, parentSwayY: number,
) {
  const sway = Math.sin(time * 0.8 + branch.swayPhase) * branch.swayAmp * wind;
  const d1 = branch.depth + 1;
  const swayX = parentSwayX + sway * d1 * 8;
  const swayY = parentSwayY + Math.abs(sway) * branch.depth * 2;
  const bx = branch.x1 * vw + swayX;
  const by = branch.y1 * vh + swayY;

  if (branch.blossoms.length > 0) {
    const r = (16 + branch.blossoms.length * 2.2) * scale;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, TAU);
    ctx.fill();
  }

  for (const child of branch.children) {
    drawCanopyCloud(ctx, child, vw, vh, time, wind, scale, swayX, swayY);
  }
}

// Reusable position buffer for petal spawning
const _positionBuf: { x: number; y: number }[] = [];

function collectBlossomPositions(
  branch: Branch, vw: number, vh: number,
  time: number, wind: number,
  parentSwayX: number, parentSwayY: number,
  out: { x: number; y: number }[],
) {
  const sway = Math.sin(time * 0.8 + branch.swayPhase) * branch.swayAmp * wind;
  const swayX = parentSwayX + sway * (branch.depth + 1) * 8;
  const swayY = parentSwayY + Math.abs(sway) * branch.depth * 2;
  const bx = branch.x1 * vw + swayX;
  const by = branch.y1 * vh + swayY;

  for (const bl of branch.blossoms) {
    if (bl.bloom > 0.4) {
      out.push({ x: bx + bl.ox, y: by + bl.oy });
    }
  }
  for (const child of branch.children) {
    collectBlossomPositions(child, vw, vh, time, wind, swayX, swayY, out);
  }
}

// ─── Tree Generation ────────────────────────────────────────────────
// Poetic sakura — 間 (ma): dense blossom clouds with breathing space,
// a graceful lean like a pause in conversation.

function generateTreeStructure(seed: number): Branch {
  const rng = seededRandom(seed);

  // Sample a point along a branch's bezier curve
  function along(b: Branch, t: number) {
    const u = 1 - t;
    return {
      x: u * u * b.x0 + 2 * u * t * b.cx + t * t * b.x1,
      y: u * u * b.y0 + 2 * u * t * b.cy + t * t * b.y1,
    };
  }

  function br(
    x0: number, y0: number, ang: number, len: number,
    th: number, dep: number, curvature = 0,
  ): Branch {
    const x1 = x0 + Math.cos(ang) * len;
    const y1 = y0 + Math.sin(ang) * len;
    // Control point — midpoint offset perpendicular for organic curve
    const mx = (x0 + x1) * 0.5;
    const my = (y0 + y1) * 0.5;
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const cx = mx + nx * curvature * len;
    const cy = my + ny * curvature * len;
    return {
      x0, y0, cx, cy, x1, y1,
      thickness: th, depth: dep, angle: ang, length: len,
      children: [], blossoms: [],
      swayPhase: rng() * TAU,
      swayAmp: 0.002 + dep * 0.004,
    };
  }

  function addBlossoms(b: Branch, n: number) {
    for (let i = 0; i < n; i++) {
      b.blossoms.push({
        ox: (rng() - 0.5) * 30, oy: (rng() - 0.5) * 26 - 3,
        size: 4.5 + rng() * 6,
        petalOffsets: Array.from({ length: 5 }, () => rng() * 0.4 - 0.2),
        phase: rng() * TAU,
        bloom: 0.5 + rng() * 0.5,
        hue: rng() * 10 - 5,
      });
    }
  }

  // Recursive growth — dense clouds at tips, breathing space in between
  function grow(parent: Branch, stopDepth: number) {
    if (parent.depth >= stopDepth) {
      // Terminal clusters — dense blossom clouds
      addBlossoms(parent, 6 + (rng() * 7 | 0));
      return;
    }

    // Main continuation — always present, with gentle random curve
    const curve = (rng() - 0.5) * 0.25;
    const cont = br(parent.x1, parent.y1,
      parent.angle + (rng() - 0.5) * 0.3,
      parent.length * (0.58 + rng() * 0.14),
      parent.thickness * 0.6, parent.depth + 1, curve);
    parent.children.push(cont);
    grow(cont, stopDepth);

    // Side branch — high chance at low depth, tapering off
    const sideChance = parent.depth < 3 ? 0.82 : parent.depth < 5 ? 0.6 : 0.4;
    if (rng() < sideChance) {
      const side = rng() > 0.5 ? 1 : -1;
      const t = 0.3 + rng() * 0.35;
      const pt = along(parent, t);
      const sb = br(pt.x, pt.y,
        parent.angle + side * (0.3 + rng() * 0.4),
        parent.length * (0.5 + rng() * 0.2),
        parent.thickness * (0.35 + rng() * 0.2),
        parent.depth + 1, (rng() - 0.5) * 0.2);
      parent.children.push(sb);
      grow(sb, stopDepth);
    }

    // Second side branch at lower depths — fills the canopy
    if (parent.depth < 3 && rng() > 0.45) {
      const side = rng() > 0.5 ? 1 : -1;
      const t = 0.5 + rng() * 0.3;
      const pt = along(parent, t);
      const sb2 = br(pt.x, pt.y,
        parent.angle + side * (0.35 + rng() * 0.4),
        parent.length * (0.4 + rng() * 0.18),
        parent.thickness * (0.28 + rng() * 0.17),
        parent.depth + 2, (rng() - 0.5) * 0.3);
      parent.children.push(sb2);
      grow(sb2, stopDepth);
    }

    // Scattered blossoms along mature branches (ma — not everywhere)
    if (parent.depth >= 1 && rng() > 0.3) {
      addBlossoms(parent, 2 + (rng() * 3 | 0));
    }
  }

  // ═══ Compose — fully seed-driven, every tree unique ═══

  // Trunk — lean direction/amount, curvature, all from seed
  const leanDir = rng() > 0.5 ? -1 : 1;
  const leanAmount = 0.06 + rng() * 0.1;
  const trunkCurve = (rng() - 0.5) * 0.2;
  const trunkLen = 0.22 + rng() * 0.06;
  const trunkThick = 14 + rng() * 4;
  const trunk = br(
    0.50 + leanDir * leanAmount * 0.12, GROUND_Y,
    -Math.PI / 2 + leanDir * leanAmount,
    trunkLen, trunkThick, 0, trunkCurve,
  );
  // Trunk exits ground vertically — curvature applies above the base
  trunk.cx = trunk.x0;

  // Crown — continues upward, sustaining the lean
  const crownLean = leanDir * leanAmount * 0.3 + (rng() - 0.5) * 0.12;
  const crown = br(
    trunk.x1, trunk.y1,
    -Math.PI / 2 + crownLean,
    0.10 + rng() * 0.06, 7 + rng() * 3, 1,
    (rng() - 0.5) * 0.12,
  );
  trunk.children.push(crown);
  grow(crown, 6);

  // Major arms — 4 to 6, distributed along the trunk
  const armCount = 4 + (rng() * 3 | 0);
  const attachments: number[] = [];
  for (let i = 0; i < armCount; i++) {
    attachments.push(0.20 + rng() * 0.50);
  }
  attachments.sort((a, b) => a - b);

  let hasLeft = false, hasRight = false;
  for (let i = 0; i < armCount; i++) {
    const t = attachments[i];
    const pt = along(trunk, t);

    // Ensure at least one arm on each side
    let side: number;
    if (i === armCount - 1 && !hasLeft) side = -1;
    else if (i === armCount - 2 && !hasRight && hasLeft) side = 1;
    else side = rng() > 0.5 ? 1 : -1;
    if (side < 0) hasLeft = true; else hasRight = true;

    // Higher attachments produce longer, thicker arms
    const hf = Math.min(0.6 + t * 0.8, 1.0);
    const armAngle = -Math.PI / 2 + side * (0.35 + rng() * 0.4) + leanDir * leanAmount * 0.2;
    const armLen = (0.08 + rng() * 0.12) * hf;
    const armThick = (3 + rng() * 4) * hf;
    const armCurve = side * rng() * 0.2;
    const armDepth = t < 0.35 ? 2 : 1;

    const arm = br(pt.x, pt.y, armAngle, armLen, armThick, armDepth, armCurve);
    trunk.children.push(arm);
    grow(arm, 6);
  }

  // Upper fork from crown — 70% chance
  if (rng() > 0.3) {
    const t = 0.4 + rng() * 0.3;
    const pt = along(crown, t);
    const side = rng() > 0.5 ? 1 : -1;
    const fork = br(
      pt.x, pt.y,
      -Math.PI / 2 + side * (0.25 + rng() * 0.3),
      0.06 + rng() * 0.06, 3 + rng() * 2, 2,
      (rng() - 0.5) * 0.12,
    );
    crown.children.push(fork);
    grow(fork, 6);
  }

  // Cascading / weeping branch — 50% chance, from a random arm
  if (rng() > 0.5 && trunk.children.length > 1) {
    const parentIdx = 1 + ((rng() * (trunk.children.length - 1)) | 0);
    const parentArm = trunk.children[parentIdx];
    const t = 0.5 + rng() * 0.3;
    const pt = along(parentArm, t);
    const side = rng() > 0.5 ? 1 : -1;
    const cascade = br(
      pt.x, pt.y,
      -Math.PI / 2 + side * (0.9 + rng() * 0.4),
      0.05 + rng() * 0.05, 2 + rng() * 1.5, 3,
      side * (0.15 + rng() * 0.15),
    );
    parentArm.children.push(cascade);
    grow(cascade, 6);
  }

  return trunk;
}

function spawnPetal(petals: Petal[], x: number, y: number, burst = false) {
  const speed = burst ? 1.5 + Math.random() * 2 : 0.3 + Math.random() * 0.5;
  const angle = burst ? Math.random() * TAU : Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
  petals.push({
    x, y,
    vx: Math.cos(angle) * speed * (burst ? 1 : 0.3),
    vy: Math.sin(angle) * speed * (burst ? 0.5 : 0.1),
    rotation: Math.random() * TAU,
    rotSpeed: (Math.random() - 0.5) * 0.06,
    tumble: Math.random() * TAU,
    tumbleSpeed: 0.02 + Math.random() * 0.04,
    size: 4 + Math.random() * 5,
    alpha: 0.8 + Math.random() * 0.2,
    colorIdx: (Math.random() * PETAL_COLORS.length) | 0,
    driftPhase: Math.random() * TAU,
  });
}

// ─── Component ──────────────────────────────────────────────────────

export default function SakuraClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const treeRef = useRef<Branch | null>(null);
  const petalsRef = useRef<Petal[]>([]);
  const groundPetalsRef = useRef<GroundPetal[]>([]);
  const groundDirtyRef = useRef(true);
  const groundCanvasRef = useRef<OffscreenCanvas | HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothWindRef = useRef(0);
  const frameRef = useRef<number>(0);
  const gustRef = useRef(0);
  const [showHint, setShowHint] = useState(true);
  const [seed, setSeed] = useState(String(DEFAULT_SEED));

  // Read seed from URL or sessionStorage (404 redirect) on mount
  useEffect(() => {
    const redirected = sessionStorage.getItem("sakura-seed");
    if (redirected) {
      sessionStorage.removeItem("sakura-seed");
      setSeed(redirected);
      return;
    }
    const match = window.location.pathname.match(/\/creative\/sakura\/([^/]+)/);
    if (match?.[1]) {
      setSeed(decodeURIComponent(match[1]));
    }
  }, []);

  // Sync seed to URL
  useEffect(() => {
    const trimmed = seed.trim();
    const base = "/creative/sakura/";
    const target = trimmed && trimmed !== String(DEFAULT_SEED)
      ? `${base}${encodeURIComponent(trimmed)}`
      : base;
    if (window.location.pathname !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [seed]);

  useEffect(() => {
    treeRef.current = generateTreeStructure(seedToNumber(seed));
    // Clear petals when tree changes
    petalsRef.current.length = 0;
    groundPetalsRef.current.length = 0;
    groundDirtyRef.current = true;
  }, [seed]);

  const handleClick = useCallback(() => {
    gustRef.current = Math.min(gustRef.current + 0.5, 1.5);
    setShowHint(false);
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
    let dpr = 1;
    let vw = 0, vh = 0;
    let isMobile = false;
    let hidden = false;
    let bgCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;

    let maxPetals = 600;
    let maxGroundPetals = 400;

    function createOffscreen(w: number, h: number) {
      try { return new OffscreenCanvas(w, h); }
      catch { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
    }

    function renderBackground(target: OffscreenCanvas | HTMLCanvasElement) {
      const bgCtx = target.getContext("2d")! as CanvasRenderingContext2D;
      bgCtx.clearRect(0, 0, target.width, target.height);
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const groundY = vh * GROUND_Y;

      bgCtx.fillStyle = "#FAF8F5";
      bgCtx.fillRect(0, 0, vw, vh);

      bgCtx.fillStyle = "#8B9DAF";
      bgCtx.globalAlpha = 0.022;
      bgCtx.beginPath();
      bgCtx.moveTo(0, groundY);
      bgCtx.lineTo(0, groundY * 0.56);
      bgCtx.quadraticCurveTo(vw * 0.09, groundY * 0.36, vw * 0.19, groundY * 0.50);
      bgCtx.quadraticCurveTo(vw * 0.29, groundY * 0.30, vw * 0.40, groundY * 0.46);
      bgCtx.lineTo(vw * 0.54, groundY);
      bgCtx.closePath();
      bgCtx.fill();

      bgCtx.fillStyle = "#9B8E82";
      bgCtx.globalAlpha = 0.028;
      bgCtx.beginPath();
      bgCtx.moveTo(vw * 0.46, groundY);
      bgCtx.quadraticCurveTo(vw * 0.56, groundY * 0.48, vw * 0.68, groundY * 0.40);
      bgCtx.quadraticCurveTo(vw * 0.80, groundY * 0.36, vw * 0.90, groundY * 0.52);
      bgCtx.lineTo(vw, groundY * 0.60);
      bgCtx.lineTo(vw, groundY);
      bgCtx.closePath();
      bgCtx.fill();

      bgCtx.fillStyle = "#A09488";
      bgCtx.globalAlpha = 0.016;
      bgCtx.beginPath();
      bgCtx.moveTo(vw * 0.70, groundY);
      bgCtx.quadraticCurveTo(vw * 0.82, groundY * 0.68, vw * 0.94, groundY * 0.63);
      bgCtx.lineTo(vw, groundY * 0.70);
      bgCtx.lineTo(vw, groundY);
      bgCtx.closePath();
      bgCtx.fill();
      bgCtx.globalAlpha = 1;

      const mistGrad = bgCtx.createLinearGradient(0, groundY * 0.45, 0, groundY * 0.92);
      mistGrad.addColorStop(0, "rgba(251,245,236,0)");
      mistGrad.addColorStop(0.3, "rgba(250,248,245,0.65)");
      mistGrad.addColorStop(0.6, "rgba(250,248,245,0.45)");
      mistGrad.addColorStop(1, "rgba(250,248,245,0)");
      bgCtx.fillStyle = mistGrad;
      bgCtx.fillRect(0, groundY * 0.45, vw, groundY * 0.47);

      bgCtx.globalAlpha = 0.04;
      bgCtx.strokeStyle = "#9B9590";
      bgCtx.lineWidth = 0.5;
      bgCtx.beginPath();
      bgCtx.moveTo(0, groundY);
      bgCtx.quadraticCurveTo(vw * 0.5, groundY - 2, vw, groundY);
      bgCtx.stroke();
      bgCtx.globalAlpha = 1;
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      isMobile = vw < 768;
      maxPetals = isMobile ? 280 : 600;
      maxGroundPetals = isMobile ? 180 : 400;

      groundCanvasRef.current = createOffscreen(vw * dpr, vh * dpr);
      groundDirtyRef.current = true;

      bgCanvas = createOffscreen(vw * dpr, vh * dpr);
      renderBackground(bgCanvas);
    };
    resize();
    window.addEventListener("resize", resize);

    const onVisibility = () => { hidden = document.hidden; };
    document.addEventListener("visibilitychange", onVisibility);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (hidden) return;

      const now = performance.now();
      const time = now / 1000;
      const scale = Math.min(vh / 800, 1.4);
      // Cap horizontal stretch — on wide screens, tree stays proportional
      const treeW = vh * Math.min(vw / vh, 1.4);
      const treeOx = (vw - treeW) * 0.5;
      const groundY = vh * GROUND_Y;

      const gust = gustRef.current;
      gustRef.current *= 0.97;
      if (gustRef.current < 0.005) gustRef.current = 0;

      const targetWind = Math.sin(time * 0.3) * 0.6 + Math.sin(time * 0.17) * 0.3
        + (mouseRef.current.x - 0.5) * 2 + gust * 3;
      smoothWindRef.current += (targetWind - smoothWindRef.current) * 0.03;
      const wind = smoothWindRef.current + gust * 2;

      // ── Background (cached offscreen) ──
      if (bgCanvas) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(bgCanvas as CanvasImageSource, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.restore();
      }

      // ── Ground petals (offscreen canvas, redrawn only when dirty) ──
      const gPetals = groundPetalsRef.current;
      const gCanvas = groundCanvasRef.current;
      if (gCanvas && groundDirtyRef.current && gPetals.length > 0) {
        const gCtx = gCanvas.getContext("2d")! as CanvasRenderingContext2D;
        gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
        gCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const gp of gPetals) {
          drawSakuraPetal(gCtx, gp.x, gp.y, gp.rotation, gp.size, PETAL_COLORS[gp.colorIdx], gp.alpha);
        }
        groundDirtyRef.current = false;
      }
      if (gCanvas && gPetals.length > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(gCanvas as CanvasImageSource, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.restore();
      }

      // ── Tree ──
      const tree = treeRef.current;
      if (tree) {
        const trunkBaseX = tree.x0 * treeW + treeOx;

        // ── Soft shadow beneath tree ──
        ctx.globalAlpha = 0.035;
        ctx.fillStyle = "rgba(50,42,40,1)";
        const shW = vw * 0.16;
        const shH = vh * 0.01;
        ctx.beginPath();
        ctx.moveTo(trunkBaseX - shW, groundY + 5);
        ctx.bezierCurveTo(trunkBaseX - shW * 0.6, groundY + 5 - shH, trunkBaseX + shW * 0.6, groundY + 5 - shH, trunkBaseX + shW, groundY + 5);
        ctx.bezierCurveTo(trunkBaseX + shW * 0.6, groundY + 5 + shH * 1.5, trunkBaseX - shW * 0.6, groundY + 5 + shH * 1.5, trunkBaseX - shW, groundY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // ── Root whisper — sumi-e ink suggestion of roots ──
        ctx.globalAlpha = 0.06;
        ctx.strokeStyle = BARK_COLORS[0];
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(trunkBaseX - 2, groundY);
        ctx.quadraticCurveTo(trunkBaseX - vw * 0.04, groundY + 3, trunkBaseX - vw * 0.07, groundY + 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(trunkBaseX + 3, groundY);
        ctx.quadraticCurveTo(trunkBaseX + vw * 0.03, groundY + 4, trunkBaseX + vw * 0.055, groundY + 2);
        ctx.stroke();
        ctx.globalAlpha = 0.04;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(trunkBaseX - 4, groundY + 1);
        ctx.quadraticCurveTo(trunkBaseX - vw * 0.025, groundY + 5, trunkBaseX - vw * 0.045, groundY + 3);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // ── Canopy cloud + tree — rendered in aspect-capped space ──
        ctx.save();
        ctx.translate(treeOx, 0);
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = "#F2C4D4";
        drawCanopyCloud(ctx, tree, treeW, vh, time, wind, scale, 0, 0);
        ctx.globalAlpha = 1;

        drawBranch(ctx, tree, treeW, vh, time, wind, scale, 0, 0);
        ctx.restore();

        // ── Spawn falling petals ──
        const petals = petalsRef.current;

        const spawnChance = 0.42 + gust * 0.6;
        if (petals.length < maxPetals && Math.random() < spawnChance) {
          _positionBuf.length = 0;
          collectBlossomPositions(tree, treeW, vh, time, wind, 0, 0, _positionBuf);
          for (let j = 0; j < _positionBuf.length; j++) _positionBuf[j].x += treeOx;
          if (_positionBuf.length > 0) {
            const src = _positionBuf[(Math.random() * _positionBuf.length) | 0];
            spawnPetal(petals, src.x, src.y);
          }
        }

        // Wind gust releases extra petals
        if (gust > 0.3) {
          const burstCount = (gust * 8) | 0;
          if (_positionBuf.length === 0) {
            collectBlossomPositions(tree, treeW, vh, time, wind, 0, 0, _positionBuf);
            for (let j = 0; j < _positionBuf.length; j++) _positionBuf[j].x += treeOx;
          }
          for (let i = 0; i < burstCount && petals.length < maxPetals && _positionBuf.length > 0; i++) {
            const src = _positionBuf[(Math.random() * _positionBuf.length) | 0];
            spawnPetal(petals, src.x, src.y, true);
          }
        }

        // ── Update falling petals (physics pass) ──
        for (let i = petals.length - 1; i >= 0; i--) {
          const p = petals[i];

          p.vy += 0.007;
          p.vx += wind * 0.006;
          p.vx *= 0.995;
          p.vy *= 0.998;

          p.x += p.vx + Math.sin(time * 2.5 + p.driftPhase) * 0.35
            + Math.sin(time * 1.1 + p.driftPhase * 1.7) * 0.18;
          p.y += p.vy;
          p.rotation += p.rotSpeed;
          p.tumble += p.tumbleSpeed;

          if (p.y >= groundY - 2) {
            if (gPetals.length < maxGroundPetals) {
              const bias = Math.random() * 0.3;
              const landX = p.x + (trunkBaseX - p.x) * bias;
              gPetals.push({
                x: landX,
                y: groundY + Math.random() * 12,
                rotation: p.rotation,
                size: p.size * 0.9,
                alpha: 0.55 + Math.random() * 0.25,
                colorIdx: p.colorIdx,
              });
              groundDirtyRef.current = true;
            }
            petals[i] = petals[petals.length - 1]; petals.pop();
            continue;
          }

          if (p.x < -30 || p.x > vw + 30) {
            petals[i] = petals[petals.length - 1]; petals.pop();
          }
        }

        // ── Draw falling petals (batched by color — minimizes fillStyle changes) ──
        for (let c = 0; c < PETAL_COLORS.length; c++) {
          ctx.fillStyle = PETAL_COLORS[c];
          for (let i = 0; i < petals.length; i++) {
            const p = petals[i];
            if (p.colorIdx !== c) continue;
            const tumbleScale = 0.3 + Math.abs(Math.cos(p.tumble)) * 0.7;
            const tumbleY = 0.6 + Math.abs(Math.sin(p.tumble * 0.7)) * 0.4;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.scale(tumbleScale * p.size, tumbleY * p.size);
            ctx.globalAlpha = p.alpha;
            ctx.fill(getPetalPath());
            ctx.restore();
          }
        }
      }

      ctx.globalAlpha = 1;
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div id="main-content" className="relative w-full h-screen overflow-hidden bg-[#FAF8F5] select-none touch-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      />

      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
        <Link
          href="/creative/"
          className="flex items-center gap-2 text-neutral-400 hover:text-neutral-600 transition-colors text-sm w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Creative
        </Link>
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-neutral-400/60 text-sm tracking-widest uppercase">Sakura</span>
      </div>

      <span className="absolute top-9 left-1/2 -translate-x-1/2 z-20 text-neutral-400/40 text-sm">桜</span>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
        <AnimatePresence>
          {showHint && (
            <motion.p
              className="text-neutral-400/60 text-sm md:text-base tracking-wide pointer-events-none text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              Move to guide the wind. Click to send a gust. Find your tree below.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Seed control */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-24 bg-transparent text-neutral-400/50 text-xs font-mono text-center
              border-none outline-none focus:text-neutral-500"
          />
          <button
            onClick={() => setSeed(String(((Math.random() * 99999) | 0) + 1))}
            className="text-neutral-400/40 hover:text-neutral-500 transition-colors p-1"
            aria-label="Random seed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M 19.5 12 A 7.5 7.5 0 1 1 13.5 4.8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}