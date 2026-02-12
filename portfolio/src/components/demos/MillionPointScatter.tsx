"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

/* ── Constants ─────────────────────────────────────────────── */

const WEBGPU_POINT_COUNT = 1_000_000;
const WEBGL_POINT_COUNT = 100_000;

/* ── Seeded PRNG ───────────────────────────────────────────── */

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Star catalog generation ───────────────────────────────── */

// Generate synthetic star catalog: [ra, dec, magnitude, colorIndex]
// Uses realistic distributions matching Hipparcos/Tycho-2 patterns
function generateStarCatalog(count: number, seed = 42): Float32Array {
  const rng = mulberry32(seed);
  const data = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    // Right ascension: 0 to 360 (uniform)
    const ra = rng() * 360;

    // Declination: -90 to 90 (cosine-weighted for uniform sphere)
    const dec = (Math.asin(2 * rng() - 1) * 180) / Math.PI;

    // Magnitude: power-law distribution (more faint stars)
    // Most stars are magnitude 6-12, few are bright (mag 0-3)
    const u = rng();
    const mag = -1 + 14 * Math.pow(u, 0.3);

    // B-V color index: -0.3 (blue/hot) to 2.0 (red/cool)
    // Bimodal: main sequence peak around 0.6, red giant peak around 1.4
    const colorIndex =
      rng() < 0.7
        ? 0.3 + rng() * 0.8 + (rng() - 0.5) * 0.3
        : 1.0 + rng() * 1.0;

    const off = i * 4;
    data[off] = ra;
    data[off + 1] = dec;
    data[off + 2] = mag;
    data[off + 3] = colorIndex;
  }

  return data;
}

// Convert B-V color index to RGB (approximation of Planck blackbody)
function bvToRgb(bv: number): [number, number, number] {
  let r: number, g: number, b: number;
  const t = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));

  // Temperature to RGB (simplified Planck)
  if (t >= 6600) {
    r = 1;
    g = Math.max(0, Math.min(1, 0.39 * Math.log(t / 100 - 55) - 0.63));
    b = 1;
  } else {
    r = Math.max(0, Math.min(1, 0.33 * Math.log(t / 100) - 0.18));
    g = Math.max(0, Math.min(1, 0.39 * Math.log(t / 100) - 0.63));
    b = t >= 1900 ? Math.max(0, Math.min(1, 0.54 * Math.log(t / 100 - 10) - 1.19)) : 0;
  }

  return [r, g, b];
}

// Spherical to Cartesian
function raDec2Xyz(
  ra: number,
  dec: number,
  radius: number
): [number, number, number] {
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  return [
    radius * Math.cos(decRad) * Math.cos(raRad),
    radius * Math.sin(decRad),
    radius * Math.cos(decRad) * Math.sin(raRad),
  ];
}

/* ── WebGPU check ──────────────────────────────────────────── */

async function checkWebGPU(): Promise<GPUDevice | null> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return null;
  try {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return null;
    return adapter.requestDevice();
  } catch {
    return null;
  }
}

/* ── WGSL Shaders ──────────────────────────────────────────── */

const COMPUTE_SHADER = /* wgsl */ `
struct Params {
  count: u32,
  minMag: f32,
  maxMag: f32,
  time: f32,
  rotY: f32,
  pointScale: f32,
};

@group(0) @binding(0) var<storage, read> stars: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> positions: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> colors: array<vec4<f32>>;
@group(0) @binding(3) var<uniform> params: Params;

fn bvToColor(bv: f32) -> vec3<f32> {
  let t = 4600.0 * (1.0 / (0.92 * bv + 1.7) + 1.0 / (0.92 * bv + 0.62));
  var r: f32; var g: f32; var b: f32;
  if (t >= 6600.0) {
    r = 1.0;
    g = clamp(0.39 * log(t / 100.0 - 55.0) - 0.63, 0.0, 1.0);
    b = 1.0;
  } else {
    r = clamp(0.33 * log(t / 100.0) - 0.18, 0.0, 1.0);
    g = clamp(0.39 * log(t / 100.0) - 0.63, 0.0, 1.0);
    if (t >= 1900.0) {
      b = clamp(0.54 * log(t / 100.0 - 10.0) - 1.19, 0.0, 1.0);
    } else {
      b = 0.0;
    }
  }
  return vec3<f32>(r, g, b);
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx = gid.x;
  if (idx >= params.count) { return; }

  let star = stars[idx];
  let ra = star.x;
  let dec = star.y;
  let mag = star.z;
  let bv = star.w;

  // Magnitude filter
  if (mag < params.minMag || mag > params.maxMag) {
    positions[idx] = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    colors[idx] = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return;
  }

  // Spherical to Cartesian
  let raRad = ra * 3.14159265 / 180.0;
  let decRad = dec * 3.14159265 / 180.0;
  let radius = 50.0;
  var x = radius * cos(decRad) * cos(raRad);
  let y = radius * sin(decRad);
  var z = radius * cos(decRad) * sin(raRad);

  // Apply Y rotation
  let cosR = cos(params.rotY);
  let sinR = sin(params.rotY);
  let rx = x * cosR - z * sinR;
  let rz = x * sinR + z * cosR;
  x = rx;
  z = rz;

  // Brightness from magnitude (brighter = lower mag)
  let brightness = clamp((12.0 - mag) / 12.0, 0.1, 1.0);
  let size = params.pointScale * brightness;

  positions[idx] = vec4<f32>(x, y, z, size);
  colors[idx] = vec4<f32>(bvToColor(bv) * brightness, brightness);
}
`;

