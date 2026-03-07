"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────

type GameState = "menu" | "playing" | "paused";

interface Cloud3D {
  x: number;
  y: number;
  z: number;
  scale: number;
  hue: number;
  opacity: number;
  phase: number;
}

interface Wisp3D {
  x: number;
  y: number;
  z: number;
  size: number;
  hue: number;
  phase: number;
}

interface LightOrb3D {
  x: number;
  y: number;
  z: number;
  radius: number;
  phase: number;
  collected: boolean;
  trail: number;
  golden: boolean;
}

interface LightPillar3D {
  x: number;
  y: number;
  z: number;
  height: number;
  radius: number;
  phase: number;
}

interface Flock3D {
  x: number;
  y: number;
  z: number;
  count: number;
  driftAngle: number;
  driftSpeed: number;
  phase: number;
}

interface Chunk3D {
  key: string;
  cx: number;
  cz: number;
  clouds: Cloud3D[];
  wisps: Wisp3D[];
  orbs: LightOrb3D[];
  pillars: LightPillar3D[];
  flocks: Flock3D[];
}

interface DayCycleKeyframe {
  time: number;
  skyTop: [number, number, number];
  skyMid: [number, number, number];
  skyBottom: [number, number, number];
  ambientColor: [number, number, number];
  ambientIntensity: number;
  dirColor: [number, number, number];
  dirIntensity: number;
  fogColor: [number, number, number];
  birdEmissive: [number, number, number];
  orbEmissive: [number, number, number];
  starOpacity: number;
}

interface GameCallbacks {
  onScore: (points: number) => void;
  onStreak: (streak: number) => void;
  onDistance: (d: number) => void;
}

interface AudioEngineHandle {
  init(): void;
  suspend(): void;
  resume(): void;
  playChime(golden?: boolean): void;
  updateAmbient(cycleTime: number, altitude: number): void;
  streak: number;
}

interface FlySceneProps {
  gameStateRef: React.MutableRefObject<GameState>;
  callbacks: GameCallbacks;
  isMobile: boolean;
  audioRef?: React.MutableRefObject<AudioEngineHandle | null>;
  sharedStreakRef?: React.MutableRefObject<number>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHUNK_DEPTH = 200;
const FLY_SPEED = 15;
const TURN_SPEED = 2.0;
const PITCH_UP_LIMIT = Math.PI / 3;
const PITCH_DOWN_LIMIT = Math.PI / 7;
const ORB_COLLECT_RADIUS = 2.5;
const TRAIL_LENGTH = 60;
const TRAIL_SAMPLE_DIST = 0.25;
const BURST_COUNT = 20;
const DAY_CYCLE_DURATION = 180;
const DELTA_CAP = 0.05;

function hex(r: number, g: number, b: number): [number, number, number] {
  return [r / 255, g / 255, b / 255];
}

const DAY_CYCLE: DayCycleKeyframe[] = [
  { time: 0,     skyTop: hex(20,18,55),   skyMid: hex(85,40,90),    skyBottom: hex(140,75,45),   ambientColor: hex(200,120,80),  ambientIntensity: 0.4,  dirColor: hex(255,150,90),  dirIntensity: 0.55, fogColor: hex(55,30,65),    birdEmissive: hex(255,170,70),  orbEmissive: hex(255,190,90),  starOpacity: 0.08 },
  { time: 0.125, skyTop: hex(35,80,170),  skyMid: hex(80,140,195),  skyBottom: hex(130,105,70),  ambientColor: hex(200,175,140), ambientIntensity: 0.35, dirColor: hex(240,215,170), dirIntensity: 0.4,  fogColor: hex(60,100,155),  birdEmissive: hex(255,215,110), orbEmissive: hex(255,225,130), starOpacity: 0 },
  { time: 0.25,  skyTop: hex(20,85,180),  skyMid: hex(55,120,195),  skyBottom: hex(70,105,135),  ambientColor: hex(170,185,215), ambientIntensity: 0.38, dirColor: hex(235,230,210), dirIntensity: 0.45, fogColor: hex(45,90,160),   birdEmissive: hex(90,195,190),  orbEmissive: hex(110,215,255), starOpacity: 0 },
  { time: 0.375, skyTop: hex(30,80,160),  skyMid: hex(80,125,180),  skyBottom: hex(110,100,70),  ambientColor: hex(210,190,150), ambientIntensity: 0.38, dirColor: hex(240,205,155), dirIntensity: 0.45, fogColor: hex(60,95,145),   birdEmissive: hex(255,195,90),  orbEmissive: hex(255,205,110), starOpacity: 0 },
  { time: 0.5,   skyTop: hex(20,10,55),   skyMid: hex(150,55,85),   skyBottom: hex(135,65,40),   ambientColor: hex(220,105,60),  ambientIntensity: 0.38, dirColor: hex(250,110,50),  dirIntensity: 0.5,  fogColor: hex(100,40,58),   birdEmissive: hex(255,90,40),   orbEmissive: hex(255,120,60),  starOpacity: 0.05 },
  { time: 0.625, skyTop: hex(8,8,35),     skyMid: hex(22,18,65),    skyBottom: hex(45,28,80),    ambientColor: hex(90,70,150),   ambientIntensity: 0.25, dirColor: hex(90,90,170),   dirIntensity: 0.25, fogColor: hex(18,15,50),    birdEmissive: hex(130,90,250),  orbEmissive: hex(150,110,250), starOpacity: 0.55 },
  { time: 0.75,  skyTop: hex(3,3,12),     skyMid: hex(8,8,28),      skyBottom: hex(12,12,40),    ambientColor: hex(50,50,110),   ambientIntensity: 0.15, dirColor: hex(70,70,150),   dirIntensity: 0.15, fogColor: hex(6,6,22),      birdEmissive: hex(90,90,250),   orbEmissive: hex(110,110,250), starOpacity: 1 },
  { time: 0.875, skyTop: hex(8,8,28),     skyMid: hex(28,20,50),    skyBottom: hex(65,42,80),    ambientColor: hex(110,80,130),  ambientIntensity: 0.3,  dirColor: hex(130,90,170),  dirIntensity: 0.35, fogColor: hex(22,16,40),    birdEmissive: hex(170,90,250),  orbEmissive: hex(190,110,250), starOpacity: 0.35 },
];

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Interpolation ────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function getDayCycle(cycleTime: number) {
  const t = ((cycleTime % 1) + 1) % 1;
  let i0 = DAY_CYCLE.length - 1;
  for (let i = 0; i < DAY_CYCLE.length; i++) {
    if (DAY_CYCLE[i].time <= t) i0 = i;
  }
  const i1 = (i0 + 1) % DAY_CYCLE.length;
  const kf0 = DAY_CYCLE[i0];
  const kf1 = DAY_CYCLE[i1];

  let segLen = kf1.time - kf0.time;
  if (segLen <= 0) segLen += 1;
  let localT = (t - kf0.time) / segLen;
  if (localT < 0) localT += 1;
  localT = Math.max(0, Math.min(1, localT));
  const st = localT * localT * (3 - 2 * localT);

  return {
    skyTop: lerpVec3(kf0.skyTop, kf1.skyTop, st),
    skyMid: lerpVec3(kf0.skyMid, kf1.skyMid, st),
    skyBottom: lerpVec3(kf0.skyBottom, kf1.skyBottom, st),
    ambientColor: lerpVec3(kf0.ambientColor, kf1.ambientColor, st),
    ambientIntensity: lerp(kf0.ambientIntensity, kf1.ambientIntensity, st),
    dirColor: lerpVec3(kf0.dirColor, kf1.dirColor, st),
    dirIntensity: lerp(kf0.dirIntensity, kf1.dirIntensity, st),
    fogColor: lerpVec3(kf0.fogColor, kf1.fogColor, st),
    birdEmissive: lerpVec3(kf0.birdEmissive, kf1.birdEmissive, st),
    orbEmissive: lerpVec3(kf0.orbEmissive, kf1.orbEmissive, st),
    starOpacity: lerp(kf0.starOpacity, kf1.starOpacity, st),
  };
}

// ─── Chunk Generation ─────────────────────────────────────────────────────────

function generateChunk(cx: number, cz: number, baseSeed: number): Chunk3D {
  const rng = seededRandom(baseSeed + cx * 7919 + cz * 6271);
  const originX = cx * CHUNK_DEPTH;
  const originZ = cz * CHUNK_DEPTH;
  const spread = CHUNK_DEPTH * 0.85;

  const clouds: Cloud3D[] = [];
  const cloudCount = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < cloudCount; i++) {
    clouds.push({
      x: originX + (rng() - 0.5) * spread,
      y: (rng() - 0.5) * 18,
      z: originZ + (rng() - 0.5) * spread,
      scale: 6 + rng() * 12,
      hue: 200 + rng() * 80,
      opacity: 0.04 + rng() * 0.06,
      phase: rng() * Math.PI * 2,
    });
  }

  const wisps: Wisp3D[] = [];
  if (rng() > 0.35) {
    const wispCount = 1 + Math.floor(rng() * 3);
    for (let w = 0; w < wispCount; w++) {
      wisps.push({
        x: originX + (rng() - 0.5) * spread,
        y: (rng() - 0.5) * 14,
        z: originZ + (rng() - 0.5) * spread,
        size: 0.8 + rng() * 1.5,
        hue: 170 + rng() * 120,
        phase: rng() * Math.PI * 2,
      });
    }
  }

