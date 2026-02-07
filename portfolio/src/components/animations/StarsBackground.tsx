"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { useTimeLapse } from "./TimeLapseProvider";

// Stellar spectral types - astronomically accurate colors
type SpectralType = "O" | "B" | "A" | "F" | "G" | "K" | "M";

interface Star {
  angle: number;
  radius: number;
  size: number;
  baseOpacity: number;
  // Multi-frequency twinkle for organic scintillation
  twinklePhases: [number, number, number];
  twinkleSpeeds: [number, number, number];
  layer: "distant" | "mid" | "near";
  spectralType: SpectralType;
  magnitude: number; // 1 = brightest, 6 = dimmest visible
  // For smooth fade in/out at viewport edges
  visibilityFade: number; // 0 = invisible, 1 = fully visible
  // For depth-sorted rendering (lower = render first)
  renderOrder: number;
}

// Shooting star / meteor
interface Meteor {
  x: number;
  y: number;
  angle: number; // Direction of travel
  speed: number; // Pixels per second
  length: number; // Trail length
  size: number;
  progress: number; // 0 = just spawned, 1 = finished
  opacity: number;
}

// Sweden ~60°N - Polaris at 60° elevation above northern horizon
// For a northward-facing view, this places it in the upper third
const ROTATION_CENTER = { x: 0.42, y: 0.28 };

// Slow, contemplative rotation - stars drift westward, barely perceptible
const ROTATION_SPEED = {
  distant: -0.00012, // Slowest - deepest field
  mid: -0.00020,
  near: -0.00035, // Fastest - foreground stars
};

// Spectral type colors - from hot blue (O) to cool red (M)
const SPECTRAL_COLORS: Record<SpectralType, { r: number; g: number; b: number }> = {
  O: { r: 155, g: 176, b: 255 }, // Blue-violet
  B: { r: 170, g: 191, b: 255 }, // Blue-white
  A: { r: 202, g: 215, b: 255 }, // White with blue tint
  F: { r: 248, g: 247, b: 255 }, // Pure white
  G: { r: 255, g: 244, b: 232 }, // Yellow-white (like our Sun)
  K: { r: 255, g: 222, b: 180 }, // Orange-white
  M: { r: 255, g: 189, b: 145 }, // Orange-red
};

// Weighted distribution matching real night sky
const SPECTRAL_DISTRIBUTION: { type: SpectralType; weight: number }[] = [
  { type: "O", weight: 0.01 },
  { type: "B", weight: 0.05 },
  { type: "A", weight: 0.12 },
  { type: "F", weight: 0.18 },
  { type: "G", weight: 0.20 },
  { type: "K", weight: 0.25 },
  { type: "M", weight: 0.19 },
];

function pickSpectralType(): SpectralType {
  const r = Math.random();
  let cumulative = 0;
  for (const { type, weight } of SPECTRAL_DISTRIBUTION) {
    cumulative += weight;
    if (r <= cumulative) return type;
  }
  return "G";
}

// Poisson disk sampling in polar coordinates for natural star distribution
function generatePoissonDiskAngles(count: number, minDistance: number): number[] {
  const angles: number[] = [];
  const maxAttempts = 30;

  for (let i = 0; i < count; i++) {
    let bestAngle = Math.random() * Math.PI * 2;
    let bestMinDist = 0;

    // Try multiple candidates, keep the one with best spacing
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = Math.random() * Math.PI * 2;
      let minDist = Infinity;

      for (const existing of angles) {
        // Angular distance (wrapped)
        let dist = Math.abs(candidate - existing);
        if (dist > Math.PI) dist = 2 * Math.PI - dist;
        minDist = Math.min(minDist, dist);
      }

      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestAngle = candidate;
      }

      // Good enough spacing found
      if (bestMinDist >= minDistance) break;
    }

    angles.push(bestAngle);
  }

  return angles;
}

