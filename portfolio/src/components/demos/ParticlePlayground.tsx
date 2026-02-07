"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Config {
  particleCount: number;
  gravity: number;
  friction: number;
  mouseForce: number;
  mouseRadius: number;
  particleSize: number;
  colorScheme: "rainbow" | "fire" | "ice" | "neon" | "monochrome";
  trailEffect: boolean;
  collisions: boolean;
  mouseMode: "attract" | "repel" | "vortex";
}

const COLOR_SCHEMES = {
  rainbow: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff", "#5f27cd"],
  fire: ["#ff9500", "#ff5e3a", "#ff2d55", "#ffcc00", "#ff9500"],
  ice: ["#5ac8fa", "#007aff", "#34aadc", "#5856d6", "#ffffff"],
  neon: ["#39ff14", "#ff073a", "#00fff7", "#f535aa", "#ffff00"],
  monochrome: ["#ffffff", "#e0e0e0", "#c0c0c0", "#a0a0a0", "#808080"],
};

const DEFAULT_CONFIG: Config = {
  particleCount: 200,
  gravity: 0,
  friction: 0.98,
  mouseForce: 0.8,
  mouseRadius: 150,
  particleSize: 3,
  colorScheme: "neon",
  trailEffect: true,
  collisions: false,
  mouseMode: "attract",
};

