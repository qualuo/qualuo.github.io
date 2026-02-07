"use client";

import { useRef, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MotionValue } from "framer-motion";
import * as THREE from "three";
import { WebGLErrorBoundary } from "@/components/ui/WebGLErrorBoundary";

// Deterministic pseudo-random number generator (Park-Miller)
function createPRNG(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const emptySubscribe = () => () => {};

interface AbstractVisualProps {
  type: "neural" | "grid" | "flow" | "city" | "chess" | "circuit";
  colors: {
    primary: string;
    secondary: string;
  };
  scrollProgress: MotionValue<number>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useIsActive(_: MotionValue<number>) {
  // Always animate — gating caused a visible jump when scrolling into range
  const ref = useRef(true);
  return ref;
}

// Wrapper that applies drag rotation as a parent transform
function DragRotateWrapper({ children }: { children: React.ReactNode }) {
  const { gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const state = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    velocityX: 0,
    velocityY: 0,
    rotationX: 0,
    rotationY: 0,
  });

  useEffect(() => {
    const el = gl.domElement;

    const onDown = (e: PointerEvent) => {
      state.current.isDragging = true;
      state.current.prevX = e.clientX;
      state.current.prevY = e.clientY;
      state.current.velocityX = 0;
      state.current.velocityY = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (!state.current.isDragging) return;
      const s = state.current;
      const dx = e.clientX - s.prevX;
      const dy = e.clientY - s.prevY;
      s.velocityX = dx * 0.005;
      s.velocityY = dy * 0.005;
      s.rotationY += s.velocityX;
      s.rotationX += s.velocityY;
      s.prevX = e.clientX;
      s.prevY = e.clientY;
    };

    const onUp = () => {
      state.current.isDragging = false;
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  useFrame(() => {
    if (!groupRef.current) return;
    const s = state.current;

    if (!s.isDragging) {
      s.velocityX *= 0.95;
      s.velocityY *= 0.95;
      s.rotationY += s.velocityX;
      s.rotationX += s.velocityY;
    }

    s.rotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, s.rotationX));

    groupRef.current.rotation.y = s.rotationY;
    groupRef.current.rotation.x = s.rotationX;
  });

  return <group ref={groupRef}>{children}</group>;
}

// Neural Network Visual (for AI & Innovation)
function NeuralNetworkVisual({ colors, scrollProgress }: { colors: AbstractVisualProps["colors"]; scrollProgress: MotionValue<number> }) {
  const isActive = useIsActive(scrollProgress);
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const time = useRef(0);

  const { nodes, connections, basePositions } = useMemo(() => {
    const nodeCount = 32;
    const connectionDistance = 2.5;
    const spread = { x: 6, y: 4, z: 3 };
    const nodes: THREE.Vector3[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2;
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

    const connections: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < connectionDistance) {
          connections.push([i, j]);
        }
      }
    }

    return { nodes, connections, basePositions: nodes.map((n) => n.clone()) };
  }, []);

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
    if (!isActive.current) return;
    time.current += delta;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = Math.sin(time.current * 0.2) * 0.1;
    }

    if (nodesRef.current) {
      const dummy = new THREE.Object3D();
      nodes.forEach((node, i) => {
        const base = basePositions[i];
        const phase = i * 0.5;
        node.x = base.x + Math.sin(time.current * 0.5 + phase) * 0.3;
        node.y = base.y + Math.cos(time.current * 0.4 + phase) * 0.2;
        node.z = base.z + Math.sin(time.current * 0.3 + phase) * 0.15;
        dummy.position.copy(node);
        dummy.updateMatrix();
        nodesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      nodesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (linesRef.current) {
      const positions = linesRef.current.geometry.attributes.position.array as Float32Array;
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

    if (materialRef.current) {
      materialRef.current.opacity = 0.2 + Math.sin(time.current * 0.5) * 0.1;
    }
  });

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

  const primaryColor = new THREE.Color(colors.primary);

  return (
    <group ref={groupRef}>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={primaryColor} transparent opacity={0.8} />
      </instancedMesh>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial ref={materialRef} color={colors.secondary} transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

// Grid Visual (for Architecture)
function GridVisual({ colors, scrollProgress }: { colors: AbstractVisualProps["colors"]; scrollProgress: MotionValue<number> }) {
  const isActive = useIsActive(scrollProgress);
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  const gridSize = 20;
  const gridDivisions = 20;

  useFrame((_, delta) => {
    if (!isActive.current) return;
    time.current += delta;

    if (groupRef.current) {
      groupRef.current.rotation.x = -Math.PI / 6 + Math.sin(time.current * 0.2) * 0.05;
      groupRef.current.rotation.z = time.current * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -2]}>
      <gridHelper
        args={[gridSize, gridDivisions, colors.primary, colors.secondary]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <gridHelper
        args={[gridSize * 0.7, gridDivisions, colors.secondary, colors.primary]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0.5, 0]}
      />
      {/* Floating cubes */}
      {[...Array(8)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 0.8) * 4,
            Math.cos(i * 1.2) * 2 + 1,
            Math.sin(i * 0.5) * 3,
          ]}
        >
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshBasicMaterial color={i % 2 === 0 ? colors.primary : colors.secondary} transparent opacity={0.6} wireframe />
        </mesh>
      ))}
    </group>
  );
}

