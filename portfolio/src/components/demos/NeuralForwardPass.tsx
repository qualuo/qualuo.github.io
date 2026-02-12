"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

/* ── Types ─────────────────────────────────────────────────── */

type ActivationFn = "relu" | "sigmoid" | "tanh";
type DemoMode = "explore" | "train" | "architect";

interface Layer {
  weights: Float32Array;
  biases: Float32Array;
  fanIn: number;
  fanOut: number;
}

interface TrainingState {
  epoch: number;
  loss: number;
  accuracy: number;
  lossHistory: number[];
  accuracyHistory: number[];
  isTraining: boolean;
}

/* ── Constants ─────────────────────────────────────────────── */

const DIGIT_LABELS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const PARTICLE_COUNT = 60;
const PHASE_DURATION = 400;
const MAX_CONNECTIONS = 500;

/* ── Seeded PRNG ───────────────────────────────────────────── */

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianRandom(rng: () => number) {
  return (
    Math.sqrt(-2 * Math.log(rng() || 1e-10)) *
    Math.cos(2 * Math.PI * rng())
  );
}

/* ── Activation functions + derivatives ────────────────────── */

const ACTIVATIONS: Record<
  ActivationFn,
  { fn: (x: number) => number; derivative: (x: number, output: number) => number }
> = {
  relu: {
    fn: (x) => Math.max(0, x),
    derivative: (_x, out) => (out > 0 ? 1 : 0),
  },
  sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
    derivative: (_x, out) => out * (1 - out),
  },
  tanh: {
    fn: (x) => Math.tanh(x),
    derivative: (_x, out) => 1 - out * out,
  },
};

function softmax(arr: Float32Array): Float32Array {
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] > max) max = arr[i];
  const out = new Float32Array(arr.length);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    out[i] = Math.exp(arr[i] - max);
    sum += out[i];
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

/* ── Network creation ──────────────────────────────────────── */

function createNetwork(seed: number, arch: number[]): Layer[] {
  const rng = mulberry32(seed);
  const layers: Layer[] = [];
  for (let l = 0; l < arch.length - 1; l++) {
    const fanIn = arch[l];
    const fanOut = arch[l + 1];
    const std = Math.sqrt(2 / (fanIn + fanOut));
    const weights = new Float32Array(fanIn * fanOut);
    const biases = new Float32Array(fanOut);
    for (let i = 0; i < weights.length; i++) {
      weights[i] = gaussianRandom(rng) * std;
    }
    layers.push({ weights, biases, fanIn, fanOut });
  }
  return layers;
}

/* ── Forward pass (returns activations + pre-activations) ──── */

function forwardPassFull(
  input: Float32Array,
  net: Layer[],
  activation: ActivationFn
): { activations: Float32Array[]; preActivations: Float32Array[] } {
  const acts: Float32Array[] = [input];
  const preActs: Float32Array[] = [input];
  let cur = input;
  const actFn = ACTIVATIONS[activation].fn;

  for (let l = 0; l < net.length; l++) {
    const { weights, biases, fanIn, fanOut } = net[l];
    const z = new Float32Array(fanOut);
    const a = new Float32Array(fanOut);
    for (let j = 0; j < fanOut; j++) {
      let s = biases[j];
      for (let i = 0; i < fanIn; i++) s += cur[i] * weights[i * fanOut + j];
      z[j] = s;
      a[j] = l < net.length - 1 ? actFn(s) : s;
    }
    preActs.push(z);
    acts.push(l === net.length - 1 ? softmax(a) : a);
    cur = acts[acts.length - 1];
  }
  return { activations: acts, preActivations: preActs };
}

/* ── Backpropagation ───────────────────────────────────────── */