export function ParticlePlayground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const animationRef = useRef<number>(0);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [fps, setFps] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const lastTimeRef = useRef(0);
  const frameCountRef = useRef(0);

  const getRandomColor = useCallback(() => {
    const colors = COLOR_SCHEMES[config.colorScheme];
    return colors[Math.floor(Math.random() * colors.length)];
  }, [config.colorScheme]);

  const createParticle = useCallback(
    (x: number, y: number, vx = 0, vy = 0): Particle => {
      return {
        x,
        y,
        vx: vx || (Math.random() - 0.5) * 4,
        vy: vy || (Math.random() - 0.5) * 4,
        radius: config.particleSize + Math.random() * 2,
        color: getRandomColor(),
        alpha: 0.8 + Math.random() * 0.2,
        life: 1,
        maxLife: 1,
      };
    },
    [config.particleSize, getRandomColor]
  );

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    particlesRef.current = [];
    for (let i = 0; i < config.particleCount; i++) {
      particlesRef.current.push(
        createParticle(
          Math.random() * canvas.width,
          Math.random() * canvas.height
        )
      );
    }
  }, [config.particleCount, createParticle]);

  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const particles = particlesRef.current;
    const mouse = mouseRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Apply gravity
      p.vy += config.gravity * 0.1;

      // Mouse interaction
      if (mouse.active) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < config.mouseRadius && dist > 0) {
          const force = (config.mouseRadius - dist) / config.mouseRadius;
          const angle = Math.atan2(dy, dx);

          if (config.mouseMode === "attract") {
            p.vx += Math.cos(angle) * force * config.mouseForce;
            p.vy += Math.sin(angle) * force * config.mouseForce;
          } else if (config.mouseMode === "repel") {
            p.vx -= Math.cos(angle) * force * config.mouseForce * 1.5;
            p.vy -= Math.sin(angle) * force * config.mouseForce * 1.5;
          } else if (config.mouseMode === "vortex") {
            // Perpendicular force for vortex
            p.vx += Math.cos(angle + Math.PI / 2) * force * config.mouseForce;
            p.vy += Math.sin(angle + Math.PI / 2) * force * config.mouseForce;
            // Slight inward pull
            p.vx += Math.cos(angle) * force * config.mouseForce * 0.3;
            p.vy += Math.sin(angle) * force * config.mouseForce * 0.3;
          }
        }
      }

      // Apply friction
      p.vx *= config.friction;
      p.vy *= config.friction;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Boundary collision with bounce
      if (p.x < p.radius) {
        p.x = p.radius;
        p.vx *= -0.8;
      } else if (p.x > canvas.width - p.radius) {
        p.x = canvas.width - p.radius;
        p.vx *= -0.8;
      }

      if (p.y < p.radius) {
        p.y = p.radius;
        p.vy *= -0.8;
      } else if (p.y > canvas.height - p.radius) {
        p.y = canvas.height - p.radius;
        p.vy *= -0.8;
      }

      // Particle-particle collisions
      if (config.collisions) {
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = p.radius + p2.radius;

          if (dist < minDist && dist > 0) {
            // Elastic collision
            const angle = Math.atan2(dy, dx);
            const overlap = minDist - dist;

            // Separate particles
            const separateX = (Math.cos(angle) * overlap) / 2;
            const separateY = (Math.sin(angle) * overlap) / 2;
            p.x -= separateX;
            p.y -= separateY;
            p2.x += separateX;
            p2.y += separateY;

            // Exchange velocities
            const v1 = { x: p.vx, y: p.vy };
            const v2 = { x: p2.vx, y: p2.vy };
            p.vx = v2.x * 0.9;
            p.vy = v2.y * 0.9;
            p2.vx = v1.x * 0.9;
            p2.vy = v1.y * 0.9;
          }
        }
      }
    }
  }, [config]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Trail effect or clear
    if (config.trailEffect) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw particles - single fill pass (shadowBlur removed for performance)
    for (const p of particlesRef.current) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Draw mouse influence area
    const mouse = mouseRef.current;
    if (mouse.active) {
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, config.mouseRadius, 0, Math.PI * 2);
      ctx.strokeStyle =
        config.mouseMode === "attract"
          ? "rgba(100, 255, 100, 0.2)"
          : config.mouseMode === "repel"
            ? "rgba(255, 100, 100, 0.2)"
            : "rgba(100, 100, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [config.trailEffect, config.mouseRadius, config.mouseMode]);

  // Initialize and resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        initParticles();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [initParticles]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (!isPaused) {
        updateParticles();
        render();

        // FPS counter
        frameCountRef.current++;
        const now = performance.now();
        if (now - lastTimeRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastTimeRef.current = now;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPaused, updateParticles, render]);

  // Reinitialize when particle count changes
  useEffect(() => {
    initParticles();
  }, [config.particleCount, initParticles]);

  // Mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

  const handleMouseEnter = () => {
    mouseRef.current.active = true;
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  // Touch events
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouseRef.current.x = touch.clientX - rect.left;
    mouseRef.current.y = touch.clientY - rect.top;
    mouseRef.current.active = true;
  };

  const handleTouchEnd = () => {
    mouseRef.current.active = false;
  };

  const handleReset = () => {
    initParticles();
  };

  const handleExplode = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      p.vx = (dx / dist) * 15;
      p.vy = (dy / dist) * 15;
    }
  }, []);

  const handleImplode = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = centerX - p.x;
      const dy = centerY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      p.vx = (dx / dist) * 10;
      p.vy = (dy / dist) * 10;
    }
  }, []);

  return (
    <div className="relative w-full flex flex-col">
      {/* Canvas */}
      <div className="relative bg-black rounded-2xl overflow-hidden" style={{ height: "60vh", minHeight: "400px" }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* FPS Counter */}
        <div className="absolute top-4 left-4 text-xs text-white/50 font-mono">
          {fps} FPS · {config.particleCount} particles
        </div>

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white text-2xl font-bold">PAUSED</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-6 bg-white/[0.03] border border-white/10 rounded-2xl"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Mouse Mode */}
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
              Mouse Mode
            </label>
            <div className="flex gap-2">
              {(["attract", "repel", "vortex"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setConfig((c) => ({ ...c, mouseMode: mode }))}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                    config.mouseMode === mode
                      ? "bg-white text-black"
                      : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
              Colors
            </label>
            <div className="flex gap-2">
              {(Object.keys(COLOR_SCHEMES) as Array<keyof typeof COLOR_SCHEMES>).map((scheme) => (
                <button
                  key={scheme}
                  onClick={() => {
                    setConfig((c) => ({ ...c, colorScheme: scheme }));
                    particlesRef.current.forEach((p) => {
                      p.color = COLOR_SCHEMES[scheme][Math.floor(Math.random() * COLOR_SCHEMES[scheme].length)];
                    });
                  }}
                  className={`flex-1 px-2 py-2 text-xs rounded-lg transition-colors capitalize ${
                    config.colorScheme === scheme
                      ? "bg-white text-black"
                      : "bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {scheme.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>

          {/* Particle Count */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
              Particles: {config.particleCount}
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={config.particleCount}
              onChange={(e) =>
                setConfig((c) => ({ ...c, particleCount: Number(e.target.value) }))
              }
              className="w-full accent-white"
            />
          </div>

          {/* Gravity */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
              Gravity: {config.gravity.toFixed(1)}
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={config.gravity}
              onChange={(e) =>
                setConfig((c) => ({ ...c, gravity: Number(e.target.value) }))
              }
              className="w-full accent-white"
            />
          </div>

          {/* Mouse Force */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
              Force: {config.mouseForce.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={config.mouseForce}
              onChange={(e) =>
                setConfig((c) => ({ ...c, mouseForce: Number(e.target.value) }))
              }
              className="w-full accent-white"
            />
          </div>

          {/* Mouse Radius */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
              Radius: {config.mouseRadius}
            </label>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={config.mouseRadius}
              onChange={(e) =>
                setConfig((c) => ({ ...c, mouseRadius: Number(e.target.value) }))
              }
              className="w-full accent-white"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.trailEffect}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, trailEffect: e.target.checked }))
                }
                className="accent-white"
              />
              <span className="text-xs text-slate-400">Trails</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.collisions}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, collisions: e.target.checked }))
                }
                className="accent-white"
              />
              <span className="text-xs text-slate-400">Collide</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 md:col-span-4 lg:col-span-6 flex gap-3 mt-2">
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="px-4 py-2 text-sm rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
            >
              {isPaused ? "▶ Play" : "⏸ Pause"}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
            >
              ↻ Reset
            </button>
            <button
              onClick={handleExplode}
              className="px-4 py-2 text-sm rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
            >
              💥 Explode
            </button>
            <button
              onClick={handleImplode}
              className="px-4 py-2 text-sm rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              🌀 Implode
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