// Flow Visual (for Data Engineering) - Org Network with pulsing connections
function FlowVisual({ colors, scrollProgress }: { colors: AbstractVisualProps["colors"]; scrollProgress: MotionValue<number> }) {
  const isActive = useIsActive(scrollProgress);
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);
  const pulseRefs = useRef<THREE.Mesh[]>([]);
  const time = useRef(0);

  // Generate hierarchical org network
  const { nodes, connections } = useMemo(() => {
    const rand = createPRNG(101);
    const nodes: { pos: THREE.Vector3; size: number; tier: number }[] = [];
    const connections: { from: number; to: number }[] = [];

    // Central hub (leadership)
    nodes.push({ pos: new THREE.Vector3(0, 0, 0), size: 0.35, tier: 0 });

    // Tier 1: Department heads (ring around center)
    const tier1Count = 5;
    for (let i = 0; i < tier1Count; i++) {
      const angle = (i / tier1Count) * Math.PI * 2;
      const radius = 2;
      nodes.push({
        pos: new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0),
        size: 0.25,
        tier: 1,
      });
      connections.push({ from: 0, to: nodes.length - 1 });
    }

    // Tier 2: Teams (clusters around each department)
    const tier2PerDept = 4;
    for (let dept = 1; dept <= tier1Count; dept++) {
      const deptPos = nodes[dept].pos;
      for (let i = 0; i < tier2PerDept; i++) {
        const angle = ((i / tier2PerDept) * Math.PI * 1.5) + (dept / tier1Count) * Math.PI * 2;
        const radius = 1.2;
        const offset = new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          (rand() - 0.5) * 0.5
        );
        nodes.push({
          pos: deptPos.clone().add(offset),
          size: 0.15,
          tier: 2,
        });
        connections.push({ from: dept, to: nodes.length - 1 });

        // Some cross-team connections
        if (rand() > 0.7 && nodes.length > 10) {
          const randomNode = Math.floor(rand() * (nodes.length - 5)) + 5;
          if (randomNode !== nodes.length - 1) {
            connections.push({ from: randomNode, to: nodes.length - 1 });
          }
        }
      }
    }

    // Tier 3: Individual employees (scattered around teams)
    const tier3Count = 20;
    for (let i = 0; i < tier3Count; i++) {
      const parentIdx = Math.floor(rand() * (nodes.length - tier1Count - 1)) + tier1Count + 1;
      const parent = nodes[parentIdx];
      const angle = rand() * Math.PI * 2;
      const radius = 0.6 + rand() * 0.4;
      nodes.push({
        pos: parent.pos.clone().add(new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          (rand() - 0.5) * 0.3
        )),
        size: 0.08,
        tier: 3,
      });
      connections.push({ from: parentIdx, to: nodes.length - 1 });
    }

    return { nodes, connections };
  }, []);

  useFrame((_, delta) => {
    if (!isActive.current) return;
    time.current += delta;

    // Gentle rotation
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(time.current * 0.1) * 0.1;
      groupRef.current.rotation.y = Math.sin(time.current * 0.15) * 0.15;
    }

    // Animate node breathing
    nodeRefs.current.forEach((mesh, i) => {
      if (mesh && nodes[i]) {
        const node = nodes[i];
        const breathe = 1 + Math.sin(time.current * 2 + i * 0.5) * 0.15;
        mesh.scale.setScalar(node.size * breathe);

        // Gentle position drift
        const drift = new THREE.Vector3(
          Math.sin(time.current * 0.5 + i) * 0.05,
          Math.cos(time.current * 0.4 + i * 0.7) * 0.05,
          Math.sin(time.current * 0.3 + i * 0.5) * 0.02
        );
        mesh.position.copy(node.pos).add(drift);
      }
    });

    // Animate pulse traveling along connections
    pulseRefs.current.forEach((mesh, i) => {
      if (mesh && connections[i]) {
        const conn = connections[i];
        const from = nodes[conn.from];
        const to = nodes[conn.to];
        if (from && to) {
          const progress = ((time.current * 0.8 + i * 0.3) % 2) / 2;
          // Pulse travels back and forth
          const t = progress < 0.5 ? progress * 2 : 2 - progress * 2;
          mesh.position.lerpVectors(from.pos, to.pos, t);
          mesh.scale.setScalar(0.06 + Math.sin(t * Math.PI) * 0.04);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mesh.material as any).opacity = 0.5 + Math.sin(t * Math.PI) * 0.5;
        }
      }
    });
  });

  // Connection lines geometry
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    connections.forEach(({ from, to }) => {
      const fromPos = nodes[from].pos;
      const toPos = nodes[to].pos;
      positions.push(fromPos.x, fromPos.y, fromPos.z);
      positions.push(toPos.x, toPos.y, toPos.z);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [nodes, connections]);

  return (
    <group ref={groupRef}>
      {/* Connection lines */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={colors.secondary} transparent opacity={0.25} />
      </lineSegments>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <mesh
          key={`node-${i}`}
          ref={(el) => { if (el) nodeRefs.current[i] = el; }}
          position={node.pos}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={node.tier === 0 ? colors.primary : node.tier === 1 ? colors.primary : colors.secondary}
            transparent
            opacity={node.tier === 0 ? 1 : node.tier === 1 ? 0.9 : node.tier === 2 ? 0.7 : 0.5}
          />
        </mesh>
      ))}

      {/* Sync pulses */}
      {connections.slice(0, 25).map((_, i) => (
        <mesh
          key={`pulse-${i}`}
          ref={(el) => { if (el) pulseRefs.current[i] = el; }}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={colors.primary} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// City Visual (for Web & Visualization) - Isometric city with buildings
function CityVisual({ colors, scrollProgress }: { colors: AbstractVisualProps["colors"]; scrollProgress: MotionValue<number> }) {
  const isActive = useIsActive(scrollProgress);
  const groupRef = useRef<THREE.Group>(null);
  const buildingRefs = useRef<THREE.Mesh[]>([]);
  const time = useRef(0);

  const buildings = useMemo(() => {
    const rand = createPRNG(202);
    const result: { x: number; z: number; height: number; width: number; depth: number; lightXOffset: number }[] = [];
    const gridSize = 6;
    const spacing = 0.8;

    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        // Skip some spots for variety
        if (rand() > 0.7) continue;

        // Taller buildings toward center
        const distFromCenter = Math.sqrt(x * x + z * z);
        const maxHeight = Math.max(0.5, 3 - distFromCenter * 0.3);
        const height = 0.3 + rand() * maxHeight;
        const width = 0.2 + rand() * 0.3;

        result.push({
          x: x * spacing + (rand() - 0.5) * 0.2,
          z: z * spacing + (rand() - 0.5) * 0.2,
          height,
          width,
          depth: 0.2 + rand() * 0.3,
          lightXOffset: (rand() - 0.5) * width * 0.5,
        });
      }
    }
    return result;
  }, []);

  useFrame((_, delta) => {
    if (!isActive.current) return;
    time.current += delta;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = 0.8 + Math.sin(time.current * 0.2) * 0.05;
    }

    // Animate building heights slightly
    buildingRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const building = buildings[i];
        const pulse = Math.sin(time.current * 2 + i * 0.5) * 0.05;
        mesh.scale.y = 1 + pulse;
        mesh.position.y = (building.height * (1 + pulse)) / 2;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial color={colors.secondary} transparent opacity={0.1} />
      </mesh>

      {/* Grid lines */}
      <gridHelper args={[12, 24, colors.secondary, colors.secondary]} position={[0, 0.01, 0]}>
        <lineBasicMaterial transparent opacity={0.2} />
      </gridHelper>

      {/* Buildings */}
      {buildings.map((building, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) buildingRefs.current[i] = el; }}
          position={[building.x, building.height / 2, building.z]}
        >
          <boxGeometry args={[building.width, building.height, building.depth]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? colors.primary : colors.secondary}
            transparent
            opacity={0.6 + (building.height / 3) * 0.3}
          />
        </mesh>
      ))}

      {/* Glowing windows (scattered points on buildings) */}
      {buildings.filter((_, i) => i % 4 === 0).map((building, i) => (
        <mesh
          key={`light-${i}`}
          position={[
            building.x + building.lightXOffset,
            building.height * 0.7,
            building.z + building.depth / 2 + 0.01,
          ]}
        >
          <planeGeometry args={[0.05, 0.05]} />
          <meshBasicMaterial color={colors.primary} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Chess Visual — The Immortal Game (Anderssen vs Kieseritzky, 1851) =====

const CHESS_PIECES = [
  // White back row (0-7)
  { type: "rook", isWhite: true, col: 0, row: 0 },
  { type: "knight", isWhite: true, col: 1, row: 0 },
  { type: "bishop", isWhite: true, col: 2, row: 0 },
  { type: "queen", isWhite: true, col: 3, row: 0 },
  { type: "king", isWhite: true, col: 4, row: 0 },
  { type: "bishop", isWhite: true, col: 5, row: 0 },
  { type: "knight", isWhite: true, col: 6, row: 0 },
  { type: "rook", isWhite: true, col: 7, row: 0 },
  // White pawns (8-15)
  ...[0,1,2,3,4,5,6,7].map(c => ({ type: "pawn", isWhite: true, col: c, row: 1 })),
  // Black back row (16-23)
  { type: "rook", isWhite: false, col: 0, row: 7 },
  { type: "knight", isWhite: false, col: 1, row: 7 },
  { type: "bishop", isWhite: false, col: 2, row: 7 },
  { type: "queen", isWhite: false, col: 3, row: 7 },
  { type: "king", isWhite: false, col: 4, row: 7 },
  { type: "bishop", isWhite: false, col: 5, row: 7 },
  { type: "knight", isWhite: false, col: 6, row: 7 },
  { type: "rook", isWhite: false, col: 7, row: 7 },
  // Black pawns (24-31)
  ...[0,1,2,3,4,5,6,7].map(c => ({ type: "pawn", isWhite: false, col: c, row: 6 })),
];

const PIECE_H: Record<string, number> = {
  king: 1.3, queen: 1.15, bishop: 0.9, knight: 0.8, rook: 0.75, pawn: 0.55,
};

// The Immortal Game — 23 moves, 46 half-moves
const IMMORTAL_GAME: { p: number; c: number; r: number; x?: number }[] = [
  { p: 12, c: 4, r: 3 },             // 1.  e4
  { p: 28, c: 4, r: 4 },             // 1... e5
  { p: 13, c: 5, r: 3 },             // 2.  f4
  { p: 28, c: 5, r: 3, x: 13 },     // 2... exf4
  { p: 5,  c: 2, r: 3 },             // 3.  Bc4
  { p: 19, c: 7, r: 3 },             // 3... Qh4+
  { p: 4,  c: 5, r: 0 },             // 4.  Kf1
  { p: 25, c: 1, r: 4 },             // 4... b5
  { p: 5,  c: 1, r: 4, x: 25 },     // 5.  Bxb5
  { p: 22, c: 5, r: 5 },             // 5... Nf6
  { p: 6,  c: 5, r: 2 },             // 6.  Nf3
  { p: 19, c: 7, r: 5 },             // 6... Qh6
  { p: 11, c: 3, r: 2 },             // 7.  d3
  { p: 22, c: 7, r: 4 },             // 7... Nh5
  { p: 6,  c: 7, r: 3 },             // 8.  Nh4
  { p: 19, c: 6, r: 4 },             // 8... Qg5
  { p: 6,  c: 5, r: 4 },             // 9.  Nf5
  { p: 26, c: 2, r: 5 },             // 9... c6
  { p: 14, c: 6, r: 3 },             // 10. g4
  { p: 22, c: 5, r: 5 },             // 10... Nf6
  { p: 7,  c: 6, r: 0 },             // 11. Rg1
  { p: 26, c: 1, r: 4, x: 5 },      // 11... cxb5
  { p: 15, c: 7, r: 3 },             // 12. h4
  { p: 19, c: 6, r: 5 },             // 12... Qg6
  { p: 15, c: 7, r: 4 },             // 13. h5
  { p: 19, c: 6, r: 4 },             // 13... Qg5
  { p: 3,  c: 5, r: 2 },             // 14. Qf3
  { p: 22, c: 6, r: 7 },             // 14... Ng8
  { p: 2,  c: 5, r: 3, x: 28 },     // 15. Bxf4
  { p: 19, c: 5, r: 5 },             // 15... Qf6
  { p: 1,  c: 2, r: 2 },             // 16. Nc3
  { p: 21, c: 2, r: 4 },             // 16... Bc5
  { p: 1,  c: 3, r: 4 },             // 17. Nd5
  { p: 19, c: 1, r: 1, x: 9 },      // 17... Qxb2
  { p: 2,  c: 3, r: 5 },             // 18. Bd6
  { p: 21, c: 6, r: 0, x: 7 },      // 18... Bxg1
  { p: 12, c: 4, r: 4 },             // 19. e5
  { p: 19, c: 0, r: 0, x: 0 },      // 19... Qxa1+
  { p: 4,  c: 4, r: 1 },             // 20. Ke2
  { p: 17, c: 0, r: 5 },             // 20... Na6
  { p: 6,  c: 6, r: 6, x: 30 },     // 21. Nxg7+
  { p: 20, c: 3, r: 7 },             // 21... Kd8
  { p: 3,  c: 5, r: 5 },             // 22. Qf6+
  { p: 22, c: 5, r: 5, x: 3 },      // 22... Nxf6
  { p: 2,  c: 4, r: 6 },             // 23. Be7#
];

const MOVE_INTERVAL = 1.4;   // seconds between moves
const SLIDE_DURATION = 0.55; // seconds for a piece to slide
const END_PAUSE = 4.0;       // seconds to admire the checkmate
const FADE_DURATION = 0.8;   // fade out/in between loops

function chessEase(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function ChessVisual({ colors, scrollProgress }: { colors: AbstractVisualProps["colors"]; scrollProgress: MotionValue<number> }) {
  const isActive = useIsActive(scrollProgress);
  const groupRef = useRef<THREE.Group>(null);
  const pieceGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const highlightRefs = useRef<(THREE.Mesh | null)[]>([]);


  const state = useRef({
    time: 0,
    moveIndex: 0,
    moveTimer: MOVE_INTERVAL, // start with first move ready
    movingPiece: -1,
    phase: "playing" as "playing" | "ending" | "fading" | "resetting",
    phaseTimer: 0,
    mateTime: 0,
    pieces: CHESS_PIECES.map(p => ({
      col: p.col, row: p.row,
      prevCol: p.col, prevRow: p.row,
      captured: false, captureTime: 0,
    })),
    highlights: [] as { x: number; z: number; time: number }[],
  });

  const resetGame = () => {
    const s = state.current;
    s.moveIndex = 0;
    s.moveTimer = MOVE_INTERVAL;
    s.movingPiece = -1;
    s.mateTime = 0;
    s.highlights = [];
    s.pieces = CHESS_PIECES.map(p => ({
      col: p.col, row: p.row,
      prevCol: p.col, prevRow: p.row,
      captured: false, captureTime: 0,
    }));
  };

  useFrame((_, delta) => {
    if (!isActive.current) return;
    const s = state.current;
    s.time += delta;

    // --- Phase machine ---
    if (s.phase === "ending") {
      s.phaseTimer += delta;
      if (s.phaseTimer >= END_PAUSE) {
        s.phase = "fading";
        s.phaseTimer = 0;
      }
    } else if (s.phase === "fading") {
      s.phaseTimer += delta;
      if (s.phaseTimer >= FADE_DURATION) {
        resetGame();
        s.phase = "resetting";
        s.phaseTimer = 0;
      }
    } else if (s.phase === "resetting") {
      s.phaseTimer += delta;
      if (s.phaseTimer >= FADE_DURATION) {
        s.phase = "playing";
        s.phaseTimer = 0;
      }
    } else {
      // --- Playing ---
      s.moveTimer += delta;

      // Slow down the final 3 moves for dramatic buildup
      const isFinale = s.moveIndex >= IMMORTAL_GAME.length - 3;
      const interval = isFinale ? MOVE_INTERVAL * 2 : MOVE_INTERVAL;

      if (s.moveTimer >= interval && s.moveIndex < IMMORTAL_GAME.length) {
        const move = IMMORTAL_GAME[s.moveIndex];
        const piece = s.pieces[move.p];
        piece.prevCol = piece.col;
        piece.prevRow = piece.row;
        piece.col = move.c;
        piece.row = move.r;
        s.movingPiece = move.p;

        if (move.x !== undefined) {
          s.pieces[move.x].captured = true;
          s.pieces[move.x].captureTime = s.time;
        }

        // Only highlight the destination square
        s.highlights.push(
          { x: move.c - 3.5, z: 3.5 - move.r, time: s.time },
        );

        s.moveTimer = 0;
        s.moveIndex++;

        // Checkmate — trigger flash + piece pulse (handled in render loop)
        if (s.moveIndex >= IMMORTAL_GAME.length) {
          s.mateTime = s.time;
        }
      }

      if (s.moveIndex >= IMMORTAL_GAME.length && s.moveTimer > 0.5) {
        s.phase = "ending";
        s.phaseTimer = 0;
      }
    }

    // --- Compute global opacity for fade transitions ---
    let globalOpacity = 1;
    if (s.phase === "fading") {
      globalOpacity = Math.max(0, 1 - s.phaseTimer / FADE_DURATION);
    } else if (s.phase === "resetting") {
      globalOpacity = Math.min(1, s.phaseTimer / FADE_DURATION);
    }

    // --- Update piece positions ---
    const slideT = Math.min(s.moveTimer / SLIDE_DURATION, 1);
    const eased = chessEase(slideT);

    s.pieces.forEach((piece, i) => {
      const group = pieceGroupRefs.current[i];
      if (!group) return;
      const def = CHESS_PIECES[i];
      const h = PIECE_H[def.type];

      if (piece.captured) {
        const dt = s.time - piece.captureTime;
        const cx = piece.col - 3.5;
        const cz = 3.5 - piece.row;
        const flyDir = def.isWhite ? 1 : -1;
        group.position.x = cx + flyDir * dt * 1.5;
        group.position.z = cz;
        group.position.y = h / 2 + dt * 3 - dt * dt * 4;
        group.rotation.x = dt * 4;
        group.rotation.z = dt * 2.5;
        // Fade captured piece
        const capOpacity = Math.max(0, 1 - dt * 1.8) * globalOpacity;
        group.traverse((child) => {
          const m = child as THREE.Mesh;
          if (m.isMesh && m.material) {
            (m.material as THREE.MeshBasicMaterial).opacity = capOpacity;
          }
        });
        return;
      }

      const wx = piece.col - 3.5;
      const wz = 3.5 - piece.row;

      if (i === s.movingPiece && slideT < 1 && s.phase === "playing") {
        const fx = piece.prevCol - 3.5;
        const fz = 3.5 - piece.prevRow;
        group.position.x = fx + (wx - fx) * eased;
        group.position.z = fz + (wz - fz) * eased;
        // Arc — piece lifts off the board mid-slide
        group.position.y = h / 2 + Math.sin(eased * Math.PI) * 0.35;
      } else {
        group.position.x = wx;
        group.position.z = wz;
        group.position.y = h / 2;
      }

      group.rotation.x = 0;
      group.rotation.z = 0;

      // Pulse mating pieces + mated king during checkmate hold
      const isMatingPiece = (s.phase === "ending") && (i === 2 || i === 1 || i === 6);
      const isMatedKing = (s.phase === "ending") && i === 20; // black king
      const baseOpacity = def.type === "king" ? 1 : 0.8;
      const pulse = isMatingPiece ? 0.85 + Math.sin(s.time * 4) * 0.15
        : isMatedKing ? 0.4 + Math.sin(s.time * 3) * 0.3
        : baseOpacity;
      group.traverse((child) => {
        const m = child as THREE.Mesh;
        if (m.isMesh && m.material) {
          (m.material as THREE.MeshBasicMaterial).opacity = pulse * globalOpacity;
        }
      });
    });

    // --- Board rotation ---
    if (groupRef.current) {
      groupRef.current.rotation.y = -0.15 + Math.sin(s.time * 0.1) * 0.1;
      groupRef.current.rotation.x = 0.8 + Math.sin(s.time * 0.08) * 0.03;
    }

    // --- Highlights ---
    s.highlights = s.highlights.filter(hl => s.time - hl.time < 2.5);
    highlightRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const hl = s.highlights[i];
      if (hl) {
        mesh.visible = true;
        mesh.position.x = hl.x;
        mesh.position.z = hl.z;
        const age = s.time - hl.time;
        (mesh.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 0.45 * (1 - age / 2.5)) * globalOpacity;
      } else {
        mesh.visible = false;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0.1, 0]} scale={0.85}>
      {/* Board surface — single translucent plane */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color={colors.secondary} transparent opacity={0.15} />
      </mesh>

      {/* Grid lines — 9 horizontal + 9 vertical */}
      {[...Array(9)].map((_, i) => {
        const pos = i - 4;
        const edge = i === 0 || i === 8;
        return (
          <group key={`grid-${i}`}>
            <mesh position={[0, 0.005, pos]}>
              <boxGeometry args={[8, 0.004, edge ? 0.04 : 0.02]} />
              <meshBasicMaterial color={colors.secondary} transparent opacity={edge ? 0.45 : 0.25} />
            </mesh>
            <mesh position={[pos, 0.005, 0]}>
              <boxGeometry args={[edge ? 0.04 : 0.02, 0.004, 8]} />
              <meshBasicMaterial color={colors.secondary} transparent opacity={edge ? 0.45 : 0.25} />
            </mesh>
          </group>
        );
      })}


      {/* Move trail highlights (pool of 20) */}
      {[...Array(20)].map((_, i) => (
        <mesh
          key={`hl-${i}`}
          ref={el => { highlightRefs.current[i] = el; }}
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <planeGeometry args={[0.96, 0.96]} />
          <meshBasicMaterial color={colors.primary} transparent opacity={0} />
        </mesh>
      ))}

      {/* Pieces */}
      {CHESS_PIECES.map((piece, i) => {
        const c = piece.isWhite ? colors.primary : colors.secondary;
        const h = PIECE_H[piece.type];
        const op = piece.type === "king" ? 1 : 0.85;
        // Shared sub-components
        const base = (
          <mesh position={[0, -h / 2 + 0.03, 0]}>
            <cylinderGeometry args={[0.26, 0.28, 0.06, 16]} />
            <meshBasicMaterial color={c} transparent opacity={op * 0.7} />
          </mesh>
        );
        const collar = (yOff: number) => (
          <mesh position={[0, yOff, 0]}>
            <cylinderGeometry args={[0.19, 0.16, 0.05, 16]} />
            <meshBasicMaterial color={c} transparent opacity={op * 0.8} />
          </mesh>
        );
        return (
          <group
            key={i}
            ref={el => { pieceGroupRefs.current[i] = el; }}
            position={[piece.col - 3.5, h / 2, 3.5 - piece.row]}
          >
            {piece.type === "pawn" && (<>
              {base}
              {/* Body */}
              <mesh position={[0, -0.06, 0]}>
                <cylinderGeometry args={[0.13, 0.2, h * 0.5, 16]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Collar */}
              {collar(0.05)}
              {/* Head */}
              <mesh position={[0, 0.15, 0]}>
                <sphereGeometry args={[0.13, 16, 12]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
            </>)}
            {piece.type === "rook" && (<>
              {base}
              {/* Tower body */}
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[0.18, 0.22, h * 0.6, 16]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Rim */}
              <mesh position={[0, h * 0.32, 0]}>
                <cylinderGeometry args={[0.22, 0.2, 0.06, 16]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Battlements — 3 merlons */}
              {[-0.13, 0, 0.13].map((xOff, j) => (
                <mesh key={j} position={[xOff, h * 0.42, 0]}>
                  <boxGeometry args={[0.08, 0.12, 0.2]} />
                  <meshBasicMaterial color={c} transparent opacity={op} />
                </mesh>
              ))}
            </>)}
            {piece.type === "knight" && (<>
              {base}
              {/* Body */}
              <mesh position={[0, -0.08, 0]}>
                <cylinderGeometry args={[0.14, 0.2, h * 0.3, 16]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Neck/head — tall flat slab, angled forward */}
              <mesh position={[0, 0.14, 0.04]} rotation={[0.25, 0, 0]}>
                <boxGeometry args={[0.14, 0.45, 0.1]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Muzzle — horizontal protrusion */}
              <mesh position={[0, 0.05, 0.16]}>
                <boxGeometry args={[0.12, 0.1, 0.2]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Left ear */}
              <mesh position={[-0.06, 0.38, 0.08]}>
                <coneGeometry args={[0.04, 0.12, 8]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Right ear */}
              <mesh position={[0.06, 0.38, 0.08]}>
                <coneGeometry args={[0.04, 0.12, 8]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
            </>)}
            {piece.type === "bishop" && (<>
              {base}
              {/* Body */}
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[0.1, 0.2, h * 0.55, 16]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Collar */}
              {collar(h * 0.22)}
              {/* Mitre */}
              <mesh position={[0, h * 0.35, 0]}>
                <coneGeometry args={[0.13, 0.35, 16]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Ball finial */}
              <mesh position={[0, h * 0.52, 0]}>
                <sphereGeometry args={[0.05, 12, 8]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
            </>)}
            {piece.type === "queen" && (<>
              {base}
              {/* Body */}
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[0.12, 0.22, h * 0.6, 16]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Collar */}
              {collar(h * 0.25)}
              {/* Crown ring */}
              <mesh position={[0, h * 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.14, 0.035, 12, 24]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
              {/* Orb */}
              <mesh position={[0, h * 0.44, 0]}>
                <sphereGeometry args={[0.09, 14, 10]} />
                <meshBasicMaterial color={c} transparent opacity={op} />
              </mesh>
            </>)}
            {piece.type === "king" && (<>
              {base}
              {/* Body */}
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[0.13, 0.23, h * 0.55, 16]} />
                <meshBasicMaterial color={c} transparent opacity={1} />
              </mesh>
              {/* Collar */}
              {collar(h * 0.22)}
              {/* Crown ring */}
              <mesh position={[0, h * 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.15, 0.035, 12, 24]} />
                <meshBasicMaterial color={c} transparent opacity={1} />
              </mesh>
              {/* Cross — vertical */}
              <mesh position={[0, h * 0.45, 0]}>
                <boxGeometry args={[0.06, 0.35, 0.06]} />
                <meshBasicMaterial color={c} transparent opacity={1} />
              </mesh>
              {/* Cross — horizontal */}
              <mesh position={[0, h * 0.5, 0]}>
                <boxGeometry args={[0.24, 0.06, 0.06]} />
                <meshBasicMaterial color={c} transparent opacity={1} />
              </mesh>
            </>)}
          </group>
        );
      })}
    </group>
  );
}

// ===== Railway Simulation Helpers =====

function railLen(pts: THREE.Vector2[]): number {
  let l = 0;
  for (let i = 0; i < pts.length - 1; i++) l += pts[i].distanceTo(pts[i + 1]);
  return l;
}

function railPos(pts: THREE.Vector2[], len: number, prog: number) {
  const target = Math.max(0, Math.min(1, prog)) * len;
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], seg = a.distanceTo(b);
    if (acc + seg >= target || i === pts.length - 2) {
      const t = seg > 0 ? Math.min(1, (target - acc) / seg) : 0;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    acc += seg;
  }
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  return { x: b.x, y: b.y, angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

function railCarWorldPos(
  route: number[], rIdx: number, hProg: number,
  secs: { pts: THREE.Vector2[]; len: number }[], behind: number
) {
  if (behind <= 0) { const s = secs[route[rIdx]]; return railPos(s.pts, s.len, hProg); }
  let rem = behind, idx = rIdx;
  const hDist = hProg * secs[route[idx]].len;
  if (rem <= hDist) { const s = secs[route[idx]]; return railPos(s.pts, s.len, (hDist - rem) / s.len); }
  rem -= hDist;
  for (let i = 0; i < route.length; i++) {
    idx = (idx - 1 + route.length) % route.length;
    const s = secs[route[idx]];
    if (rem <= s.len) return railPos(s.pts, s.len, 1 - rem / s.len);
    rem -= s.len;
  }
  return railPos(secs[route[0]].pts, secs[route[0]].len, 0);
}

function RailLine({ points, color, opacity }: { points: THREE.Vector3[]; color: string; opacity: number }) {
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const obj = useMemo(() => new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity })), [geo, color, opacity]);
  return <primitive object={obj} />;
}

// Circuit Visual — Railway Network with block signalling, interlocking & realistic train physics
function CircuitVisual({ colors, scrollProgress }: { colors: AbstractVisualProps["colors"]; scrollProgress: MotionValue<number> }) {
  const isActive = useIsActive(scrollProgress);
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  const carRefs = useRef<(THREE.Group | null)[][]>([]);
  const sigLightRefs = useRef<(THREE.Mesh | null)[][]>([]);
  const sigGlowRefs = useRef<(THREE.Mesh | null)[]>([]);

  // ─── Static layout: track sections, stations, signals, train routes ───
  const layout = useMemo(() => {
    type Sec = { id: number; pts: THREE.Vector2[]; len: number; maxSpd: number; staId: number; stopProg: number };
    const secs: Sec[] = [];
    const add = (id: number, c: [number, number][], sp: number, sid = -1, spg = 0.5) => {
      const pts = c.map(([x, y]) => new THREE.Vector2(x, y));
      secs.push({ id, pts, len: railLen(pts), maxSpd: sp, staId: sid, stopProg: spg });
    };

    // Main oval loop (clockwise: north line L→R, east curve, south line R→L, west curve)
    add(0, [[-5.5, 1.2], [-2, 1.2]], 1.0);
    add(1, [[-2, 1.2], [1, 1.2]], 1.0, 0, 0.55);                                         // Station B
    add(2, [[1, 1.2], [5.5, 1.2]], 1.0);
    add(3, [[5.5, 1.2], [5.85, 0.7], [6.05, 0], [5.85, -0.7], [5.5, -1.2]], 0.45);       // East curve
    add(4, [[5.5, -1.2], [2, -1.2]], 1.0);
    add(5, [[2, -1.2], [-1, -1.2]], 1.0, 1, 0.5);                                         // Station A
    add(6, [[-1, -1.2], [-5.5, -1.2]], 1.0);
    add(7, [[-5.5, -1.2], [-5.85, -0.7], [-6.05, 0], [-5.85, 0.7], [-5.5, 1.2]], 0.45);  // West curve
    // Siding branch (diverges from north line at switch SW0, merges back at SW1)
    add(8, [[-2, 1.2], [-1.3, 2.1]], 0.55);
    add(9, [[-1.3, 2.1], [0.7, 2.1]], 0.55, 2, 0.5);                                     // Station C
    add(10, [[0.7, 2.1], [1, 1.2]], 0.55);

    const stations = [
      { id: 0, pos: new THREE.Vector2(-0.2, 1.55), width: 2.0 },
      { id: 1, pos: new THREE.Vector2(0.5, -1.55), width: 2.2 },
      { id: 2, pos: new THREE.Vector2(-0.3, 2.45), width: 1.6 },
    ];

    // Block signals — each protects entry to its block; nextBlock for yellow lookahead
    const sigs = [
      { protects: 0, next: 1, pos: new THREE.Vector2(-5.4, 0.82) },
      { protects: 1, next: 2, pos: new THREE.Vector2(-1.9, 0.82) },
      { protects: 2, next: 3, pos: new THREE.Vector2(1.1, 0.82) },
      { protects: 3, next: 4, pos: new THREE.Vector2(5.7, 1.5) },
      { protects: 4, next: 5, pos: new THREE.Vector2(5.4, -1.58) },
      { protects: 5, next: 6, pos: new THREE.Vector2(1.9, -1.58) },
      { protects: 6, next: 7, pos: new THREE.Vector2(-1.1, -1.58) },
      { protects: 7, next: 0, pos: new THREE.Vector2(-5.7, -1.5) },
      { protects: 8, next: 9, pos: new THREE.Vector2(-1.7, 1.65) },
      { protects: 9, next: 10, pos: new THREE.Vector2(-1.2, 2.45) },
    ];

    const sigForBlock: Record<number, number> = {};
    sigs.forEach((s, i) => { sigForBlock[s.protects] = i; });

    const pylons: THREE.Vector2[] = [];
    for (let x = -5; x <= 5; x += 2.5) {
      pylons.push(new THREE.Vector2(x, 1.2));
      pylons.push(new THREE.Vector2(x, -1.2));
    }

    const mainRoute = [0, 1, 2, 3, 4, 5, 6, 7];
    const sidingRoute = [0, 8, 9, 10, 2, 3, 4, 5, 6, 7];
    const trainDefs = [
      { route: mainRoute, rIdx: 0, prog: 0.3, cars: 3 },
      { route: mainRoute, rIdx: 4, prog: 0.4, cars: 3 },
      { route: sidingRoute, rIdx: 0, prog: 0.8, cars: 2 },
    ];

    const trackPts3 = secs.map(s => {
      const r: THREE.Vector3[] = [];
      for (let i = 0; i < s.pts.length - 1; i++) {
        const a = s.pts[i], b = s.pts[i + 1];
        const n = Math.max(1, Math.ceil(a.distanceTo(b) * 12));
        for (let j = 0; j <= n; j++) {
          const t = j / n;
          r.push(new THREE.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0));
        }
      }
      return r;
    });

    return { secs, stations, sigs, sigForBlock, pylons, trainDefs, trackPts3 };
  }, []);

  const ASPECT = useMemo(() => [
    new THREE.Color(0xee4444), // red
    new THREE.Color(0xddaa33), // yellow
    new THREE.Color(0x22cc66), // green
  ], []);

  // ─── Mutable simulation state (ref-based, no re-renders) ───
  type Train = {
    route: number[]; rIdx: number; prog: number; speed: number;
    dwell: number; cars: number; canDwell: boolean;
  };
  type Sim = {
    trains: Train[];
    blockOcc: boolean[];
    blockOwner: number[];
    sigAspect: number[];
    sigColor: THREE.Color[];
    targetColor: THREE.Color[];
  };
  const sim = useRef<Sim | null>(null);

  // ─── Simulation tick ───
  useFrame((_, delta) => {
    if (!isActive.current) return;
    const dt = Math.min(delta, 0.05);
    time.current += dt;

    if (groupRef.current) {
      groupRef.current.rotation.x = -0.5 + Math.sin(time.current * 0.06) * 0.02;
      groupRef.current.rotation.y = Math.sin(time.current * 0.04) * 0.04;
    }

    if (!sim.current) {
      sim.current = {
        trains: layout.trainDefs.map(d => ({
          route: [...d.route], rIdx: d.rIdx, prog: d.prog,
          speed: 0.15 + Math.random() * 0.1, dwell: 0, cars: d.cars, canDwell: true,
        })),
        blockOcc: layout.secs.map(() => false),
        blockOwner: layout.secs.map(() => -1),
        sigAspect: layout.sigs.map(() => 2),
        sigColor: layout.sigs.map(() => new THREE.Color(0x22cc66)),
        targetColor: layout.sigs.map(() => new THREE.Color(0x22cc66)),
      };
    }
    const S = sim.current;
    const { secs, sigs, sigForBlock } = layout;
    const CAR_SPACE = 0.78;

    // ── 1. Block occupancy ──
    S.blockOcc.fill(false);
    S.blockOwner.fill(-1);
    S.trains.forEach((tr, ti) => {
      const headSec = tr.route[tr.rIdx];
      S.blockOcc[headSec] = true;
      S.blockOwner[headSec] = ti;
      // Tail: walk backward to find which block the last car occupies
      const tailDist = (tr.cars - 1) * CAR_SPACE;
      let rem = tailDist, idx = tr.rIdx;
      const hDist = tr.prog * secs[tr.route[idx]].len;
      if (rem > hDist) {
        rem -= hDist;
        for (let i = 0; i < tr.route.length; i++) {
          idx = (idx - 1 + tr.route.length) % tr.route.length;
          if (rem <= secs[tr.route[idx]].len) break;
          rem -= secs[tr.route[idx]].len;
        }
      }
      const tailSec = tr.route[idx];
      if (tailSec !== headSec) {
        S.blockOcc[tailSec] = true;
        if (S.blockOwner[tailSec] === -1) S.blockOwner[tailSec] = ti;
      }
    });

    // ── 2. Signal aspects (3-aspect colour-light block signalling) ──
    sigs.forEach((sig, si) => {
      if (S.blockOcc[sig.protects]) {
        S.sigAspect[si] = 0; // RED — block occupied
      } else if (S.blockOcc[sig.next]) {
        S.sigAspect[si] = 1; // YELLOW — next block occupied
      } else {
        S.sigAspect[si] = 2; // GREEN — clear
      }
      S.targetColor[si].copy(ASPECT[S.sigAspect[si]]);
    });

    // ── 3. Train movement with realistic physics ──
    S.trains.forEach((tr, ti) => {
      const sec = secs[tr.route[tr.rIdx]];

      // Dwelling at station
      if (tr.dwell > 0) {
        tr.dwell -= dt;
        tr.speed = Math.max(0, tr.speed - 0.4 * dt);
        updateCars(tr, ti);
        return;
      }

      let targetSpd = sec.maxSpd;

      // Station approach & stop
      if (sec.staId >= 0 && tr.canDwell) {
        const distToStop = (sec.stopProg - tr.prog) * sec.len;
        if (distToStop > 0 && distToStop < 2.0) {
          // Smooth braking curve toward station
          targetSpd = Math.min(targetSpd, Math.max(0.05, distToStop * 0.2));
        }
        if (distToStop > -0.08 && distToStop < 0.12 && tr.speed < 0.2) {
          tr.dwell = 2.5 + Math.random() * 2;
          tr.canDwell = false;
          tr.speed = 0;
          updateCars(tr, ti);
          return;
        }
      }

      // Signal awareness — check signal protecting next block in our route
      const nextRIdx = (tr.rIdx + 1) % tr.route.length;
      const nextSecId = tr.route[nextRIdx];
      const si = sigForBlock[nextSecId];
      if (si !== undefined) {
        const aspect = S.sigAspect[si];
        const distToEnd = (1 - tr.prog) * sec.len;
        const bDist = (tr.speed * tr.speed) / 0.8 + 0.4;
        if (aspect === 0) { // RED
          if (distToEnd <= bDist) targetSpd = 0;
          if (distToEnd < 0.15) { targetSpd = 0; tr.speed = 0; }
        } else if (aspect === 1) { // YELLOW — caution, reduce speed
          targetSpd = Math.min(targetSpd, 0.35);
        }
      }

      // Kinematic physics: accelerate or brake toward target
      if (targetSpd > tr.speed) {
        tr.speed = Math.min(targetSpd, tr.speed + 0.22 * dt);
      } else {
        tr.speed = Math.max(targetSpd, tr.speed - 0.4 * dt);
      }
      tr.speed = Math.max(0, tr.speed);

      // Advance position
      if (tr.speed > 0) {
        tr.prog += (tr.speed * dt) / sec.len;
      }

      // Section transition
      if (tr.prog >= 1.0) {
        const nextOcc = S.blockOcc[nextSecId];
        const ownBlock = S.blockOwner[nextSecId] === ti;
        if (!nextOcc || ownBlock) {
          const overflow = (tr.prog - 1.0) * sec.len;
          tr.rIdx = nextRIdx;
          tr.prog = Math.min(0.95, overflow / secs[tr.route[tr.rIdx]].len);
          tr.canDwell = true; // can dwell at next station
        } else {
          tr.prog = 0.999;
          tr.speed = 0;
        }
      }

      updateCars(tr, ti);
    });

    // ── 4. Visual updates ──
    // Smooth signal colour interpolation
    S.sigColor.forEach((c, i) => { c.lerp(S.targetColor[i], dt * 4); });

    // Update 3-aspect signal lights
    sigLightRefs.current.forEach((lights, si) => {
      if (!lights) return;
      const aspect = S.sigAspect[si];
      for (let li = 0; li < 3; li++) {
        const mesh = lights[li];
        if (!mesh) continue;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (li === aspect) {
          mat.color.copy(S.sigColor[si]);
          mat.opacity = 0.95;
        } else {
          mat.color.copy(ASPECT[li]);
          mat.opacity = 0.08;
        }
      }
    });

    // Signal glow pulse
    sigGlowRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const pulse = 0.85 + Math.sin(time.current * 2 + i * 0.4) * 0.15;
      mesh.scale.setScalar(pulse);
      (mesh.material as THREE.MeshBasicMaterial).color.copy(S.sigColor[i]);
    });

    // Car positioning helper
    function updateCars(tr: Train, ti: number) {
      for (let ci = 0; ci < tr.cars; ci++) {
        const ref = carRefs.current[ti]?.[ci];
        if (!ref) continue;
        const wp = railCarWorldPos(tr.route, tr.rIdx, tr.prog, secs, ci * CAR_SPACE);
        ref.position.set(wp.x, wp.y, 0.08);
        // Derive facing from a point slightly ahead
        const ahead = railCarWorldPos(tr.route, tr.rIdx, tr.prog, secs, Math.max(0, ci * CAR_SPACE - 0.1));
        const dx = ahead.x - wp.x, dy = ahead.y - wp.y;
        ref.rotation.z = (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001)
          ? Math.atan2(dy, dx) : wp.angle;
      }
    }
  });

  // Train car sub-component
  const TrainCar = ({ isLoco, len, color }: { isLoco: boolean; len: number; color: string }) => (
    <group>
      {/* Body */}
      <mesh>
        <boxGeometry args={[len, 0.22, 0.28]} />
        <meshBasicMaterial color={color} transparent opacity={0.92} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0, 0.17]}>
        <boxGeometry args={[len * 0.92, 0.18, 0.06]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} />
      </mesh>
      {/* Windows */}
      {[-0.3, -0.15, 0, 0.15, 0.3].map((xp, wi) => (
        <mesh key={wi} position={[len * xp, 0.112, 0.06]}>
          <boxGeometry args={[len * 0.12, 0.005, 0.12]} />
          <meshBasicMaterial color="#aaddff" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Locomotive front + headlights + pantograph */}
      {isLoco && (
        <>
          <mesh position={[len * 0.52, 0, 0]}>
            <boxGeometry args={[0.08, 0.2, 0.26]} />
            <meshBasicMaterial color={color} transparent opacity={0.95} />
          </mesh>
          <mesh position={[len * 0.56, 0.06, 0.08]}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
          <mesh position={[len * 0.56, -0.06, 0.08]}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
          <mesh position={[0, 0, 0.22]}>
            <boxGeometry args={[0.15, 0.08, 0.04]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.6} />
          </mesh>
        </>
      )}
    </group>
  );

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Ground */}
      <mesh position={[0, 0, -0.08]}>
        <planeGeometry args={[16, 7]} />
        <meshBasicMaterial color={colors.secondary} transparent opacity={0.04} />
      </mesh>

      {/* Track ballast for main lines */}
      {[1.2, -1.2].map((y, i) => (
        <mesh key={`bal-${i}`} position={[0, y, -0.02]}>
          <planeGeometry args={[12, 0.4]} />
          <meshBasicMaterial color={colors.secondary} transparent opacity={0.08} />
        </mesh>
      ))}

      {/* Track lines */}
      {layout.trackPts3.map((pts, i) => (
        <RailLine key={`tk-${i}`} points={pts} color={colors.primary} opacity={i < 8 ? 0.5 : 0.3} />
      ))}

      {/* Stations */}
      {layout.stations.map((sta, i) => (
        <group key={`sta-${i}`} position={[sta.pos.x, sta.pos.y, 0]}>
          <mesh>
            <boxGeometry args={[sta.width, 0.3, 0.08]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.3} />
          </mesh>
          <mesh position={[0, -0.12, 0.02]}>
            <boxGeometry args={[sta.width, 0.04, 0.06]} />
            <meshBasicMaterial color={colors.primary} transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, 0.08, 0.15]}>
            <boxGeometry args={[sta.width * 0.6, 0.15, 0.02]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.2} />
          </mesh>
        </group>
      ))}

      {/* 3-aspect colour-light signals */}
      {layout.sigs.map((sig, si) => (
        <group key={`sig-${si}`} position={[sig.pos.x, sig.pos.y, 0]}>
          {/* Post */}
          <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.025, 0.025, 0.4]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.4} />
          </mesh>
          {/* Signal head housing */}
          <mesh position={[0, 0, 0.42]}>
            <boxGeometry args={[0.06, 0.04, 0.18]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.5} />
          </mesh>
          {/* Three aspect lights: [0]=red(top), [1]=yellow(mid), [2]=green(bottom) */}
          {[0.48, 0.42, 0.36].map((z, li) => (
            <mesh
              key={li}
              ref={(el) => {
                if (!sigLightRefs.current[si]) sigLightRefs.current[si] = [];
                sigLightRefs.current[si][li] = el;
              }}
              position={[0.035, 0, z]}
            >
              <sphereGeometry args={[0.022, 12, 12]} />
              <meshBasicMaterial
                color={li === 0 ? 0xee4444 : li === 1 ? 0xddaa33 : 0x22cc66}
                transparent
                opacity={li === 2 ? 0.95 : 0.08}
              />
            </mesh>
          ))}
          {/* Glow halo around active aspect */}
          <mesh
            ref={(el) => { sigGlowRefs.current[si] = el; }}
            position={[0, 0, 0.42]}
          >
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={0x22cc66} transparent opacity={0.12} />
          </mesh>
        </group>
      ))}

      {/* Switch indicators at junction points */}
      {[new THREE.Vector2(-2, 1.2), new THREE.Vector2(1, 1.2)].map((pos, i) => (
        <group key={`sw-${i}`} position={[pos.x, pos.y, 0]}>
          <mesh position={[0, 0.22, 0.03]}>
            <boxGeometry args={[0.1, 0.05, 0.03]} />
            <meshBasicMaterial color={colors.primary} transparent opacity={0.35} />
          </mesh>
        </group>
      ))}

      {/* Overhead pylons */}
      {layout.pylons.map((p, i) => (
        <group key={`py-${i}`} position={[p.x, p.y, 0]}>
          <mesh position={[0, 0.25, 0.3]}>
            <boxGeometry args={[0.03, 0.03, 0.6]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.55]}>
            <boxGeometry args={[0.02, 0.4, 0.02]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Catenary wires */}
      {[1.2, -1.2].map((y, i) => (
        <mesh key={`cat-${i}`} position={[0, y, 0.55]}>
          <boxGeometry args={[12, 0.008, 0.008]} />
          <meshBasicMaterial color={colors.primary} transparent opacity={0.2} />
        </mesh>
      ))}

      {/* Trains */}
      {layout.trainDefs.map((tDef, ti) => (
        <group key={`tr-${ti}`}>
          {Array.from({ length: tDef.cars }).map((_, ci) => (
            <group
              key={ci}
              ref={(el) => {
                if (!carRefs.current[ti]) carRefs.current[ti] = [];
                carRefs.current[ti][ci] = el;
              }}
            >
              <TrainCar isLoco={ci === 0} len={0.7} color={colors.primary} />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

// Scene wrapper
function Scene({ type, colors, scrollProgress }: AbstractVisualProps) {
  const { camera, size } = useThree();

  // Runs before each render — camera is always correct before the frame paints
  useFrame(() => {
    const z = size.width < 640 ? 6.5 : size.width < 1024 ? 7 : 8;
    if (camera.position.z !== z) camera.position.setZ(z);
  });

  let visual: React.JSX.Element;
  switch (type) {
    case "neural":
      visual = <NeuralNetworkVisual colors={colors} scrollProgress={scrollProgress} />;
      break;
    case "grid":
      visual = <GridVisual colors={colors} scrollProgress={scrollProgress} />;
      break;
    case "flow":
      visual = <FlowVisual colors={colors} scrollProgress={scrollProgress} />;
      break;
    case "city":
      visual = <CityVisual colors={colors} scrollProgress={scrollProgress} />;
      break;
    case "chess":
      visual = <ChessVisual colors={colors} scrollProgress={scrollProgress} />;
      break;
    case "circuit":
      visual = <CircuitVisual colors={colors} scrollProgress={scrollProgress} />;
      break;
    default:
      visual = <NeuralNetworkVisual colors={colors} scrollProgress={scrollProgress} />;
  }

  return <DragRotateWrapper>{visual}</DragRotateWrapper>;
}

export function AbstractVisual({ type, colors, scrollProgress }: AbstractVisualProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [ready, setReady] = useState(false);

  const fallback = (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at center, ${colors.primary}20, ${colors.secondary}10, transparent)`,
      }}
    />
  );

  if (!mounted) {
    return fallback;
  }

  return (
    <div className="absolute inset-0">
      {/* Background gradient — always visible, sits behind the canvas */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${colors.primary}15, transparent 60%),
                       radial-gradient(ellipse at 70% 50%, ${colors.secondary}10, transparent 50%)`,
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out"
        style={{ opacity: ready ? 1 : 0 }}
      >
        <WebGLErrorBoundary fallback={fallback}>
          <Canvas
            camera={{ position: [0, 0, 8] }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            dpr={[1, 1.5]}
            className="cursor-grab active:cursor-grabbing"
            onCreated={() => {
              // GL context + scene created. Wait a few frames for
              // useEffects to fire and position all geometry, then reveal.
              let f = 0;
              const settle = () => {
                if (++f >= 30) setReady(true);
                else requestAnimationFrame(settle);
              };
              requestAnimationFrame(settle);
            }}
          >
            <Scene type={type} colors={colors} scrollProgress={scrollProgress} />
          </Canvas>
        </WebGLErrorBoundary>
      </div>
    </div>
  );
}