function backprop(
  net: Layer[],
  acts: Float32Array[],
  preActs: Float32Array[],
  target: number,
  activation: ActivationFn,
  lr: number
): number {
  const L = net.length;
  const output = acts[L];
  const loss = -Math.log(Math.max(1e-10, output[target]));
  const derivFn = ACTIVATIONS[activation].derivative;

  // Output delta: softmax + cross-entropy simplification
  let delta = new Float32Array(output.length);
  for (let i = 0; i < output.length; i++) {
    delta[i] = output[i] - (i === target ? 1 : 0);
  }

  for (let l = L - 1; l >= 0; l--) {
    const layer = net[l];
    const prevActs = acts[l];

    // Update weights and biases
    for (let j = 0; j < layer.fanOut; j++) {
      for (let i = 0; i < layer.fanIn; i++) {
        layer.weights[i * layer.fanOut + j] -= lr * prevActs[i] * delta[j];
      }
      layer.biases[j] -= lr * delta[j];
    }

    // Propagate delta backward
    if (l > 0) {
      const prevDelta = new Float32Array(layer.fanIn);
      for (let i = 0; i < layer.fanIn; i++) {
        let sum = 0;
        for (let j = 0; j < layer.fanOut; j++) {
          sum += layer.weights[i * layer.fanOut + j] * delta[j];
        }
        prevDelta[i] = sum * derivFn(preActs[l][i], acts[l][i]);
      }
      delta = prevDelta;
    }
  }

  return loss;
}

function argmax(arr: Float32Array): number {
  let best = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[best]) best = i;
  }
  return best;
}

/* ── Normalize activations for visualization ───────────────── */

function normalize(a: Float32Array): Float32Array {
  let max = 0;
  for (let i = 0; i < a.length; i++) if (a[i] > max) max = a[i];
  if (max === 0) return a;
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] / max;
  return out;
}

/* ── Training data generation ──────────────────────────────── */

const DIGIT_7x7 = [
  ".#####.\n#.....#\n#...#.#\n#..#..#\n#.#...#\n#.....#\n.#####.", // 0
  "...#...\n..##...\n.#.#...\n...#...\n...#...\n...#...\n.#####.", // 1
  ".#####.\n#.....#\n......#\n.#####.\n#......\n#......\n#######", // 2
  ".#####.\n#.....#\n......#\n..####.\n......#\n#.....#\n.#####.", // 3
  "#.....#\n#.....#\n#.....#\n.######\n......#\n......#\n......#", // 4
  "#######\n#......\n#......\n.#####.\n......#\n#.....#\n.#####.", // 5
  ".#####.\n#......\n#......\n######.\n#.....#\n#.....#\n.#####.", // 6
  "#######\n......#\n.....#.\n....#..\n...#...\n...#...\n...#...", // 7
  ".#####.\n#.....#\n#.....#\n.#####.\n#.....#\n#.....#\n.#####.", // 8
  ".#####.\n#.....#\n#.....#\n.######\n......#\n......#\n.#####.", // 9
];

function parseDigit(template: string): Float32Array {
  const rows = template.split("\n");
  const pixels = new Float32Array(784);
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const val = rows[y]?.[x] === "#" ? 1.0 : 0.0;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          pixels[(y * 4 + dy) * 28 + (x * 4 + dx)] = val;
        }
      }
    }
  }
  return pixels;
}

function generateTrainingData(
  seed: number
): { pixels: Float32Array; label: number }[] {
  const rng = mulberry32(seed);
  const data: { pixels: Float32Array; label: number }[] = [];

  for (let digit = 0; digit < 10; digit++) {
    const baseRows = DIGIT_7x7[digit].split("\n");

    for (let v = 0; v < 50; v++) {
      const pixels = new Float32Array(784);
      const dx = Math.floor(rng() * 3) - 1;
      const dy = Math.floor(rng() * 3) - 1;
      const noiseProb = rng() * 0.15;

      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const srcY = y - dy;
          const srcX = x - dx;
          let val = 0;
          if (srcY >= 0 && srcY < 7 && srcX >= 0 && srcX < 7) {
            val = baseRows[srcY]?.[srcX] === "#" ? 1.0 : 0.0;
          }
          if (rng() < noiseProb) val = val > 0.5 ? 0.0 : 1.0;
          for (let py = 0; py < 4; py++) {
            for (let px = 0; px < 4; px++) {
              pixels[(y * 4 + py) * 28 + (x * 4 + px)] = val;
            }
          }
        }
      }
      data.push({ pixels, label: digit });
    }
  }

  // Fisher-Yates shuffle
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  return data;
}

/* ── Layer position helpers ────────────────────────────────── */