  const orbs: LightOrb3D[] = [];
  const trailCount = 3 + Math.floor(rng() * 3);
  for (let t = 0; t < trailCount; t++) {
    const isGolden = rng() < 0.1;
    const tx = originX + (rng() - 0.5) * spread;
    const ty = (rng() - 0.5) * 10;
    const tz = originZ + (rng() - 0.5) * spread;
    const angle = rng() * Math.PI * 2;
    const count = 8 + Math.floor(rng() * 18);
    // 0-4 easy (70%), 5-9 complex (30%)
    const trailRoll = rng();
    const trailType = trailRoll < 0.18 ? 0
      : trailRoll < 0.34 ? 1
      : trailRoll < 0.48 ? 2
      : trailRoll < 0.58 ? 3
      : trailRoll < 0.70 ? 4
      : trailRoll < 0.76 ? 5
      : trailRoll < 0.82 ? 6
      : trailRoll < 0.88 ? 7
      : trailRoll < 0.94 ? 8
      : 9;
    const spacing = 2.2 + rng() * 0.6;

    // Pre-roll shape params so they're consistent across all orbs in a trail
    const curvature = (0.3 + rng() * 0.7) * (count > 8 ? 1.5 : 1.0);
    const curveDir = rng() > 0.5 ? 1 : -1;
    const pitchDrift = (rng() - 0.5) * 0.4;
    const spiralRadius = 8 + rng() * 6;
    const spiralTurns = 0.4 + rng() * 0.6;
    const sineAmplitude = 2 + rng() * 3;
    const sineFreq = 0.6 + rng() * 1.0;
    const loopRadius = 6 + rng() * 5;

    for (let i = 0; i < count; i++) {
      const progress = i / Math.max(count - 1, 1);
      let ox: number, oy: number, oz: number;

      if (trailType === 0) {
        // Straight line — easiest
        ox = Math.cos(angle) * spacing * i;
        oy = pitchDrift * 0.3 * i;
        oz = Math.sin(angle) * spacing * i;
      } else if (trailType === 1) {
        // Gentle arc
        const bend = curveDir * curvature * 0.4 * progress * progress;
        ox = Math.cos(angle + bend) * spacing * i;
        oy = pitchDrift * 0.3 * i;
        oz = Math.sin(angle + bend) * spacing * i;
      } else if (trailType === 2) {
        // Shallow climb / dive
        ox = Math.cos(angle) * spacing * i;
        oy = curveDir * progress * 6;
        oz = Math.sin(angle) * spacing * i;
      } else if (trailType === 3) {
        // Gentle S-curve
        ox = Math.cos(angle) * spacing * i;
        oy = Math.sin(progress * Math.PI) * sineAmplitude * 0.35;
        oz = Math.sin(angle) * spacing * i;
      } else if (trailType === 4) {
        // Wide banking turn
        const bend = curveDir * 0.6 * progress;
        ox = Math.cos(angle + bend) * spacing * i;
        oy = Math.sin(progress * Math.PI * 0.5) * 2;
        oz = Math.sin(angle + bend) * spacing * i;
      } else if (trailType === 5) {
        // Vertical spiral — wide and lazy
        const a = angle + progress * Math.PI * 2 * spiralTurns;
        ox = Math.cos(a) * spiralRadius;
        oy = i * spacing * 1.2;
        oz = Math.sin(a) * spiralRadius;
      } else if (trailType === 6) {
        // Corkscrew — horizontal spiral
        const a = progress * Math.PI * 2 * spiralTurns;
        ox = Math.cos(angle) * spacing * i;
        oy = Math.sin(a) * spiralRadius * 0.6;
        oz = Math.sin(angle) * spacing * i + Math.cos(a) * spiralRadius * 0.6;
      } else if (trailType === 7) {
        // Loop — goes up and over
        const la = progress * Math.PI * 2;
        ox = Math.cos(angle) * spacing * i;
        oy = Math.sin(la) * loopRadius;
        oz = Math.sin(angle) * spacing * i + Math.cos(la) * loopRadius * 0.3;
      } else if (trailType === 8) {
        // Figure-8
        const la = progress * Math.PI * 4;
        ox = Math.cos(angle) * spacing * i;
        oy = Math.sin(la) * loopRadius * 0.7;
        oz = Math.sin(angle) * spacing * i + Math.sin(la * 0.5) * loopRadius * 0.5;
      } else {
        // Zigzag — sharp alternating
        const zigPhase = Math.floor(progress * 4);
        const zigT = (progress * 4) % 1;
        const zigDir = zigPhase % 2 === 0 ? 1 : -1;
        ox = Math.cos(angle) * spacing * i + zigDir * zigT * 3;
        oy = pitchDrift * i + zigDir * Math.sin(zigT * Math.PI) * 2;
        oz = Math.sin(angle) * spacing * i;
      }

      orbs.push({
        x: tx + ox,
        y: ty + oy,
        z: tz + oz,
        radius: 0.3 + rng() * 0.15,
        phase: rng() * Math.PI * 2,
        collected: false,
        trail: t,
        golden: isGolden,
      });
    }
  }

  const pillars: LightPillar3D[] = [];
  if (rng() > 0.7) {
    pillars.push({
      x: originX + (rng() - 0.5) * spread,
      y: -5 + rng() * 3,
      z: originZ + (rng() - 0.5) * spread,
      height: 25 + rng() * 20,
      radius: 0.3 + rng() * 0.4,
      phase: rng() * Math.PI * 2,
    });
  }

  const flocks: Flock3D[] = [];
  if (rng() > 0.6) {
    const flockCount = 1 + Math.floor(rng() * 2);
    for (let f = 0; f < flockCount; f++) {
      flocks.push({
        x: originX + (rng() - 0.5) * spread,
        y: 8 + rng() * 15,
        z: originZ + (rng() - 0.5) * spread,
        count: 20 + Math.floor(rng() * 21),
        driftAngle: rng() * Math.PI * 2,
        driftSpeed: 0.5 + rng() * 1.5,
        phase: rng() * Math.PI * 2,
      });
    }
  }

  return { key: `${cx},${cz}`, cx, cz, clouds, wisps, orbs, pillars, flocks };
}

// ─── Shaders ──────────────────────────────────────────────────────────────────

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uMidColor;
  uniform vec3 uBottomColor;
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition).y;
    vec3 color;
    if (h > 0.0) {
      color = mix(uMidColor, uTopColor, smoothstep(0.0, 0.8, h));
    } else {
      color = mix(uMidColor, uBottomColor, smoothstep(0.0, 0.85, -h));
    }
    gl_FragColor = vec4(color, 1.0);
  }
`;

const starVertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float twinkle = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
    vAlpha = twinkle * uOpacity;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = mix(1.0, 3.5, twinkle);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const starFragmentShader = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float alpha = (1.0 - d * d) * vAlpha;
    gl_FragColor = vec4(1.0, 0.98, 0.92, alpha);
  }
`;

const particleVertexShader = /* glsl */ `
  attribute float aAlpha;
  attribute float aSize;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (200.0 / max(-mvPos.z, 1.0));
    gl_Position = projectionMatrix * mvPos;
  }
`;

const particleFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float alpha = exp(-d * d * 3.0) * vAlpha;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const ribbonVertexShader = /* glsl */ `
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ribbonFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha);
  }
`;

const moteVertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform vec3 uBirdPos;
  uniform float uPulse;
  varying float vAlpha;
  void main() {
    float freqA = 0.37 + aPhase * 0.08;
    float freqB = freqA * 0.618;
    float driftX = sin(uTime * freqA + aPhase) * 0.6
                 + sin(uTime * freqB * 1.3 + aPhase * 2.7) * 0.25;
    float driftY = cos(uTime * freqB + aPhase * 1.4) * 0.5
                 + sin(uTime * freqA * 0.7 + aPhase * 3.1) * 0.2;
    float driftZ = sin(uTime * freqB * 0.8 + aPhase * 0.9) * 0.3;
    vec3 pos = position;
    pos.x += driftX;
    pos.y += driftY;
    pos.z += driftZ;

    float birdDist = distance(pos, uBirdPos);
    if (birdDist < 8.0) {
      float strength = min(1.0 / (birdDist * birdDist + 0.1), 2.0);
      strength *= smoothstep(8.0, 5.0, birdDist);
      vec3 away = normalize(pos - uBirdPos);
      pos += away * strength * 2.0;
    }

    float pulse = sin(uTime * 0.6 + aPhase * 2.3);
    vAlpha = (0.18 + 0.18 * pulse * pulse) * (1.0 + uPulse * 0.5);
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (180.0 / max(-mvPos.z, 1.0));
    gl_Position = projectionMatrix * mvPos;
  }
