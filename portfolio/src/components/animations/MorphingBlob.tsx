"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Refined configuration — optimized for performance
const CONFIG = {
  radius: 1.4,
  detail: 12, // Reduced for performance
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

interface BlobProps {
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}

function Blob({ mousePosition }: BlobProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const smoothMouse = useRef({ x: 0, y: 0 });
  const time = useRef(0);
  const frameCount = useRef(0);

  // Store original positions
  const originalPositions = useRef<Float32Array | null>(null);

  // Custom shader with iridescent effect
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
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

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;

        // Soft iridescent palette
        vec3 palette(float t) {
          vec3 a = vec3(0.8, 0.8, 0.9);
          vec3 b = vec3(0.2, 0.2, 0.3);
          vec3 c = vec3(0.6, 0.8, 1.0);
          vec3 d = vec3(0.0, 0.1, 0.2);
          return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
          vec3 viewDirection = normalize(cameraPosition - vPosition);

          // Fresnel for edge glow
          float fresnel = 1.0 - max(dot(viewDirection, vNormal), 0.0);
          fresnel = pow(fresnel, 2.5);

          // Iridescence based on view angle + normal
          float iridescence = dot(vWorldNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
          iridescence += fresnel * 0.3;
          iridescence += sin(uTime * 0.3) * 0.1;

          // Subtle color shift
          vec3 iriColor = palette(iridescence + uTime * 0.05);

          // Base white with iridescent tint
          vec3 baseColor = vec3(0.95, 0.95, 1.0);
          vec3 color = mix(baseColor, iriColor, fresnel * 0.6 + 0.15);

          // Add subtle inner glow
          float innerGlow = 1.0 - fresnel;
          color += vec3(0.1, 0.15, 0.2) * innerGlow * 0.3;

          // Soft alpha with breathing
          float breathe = sin(uTime * 0.5) * 0.05 + 0.85;
          float alpha = breathe - fresnel * 0.25;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
    });
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.IcosahedronGeometry;
      originalPositions.current = new Float32Array(
        geometry.attributes.position.array
      );
    }
  }, []);

  useFrame((_, delta) => {
    time.current += delta;
    frameCount.current += 1;

    // Smooth mouse following
    smoothMouse.current.x +=
      (mousePosition.current.x - smoothMouse.current.x) * CONFIG.mouse.smoothing;
    smoothMouse.current.y +=
      (mousePosition.current.y - smoothMouse.current.y) * CONFIG.mouse.smoothing;

    if (meshRef.current && originalPositions.current) {
      // Gentle rotation — runs every frame (cheap)
      meshRef.current.rotation.y += delta * CONFIG.rotation.speed;
      meshRef.current.rotation.x =
        smoothMouse.current.y * CONFIG.mouse.influence;
      meshRef.current.rotation.z =
        smoothMouse.current.x * CONFIG.mouse.influence * 0.5;

      // Subtle breathing scale
      const breathe = 1 + Math.sin(time.current * CONFIG.breathe.speed) * CONFIG.breathe.amplitude;
      meshRef.current.scale.setScalar(breathe);

      // Morph vertices with noise — every 4th frame only
      if (frameCount.current % 4 === 0) {
        const geometry = meshRef.current.geometry as THREE.IcosahedronGeometry;
        const positions = geometry.attributes.position.array as Float32Array;
        const original = originalPositions.current;

        for (let i = 0; i < positions.length; i += 3) {
          const ox = original[i];
          const oy = original[i + 1];
          const oz = original[i + 2];

          // Normalize to get direction
          const length = Math.sqrt(ox * ox + oy * oy + oz * oz);
          const nx = ox / length;
          const ny = oy / length;
          const nz = oz / length;

          // Single octave noise — removed second octave for performance
          const noiseVal = noise3D(
            nx * CONFIG.noise.scale + time.current * CONFIG.noise.speed,
            ny * CONFIG.noise.scale + time.current * CONFIG.noise.speed * 0.8,
            nz * CONFIG.noise.scale + time.current * CONFIG.noise.speed * 0.6
          );

          // Apply displacement along normal
          const displacement = CONFIG.radius + noiseVal * CONFIG.noise.amplitude;

          positions[i] = nx * displacement;
          positions[i + 1] = ny * displacement;
          positions[i + 2] = nz * displacement;
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
      }
    }

    // Update shader time
    shaderMaterial.uniforms.uTime.value = time.current;
  });

  return (
    <mesh ref={meshRef} material={shaderMaterial}>
      <icosahedronGeometry args={[CONFIG.radius, CONFIG.detail]} />
    </mesh>
  );
}

function Scene({ mousePosition }: BlobProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 4);
  }, [camera]);

  return <Blob mousePosition={mousePosition} />;
}

export function MorphingBlob() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePosition.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.5 }}
    >
      <Canvas
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
      >
        <Scene mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
}
