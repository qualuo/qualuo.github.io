"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Configuration - refined and restrained
const CONFIG = {
  nodeCount: 24,
  connectionDistance: 2.8,
  nodeSize: 0.035,
  spread: { x: 4.5, y: 3, z: 2.5 },
  drift: {
    speed: 0.00015,
    amplitude: 0.3,
  },
  rotation: {
    speed: 0.02,
  },
  mouse: {
    influence: 0.15,
    smoothing: 0.03,
  },
  pulse: {
    speed: 0.4,
    min: 0.15,
    max: 0.4,
  },
};

// Generate stable node positions using golden ratio distribution
function generateNodes(count: number, spread: typeof CONFIG.spread) {
  const nodes: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;

    nodes.push(
      new THREE.Vector3(
        Math.cos(theta) * radius * spread.x,
        y * spread.y,
        Math.sin(theta) * radius * spread.z
      )
    );
  }
  return nodes;
}

// Find connections between nearby nodes
function generateConnections(
  nodes: THREE.Vector3[],
  maxDistance: number
): [number, number][] {
  const connections: [number, number][] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].distanceTo(nodes[j]) < maxDistance) {
        connections.push([i, j]);
      }
    }
  }
  return connections;
}

interface NetworkProps {
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}

function Network({ mousePosition }: NetworkProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  const smoothMouse = useRef({ x: 0, y: 0 });
  const time = useRef(0);

  const { nodes, connections, basePositions } = useMemo(() => {
    const nodes = generateNodes(CONFIG.nodeCount, CONFIG.spread);
    const connections = generateConnections(nodes, CONFIG.connectionDistance);
    const basePositions = nodes.map((n) => n.clone());
    return { nodes, connections, basePositions };
  }, []);

  // Initialize instanced mesh matrices
  useEffect(() => {
    if (!nodesRef.current) return;

    const dummy = new THREE.Object3D();
    nodes.forEach((node, i) => {
      dummy.position.copy(node);
      dummy.updateMatrix();
      nodesRef.current!.setMatrixAt(i, dummy.matrix);
    });
    nodesRef.current.instanceMatrix.needsUpdate = true;
  }, [nodes]);

  useFrame((_, delta) => {
    time.current += delta;

    // Smooth mouse following
    smoothMouse.current.x +=
      (mousePosition.current.x - smoothMouse.current.x) * CONFIG.mouse.smoothing;
    smoothMouse.current.y +=
      (mousePosition.current.y - smoothMouse.current.y) * CONFIG.mouse.smoothing;

    // Gentle rotation based on mouse
    if (groupRef.current) {
      groupRef.current.rotation.y +=
        delta * CONFIG.rotation.speed +
        smoothMouse.current.x * CONFIG.mouse.influence * delta;
      groupRef.current.rotation.x =
        smoothMouse.current.y * CONFIG.mouse.influence * 0.5;
    }

    // Organic node drift
    if (nodesRef.current) {
      const dummy = new THREE.Object3D();

      nodes.forEach((node, i) => {
        const base = basePositions[i];
        const phase = i * 0.5;

        node.x =
          base.x +
          Math.sin(time.current * CONFIG.drift.speed * 1000 + phase) *
            CONFIG.drift.amplitude;
        node.y =
          base.y +
          Math.cos(time.current * CONFIG.drift.speed * 800 + phase * 1.3) *
            CONFIG.drift.amplitude *
            0.6;
        node.z =
          base.z +
          Math.sin(time.current * CONFIG.drift.speed * 600 + phase * 0.7) *
            CONFIG.drift.amplitude *
            0.4;

        dummy.position.copy(node);
        dummy.updateMatrix();
        nodesRef.current!.setMatrixAt(i, dummy.matrix);
      });

      nodesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update connection lines
    if (linesRef.current) {
      const positions = linesRef.current.geometry.attributes.position
        .array as Float32Array;

      connections.forEach(([i, j], idx) => {
        const offset = idx * 6;
        positions[offset] = nodes[i].x;
        positions[offset + 1] = nodes[i].y;
        positions[offset + 2] = nodes[i].z;
        positions[offset + 3] = nodes[j].x;
        positions[offset + 4] = nodes[j].y;
        positions[offset + 5] = nodes[j].z;
      });

      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Subtle line opacity pulse
    if (materialRef.current) {
      const pulse =
        CONFIG.pulse.min +
        (Math.sin(time.current * CONFIG.pulse.speed) * 0.5 + 0.5) *
          (CONFIG.pulse.max - CONFIG.pulse.min);
      materialRef.current.opacity = pulse;
    }
  });

  // Line geometry
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(connections.length * 6);

    connections.forEach(([i, j], idx) => {
      const offset = idx * 6;
      positions[offset] = nodes[i].x;
      positions[offset + 1] = nodes[i].y;
      positions[offset + 2] = nodes[i].z;
      positions[offset + 3] = nodes[j].x;
      positions[offset + 4] = nodes[j].y;
      positions[offset + 5] = nodes[j].z;
    });

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [nodes, connections]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Nodes - small, soft spheres */}
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[CONFIG.nodeSize, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </instancedMesh>

      {/* Connections - whisper-thin lines */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          ref={materialRef}
          color="#ffffff"
          transparent
          opacity={0.25}
          linewidth={1}
        />
      </lineSegments>
    </group>
  );
}

function Scene({ mousePosition }: NetworkProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 6);
  }, [camera]);

  return (
    <>
      <Network mousePosition={mousePosition} />
    </>
  );
}

export function NeuralNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1
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
      style={{ opacity: 0.6 }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <Scene mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
}