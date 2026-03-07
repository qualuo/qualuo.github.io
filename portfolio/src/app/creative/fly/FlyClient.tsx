"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { WebGLErrorBoundary } from "@/components/ui/WebGLErrorBoundary";

type GameState = "menu" | "playing" | "paused";

interface AudioEngineHandle {
  init(): void;
  suspend(): void;
  resume(): void;
  playChime(golden?: boolean): void;
  updateAmbient(cycleTime: number, altitude: number): void;
  streak: number;
}

const FlyScene = dynamic(() => import("./FlyScene"), { ssr: false });

export default function FlyClient() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hudVisible, setHudVisible] = useState(false);
  const streakDecayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gameStateRef = useRef<GameState>("menu");
  const audioRef = useRef<AudioEngineHandle | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const beginGame = useCallback(() => {
    setScore(0);
    setDistance(0);
    audioRef.current?.init();
    gameStateRef.current = "playing";
    setGameState("playing");
    // HUD fades in after a beat
    setTimeout(() => setHudVisible(true), 1200);
  }, []);

  const togglePause = useCallback(() => {
    if (gameStateRef.current === "playing") {
      audioRef.current?.suspend();
      gameStateRef.current = "paused";
      setGameState("paused");
    } else if (gameStateRef.current === "paused") {
      audioRef.current?.resume();
      gameStateRef.current = "playing";
      setGameState("playing");
    }
  }, []);

  const quitToMenu = useCallback(() => {
    gameStateRef.current = "menu";
    setGameState("menu");
    setHudVisible(false);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (gameStateRef.current === "playing" || gameStateRef.current === "paused") {
          togglePause();
        }
      }
    }

    function onVisibilityChange() {
      if (document.hidden && gameStateRef.current === "playing") {
        gameStateRef.current = "paused";
        setGameState("paused");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [togglePause]);

  const callbacks = useRef({
    onScore: (points: number) => setScore(s => s + points),
    onStreak: (s: number) => {
      setStreak(s);
      if (streakDecayTimer.current) clearTimeout(streakDecayTimer.current);
      streakDecayTimer.current = setTimeout(() => setStreak(0), 2000);
    },
    onDistance: (d: number) => setDistance(d),
  }).current;

  return (
    <main
      id="main-content"
      className="relative w-screen h-screen overflow-hidden bg-black"
    >
      {/* Canvas */}
      <WebGLErrorBoundary
        fallback={
          <div className="flex items-center justify-center h-full text-white/40 text-sm px-8 text-center">
            <p>This experience requires WebGL.</p>
          </div>
        }
      >
        <div className="absolute inset-0">
          <FlyScene
            gameStateRef={gameStateRef}
            callbacks={callbacks}
            isMobile={isMobile}
            audioRef={audioRef}
          />
        </div>
      </WebGLErrorBoundary>

      {/* Back — minimal, barely there */}
      <nav className="fixed top-0 left-0 z-40 p-5 pointer-events-none">
        <Link
          href="/creative/"
          className="pointer-events-auto inline-flex items-center gap-1.5 text-white/20 hover:text-white/50 transition-colors duration-500 text-xs tracking-widest uppercase"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
      </nav>

      {/* HUD */}
      {(gameState === "playing" || gameState === "paused") && (
        <div
          className="fixed top-5 right-5 z-40 pointer-events-none text-right transition-opacity duration-1000"
          style={{ opacity: hudVisible ? 1 : 0 }}
        >
          <div className="text-white/50 text-sm font-light tabular-nums tracking-wide">
            {score}
          </div>
          <div className="text-white/20 text-xs tabular-nums mt-0.5">
            {distance}m
          </div>
          {streak >= 3 && (
            <div
              className="mt-1.5 text-xs font-light tabular-nums tracking-widest transition-all duration-200"
              style={{
                color: streak >= 10
                  ? "rgba(255, 220, 140, 0.9)"
                  : streak >= 6
                    ? "rgba(255, 200, 100, 0.7)"
                    : "rgba(255, 255, 255, 0.4)",
                transform: `scale(${1 + Math.min(streak / 20, 0.3)})`,
                transformOrigin: "right center",
              }}
            >
              {1 + Math.floor(streak / 3)}x
            </div>
          )}
        </div>
      )}

      {/* Menu — integrated with the scene */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-extralight text-white/80 tracking-[0.15em] mb-4 select-none">
              Celestial Glider
            </h1>
            <p className="text-white/25 text-xs md:text-sm max-w-xs mx-auto mb-12 leading-relaxed font-light tracking-wide">
              Drift through the unknown.
            </p>
            <button
              onClick={beginGame}
              className="group px-10 py-3 rounded-full text-white/50 hover:text-white/80 transition-all duration-700 text-xs tracking-[0.2em] uppercase border border-white/8 hover:border-white/20 hover:bg-white/5"
            >
              Begin
            </button>
            <p className="mt-8 text-white/12 text-[10px] tracking-widest uppercase">
              Mouse to guide &middot; Esc to pause
            </p>
          </div>
        </div>
      )}

      {/* Pause — transparent, non-intrusive */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={togglePause}
              className="px-10 py-3 rounded-full text-white/50 hover:text-white/80 transition-all duration-700 text-xs tracking-[0.2em] uppercase border border-white/8 hover:border-white/20 hover:bg-white/5"
            >
              Continue
            </button>
            <button
              onClick={quitToMenu}
              className="px-10 py-3 rounded-full text-white/25 hover:text-white/50 transition-all duration-700 text-xs tracking-[0.2em] uppercase border border-white/4 hover:border-white/10"
            >
              Leave
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
