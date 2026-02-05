"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface AbstractVisualProps {
  type: "neural" | "grid" | "flow" | "city" | "chess" | "circuit";
  colors: {
    primary: string;
    secondary: string;
  };
  isActive: boolean;
}

// Neural Network Visual (for AI & Innovation)
function NeuralNetworkVisual({ colors, isActive }: { colors: AbstractVisualProps["colors"]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const time = useRef(0);

  const nodeCount = 32;
  const connectionDistance = 2.5;
  const spread = { x: 6, y: 4, z: 3 };

  const { nodes, connections, basePositions } = useMemo(() => {
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
    if (!isActive) return;
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
function GridVisual({ colors, isActive }: { colors: AbstractVisualProps["colors"]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  const gridSize = 20;
  const gridDivisions = 20;

  useFrame((_, delta) => {
    if (!isActive) return;
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
function FlowVisual({ colors, isActive }: { colors: AbstractVisualProps["colors"]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);
  const pulseRefs = useRef<THREE.Mesh[]>([]);
  const time = useRef(0);

  // Generate hierarchical org network
  const { nodes, connections } = useMemo(() => {
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
          (Math.random() - 0.5) * 0.5
        );
        nodes.push({
          pos: deptPos.clone().add(offset),
          size: 0.15,
          tier: 2,
        });
        connections.push({ from: dept, to: nodes.length - 1 });

        // Some cross-team connections
        if (Math.random() > 0.7 && nodes.length > 10) {
          const randomNode = Math.floor(Math.random() * (nodes.length - 5)) + 5;
          if (randomNode !== nodes.length - 1) {
            connections.push({ from: randomNode, to: nodes.length - 1 });
          }
        }
      }
    }

    // Tier 3: Individual employees (scattered around teams)
    const tier3Count = 20;
    for (let i = 0; i < tier3Count; i++) {
      const parentIdx = Math.floor(Math.random() * (nodes.length - tier1Count - 1)) + tier1Count + 1;
      const parent = nodes[parentIdx];
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.6 + Math.random() * 0.4;
      nodes.push({
        pos: parent.pos.clone().add(new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          (Math.random() - 0.5) * 0.3
        )),
        size: 0.08,
        tier: 3,
      });
      connections.push({ from: parentIdx, to: nodes.length - 1 });
    }

    return { nodes, connections };
  }, []);

  useFrame((_, delta) => {
    if (!isActive) return;
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
function CityVisual({ colors, isActive }: { colors: AbstractVisualProps["colors"]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const buildingRefs = useRef<THREE.Mesh[]>([]);
  const time = useRef(0);

  const buildings = useMemo(() => {
    const result: { x: number; z: number; height: number; width: number; depth: number }[] = [];
    const gridSize = 6;
    const spacing = 0.8;

    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        // Skip some spots for variety
        if (Math.random() > 0.7) continue;

        // Taller buildings toward center
        const distFromCenter = Math.sqrt(x * x + z * z);
        const maxHeight = Math.max(0.5, 3 - distFromCenter * 0.3);
        const height = 0.3 + Math.random() * maxHeight;

        result.push({
          x: x * spacing + (Math.random() - 0.5) * 0.2,
          z: z * spacing + (Math.random() - 0.5) * 0.2,
          height,
          width: 0.2 + Math.random() * 0.3,
          depth: 0.2 + Math.random() * 0.3,
        });
      }
    }
    return result;
  }, []);

  useFrame((_, delta) => {
    if (!isActive) return;
    time.current += delta;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = -0.5 + Math.sin(time.current * 0.2) * 0.05;
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
            building.x + (Math.random() - 0.5) * building.width * 0.5,
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

// Chess Visual (for Game Development) - 3D chess board with pieces
function ChessVisual({ colors, isActive }: { colors: AbstractVisualProps["colors"]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pieceRefs = useRef<THREE.Mesh[]>([]);
  const time = useRef(0);

  // Chess piece positions (simplified)
  const pieces = useMemo(() => {
    const result: { x: number; z: number; height: number; isKing: boolean; isWhite: boolean }[] = [];

    // Back row white pieces
    for (let i = 0; i < 8; i++) {
      const isKing = i === 4;
      const isQueen = i === 3;
      result.push({
        x: i - 3.5,
        z: -3.5,
        height: isKing ? 0.9 : isQueen ? 0.8 : i === 0 || i === 7 ? 0.5 : i === 1 || i === 6 ? 0.55 : 0.6,
        isKing,
        isWhite: true,
      });
    }
    // White pawns
    for (let i = 0; i < 8; i++) {
      result.push({ x: i - 3.5, z: -2.5, height: 0.4, isKing: false, isWhite: true });
    }
    // Black pawns
    for (let i = 0; i < 8; i++) {
      result.push({ x: i - 3.5, z: 2.5, height: 0.4, isKing: false, isWhite: false });
    }
    // Back row black pieces
    for (let i = 0; i < 8; i++) {
      const isKing = i === 4;
      const isQueen = i === 3;
      result.push({
        x: i - 3.5,
        z: 3.5,
        height: isKing ? 0.9 : isQueen ? 0.8 : i === 0 || i === 7 ? 0.5 : i === 1 || i === 6 ? 0.55 : 0.6,
        isKing,
        isWhite: false,
      });
    }

    return result;
  }, []);

  useFrame((_, delta) => {
    if (!isActive) return;
    time.current += delta;

    if (groupRef.current) {
      groupRef.current.rotation.y = -0.4 + Math.sin(time.current * 0.15) * 0.2;
      groupRef.current.rotation.x = -0.6 + Math.sin(time.current * 0.1) * 0.05;
    }

    // Subtle piece animation
    pieceRefs.current.forEach((mesh, i) => {
      if (mesh && pieces[i]) {
        const hover = Math.sin(time.current * 2 + i * 0.3) * 0.02;
        mesh.position.y = pieces[i].height / 2 + 0.05 + hover;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]} scale={0.6}>
      {/* Chess board */}
      {[...Array(8)].map((_, row) =>
        [...Array(8)].map((_, col) => {
          const isLight = (row + col) % 2 === 0;
          return (
            <mesh
              key={`${row}-${col}`}
              position={[col - 3.5, 0, row - 3.5]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.95, 0.95]} />
              <meshBasicMaterial
                color={isLight ? colors.primary : colors.secondary}
                transparent
                opacity={isLight ? 0.3 : 0.5}
              />
            </mesh>
          );
        })
      )}

      {/* Board edge glow */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.5, 8.5]} />
        <meshBasicMaterial color={colors.secondary} transparent opacity={0.1} />
      </mesh>

      {/* Chess pieces */}
      {pieces.map((piece, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) pieceRefs.current[i] = el; }}
          position={[piece.x, piece.height / 2 + 0.05, piece.z]}
        >
          <cylinderGeometry args={[0.2, 0.25, piece.height, 8]} />
          <meshBasicMaterial
            color={piece.isWhite ? colors.primary : colors.secondary}
            transparent
            opacity={piece.isKing ? 1 : 0.8}
          />
        </mesh>
      ))}

      {/* King crowns */}
      {pieces.filter(p => p.isKing).map((piece, i) => (
        <mesh
          key={`crown-${i}`}
          position={[piece.x, piece.height + 0.15, piece.z]}
        >
          <boxGeometry args={[0.15, 0.2, 0.15]} />
          <meshBasicMaterial
            color={piece.isWhite ? colors.primary : colors.secondary}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// Helper component for track lines
function TrackLine({ points, color, opacity }: { points: THREE.Vector3[]; color: string; opacity: number }) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <primitive
      ref={lineRef}
      object={new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity })
      )}
    />
  );
}

// Circuit Visual (for Critical Infrastructure) - Railway Network with realistic trains
function CircuitVisual({ colors, isActive }: { colors: AbstractVisualProps["colors"]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const trainRefs = useRef<THREE.Group[]>([]);
  const signalRefs = useRef<THREE.Mesh[]>([]);
  const glowRefs = useRef<THREE.Mesh[]>([]);
  const time = useRef(0);

  // Smooth easing function
  const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // Enhanced track layout with stations
  const { tracks, signals, trains, stations, pylons } = useMemo(() => {
    const tracks: { points: THREE.Vector2[]; isMainLine: boolean }[] = [];

    // Main line - top
    tracks.push({
      points: [
        new THREE.Vector2(-7, 1.2),
        new THREE.Vector2(-3, 1.2),
        new THREE.Vector2(0, 1.2),
        new THREE.Vector2(3, 1.2),
        new THREE.Vector2(7, 1.2),
      ],
      isMainLine: true,
    });

    // Main line - bottom
    tracks.push({
      points: [
        new THREE.Vector2(-7, -1.2),
        new THREE.Vector2(-3, -1.2),
        new THREE.Vector2(0, -1.2),
        new THREE.Vector2(3, -1.2),
        new THREE.Vector2(7, -1.2),
      ],
      isMainLine: true,
    });

    // Crossover left
    tracks.push({
      points: [
        new THREE.Vector2(-4, 1.2),
        new THREE.Vector2(-3, -1.2),
      ],
      isMainLine: false,
    });

    // Crossover right
    tracks.push({
      points: [
        new THREE.Vector2(3, 1.2),
        new THREE.Vector2(4, -1.2),
      ],
      isMainLine: false,
    });

    // Siding/platform track
    tracks.push({
      points: [
        new THREE.Vector2(-2, 1.2),
        new THREE.Vector2(-1, 2.2),
        new THREE.Vector2(1, 2.2),
        new THREE.Vector2(2, 1.2),
      ],
      isMainLine: false,
    });

    // Signals
    const signals = [
      { pos: new THREE.Vector2(-5, 0.85) },
      { pos: new THREE.Vector2(-1.5, 0.85) },
      { pos: new THREE.Vector2(2, 0.85) },
      { pos: new THREE.Vector2(5, 0.85) },
      { pos: new THREE.Vector2(-5, -1.55) },
      { pos: new THREE.Vector2(-1.5, -1.55) },
      { pos: new THREE.Vector2(2, -1.55) },
      { pos: new THREE.Vector2(5, -1.55) },
    ];

    // Stations/platforms
    const stations = [
      { pos: new THREE.Vector2(0, 2.6), width: 2.5 },
      { pos: new THREE.Vector2(-5.5, 0), width: 1.5 },
      { pos: new THREE.Vector2(5.5, 0), width: 1.5 },
    ];

    // Overhead line pylons
    const pylons: THREE.Vector2[] = [];
    for (let x = -6; x <= 6; x += 2) {
      pylons.push(new THREE.Vector2(x, 1.2));
      pylons.push(new THREE.Vector2(x, -1.2));
    }

    // Trains with multiple cars
    const trains = [
      { trackIndex: 0, speed: 0.04, offset: 0, cars: 3 },
      { trackIndex: 1, speed: 0.035, offset: 0.5, cars: 2 },
      { trackIndex: 0, speed: 0.03, offset: 0.65, cars: 2 },
    ];

    return { tracks, signals, trains, stations, pylons };
  }, []);

  // Signal color states
  const signalColors = useRef(signals.map(() => new THREE.Color(0x22cc66)));
  const targetColors = useRef(signals.map(() => new THREE.Color(0x22cc66)));

  useFrame((_, delta) => {
    if (!isActive) return;
    time.current += delta;

    // Subtle perspective rotation
    if (groupRef.current) {
      groupRef.current.rotation.x = -0.5 + Math.sin(time.current * 0.06) * 0.02;
      groupRef.current.rotation.y = Math.sin(time.current * 0.04) * 0.04;
    }

    // Update trains
    trainRefs.current.forEach((group, i) => {
      if (group && trains[i]) {
        const train = trains[i];
        const track = tracks[train.trackIndex];
        if (track) {
          const rawProgress = (time.current * train.speed + train.offset) % 1;
          const smoothProgress = ease(rawProgress);

          const totalSegments = track.points.length - 1;
          const segmentProgress = smoothProgress * totalSegments;
          const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
          const t = segmentProgress - segmentIndex;

          const p1 = track.points[segmentIndex];
          const p2 = track.points[segmentIndex + 1];

          const x = p1.x + (p2.x - p1.x) * t;
          const y = p1.y + (p2.y - p1.y) * t;
          group.position.set(x, y, 0.08);

          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          group.rotation.z = angle;

          // Update signals
          signals.forEach((signal, si) => {
            const dist = Math.sqrt(Math.pow(signal.pos.x - x, 2) + Math.pow(signal.pos.y - y, 2));
            if (dist < 1.2) {
              targetColors.current[si].setHex(0xee4444);
            } else if (dist < 2.5) {
              targetColors.current[si].setHex(0xddaa33);
            } else {
              targetColors.current[si].setHex(0x22cc66);
            }
          });
        }
      }
    });

    // Smooth signal color interpolation
    signalRefs.current.forEach((mesh, i) => {
      if (mesh) {
        signalColors.current[i].lerp(targetColors.current[i], delta * 3);
        (mesh.material as THREE.MeshBasicMaterial).color.copy(signalColors.current[i]);
      }
    });

    // Signal glow pulse
    glowRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const pulse = 0.85 + Math.sin(time.current * 2 + i * 0.4) * 0.15;
        mesh.scale.setScalar(pulse);
      }
    });
  });

  // Track curves
  const trackCurves = useMemo(() => {
    return tracks.map(track => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < track.points.length - 1; i++) {
        const p1 = track.points[i];
        const p2 = track.points[i + 1];
        const segments = 24;
        for (let j = 0; j <= segments; j++) {
          const t = j / segments;
          points.push(new THREE.Vector3(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t, 0));
        }
      }
      return points;
    });
  }, [tracks]);

  // Train car component
  const TrainCar = ({ isLocomotive, length, color }: { isLocomotive: boolean; length: number; color: string }) => (
    <group>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[length, 0.22, 0.28]} />
        <meshBasicMaterial color={color} transparent opacity={0.92} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 0, 0.17]}>
        <boxGeometry args={[length * 0.92, 0.18, 0.06]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} />
      </mesh>

      {/* Windows */}
      {[-0.3, -0.15, 0, 0.15, 0.3].map((xPos, wi) => (
        <mesh key={wi} position={[length * xPos, 0.112, 0.06]}>
          <boxGeometry args={[length * 0.12, 0.005, 0.12]} />
          <meshBasicMaterial color="#aaddff" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Locomotive front */}
      {isLocomotive && (
        <>
          <mesh position={[length * 0.52, 0, 0]}>
            <boxGeometry args={[0.08, 0.2, 0.26]} />
            <meshBasicMaterial color={color} transparent opacity={0.95} />
          </mesh>
          {/* Headlights */}
          <mesh position={[length * 0.56, 0.06, 0.08]}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
          <mesh position={[length * 0.56, -0.06, 0.08]}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
          {/* Pantograph base */}
          <mesh position={[0, 0, 0.22]}>
            <boxGeometry args={[0.15, 0.08, 0.04]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {/* Bogies (wheel trucks) - proper train style */}
      {[-0.35, 0.35].map((xOffset, bi) => (
        <group key={bi} position={[length * xOffset, 0, -0.16]}>
          {/* Bogie frame */}
          <mesh>
            <boxGeometry args={[0.25, 0.18, 0.04]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.7} />
          </mesh>
          {/* Wheel sets - pairs of wheels on axles */}
          {[-0.08, 0.08].map((wheelX, wi) => (
            <group key={wi} position={[wheelX, 0, -0.02]}>
              {/* Left wheel */}
              <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.055, 0.055, 0.02, 16]} />
                <meshBasicMaterial color={colors.secondary} transparent opacity={0.85} />
              </mesh>
              {/* Right wheel */}
              <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.055, 0.055, 0.02, 16]} />
                <meshBasicMaterial color={colors.secondary} transparent opacity={0.85} />
              </mesh>
              {/* Axle */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
                <meshBasicMaterial color={colors.secondary} transparent opacity={0.6} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Ground */}
      <mesh position={[0, 0, -0.08]} rotation={[0, 0, 0]}>
        <planeGeometry args={[16, 7]} />
        <meshBasicMaterial color={colors.secondary} transparent opacity={0.04} />
      </mesh>

      {/* Track ballast/bed */}
      {tracks.slice(0, 2).map((track, i) => (
        <mesh key={`ballast-${i}`} position={[0, track.points[0].y, -0.02]}>
          <planeGeometry args={[14, 0.4]} />
          <meshBasicMaterial color={colors.secondary} transparent opacity={0.08} />
        </mesh>
      ))}

      {/* Track lines */}
      {trackCurves.map((points, i) => (
        <TrackLine
          key={`track-${i}`}
          points={points}
          color={colors.primary}
          opacity={tracks[i].isMainLine ? 0.5 : 0.25}
        />
      ))}

      {/* Stations/Platforms */}
      {stations.map((station, i) => (
        <group key={`station-${i}`} position={[station.pos.x, station.pos.y, 0]}>
          {/* Platform */}
          <mesh>
            <boxGeometry args={[station.width, 0.3, 0.08]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.3} />
          </mesh>
          {/* Platform edge */}
          <mesh position={[0, -0.12, 0.02]}>
            <boxGeometry args={[station.width, 0.04, 0.06]} />
            <meshBasicMaterial color={colors.primary} transparent opacity={0.4} />
          </mesh>
          {/* Shelter */}
          <mesh position={[0, 0.08, 0.15]}>
            <boxGeometry args={[station.width * 0.6, 0.15, 0.02]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.2} />
          </mesh>
        </group>
      ))}

      {/* Overhead line pylons */}
      {pylons.map((pylon, i) => (
        <group key={`pylon-${i}`} position={[pylon.x, pylon.y, 0]}>
          {/* Pylon */}
          <mesh position={[0, 0.25, 0.3]}>
            <boxGeometry args={[0.03, 0.03, 0.6]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.35} />
          </mesh>
          {/* Arm */}
          <mesh position={[0, 0, 0.55]}>
            <boxGeometry args={[0.02, 0.4, 0.02]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Overhead catenary wires */}
      {tracks.slice(0, 2).map((track, i) => (
        <mesh key={`wire-${i}`} position={[0, track.points[0].y, 0.55]}>
          <boxGeometry args={[14, 0.008, 0.008]} />
          <meshBasicMaterial color={colors.primary} transparent opacity={0.2} />
        </mesh>
      ))}

      {/* Signal posts with lights */}
      {signals.map((signal, i) => (
        <group key={`signal-group-${i}`} position={[signal.pos.x, signal.pos.y, 0]}>
          {/* Post */}
          <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.025, 0.025, 0.4]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.4} />
          </mesh>
          {/* Signal head */}
          <mesh position={[0, 0, 0.42]}>
            <boxGeometry args={[0.06, 0.04, 0.12]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.5} />
          </mesh>
          {/* Glow */}
          <mesh
            ref={(el) => { if (el) glowRefs.current[i] = el; }}
            position={[0, 0, 0.42]}
          >
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={colors.primary} transparent opacity={0.15} />
          </mesh>
          {/* Light */}
          <mesh
            ref={(el) => { if (el) signalRefs.current[i] = el; }}
            position={[0.035, 0, 0.42]}
          >
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color={0x22cc66} transparent opacity={0.95} />
          </mesh>
        </group>
      ))}

      {/* Trains */}
      {trains.map((train, i) => {
        const track = tracks[train.trackIndex];
        const carLength = 0.7;
        const gap = 0.08;
        return (
          <group
            key={`train-${i}`}
            ref={(el) => { if (el) trainRefs.current[i] = el; }}
            position={[track.points[0].x, track.points[0].y, 0.08]}
          >
            {/* Multiple cars */}
            {Array.from({ length: train.cars }).map((_, ci) => (
              <group key={ci} position={[-(ci * (carLength + gap)), 0, 0]}>
                <TrainCar
                  isLocomotive={ci === 0}
                  length={carLength}
                  color={colors.primary}
                />
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

// Scene wrapper
function Scene({ type, colors, isActive }: AbstractVisualProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 8);
  }, [camera]);

  switch (type) {
    case "neural":
      return <NeuralNetworkVisual colors={colors} isActive={isActive} />;
    case "grid":
      return <GridVisual colors={colors} isActive={isActive} />;
    case "flow":
      return <FlowVisual colors={colors} isActive={isActive} />;
    case "city":
      return <CityVisual colors={colors} isActive={isActive} />;
    case "chess":
      return <ChessVisual colors={colors} isActive={isActive} />;
    case "circuit":
      return <CircuitVisual colors={colors} isActive={isActive} />;
    default:
      return <NeuralNetworkVisual colors={colors} isActive={isActive} />;
  }
}

export function AbstractVisual({ type, colors, isActive }: AbstractVisualProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.primary}20, ${colors.secondary}10, transparent)`,
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${colors.primary}15, transparent 60%),
                       radial-gradient(ellipse at 70% 50%, ${colors.secondary}10, transparent 50%)`,
        }}
      />
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
      >
        <Scene type={type} colors={colors} isActive={isActive} />
      </Canvas>
    </div>
  );
}