// Generate stars with Poisson disk distribution per layer
function createStarsWithPoissonDistribution(): Star[] {
  const stars: Star[] = [];

  const layers: Array<{ name: "distant" | "mid" | "near"; count: number; minAngularDist: number }> = [
    { name: "distant", count: 35, minAngularDist: 0.08 },
    { name: "mid", count: 18, minAngularDist: 0.12 },
    { name: "near", count: 10, minAngularDist: 0.2 },
  ];

  for (const { name: layer, count, minAngularDist } of layers) {
    const angles = generatePoissonDiskAngles(count, minAngularDist);

    for (const angle of angles) {
      stars.push(createStar(layer, false, angle));
    }
  }

  // Bright stars in separate quadrants for even distribution
  const brightStarAngles = [
    Math.PI * 0.15 + Math.random() * 0.3,   // Upper right quadrant
    Math.PI * 0.65 + Math.random() * 0.3,   // Lower right quadrant
    Math.PI * 1.15 + Math.random() * 0.3,   // Lower left quadrant
    Math.PI * 1.65 + Math.random() * 0.3,   // Upper left quadrant
  ];

  for (const angle of brightStarAngles) {
    stars.push(createStar("near", true, angle));
  }

  // Polaris - the North Star, fixed at the rotation center
  // Magnitude 1.98, spectral type F7 (yellow-white supergiant)
  // Slightly enhanced for artistic prominence as the celestial anchor
  stars.push({
    angle: 0,
    radius: 0, // Exactly at center - does not rotate
    size: 2.8,
    baseOpacity: 1,
    twinklePhases: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
    twinkleSpeeds: [0.06, 0.12, 0.20], // Very slow twinkle - high altitude, stable
    layer: "near",
    spectralType: "F",
    magnitude: 1.5, // Slightly brighter than reality for visual anchor
    visibilityFade: 1,
    renderOrder: 100, // Render last (on top)
    isPolaris: true, // Flag for special rendering
  } as Star & { isPolaris: boolean });

  // Sort by render order (dim/distant first, bright/near last)
  stars.sort((a, b) => a.renderOrder - b.renderOrder);

  return stars;
}

function createStar(layer: "distant" | "mid" | "near", forceBright = false, presetAngle?: number): Star {
  const angle = presetAngle ?? Math.random() * Math.PI * 2;

  // Distribute stars with density increasing toward edges (realistic field)
  // Lower minRadius allows circumpolar stars to orbit close to Polaris
  const minRadius = 0.05;
  const maxRadius = 1.5;
  const radiusBias = Math.pow(Math.random(), 0.6);
  const radius = minRadius + radiusBias * (maxRadius - minRadius);

  // Magnitude: 1-2 = bright stars (rare), 3-4 = medium, 5-6 = dim (most common)
  let magnitude: number;
  if (forceBright) {
    magnitude = 1 + Math.random() * 1.5; // First/second magnitude
  } else {
    const magRoll = Math.random();
    if (magRoll < 0.02) magnitude = 2 + Math.random();
    else if (magRoll < 0.15) magnitude = 3 + Math.random();
    else if (magRoll < 0.45) magnitude = 4 + Math.random();
    else magnitude = 5 + Math.random();
  }

  // Size based on magnitude and layer
  const layerScale = layer === "distant" ? 0.7 : layer === "mid" ? 1.0 : 1.3;
  const magScale = Math.pow(2, (6 - magnitude) / 2.5); // Brighter = larger
  const size = Math.max(0.5, magScale * layerScale * (0.8 + Math.random() * 0.4));

  // Base opacity from magnitude
  const baseOpacity = Math.min(1, 0.3 + (6 - magnitude) * 0.14);

  // Render order: layer (0-2) * 10 + magnitude (1-6), so distant dim stars render first
  const layerOrder = layer === "distant" ? 0 : layer === "mid" ? 1 : 2;
  const renderOrder = layerOrder * 10 + magnitude;

  return {
    angle,
    radius,
    size,
    baseOpacity,
    // Three frequencies for organic, irregular twinkle
    twinklePhases: [
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    ],
    twinkleSpeeds: [
      0.12 + Math.random() * 0.15, // Slow primary
      0.25 + Math.random() * 0.20, // Medium secondary
      0.45 + Math.random() * 0.30, // Fast tertiary (subtle)
    ],
    layer,
    spectralType: pickSpectralType(),
    magnitude,
    visibilityFade: 1, // Start fully visible
    renderOrder,
  };
}

