"use client";

import { useRef, useMemo, useEffect, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { WebGLErrorBoundary } from "@/components/ui/WebGLErrorBoundary";

// ============================================================
// UTILITIES
// ============================================================

function createPRNG(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

type PointerPos = { x: number; y: number };

function lerpSectionColor(
  out: THREE.Color,
  scrollRef: React.RefObject<number>,
  sectionCount: number,
  sectionColors: THREE.Color[],
) {
  const scroll = scrollRef.current;
  const raw = scroll * sectionCount;
  const idx = Math.min(Math.floor(raw), sectionCount - 1);
  const nextIdx = Math.min(idx + 1, sectionCount - 1);
  const t = raw - Math.floor(raw);
  out.lerpColors(sectionColors[idx], sectionColors[nextIdx], t);
}

// Camera: position=[0, 0.5, 6], fov=55
// halfH = 6 * tan(27.5°) — visible world-space half-height at z=0
const HALF_H = 6 * Math.tan((55 * Math.PI) / 360); // ≈ 3.124

// ============================================================
// COMPONENTS
// ============================================================

// --- Pointer rotation + breathing ---
function PointerRotateGroup({
  children,
  ptrRef,
}: {
  children: React.ReactNode;
  ptrRef: React.RefObject<PointerPos>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    time.current += delta;
    const targetY = ptrRef.current.x * 0.15;
    const targetX = ptrRef.current.y * -0.05;
    const t = 1 - Math.exp(-3 * delta);
    groupRef.current.rotation.y +=
      (targetY - groupRef.current.rotation.y) * t;
    groupRef.current.rotation.x +=
      (targetX - groupRef.current.rotation.x) * t;
    groupRef.current.scale.setScalar(
      1 + Math.sin(time.current * 0.4) * 0.006,
    );
  });

  return <group ref={groupRef}>{children}</group>;
}

// --- Wind controller ---
function WindController({
  windRef,
  scrollRef,
}: {
  windRef: React.MutableRefObject<number>;
  scrollRef: React.RefObject<number>;
}) {
  const time = useRef(0);
  useFrame((_, delta) => {
    time.current += delta;
    const scrollLife = Math.min(1, scrollRef.current * 1.5);
    const base = Math.sin(time.current * 0.2) * 0.25;
    const gust =
      Math.pow(Math.max(0, Math.sin(time.current * 0.12)), 4) * 0.8;
    windRef.current = (base + gust) * (0.3 + scrollLife * 0.7);
  });
  return null;
}

// --- Soul: a cute curious sprite that chases the cursor ---
function Soul({
  scrollRef,
  sectionCount,
  sectionColors,
  windRef,
  pointerRef,
}: {
  scrollRef: React.RefObject<number>;
  sectionCount: number;
  sectionColors: THREE.Color[];
  windRef: React.RefObject<number>;
  pointerRef: React.RefObject<PointerPos>;
}) {
  const isMobile = useThree((s) => s.size.width < 768);
  const trailCount = isMobile ? 5 : 9;

  // Track pointer directly — bypasses ref-passing through Canvas boundary
  const localPointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      localPointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      localPointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const bodyMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const auraMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const trailMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const time = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lerpColor = useMemo(() => new THREE.Color(), []);
  const petalTint = useMemo(() => new THREE.Color("#ffffff"), []);

  // Soul position + physics
  const soul = useRef({
    x: 0, y: 0,
    vx: 0, vy: 0,
    excitement: 0,
    prevPx: 0, prevPy: 0,
  });

  // Trail: each particle springs toward the one ahead — creates an organic tail
  // useRef so mutable trail state never resets on re-render
  const trailDataRef = useRef(
    Array.from({ length: trailCount }, () => ({ x: 0, y: -0.3, vx: 0, vy: 0 })),
  );
  const trailPropsRef = useRef((() => {
    const rand = createPRNG(42);
    return Array.from({ length: trailCount }, (_, i) => ({
      size: 0.08 * (1 - i / trailCount) + rand() * 0.01,
      wobblePhase: rand() * Math.PI * 2,
    }));
  })());
  const trail = trailDataRef.current;
  const trailProps = trailPropsRef.current;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    time.current += dt;

    // Use local pointer (bypasses Canvas boundary)
    const px = localPointer.current.x;
    const py = localPointer.current.y;

    if (!bodyRef.current || !trailRef.current || !groupRef.current) return;
    const s = soul.current;
    const wind = windRef.current;

    // ── Chase the cursor (map screen -1…1 → world coords) ──
    const aspect = window.innerWidth / window.innerHeight;
    const targetX = px * HALF_H * aspect;
    const targetY = -py * HALF_H + 0.5;

    // ── Cursor → excitement ──
    const cursorSpeed = Math.sqrt(
      (px - s.prevPx) ** 2 + (py - s.prevPy) ** 2,
    ) / Math.max(dt, 0.001);
    s.prevPx = px;
    s.prevPy = py;

    const exciteTarget = Math.min(1, cursorSpeed * 0.8);
    s.excitement += (exciteTarget - s.excitement)
      * (exciteTarget > s.excitement ? 18 : 2) * dt;

    const stiffness = 18;
    const damping = 5.0;
    s.vx += (targetX - s.x) * stiffness * dt;
    s.vy += (targetY - s.y) * stiffness * dt;
    s.vx *= Math.exp(-damping * dt);
    s.vy *= Math.exp(-damping * dt);
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    // Idle bob + playful wander when calm
    const calm = 1 - s.excitement;
    const idleBob = calm * Math.sin(time.current * 1.8) * 0.05;
    const wanderX = calm * Math.sin(time.current * 0.5) * 0.07;
    const wanderY = calm * Math.cos(time.current * 0.7) * 0.04;
    // Excited wobble
    const wobX = s.excitement * Math.sin(time.current * 11) * 0.02;
    const wobY = s.excitement * Math.cos(time.current * 8) * 0.015;
    // Happy bounce — periodic little jump
    const bounceCycle = time.current % 3.5;
    const happyBounce = bounceCycle < 0.3
      ? Math.sin(bounceCycle / 0.3 * Math.PI) * 0.06 * calm
      : 0;

    const posX = s.x + wobX + wanderX + wind * 0.04;
    const posY = s.y + idleBob + wobY + wanderY + happyBounce - 0.3;
    groupRef.current.position.set(posX, posY, 0);

    // ── Section color ──
    lerpSectionColor(lerpColor, scrollRef, sectionCount, sectionColors);

    // ── Body: lean + squish/stretch + breathe ──
    const speed = Math.sqrt(s.vx ** 2 + s.vy ** 2);
    const breathRate = 1.4 + s.excitement * 1.2;
    const breath = Math.sin(time.current * breathRate);
    const baseScale = 1 + breath * 0.07 + s.excitement * 0.14;

    // Rotate body to face movement direction — stretch along velocity
    const moveAngle = Math.atan2(s.vy, s.vx);
    bodyRef.current.rotation.z = moveAngle - Math.PI / 2; // point "up" along velocity
    // Stretch along movement axis, compress perpendicular (raindrop shape)
    const stretch = Math.min(speed * 0.08, 0.12);
    bodyRef.current.scale.set(
      baseScale * (1 - stretch * 0.5),
      baseScale * (1 + stretch),
      baseScale,
    );

    if (bodyMatRef.current) {
      bodyMatRef.current.color.copy(lerpColor).lerp(petalTint, 0.8 + s.excitement * 0.1);
      bodyMatRef.current.opacity = 0.75 + breath * 0.04 + s.excitement * 0.1;
    }

    // ── Aura: pulses with excitement ──
    if (auraRef.current && auraMatRef.current) {
      const auraScale = 1.3 + breath * 0.06 + s.excitement * 0.3;
      auraRef.current.scale.setScalar(auraScale);
      auraMatRef.current.color.copy(lerpColor).lerp(petalTint, 0.85);
      auraMatRef.current.opacity = 0.06 + s.excitement * 0.05;
    }

    // ── Trail: spring-follow chain ──
    if (trailMatRef.current && bodyMatRef.current) {
      trailMatRef.current.color.copy(bodyMatRef.current.color);
      trailMatRef.current.opacity = 0.3 + s.excitement * 0.1;
    }

    for (let i = 0; i < trailCount; i++) {
      const tp = trail[i];
      const leader = i === 0 ? { x: posX, y: posY } : trail[i - 1];

      // Spring toward leader — decreasing stiffness for later particles
      const k = 45 - i * 1.0;
      const d = 14;
      tp.vx += (leader.x - tp.x) * k * dt;
      tp.vy += (leader.y - tp.y) * k * dt;
      tp.vx *= Math.exp(-d * dt);
      tp.vy *= Math.exp(-d * dt);
      tp.x += tp.vx * dt;
      tp.y += tp.vy * dt;

      const fade = 1 - i / trailCount;
      const tProp = trailProps[i];
      const sparkle = Math.sin(time.current * 5 + tProp.wobblePhase) * 0.008 * (1 + s.excitement * 1.5);

      dummy.position.set(
        tp.x - posX + sparkle,
        tp.y - posY + Math.cos(time.current * 4 + tProp.wobblePhase) * 0.006,
        -0.015 * (i + 1),
      );
      const flicker = 0.85 + Math.sin(time.current * 5 + tProp.wobblePhase) * 0.15;
      dummy.scale.setScalar(tProp.size * fade * flicker / 0.015);
      dummy.updateMatrix();
      trailRef.current.setMatrixAt(i, dummy.matrix);
    }
    trailRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      {/* Outer aura — soft ambient glow */}
      <mesh ref={auraRef}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial
          ref={auraMatRef}
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Body — cute glowing orb */}
      <mesh ref={bodyRef}>
        <sphereGeometry args={[0.103, 16, 16]} />
        <meshBasicMaterial
          ref={bodyMatRef}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Sparkle trail */}
      <instancedMesh ref={trailRef} args={[undefined, undefined, trailCount]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshBasicMaterial
          ref={trailMatRef}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}