`;

const moteFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float alpha = exp(-d * d * 2.5) * vAlpha;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const pillarVertexShader = /* glsl */ `
  varying float vY;
  varying vec2 vUv;
  void main() {
    vY = uv.y;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const pillarFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vY;
  void main() {
    float edgeFade = 1.0 - abs(vY - 0.5) * 2.0;
    edgeFade = smoothstep(0.0, 0.3, edgeFade);
    gl_FragColor = vec4(uColor, edgeFade * uOpacity * 0.35);
  }
`;

const flockVertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aOrbitRadius;
  uniform float uTime;
  uniform vec3 uCenter;
  uniform float uDriftAngle;
  uniform float uDriftSpeed;
  varying float vAlpha;
  void main() {
    vec3 center = uCenter;
    center.x += cos(uDriftAngle) * uDriftSpeed * uTime;
    center.z += sin(uDriftAngle) * uDriftSpeed * uTime;

    float angle = uTime * 0.5 + aPhase;
    vec3 pos = center;
    pos.x += cos(angle) * aOrbitRadius;
    pos.y += sin(uTime * 0.3 + aPhase * 3.0) * aOrbitRadius * 0.3;
    pos.z += sin(angle) * aOrbitRadius;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mvPos.z;
    vAlpha = smoothstep(300.0, 50.0, dist) * smoothstep(0.0, 20.0, dist);
    gl_PointSize = 2.5 * (200.0 / max(dist, 1.0));
    gl_Position = projectionMatrix * mvPos;
  }
`;

const flockFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float alpha = (1.0 - d * d) * vAlpha * 0.6;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// ─── Audio Engine ─────────────────────────────────────────────────────────────

class AudioEngine implements AudioEngineHandle {
  private ctx: AudioContext | null = null;
  private droneGain: GainNode | null = null;
  private drone1: OscillatorNode | null = null;
  private drone2: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private mobile: boolean;
  private prevStreak = 0;

  constructor(isMobile: boolean) {
    this.mobile = isMobile;
  }

  init() {
    if (this.ctx) {
      this.ctx.resume();
      return;
    }

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);

    // Drone: two sine oscillators
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.12;
    this.droneGain.connect(this.masterGain);

    this.drone1 = this.ctx.createOscillator();
    this.drone1.type = "sine";
    this.drone1.frequency.value = 55;
    this.drone1.connect(this.droneGain);
    this.drone1.start();

    this.drone2 = this.ctx.createOscillator();
    this.drone2.type = "sine";
    this.drone2.frequency.value = 82;
    this.drone2.connect(this.droneGain);
    this.drone2.start();
  }

  updateAmbient(cycleTime: number, altitude: number) {
    if (!this.droneGain) return;
    const warmth = Math.pow(Math.max(0, Math.cos(cycleTime * Math.PI * 4)), 2);
    this.droneGain.gain.value = 0.12 + warmth * 0.04;

    // Altitude shifts drone pitch — higher = brighter
    const altFactor = Math.max(-1, Math.min(1, altitude / 30));
    if (this.drone1) this.drone1.frequency.value = 55 + altFactor * 15;
    if (this.drone2) this.drone2.frequency.value = 82 + altFactor * 20;

    // Streak loss detection
    if (this.prevStreak >= 3 && this.streak === 0) {
      this.playStreakLoss();
    }
    this.prevStreak = this.streak;
  }

  private playStreakLoss() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    // Gentle descending tone
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.6);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }


  private chimeIndex = 0;
  private lastChimeTime = 0;
  streak = 0;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;

  // Chord voicings — progression advances with streak
  private chords = [
    [261.63, 329.63, 392.00, 523.25],  // Cmaj
    [293.66, 392.00, 523.25, 659.25],  // Gsus → bright
    [329.63, 523.25, 659.25, 783.99],  // C/E → lifting
    [392.00, 523.25, 783.99, 1046.50], // C5 → soaring
  ];

  // Extended pentatonic for melodic runs
  private scale = [
    523.25, 587.33, 659.25, 783.99, 880.00,
    1046.50, 1174.66, 1318.51, 1567.98, 1760.00,
    2093.00, 2349.32, 2637.02,
  ];

  private ensureDelay() {
    if (this.delayNode || !this.ctx || !this.masterGain) return;
    this.delayNode = this.ctx.createDelay(0.5);
    this.delayNode.delayTime.value = 0.18;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.2;
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.masterGain);
  }

  private tone(freq: number, vol: number, offset: number, dur: number, type: OscillatorType = "sine") {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime + offset;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.masterGain);
    if (this.delayNode) g.connect(this.delayNode);
    osc.start(t);
    osc.stop(t + dur);
  }

  playChime(golden = false) {
    if (!this.ctx || !this.masterGain) return;
    this.ensureDelay();
    const now = this.ctx.currentTime;
    const gap = now - this.lastChimeTime;
    this.lastChimeTime = now;

    if (gap < 1.2) {
      this.streak++;
      this.chimeIndex = Math.min(this.chimeIndex + 1, this.scale.length - 1);
    } else if (gap < 3) {
      this.streak = Math.max(0, this.streak - 1);
    } else {
      this.streak = 0;
      this.chimeIndex = Math.max(0, this.chimeIndex - Math.floor((gap - 3) / 2) - 1);
    }

    const note = this.scale[this.chimeIndex];
    const chord = this.chords[Math.floor(this.streak / 3) % this.chords.length];
    const intensity = Math.min(this.streak / 12, 1);

    // Melodic note
    this.tone(note, 0.12, 0, 0.6 + intensity * 0.3);

    // Octave shimmer — grows with streak
    this.tone(note * 2, 0.02 + intensity * 0.04, 0, 0.4);

    // Chord pad emerges at 3+ streak
    if (this.streak >= 3) {
      const vol = 0.015 + intensity * 0.025;
      for (let i = 0; i < chord.length; i++) {
        this.tone(chord[i], vol, 0.02 * i, 0.8 + intensity * 0.4, "triangle");
      }
    }

    // High sparkle at 6+
    if (this.streak >= 6) {
      this.tone(note * 3, 0.015 * intensity, 0.03, 0.3);
    }

    // Arpeggio cascade every 4th pickup at 10+
    if (this.streak >= 10 && this.streak % 4 === 0) {
      for (let i = 0; i < 4; i++) {
        this.tone(chord[i] * 2, 0.02, 0.06 * i, 0.5);
      }
    }

    // Golden bell — bright major chord
    if (golden) {
      this.tone(1318.51, 0.1, 0, 0.8);       // E6
      this.tone(1567.98, 0.08, 0.03, 0.7);    // G6
      this.tone(2093.00, 0.06, 0.06, 0.6);    // C7
      this.tone(659.25, 0.05, 0, 0.9, "triangle"); // E5 warmth
    }

    // Delay feedback swells with streak
    if (this.delayFeedback) {
      this.delayFeedback.gain.value = 0.15 + intensity * 0.2;
    }
  }

  suspend() {
    this.ctx?.suspend();
  }

  resume() {
    this.ctx?.resume();
  }
}

// ─── Sky Dome ─────────────────────────────────────────────────────────────────