function polarToCartesian(
  angle: number,
  radius: number,
  centerX: number,
  centerY: number,
  scale: number
): { x: number; y: number } {
  return {
    x: centerX + Math.cos(angle) * radius * scale,
    y: centerY + Math.sin(angle) * radius * scale,
  };
}

function isStarVisible(
  x: number,
  y: number,
  width: number,
  height: number,
  margin: number = 80
): boolean {
  return x >= -margin && x <= width + margin &&
         y >= -margin && y <= height + margin;
}

function getEntryAngle(exitAngle: number): number {
  return exitAngle + Math.PI + (Math.random() - 0.5) * 0.4;
}

// Calculate scintillation intensity based on altitude (y position)
// Stars near horizon twinkle more due to thicker atmosphere
function getScintillationFactor(normalizedY: number): number {
  // normalizedY: 0 = top (zenith), 1 = bottom (horizon)
  const altitudeFactor = Math.pow(normalizedY, 1.5);
  return 0.12 + altitudeFactor * 0.38; // 12-50% intensity variation
}

// Atmospheric extinction: stars near horizon are dimmer and warmer
function getExtinction(normalizedY: number): { dimming: number; warming: number } {
  const altitudeFactor = Math.pow(Math.max(0, normalizedY - 0.5) * 2, 2); // Only affects lower half
  return {
    dimming: 1 - altitudeFactor * 0.4, // Up to 40% dimmer at horizon
    warming: altitudeFactor * 0.3, // Shift toward warmer colors
  };
}

// Apply color warming (shift toward orange/red)
function getExtinctionColor(
  spectralType: SpectralType,
  opacity: number,
  warming: number
): string {
  const base = SPECTRAL_COLORS[spectralType];
  // Shift RGB toward warm (increase R, decrease B)
  const r = Math.min(255, base.r + warming * 60);
  const g = base.g + warming * 15;
  const b = Math.max(0, base.b - warming * 80);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${opacity})`;
}

// Draw diffraction spikes for brightest stars
function drawDiffractionSpikes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opacity: number,
  spectralType: SpectralType
) {
  const spikeLength = size * 8;
  const color = SPECTRAL_COLORS[spectralType];

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 6); // Slight rotation for natural look

  // Four spikes at 90° intervals
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const gradient = ctx.createLinearGradient(
      0, 0,
      Math.cos(angle) * spikeLength,
      Math.sin(angle) * spikeLength
    );
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.6})`);
    gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.2})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      Math.cos(angle) * spikeLength,
      Math.sin(angle) * spikeLength
    );
    ctx.strokeStyle = gradient;
    ctx.lineWidth = size * 0.3;
    ctx.stroke();
  }

  ctx.restore();
}

// Edge fade zone size (in pixels) for smooth star entry/exit
const FADE_MARGIN = 120;

// Meteor settings - rare and magical
const METEOR_SPAWN_CHANCE = 0.000167; // Per frame chance (~1 every 100 seconds at 60fps)
const METEOR_MIN_SPEED = 800;
const METEOR_MAX_SPEED = 1500;

function createMeteor(width: number, height: number): Meteor {
  // Start from upper portion of screen, travel downward-ish
  const startX = Math.random() * width * 1.2 - width * 0.1;
  const startY = Math.random() * height * 0.4;

  // Angle: generally downward, slight variation (between 200° and 340°)
  const angle = (200 + Math.random() * 140) * (Math.PI / 180);

  return {
    x: startX,
    y: startY,
    angle,
    speed: METEOR_MIN_SPEED + Math.random() * (METEOR_MAX_SPEED - METEOR_MIN_SPEED),
    length: 80 + Math.random() * 120,
    size: 1.5 + Math.random() * 1.5,
    progress: 0,
    opacity: 0.7 + Math.random() * 0.3,
  };
}