// --- Light Shafts ---
function LightShafts({
  scrollRef,
  sectionCount,
  sectionColors,
}: {
  scrollRef: React.RefObject<number>;
  sectionCount: number;
  sectionColors: THREE.Color[];
}) {
  const reduced = useReducedMotion();
  const shafts = useRef<THREE.Mesh[]>([]);
  const time = useRef(0);
  const lerpColor = useMemo(() => new THREE.Color(), []);

  const configs = useMemo(
    () => [
      { x: 2.5, z: -4, w: 0.6, h: 12, speed: 0.04, phase: 0 },
      { x: -2.8, z: -5, w: 0.5, h: 11, speed: 0.03, phase: 2.2 },
      { x: 5, z: -6, w: 0.55, h: 13, speed: 0.025, phase: 4.5 },
      { x: -5.5, z: -5, w: 0.4, h: 10, speed: 0.035, phase: 1.1 },
      { x: 0, z: -7, w: 0.3, h: 14, speed: 0.02, phase: 3.3 },
    ],
    [],
  );

  useFrame((_, delta) => {
    time.current += delta;
    const scrollLife = Math.min(1, scrollRef.current * 1.5);
    lerpSectionColor(lerpColor, scrollRef, sectionCount, sectionColors);

    shafts.current.forEach((shaft, i) => {
      if (!shaft) return;
      const cfg = configs[i];
      const mat = shaft.material as THREE.MeshBasicMaterial;
      mat.color.copy(lerpColor);
      const pulse = Math.sin(time.current * 0.2 + cfg.phase) * 0.01;
      mat.opacity = (0.015 + pulse) * (0.2 + scrollLife * 0.8);
      if (!reduced) {
        shaft.position.x =
          cfg.x + Math.sin(time.current * cfg.speed + cfg.phase) * 1.5;
      }
    });
  });

  return (
    <>
      {configs.map((cfg, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) shafts.current[i] = el;
          }}
          position={[cfg.x, 1, cfg.z]}
          rotation={[0, 0, 0.08 * (i % 2 === 0 ? 1 : -1)]}
        >
          <planeGeometry args={[cfg.w, cfg.h]} />
          <meshBasicMaterial
            transparent
            opacity={0.02}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

// --- Forest Motes (fireflies) ---
function ForestMotes({
  scrollRef,
  sectionCount,
  sectionColors,
  windRef,
}: {
  scrollRef: React.RefObject<number>;
  sectionCount: number;
  sectionColors: THREE.Color[];
  windRef: React.RefObject<number>;
}) {
  const isMobile = useThree((s) => s.size.width < 768);
  const count = isMobile ? 60 : 130;
  const reduced = useReducedMotion();

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const time = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lerpColor = useMemo(() => new THREE.Color(), []);
  const warmTint = useMemo(() => new THREE.Color("#ffc0cb"), []); // Petal pink tint

  const motes = useMemo(() => {
    const rand = createPRNG(99);
    return Array.from({ length: count }, () => ({
      base: new THREE.Vector3(
        (rand() - 0.5) * 14,
        -2 + rand() * 7,
        (rand() - 0.5) * 8 - 2,
      ),
      speed: 0.05 + rand() * 0.15,
      wobbleFreq: 0.2 + rand() * 0.4,
      wobbleAmp: 0.15 + rand() * 0.55, // Wider drift like falling petals
      flickerSpeed: 1 + rand() * 3,
      size: 0.018 + rand() * 0.04,
      phase: rand() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    time.current += delta;
    const scrollLife = Math.min(1, scrollRef.current * 1.5);
    const wind = windRef.current;

    lerpSectionColor(lerpColor, scrollRef, sectionCount, sectionColors);

    if (materialRef.current) {
      materialRef.current.color.copy(lerpColor).lerp(warmTint, 0.4);
      materialRef.current.opacity = 0.25 + scrollLife * 0.3;
    }

    for (let i = 0; i < count; i++) {
      const m = motes[i];
      if (reduced) {
        dummy.position.copy(m.base);
      } else {
        const ls = 0.6 + scrollLife * 0.4;
        dummy.position.set(
          m.base.x +
            Math.sin(time.current * m.wobbleFreq * ls + m.phase) *
              m.wobbleAmp *
              0.5 +
            wind * 0.15,
          m.base.y +
            Math.sin(time.current * m.speed * ls + m.phase) *
              m.wobbleAmp,
          m.base.z +
            Math.cos(
              time.current * m.wobbleFreq * 0.7 * ls + m.phase,
            ) *
              m.wobbleAmp *
              0.3,
        );
      }
      const flicker = Math.max(
        0,
        Math.sin(time.current * m.flickerSpeed + m.phase),
      );
      dummy.scale.setScalar((m.size * flicker) / 0.03);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.03, 6, 6]} />
      <meshBasicMaterial
        ref={materialRef}
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

// ============================================================
// SCENE ORCHESTRATOR
// ============================================================

function SceneContent({
  scrollRef,
  pointerRef,
  sectionCount,
  sectionColors,
}: {
  scrollRef: React.RefObject<number>;
  pointerRef: React.RefObject<PointerPos>;
  sectionCount: number;
  sectionColors: THREE.Color[];
}) {
  const windRef = useRef(0);
  const isMobile = useThree((s) => s.size.width < 768);

  return (
    <>
      <WindController windRef={windRef} scrollRef={scrollRef} />
      <PointerRotateGroup ptrRef={pointerRef}>
        <Soul
          scrollRef={scrollRef}
          sectionCount={sectionCount}
          sectionColors={sectionColors}
          windRef={windRef}
          pointerRef={pointerRef as React.RefObject<PointerPos>}
        />
        <ForestMotes
          scrollRef={scrollRef}
          sectionCount={sectionCount}
          sectionColors={sectionColors}
          windRef={windRef}
        />
        <LightShafts
          scrollRef={scrollRef}
          sectionCount={sectionCount}
          sectionColors={sectionColors}
        />
      </PointerRotateGroup>
      <EffectComposer>
        <Bloom
          intensity={isMobile ? 1.2 : 1.8}
          luminanceThreshold={isMobile ? 0.08 : 0.04}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ============================================================
// MAIN EXPORT
// ============================================================

interface CreativeSceneProps {
  scrollProgressRef: React.RefObject<number>;
  pointerRef: React.RefObject<{ x: number; y: number }>;
  sectionCount: number;
  sectionColors: string[];
}

export function CreativeScene({
  scrollProgressRef,
  pointerRef,
  sectionCount,
  sectionColors,
}: CreativeSceneProps) {
  const threeColors = useMemo(
    () => sectionColors.map((c) => new THREE.Color(c)),
    [sectionColors],
  );

  return (
    <WebGLErrorBoundary
      fallback={
        <div
          className="fixed inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, #0a1a0a 0%, #1C1917 100%)",
          }}
        />
      }
    >
      <Canvas
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 0,
        }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.5, 6], fov: 55 }}
      >
        <SceneContent
          scrollRef={scrollProgressRef}
          pointerRef={pointerRef}
          sectionCount={sectionCount}
          sectionColors={threeColors}
        />
      </Canvas>
    </WebGLErrorBoundary>
  );
}
