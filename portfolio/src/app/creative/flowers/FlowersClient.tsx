"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────

interface FlowerState {
  xPct: number;        // 0-1 across viewport width
  type: number;        // index into FLOWERS
  growth: number;      // 0-1
  maxHeight: number;   // px at scale=1
  curve: number;       // stem curvature px
  windPhase: number;
  petalOffsets: number[];
  leafTs: number[];    // 0-1 positions along stem
  leafSides: number[]; // -1 or 1
  plantedAt: number;   // timestamp
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; alpha: number;
  color: string; life: number;
}

interface Butterfly {
  x: number; y: number;
  targetX: number; targetY: number;
  wingPhase: number;
  color: string;
  accentColor: string;
  speed: number;
  size: number;
  pauseUntil: number; // timestamp — 0 means moving
}

interface ShootingStar {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  length: number;
}

interface Firefly {
  x: number; y: number;
  vx: number; vy: number;
  phase: number;
  size: number;
  brightness: number;
}

interface Seed {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  type: number;
  driftPhase: number;
  size: number;
}

interface Raindrop {
  x: number; y: number;
  speed: number;
  length: number;
}

// ─── Flower Configurations ──────────────────────────────────────────

type PetalShape = "cupped" | "pointed" | "tulip" | "thin" | "round";

const FLOWERS: { name: string; petals: number; layers: number; pLen: number; pWid: number; inner: string; outer: string; center: string; cR: number; shape: PetalShape }[] = [
  { name: "Rose",      petals: 12, layers: 3, pLen: 18, pWid: 14, inner: "#E11D48", outer: "#FB7185", center: "#881337", cR: 5,  shape: "cupped"  },
  { name: "Camellia",  petals: 7,  layers: 2, pLen: 17, pWid: 14, inner: "#DC2660", outer: "#F472B6", center: "#FBBF24", cR: 5,  shape: "round"   },
  { name: "Sunflower", petals: 16, layers: 2, pLen: 22, pWid: 8,  inner: "#F59E0B", outer: "#FDE047", center: "#78350F", cR: 12, shape: "pointed" },
  { name: "Tulip",     petals: 6,  layers: 2, pLen: 24, pWid: 12, inner: "#A855F7", outer: "#D8B4FE", center: "#6B21A8", cR: 4,  shape: "tulip"   },
  { name: "Daisy",     petals: 14, layers: 1, pLen: 16, pWid: 5,  inner: "#FFFFFF", outer: "#F0F0FF", center: "#FBBF24", cR: 7,  shape: "thin"    },
  { name: "Lotus",     petals: 8,  layers: 3, pLen: 20, pWid: 14, inner: "#FDA4AF", outer: "#FFF1F2", center: "#F43F5E", cR: 5,  shape: "round"   },
];

const BUTTERFLY_COLORS = [
  { body: "#C4B5FD", accent: "#7C3AED" },
  { body: "#F9A8D4", accent: "#EC4899" },
  { body: "#FDE68A", accent: "#F59E0B" },
  { body: "#A7F3D0", accent: "#10B981" },
  { body: "#FDBA74", accent: "#EA580C" },
];

const GROWTH_DURATION = 4000; // ms
const GROUND_PCT = 0.82;
const MAX_FLOWERS = 50;
const DRAG_THRESHOLD = 60; // px between drag-planted flowers

// ─── Drawing Helpers ────────────────────────────────────────────────

