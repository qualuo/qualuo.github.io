"use client";

import { useRef, useState, useCallback, Suspense, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Float,
} from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

// Types
type PrimitiveType = "box" | "sphere" | "torus" | "cone" | "cylinder" | "octahedron";
type SpecialType = "neural-network" | "morphing-blob";
type ObjectType = PrimitiveType | SpecialType;

interface SceneObject {
  id: string;
  type: ObjectType;
  position: [number, number, number];
  color: string;
  metalness: number;
  roughness: number;
  scale: number;
}

interface SceneConfig {
  environment: "studio" | "sunset" | "dawn" | "night" | "forest" | "city";
  showShadows: boolean;
  showGrid: boolean;
  autoRotate: boolean;
}

// Simple 3D noise function for morphing blob
function noise3D(x: number, y: number, z: number): number {
  const p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  const perm = [...p, ...p];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number, z: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
  const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
  return lerp(w, lerp(v, lerp(u, grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z)), lerp(u, grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z))), lerp(v, lerp(u, grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1)), lerp(u, grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1))));
}

// Neural Network component
function NeuralNetworkMesh({
  position,
  scale,
  color,
  isSelected,
  onClick,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  // Generate nodes using golden ratio
  const { nodes, connections } = useMemo(() => {
    const nodeCount = 16;
    const connectionDist = 1.8;
    const nodes: THREE.Vector3[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      nodes.push(new THREE.Vector3(
        Math.cos(theta) * radius * 1.2,
        y * 1.0,
        Math.sin(theta) * radius * 1.2
      ));
    }

    const connections: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < connectionDist) {
          connections.push([i, j]);
        }
      }
    }
    return { nodes, connections };
  }, []);

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

  useFrame((_, delta) => {
    time.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
      if (isSelected) {
        groupRef.current.rotation.y += delta * 0.3;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Nodes */}
      {nodes.map((node, i) => (
        <mesh key={i} position={[node.x, node.y, node.z]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Connections */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.4} />
      </lineSegments>
      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

// Morphing Blob component — optimized
function MorphingBlobMesh({
  position,
  scale,
  color,
  isSelected,
  onClick,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const time = useRef(0);
  const frameCount = useRef(0);

  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry;
      originalPositions.current = new Float32Array(geometry.attributes.position.array);
    }
  }, []);

  useFrame((_, delta) => {
    time.current += delta;
    frameCount.current += 1;

    if (meshRef.current && originalPositions.current) {
      // Rotation every frame (cheap)
      meshRef.current.rotation.y += delta * 0.1;
      if (isSelected) meshRef.current.rotation.y += delta * 0.2;

      // Vertex update every 4th frame only
      if (frameCount.current % 4 === 0) {
        const geometry = meshRef.current.geometry;
        const positions = geometry.attributes.position.array as Float32Array;
        const original = originalPositions.current;

        for (let i = 0; i < positions.length; i += 3) {
          const ox = original[i], oy = original[i + 1], oz = original[i + 2];
          const length = Math.sqrt(ox * ox + oy * oy + oz * oz);
          const nx = ox / length, ny = oy / length, nz = oz / length;
          const noiseVal = noise3D(
            nx * 0.8 + time.current * 0.12,
            ny * 0.8 + time.current * 0.1,
            nz * 0.8 + time.current * 0.08
          );
          const displacement = 0.6 + noiseVal * 0.12;
          positions[i] = nx * displacement;
          positions[i + 1] = ny * displacement;
          positions[i + 2] = nz * displacement;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
      }
    }
  });

  return (
    <group position={position} scale={scale} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh ref={meshRef} castShadow>
        <icosahedronGeometry args={[0.6, 8]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} envMapIntensity={1.5} />
      </mesh>
      {isSelected && (
        <mesh scale={1.2}>
          <sphereGeometry args={[0.7, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

// Primitive component
function Primitive({
  object,
  isSelected,
  onClick,
}: {
  object: SceneObject;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current && isSelected) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const geometry = () => {
    switch (object.type) {
      case "box":
        return <boxGeometry args={[1, 1, 1]} />;
      case "sphere":
        return <sphereGeometry args={[0.6, 32, 32]} />;
      case "torus":
        return <torusGeometry args={[0.5, 0.2, 16, 32]} />;
      case "cone":
        return <coneGeometry args={[0.5, 1, 32]} />;
      case "cylinder":
        return <cylinderGeometry args={[0.4, 0.4, 1, 32]} />;
      case "octahedron":
        return <octahedronGeometry args={[0.6]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <Float
      speed={isSelected ? 2 : 1}
      rotationIntensity={isSelected ? 0.5 : 0.1}
      floatIntensity={isSelected ? 0.5 : 0.2}
    >
      <mesh
        ref={meshRef}
        position={object.position}
        scale={object.scale}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        castShadow
        receiveShadow
      >
        {geometry()}
        <meshStandardMaterial
          color={object.color}
          metalness={object.metalness}
          roughness={object.roughness}
          envMapIntensity={1}
        />
        {isSelected && (
          <mesh scale={1.1}>
            {geometry()}
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </mesh>
        )}
      </mesh>
    </Float>
  );
}

// Check if type is special
const isSpecialType = (type: ObjectType): type is SpecialType => {
  return type === "neural-network" || type === "morphing-blob";
};

// Scene component
function Scene({
  objects,
  selectedId,
  onSelect,
  config,
}: {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  config: SceneConfig;
}) {
  return (
    <>
      {/* Environment lighting */}
      <Environment preset={config.environment} />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={1024}
      />

      {/* Objects */}
      {objects.map((obj) => {
        if (obj.type === "neural-network") {
          return (
            <Float key={obj.id} speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
              <NeuralNetworkMesh
                position={obj.position}
                scale={obj.scale}
                color={obj.color}
                isSelected={selectedId === obj.id}
                onClick={() => onSelect(obj.id)}
              />
            </Float>
          );
        }
        if (obj.type === "morphing-blob") {
          return (
            <Float key={obj.id} speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
              <MorphingBlobMesh
                position={obj.position}
                scale={obj.scale}
                color={obj.color}
                isSelected={selectedId === obj.id}
                onClick={() => onSelect(obj.id)}
              />
            </Float>
          );
        }
        return (
          <Primitive
            key={obj.id}
            object={obj}
            isSelected={selectedId === obj.id}
            onClick={() => onSelect(obj.id)}
          />
        );
      })}

      {/* Ground plane for clicking to deselect */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.5, 0]}
        onClick={() => onSelect(null)}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* Contact shadows */}
      {config.showShadows && (
        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
        />
      )}

      {/* Grid */}
      {config.showGrid && (
        <gridHelper args={[10, 10, "#333333", "#222222"]} position={[0, -1.5, 0]} />
      )}

      {/* Orbit controls */}
      <OrbitControls
        makeDefault
        autoRotate={config.autoRotate}
        autoRotateSpeed={0.5}
        enablePan={true}
        enableZoom={true}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 + 0.3}
        minDistance={3}
        maxDistance={15}
      />
    </>
  );
}

// Color presets
const COLOR_PRESETS = [
  "#ffffff",
  "#1a1a1a",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

// Environment presets
const ENVIRONMENT_PRESETS: SceneConfig["environment"][] = [
  "studio",
  "sunset",
  "dawn",
  "night",
  "forest",
  "city",
];

// Primitive icons
const PRIMITIVE_ICONS: Record<PrimitiveType, string> = {
  box: "▢",
  sphere: "●",
  torus: "◎",
  cone: "△",
  cylinder: "▭",
  octahedron: "◇",
};

// Special shape icons
const SPECIAL_ICONS: Record<SpecialType, string> = {
  "neural-network": "⬡",
  "morphing-blob": "◉",
};

const SPECIAL_LABELS: Record<SpecialType, string> = {
  "neural-network": "Neural Net",
  "morphing-blob": "Blob",
};

// Default objects
const DEFAULT_OBJECTS: SceneObject[] = [
  {
    id: "1",
    type: "sphere",
    position: [0, 0, 0],
    color: "#3b82f6",
    metalness: 0.8,
    roughness: 0.2,
    scale: 1,
  },
  {
    id: "2",
    type: "box",
    position: [-2, 0, -1],
    color: "#10b981",
    metalness: 0.3,
    roughness: 0.7,
    scale: 0.8,
  },
  {
    id: "3",
    type: "torus",
    position: [2, 0.5, -0.5],
    color: "#f59e0b",
    metalness: 0.9,
    roughness: 0.1,
    scale: 1,
  },
];

export function ThreeDSandbox() {
  const [objects, setObjects] = useState<SceneObject[]>(DEFAULT_OBJECTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [config, setConfig] = useState<SceneConfig>({
    environment: "studio",
    showShadows: true,
    showGrid: true,
    autoRotate: false,
  });

  const selectedObject = objects.find((o) => o.id === selectedId);

  const addObject = useCallback((type: ObjectType) => {
    const isSpecial = isSpecialType(type);
    const newObject: SceneObject = {
      id: Date.now().toString(),
      type,
      position: [
        (Math.random() - 0.5) * 4,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 4,
      ],
      color: isSpecial ? "#3b82f6" : COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      metalness: isSpecial ? 0.8 : 0.5,
      roughness: isSpecial ? 0.2 : 0.5,
      scale: isSpecial ? 1.2 : 0.7 + Math.random() * 0.6,
    };
    setObjects(prev => [...prev, newObject]);
    setSelectedId(newObject.id);
  }, []);

  const updateObject = (id: string, updates: Partial<SceneObject>) => {
    setObjects(
      objects.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  };

  const deleteSelected = () => {
    if (selectedId) {
      setObjects(objects.filter((o) => o.id !== selectedId));
      setSelectedId(null);
    }
  };

  const clearAll = () => {
    setObjects([]);
    setSelectedId(null);
  };

  const resetScene = () => {
    setObjects(DEFAULT_OBJECTS);
    setSelectedId(null);
  };

  return (
    <div className="relative w-full flex flex-col">
      {/* 3D Canvas */}
      <div
        className="relative bg-linear-to-b from-slate-900 to-black rounded-2xl overflow-hidden"
        style={{ height: "55vh", minHeight: "400px" }}
      >
        <Canvas
          shadows
          camera={{ position: [5, 3, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <Scene
              objects={objects}
              selectedId={selectedId}
              onSelect={setSelectedId}
              config={config}
            />
          </Suspense>
        </Canvas>

        {/* Object count */}
        <div className="absolute top-4 left-4 text-xs text-white/50 font-mono">
          {objects.length} objects
        </div>

        {/* Quick tips */}
        <div className="absolute bottom-4 left-4 text-xs text-white/30">
          Drag to orbit · Scroll to zoom · Click to select
        </div>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 space-y-4"
      >
        {/* Add shapes */}
        <div className="p-4 bg-white/3 border border-white/10 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primitives */}
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wide mb-3">
                Primitives
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PRIMITIVE_ICONS) as PrimitiveType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => addObject(type)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    <span className="text-base">{PRIMITIVE_ICONS[type]}</span>
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Special Shapes */}
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wide mb-3">
                Special Shapes
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SPECIAL_ICONS) as SpecialType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => addObject(type)}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-linear-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white hover:from-blue-500/30 hover:to-purple-500/30 transition-colors"
                  >
                    <span className="text-lg">{SPECIAL_ICONS[type]}</span>
                    <span>{SPECIAL_LABELS[type]}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Animated procedural shapes
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Selected object controls */}
          <div className="p-4 bg-white/3 border border-white/10 rounded-xl">
            <label className="block text-xs text-slate-500 uppercase tracking-wide mb-3">
              Selected Object
            </label>
            {selectedObject ? (
              <div className="space-y-4">
                {/* Color */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Color</label>
                  <div className="flex gap-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateObject(selectedId!, { color })}
                        className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                          selectedObject.color === color
                            ? "ring-2 ring-white ring-offset-2 ring-offset-black"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Metalness */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Metalness: {selectedObject.metalness.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedObject.metalness}
                    onChange={(e) =>
                      updateObject(selectedId!, {
                        metalness: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-white"
                  />
                </div>

                {/* Roughness */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Roughness: {selectedObject.roughness.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedObject.roughness}
                    onChange={(e) =>
                      updateObject(selectedId!, {
                        roughness: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-white"
                  />
                </div>

                {/* Scale */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Scale: {selectedObject.scale.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="2"
                    step="0.1"
                    value={selectedObject.scale}
                    onChange={(e) =>
                      updateObject(selectedId!, {
                        scale: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-white"
                  />
                </div>

                {/* Delete */}
                <button
                  onClick={deleteSelected}
                  className="w-full px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Delete Object
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Click an object to select it
              </p>
            )}
          </div>

          {/* Scene controls */}
          <div className="p-4 bg-white/3 border border-white/10 rounded-xl">
            <label className="block text-xs text-slate-500 uppercase tracking-wide mb-3">
              Scene Settings
            </label>
            <div className="space-y-4">
              {/* Environment */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  Environment
                </label>
                <div className="flex flex-wrap gap-2">
                  {ENVIRONMENT_PRESETS.map((env) => (
                    <button
                      key={env}
                      onClick={() => setConfig({ ...config, environment: env })}
                      className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${
                        config.environment === env
                          ? "bg-white text-black"
                          : "bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showShadows}
                    onChange={(e) =>
                      setConfig({ ...config, showShadows: e.target.checked })
                    }
                    className="accent-white"
                  />
                  <span className="text-xs text-slate-400">Shadows</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showGrid}
                    onChange={(e) =>
                      setConfig({ ...config, showGrid: e.target.checked })
                    }
                    className="accent-white"
                  />
                  <span className="text-xs text-slate-400">Grid</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoRotate}
                    onChange={(e) =>
                      setConfig({ ...config, autoRotate: e.target.checked })
                    }
                    className="accent-white"
                  />
                  <span className="text-xs text-slate-400">Auto-rotate</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetScene}
                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                >
                  Reset Scene
                </button>
                <button
                  onClick={clearAll}
                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