function drawMeteor(ctx: CanvasRenderingContext2D, meteor: Meteor, globalOpacity: number) {
  const { x, y, angle, length, size, opacity } = meteor;

  // Fade in at start, fade out at end
  const fadeIn = Math.min(1, meteor.progress * 8);
  const fadeOut = Math.max(0, 1 - (meteor.progress - 0.7) / 0.3);
  const fade = Math.min(fadeIn, fadeOut);

  const tailX = x - Math.cos(angle) * length;
  const tailY = y - Math.sin(angle) * length;

  // Main trail gradient
  const gradient = ctx.createLinearGradient(tailX, tailY, x, y);
  gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
  gradient.addColorStop(0.3, `rgba(255, 250, 240, ${opacity * fade * globalOpacity * 0.3})`);
  gradient.addColorStop(0.7, `rgba(255, 245, 230, ${opacity * fade * globalOpacity * 0.7})`);
  gradient.addColorStop(1, `rgba(255, 255, 255, ${opacity * fade * globalOpacity})`);

  ctx.save();
  ctx.lineCap = "round";

  // Outer glow
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = size * 4;
  ctx.globalAlpha = 0.3;
  ctx.stroke();

  // Inner bright core
  ctx.beginPath();
  ctx.moveTo(tailX + (x - tailX) * 0.5, tailY + (y - tailY) * 0.5);
  ctx.lineTo(x, y);
  ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * fade * globalOpacity})`;
  ctx.lineWidth = size;
  ctx.globalAlpha = 1;
  ctx.stroke();

  // Bright head
  const headGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
  headGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * fade * globalOpacity})`);
  headGradient.addColorStop(0.5, `rgba(255, 250, 230, ${opacity * fade * globalOpacity * 0.5})`);
  headGradient.addColorStop(1, `rgba(255, 245, 220, 0)`);

  ctx.beginPath();
  ctx.arc(x, y, size * 3, 0, Math.PI * 2);
  ctx.fillStyle = headGradient;
  ctx.fill();

  ctx.restore();
}

const emptySubscribe = () => () => {};

// Calculate edge fade factor for smooth star entry/exit
function getEdgeFade(x: number, y: number, width: number, height: number): number {
  let fade = 1;
  if (x < FADE_MARGIN) fade = Math.min(fade, x / FADE_MARGIN);
  if (x > width - FADE_MARGIN) fade = Math.min(fade, (width - x) / FADE_MARGIN);
  if (y < FADE_MARGIN) fade = Math.min(fade, y / FADE_MARGIN);
  if (y > height - FADE_MARGIN) fade = Math.min(fade, (height - y) / FADE_MARGIN);
  return Math.max(0, Math.min(1, fade));
}