function SkyDome({ cycleRef }: { cycleRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const uniforms = useMemo(() => ({
    uTopColor: { value: new THREE.Color() },
    uMidColor: { value: new THREE.Color() },
    uBottomColor: { value: new THREE.Color() },
  }), []);

  useFrame(() => {
    if (!matRef.current) return;
    const dc = getDayCycle(cycleRef.current);
    uniforms.uTopColor.value.setRGB(...dc.skyTop);
    uniforms.uMidColor.value.setRGB(...dc.skyMid);
    uniforms.uBottomColor.value.setRGB(...dc.skyBottom);
    if (meshRef.current) meshRef.current.position.copy(camera.position);
  });

  return (
    <mesh ref={meshRef} renderOrder={-1}>
      <sphereGeometry args={[500, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={skyVertexShader}
        fragmentShader={skyFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Star Field ───────────────────────────────────────────────────────────────

function StarField({ cycleRef, elapsedRef }: { cycleRef: React.MutableRefObject<number>; elapsedRef: React.MutableRefObject<number> }) {
  const COUNT = 200;
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const { positions, phases, speeds } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const ph = new Float32Array(COUNT);
    const sp = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(1 - Math.random() * 1.3);
      const r = 400;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      ph[i] = Math.random() * Math.PI * 2;
      sp[i] = 0.3 + Math.random() * 1.2;
    }
    return { positions: pos, phases: ph, speeds: sp };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 0 },
  }), []);

  useFrame(() => {
    if (!matRef.current || !groupRef.current) return;
    uniforms.uTime.value = elapsedRef.current;
    uniforms.uOpacity.value = getDayCycle(cycleRef.current).starOpacity;
    groupRef.current.position.copy(camera.position);
  });

  return (
    <group ref={groupRef}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
          <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          vertexShader={starVertexShader}
          fragmentShader={starFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ─── Spirit Bird ──────────────────────────────────────────────────────────────

function SpiritBird({ birdRef, wingPhaseRef, cycleRef, elapsedRef, yawRef, pitchRef, glowRef, streakRef }: {
  birdRef: React.MutableRefObject<THREE.Vector3>;
  wingPhaseRef: React.MutableRefObject<number>;
  cycleRef: React.MutableRefObject<number>;
  elapsedRef: React.MutableRefObject<number>;
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
  glowRef: React.MutableRefObject<number>;
  streakRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const wingLRef = useRef<THREE.Mesh>(null);
  const wingRRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const tailLightRef = useRef<THREE.PointLight>(null);
  const velRef = useRef(new THREE.Vector3());
  const prevPos = useRef(new THREE.Vector3());

  const wingGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.5, 0.15, 1.2, 0.08);
    shape.lineTo(1.5, 0.02);
    shape.quadraticCurveTo(0.8, -0.08, 0, -0.04);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const pos = birdRef.current;
    groupRef.current.position.copy(pos);

    velRef.current.subVectors(pos, prevPos.current);
    prevPos.current.copy(pos);

    groupRef.current.rotation.order = 'YXZ';
    groupRef.current.rotation.y = yawRef.current + Math.PI;
    groupRef.current.rotation.x = -pitchRef.current;
    const bankZ = -velRef.current.x * 0.25;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, bankZ, 0.06);

    const breathe = 1 + 0.04 * Math.sin(elapsedRef.current * 1.5);
    groupRef.current.scale.setScalar(breathe);

    const wingAngle = Math.sin(wingPhaseRef.current) * 0.45;
    if (wingLRef.current) wingLRef.current.rotation.z = wingAngle + 0.25;
    if (wingRRef.current) wingRRef.current.rotation.z = -wingAngle - 0.25;

    const dc = getDayCycle(cycleRef.current);
    const glow = glowRef.current;
    if (bodyMatRef.current) {
      bodyMatRef.current.emissive.setRGB(...dc.birdEmissive);
      bodyMatRef.current.emissiveIntensity = 2.5 + glow * 4.0;
    }
    if (lightRef.current) {
      lightRef.current.color.setRGB(...dc.birdEmissive);
      lightRef.current.intensity = 1.8 + glow * 3.0;
    }
    if (tailLightRef.current) {
      tailLightRef.current.color.setRGB(...dc.birdEmissive);
      tailLightRef.current.intensity = 0.8 + 0.3 * Math.sin(elapsedRef.current * 2) + glow * 2.0;
    }

    // Bird aura grows with streak
    const s = Math.min(streakRef.current / 12, 1);
    const auraScale = 1 + s * 0.8;
    if (innerGlowRef.current) {
      innerGlowRef.current.scale.set(1.6 * auraScale, 1.2 * auraScale, 2.0 * auraScale);
      (innerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + s * 0.15;
    }
    if (outerGlowRef.current) {
      outerGlowRef.current.scale.set(3.2 * auraScale, 2.4 * auraScale, 3.6 * auraScale);
      (outerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.04 + s * 0.08;
    }
    if (lightRef.current) {
      lightRef.current.distance = 14 + s * 10;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh scale={[1, 0.7, 1.4]}>
        <icosahedronGeometry args={[0.4, 2]} />
        <meshStandardMaterial
          ref={bodyMatRef}
          color="#eeeeff"
          emissive="#ffffff"
          emissiveIntensity={2.5}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>

      <mesh ref={innerGlowRef} scale={[1.6, 1.2, 2.0]}>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshBasicMaterial
          color="#fff5e0"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={outerGlowRef} scale={[3.2, 2.4, 3.6]}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshBasicMaterial
          color="#b0d0ff"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={wingRRef} position={[0.3, 0.08, 0.1]} geometry={wingGeo}>
        <meshStandardMaterial
          color="#ddeeff"
          emissive="#bbddff"
          emissiveIntensity={1.5}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={wingLRef} position={[-0.3, 0.08, 0.1]} geometry={wingGeo} scale={[-1, 1, 1]}>
        <meshStandardMaterial
          color="#ddeeff"
          emissive="#bbddff"
          emissiveIntensity={1.5}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <pointLight ref={lightRef} intensity={1.8} distance={14} decay={2} />
      <pointLight ref={tailLightRef} position={[0, 0, 0.9]} intensity={0.6} distance={7} decay={2} />
    </group>
  );
}

// ─── Light Orb ────────────────────────────────────────────────────────────────

function LightOrbMesh({ orb, cycleRef, elapsedRef }: {
  orb: LightOrb3D;
  cycleRef: React.MutableRefObject<number>;
  elapsedRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.visible = !orb.collected;
    if (glowRef.current) glowRef.current.visible = !orb.collected;
    if (orb.collected) return;
    const t = elapsedRef.current;
    const pulse = 1 + 0.2 * Math.sin(t * 2.5 + orb.phase);
    meshRef.current.scale.setScalar(pulse * orb.radius);
    meshRef.current.position.y = orb.y + Math.sin(t * 1.2 + orb.phase) * 0.15;
    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulse * orb.radius * (orb.golden ? 3.5 : 2.2));
      glowRef.current.position.y = meshRef.current.position.y;
    }

    if (matRef.current) {
      if (orb.golden) {
        const gFlicker = 0.9 + 0.1 * Math.sin(t * 4 + orb.phase);
        matRef.current.emissive.setRGB(1.0 * gFlicker, 0.82 * gFlicker, 0.2);
      } else {
        const dc = getDayCycle(cycleRef.current);
        matRef.current.emissive.setRGB(...dc.orbEmissive);
      }
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[orb.x, orb.y, orb.z]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          ref={matRef}
          color={orb.golden ? "#fff0a0" : "#ffffff"}
          emissive={orb.golden ? "#ffcc20" : "#ffffff"}
          emissiveIntensity={orb.golden ? 5 : 3}
          toneMapped={false}
          transparent
          opacity={orb.golden ? 0.95 : 0.8}
        />
      </mesh>
      {orb.golden && (
        <mesh ref={glowRef} position={[orb.x, orb.y, orb.z]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color="#ffdd44"
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Trail Preview ────────────────────────────────────────────────────────────

function TrailPreview({ chunks, cycleRef, elapsedRef }: {
  chunks: Map<string, Chunk3D>;
  cycleRef: React.MutableRefObject<number>;
  elapsedRef: React.MutableRefObject<number>;
}) {
  const MAX_LINES = 600;
  const posRef = useRef(new Float32Array(MAX_LINES * 3));
  const alphaRef = useRef(new Float32Array(MAX_LINES));
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(1, 1, 1) },
  }), []);

  useFrame(() => {
    const pos = posRef.current;
    const alpha = alphaRef.current;
    let vi = 0;

    for (const chunk of chunks.values()) {
      const byTrail = new Map<number, LightOrb3D[]>();
      for (const orb of chunk.orbs) {
        if (orb.collected) continue;
        let arr = byTrail.get(orb.trail);
        if (!arr) { arr = []; byTrail.set(orb.trail, arr); }
        arr.push(orb);
      }
      for (const trail of byTrail.values()) {
        if (trail.length < 2) continue;
        for (let i = 0; i < trail.length - 1 && vi < MAX_LINES - 1; i++) {
          const a = trail[i], b = trail[i + 1];
          pos[vi * 3] = a.x; pos[vi * 3 + 1] = a.y; pos[vi * 3 + 2] = a.z;
          const baseAlpha = a.golden ? 0.12 : 0.05;
          alpha[vi] = baseAlpha;
          vi++;
          pos[vi * 3] = b.x; pos[vi * 3 + 1] = b.y; pos[vi * 3 + 2] = b.z;
          alpha[vi] = baseAlpha;
          vi++;
        }
      }
    }

    for (let i = vi; i < MAX_LINES; i++) {
      pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0;
      alpha[i] = 0;
    }

    if (geoRef.current) {
      geoRef.current.attributes.position.needsUpdate = true;
      geoRef.current.attributes.aAlpha.needsUpdate = true;
      geoRef.current.setDrawRange(0, vi);
    }

    if (matRef.current) {
      const dc = getDayCycle(cycleRef.current);
      uniforms.uColor.value.setRGB(...dc.orbEmissive);
    }
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[posRef.current, 3]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphaRef.current, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={ribbonVertexShader}
        fragmentShader={ribbonFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}

// ─── Cloud Puff ───────────────────────────────────────────────────────────────

function CloudPuff({ data, elapsedRef, cycleRef }: {
  data: Cloud3D;
  elapsedRef: React.MutableRefObject<number>;
  cycleRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const mat0Ref = useRef<THREE.MeshBasicMaterial>(null);
  const mat1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const mat2Ref = useRef<THREE.MeshBasicMaterial>(null);
  const cloudLightRef = useRef<THREE.PointLight>(null);
  const workColor = useRef(new THREE.Color().setHSL(data.hue / 360, 0.15, 0.65));

  useFrame(() => {
    if (!groupRef.current) return;
    const t = elapsedRef.current;
    groupRef.current.position.y = data.y + Math.sin(t * 0.12 + data.phase) * 0.8;
    groupRef.current.rotation.y = t * 0.008 + data.phase;

    const ct = ((cycleRef.current % 1) + 1) % 1;
    const warmth = Math.pow(Math.max(0, Math.cos(ct * Math.PI * 4)), 2);
    const baseHue = data.hue / 360;
    const hue = lerp(baseHue, 0.08, warmth * 0.6);
    const sat = lerp(0.15, 0.25, warmth);
    const lit = lerp(0.65, 0.7, warmth);
    workColor.current.setHSL(hue, sat, lit);

    if (mat0Ref.current) mat0Ref.current.color.copy(workColor.current);
    if (mat1Ref.current) mat1Ref.current.color.copy(workColor.current);
    if (mat2Ref.current) mat2Ref.current.color.copy(workColor.current);
    if (cloudLightRef.current) cloudLightRef.current.color.copy(workColor.current);
  });

  return (
    <group ref={groupRef} position={[data.x, data.y, data.z]}>
      <mesh scale={[data.scale, data.scale * 0.45, data.scale * 0.8]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          ref={mat0Ref}
          transparent
          opacity={data.opacity}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[data.scale * 0.35, data.scale * 0.12, data.scale * 0.15]}
        scale={[data.scale * 0.6, data.scale * 0.3, data.scale * 0.5]}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={mat1Ref}
          transparent
          opacity={data.opacity * 0.7}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[-data.scale * 0.3, -data.scale * 0.08, -data.scale * 0.12]}
        scale={[data.scale * 0.5, data.scale * 0.25, data.scale * 0.4]}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={mat2Ref}
          transparent
          opacity={data.opacity * 0.5}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={cloudLightRef} intensity={0.3} distance={data.scale * 2.5} decay={2} />
    </group>
  );
}

// ─── Light Wisp ───────────────────────────────────────────────────────────────

function LightWisp({ data, elapsedRef }: {
  data: Wisp3D;
  elapsedRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const col = useMemo(() =>
    new THREE.Color().setHSL(data.hue / 360, 0.4, 0.6),
    [data.hue]
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const t = elapsedRef.current;
    meshRef.current.position.x = data.x + Math.sin(t * 0.2 + data.phase) * 2;
    meshRef.current.position.y = data.y + Math.sin(t * 0.15 + data.phase * 1.3) * 1.5;
    meshRef.current.position.z = data.z + Math.cos(t * 0.18 + data.phase * 0.7) * 1.8;
    meshRef.current.rotation.y = t * 0.3 + data.phase;
    meshRef.current.rotation.z = Math.sin(t * 0.25 + data.phase) * 0.4;

    if (matRef.current) {
      matRef.current.opacity = 0.12 + 0.08 * Math.sin(t * 0.5 + data.phase);
    }
  });

  return (
    <mesh ref={meshRef} position={[data.x, data.y, data.z]}
          scale={[data.size * 0.3, data.size * 0.3, data.size * 2]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={matRef}
        color={col}
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── Light Pillar ─────────────────────────────────────────────────────────────

function LightPillarEntity({ data, cycleRef, elapsedRef }: {
  data: LightPillar3D;
  cycleRef: React.MutableRefObject<number>;
  elapsedRef: React.MutableRefObject<number>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(0.5, 0.6, 1.0) },
    uOpacity: { value: 0.3 },
  }), []);

  useFrame(() => {
    if (!matRef.current) return;
    const dc = getDayCycle(cycleRef.current);
    const t = elapsedRef.current;
    uniforms.uOpacity.value = 0.2 + 0.15 * Math.sin(t * 0.5 + data.phase);
    uniforms.uColor.value.setRGB(
      lerp(dc.orbEmissive[0], 0.6, 0.3),
      lerp(dc.orbEmissive[1], 0.7, 0.3),
      lerp(dc.orbEmissive[2], 1.0, 0.3),
    );
  });

  return (
    <mesh position={[data.x, data.y + data.height / 2, data.z]}>
      <cylinderGeometry args={[data.radius, data.radius * 0.5, data.height, 8, 1, true]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={pillarVertexShader}
        fragmentShader={pillarFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Trail Ribbon ─────────────────────────────────────────────────────────────

function TrailSystem({ birdRef, yawRef, pitchRef, cycleRef, gameStateRef, isMobile, trailBoostRef, streakRef }: {
  birdRef: React.MutableRefObject<THREE.Vector3>;
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
  cycleRef: React.MutableRefObject<number>;
  gameStateRef: React.MutableRefObject<GameState>;
  isMobile: boolean;
  trailBoostRef: React.MutableRefObject<number>;
  streakRef: React.MutableRefObject<number>;
}) {
  const maxPoints = isMobile ? 30 : TRAIL_LENGTH;
  const trailColor = useRef(new THREE.Color());
  const vertCount = maxPoints * 2;

  const trailBuf = useRef(new Float32Array(maxPoints * 3));
  const trailCount = useRef(0);
  const trailHead = useRef(0);
  const lastSamplePos = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));

  const positionsRef = useRef(new Float32Array(vertCount * 3));
  const alphasRef = useRef(new Float32Array(vertCount));
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const indices = useMemo(() => {
    const idx = new Uint16Array((maxPoints - 1) * 6);
    for (let i = 0; i < maxPoints - 1; i++) {
      const off = i * 6;
      const v = i * 2;
      idx[off] = v; idx[off + 1] = v + 2; idx[off + 2] = v + 1;
      idx[off + 3] = v + 1; idx[off + 4] = v + 2; idx[off + 5] = v + 3;
    }
    return idx;
  }, [maxPoints]);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(1, 1, 1) },
  }), []);

  const _tangent = useRef(new THREE.Vector3());
  const _camDir = useRef(new THREE.Vector3());
  const _cross = useRef(new THREE.Vector3());

  useFrame(({ camera }) => {
    if (gameStateRef.current !== "playing") return;

    const bp = birdRef.current;
    const yaw = yawRef.current;
    const pitch = pitchRef.current;
    const cosPitch = Math.cos(pitch);
    const tailX = bp.x + Math.sin(yaw) * cosPitch * 0.9;
    const tailY = bp.y - Math.sin(pitch) * 0.9;
    const tailZ = bp.z + Math.cos(yaw) * cosPitch * 0.9;
    const dx = tailX - lastSamplePos.current.x;
    const dy = tailY - lastSamplePos.current.y;
    const dz = tailZ - lastSamplePos.current.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq >= TRAIL_SAMPLE_DIST * TRAIL_SAMPLE_DIST) {
      const buf = trailBuf.current;
      const h = trailHead.current;
      buf[h * 3] = tailX;
      buf[h * 3 + 1] = tailY;
      buf[h * 3 + 2] = tailZ;
      lastSamplePos.current.set(tailX, tailY, tailZ);
      trailHead.current = (h + 1) % maxPoints;
      if (trailCount.current < maxPoints) trailCount.current++;
    }

    const n = trailCount.current;
    if (n < 2) return;

    const buf = trailBuf.current;
    const positions = positionsRef.current;
    const alphas = alphasRef.current;
    const head = trailHead.current;
    const trailBoost = trailBoostRef.current;
    const widthMult = 1 + trailBoost * 2.0;

    camera.getWorldDirection(_camDir.current);

    for (let i = 0; i < n; i++) {
      const ri = ((head - 1 - i + maxPoints * 2) % maxPoints) * 3;
      const px = buf[ri], py = buf[ri + 1], pz = buf[ri + 2];

      if (i === 0) {
        const ni = ((head - 2 + maxPoints * 2) % maxPoints) * 3;
        _tangent.current.set(px - buf[ni], py - buf[ni + 1], pz - buf[ni + 2]);
      } else if (i === n - 1) {
        const pi = ((head - i + maxPoints * 2) % maxPoints) * 3;
        _tangent.current.set(buf[pi] - px, buf[pi + 1] - py, buf[pi + 2] - pz);
      } else {
        const pi = ((head - i + maxPoints * 2) % maxPoints) * 3;
        const ni = ((head - i - 2 + maxPoints * 2) % maxPoints) * 3;
        _tangent.current.set(buf[pi] - buf[ni], buf[pi + 1] - buf[ni + 1], buf[pi + 2] - buf[ni + 2]);
      }
      _tangent.current.normalize();
      _cross.current.crossVectors(_tangent.current, _camDir.current).normalize();

      const t = i / (n - 1);
      const baseWidth = t < 0.3
        ? lerp(0.15, 0.25, t / 0.3)
        : lerp(0.25, 0.0, (t - 0.3) / 0.7);
      const width = baseWidth * widthMult;

      const alpha = (1.0 - t) * (1.0 - t) * (1.0 + trailBoost * 0.5);

      const vi = i * 2;
      const cx = _cross.current.x * width;
      const cy = _cross.current.y * width;
      const cz = _cross.current.z * width;
      positions[vi * 3] = px + cx;
      positions[vi * 3 + 1] = py + cy;
      positions[vi * 3 + 2] = pz + cz;
      positions[(vi + 1) * 3] = px - cx;
      positions[(vi + 1) * 3 + 1] = py - cy;
      positions[(vi + 1) * 3 + 2] = pz - cz;

      alphas[vi] = alpha;
      alphas[vi + 1] = alpha;
    }

    for (let i = n * 2; i < vertCount; i++) {
      positions[i * 3] = positions[i * 3 + 1] = positions[i * 3 + 2] = 0;
      alphas[i] = 0;
    }

    if (geoRef.current) {
      geoRef.current.attributes.position.needsUpdate = true;
      geoRef.current.attributes.aAlpha.needsUpdate = true;
      geoRef.current.setDrawRange(0, Math.max(0, (n - 1)) * 6);
    }

    if (matRef.current) {
      const dc = getDayCycle(cycleRef.current);
      const s = Math.min(streakRef.current / 12, 1);
      // Shift from bird emissive → warm gold → hot white as streak builds
      trailColor.current.setRGB(...dc.birdEmissive);
      if (s > 0) {
        const warm = new THREE.Color(1.0, 0.85, 0.4);
        const hot = new THREE.Color(1.0, 1.0, 0.95);
        warm.lerp(hot, Math.max(0, (s - 0.5) * 2));
        trailColor.current.lerp(warm, s);
      }
      uniforms.uColor.value.copy(trailColor.current);
    }
  });

  return (
    <mesh frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="index" args={[indices, 1]} />
        <bufferAttribute attach="attributes-position" args={[positionsRef.current, 3]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphasRef.current, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={ribbonVertexShader}
        fragmentShader={ribbonFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Burst System ─────────────────────────────────────────────────────────────

interface BurstParticle3D {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number;
}

function BurstSystem({ burstsRef, cycleRef, gameStateRef }: {
  burstsRef: React.MutableRefObject<BurstParticle3D[]>;
  cycleRef: React.MutableRefObject<number>;
  gameStateRef: React.MutableRefObject<GameState>;
}) {
  const MAX = BURST_COUNT * 5;
  const positionsRef = useRef(new Float32Array(MAX * 3));
  const alphasRef = useRef(new Float32Array(MAX));
  const sizesRef = useRef(new Float32Array(MAX));
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(1, 1, 1) },
  }), []);

  useFrame((_, delta) => {
    if (gameStateRef.current !== "playing") return;
    const dt = Math.min(delta, DELTA_CAP);
    const positions = positionsRef.current;
    const alphas = alphasRef.current;
    const sizes = sizesRef.current;

    const alive: BurstParticle3D[] = [];
    for (const p of burstsRef.current) {
      p.life -= dt * 1.3;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.vz *= 0.95;
      alive.push(p);
    }
    burstsRef.current = alive;

    for (let i = 0; i < MAX; i++) {
      if (i < alive.length) {
        const life = alive[i].life;
        positions[i * 3] = alive[i].x;
        positions[i * 3 + 1] = alive[i].y;
        positions[i * 3 + 2] = alive[i].z;
        alphas[i] = life * life;
        const age = 1 - life;
        const scaleCurve = age < 0.4 ? age / 0.4 : 1.0 - (age - 0.4) / 0.6;
        sizes[i] = 3 + scaleCurve * 5;
      } else {
        alphas[i] = 0;
        sizes[i] = 0;
      }
    }

    if (geoRef.current) {
      geoRef.current.attributes.position.needsUpdate = true;
      geoRef.current.attributes.aAlpha.needsUpdate = true;
      geoRef.current.attributes.aSize.needsUpdate = true;
    }

    if (matRef.current) {
      const dc = getDayCycle(cycleRef.current);
      uniforms.uColor.value.setRGB(...dc.orbEmissive);
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positionsRef.current, 3]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphasRef.current, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizesRef.current, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

// ─── Ambient Motes ────────────────────────────────────────────────────────────

function AmbientMotes({ cycleRef, elapsedRef, cx, cz, count, birdRef, pulseRef }: {
  cycleRef: React.MutableRefObject<number>;
  elapsedRef: React.MutableRefObject<number>;
  cx: number;
  cz: number;
  count: number;
  birdRef: React.MutableRefObject<THREE.Vector3>;
  pulseRef: React.MutableRefObject<number>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, phases, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const sz = new Float32Array(count);
    const originX = cx * CHUNK_DEPTH;
    const originZ = cz * CHUNK_DEPTH;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = originX + (Math.random() - 0.5) * CHUNK_DEPTH;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 2] = originZ + (Math.random() - 0.5) * CHUNK_DEPTH;
      ph[i] = Math.random() * Math.PI * 2;
      sz[i] = 2 + Math.random() * 4;
    }
    return { positions: pos, phases: ph, sizes: sz };
  }, [cx, cz, count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(1, 1, 0.9) },
    uBirdPos: { value: new THREE.Vector3() },
    uPulse: { value: 0 },
  }), []);

  useFrame(() => {
    if (!matRef.current) return;
    uniforms.uTime.value = elapsedRef.current;
    uniforms.uBirdPos.value.copy(birdRef.current);
    uniforms.uPulse.value = pulseRef.current;
    const dc = getDayCycle(cycleRef.current);
    const n = dc.starOpacity;
    uniforms.uColor.value.setRGB(
      lerp(0.75, 1.0, n),
      lerp(0.75, 0.75, n),
      lerp(0.7, 0.25, n),
    );
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={moteVertexShader}
        fragmentShader={moteFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

// ─── Wind Streaks ─────────────────────────────────────────────────────────────

function WindStreaks({ birdRef, yawRef, pitchRef, cycleRef, gameStateRef, isMobile }: {
  birdRef: React.MutableRefObject<THREE.Vector3>;
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
  cycleRef: React.MutableRefObject<number>;
  gameStateRef: React.MutableRefObject<GameState>;
  isMobile: boolean;
}) {
  const count = isMobile ? 20 : 40;
  const vertCount = count * 2;

  const positionsRef = useRef(new Float32Array(vertCount * 3));
  const alphasRef = useRef(new Float32Array(vertCount));
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const streakData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        angle: Math.random() * Math.PI * 2,
        radius: 3 + Math.random() * 8,
        phase: Math.random(),
        length: 0.5 + Math.random() * 1.5,
      });
    }
    return data;
  }, [count]);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(1, 1, 1) },
  }), []);

  useFrame((_, delta) => {
    if (gameStateRef.current !== "playing") {
      if (geoRef.current) geoRef.current.setDrawRange(0, 0);
      return;
    }

    timeRef.current += delta;

    const bp = birdRef.current;
    const yaw = yawRef.current;
    const pitch = pitchRef.current;
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);

    const fwdX = -Math.sin(yaw) * cosPitch;
    const fwdY = sinPitch;
    const fwdZ = -Math.cos(yaw) * cosPitch;

    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    // Up = cross(right, forward)
    const ux = -rightZ * fwdY;
    const uy = rightZ * fwdX - rightX * fwdZ;
    const uz = rightX * fwdY;

    const positions = positionsRef.current;
    const alphas = alphasRef.current;
    const time = timeRef.current;

    for (let i = 0; i < count; i++) {
      const s = streakData[i];
      const t = ((time * 0.8 + s.phase) % 1);
      const along = lerp(15, -15, t);
      const cx = Math.cos(s.angle) * s.radius;
      const cy = Math.sin(s.angle) * s.radius;

      const px = bp.x + fwdX * along + rightX * cx + ux * cy;
      const py = bp.y + fwdY * along + 0 * cx + uy * cy;
      const pz = bp.z + fwdZ * along + rightZ * cx + uz * cy;

      const halfLen = s.length * 0.5;
      const vi = i * 2;
      positions[vi * 3] = px - fwdX * halfLen;
      positions[vi * 3 + 1] = py - fwdY * halfLen;
      positions[vi * 3 + 2] = pz - fwdZ * halfLen;
      positions[(vi + 1) * 3] = px + fwdX * halfLen;
      positions[(vi + 1) * 3 + 1] = py + fwdY * halfLen;
      positions[(vi + 1) * 3 + 2] = pz + fwdZ * halfLen;

      const edgeFade = Math.min(t * 4, (1 - t) * 4, 1);
      const peripheryBoost = Math.min(s.radius / 10, 1);
      const alpha = edgeFade * peripheryBoost * 0.3;
      alphas[vi] = alpha;
      alphas[vi + 1] = alpha * 0.5;
    }

    if (geoRef.current) {
      geoRef.current.attributes.position.needsUpdate = true;
      geoRef.current.attributes.aAlpha.needsUpdate = true;
      geoRef.current.setDrawRange(0, vertCount);
    }

    if (matRef.current) {
      const dc = getDayCycle(cycleRef.current);
      uniforms.uColor.value.setRGB(...dc.birdEmissive);
    }
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positionsRef.current, 3]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphasRef.current, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={ribbonVertexShader}
        fragmentShader={ribbonFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}

