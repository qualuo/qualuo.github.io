"use client";

import { useRef, useMemo, useSyncExternalStore } from "react";
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

// --- Soul: pulsing energy core with orbiting particles ---
function Soul({
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
  const orbitCount = isMobile ? 30 : 60;
  const reduced = useReducedMotion();

  const coreRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const orbitRef = useRef<THREE.InstancedMesh>(null);
  const orbitMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const time = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lerpColor = useMemo(() => new THREE.Color(), []);

  const particles = useMemo(() => {
    const rand = createPRNG(150);
    return Array.from({ length: orbitCount }, () => ({
      orbit: 0.15 + rand() * 1.4,
      speed: 0.2 + rand() * 0.6,
      tilt: (rand() - 0.5) * Math.PI * 0.5,
      phase: rand() * Math.PI * 2,
      size: 0.008 + rand() * 0.018,
    }));
  }, [orbitCount]);

  const BURST_PERIOD = 5;

  useFrame((_, delta) => {
    if (!coreRef.current || !orbitRef.current) return;
    time.current += delta;
    const scrollLife = Math.min(1, scrollRef.current * 1.5);
    const wind = windRef.current;

    lerpSectionColor(lerpColor, scrollRef, sectionCount, sectionColors);

    // Burst: quick expand + slow return
    const burstPhase = (time.current % BURST_PERIOD) / BURST_PERIOD;
    const burst =
      burstPhase < 0.08
        ? Math.sin((burstPhase / 0.08) * Math.PI)
        : Math.max(0, 1 - (burstPhase - 0.08) / 0.35) * 0.3;

    // Core glow
    if (coreMatRef.current) {
      coreMatRef.current.color.copy(lerpColor);
      coreMatRef.current.opacity =
        0.25 + burst * 0.4 + Math.sin(time.current * 1.5) * 0.08;
    }
    coreRef.current.scale.setScalar(
      0.7 + burst * 0.6 + Math.sin(time.current * 1.5) * 0.1,
    );

    if (orbitMatRef.current) {
      orbitMatRef.current.color.copy(lerpColor);
      orbitMatRef.current.opacity = 0.25 + scrollLife * 0.2;
    }

    for (let i = 0; i < orbitCount; i++) {
      const p = particles[i];
      if (reduced) {
        dummy.position.set(
          Math.cos(p.phase) * p.orbit,
          Math.sin(p.phase) * p.orbit * Math.cos(p.tilt),
          Math.sin(p.phase) * p.orbit * Math.sin(p.tilt),
        );
      } else {
        const a = time.current * p.speed + p.phase;
        const r = p.orbit * (1 + burst * 2.5);
        dummy.position.set(
          Math.cos(a) * r + wind * 0.04,
          Math.sin(a) * r * Math.cos(p.tilt),
          Math.sin(a) * r * Math.sin(p.tilt),
        );
      }
      const flicker =
        0.5 + Math.sin(time.current * 4 + p.phase) * 0.5;
      dummy.scale.setScalar((p.size * flicker) / 0.015);
      dummy.updateMatrix();
      orbitRef.current.setMatrixAt(i, dummy.matrix);
    }
    orbitRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, -0.3, 0]}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          ref={coreMatRef}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <instancedMesh ref={orbitRef} args={[undefined, undefined, orbitCount]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshBasicMaterial
          ref={orbitMatRef}
          transparent
          opacity={0.3}
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
      { x: 2.5, z: -4, w: 0.4, h: 10, speed: 0.04, phase: 0 },
      { x: -2.8, z: -5, w: 0.3, h: 9, speed: 0.03, phase: 2.2 },
      { x: 5, z: -6, w: 0.35, h: 11, speed: 0.025, phase: 4.5 },
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
  const count = isMobile ? 40 : 80;
  const reduced = useReducedMotion();

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const time = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lerpColor = useMemo(() => new THREE.Color(), []);
  const warmTint = useMemo(() => new THREE.Color("#ffcc88"), []);

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
      wobbleAmp: 0.1 + rand() * 0.4,
      flickerSpeed: 1 + rand() * 3,
      size: 0.015 + rand() * 0.03,
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
      materialRef.current.color.copy(lerpColor).lerp(warmTint, 0.3);
      materialRef.current.opacity = 0.2 + scrollLife * 0.3;
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

  return (
    <>
      <WindController windRef={windRef} scrollRef={scrollRef} />
      <PointerRotateGroup ptrRef={pointerRef}>
        <Soul
          scrollRef={scrollRef}
          sectionCount={sectionCount}
          sectionColors={sectionColors}
          windRef={windRef}
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
          intensity={1.4}
          luminanceThreshold={0.06}
          luminanceSmoothing={0.9}
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