function drawPetal(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  angle: number, length: number, width: number,
  c1: string, c2: string, alpha: number,
  shape: PetalShape = "round",
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.beginPath();

  switch (shape) {
    case "cupped": // Rose — tighter, cupped petals with rolled edges
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(width * 0.7, -length * 0.15, width * 0.5, -length * 0.7, width * 0.1, -length * 0.92);
      ctx.quadraticCurveTo(0, -length * 1.02, -width * 0.1, -length * 0.92);
      ctx.bezierCurveTo(-width * 0.5, -length * 0.7, -width * 0.7, -length * 0.15, 0, 0);
      break;
    case "pointed": // Sunflower — narrow, sharply pointed
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(width * 0.5, -length * 0.2, width * 0.3, -length * 0.6, 0, -length);
      ctx.bezierCurveTo(-width * 0.3, -length * 0.6, -width * 0.5, -length * 0.2, 0, 0);
      break;
    case "tulip": // Tulip — wide middle, tapers at both ends
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(width * 0.3, -length * 0.1, width * 0.8, -length * 0.35, width * 0.35, -length * 0.7);
      ctx.quadraticCurveTo(0, -length * 1.05, -width * 0.35, -length * 0.7);
      ctx.bezierCurveTo(-width * 0.8, -length * 0.35, -width * 0.3, -length * 0.1, 0, 0);
      break;
    case "thin": // Daisy — very thin, elongated
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(width * 0.4, -length * 0.3, width * 0.2, -length * 0.8, 0, -length);
      ctx.bezierCurveTo(-width * 0.2, -length * 0.8, -width * 0.4, -length * 0.3, 0, 0);
      break;
    default: // Lotus/round — broad, rounded with gentle taper
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(width * 0.6, -length * 0.25, width * 0.45, -length * 0.75, width * 0.05, -length * 0.95);
      ctx.quadraticCurveTo(0, -length, -width * 0.05, -length * 0.95);
      ctx.bezierCurveTo(-width * 0.45, -length * 0.75, -width * 0.6, -length * 0.25, 0, 0);
      break;
  }

  const g = ctx.createLinearGradient(0, 0, 0, -length);
  g.addColorStop(0, c1);
  g.addColorStop(0.6, c2);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fill();

  // Central vein (single stroke — reuses the existing path context)
  ctx.beginPath();
  ctx.moveTo(0, -length * 0.05);
  ctx.lineTo(0, -length * 0.85);
  ctx.strokeStyle = c1;
  ctx.globalAlpha = alpha * 0.12;
  ctx.lineWidth = 0.4;
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  angle: number, size: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Leaf shape — slightly asymmetric for realism
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.35, -size * 0.32, size * 0.75, -size * 0.18, size, 0);
  ctx.bezierCurveTo(size * 0.75, size * 0.14, size * 0.4, size * 0.28, 0, 0);
  const g = ctx.createLinearGradient(0, 0, size, 0);
  g.addColorStop(0, "#2d5a2d");
  g.addColorStop(1, "#4ade80");
  ctx.fillStyle = g;
  ctx.globalAlpha = 0.8;
  ctx.fill();

  // Midrib vein (single stroke)
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(size * 0.85, 0);
  ctx.strokeStyle = "#1a4a1a";
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.restore();
}

