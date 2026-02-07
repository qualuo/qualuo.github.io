"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WebGLErrorBoundary } from "@/components/ui/WebGLErrorBoundary";

const CONFIG = {
  radius: 1.4,
  detail: 8,
  noise: {
    scale: 0.8,
    speed: 0.12,
    amplitude: 0.15,
  },
  mouse: {
    influence: 0.12,
    smoothing: 0.025,
  },
  rotation: {
    speed: 0.08,
  },
  breathe: {
    speed: 0.4,
    amplitude: 0.03,
  },
  explosion: {
    minSpeed: 1.5,
    maxSpeed: 4.0,
    spread: 1.2,
    drag: 0.955,
    duration: 2.2,
    reformDuration: 1.8,
    reformThreshold: 0.001,
  },
};

// Simple 3D noise function (simplex-like)
function noise3D(x: number, y: number, z: number): number {
  const p = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
    36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
    234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
    134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
    230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
    1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
    116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250,
    124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227,
    47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44,
    154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
    108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
    242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
    239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
    50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243,
    141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];

  const perm = [...p, ...p];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number, z: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;

  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);

  const u = fade(x);
  const v = fade(y);
  const w = fade(z);

  const A = perm[X] + Y;
  const AA = perm[A] + Z;
  const AB = perm[A + 1] + Z;
  const B = perm[X + 1] + Y;
  const BA = perm[B] + Z;
  const BB = perm[B + 1] + Z;

  return lerp(
    w,
    lerp(
      v,
      lerp(u, grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z)),
      lerp(u, grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z))
    ),
    lerp(
      v,
      lerp(u, grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1)),
      lerp(
        u,
        grad(perm[AB + 1], x, y - 1, z - 1),
        grad(perm[BB + 1], x - 1, y - 1, z - 1)
      )
    )
  );
}

type Phase = "idle" | "exploding" | "reforming";

interface SceneProps {
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
  shouldExplode: React.MutableRefObject<boolean>;
}