const RENDER_VERTEX = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) pointCoord: vec2<f32>,
};

struct Camera {
  viewProj: mat4x4<f32>,
};

@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> colors: array<vec4<f32>>;
@group(0) @binding(2) var<uniform> camera: Camera;

@vertex
fn main(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOutput {
  let pos = positions[iid];
  let col = colors[iid];

  // Billboard quad (2 triangles, 6 vertices)
  let size = pos.w * 0.02;
  let offsets = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0),
  );
  let offset = offsets[vid];

  var worldPos = vec4<f32>(pos.xyz, 1.0);
  var clipPos = camera.viewProj * worldPos;

  // Offset in clip space for billboard
  clipPos.x += offset.x * size;
  clipPos.y += offset.y * size;

  var out: VertexOutput;
  out.position = clipPos;
  out.color = col;
  out.pointCoord = offset * 0.5 + 0.5;
  return out;
}
`;

const RENDER_FRAGMENT = /* wgsl */ `
@fragment
fn main(@location(0) color: vec4<f32>, @location(1) pointCoord: vec2<f32>) -> @location(0) vec4<f32> {
  let dist = length(pointCoord - vec2<f32>(0.5, 0.5)) * 2.0;
  if (dist > 1.0) { discard; }
  let alpha = color.a * (1.0 - dist * dist);
  return vec4<f32>(color.rgb * alpha, alpha);
}
`;

/* ── WebGPU Renderer ───────────────────────────────────────── */

class WebGPUStarRenderer {
  device: GPUDevice;
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  computePipeline!: GPUComputePipeline;
  renderPipeline!: GPURenderPipeline;
  starBuffer!: GPUBuffer;
  posBuffer!: GPUBuffer;
  colBuffer!: GPUBuffer;
  paramsBuffer!: GPUBuffer;
  cameraBuffer!: GPUBuffer;
  computeBindGroup!: GPUBindGroup;
  renderBindGroup!: GPUBindGroup;
  count: number;
  format: GPUTextureFormat;

  rotY = 0;
  cameraPos = new Float32Array([0, 0, 100]);
  params = { minMag: -1, maxMag: 13, pointScale: 3 };

  constructor(device: GPUDevice, canvas: HTMLCanvasElement, count: number) {
    this.device = device;
    this.canvas = canvas;
    this.count = count;
    this.context = canvas.getContext("webgpu")!;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({ device, format: this.format, alphaMode: "premultiplied" });
  }

  async init(starData: Float32Array) {
    const d = this.device;
    const n = this.count;

    // Buffers
    this.starBuffer = d.createBuffer({ size: n * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    this.posBuffer = d.createBuffer({ size: n * 16, usage: GPUBufferUsage.STORAGE });
    this.colBuffer = d.createBuffer({ size: n * 16, usage: GPUBufferUsage.STORAGE });
    this.paramsBuffer = d.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.cameraBuffer = d.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    d.queue.writeBuffer(this.starBuffer, 0, starData.buffer as ArrayBuffer);

    // Compute pipeline
    const computeModule = d.createShaderModule({ code: COMPUTE_SHADER });
    this.computePipeline = d.createComputePipeline({
      layout: "auto",
      compute: { module: computeModule, entryPoint: "main" },
    });

    this.computeBindGroup = d.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.starBuffer } },
        { binding: 1, resource: { buffer: this.posBuffer } },
        { binding: 2, resource: { buffer: this.colBuffer } },
        { binding: 3, resource: { buffer: this.paramsBuffer } },
      ],
    });

    // Render pipeline
    const vertModule = d.createShaderModule({ code: RENDER_VERTEX });
    const fragModule = d.createShaderModule({ code: RENDER_FRAGMENT });

    this.renderPipeline = d.createRenderPipeline({
      layout: "auto",
      vertex: { module: vertModule, entryPoint: "main" },
      fragment: {
        module: fragModule,
        entryPoint: "main",
        targets: [{
          format: this.format,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one", operation: "add" },
          },
        }],
      },
      primitive: { topology: "triangle-list" },
    });

    this.renderBindGroup = d.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.posBuffer } },
        { binding: 1, resource: { buffer: this.colBuffer } },
        { binding: 2, resource: { buffer: this.cameraBuffer } },
      ],
    });
  }

  frame(time: number) {
    const d = this.device;
    this.rotY += 0.001;

    // Update params
    const paramsData = new ArrayBuffer(32);
    const pView = new DataView(paramsData);
    pView.setUint32(0, this.count, true);
    pView.setFloat32(4, this.params.minMag, true);
    pView.setFloat32(8, this.params.maxMag, true);
    pView.setFloat32(12, time, true);
    pView.setFloat32(16, this.rotY, true);
    pView.setFloat32(20, this.params.pointScale, true);
    d.queue.writeBuffer(this.paramsBuffer, 0, paramsData);

    // Update camera (simple perspective view-projection matrix)
    const w = this.canvas.width || 800;
    const h = this.canvas.height || 600;
    const viewProj = this.computeViewProjMatrix(w / h);
    d.queue.writeBuffer(this.cameraBuffer, 0, viewProj.buffer as ArrayBuffer);

    const encoder = d.createCommandEncoder();

    // Compute pass
    const computePass = encoder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(this.count / 256));
    computePass.end();

    // Render pass
    const textureView = this.context.getCurrentTexture().createView();
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.01, g: 0.01, b: 0.02, a: 1 },
        loadOp: "clear",
        storeOp: "store",
      }],
    });
    renderPass.setPipeline(this.renderPipeline);
    renderPass.setBindGroup(0, this.renderBindGroup);
    renderPass.draw(6, this.count); // 6 vertices per billboard, N instances
    renderPass.end();

    d.queue.submit([encoder.finish()]);
  }

  computeViewProjMatrix(aspect: number): Float32Array {
    // Perspective matrix for WebGPU clip space (depth [0, 1], Y-up)
    const fov = (50 * Math.PI) / 180;
    const near = 0.1;
    const far = 500;
    const f = 1 / Math.tan(fov / 2);

    const z = this.cameraPos[2];

    // WebGPU perspective (depth maps to [0,1] not [-1,1])
    const p = new Float32Array(16);
    p[0] = f / aspect;
    p[5] = f;
    p[10] = far / (near - far);
    p[11] = -1;
    p[14] = (near * far) / (near - far);

    // View translation (camera at [0, 0, z] looking at origin)
    const t = new Float32Array(16);
    t[0] = 1; t[5] = 1; t[10] = 1; t[15] = 1;
    t[14] = -z;

    // Multiply p * t (column-major)
    const result = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += p[i + k * 4] * t[k + j * 4];
        }
        result[i + j * 4] = sum;
      }
    }
    return result;
  }

  destroy() {
    this.starBuffer?.destroy();
    this.posBuffer?.destroy();
    this.colBuffer?.destroy();
    this.paramsBuffer?.destroy();
    this.cameraBuffer?.destroy();
  }
}

/* ── WebGL fallback: Points with BufferGeometry ────────────── */

function WebGLFallback({
  starData,
  minMag,
  maxMag,
  pointScale,
}: {
  starData: Float32Array;
  minMag: number;
  maxMag: number;
  pointScale: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = starData.length / 4;

  const { positions, colors, sizes } = (() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const ra = starData[i * 4];
      const dec = starData[i * 4 + 1];
      const mag = starData[i * 4 + 2];
      const bv = starData[i * 4 + 3];

      const [x, y, z] = raDec2Xyz(ra, dec, 50);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const brightness = Math.max(0.1, (12 - mag) / 12);
      const [r, g, b] = bvToRgb(bv);
      col[i * 3] = r * brightness;
      col[i * 3 + 1] = g * brightness;
      col[i * 3 + 2] = b * brightness;

      sz[i] = brightness * 2;
    }
    return { positions: pos, colors: col, sizes: sz };
  })();

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={pointScale * 0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function WebGLScene({
  starData,
  minMag,
  maxMag,
  pointScale,
}: {
  starData: Float32Array;
  minMag: number;
  maxMag: number;
  pointScale: number;
}) {
  return (
    <>
      <color attach="background" args={["#010108"]} />
      <WebGLFallback
        starData={starData}
        minMag={minMag}
        maxMag={maxMag}
        pointScale={pointScale}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={10}
        maxDistance={200}
      />
    </>
  );
}

/* ── FPS counter ───────────────────────────────────────────── */

function useFps() {
  const fpsRef = useRef(0);
  const framesRef = useRef(0);
  const lastRef = useRef(performance.now());
  const [fps, setFps] = useState(0);

  const tick = useCallback(() => {
    framesRef.current++;
    const now = performance.now();
    if (now - lastRef.current >= 1000) {
      fpsRef.current = framesRef.current;
      setFps(framesRef.current);
      framesRef.current = 0;
      lastRef.current = now;
    }
  }, []);

  return { fps, tick };
}

/* ── Main component ────────────────────────────────────────── */

export function MillionPointScatter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGPUStarRenderer | null>(null);
  const animRef = useRef(0);

  const [useWebGPU, setUseWebGPU] = useState<boolean | null>(null); // null = detecting
  const [ready, setReady] = useState(false);
  const [minMag, setMinMag] = useState(-1);
  const [maxMag, setMaxMag] = useState(13);
  const [pointScale, setPointScale] = useState(3);
  const { fps, tick: fpsTickFn } = useFps();

  const [starData] = useState(() => {
    // Start with WebGL count; will regenerate if WebGPU
    return generateStarCatalog(WEBGL_POINT_COUNT, 42);
  });
  const [gpuStarData, setGpuStarData] = useState<Float32Array | null>(null);

  // Detect WebGPU and initialize
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const device = await checkWebGPU();

      if (cancelled) return;

      if (device && canvasRef.current) {
        setUseWebGPU(true);
        const data = generateStarCatalog(WEBGPU_POINT_COUNT, 42);
        setGpuStarData(data);

        const renderer = new WebGPUStarRenderer(
          device,
          canvasRef.current,
          WEBGPU_POINT_COUNT
        );
        await renderer.init(data);
        rendererRef.current = renderer;
        setReady(true);

        // Animation loop
        const loop = (time: number) => {
          if (cancelled) return;
          fpsTickFn();
          renderer.params.minMag = minMag;
          renderer.params.maxMag = maxMag;
          renderer.params.pointScale = pointScale;
          renderer.frame(time / 1000);
          animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
      } else {
        setUseWebGPU(false);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animRef.current);
      rendererRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update WebGPU renderer params
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.params.minMag = minMag;
      rendererRef.current.params.maxMag = maxMag;
      rendererRef.current.params.pointScale = pointScale;
    }
  }, [minMag, maxMag, pointScale]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !useWebGPU) return;
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
    });
    observer.observe(canvas);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    return () => observer.disconnect();
  }, [useWebGPU]);

  const pointCount = useWebGPU ? WEBGPU_POINT_COUNT : WEBGL_POINT_COUNT;

  return (
    <div className="relative w-full flex flex-col">
      {/* Visualization */}
      <div
        className="relative bg-[#010108] rounded-2xl overflow-hidden border border-white/8"
        style={{ height: "55vh", minHeight: "400px" }}
      >
        {useWebGPU === null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Detecting WebGPU...</p>
            </div>
          </div>
        )}

        {useWebGPU === true && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
        )}

        {useWebGPU === false && ready && (
          <Canvas camera={{ position: [0, 0, 100], fov: 50 }}>
            <WebGLScene
              starData={starData}
              minMag={minMag}
              maxMag={maxMag}
              pointScale={pointScale}
            />
          </Canvas>
        )}

        {/* Stats overlay */}
        {ready && (
          <div className="absolute top-4 left-4 flex gap-4">
            <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
              <span
                className={`text-sm font-mono font-bold ${
                  fps >= 50 ? "text-green-400" : fps >= 30 ? "text-yellow-400" : "text-red-400"
                }`}
              >
                {fps} FPS
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
              <span className="text-sm font-mono text-white">
                {(pointCount / 1000000).toFixed(pointCount >= 1000000 ? 0 : 1)}M points
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
              <span className={`text-xs font-medium ${useWebGPU ? "text-cyan-400" : "text-amber-400"}`}>
                {useWebGPU ? "WebGPU" : "WebGL Fallback"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex flex-col md:flex-row gap-6 items-start"
      >
        <div className="flex flex-col gap-3 flex-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            Magnitude Filter
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-8">Min</span>
            <input
              type="range"
              min={-1}
              max={13}
              step={0.5}
              value={minMag}
              onChange={(e) => setMinMag(parseFloat(e.target.value))}
              className="flex-1 accent-white h-1"
            />
            <span className="text-xs text-slate-400 w-8 text-right">{minMag}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-8">Max</span>
            <input
              type="range"
              min={-1}
              max={13}
              step={0.5}
              value={maxMag}
              onChange={(e) => setMaxMag(parseFloat(e.target.value))}
              className="flex-1 accent-white h-1"
            />
            <span className="text-xs text-slate-400 w-8 text-right">{maxMag}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            Point Size
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.5}
              max={8}
              step={0.5}
              value={pointScale}
              onChange={(e) => setPointScale(parseFloat(e.target.value))}
              className="w-32 accent-white h-1"
            />
            <span className="text-xs text-slate-400">{pointScale}</span>
          </div>
        </div>

        {!useWebGPU && ready && (
          <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400">
              WebGPU unavailable. Showing {(WEBGL_POINT_COUNT / 1000).toFixed(0)}K points via WebGL.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