export function StarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const meteorsRef = useRef<Meteor[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  // #2: Smooth mouse with velocity for momentum/inertia
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5, vx: 0, vy: 0 });
  const isLoadedRef = useRef(false);
  const opacityRef = useRef(0);
  // #3: Track fade progress for spring curve
  const fadeProgressRef = useRef(0);
  const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 });
  const isTabActiveRef = useRef(true);
  // #4: Performance monitoring - track frame times and adaptive quality
  const frameTimesRef = useRef<number[]>([]);
  const qualityScaleRef = useRef(1); // 0-1, reduces rendering when frames drop

  // Time-lapse: controlled via context (use ref to avoid recreating animate callback)
  const { isActive: isTimeLapse } = useTimeLapse();
  const isTimeLapseRef = useRef(isTimeLapse);
  useEffect(() => {
    isTimeLapseRef.current = isTimeLapse;
  }, [isTimeLapse]);
  const timeLapseMultiplierRef = useRef(1); // Smoothly interpolates to target

  // Aurora phase for wave animation
  const auroraPhaseRef = useRef(0);

  const { scrollYProgress } = useScroll();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const blurAmount = useTransform(scrollYProgress, [0, 0.5], [0, 0.5]);
  const canvasFilter = useTransform(blurAmount, (b) => `blur(${b}px)`);

  const initStars = useCallback(() => {
    // Use Poisson disk distribution for natural, non-clumping placement
    starsRef.current = createStarsWithPoissonDistribution();
  }, []);

  const animateStars = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const deltaTime = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = currentTime;

    // #4: Performance monitoring - track frame times
    const frameTime = deltaTime * 1000; // ms
    frameTimesRef.current.push(frameTime);
    if (frameTimesRef.current.length > 30) frameTimesRef.current.shift();

    // Calculate average frame time and adjust quality - react faster on drops
    const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
    const targetQuality = avgFrameTime > 24 ? 0.4 : avgFrameTime > 20 ? 0.6 : avgFrameTime > 16.7 ? 0.85 : 1;
    // Faster drop, slower recovery for stability
    const lerpRate = targetQuality < qualityScaleRef.current ? 0.2 : 0.05;
    qualityScaleRef.current += (targetQuality - qualityScaleRef.current) * lerpRate;

    // Performance: reduce update frequency when tab is not active
    const baseDelta = isTabActiveRef.current ? deltaTime : deltaTime * 0.25;

    // #2: Update smooth mouse with momentum (spring-damper system)
    const mouse = smoothMouseRef.current;
    const targetX = mouseRef.current.x;
    const targetY = mouseRef.current.y;
    const spring = 8; // Spring stiffness
    const damping = 0.75; // Velocity damping (0-1, lower = more momentum)

    // Apply spring force toward target
    mouse.vx += (targetX - mouse.x) * spring * baseDelta;
    mouse.vy += (targetY - mouse.y) * spring * baseDelta;
    // Apply damping
    mouse.vx *= Math.pow(damping, baseDelta * 60);
    mouse.vy *= Math.pow(damping, baseDelta * 60);
    // Update position
    mouse.x += mouse.vx;
    mouse.y += mouse.vy;

    // Time-lapse: smoothly interpolate multiplier
    const targetMultiplier = isTimeLapseRef.current ? 60 : 1;
    const lerpSpeed = isTimeLapseRef.current ? 3 : 5; // Faster return to normal
    timeLapseMultiplierRef.current += (targetMultiplier - timeLapseMultiplierRef.current) * Math.min(1, lerpSpeed * baseDelta);

    const effectiveDelta = baseDelta * timeLapseMultiplierRef.current;

    // Update aurora phase
    auroraPhaseRef.current += baseDelta * 0.15;

    // #3: Spring-like fade in with deceleration curve
    if (!isLoadedRef.current) {
      fadeProgressRef.current = Math.min(1, fadeProgressRef.current + baseDelta * 0.5);
      // Cubic ease-out: starts fast, decelerates naturally (like Apple animations)
      const t = fadeProgressRef.current;
      opacityRef.current = 1 - Math.pow(1 - t, 3);
      if (fadeProgressRef.current >= 1) isLoadedRef.current = true;
    }

    const { width, height, dpr } = dimensionsRef.current;

    // Detect zoom changes by checking if DPR changed
    const currentDpr = window.devicePixelRatio || 1;
    if (Math.abs(currentDpr - dpr) > 0.01) {
      // DPR changed (user zoomed), trigger resize
      const canvas = canvasRef.current;
      if (canvas) {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        dimensionsRef.current = { width: newWidth, height: newHeight, dpr: currentDpr };
        canvas.width = newWidth * currentDpr;
        canvas.height = newHeight * currentDpr;
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
        ctx.scale(currentDpr, currentDpr);
      }
    }

    if (width === 0 || height === 0) {
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // #4: Calculate how many stars to render based on quality scale
    const quality = qualityScaleRef.current;

    // Skip aurora when zoomed out (dpr < 1) to avoid rendering artifacts
    const isZoomedOut = dpr < 0.99;

    // Skip aurora when quality is low to save GPU gradient fills
    if (!isZoomedOut && quality > 0.8) {
      // === AURORA BOREALIS ===
      // Subtle, ethereal glow near the polar region
      const auroraOpacity = opacityRef.current * 0.5;
      const phase = auroraPhaseRef.current;

      // Primary green curtain - very subtle
      ctx.save();
      ctx.globalAlpha = auroraOpacity * (0.15 + Math.sin(phase * 0.7) * 0.08);
      const aurora1 = ctx.createRadialGradient(
        width * (0.35 + Math.sin(phase * 0.3) * 0.08),
        height * 0.1,
        0,
        width * 0.4,
        height * 0.25,
        height * 0.7
      );
      aurora1.addColorStop(0, "rgba(80, 200, 120, 0.06)");
      aurora1.addColorStop(0.3, "rgba(60, 180, 140, 0.03)");
      aurora1.addColorStop(0.6, "rgba(40, 160, 160, 0.01)");
      aurora1.addColorStop(1, "transparent");
      ctx.fillStyle = aurora1;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Secondary blue-green curtain
      ctx.save();
      ctx.globalAlpha = auroraOpacity * (0.12 + Math.sin(phase * 0.5 + 1) * 0.06);
      const aurora2 = ctx.createRadialGradient(
        width * (0.55 + Math.sin(phase * 0.4 + 2) * 0.1),
        height * 0.05,
        0,
        width * 0.5,
        height * 0.2,
        height * 0.6
      );
      aurora2.addColorStop(0, "rgba(100, 180, 200, 0.05)");
      aurora2.addColorStop(0.4, "rgba(70, 150, 180, 0.02)");
      aurora2.addColorStop(1, "transparent");
      ctx.fillStyle = aurora2;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Rare purple accent (very subtle)
      ctx.save();
      ctx.globalAlpha = auroraOpacity * (0.08 + Math.sin(phase * 0.2 + 3) * 0.04);
      const aurora3 = ctx.createRadialGradient(
        width * (0.3 + Math.sin(phase * 0.25) * 0.05),
        height * 0.02,
        0,
        width * 0.35,
        height * 0.1,
        height * 0.4
      );
      aurora3.addColorStop(0, "rgba(140, 100, 180, 0.04)");
      aurora3.addColorStop(0.5, "rgba(120, 80, 160, 0.015)");
      aurora3.addColorStop(1, "transparent");
      ctx.fillStyle = aurora3;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    const centerX = width * ROTATION_CENTER.x;
    const centerY = height * ROTATION_CENTER.y;
    const scale = Math.max(width, height);

    // #2: Use smooth mouse for liquid parallax feel
    const mouseOffsetX = isTabActiveRef.current ? (smoothMouseRef.current.x - 0.5) * 20 : 0;
    const mouseOffsetY = isTabActiveRef.current ? (smoothMouseRef.current.y - 0.5) * 20 : 0;

    // Stars are pre-sorted by renderOrder (dim/distant first, bright/near last)
    // This ensures proper layering of glows
    for (let i = 0; i < starsRef.current.length; i++) {
      const star = starsRef.current[i];

      // #4: Skip dim stars when quality drops (they're sorted first, so skip early indices)
      // Always render bright stars (last ~20 in the sorted array)
      const skipThreshold = Math.floor((1 - quality) * starsRef.current.length * 0.5);
      if (i < skipThreshold && star.magnitude > 3) continue;
      // Polar motion: stars closer to Polaris (smaller radius) rotate slower
      const polarFactor = Math.pow(star.radius / 1.5, 0.5);
      const adjustedSpeed = ROTATION_SPEED[star.layer] * polarFactor;
      star.angle += adjustedSpeed * effectiveDelta * 60;

      const pos = polarToCartesian(star.angle, star.radius, centerX, centerY, scale);

      // Parallax by layer depth
      const parallaxMultiplier = star.layer === "distant" ? 0.2 : star.layer === "mid" ? 0.5 : 1;
      const x = pos.x + mouseOffsetX * parallaxMultiplier;
      const y = pos.y + mouseOffsetY * parallaxMultiplier;

      // Performance: early exit for stars well outside viewport
      if (x < -FADE_MARGIN * 2 || x > width + FADE_MARGIN * 2 ||
          y < -FADE_MARGIN * 2 || y > height + FADE_MARGIN * 2) {
        // Reset star position when it's far outside
        if (!isStarVisible(x, y, width, height, FADE_MARGIN * 3)) {
          star.angle = getEntryAngle(star.angle);
          star.radius = 0.15 + Math.random() * 1.35;
          star.visibilityFade = 0; // Start faded out
        }
        continue;
      }

      // Calculate edge fade for smooth entry/exit
      const edgeFade = getEdgeFade(x, y, width, height);

      // Smoothly interpolate visibility fade
      const targetFade = edgeFade;
      const fadeSpeed = 3; // How fast stars fade in/out
      star.visibilityFade += (targetFade - star.visibilityFade) * Math.min(1, fadeSpeed * effectiveDelta);

      // Skip rendering if effectively invisible
      if (star.visibilityFade < 0.01) continue;

      // Atmospheric effects based on altitude
      const normalizedY = Math.max(0, Math.min(1, y / height));
      const scintillationIntensity = getScintillationFactor(normalizedY);
      const extinction = getExtinction(normalizedY);

      // Update multi-frequency twinkle phases
      const altitudeSpeedMod = 1 + normalizedY * 0.6;
      star.twinklePhases[0] += star.twinkleSpeeds[0] * altitudeSpeedMod * effectiveDelta;
      star.twinklePhases[1] += star.twinkleSpeeds[1] * altitudeSpeedMod * effectiveDelta;
      star.twinklePhases[2] += star.twinkleSpeeds[2] * altitudeSpeedMod * effectiveDelta;

      // Organic twinkle: combine three sine waves
      const twinkle1 = Math.sin(star.twinklePhases[0]) * 0.5;
      const twinkle2 = Math.sin(star.twinklePhases[1]) * 0.35;
      const twinkle3 = Math.sin(star.twinklePhases[2]) * 0.15;
      const combinedTwinkle = twinkle1 + twinkle2 + twinkle3;
      const twinkle = 1 - scintillationIntensity + scintillationIntensity * (0.5 + combinedTwinkle * 0.5);

      // Apply extinction dimming and edge fade
      const opacity = star.baseOpacity * twinkle * extinction.dimming * opacityRef.current * star.visibilityFade;

      // Skip rendering if opacity too low
      if (opacity < 0.01) continue;

      // Draw diffraction spikes for first-magnitude stars (skip when quality drops)
      if (star.magnitude < 2 && opacity > 0.1 && quality > 0.7) {
        drawDiffractionSpikes(ctx, x, y, star.size, opacity * 0.5, star.spectralType);
      }

      // Special persistent glow for Polaris - the celestial anchor
      if ((star as Star & { isPolaris?: boolean }).isPolaris) {
        const polarisGlowSize = star.size * 12;
        const polarisGlow = ctx.createRadialGradient(x, y, 0, x, y, polarisGlowSize);
        const baseColor = SPECTRAL_COLORS["F"];
        polarisGlow.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${opacity * 0.4})`);
        polarisGlow.addColorStop(0.15, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${opacity * 0.15})`);
        polarisGlow.addColorStop(0.4, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${opacity * 0.05})`);
        polarisGlow.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        ctx.arc(x, y, polarisGlowSize, 0, Math.PI * 2);
        ctx.fillStyle = polarisGlow;
        ctx.fill();
      }

      // Draw outer glow for bright stars (magnitude < 3)
      if (star.magnitude < 3 && opacity > 0.05) {
        const glowSize = star.size * 5;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, getExtinctionColor(star.spectralType, opacity * 0.5, extinction.warming));
        gradient.addColorStop(0.2, getExtinctionColor(star.spectralType, opacity * 0.2, extinction.warming));
        gradient.addColorStop(0.5, getExtinctionColor(star.spectralType, opacity * 0.05, extinction.warming));
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw inner glow for medium-bright stars - tighter gradient for crispness
      // Skip when quality is low to reduce gradient creation
      if (star.magnitude < 4.5 && opacity > 0.03 && (quality > 0.7 || star.magnitude < 3)) {
        const innerGlowSize = star.size * 2;
        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, innerGlowSize);
        innerGradient.addColorStop(0, getExtinctionColor(star.spectralType, opacity * 0.8, extinction.warming));
        innerGradient.addColorStop(0.3, getExtinctionColor(star.spectralType, opacity * 0.3, extinction.warming));
        innerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        ctx.arc(x, y, innerGlowSize, 0, Math.PI * 2);
        ctx.fillStyle = innerGradient;
        ctx.fill();
      }

      // Crisp star cores - slightly larger for sharper appearance
      const coreSize = star.magnitude > 5 ? Math.max(0.6, star.size * 0.4) : star.size * 0.6;
      const coreOpacity = star.magnitude > 5 ? Math.min(1, opacity * 1.4) : Math.min(1, opacity * 1.2);

      ctx.beginPath();
      ctx.arc(x, y, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = getExtinctionColor(star.spectralType, Math.min(1, coreOpacity), extinction.warming);
      ctx.fill();
    }

    // === SHOOTING STARS ===
    // Spawn new meteors (rare - magical when they happen)
    if (Math.random() < METEOR_SPAWN_CHANCE && isTabActiveRef.current) {
      meteorsRef.current.push(createMeteor(width, height));
    }

    // Update and draw meteors
    meteorsRef.current = meteorsRef.current.filter((meteor) => {
      // Update position
      meteor.x += Math.cos(meteor.angle) * meteor.speed * baseDelta;
      meteor.y += Math.sin(meteor.angle) * meteor.speed * baseDelta;

      // Update progress based on distance traveled
      meteor.progress += baseDelta * (meteor.speed / 400);

      // Draw if still alive
      if (meteor.progress < 1) {
        drawMeteor(ctx, meteor, opacityRef.current);
        return true;
      }
      return false;
    });

  }, []);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // Store DPR for zoom compensation in effects
    dimensionsRef.current = { width, height, dpr };

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    };
  }, []);

  // Handle tab visibility for performance optimization
  const handleVisibilityChange = useCallback(() => {
    isTabActiveRef.current = !document.hidden;
  }, []);

  // Initialize stars once on mount
  useEffect(() => {
    initStars();
  }, [initStars]);

  // Initialize canvas dimensions and start animation after canvas is rendered
  useEffect(() => {
    if (!mounted) return;

    // Now canvas exists, set dimensions
    handleResize();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const loop = (t: number) => {
      animateStars(t);
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationRef.current);
    };
  }, [mounted, handleResize, handleMouseMove, handleVisibilityChange, animateStars]);

  if (!mounted) {
    return <div className="fixed inset-0" style={{ zIndex: -100, background: "#0a0a0f" }} />;
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: -100 }}
    >
      {/* Deep Nordic sky - gradient centered on Polaris position */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 42% 28%, #0d1520 0%, #0a0a12 45%, #050507 100%),
            radial-gradient(ellipse 70% 50% at 0% 100%, rgba(15, 30, 60, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 100% 0%, rgba(40, 15, 60, 0.06) 0%, transparent 50%)
          `,
        }}
      />

      {/* Star canvas - includes aurora, stars, and meteors */}
      <motion.canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ filter: canvasFilter }}
      />

      {/* Horizon glow - subtle atmospheric scatter / distant light pollution */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut", delay: 1 }}
        style={{
          background: `
            linear-gradient(to top,
              rgba(25, 20, 15, 0.15) 0%,
              rgba(20, 18, 15, 0.08) 8%,
              transparent 20%
            )
          `,
        }}
      />

      {/* Refined vignette */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        style={{
          background: `
            radial-gradient(ellipse 75% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 75%, rgba(0,0,0,0.65) 100%)
          `,
        }}
      />
    </div>
  );
}