function BlobScene({ mousePosition, shouldExplode }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const smoothMouse = useRef({ x: 0, y: 0 });
  const time = useRef(0);
  const frameCount = useRef(0);
  const originalPositions = useRef<Float32Array | null>(null);
  const phase = useRef<Phase>("idle");
  const phaseTime = useRef(0);
  const particleVelocities = useRef<Float32Array | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 4);
  }, [camera]);

  // Blob iridescent shader
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1.0 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;
        vec3 palette(float t) {
          vec3 a = vec3(0.8, 0.8, 0.9);
          vec3 b = vec3(0.2, 0.2, 0.3);
          vec3 c = vec3(0.6, 0.8, 1.0);
          vec3 d = vec3(0.0, 0.1, 0.2);
          return a + b * cos(6.28318 * (c * t + d));
        }
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = 1.0 - max(dot(viewDirection, vNormal), 0.0);
          fresnel = pow(fresnel, 2.5);
          float iridescence = dot(vWorldNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
          iridescence += fresnel * 0.3;
          iridescence += sin(uTime * 0.3) * 0.1;
          vec3 iriColor = palette(iridescence + uTime * 0.05);
          vec3 baseColor = vec3(0.95, 0.95, 1.0);
          vec3 color = mix(baseColor, iriColor, fresnel * 0.6 + 0.15);
          float innerGlow = 1.0 - fresnel;
          color += vec3(0.1, 0.15, 0.2) * innerGlow * 0.3;
          float breathe = sin(uTime * 0.5) * 0.05 + 0.85;
          float alpha = (breathe - fresnel * 0.25) * uOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
    });
  }, []);

  // Particle shader — crisp iridescent points (same palette as blob)
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1.0 },
        uScale: { value: 1.0 },
      },
      vertexShader: `
        uniform float uScale;
        uniform float uTime;
        attribute float aRandom;
        varying vec3 vColor;

        vec3 palette(float t) {
          vec3 a = vec3(0.8, 0.8, 0.9);
          vec3 b = vec3(0.2, 0.2, 0.3);
          vec3 c = vec3(0.6, 0.8, 1.0);
          vec3 d = vec3(0.0, 0.1, 0.2);
          return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
          vec3 dir = normalize(position);
          float iridescence = dir.y * 0.5 + 0.5 + sin(uTime * 0.3) * 0.1;
          vec3 iriColor = palette(iridescence + uTime * 0.05);
          vec3 baseColor = vec3(0.95, 0.95, 1.0);
          vColor = mix(baseColor, iriColor, 0.45);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (0.4 + aRandom * 0.6) * uScale * (30.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.9 * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  // Store original positions & init particle geometry
  useEffect(() => {
    if (!meshRef.current) return;
    originalPositions.current = new Float32Array(
      meshRef.current.geometry.attributes.position.array
    );

    if (pointsRef.current) {
      const count = meshRef.current.geometry.attributes.position.count;
      const positions = new Float32Array(count * 3);
      const randoms = new Float32Array(count);
      for (let i = 0; i < count; i++) randoms[i] = Math.random();

      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
      pointsRef.current.geometry.dispose();
      pointsRef.current.geometry = geom;
    }
  }, []);

  useFrame((_, delta) => {
    time.current += delta;
    frameCount.current += 1;

    smoothMouse.current.x +=
      (mousePosition.current.x - smoothMouse.current.x) * CONFIG.mouse.smoothing;
    smoothMouse.current.y +=
      (mousePosition.current.y - smoothMouse.current.y) * CONFIG.mouse.smoothing;

    // --- Explosion trigger ---
    if (shouldExplode.current) {
      shouldExplode.current = false;
      if (phase.current === "idle" && meshRef.current && pointsRef.current) {
        phase.current = "exploding";
        phaseTime.current = 0;

        const meshPos = meshRef.current.geometry.attributes.position
          .array as Float32Array;
        const particlePos = pointsRef.current.geometry.attributes.position
          .array as Float32Array;
        particleVelocities.current = new Float32Array(meshPos.length);

        for (let i = 0; i < meshPos.length; i += 3) {
          particlePos[i] = meshPos[i];
          particlePos[i + 1] = meshPos[i + 1];
          particlePos[i + 2] = meshPos[i + 2];

          const x = meshPos[i],
            y = meshPos[i + 1],
            z = meshPos[i + 2];
          const len = Math.sqrt(x * x + y * y + z * z) || 1;
          const speed =
            CONFIG.explosion.minSpeed +
            Math.random() *
              (CONFIG.explosion.maxSpeed - CONFIG.explosion.minSpeed);

          particleVelocities.current[i] =
            (x / len) * speed +
            (Math.random() - 0.5) * CONFIG.explosion.spread;
          particleVelocities.current[i + 1] =
            (y / len) * speed +
            (Math.random() - 0.5) * CONFIG.explosion.spread;
          particleVelocities.current[i + 2] =
            (z / len) * speed +
            (Math.random() - 0.5) * CONFIG.explosion.spread;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    // --- Group rotation & breathing (always) ---
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * CONFIG.rotation.speed;
      groupRef.current.rotation.x =
        smoothMouse.current.y * CONFIG.mouse.influence;
      groupRef.current.rotation.z =
        smoothMouse.current.x * CONFIG.mouse.influence * 0.5;
      const breathe =
        1 +
        Math.sin(time.current * CONFIG.breathe.speed) *
          CONFIG.breathe.amplitude;
      groupRef.current.scale.setScalar(breathe);
    }

    // --- Helper: morph mesh vertices to current noise state ---
    const morphMesh = () => {
      if (!meshRef.current || !originalPositions.current) return;
      const geometry = meshRef.current.geometry;
      const positions = geometry.attributes.position.array as Float32Array;
      const original = originalPositions.current;

      for (let i = 0; i < positions.length; i += 3) {
        const ox = original[i],
          oy = original[i + 1],
          oz = original[i + 2];
        const length = Math.sqrt(ox * ox + oy * oy + oz * oz);
        const nx = ox / length,
          ny = oy / length,
          nz = oz / length;

        const noiseVal = noise3D(
          nx * CONFIG.noise.scale + time.current * CONFIG.noise.speed,
          ny * CONFIG.noise.scale + time.current * CONFIG.noise.speed * 0.8,
          nz * CONFIG.noise.scale + time.current * CONFIG.noise.speed * 0.6
        );

        const displacement = CONFIG.radius + noiseVal * CONFIG.noise.amplitude;
        positions[i] = nx * displacement;
        positions[i + 1] = ny * displacement;
        positions[i + 2] = nz * displacement;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    };

    // --- Phase logic ---
    if (phase.current === "idle") {
      if (meshRef.current) meshRef.current.visible = true;
      if (pointsRef.current) pointsRef.current.visible = false;
      shaderMaterial.uniforms.uOpacity.value = 1.0;

      if (frameCount.current % 6 === 0) morphMesh();
    } else {
      phaseTime.current += delta;

      if (
        phase.current === "exploding" &&
        pointsRef.current &&
        particleVelocities.current
      ) {
        // Hide mesh, show particles at full
        if (meshRef.current) meshRef.current.visible = false;
        if (pointsRef.current) pointsRef.current.visible = true;
        particleMaterial.uniforms.uOpacity.value = 1.0;

        // Size swell: quick burst then settle
        const et = phaseTime.current / CONFIG.explosion.duration;
        const swell = et < 0.15 ? 1.0 + et / 0.15 * 0.6 : 1.6 - (et - 0.15) * 0.7;
        particleMaterial.uniforms.uScale.value = Math.max(swell, 0.9);

        const positions = pointsRef.current.geometry.attributes.position
          .array as Float32Array;

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += particleVelocities.current[i] * delta;
          positions[i + 1] += particleVelocities.current[i + 1] * delta;
          positions[i + 2] += particleVelocities.current[i + 2] * delta;

          particleVelocities.current[i] *= CONFIG.explosion.drag;
          particleVelocities.current[i + 1] *= CONFIG.explosion.drag;
          particleVelocities.current[i + 2] *= CONFIG.explosion.drag;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        if (phaseTime.current > CONFIG.explosion.duration) {
          phase.current = "reforming";
          phaseTime.current = 0;
        }
      } else if (
        phase.current === "reforming" &&
        pointsRef.current &&
        originalPositions.current
      ) {
        const positions = pointsRef.current.geometry.attributes.position
          .array as Float32Array;
        // Ease-in: slow start, graceful acceleration
        const t = Math.min(
          phaseTime.current / CONFIG.explosion.reformDuration,
          1
        );
        const eased = t * t * t; // cubic ease-in — slow start, snappy finish
        const lerpFactor = 0.04 + eased * 0.45;

        // Cross-fade: mesh fades in, particles fade out over last 40%
        const crossFade = t < 0.6 ? 0 : (t - 0.6) / 0.4; // 0→1 from t=0.6→1.0
        const meshOpacity = crossFade * crossFade; // ease-in for mesh appearance
        const particleOpacity = 1 - crossFade;

        // Show mesh once cross-fade begins, morph it to stay in sync
        if (meshRef.current) {
          meshRef.current.visible = crossFade > 0;
          shaderMaterial.uniforms.uOpacity.value = meshOpacity;
        }
        particleMaterial.uniforms.uOpacity.value = particleOpacity;
        pointsRef.current.visible = particleOpacity > 0;

        // Shrink particles as they converge, mesh morphs during cross-fade
        particleMaterial.uniforms.uScale.value = 1.0 - crossFade * 0.4;
        if (crossFade > 0) morphMesh();

        let maxDistSq = 0;

        for (let i = 0; i < positions.length; i += 3) {
          const ox = originalPositions.current[i],
            oy = originalPositions.current[i + 1],
            oz = originalPositions.current[i + 2];
          const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;
          const nx = ox / len,
            ny = oy / len,
            nz = oz / len;

          const noiseVal = noise3D(
            nx * CONFIG.noise.scale + time.current * CONFIG.noise.speed,
            ny * CONFIG.noise.scale + time.current * CONFIG.noise.speed * 0.8,
            nz * CONFIG.noise.scale + time.current * CONFIG.noise.speed * 0.6
          );
          const displacement =
            CONFIG.radius + noiseVal * CONFIG.noise.amplitude;
          const tx = nx * displacement,
            ty = ny * displacement,
            tz = nz * displacement;

          const dx = tx - positions[i],
            dy = ty - positions[i + 1],
            dz = tz - positions[i + 2];
          positions[i] += dx * lerpFactor;
          positions[i + 1] += dy * lerpFactor;
          positions[i + 2] += dz * lerpFactor;

          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq > maxDistSq) maxDistSq = distSq;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        if (maxDistSq < CONFIG.explosion.reformThreshold || t >= 1) {
          shaderMaterial.uniforms.uOpacity.value = 1.0;
          phase.current = "idle";
        }
      }

      particleMaterial.uniforms.uTime.value = time.current;
    }

    // Always update mesh shader time
    if (meshRef.current) {
      shaderMaterial.uniforms.uTime.value = time.current;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} material={shaderMaterial}>
        <icosahedronGeometry args={[CONFIG.radius, CONFIG.detail]} />
      </mesh>
      <points ref={pointsRef} material={particleMaterial} visible={false}>
        <bufferGeometry />
      </points>
    </group>
  );
}

export function MorphingBlob() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const shouldExplode = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePosition.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const fallback = (
    <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-white/10 via-white/5 to-transparent" />
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-pointer"
      onClick={() => {
        shouldExplode.current = true;
      }}
    >
      <WebGLErrorBoundary fallback={fallback}>
        <Canvas
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
          }}
          dpr={1}
        >
          <BlobScene
            mousePosition={mousePosition}
            shouldExplode={shouldExplode}
          />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
