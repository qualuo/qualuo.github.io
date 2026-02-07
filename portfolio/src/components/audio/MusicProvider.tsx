"use client";

import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

interface AudioContextType {
  isPlaying: boolean;
  volume: number;
  toggle: () => void;
  setVolume: (v: number) => void;
  isReady: boolean;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.15);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Create audio element
    const audio = new Audio("/music/ambient.mp3");
    audio.loop = true;
    audio.volume = 0.15;
    audio.preload = "none";

    audio.addEventListener("canplaythrough", () => {
      setIsReady(true);
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggle = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log("Audio play failed:", err);
      });
    }
  }, [isPlaying]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
  }, []);

  return (
    <AudioContext.Provider value={{ isPlaying, volume, toggle, setVolume, isReady }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within MusicProvider");
  }
  return context;
}