function stemPoint(
  baseX: number, groundY: number, height: number,
  curve: number, wind: number, t: number,
) {
  const x = baseX + curve * Math.sin(t * Math.PI) * t + wind * t * t;
  const y = groundY - height * t;
  return { x, y };
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  f: FlowerState, w: number, h: number,
  time: number, scale: number, windBias: number = 0,
) {
  const cfg = FLOWERS[f.type];
  const baseX = f.xPct * w;
  const groundY = h * GROUND_PCT;
  const ht = f.maxHeight * scale;
  const wind = Math.sin(time * 0.8 + f.windPhase) * 12 * scale + windBias;
  const g = f.growth;

  // Growth phases
  const stemPct = Math.min(g / 0.55, 1);
  const leafPct = Math.max(0, Math.min((g - 0.3) / 0.3, 1));
  const petalPct = Math.max(0, Math.min((g - 0.6) / 0.4, 1));

  if (stemPct <= 0) return;

  // ── Stem (tapered — filled polygon, single draw call) ──
  const stemH = ht * stemPct;
  const steps = 16;
  const cv = f.curve * scale;
  // Build right edge (going up) then left edge (coming down)
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = stemPoint(baseX, groundY, stemH, cv, wind, t);
    const halfW = Math.max(0.4, (1.5 - t * 0.9) * scale);
    if (i === 0) ctx.moveTo(p.x + halfW, p.y);
    else ctx.lineTo(p.x + halfW, p.y);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const p = stemPoint(baseX, groundY, stemH, cv, wind, t);
    const halfW = Math.max(0.4, (1.5 - t * 0.9) * scale);
    ctx.lineTo(p.x - halfW, p.y);
  }
  ctx.closePath();
  const stemGrad = ctx.createLinearGradient(baseX, groundY, baseX, groundY - stemH);
  stemGrad.addColorStop(0, "#2d5a2d");
  stemGrad.addColorStop(1, "#4ade80");
  ctx.fillStyle = stemGrad;
  ctx.fill();

  // ── Leaves ──
  if (leafPct > 0) {
    const leafAlpha = leafPct;
    ctx.globalAlpha = leafAlpha;
    for (let i = 0; i < f.leafTs.length; i++) {
      const lt = f.leafTs[i];
      if (lt > stemPct) continue;
      const p = stemPoint(baseX, groundY, stemH, cv, wind, lt);
      const side = f.leafSides[i];
      const leafSize = (14 + i * 3) * scale;
      const leafAngle = side * (0.6 + Math.sin(time * 1.2 + i) * 0.1) + wind * 0.01;
      drawLeaf(ctx, p.x, p.y, leafAngle, leafSize);
    }
    ctx.globalAlpha = 1;
  }

  // ── Petals & center ──
  if (petalPct > 0) {
    const tip = stemPoint(baseX, groundY, stemH, cv, wind, 1);

    // Sepals (small green pointed shapes at flower base)
    const sepalCount = Math.min(5, Math.max(3, Math.floor(cfg.petals / 3)));
    for (let i = 0; i < sepalCount; i++) {
      const sepalAngle = (i / sepalCount) * Math.PI * 2 + Math.PI;
      const sepalLen = cfg.pLen * 0.35 * scale * petalPct;
      ctx.save();
      ctx.translate(tip.x, tip.y);
      ctx.rotate(sepalAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(2.5 * scale, -sepalLen * 0.3, 1.5 * scale, -sepalLen * 0.8, 0, -sepalLen);
      ctx.bezierCurveTo(-1.5 * scale, -sepalLen * 0.8, -2.5 * scale, -sepalLen * 0.3, 0, 0);
      ctx.fillStyle = "#2d6a2d";
      ctx.globalAlpha = 0.5 * petalPct;
      ctx.fill();
      ctx.restore();
    }

    // Petals
    for (let layer = cfg.layers - 1; layer >= 0; layer--) {
      const layerPetals = Math.max(3, cfg.petals - layer * 2);
      const layerScale = 1 - layer * 0.2;
      const layerRotation = layer * 0.2;

      for (let i = 0; i < layerPetals; i++) {
        const baseAngle = (i / layerPetals) * Math.PI * 2 + layerRotation;
        const offset = f.petalOffsets[i % f.petalOffsets.length] * 0.1;
        const angle = baseAngle + offset + Math.sin(time * 0.5 + i) * 0.02;
        const len = cfg.pLen * layerScale * scale * petalPct;
        const wid = cfg.pWid * layerScale * scale * petalPct;
        const alpha = 0.7 + layer * 0.1;
        drawPetal(ctx, tip.x, tip.y, angle, len, wid, cfg.inner, cfg.outer, alpha, cfg.shape);
      }
    }

    // Center disc
    const cr = cfg.cR * scale * petalPct;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, cr, 0, Math.PI * 2);
    ctx.fillStyle = cfg.center;
    ctx.globalAlpha = petalPct;
    ctx.fill();

    // Center highlight (specular)
    const specular = ctx.createRadialGradient(tip.x - cr * 0.2, tip.y - cr * 0.2, 0, tip.x, tip.y, cr);
    specular.addColorStop(0, "rgba(255,255,255,0.2)");
    specular.addColorStop(1, "transparent");
    ctx.fillStyle = specular;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Flower-specific center details
    if (f.type === 2 && petalPct > 0.5) {
      // Sunflower — Fibonacci spiral seed pattern
      ctx.globalAlpha = petalPct * 0.6;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5°
      for (let s = 0; s < 30; s++) {
        const r = Math.sqrt(s) * cr * 0.18;
        if (r > cr * 0.9) break;
        const a = s * goldenAngle;
        const dx = Math.cos(a) * r;
        const dy = Math.sin(a) * r;
        ctx.beginPath();
        ctx.arc(tip.x + dx, tip.y + dy, 0.6 + (s % 3) * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = s % 2 === 0 ? "#451a03" : "#78350F";
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if ((f.type === 0 || f.type === 5) && petalPct > 0.5) {
      // Rose & Lotus — small stamen dots around center
      ctx.globalAlpha = petalPct * 0.5;
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2 + time * 0.1;
        const r = cr * 0.6;
        ctx.beginPath();
        ctx.arc(tip.x + Math.cos(a) * r, tip.y + Math.sin(a) * r, 0.6 * scale, 0, Math.PI * 2);
        ctx.fillStyle = "#FDE047";
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (f.type === 1 && petalPct > 0.5) {
      // Camellia — dense burst of golden stamens (tsubaki signature)
      const stamenCount = 18;
      for (let s = 0; s < stamenCount; s++) {
        const a = (s / stamenCount) * Math.PI * 2 + Math.sin(time * 0.2 + s) * 0.03;
        const stLen = cr * (1.2 + (s % 3) * 0.3);
        // Filament
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(tip.x + Math.cos(a) * stLen, tip.y + Math.sin(a) * stLen);
        ctx.strokeStyle = "#FDE68A";
        ctx.globalAlpha = petalPct * 0.5;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Anther dot
        ctx.beginPath();
        ctx.arc(tip.x + Math.cos(a) * stLen, tip.y + Math.sin(a) * stLen, 0.9 + (s % 2) * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = "#FBBF24";
        ctx.globalAlpha = petalPct * 0.7;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
}

function getFlowerTip(f: FlowerState, w: number, h: number, time: number, scale: number, windBias: number = 0) {
  const baseX = f.xPct * w;
  const groundY = h * GROUND_PCT;
  const ht = f.maxHeight * scale;
  const wind = Math.sin(time * 0.8 + f.windPhase) * 12 * scale + windBias;
  return stemPoint(baseX, groundY, ht, f.curve * scale, wind, 1);
}

function drawButterfly(
  ctx: CanvasRenderingContext2D,
  b: Butterfly, time: number,
) {
  const wingAngle = Math.sin(time * 8 + b.wingPhase) * 0.7;
  ctx.save();
  ctx.translate(b.x, b.y);

  // Direction the butterfly is moving
  const dx = b.targetX - b.x;
  const facing = dx > 0 ? 1 : -1;
  ctx.scale(facing, 1);

  // Wings (two pairs)
  for (const side of [-1, 1]) {
    const spread = side * wingAngle;
    ctx.save();
    ctx.rotate(spread);

    // Upper wing
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      side * b.size * 0.5, -b.size * 0.8,
      side * b.size, -b.size * 0.4,
      side * b.size * 0.6, 0
    );
    ctx.fillStyle = b.color;
    ctx.globalAlpha = 0.7;
    ctx.fill();

    // Lower wing (smaller)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      side * b.size * 0.4, b.size * 0.3,
      side * b.size * 0.7, b.size * 0.5,
      side * b.size * 0.3, b.size * 0.1
    );
    ctx.fillStyle = b.accentColor;
    ctx.globalAlpha = 0.5;
    ctx.fill();

    ctx.restore();
  }

  // Body
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, 1.5, b.size * 0.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a2e";
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawMoon(ctx: CanvasRenderingContext2D, vw: number, vh: number, time: number) {
  const mx = vw * 0.78 + Math.sin(time * 0.1) * 3;
  const my = vh * 0.11 + Math.cos(time * 0.08) * 2;
  const r = 22;

  // Glow
  const glow = ctx.createRadialGradient(mx, my, r * 0.5, mx, my, r * 4);
  glow.addColorStop(0, "rgba(200, 200, 240, 0.06)");
  glow.addColorStop(0.5, "rgba(200, 200, 240, 0.02)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(mx - r * 4, my - r * 4, r * 8, r * 8);

  // Moon body
  ctx.beginPath();
  ctx.arc(mx, my, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(220, 220, 245, 0.12)";
  ctx.fill();

  // Crescent via clipping: draw moon circle, then cut shadow with destination-out
  ctx.save();
  ctx.beginPath();
  ctx.arc(mx, my, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.clearRect(mx - r - 1, my - r - 1, r * 2 + 2, r * 2 + 2);
  // Fill with crescent
  ctx.beginPath();
  ctx.arc(mx, my, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(220, 220, 245, 0.12)";
  ctx.fill();
  // Cut
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(mx + r * 0.55, my - r * 0.2, r * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Component ──────────────────────────────────────────────────────

export default function FlowersClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowersRef = useRef<FlowerState[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const butterfliesRef = useRef<Butterfly[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const firefliesRef = useRef<Firefly[]>([]);
  const seedsRef = useRef<Seed[]>([]);
  const raindropsRef = useRef<Raindrop[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 }); // normalized 0-1
  const frameRef = useRef<number>(0);
  const isDragging = useRef(false);
  const lastPlantX = useRef(0);
  const [selectedType, setSelectedType] = useState(0);
  const [flowerCount, setFlowerCount] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [isRaining, setIsRaining] = useState(false);
  const isRainingRef = useRef(false);
  useEffect(() => { isRainingRef.current = isRaining; }, [isRaining]);

  // Stable ref for selected type so animation loop sees latest
  const selectedRef = useRef(selectedType);
  useEffect(() => { selectedRef.current = selectedType; }, [selectedType]);

  const plantFlower = useCallback((xPct: number, typeOverride?: number, timeOffset?: number) => {
    if (flowersRef.current.length >= MAX_FLOWERS) {
      flowersRef.current.shift();
    }
    const type = typeOverride ?? selectedRef.current;
    const petalOffsets = Array.from({ length: 20 }, () => Math.random() * 2 - 1);
    const leafCount = 2 + Math.floor(Math.random() * 3);
    const leafTs = Array.from({ length: leafCount }, (_, i) => 0.2 + (i / leafCount) * 0.5 + Math.random() * 0.1);
    const leafSides = leafTs.map((_, i) => (i % 2 === 0 ? -1 : 1));

    flowersRef.current.push({
      xPct,
      type,
      growth: 0,
      maxHeight: 110 + Math.random() * 70,
      curve: (Math.random() - 0.5) * 30,
      windPhase: Math.random() * Math.PI * 2,
      petalOffsets,
      leafTs,
      leafSides,
      plantedAt: performance.now() + (timeOffset ?? 0),
    });

    // Burst particles
    const px = xPct;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
      particlesRef.current.push({
        x: px, y: 0,
        vx: Math.cos(angle) * (1 + Math.random()) * 0.001,
        vy: -Math.random() * 0.003 - 0.001,
        size: 1.5 + Math.random() * 2,
        alpha: 0.8,
        color: FLOWERS[type].inner,
        life: 1,
      });
    }

    setFlowerCount(flowersRef.current.length);
    setShowHint(false);
  }, []);

  // Canvas setup & animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let dpr = window.devicePixelRatio || 1;
    let vw = 0, vh = 0;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const now = performance.now();
      const time = now / 1000;
      const scale = Math.min(vh / 800, 1.3);
      const windBias = (mouseRef.current.x - 0.5) * 25;
      ctx.clearRect(0, 0, vw, vh);

      // ── Background ──
      const bg = ctx.createLinearGradient(0, 0, 0, vh);
      bg.addColorStop(0, "#04060a");
      bg.addColorStop(0.5, "#080a10");
      bg.addColorStop(GROUND_PCT - 0.03, "#0e0c08");
      bg.addColorStop(GROUND_PCT, "#16130d");
      bg.addColorStop(1, "#100e08");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, vw, vh);

      // ── Moon ──
      drawMoon(ctx, vw, vh, time);

      // Stars (batched into single path per brightness group)
      ctx.fillStyle = "#c4b5fd";
      for (let group = 0; group < 3; group++) {
        ctx.beginPath();
        for (let i = group; i < 50; i += 3) {
          const sx = ((i * 137.5) % vw);
          const sy = ((i * 73.1) % (vh * GROUND_PCT * 0.7));
          ctx.moveTo(sx + 0.6 + group * 0.3, sy);
          ctx.arc(sx, sy, 0.6 + group * 0.3, 0, Math.PI * 2);
        }
        const flicker = 0.4 + Math.sin(time * 0.5 + group * 2.3) * 0.3;
        ctx.globalAlpha = flicker * 0.25;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Shooting stars ──
      const stars = shootingStarsRef.current;
      // Spawn chance (~0.2% per frame ≈ one every ~8s at 60fps)
      if (Math.random() < 0.002) {
        const startX = Math.random() * vw * 0.6;
        const startY = Math.random() * vh * 0.3;
        const angle = 0.3 + Math.random() * 0.5; // shallow angle
        const speed = 4 + Math.random() * 4;
        stars.push({
          x: startX, y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          length: 30 + Math.random() * 40,
        });
      }
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.015;
        if (s.life <= 0 || s.x > vw || s.y > vh * 0.6) {
          stars[i] = stars[stars.length - 1]; stars.pop();
          continue;
        }
        const speed = Math.hypot(s.vx, s.vy);
        const tailX = s.x - s.vx * s.length / speed * 0.4;
        const tailY = s.y - s.vy * s.length / speed * 0.4;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, `rgba(255,255,255,${s.life * 0.6})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.stroke();
        // Bright head
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.life * 0.8})`;
        ctx.fill();
      }

      // Ground line highlight
      const groundY = vh * GROUND_PCT;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(vw, groundY);
      ctx.strokeStyle = "rgba(74,222,128,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Grass tufts
      ctx.strokeStyle = "rgba(45,90,45,0.3)";
      ctx.lineWidth = 0.8;
      for (let i = 0; i < vw; i += 20) {
        const gh = (3 + Math.sin(i * 0.7) * 2) * scale;
        const wOff = Math.sin(time * 1.2 + i * 0.03) * 2;
        ctx.beginPath();
        ctx.moveTo(i, groundY);
        ctx.quadraticCurveTo(i + wOff, groundY - gh * 0.6, i + wOff * 1.2, groundY - gh);
        ctx.stroke();
      }

      // ── Flowers ──
      const growthSpeed = isRainingRef.current ? GROWTH_DURATION * 0.4 : GROWTH_DURATION;
      for (const f of flowersRef.current) {
        const elapsed = now - f.plantedAt;
        f.growth = Math.min(Math.max(elapsed, 0) / growthSpeed, 1);
        drawFlower(ctx, f, vw, vh, time, scale, windBias);
      }

      // ── Proximity glow ──
      const mx = mouseRef.current.x * vw;
      const my = mouseRef.current.y * vh;
      for (const f of flowersRef.current) {
        if (f.growth < 0.6) continue;
        const tip = getFlowerTip(f, vw, vh, time, scale, windBias);
        const dist = Math.hypot(tip.x - mx, tip.y - my);
        if (dist < 120) {
          const intensity = (1 - dist / 120) * 0.3;
          const cfg = FLOWERS[f.type];
          const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 40);
          glow.addColorStop(0, `${cfg.inner}${Math.round(intensity * 255).toString(16).padStart(2, "0")}`);
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.fillRect(tip.x - 40, tip.y - 40, 80, 80);
        }
      }

      // ── Butterflies ──
      const flowers = flowersRef.current;
      const grownFlowers = flowers.filter(f => f.growth >= 0.8);
      const bflies = butterfliesRef.current;

      // Spawn butterflies when enough flowers exist
      const maxButterflies = Math.min(5, Math.floor(grownFlowers.length / 2));
      while (bflies.length < maxButterflies && grownFlowers.length >= 3) {
        const target = grownFlowers[Math.floor(Math.random() * grownFlowers.length)];
        const tip = getFlowerTip(target, vw, vh, time, scale, windBias);
        const colors = BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)];
        bflies.push({
          x: Math.random() * vw,
          y: vh * 0.3 + Math.random() * vh * 0.3,
          targetX: tip.x,
          targetY: tip.y,
          wingPhase: Math.random() * Math.PI * 2,
          color: colors.body,
          accentColor: colors.accent,
          speed: 0.5 + Math.random() * 0.8,
          size: 7 + Math.random() * 5,
          pauseUntil: 0,
        });
      }
      // Remove excess butterflies if flowers were cleared
      while (bflies.length > maxButterflies) bflies.pop();

      for (const b of bflies) {
        // If paused, wait
        if (b.pauseUntil > now) {
          drawButterfly(ctx, b, time);
          continue;
        }

        // Move toward target with flutter
        const dx = b.targetX - b.x;
        const dy = b.targetY - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 10) {
          // Arrived — pause, then pick new target
          b.pauseUntil = now + 1500 + Math.random() * 2000;
          if (grownFlowers.length > 0) {
            const next = grownFlowers[Math.floor(Math.random() * grownFlowers.length)];
            const tip = getFlowerTip(next, vw, vh, time, scale, windBias);
            b.targetX = tip.x + (Math.random() - 0.5) * 20;
            b.targetY = tip.y - 10 - Math.random() * 30;
          }
        } else {
          b.x += (dx / dist) * b.speed + Math.sin(time * 3 + b.wingPhase) * 0.5;
          b.y += (dy / dist) * b.speed + Math.cos(time * 2.3 + b.wingPhase) * 0.4;
        }

        drawButterfly(ctx, b, time);
      }

      // ── Particles ──
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.008;
        if (p.life <= 0) { particles[i] = particles[particles.length - 1]; particles.pop(); continue; }
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.00002; // slight upward drift
        p.alpha = p.life * 0.8;
        const px = p.x * vw;
        const py = groundY + p.y * vh;
        ctx.beginPath();
        ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Ambient pollen
      for (let i = 0; i < 12; i++) {
        const px = ((i * 173.7 + time * 15) % vw);
        const py = ((i * 91.3 + Math.sin(time * 0.3 + i) * 40) % (vh * 0.8));
        const a = 0.1 + Math.sin(time + i * 1.7) * 0.08;
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253,186,116,${a})`;
        ctx.fill();
      }

      // ── Fireflies ──
      const fflies = firefliesRef.current;
      const targetFireflyCount = Math.min(12, 3 + flowersRef.current.length);
      while (fflies.length < targetFireflyCount) {
        fflies.push({
          x: Math.random() * vw,
          y: vh * 0.2 + Math.random() * vh * 0.6,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.3,
          phase: Math.random() * Math.PI * 2,
          size: 1.5 + Math.random() * 1.5,
          brightness: Math.random(),
        });
      }
      for (const ff of fflies) {
        // Gentle drift with direction changes
        ff.vx += (Math.random() - 0.5) * 0.05;
        ff.vy += (Math.random() - 0.5) * 0.04;
        ff.vx *= 0.98;
        ff.vy *= 0.98;
        ff.x += ff.vx + windBias * 0.02;
        ff.y += ff.vy;
        ff.phase += 0.03;

        // Wrap around
        if (ff.x < -20) ff.x = vw + 20;
        if (ff.x > vw + 20) ff.x = -20;
        if (ff.y < vh * 0.1) ff.vy += 0.05;
        if (ff.y > groundY - 20) ff.vy -= 0.05;

        // Pulsing glow (two circles instead of gradient)
        const pulse = 0.3 + Math.sin(ff.phase) * 0.5 + 0.2;
        ctx.beginPath();
        ctx.arc(ff.x, ff.y, ff.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253,224,71,${pulse * 0.08})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ff.x, ff.y, ff.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253,224,71,${pulse * 0.9})`;
        ctx.fill();
      }

      // ── Seeds (dandelion-like) ──
      const seeds = seedsRef.current;
      for (let i = seeds.length - 1; i >= 0; i--) {
        const sd = seeds[i];
        sd.vy += 0.003; // gentle gravity
        sd.vx += windBias * 0.0003; // wind push
        sd.x += sd.vx + Math.sin(time * 2 + sd.driftPhase) * 0.3;
        sd.y += sd.vy;
        sd.life -= 0.003;

        // Land and plant
        if (sd.y >= groundY - 5) {
          const xPct = sd.x / vw;
          if (xPct > 0.05 && xPct < 0.95 && flowersRef.current.length < MAX_FLOWERS) {
            plantFlower(xPct, sd.type);
          }
          seeds[i] = seeds[seeds.length - 1]; seeds.pop();
          continue;
        }
        if (sd.life <= 0 || sd.x < -20 || sd.x > vw + 20) {
          seeds[i] = seeds[seeds.length - 1]; seeds.pop();
          continue;
        }

        // Draw seed with tiny parachute lines
        ctx.globalAlpha = sd.life;
        ctx.beginPath();
        ctx.arc(sd.x, sd.y, sd.size, 0, Math.PI * 2);
        ctx.fillStyle = "#fef3c7";
        ctx.fill();

        // Wispy lines radiating up (dandelion parachute)
        ctx.strokeStyle = "rgba(254,243,199,0.4)";
        ctx.lineWidth = 0.3;
        for (let l = 0; l < 6; l++) {
          const la = (l / 6) * Math.PI * 2 + time * 0.5 + sd.driftPhase;
          ctx.beginPath();
          ctx.moveTo(sd.x, sd.y);
          ctx.lineTo(sd.x + Math.cos(la) * 6, sd.y + Math.sin(la) * 6 - 4);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // ── Rain ──
      if (isRainingRef.current) {
        const drops = raindropsRef.current;
        // Spawn drops (capped at 200)
        if (drops.length < 200) for (let r = 0; r < 3; r++) {
          drops.push({
            x: Math.random() * vw,
            y: -10,
            speed: 6 + Math.random() * 6,
            length: 8 + Math.random() * 12,
          });
        }
        // Update & draw
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i];
          d.x += windBias * 0.15;
          d.y += d.speed;
          if (d.y > groundY + 10) {
            // Splash
            ctx.beginPath();
            ctx.arc(d.x, groundY, 2, 0, Math.PI, true);
            ctx.strokeStyle = "rgba(147,197,253,0.2)";
            ctx.lineWidth = 0.5;
            ctx.stroke();
            drops[i] = drops[drops.length - 1]; drops.pop();
            continue;
          }
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + windBias * 0.1, d.y - d.length);
          ctx.strokeStyle = "rgba(147,197,253,0.15)";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      } else {
        raindropsRef.current.length = 0;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [plantFlower]);

  // Pointer handlers (drag to paint)
  const getXPct = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0.5;
    const rect = canvas.getBoundingClientRect();
    return Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastPlantX.current = e.clientX;
    plantFlower(getXPct(e.clientX));
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [plantFlower, getXPct]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Track mouse for wind & proximity glow
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    }
    if (!isDragging.current) return;
    const dist = Math.abs(e.clientX - lastPlantX.current);
    if (dist >= DRAG_THRESHOLD) {
      lastPlantX.current = e.clientX;
      plantFlower(getXPct(e.clientX));
    }
  }, [plantFlower, getXPct]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Double-click to release seeds from nearest flower
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const time = performance.now() / 1000;
    const scale = Math.min(window.innerHeight / 800, 1.3);
    const windBias = (mouseRef.current.x - 0.5) * 25;

    // Find nearest mature flower
    let nearestDist = Infinity;
    let nearestFlower: FlowerState | null = null;
    for (const f of flowersRef.current) {
      if (f.growth < 0.8) continue;
      const tip = getFlowerTip(f, rect.width, rect.height, time, scale, windBias);
      const dist = Math.hypot(tip.x - clickX, tip.y - clickY);
      if (dist < nearestDist && dist < 80) {
        nearestDist = dist;
        nearestFlower = f;
      }
    }
    if (!nearestFlower) return;

    const tip = getFlowerTip(nearestFlower, rect.width, rect.height, time, scale, windBias);
    const seedCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < seedCount; i++) {
      seedsRef.current.push({
        x: tip.x + (Math.random() - 0.5) * 10,
        y: tip.y - 5,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(0.5 + Math.random() * 1.5),
        life: 1,
        type: nearestFlower.type,
        driftPhase: Math.random() * Math.PI * 2,
        size: 1.5 + Math.random(),
      });
    }
  }, []);

  // Keyboard shortcuts (1-6 to switch flower type, R for rain)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= FLOWERS.length) {
        setSelectedType(num - 1);
      }
      if (e.key === "r" || e.key === "R") {
        setIsRaining(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleClear = useCallback(() => {
    flowersRef.current = [];
    particlesRef.current = [];
    butterfliesRef.current = [];
    firefliesRef.current = [];
    seedsRef.current = [];
    raindropsRef.current = [];
    shootingStarsRef.current = [];
    setFlowerCount(0);
    setShowHint(true);
  }, []);

  const handleRandom = useCallback(() => {
    flowersRef.current = [];
    particlesRef.current = [];
    butterfliesRef.current = [];
    firefliesRef.current = [];
    seedsRef.current = [];
    raindropsRef.current = [];
    shootingStarsRef.current = [];
    const count = 15 + Math.floor(Math.random() * 11);
    for (let i = 0; i < count; i++) {
      const xPct = 0.05 + Math.random() * 0.9;
      const type = Math.floor(Math.random() * FLOWERS.length);
      const timeOffset = -(i / count) * 2000; // stagger over 2s into the past
      plantFlower(xPct, type, timeOffset);
    }
  }, [plantFlower]);

  return (
    <div id="main-content" className="relative w-full h-screen overflow-hidden bg-black select-none touch-none">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive flower garden canvas. Click to plant flowers, drag to paint, double-click to spread seeds."
        className="absolute inset-0 cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        <Link
          href="/creative/"
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Creative
        </Link>

        <motion.h1
          className="text-white/70 text-sm tracking-widest uppercase"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Flower Garden
        </motion.h1>

        <div className="flex items-center gap-4">
          <span className="text-white/30 text-xs">{flowerCount} flower{flowerCount !== 1 ? "s" : ""}</span>
          <button
            onClick={() => setIsRaining(prev => !prev)}
            className={`text-xs transition-colors ${isRaining ? "text-blue-300/60" : "text-white/30 hover:text-white/60"}`}
          >
            {isRaining ? "Raining" : "Rain"}
          </button>
          <button
            onClick={handleRandom}
            className="text-white/30 hover:text-white/60 transition-colors text-xs"
          >
            Random
          </button>
          {flowerCount > 0 && (
            <button
              onClick={handleClear}
              className="text-white/30 hover:text-white/60 transition-colors text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.p
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
              text-white/25 text-lg md:text-xl tracking-wide pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8 }}
          >
            Click to plant, drag to paint, double-click to spread seeds
          </motion.p>
        )}
      </AnimatePresence>

      {/* Flower type selector */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10
          flex items-center gap-1 md:gap-2 bg-black/60 backdrop-blur-md
          rounded-full px-3 md:px-5 py-2.5 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {FLOWERS.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setSelectedType(i)}
            className={`flex flex-col items-center gap-1 px-2 md:px-3 py-1 rounded-full transition-all
              ${selectedType === i ? "bg-white/10 scale-105" : "hover:bg-white/5"}`}
          >
            <span
              className="w-3 h-3 rounded-full transition-transform"
              style={{
                backgroundColor: f.inner,
                boxShadow: selectedType === i ? `0 0 8px ${f.inner}80` : "none",
                transform: selectedType === i ? "scale(1.3)" : "scale(1)",
              }}
            />
            <span className="text-[9px] md:text-[10px] text-white/50 whitespace-nowrap">
              {f.name}
              <span className="text-white/20 ml-0.5">{i + 1}</span>
            </span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