// ─── Flock Entity ─────────────────────────────────────────────────────────────

function FlockEntity({ flock, cycleRef, elapsedRef }: {
  flock: Flock3D;
  cycleRef: React.MutableRefObject<number>;
  elapsedRef: React.MutableRefObject<number>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, phases, radii } = useMemo(() => {
    const pos = new Float32Array(flock.count * 3);
    const ph = new Float32Array(flock.count);
    const rad = new Float32Array(flock.count);
    for (let i = 0; i < flock.count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      ph[i] = flock.phase + i * 0.3;
      rad[i] = 2 + Math.random() * 5;
    }
    return { positions: pos, phases: ph, radii: rad };
  }, [flock]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCenter: { value: new THREE.Vector3(flock.x, flock.y, flock.z) },
    uDriftAngle: { value: flock.driftAngle },
    uDriftSpeed: { value: flock.driftSpeed },
    uColor: { value: new THREE.Color(0.7, 0.8, 1.0) },
  }), [flock]);

  useFrame(() => {
    if (!matRef.current) return;
    uniforms.uTime.value = elapsedRef.current;
    const dc = getDayCycle(cycleRef.current);
    const n = dc.starOpacity;
    uniforms.uColor.value.setRGB(
      lerp(dc.birdEmissive[0], 0.7, 0.3 + n * 0.2),
      lerp(dc.birdEmissive[1], 0.8, 0.3 + n * 0.2),
      lerp(dc.birdEmissive[2], 1.0, 0.3 + n * 0.2),
    );
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aOrbitRadius" args={[radii, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={flockVertexShader}
        fragmentShader={flockFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

// ─── Game World ───────────────────────────────────────────────────────────────

function GameWorld({ gameStateRef, callbacks, isMobile, audioRef, sharedStreakRef }: FlySceneProps) {
  const { camera, gl } = useThree();

  const birdPos = useRef(new THREE.Vector3(0, 0, 0));
  const birdYaw = useRef(Math.PI);
  const birdPitch = useRef(0);
  const steerInput = useRef({ x: 0, y: 0 });
  const cycleRef = useRef(0);
  const elapsedRef = useRef(0);
  const wingPhaseRef = useRef(0);
  const distRef = useRef(0);
  const totalDistRef = useRef(0);
  const chunksRef = useRef<Map<string, Chunk3D>>(new Map());
  const baseSeedRef = useRef(Math.floor(Math.random() * 100000));
  const burstsRef = useRef<BurstParticle3D[]>([]);
  const pointerActiveRef = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());
  const prevGameState = useRef<GameState>("menu");
  const camTarget = useRef(new THREE.Vector3());
  const camLookTarget = useRef(new THREE.Vector3());
  const smoothedCamLook = useRef(new THREE.Vector3());
  const smoothedCamYaw = useRef(Math.PI);
  const smoothedCamPitch = useRef(0);
  const camRoll = useRef(0);

  const glowRef = useRef(0);
  const trailBoostRef = useRef(0);
  const pulseRef = useRef(0);
  const streakRef = useRef(0);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const fogColorRef = useRef(new THREE.Color());

  const [, setChunkVersion] = useState(0);
  const chunkVersionRef = useRef(0);

  // Create audio engine once
  useEffect(() => {
    const engine = new AudioEngine(isMobile);
    audioEngineRef.current = engine;
    if (audioRef) audioRef.current = engine;
    return () => { engine.suspend(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetGame = useCallback(() => {
    // Seed bird facing away from current camera so the transition feels natural
    const camPos = camera.position;
    const yawFromCam = Math.atan2(camPos.x, camPos.z);
    birdPos.current.set(0, 0, 0);
    birdYaw.current = yawFromCam;
    birdPitch.current = 0;
    steerInput.current = { x: 0, y: 0 };

    // Init smoothed camera from current position — no jump
    smoothedCamYaw.current = yawFromCam;
    smoothedCamPitch.current = 0;
    camRoll.current = 0;
    smoothedCamLook.current.set(
      -Math.sin(yawFromCam) * 12,
      0.5,
      -Math.cos(yawFromCam) * 12,
    );
    camTarget.current.copy(camPos);

    cycleRef.current = 0;
    distRef.current = 0;
    totalDistRef.current = 0;
    wingPhaseRef.current = 0;
    chunksRef.current.clear();
    burstsRef.current = [];
    baseSeedRef.current = Math.floor(Math.random() * 100000);
    pointerActiveRef.current = false;
    glowRef.current = 0;
    trailBoostRef.current = 0;
    pulseRef.current = 0;
    streakRef.current = 0;
  }, [camera]);

  // Input
  useEffect(() => {
    const canvas = gl.domElement;

    function onPointerMove(e: PointerEvent) {
      if (gameStateRef.current !== "playing") return;
      pointerActiveRef.current = true;
      const rect = canvas.getBoundingClientRect();
      steerInput.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      steerInput.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onPointerDown(e: PointerEvent) {
      if (gameStateRef.current !== "playing") return;
      onPointerMove(e);
    }

    function onPointerLeave() {
      steerInput.current.x = 0;
      steerInput.current.y = 0;
    }

    function onKeyDown(e: KeyboardEvent) {
      keysRef.current.add(e.key);
    }

    function onKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key);
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gl, gameStateRef]);

  // Main game loop
  useFrame((state, delta) => {
    const dt = Math.min(delta, DELTA_CAP);
    elapsedRef.current += dt;
    const gs = gameStateRef.current;

    // State transitions
    if (prevGameState.current !== gs) {
      if (gs === "playing" && prevGameState.current === "menu") {
        resetGame();
      }
      prevGameState.current = gs;
    }

    if (gs === "menu" || gs === "playing") {
      cycleRef.current += dt / DAY_CYCLE_DURATION;
    }

    if (gs === "playing") {
      const keys = keysRef.current;
      const hasMovementKey =
        keys.has("ArrowUp") || keys.has("w") || keys.has("W") ||
        keys.has("ArrowDown") || keys.has("s") || keys.has("S") ||
        keys.has("ArrowLeft") || keys.has("a") || keys.has("A") ||
        keys.has("ArrowRight") || keys.has("d") || keys.has("D");

      if (hasMovementKey) {
        pointerActiveRef.current = false;
        let kx = 0, ky = 0;
        if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) kx = -0.5;
        if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) kx = 0.5;
        if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) ky = 0.5;
        if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) ky = -0.5;
        steerInput.current.x = kx;
        steerInput.current.y = ky;
      } else if (!pointerActiveRef.current) {
        steerInput.current.x = 0;
        steerInput.current.y = 0;
      }

      const steerX = steerInput.current.x;
      const steerY = steerInput.current.y;

      birdYaw.current += -steerX * TURN_SPEED * dt;
      birdPitch.current = Math.max(-PITCH_DOWN_LIMIT, Math.min(PITCH_UP_LIMIT,
        birdPitch.current + steerY * TURN_SPEED * 0.7 * dt
      ));

      if (Math.abs(steerY) < 0.05) {
        birdPitch.current *= 0.97;
      }

      const yaw = birdYaw.current;
      const pitch = birdPitch.current;
      const cosPitch = Math.cos(pitch);
      const streakBoost = Math.min((audioEngineRef.current?.streak ?? 0) / 12, 1);
      const speed = FLY_SPEED * (1 + streakBoost * 1.5);
      birdPos.current.x += -Math.sin(yaw) * cosPitch * speed * dt;
      birdPos.current.y += Math.sin(pitch) * speed * dt;
      birdPos.current.z += -Math.cos(yaw) * cosPitch * speed * dt;

      totalDistRef.current += speed * dt;
      const newDist = Math.floor(totalDistRef.current / 5);
      if (newDist !== distRef.current) {
        distRef.current = newDist;
        callbacks.onDistance(newDist);
      }

      wingPhaseRef.current += (2.5 + Math.abs(steerY) * 3 + streakBoost * 3) * dt;

      // Orb magnetism + collection
      const MAGNET_RADIUS = 5;
      const MAGNET_RADIUS_SQ = MAGNET_RADIUS * MAGNET_RADIUS;
      const bp = birdPos.current;
      for (const chunk of chunksRef.current.values()) {
        for (const orb of chunk.orbs) {
          if (orb.collected) continue;
          const odx = orb.x - bp.x;
          const ody = orb.y - bp.y;
          const odz = orb.z - bp.z;
          const distSq = odx * odx + ody * ody + odz * odz;

          // Magnetism — gently pull nearby orbs toward bird
          if (distSq < MAGNET_RADIUS_SQ && distSq > ORB_COLLECT_RADIUS * ORB_COLLECT_RADIUS) {
            const dist = Math.sqrt(distSq);
            const pull = (1 - dist / MAGNET_RADIUS) * 3 * dt;
            orb.x -= odx / dist * pull;
            orb.y -= ody / dist * pull;
            orb.z -= odz / dist * pull;
          }

          if (distSq < ORB_COLLECT_RADIUS * ORB_COLLECT_RADIUS) {
            orb.collected = true;
            audioEngineRef.current?.playChime(orb.golden);
            const currentStreak = audioEngineRef.current?.streak ?? 0;
            const baseMultiplier = 1 + Math.floor(currentStreak / 3);
            const multiplier = orb.golden ? baseMultiplier * 3 : baseMultiplier;
            callbacks.onScore(multiplier);
            callbacks.onStreak(currentStreak);

            glowRef.current = orb.golden ? 1.5 : 1.0;
            trailBoostRef.current = orb.golden ? 1.5 : 1.0;
            pulseRef.current = orb.golden ? 1.5 : 1.0;

            const burstCount = orb.golden ? BURST_COUNT * 2 : BURST_COUNT;
            for (let b = 0; b < burstCount; b++) {
              const theta = (b / burstCount) * Math.PI * 2;
              const phi = Math.random() * Math.PI;
              const spd = 2 + Math.random() * (orb.golden ? 6 : 4);
              burstsRef.current.push({
                x: orb.x, y: orb.y, z: orb.z,
                vx: Math.sin(phi) * Math.cos(theta) * spd,
                vy: Math.sin(phi) * Math.sin(theta) * spd,
                vz: Math.cos(phi) * spd,
                life: 1,
              });
            }
          }
        }
      }

      // Decay feedback refs
      const decayFactor = Math.pow(0.97, dt * 60);
      glowRef.current *= decayFactor;
      trailBoostRef.current *= decayFactor;
      pulseRef.current *= decayFactor;
      streakRef.current = audioEngineRef.current?.streak ?? 0;
      if (sharedStreakRef) sharedStreakRef.current = streakRef.current;
    }

    // Ambient audio follows day cycle in both menu and playing
    audioEngineRef.current?.updateAmbient(cycleRef.current, birdPos.current.y);

    // Chunk management — runs for menu and playing so the world is always populated
    if (gs === "playing" || gs === "menu") {
      const refX = gs === "playing" ? birdPos.current.x : camera.position.x;
      const refZ = gs === "playing" ? birdPos.current.z : camera.position.z;
      const refCX = Math.floor(refX / CHUNK_DEPTH);
      const refCZ = Math.floor(refZ / CHUNK_DEPTH);
      const chunksMap = chunksRef.current;
      let chunksChanged = false;

      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) + Math.abs(dz) > 2) continue;
          const key = `${refCX + dx},${refCZ + dz}`;
          if (!chunksMap.has(key)) {
            chunksMap.set(key, generateChunk(refCX + dx, refCZ + dz, baseSeedRef.current));
            chunksChanged = true;
          }
        }
      }

      for (const [key, chunk] of chunksMap) {
        const cdx = Math.abs(chunk.cx - refCX);
        const cdz = Math.abs(chunk.cz - refCZ);
        if (cdx + cdz > 3) {
          chunksMap.delete(key);
          chunksChanged = true;
        }
      }

      if (chunksChanged) {
        chunkVersionRef.current++;
        setChunkVersion(chunkVersionRef.current);
      }
    }

    // Camera
    const t = elapsedRef.current;
    if (gs === "playing") {
      const bp = birdPos.current;
      const camSmooth = 1 - Math.pow(0.02, dt);
      smoothedCamYaw.current = lerp(smoothedCamYaw.current, birdYaw.current, camSmooth);
      smoothedCamPitch.current = lerp(smoothedCamPitch.current, birdPitch.current, camSmooth);
      const cYaw = smoothedCamYaw.current;
      const cPitch = smoothedCamPitch.current;
      const breathX = Math.sin(t * 0.35) * 0.12;
      const breathY = Math.sin(t * 0.22) * 0.06;
      camTarget.current.set(
        bp.x + Math.sin(cYaw) * 13 + breathX,
        bp.y + 4.5 + breathY,
        bp.z + Math.cos(cYaw) * 13
      );
      const cosPitch = Math.cos(cPitch);
      camLookTarget.current.set(
        bp.x + (-Math.sin(cYaw) * cosPitch) * 12,
        bp.y + Math.sin(cPitch) * 12 + 0.5,
        bp.z + (-Math.cos(cYaw) * cosPitch) * 12
      );
      const posFactor = 1 - Math.pow(0.02, dt);
      const lookFactor = 1 - Math.pow(0.04, dt);
      camera.position.lerp(camTarget.current, posFactor);
      smoothedCamLook.current.lerp(camLookTarget.current, lookFactor);

      // Roll via tilted up vector — avoids Euler decomposition artifacts
      const rollTarget = -steerInput.current.x * 0.08;
      camRoll.current = THREE.MathUtils.lerp(camRoll.current, rollTarget, 0.02);
      camera.up.set(Math.sin(camRoll.current), Math.cos(camRoll.current), 0);
      camera.lookAt(smoothedCamLook.current);

      // FOV widens with streak
      const targetFov = 55 + Math.min(streakRef.current / 12, 1) * 20;
      (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(
        (camera as THREE.PerspectiveCamera).fov, targetFov, 0.04
      );
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    } else if (gs === "menu") {
      // Gentle orbit — always looks beautiful as a background
      const drift = t * 0.08;
      const r = 25;
      camera.up.set(0, 1, 0);
      camera.position.set(
        Math.sin(drift) * r,
        4 + Math.sin(drift * 0.4) * 2.5,
        Math.cos(drift) * r,
      );
      camera.lookAt(
        Math.sin(drift * 1.3) * 4,
        1.5 + Math.sin(drift * 0.7) * 0.5,
        Math.cos(drift * 0.9) * 4,
      );
    }

    // Lighting from cycle
    const dc = getDayCycle(cycleRef.current);
    if (ambientRef.current) {
      ambientRef.current.color.setRGB(...dc.ambientColor);
      ambientRef.current.intensity = dc.ambientIntensity;
    }
    if (dirRef.current) {
      dirRef.current.color.setRGB(...dc.dirColor);
      dirRef.current.intensity = dc.dirIntensity;
      const bp = birdPos.current;
      dirRef.current.position.set(bp.x + 20, bp.y + 30, bp.z + 10);
    }

    // Fog
    const scene = state.scene;
    fogColorRef.current.setRGB(...dc.fogColor);
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(fogColorRef.current);
    }
    scene.background = fogColorRef.current;
  });

  const moteCount = isMobile ? 30 : 80;

  return (
    <>
      <SkyDome cycleRef={cycleRef} />
      <StarField cycleRef={cycleRef} elapsedRef={elapsedRef} />

      <ambientLight ref={ambientRef} intensity={0.5} />
      <directionalLight ref={dirRef} position={[20, 30, 10]} intensity={1} />
      <hemisphereLight args={["#8090b0", "#302818", 0.15]} />

      <SpiritBird birdRef={birdPos} wingPhaseRef={wingPhaseRef} cycleRef={cycleRef} elapsedRef={elapsedRef} yawRef={birdYaw} pitchRef={birdPitch} glowRef={glowRef} streakRef={streakRef} />
      <TrailPreview chunks={chunksRef.current} cycleRef={cycleRef} elapsedRef={elapsedRef} />
      <TrailSystem birdRef={birdPos} yawRef={birdYaw} pitchRef={birdPitch} cycleRef={cycleRef} gameStateRef={gameStateRef} isMobile={isMobile} trailBoostRef={trailBoostRef} streakRef={streakRef} />
      <BurstSystem burstsRef={burstsRef} cycleRef={cycleRef} gameStateRef={gameStateRef} />
      <WindStreaks birdRef={birdPos} yawRef={birdYaw} pitchRef={birdPitch} cycleRef={cycleRef} gameStateRef={gameStateRef} isMobile={isMobile} />

      {Array.from(chunksRef.current.values()).map(chunk => (
        <group key={chunk.key}>
          {chunk.clouds.map((cloud, i) => (
            <CloudPuff key={`${chunk.key}-c-${i}`} data={cloud} elapsedRef={elapsedRef} cycleRef={cycleRef} />
          ))}
          {chunk.wisps.map((wisp, i) => (
            <LightWisp key={`${chunk.key}-w-${i}`} data={wisp} elapsedRef={elapsedRef} />
          ))}
          {chunk.orbs.map((orb, i) => (
            <LightOrbMesh key={`${chunk.key}-o-${i}`} orb={orb} cycleRef={cycleRef} elapsedRef={elapsedRef} />
          ))}
          {chunk.pillars.map((pillar, i) => (
            <LightPillarEntity key={`${chunk.key}-p-${i}`} data={pillar} cycleRef={cycleRef} elapsedRef={elapsedRef} />
          ))}
          {!isMobile && chunk.flocks.map((flock, i) => (
            <FlockEntity key={`${chunk.key}-f-${i}`} flock={flock} cycleRef={cycleRef} elapsedRef={elapsedRef} />
          ))}
          <AmbientMotes
            key={`${chunk.key}-m`}
            cycleRef={cycleRef}
            elapsedRef={elapsedRef}
            cx={chunk.cx}
            cz={chunk.cz}
            count={moteCount}
            birdRef={birdPos}
            pulseRef={pulseRef}
          />
        </group>
      ))}
    </>
  );
}