function getLayerLayout(layerIdx: number, arch: number[]): Float32Array {
  const size = arch[layerIdx];
  const z = layerIdx * 5;
  let cols: number, rows: number, spacing: number;

  if (layerIdx === 0) {
    cols = 28;
    rows = 28;
    spacing = 0.12;
  } else if (layerIdx === arch.length - 1) {
    cols = size;
    rows = 1;
    spacing = 0.4;
  } else {
    cols = Math.ceil(Math.sqrt(size));
    rows = Math.ceil(size / cols);
    spacing = Math.max(0.15, 0.35 - size * 0.001);
  }

  const positions = new Float32Array(size * 3);
  const cx = ((cols - 1) * spacing) / 2;
  const cy = ((rows - 1) * spacing) / 2;

  for (let i = 0; i < size; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions[i * 3] = col * spacing - cx;
    positions[i * 3 + 1] = -(row * spacing - cy);
    positions[i * 3 + 2] = z;
  }
  return positions;
}

/* ── 3D: Neuron layer (InstancedMesh) ──────────────────────── */

function NeuronLayer({
  layerIdx,
  arch,
  activations,
  phase,
}: {
  layerIdx: number;
  arch: number[];
  activations: Float32Array | null;
  phase: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = arch[layerIdx];
  const positions = useMemo(
    () => getLayerLayout(layerIdx, arch),
    [layerIdx, arch]
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const layerPhase = layerIdx * 2;
  const isInput = layerIdx === 0;
  const isOutput = layerIdx === arch.length - 1;
  const scale = isInput ? 0.05 : isOutput ? 0.14 : 0.08;

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, positions, scale, dummy]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      if (activations && phase >= layerPhase) {
        const a = activations[i];
        // Dark blue → cyan → white gradient
        const r = a * a;
        const g = 0.8 * a + 0.2 * a * a;
        const b = Math.min(1, 0.9 * a + 0.1);
        color.setRGB(r, g, a > 0.01 ? b : 0.06);
      } else {
        color.setRGB(0.02, 0.03, 0.06);
      }
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {isInput ? (
        <boxGeometry args={[1, 1, 0.3]} />
      ) : (
        <icosahedronGeometry args={[1, isOutput ? 2 : 1]} />
      )}
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* ── 3D: Connection lines (weight visualization) ───────────── */

function ConnectionLines({
  fromIdx,
  toIdx,
  arch,
  weights,
}: {
  fromIdx: number;
  toIdx: number;
  arch: number[];
  weights: Float32Array;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);

  const connectionIndices = useMemo(() => {
    const rng = mulberry32(fromIdx * 7919 + toIdx * 6271);
    const totalPossible = arch[fromIdx] * arch[toIdx];
    const count = Math.min(MAX_CONNECTIONS, totalPossible);
    if (totalPossible <= MAX_CONNECTIONS) {
      return Array.from({ length: totalPossible }, (_, i) => i);
    }
    const indices = new Set<number>();
    while (indices.size < count) {
      indices.add(Math.floor(rng() * totalPossible));
    }
    return [...indices];
  }, [fromIdx, toIdx, arch]);

  const geometry = useMemo(() => {
    const fromPos = getLayerLayout(fromIdx, arch);
    const toPos = getLayerLayout(toIdx, arch);
    const posArr = new Float32Array(connectionIndices.length * 6);
    const colArr = new Float32Array(connectionIndices.length * 6);

    for (let c = 0; c < connectionIndices.length; c++) {
      const idx = connectionIndices[c];
      const i = Math.floor(idx / arch[toIdx]);
      const j = idx % arch[toIdx];
      posArr[c * 6] = fromPos[i * 3];
      posArr[c * 6 + 1] = fromPos[i * 3 + 1];
      posArr[c * 6 + 2] = fromPos[i * 3 + 2];
      posArr[c * 6 + 3] = toPos[j * 3];
      posArr[c * 6 + 4] = toPos[j * 3 + 1];
      posArr[c * 6 + 5] = toPos[j * 3 + 2];
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(posArr, 3)
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colArr, 3));
    return geo;
  }, [fromIdx, toIdx, arch, connectionIndices]);

  useFrame(() => {
    if (!lineRef.current || !weights) return;
    const colorAttr = lineRef.current.geometry.getAttribute("color");
    const arr = colorAttr.array as Float32Array;

    for (let c = 0; c < connectionIndices.length; c++) {
      const idx = connectionIndices[c];
      const w = weights[idx];
      const absW = Math.min(Math.abs(w) * 3, 1);

      if (w >= 0) {
        arr[c * 6] = arr[c * 6 + 3] = 1.0 * absW;
        arr[c * 6 + 1] = arr[c * 6 + 4] = 0.6 * absW;
        arr[c * 6 + 2] = arr[c * 6 + 5] = 0.1 * absW;
      } else {
        arr[c * 6] = arr[c * 6 + 3] = 0.2 * absW;
        arr[c * 6 + 1] = arr[c * 6 + 4] = 0.5 * absW;
        arr[c * 6 + 2] = arr[c * 6 + 5] = 1.0 * absW;
      }
    }
    colorAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.12} />
    </lineSegments>
  );
}

/* ── 3D: Signal particles ──────────────────────────────────── */

function SignalParticles({
  fromIdx,
  toIdx,
  arch,
  phase,
  signalPhase,
}: {
  fromIdx: number;
  toIdx: number;
  arch: number[];
  phase: number;
  signalPhase: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const progressRef = useRef(0);
  const prevPhaseRef = useRef(-1);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(0.3, 0.8, 1.0), []);

  const { sources, targets } = useMemo(() => {
    const rng = mulberry32(fromIdx * 1000 + toIdx);
    const fromPos = getLayerLayout(fromIdx, arch);
    const toPos = getLayerLayout(toIdx, arch);
    const srcArr = new Float32Array(PARTICLE_COUNT * 3);
    const tgtArr = new Float32Array(PARTICLE_COUNT * 3);
    for (let p = 0; p < PARTICLE_COUNT; p++) {
      const si = Math.floor(rng() * arch[fromIdx]);
      const ti = Math.floor(rng() * arch[toIdx]);
      srcArr[p * 3] = fromPos[si * 3];
      srcArr[p * 3 + 1] = fromPos[si * 3 + 1];
      srcArr[p * 3 + 2] = fromPos[si * 3 + 2];
      tgtArr[p * 3] = toPos[ti * 3];
      tgtArr[p * 3 + 1] = toPos[ti * 3 + 1];
      tgtArr[p * 3 + 2] = toPos[ti * 3 + 2];
    }
    return { sources: srcArr, targets: tgtArr };
  }, [fromIdx, toIdx, arch]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (phase !== prevPhaseRef.current) {
      if (phase === signalPhase) progressRef.current = 0;
      prevPhaseRef.current = phase;
    }

    const active = phase === signalPhase && progressRef.current < 1;
    if (active) {
      progressRef.current = Math.min(
        1,
        progressRef.current + delta / (PHASE_DURATION / 1000)
      );
    }

    const t = progressRef.current;
    for (let p = 0; p < PARTICLE_COUNT; p++) {
      if (active) {
        const pOffset = p / PARTICLE_COUNT;
        const raw = Math.max(0, Math.min(1, (t - pOffset * 0.3) / 0.7));
        // Ease-out cubic
        const pt = 1 - Math.pow(1 - raw, 3);
        dummy.position.set(
          sources[p * 3] + (targets[p * 3] - sources[p * 3]) * pt,
          sources[p * 3 + 1] +
            (targets[p * 3 + 1] - sources[p * 3 + 1]) * pt,
          sources[p * 3 + 2] +
            (targets[p * 3 + 2] - sources[p * 3 + 2]) * pt
        );
        const s = 0.04 * Math.sin(raw * Math.PI);
        dummy.scale.setScalar(Math.max(0.001, s));
      } else {
        dummy.scale.setScalar(0.001);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(p, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    for (let p = 0; p < PARTICLE_COUNT; p++) {
      mesh.setColorAt(p, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        toneMapped={false}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/* ── 3D: Layer labels ──────────────────────────────────────── */

function LayerLabels({ arch }: { arch: number[] }) {
  return (
    <>
      {arch.map((size, i) => {
        const z = i * 5;
        const label =
          i === 0
            ? "Input 28x28"
            : i === arch.length - 1
              ? `Output ${size}`
              : `Hidden ${size}`;
        const yOffset = i === 0 ? 2.2 : size > 100 ? 1.5 : 0.8;
        return (
          <Html
            key={`${i}-${size}`}
            position={[0, yOffset, z]}
            center
            style={{ pointerEvents: "none" }}
          >
            <div className="text-xs text-slate-400 font-mono whitespace-nowrap px-2 py-0.5 rounded bg-black/50">
              {label}
            </div>
          </Html>
        );
      })}
    </>
  );
}

/* ── 3D: Full scene ────────────────────────────────────────── */

function NetworkScene({
  activations,
  phase,
  arch,
  network,
  showConnections,
}: {
  activations: Float32Array[] | null;
  phase: number;
  arch: number[];
  network: Layer[];
  showConnections: boolean;
}) {
  const normActs = useMemo(() => {
    if (!activations) return null;
    return activations.map((a) => normalize(a));
  }, [activations]);

  const centerZ = ((arch.length - 1) * 5) / 2;
  const fogFar = Math.max(30, arch.length * 8);

  return (
    <>
      <color attach="background" args={["#030508"]} />
      <fog attach="fog" args={["#030508", 15, fogFar]} />

      {arch.map((_, i) => (
        <NeuronLayer
          key={`layer-${i}-${arch[i]}`}
          layerIdx={i}
          arch={arch}
          activations={normActs ? normActs[i] : null}
          phase={phase}
        />
      ))}

      {showConnections &&
        network.map((layer, i) => (
          <ConnectionLines
            key={`conn-${i}-${arch[i]}-${arch[i + 1]}`}
            fromIdx={i}
            toIdx={i + 1}
            arch={arch}
            weights={layer.weights}
          />
        ))}

      {arch.slice(0, -1).map((_, i) => (
        <SignalParticles
          key={`signal-${i}-${arch[i]}-${arch[i + 1]}`}
          fromIdx={i}
          toIdx={i + 1}
          arch={arch}
          phase={phase}
          signalPhase={i * 2 + 1}
        />
      ))}

      <LayerLabels arch={arch} />

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={4}
        maxDistance={40}
        target={[0, 0, centerZ]}
      />
    </>
  );
}

/* ── Drawing canvas ────────────────────────────────────────── */

function DrawingCanvas({
  onDraw,
}: {
  onDraw: (pixels: Float32Array) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 280,
      y: ((clientY - rect.top) / rect.height) * 280,
    };
  };

  const draw = (pos: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPos.current = pos;
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    draw(getPos(e));
  };

  const endDraw = () => {
    isDrawing.current = false;
    lastPos.current = null;
    extractPixels();
  };

  const extractPixels = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tmp = document.createElement("canvas");
    tmp.width = 28;
    tmp.height = 28;
    const tCtx = tmp.getContext("2d")!;
    tCtx.drawImage(canvas, 0, 0, 28, 28);
    const data = tCtx.getImageData(0, 0, 28, 28).data;
    const pixels = new Float32Array(784);
    for (let i = 0; i < 784; i++) {
      pixels[i] = data[i * 4] / 255;
    }
    onDraw(pixels);
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 280, 280);
    lastPos.current = null;
  };

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
        Draw a digit
      </p>
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        className="w-full aspect-square rounded-xl border border-white/10 cursor-crosshair touch-none"
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
      />
      <button
        onClick={clear}
        className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        Clear
      </button>
    </div>
  );
}

/* ── Prediction bar chart ──────────────────────────────────── */

function PredictionBars({
  probabilities,
  visible,
}: {
  probabilities: Float32Array | null;
  visible: boolean;
}) {
  if (!probabilities || !visible) return null;

  let prediction = 0;
  let maxProb = 0;
  for (let i = 0; i < probabilities.length; i++) {
    if (probabilities[i] > maxProb) {
      maxProb = probabilities[i];
      prediction = i;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1.5"
    >
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">
        Prediction
      </p>
      {DIGIT_LABELS.map((label, i) => {
        const prob = probabilities[i];
        const isPred = i === prediction;
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`w-4 text-right text-xs tabular-nums ${
                isPred ? "text-white font-bold" : "text-slate-600"
              }`}
            >
              {label}
            </span>
            <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isPred
                    ? "bg-linear-to-r from-cyan-400 to-blue-400"
                    : "bg-white/15"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${prob * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
              />
            </div>
            <span
              className={`w-14 text-right text-xs tabular-nums ${
                isPred ? "text-cyan-400" : "text-slate-600"
              }`}
            >
              {(prob * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ── Loss chart (Canvas 2D) ────────────────────────────────── */

function LossChart({
  lossHistory,
  accuracyHistory,
}: {
  lossHistory: number[];
  accuracyHistory: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (h * i) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (lossHistory.length < 2) {
      ctx.font = "11px monospace";
      ctx.fillStyle = "#475569";
      ctx.textAlign = "center";
      ctx.fillText("Training metrics will appear here", w / 2, h / 2);
      return;
    }

    const maxLoss = Math.max(...lossHistory, 0.1);
    const n = lossHistory.length;

    // Loss curve (orange)
    ctx.beginPath();
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w;
      const y = h - (lossHistory[i] / maxLoss) * h * 0.85 - h * 0.05;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Accuracy curve (cyan)
    ctx.beginPath();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    for (let i = 0; i < accuracyHistory.length; i++) {
      const x = (i / (n - 1)) * w;
      const y = h - accuracyHistory[i] * h * 0.85 - h * 0.05;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Labels
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#f97316";
    ctx.fillText(
      `Loss: ${lossHistory[n - 1]?.toFixed(3)}`,
      6,
      14
    );
    ctx.fillStyle = "#22d3ee";
    ctx.fillText(
      `Acc: ${((accuracyHistory[accuracyHistory.length - 1] || 0) * 100).toFixed(1)}%`,
      6,
      28
    );
  }, [lossHistory, accuracyHistory]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={140}
      className="w-full rounded-lg border border-white/10"
    />
  );
}

/* ── Main component ────────────────────────────────────────── */

export function NeuralForwardPass() {
  // Mode
  const [mode, setMode] = useState<DemoMode>("explore");

  // Architecture (configurable)
  const [hiddenLayers, setHiddenLayers] = useState<number[]>([128, 64]);
  const [activation, setActivation] = useState<ActivationFn>("relu");
  const arch = useMemo(() => [784, ...hiddenLayers, 10], [hiddenLayers]);

  // Network
  const [, setNetworkVersion] = useState(0);
  const networkRef = useRef<Layer[]>(createNetwork(42, [784, 128, 64, 10]));

  // Visualization state
  const [activations, setActivations] = useState<Float32Array[] | null>(null);
  const [phase, setPhase] = useState(-1);
  const [showConnections, setShowConnections] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Training state
  const [training, setTraining] = useState<TrainingState>({
    epoch: 0,
    loss: 0,
    accuracy: 0,
    lossHistory: [],
    accuracyHistory: [],
    isTraining: false,
  });

  // Training config
  const [learningRate, setLearningRate] = useState(0.03);
  const [batchSize, setBatchSize] = useState(16);

  // Web Worker for training (off main thread)
  const workerRef = useRef<Worker | null>(null);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("./neural-training.worker.ts", import.meta.url)
      );
      workerRef.current.onmessage = (e: MessageEvent) => {
        const { type, payload } = e.data;
        switch (type) {
          case "epoch-complete": {
            const { epoch, loss, accuracy, activations: acts, weights, archLength } = payload;
            // Update local network weights for visualization
            for (let i = 0; i < weights.length; i++) {
              if (networkRef.current[i]) {
                networkRef.current[i].weights = weights[i].weights;
              }
            }
            setNetworkVersion((v) => v + 1);
            setActivations(acts);
            setPhase((archLength - 1) * 2);
            setTraining((prev) => ({
              ...prev,
              epoch,
              loss,
              accuracy,
              lossHistory: [...prev.lossHistory, loss],
              accuracyHistory: [...prev.accuracyHistory, accuracy],
              isTraining: true,
            }));
            break;
          }
          case "step-result": {
            const { loss, accuracy, activations: acts, weights } = payload;
            for (let i = 0; i < weights.length; i++) {
              if (networkRef.current[i]) {
                networkRef.current[i].weights = weights[i].weights;
              }
            }
            setNetworkVersion((v) => v + 1);
            setActivations(acts);
            setPhase((arch.length - 1) * 2);
            setTraining((prev) => ({
              ...prev,
              loss,
              accuracy,
            }));
            break;
          }
          case "forward-result": {
            // Used if we ever move explore forward pass to worker
            break;
          }
          case "training-stopped": {
            setTraining((s) => ({ ...s, isTraining: false }));
            break;
          }
        }
      };
    }
    return workerRef.current;
  }, [arch]);

  // Reset network when architecture or activation changes
  const resetNetwork = useCallback(() => {
    // Stop worker training
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    networkRef.current = createNetwork(Date.now(), arch);
    setNetworkVersion((v) => v + 1);
    setActivations(null);
    setPhase(-1);
    setTraining({
      epoch: 0,
      loss: 0,
      accuracy: 0,
      lossHistory: [],
      accuracyHistory: [],
      isTraining: false,
    });
  }, [arch]);

  // Re-create network on arch change
  const prevArchRef = useRef(arch.join(","));
  useEffect(() => {
    const key = arch.join(",");
    if (key !== prevArchRef.current) {
      prevArchRef.current = key;
      resetNetwork();
    }
  }, [arch, resetNetwork]);

  // Forward pass (explore mode — runs on main thread, single pass is fast)
  const runForwardPass = useCallback(
    (pixels: Float32Array) => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      const { activations: acts } = forwardPassFull(
        pixels,
        networkRef.current,
        activation
      );
      setActivations(acts);

      const totalPhases = arch.length * 2 - 1;
      for (let p = 0; p <= totalPhases; p++) {
        const t = setTimeout(() => setPhase(p), p * PHASE_DURATION);
        timersRef.current.push(t);
      }
    },
    [activation, arch]
  );

  const loadSample = useCallback(
    (digit: number) => {
      const pixels = parseDigit(DIGIT_7x7[digit]);
      runForwardPass(pixels);
    },
    [runForwardPass]
  );

  // Training (delegated to Web Worker — off main thread)
  const startTraining = useCallback(() => {
    const worker = getWorker();
    worker.postMessage({
      type: "init",
      payload: { seed: Date.now(), arch },
    });
    // Copy current weights to worker by re-initializing, then start
    worker.postMessage({
      type: "start-training",
      payload: {
        activation,
        learningRate,
        batchSize,
        arch,
        startEpoch: training.epoch,
      },
    });
    setTraining((s) => ({ ...s, isTraining: true }));
  }, [activation, learningRate, batchSize, arch, training.epoch, getWorker]);

  const stopTraining = useCallback(() => {
    workerRef.current?.postMessage({ type: "stop-training" });
    setTraining((s) => ({ ...s, isTraining: false }));
  }, []);

  const stepTraining = useCallback(() => {
    const worker = getWorker();
    // Ensure worker has a network initialized
    worker.postMessage({
      type: "init",
      payload: { seed: 42, arch },
    });
    worker.postMessage({
      type: "step",
      payload: { activation, learningRate, batchSize },
    });
  }, [activation, learningRate, batchSize, arch, getWorker]);

  // Cleanup
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const showPrediction = phase >= (arch.length - 1) * 2;
  const outputActs = activations ? activations[activations.length - 1] : null;
  const cameraZ = ((arch.length - 1) * 5) / 2;

  return (
    <div className="relative w-full flex flex-col">
      {/* 3D visualization */}
      <div
        className="relative bg-[#030508] rounded-2xl overflow-hidden border border-white/8"
        style={{ height: "55vh", minHeight: "400px" }}
      >
        <Canvas
          key={`canvas-${arch.join("-")}`}
          camera={{ position: [8, 3, cameraZ], fov: 50 }}
        >
          <NetworkScene
            activations={activations}
            phase={phase}
            arch={arch}
            network={networkRef.current}
            showConnections={showConnections}
          />
        </Canvas>

        {/* Training stats overlay */}
        {training.isTraining && (
          <div className="absolute top-4 left-4 flex gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
              <span className="text-xs font-mono text-cyan-400">
                Epoch {training.epoch}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
              <span className="text-xs font-mono text-orange-400">
                Loss {training.loss.toFixed(3)}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
              <span
                className={`text-xs font-mono ${training.accuracy > 0.8 ? "text-green-400" : "text-slate-400"}`}
              >
                Acc {(training.accuracy * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Architecture label */}
        <div className="absolute bottom-4 left-4 text-xs text-white/30 font-mono">
          {arch.join(" → ")} · {activation}
        </div>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-5 bg-white/3 border border-white/10 rounded-2xl"
      >
        {/* Mode selector */}
        <div className="flex gap-2 mb-5">
          {(["explore", "train", "architect"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                if (m !== "train" && training.isTraining) stopTraining();
                setMode(m);
              }}
              className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors capitalize font-medium ${
                mode === m
                  ? "bg-white text-black"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Explore mode */}
        {mode === "explore" && (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48 shrink-0">
              <DrawingCanvas onDraw={runForwardPass} />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                Or try a sample
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {DIGIT_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => loadSample(i)}
                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Show connections toggle */}
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={showConnections}
                  onChange={(e) => setShowConnections(e.target.checked)}
                  className="accent-white"
                />
                <span className="text-xs text-slate-400">
                  Show weight connections
                </span>
              </label>
            </div>

            <div className="flex-1 min-w-50">
              <PredictionBars
                probabilities={outputActs}
                visible={showPrediction}
              />
            </div>
          </div>
        )}

        {/* Train mode */}
        {mode === "train" && (
          <div className="flex flex-col gap-4">
            {/* Training controls */}
            <div className="flex gap-3">
              <button
                onClick={training.isTraining ? stopTraining : startTraining}
                className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${
                  training.isTraining
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20"
                    : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/20"
                }`}
              >
                {training.isTraining ? "Stop" : "Train"}
              </button>
              <button
                onClick={stepTraining}
                disabled={training.isTraining}
                className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
              >
                Step
              </button>
              <button
                onClick={resetNetwork}
                className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                Reset
              </button>

              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={showConnections}
                  onChange={(e) => setShowConnections(e.target.checked)}
                  className="accent-white"
                />
                <span className="text-xs text-slate-400">Weights</span>
              </label>
            </div>

            {/* Hyperparameters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Learning Rate: {learningRate}
                </label>
                <input
                  type="range"
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                  className="w-full accent-white h-1"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Batch Size: {batchSize}
                </label>
                <input
                  type="range"
                  min={4}
                  max={64}
                  step={4}
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  className="w-full accent-white h-1"
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 text-xs text-slate-400 font-mono">
              <span>Epoch: {training.epoch}</span>
              <span>
                Loss: {training.loss > 0 ? training.loss.toFixed(4) : "---"}
              </span>
              <span>
                Acc:{" "}
                {training.accuracy > 0
                  ? (training.accuracy * 100).toFixed(1) + "%"
                  : "---"}
              </span>
              <span className="text-slate-600">
                500 samples · {activation}
              </span>
            </div>

            {/* Loss chart */}
            <LossChart
              lossHistory={training.lossHistory}
              accuracyHistory={training.accuracyHistory}
            />
          </div>
        )}

        {/* Architect mode */}
        {mode === "architect" && (
          <div className="flex flex-col gap-4">
            {/* Activation function */}
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
                Activation Function
              </label>
              <div className="flex gap-2">
                {(["relu", "sigmoid", "tanh"] as const).map((fn) => (
                  <button
                    key={fn}
                    onClick={() => setActivation(fn)}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors font-medium uppercase ${
                      activation === fn
                        ? "bg-white text-black"
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {fn}
                  </button>
                ))}
              </div>
            </div>

            {/* Hidden layers editor */}
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
                Hidden Layers ({hiddenLayers.length})
              </label>
              {hiddenLayers.map((size, i) => (
                <div key={i} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-slate-400 w-16 shrink-0">
                    Layer {i + 1}
                  </span>
                  <input
                    type="range"
                    min={8}
                    max={256}
                    step={8}
                    value={size}
                    onChange={(e) => {
                      const newLayers = [...hiddenLayers];
                      newLayers[i] = parseInt(e.target.value);
                      setHiddenLayers(newLayers);
                    }}
                    className="flex-1 accent-white h-1"
                  />
                  <span className="text-xs text-slate-400 w-10 text-right tabular-nums">
                    {size}
                  </span>
                  <button
                    onClick={() => {
                      setHiddenLayers(hiddenLayers.filter((_, j) => j !== i));
                    }}
                    className="w-7 h-7 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                  >
                    x
                  </button>
                </div>
              ))}
              {hiddenLayers.length < 3 && (
                <button
                  onClick={() =>
                    setHiddenLayers([...hiddenLayers, 64])
                  }
                  className="px-4 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  + Add Hidden Layer
                </button>
              )}
            </div>

            {/* Architecture summary */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>Architecture:</span>
              <span className="text-slate-300">{arch.join(" → ")}</span>
              <span className="text-slate-600">
                ({arch.reduce(
                  (sum, _, i) =>
                    i < arch.length - 1
                      ? sum + arch[i] * arch[i + 1] + arch[i + 1]
                      : sum,
                  0
                ).toLocaleString()}{" "}
                params)
              </span>
            </div>

            {/* Show connections toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showConnections}
                onChange={(e) => setShowConnections(e.target.checked)}
                className="accent-white"
              />
              <span className="text-xs text-slate-400">
                Show weight connections
              </span>
            </label>
          </div>
        )}
      </motion.div>
    </div>
  );
}