// ─── Main Scene Export ────────────────────────────────────────────────────────

function DynamicEffects({ streakRef }: { streakRef: React.MutableRefObject<number> }) {
  const offsetRef = useRef(new THREE.Vector2(0, 0));

  useFrame(() => {
    const s = Math.min(streakRef.current / 12, 1);
    const v = s * 0.003;
    offsetRef.current.set(v, v);
  });

  return <ChromaticAberration offset={offsetRef.current} radialModulation modulationOffset={0.2} />;
}

export default function FlyScene({ gameStateRef, callbacks, isMobile, audioRef }: FlySceneProps) {
  const sharedStreakRef = useRef(0);

  return (
    <Canvas
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      camera={{ fov: 55, near: 0.1, far: 600 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.7;
        scene.fog = new THREE.FogExp2("#0a0a20", 0.011);
      }}
      style={{ touchAction: "none" }}
    >
      <GameWorld gameStateRef={gameStateRef} callbacks={callbacks} isMobile={isMobile} audioRef={audioRef} sharedStreakRef={sharedStreakRef} />
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.5}
          mipmapBlur
          radius={isMobile ? 0.4 : 0.7}
        />
        <Vignette darkness={0.55} offset={0.25} />
        <DynamicEffects streakRef={sharedStreakRef} />
      </EffectComposer>
    </Canvas>
  );
}
